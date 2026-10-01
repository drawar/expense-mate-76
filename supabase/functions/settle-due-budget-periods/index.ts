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
// Same secret already used by monthly-spending-summary.
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;

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

// Deliberately duplicated (Deno can't reach into src/) — mirror of
// PARENT_CATEGORIES' id → name in src/utils/constants/categories.ts.
const PARENT_NAMES: Record<string, string> = {
  essentials: "Essentials",
  lifestyle: "Lifestyle",
  home_living: "Home & Living",
  personal_care: "Personal Care",
  work_education: "Work & Education",
  financial_other: "Financial & Other",
};

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

// Single-user app — no stored timezone preference, so this is hardcoded
// rather than built generically. See plan notes for the trade-off.
const USER_TIMEZONE = "America/Vancouver";

function parseISODate(s: string): Date {
  // Bare "YYYY-MM-DD" period boundaries are already an unambiguous
  // calendar date — read the digits directly, no timezone conversion.
  // Full timestamps (transaction dates) must be interpreted in the
  // user's local timezone first: a transaction entered in the evening
  // local time can have a UTC date-string one day ahead of the true
  // local calendar day, so naively taking the date portion (the previous
  // behavior here) mis-bucketed it into the wrong day/period/month.
  let y: number, m: number, d: number;
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    [y, m, d] = s.split("-").map(Number);
  } else {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: USER_TIMEZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(new Date(s));
    y = Number(parts.find((p) => p.type === "year")!.value);
    m = Number(parts.find((p) => p.type === "month")!.value);
    d = Number(parts.find((p) => p.type === "day")!.value);
  }
  return new Date(Date.UTC(y, m - 1, d, 12));
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
  passThroughCategories?: readonly ParentCategoryId[];
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

  const passThrough = new Set(input.passThroughCategories ?? []);

  for (const parentId of PARENT_CATEGORY_IDS) {
    const behavior = input.endBehaviorByCategory[parentId] ?? "reset";
    const cadence = input.cadenceByCategory[parentId] ?? "per_period";
    cadence_snapshot[parentId] = cadence;
    end_behavior_snapshot[parentId] = behavior;

    if (passThrough.has(parentId)) {
      settled_spent[parentId] = 0;
      carry_out[parentId] = 0;
      closed_out[parentId] = 0;
      overspend[parentId] = 0;
      continue;
    }

    const base = Number(input.period.allocations[parentId] ?? 0) || 0;
    const carryIn = Number(input.carryInByCategory[parentId] ?? 0) || 0;
    const spent = Number(input.spentByCategory[parentId] ?? 0) || 0;
    const available = round2(base + carryIn);
    const remaining = round2(available - spent);

    settled_spent[parentId] = round2(spent);

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
      pass_through: [...(input.passThroughCategories ?? [])].sort(),
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
// Settlement email (Resend) — mirrors src/utils/budget/settlementSummary.ts
// and the dashboard's PeriodSettlementBody copy discipline. Duplicated here
// for the same reason as PARENT_NAMES/SUB_TO_PARENT above: edge functions
// don't import from src/.
// ============================================================================

function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

function sumSpendingSlots(map: Record<string, number>): number {
  let sum = 0;
  for (const [k, v] of Object.entries(map)) {
    if (k === SAVINGS_ID) continue;
    sum += Number(v) || 0;
  }
  return sum;
}

function topContributions(
  map: Record<string, number>,
  predicate: (v: number) => boolean,
  n = 3
): { parentId: string; amount: number }[] {
  return Object.entries(map)
    .filter(([k]) => k !== SAVINGS_ID)
    .map(([k, v]) => ({ parentId: k, amount: Number(v) || 0 }))
    .filter((c) => predicate(c.amount))
    .sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount))
    .slice(0, n);
}

interface SettlementEmailSummary {
  rolledContribs: { parentId: string; amount: number }[];
  rolledTotal: number;
  rolloverDeficit: number;
  overspendTotal: number;
  closedOutTotal: number;
}

