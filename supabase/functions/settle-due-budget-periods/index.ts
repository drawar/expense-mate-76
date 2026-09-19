/**
 * Nightly settlement Edge Function.
 *
 * Enumerates every distinct user_id with due budget_periods
 * (period_end < today AND closed_at IS NULL), then per user:
 *   1. Load budget_allocations (cadence + end_behavior).
 *   2. Load transactions in the widest window across their due periods
 *      (extended back to startOfMonth so monthly cats have full context).
 *   3. Per due period (oldest first — carry chain seeds correctly):
 *      - Load prior settled carry_out.
 *      - Detect ownsMonthClose (is this the last per_period of the month?).
 *      - Aggregate spend per parent, honoring cadence.
 *      - Run pure settlement.
 *      - Guarded UPDATE (WHERE fingerprint IS DISTINCT FROM $x).
 *
 * Runs at 00:15 UTC nightly via pg_cron (see migration). Auth: matches
 * the monthly-spending-summary pattern — cron sends
 * Authorization: Bearer <service_role_key> from Vault.
 *
 * Idempotent: repeat runs produce identical fingerprints → no writes.
 * Races vs the lazy client trigger resolve via the fingerprint guard.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// ============================================================================
// Constants — must match src/utils/budget/defaults.ts
// ============================================================================

const SAVINGS_ID = "savings";

const PARENT_CATEGORY_IDS = [
  "essentials",
  "lifestyle",
  "home_living",
  "personal_care",
  "work_education",
  "financial_other",
] as const;

type ParentCategoryId = (typeof PARENT_CATEGORY_IDS)[number];
type Cadence = "per_period" | "monthly";
type EndBehavior = "reset" | "rollover";

const DEFAULT_CADENCE: Record<ParentCategoryId, Cadence> = {
  essentials: "monthly",
  lifestyle: "per_period",
  home_living: "monthly",
  personal_care: "per_period",
  work_education: "per_period",
  financial_other: "per_period",
};

const DEFAULT_END_BEHAVIOR: Record<ParentCategoryId, EndBehavior> = {
  essentials: "reset",
  lifestyle: "reset",
  home_living: "reset",
  personal_care: "reset",
  work_education: "reset",
  financial_other: "reset",
};

// Subcategory → parent mapping — mirror of the primary categories.ts.
// Deliberately duplicated (Deno can't reach into src/); if you add a
// subcategory in categories.ts, add it here too.
const SUB_TO_PARENT: Record<string, ParentCategoryId> = {
  // Essentials
  Groceries: "essentials",
  Housing: "essentials",
  Utilities: "essentials",
  Transportation: "essentials",
  Healthcare: "essentials",
  // Lifestyle
  "Dining Out": "lifestyle",
  "Fast Food & Takeout": "lifestyle",
  "Food Delivery": "lifestyle",
  Entertainment: "lifestyle",
  "Hobbies & Recreation": "lifestyle",
  "Travel & Vacation": "lifestyle",
  // Home & Living
  "Home Improvement": "home_living",
  Furniture: "home_living",
  "Home Services": "home_living",
  // Personal Care
  "Clothing & Shoes": "personal_care",
  "Beauty & Personal Care": "personal_care",
  "Gym & Fitness": "personal_care",
  // Work & Education
  "Work Expenses": "work_education",
  Education: "work_education",
  Books: "work_education",
  // Financial & Other
  "Subscriptions & Memberships": "financial_other",
  "Financial Services": "financial_other",
  Insurance: "financial_other",
  "Gifts & Donations": "financial_other",
  "Cash & ATM": "financial_other",
  "Fees & Charges": "financial_other",
};

// ============================================================================
// Date helpers (avoiding date-fns to keep the function slim)
// ============================================================================

function isoDate(d: Date): string {
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function parseISODate(s: string): Date {
  // "YYYY-MM-DD" or full ISO — take the date portion, UTC-noon so
  // day-boundary comparisons don't slip a day in either direction.
  const [y, m, d] = s.slice(0, 10).split("-").map(Number);
  return new Date(Date.UTC(y, (m ?? 1) - 1, d ?? 1, 12));
}

function startOfMonth(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1, 12));
}

function endOfMonth(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0, 12));
}

function addDays(d: Date, days: number): Date {
  const r = new Date(d);
  r.setUTCDate(r.getUTCDate() + days);
  return r;
}

// ============================================================================
// Pure settlement math — mirror of src/utils/budget/settleBudgetPeriod.ts
// ============================================================================

interface SettlementInput {
  period: { id: string; allocations: Record<string, number> };
  carryInByCategory: Record<string, number>;
  cadenceByCategory: Record<ParentCategoryId, Cadence>;
  endBehaviorByCategory: Record<ParentCategoryId, EndBehavior>;
  spentByCategory: Record<string, number>;
}

interface SettlementResult {
  settled_spent: Record<string, number>;
  closed_out: Record<string, number>;
  carry_out: Record<string, number>;
  overspend: Record<string, number>;
  cadence_snapshot: Record<string, Cadence>;
  end_behavior_snapshot: Record<string, EndBehavior>;
  fingerprint: string;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  return `{${keys
    .map((k) => `${JSON.stringify(k)}:${stableStringify(obj[k])}`)
    .join(",")}}`;
}

function fnv1a64Hex(input: string): string {
  const FNV_PRIME = BigInt("0x100000001b3");
  const FNV_OFFSET = BigInt("0xcbf29ce484222325");
  const MASK = (BigInt(1) << BigInt(64)) - BigInt(1);
  let hash = FNV_OFFSET;
  for (let i = 0; i < input.length; i++) {
    hash ^= BigInt(input.charCodeAt(i));
    hash = (hash * FNV_PRIME) & MASK;
  }
  return hash.toString(16).padStart(16, "0");
}

function settleBudgetPeriod(input: SettlementInput): SettlementResult {
  const settled_spent: Record<string, number> = {};
  const closed_out: Record<string, number> = {};
  const carry_out: Record<string, number> = {};
  const overspend: Record<string, number> = {};
  const cadence_snapshot: Record<string, Cadence> = {};
  const end_behavior_snapshot: Record<string, EndBehavior> = {};

  for (const parentId of PARENT_CATEGORY_IDS) {
    const base = Number(input.period.allocations[parentId] ?? 0) || 0;
    const carryIn = Number(input.carryInByCategory[parentId] ?? 0) || 0;
    const spent = Number(input.spentByCategory[parentId] ?? 0) || 0;
    const available = round2(base + carryIn);
    const remaining = round2(available - spent);

    const behavior = input.endBehaviorByCategory[parentId] ?? "reset";
    const cadence = input.cadenceByCategory[parentId] ?? "per_period";

    settled_spent[parentId] = round2(spent);
    cadence_snapshot[parentId] = cadence;
    end_behavior_snapshot[parentId] = behavior;

    if (behavior === "rollover") {
      carry_out[parentId] = remaining;
      closed_out[parentId] = 0;
      overspend[parentId] = 0;
    } else {
      carry_out[parentId] = 0;
      closed_out[parentId] = remaining > 0 ? remaining : 0;
      overspend[parentId] = remaining < 0 ? round2(-remaining) : 0;
    }
  }

  settled_spent[SAVINGS_ID] = 0;
  carry_out[SAVINGS_ID] = 0;
  closed_out[SAVINGS_ID] = 0;
  overspend[SAVINGS_ID] = 0;

  const fingerprint = fnv1a64Hex(
    stableStringify({
      period_id: input.period.id,
      allocations: input.period.allocations,
      carry_in: input.carryInByCategory,
      spent: input.spentByCategory,
      cadence: input.cadenceByCategory,
      end_behavior: input.endBehaviorByCategory,
    })
  );

  return {
    settled_spent,
    closed_out,
    carry_out,
    overspend,
    cadence_snapshot,
    end_behavior_snapshot,
    fingerprint,
  };
}

// ============================================================================
// DB helpers
// ============================================================================

interface DuePeriodRow {
  id: string;
  income_id: string;
  currency: string;
  period_start: string;
  period_end: string;
  salary_amount: number;
  allocations: Record<string, number>;
}

interface TxRow {
  date: string;
  amount: number;
  currency: string;
  reimbursement_amount: number | null;
  user_category: string | null;
  category: string | null;
}

interface UserSettings {
  cadenceByCategory: Record<ParentCategoryId, Cadence>;
  endBehaviorByCategory: Record<ParentCategoryId, EndBehavior>;
}

// deno-lint-ignore no-explicit-any
async function loadUserSettings(
  supabase: any,
  userId: string
): Promise<UserSettings> {
  const { data, error } = await supabase
    .from("budget_allocations")
    .select("parent_category_id, cadence, end_behavior")
    .eq("user_id", userId);
  if (error) throw error;
  const cadenceByCategory = { ...DEFAULT_CADENCE };
  const endBehaviorByCategory = { ...DEFAULT_END_BEHAVIOR };
  for (const row of data ?? []) {
    if (
      !(PARENT_CATEGORY_IDS as readonly string[]).includes(
        row.parent_category_id
      )
    )
      continue;
    const cat = row.parent_category_id as ParentCategoryId;
    if (row.cadence === "monthly" || row.cadence === "per_period") {
      cadenceByCategory[cat] = row.cadence;
    }
    if (row.end_behavior === "reset" || row.end_behavior === "rollover") {
      endBehaviorByCategory[cat] = row.end_behavior;
    }
  }
  return { cadenceByCategory, endBehaviorByCategory };
}

// deno-lint-ignore no-explicit-any
async function loadPreviousSettledCarry(
  // deno-lint-ignore no-explicit-any
  supabase: any,
  userId: string,
  currency: string,
  beforeDate: string
): Promise<Record<string, number>> {
  const { data, error } = await supabase
    .from("budget_periods")
    .select("carry_out, end_behavior_snapshot")
    .eq("user_id", userId)
    .eq("currency", currency)
    .lt("period_end", beforeDate)
    .not("closed_at", "is", null)
    .order("period_end", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error || !data) return {};
  const carryOut = (data.carry_out ?? {}) as Record<string, unknown>;
  const snap = (data.end_behavior_snapshot ?? {}) as Record<string, unknown>;
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(carryOut)) {
    if (k === SAVINGS_ID) continue;
    if (snap[k] !== "rollover") continue;
    const n = Number(v);
    if (!Number.isFinite(n) || n === 0) continue;
    out[k] = n;
  }
  return out;
}

// deno-lint-ignore no-explicit-any
async function ownsMonthClose(
  supabase: any,
  userId: string,
  period: DuePeriodRow
): Promise<boolean> {
  const monthEnd = isoDate(endOfMonth(parseISODate(period.period_end)));
  const { data, error } = await supabase
    .from("budget_periods")
    .select("id")
    .eq("user_id", userId)
    .eq("currency", period.currency)
    .gt("period_start", period.period_end)
    .lte("period_start", monthEnd)
    .limit(1);
  if (error) throw error;
  return (data ?? []).length === 0;
}

function aggregateSpent(
  windowStartISO: string,
  windowEndISO: string,
  transactions: TxRow[]
): Record<ParentCategoryId, number> {
  const zero = Object.fromEntries(
    PARENT_CATEGORY_IDS.map((id) => [id, 0])
  ) as Record<ParentCategoryId, number>;

  const start = parseISODate(windowStartISO);
  const endExclusive = addDays(parseISODate(windowEndISO), 1);

  for (const tx of transactions) {
    const txDate = parseISODate(tx.date);
    if (txDate < start || txDate >= endExclusive) continue;

    const category = tx.user_category ?? tx.category ?? "";
    const parentId = SUB_TO_PARENT[category] ?? "financial_other";

    const gross = Number(tx.amount) || 0;
    const reimbursement = tx.reimbursement_amount
      ? Number(tx.reimbursement_amount) || 0
      : 0;
    const net = gross - reimbursement;
    // NOTE: Edge Function does NOT convert currencies — it aggregates
    // in the tx's native currency. Most users have display_currency
    // matching their tx currencies. Cross-currency will be off; the
    // lazy client trigger (which does convert) will re-settle when the
    // user opens the app and drift-correct via the fingerprint guard.
    if (tx.currency === (undefined as unknown as string)) continue;
    zero[parentId] = (zero[parentId] ?? 0) + net;
  }
  return zero;
}

// ============================================================================
// Per-user settlement pipeline
// ============================================================================

// deno-lint-ignore no-explicit-any
async function settleForUser(supabase: any, userId: string, todayISO: string) {
  const { data: dueRaw, error: dueErr } = await supabase
    .from("budget_periods")
    .select(
      "id, income_id, currency, period_start, period_end, salary_amount, allocations"
    )
    .eq("user_id", userId)
    .lt("period_end", todayISO)
    .is("closed_at", null)
    .order("period_end", { ascending: true });
  if (dueErr) throw dueErr;
  if (!dueRaw || dueRaw.length === 0) return { settled: 0, skipped: 0 };

  const settings = await loadUserSettings(supabase, userId);

  const earliestStart = dueRaw
    .map((r: { period_start: string }) => parseISODate(r.period_start))
    .reduce((a: Date, b: Date) => (a < b ? a : b));
  const fromISO = isoDate(startOfMonth(earliestStart));

  const { data: txsRaw } = await supabase
    .from("transactions")
    .select(
      "date, amount, currency, reimbursement_amount, user_category, category"
    )
    .eq("user_id", userId)
    .gte("date", fromISO);
  const transactions: TxRow[] = (txsRaw ?? []) as TxRow[];

  let settled = 0;
  let skipped = 0;

  for (const raw of dueRaw) {
    const period: DuePeriodRow = {
      id: raw.id,
      income_id: raw.income_id,
      currency: raw.currency,
      period_start: raw.period_start,
      period_end: raw.period_end,
      salary_amount: Number(raw.salary_amount),
      allocations: (raw.allocations ?? {}) as Record<string, number>,
    };

    const carryIn = await loadPreviousSettledCarry(
      supabase,
      userId,
      period.currency,
      period.period_start
    );
    const ownsMonth = await ownsMonthClose(supabase, userId, period);

    const perPeriodSpent = aggregateSpent(
      period.period_start,
      period.period_end,
      transactions
    );
    const monthlySpent = aggregateSpent(
      isoDate(startOfMonth(parseISODate(period.period_end))),
      isoDate(endOfMonth(parseISODate(period.period_end))),
      transactions
    );

    const spentByCategory: Record<string, number> = {};
    for (const parentId of PARENT_CATEGORY_IDS) {
      const cad =
        settings.cadenceByCategory[parentId] ?? DEFAULT_CADENCE[parentId];
      spentByCategory[parentId] =
        cad === "monthly"
          ? ownsMonth
            ? (monthlySpent[parentId] ?? 0)
            : 0
          : (perPeriodSpent[parentId] ?? 0);
    }

    const result = settleBudgetPeriod({
      period: { id: period.id, allocations: period.allocations },
      carryInByCategory: carryIn,
      cadenceByCategory: settings.cadenceByCategory,
      endBehaviorByCategory: settings.endBehaviorByCategory,
      spentByCategory,
    });

    const { data: updated, error: uErr } = await supabase
      .from("budget_periods")
      .update({
        closed_at: new Date().toISOString(),
        settled_spent: result.settled_spent,
        closed_out: result.closed_out,
        carry_out: result.carry_out,
        overspend: result.overspend,
        cadence_snapshot: result.cadence_snapshot,
        end_behavior_snapshot: result.end_behavior_snapshot,
        settlement_fingerprint: result.fingerprint,
      })
      .eq("id", period.id)
      .or(
        `settlement_fingerprint.is.null,settlement_fingerprint.neq.${result.fingerprint}`
      )
      .select("id");
    if (uErr) {
      console.error("[settle] update failed:", uErr.message);
      skipped++;
      continue;
    }
    if (!updated || updated.length === 0) skipped++;
    else settled++;
  }

  return { settled, skipped };
}

// ============================================================================
// Handler
// ============================================================================

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const todayISO = isoDate(new Date());

    // Find distinct user_ids with due periods.
    const { data: dueUsers, error: userErr } = await supabase
      .from("budget_periods")
      .select("user_id")
      .lt("period_end", todayISO)
      .is("closed_at", null);
    if (userErr) throw userErr;

    const uniqueUserIds = Array.from(
      new Set((dueUsers ?? []).map((r: { user_id: string }) => r.user_id))
    );

    let totalSettled = 0;
    let totalSkipped = 0;
    const failures: string[] = [];

    for (const userId of uniqueUserIds) {
      try {
        const { settled, skipped } = await settleForUser(
          supabase,
          userId,
          todayISO
        );
        totalSettled += settled;
        totalSkipped += skipped;
      } catch (err) {
        console.error(`[settle] user ${userId} failed:`, err);
        failures.push(userId);
      }
    }

    return new Response(
      JSON.stringify({
        ok: true,
        users_scanned: uniqueUserIds.length,
        settled: totalSettled,
        skipped: totalSkipped,
        failures,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("[settle-due-budget-periods] top-level failure:", err);
    return new Response(JSON.stringify({ ok: false, error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