function buildSettlementSummary(row: {
  carry_out: Record<string, number>;
  closed_out: Record<string, number>;
  overspend: Record<string, number>;
}): SettlementEmailSummary {
  const rolledContribs = topContributions(row.carry_out, (v) => v > 0);
  const rolledTotal = rolledContribs.reduce((s, c) => s + c.amount, 0);

  const rolloverDeficit = Object.entries(row.carry_out)
    .filter(([k]) => k !== SAVINGS_ID)
    .reduce((s, [, v]) => s + Math.min(0, Number(v) || 0), 0);
  const overspendTotal =
    Math.abs(rolloverDeficit) + sumSpendingSlots(row.overspend);
  const closedOutTotal = sumSpendingSlots(row.closed_out);

  return {
    rolledContribs,
    rolledTotal,
    rolloverDeficit,
    overspendTotal,
    closedOutTotal,
  };
}

function generateSettlementEmailHtml(
  periodStart: string,
  periodEnd: string,
  currency: string,
  summary: SettlementEmailSummary
): string {
  const rolledRows = summary.rolledContribs
    .map(
      (c) =>
        `<tr><td style="padding: 6px 12px; border-bottom: 1px solid #e9ecef;">${PARENT_NAMES[c.parentId] ?? c.parentId}</td><td style="padding: 6px 12px; border-bottom: 1px solid #e9ecef; text-align: right; color: #2d5a27;">+${formatCurrency(c.amount, currency)}</td></tr>`
    )
    .join("");

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Budget period settled</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; background-color: #f5f5f5;">
  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
    <tr>
      <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 32px 24px; text-align: center;">
        <h1 style="margin: 0; color: #ffffff; font-size: 22px; font-weight: 600;">Budget period settled</h1>
        <p style="margin: 8px 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">${periodStart} – ${periodEnd}</p>
      </td>
    </tr>
    ${
      summary.closedOutTotal > 0
        ? `<tr><td style="padding: 24px 24px 0;">
        <div style="background: #f8f9fa; border-radius: 8px; padding: 16px 20px;">
          <p style="margin: 0 0 4px; color: #6c757d; font-size: 13px;">Extra available to save</p>
          <p style="margin: 0; font-size: 22px; font-weight: 700; color: #2d5a27;">+${formatCurrency(summary.closedOutTotal, currency)}</p>
        </div>
      </td></tr>`
        : ""
    }
    ${
      summary.rolledTotal > 0
        ? `<tr><td style="padding: 20px 24px 0;">
        <h2 style="margin: 0 0 8px; font-size: 15px; color: #1a1a1a;">Rolled forward: +${formatCurrency(summary.rolledTotal, currency)}</h2>
        <table cellpadding="0" cellspacing="0" border="0" width="100%" style="font-size: 14px;">
          <tbody>${rolledRows}</tbody>
        </table>
      </td></tr>`
        : ""
    }
    ${
      summary.overspendTotal > 0
        ? `<tr><td style="padding: 20px 24px 0;">
        <div style="background: #fdf2f0; border-radius: 8px; padding: 16px 20px;">
          <p style="margin: 0 0 4px; color: #6c757d; font-size: 13px;">Over budget</p>
          <p style="margin: 0; font-size: 20px; font-weight: 700; color: #a94442;">−${formatCurrency(summary.overspendTotal, currency)}</p>
          <p style="margin: 6px 0 0; font-size: 12px; color: #6c757d;">${summary.rolloverDeficit < 0 ? "Rollover deficits carry into this period." : "Reset-category overspend closed with the cycle."}</p>
        </div>
      </td></tr>`
        : ""
    }
    <tr>
      <td style="background: #f8f9fa; padding: 20px 24px; text-align: center; margin-top: 24px;">
        <p style="margin: 0; font-size: 12px; color: #6c757d;">Sent by Clairo - Your expense tracking assistant</p>
      </td>
    </tr>
  </table>
</body>
</html>
`;
}

function generateSettlementEmailText(
  periodStart: string,
  periodEnd: string,
  currency: string,
  summary: SettlementEmailSummary
): string {
  let text = `Budget period settled: ${periodStart} - ${periodEnd}\n`;
  text += `${"=".repeat(50)}\n\n`;

  if (summary.closedOutTotal > 0) {
    text += `Extra available to save: +${formatCurrency(summary.closedOutTotal, currency)}\n\n`;
  }
  if (summary.rolledTotal > 0) {
    text += `Rolled forward: +${formatCurrency(summary.rolledTotal, currency)}\n`;
    summary.rolledContribs.forEach((c) => {
      text += `  ${PARENT_NAMES[c.parentId] ?? c.parentId}: +${formatCurrency(c.amount, currency)}\n`;
    });
    text += `\n`;
  }
  if (summary.overspendTotal > 0) {
    text += `Over budget: -${formatCurrency(summary.overspendTotal, currency)}\n\n`;
  }

  text += `---\nSent by Clairo - Your expense tracking assistant\n`;
  return text;
}

/**
 * Send the "period settled" email. Best-effort: logs and swallows errors
 * so an email failure never blocks or undoes a successful settlement.
 */
async function sendSettlementEmail(args: {
  userEmail: string;
  periodStart: string;
  periodEnd: string;
  currency: string;
  result: {
    carry_out: Record<string, number>;
    closed_out: Record<string, number>;
    overspend: Record<string, number>;
  };
}): Promise<{ sent: boolean; reason?: string }> {
  const { userEmail, periodStart, periodEnd, currency, result } = args;
  const summary = buildSettlementSummary(result);
  if (
    summary.rolledTotal === 0 &&
    summary.closedOutTotal === 0 &&
    summary.overspendTotal === 0
  ) {
    return { sent: false, reason: "nothing to report" };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Clairo <noreply@clairoapp.com>",
        to: userEmail,
        subject: `Budget period settled: ${periodStart}–${periodEnd}`,
        html: generateSettlementEmailHtml(
          periodStart,
          periodEnd,
          currency,
          summary
        ),
        text: generateSettlementEmailText(
          periodStart,
          periodEnd,
          currency,
          summary
        ),
      }),
    });
    if (!response.ok) {
      const errBody = await response.text();
      console.error(
        `[settle] settlement email failed for ${userEmail}: ${response.status} ${errBody}`
      );
      return { sent: false, reason: `Resend ${response.status}: ${errBody}` };
    }
    // Respect Resend's 2 req/s rate limit across a cron run settling many
    // periods/users.
    await new Promise((resolve) => setTimeout(resolve, 600));
    return { sent: true };
  } catch (err) {
    console.error(`[settle] settlement email threw for ${userEmail}:`, err);
    return { sent: false, reason: String(err) };
  }
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

  // Fetched once per user (not per period) — cheap since we only get here
  // when there's actually due work, and a user rarely has more than one
  // due period per run.
  const { data: userData } = await supabase.auth.admin.getUserById(userId);
  const userEmail: string | undefined = userData?.user?.email ?? undefined;

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
    const passThroughCategories: ParentCategoryId[] = [];
    for (const parentId of PARENT_CATEGORY_IDS) {
      const cad =
        settings.cadenceByCategory[parentId] ?? DEFAULT_CADENCE[parentId];
      if (cad === "monthly") {
        if (ownsMonth) {
          spentByCategory[parentId] = monthlySpent[parentId] ?? 0;
        } else {
          spentByCategory[parentId] = 0;
          passThroughCategories.push(parentId);
        }
      } else {
        spentByCategory[parentId] = perPeriodSpent[parentId] ?? 0;
      }
    }

    const result = settleBudgetPeriod({
      period: { id: period.id, allocations: period.allocations },
      carryInByCategory: carryIn,
      cadenceByCategory: settings.cadenceByCategory,
      endBehaviorByCategory: settings.endBehaviorByCategory,
      spentByCategory,
      passThroughCategories,
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
    if (!updated || updated.length === 0) {
      skipped++;
      continue;
    }
    settled++;

    // Only the caller whose write actually flipped closed_at (guarded
    // above) reaches here — never fires again for a later resettle of
    // this same period.
    if (userEmail) {
      await sendSettlementEmail({
        userEmail,
        periodStart: period.period_start,
        periodEnd: period.period_end,
        currency: period.currency,
        result,
      });
    }
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
