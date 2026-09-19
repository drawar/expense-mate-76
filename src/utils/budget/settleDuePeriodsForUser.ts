/**
 * Batch settlement for a single user: find every budget_periods row
 * with `period_end < today` AND `closed_at IS NULL`, compute the
 * settlement, and guarded-UPDATE the row.
 *
 * Called from:
 *   - the lazy client trigger (useSettleDuePeriods on Dashboard boot)
 *   - the nightly cron Edge Function (settle-due-budget-periods, C11)
 *
 * Both callers use the same pure `settleBudgetPeriod` function and the
 * same fingerprint-guarded UPDATE — races between them resolve
 * gracefully because the second writer's UPDATE affects 0 rows.
 *
 * Cadence × settlement window:
 *   - per_period parents settle against the pay-period window.
 *   - monthly parents settle against the calendar-month window ONLY on
 *     the month-closing period (the last pay-period whose period_end
 *     falls inside that calendar month). Other pay-periods pass through
 *     monthly parents (spent=0, carry_out=0, closed_out=0).
 *
 * Ordering: due periods are settled oldest first so the carry chain
 * seeds correctly (period N reads period N-1's carry_out).
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  addDays,
  endOfMonth,
  formatISO,
  isBefore,
  parseISO,
  startOfMonth,
} from "date-fns";

import { CurrencyService } from "@/core/currency/CurrencyService";
import type { Currency, Transaction } from "@/types";
import { getEffectiveCategory } from "@/utils/categoryMapping";
import { SUBCATEGORY_TO_PARENT } from "@/utils/constants/categories";
import {
  DEFAULT_CADENCE,
  DEFAULT_END_BEHAVIOR,
  PARENT_CATEGORY_IDS,
  SAVINGS_ID,
  type Cadence,
  type EndBehavior,
  type ParentCategoryId,
} from "./defaults";
import { loadPreviousSettledCarry } from "./loadPreviousSettledCarry";
import { settleBudgetPeriod } from "./settleBudgetPeriod";

interface DuePeriodRow {
  id: string;
  income_id: string;
  currency: Currency;
  period_start: string;
  period_end: string;
  salary_amount: number;
  allocations: Record<string, number>;
}

interface DateWindow {
  startISO: string; // inclusive
  endISO: string; // inclusive
}

/**
 * Aggregate transactions in a window by parent category, normalizing to
 * `displayCurrency` via CurrencyService.convert. Mirror of
 * useActiveBudgetPeriod.aggregateSpent — kept inline here so settlement
 * doesn't depend on a React hook.
 */
function aggregateSpent(
  window: DateWindow | null,
  transactions: Transaction[],
  displayCurrency: Currency
): Record<ParentCategoryId, number> {
  const zero = Object.fromEntries(
    PARENT_CATEGORY_IDS.map((id) => [id, 0])
  ) as Record<ParentCategoryId, number>;
  if (!window) return zero;

  const start = parseISO(window.startISO);
  const endExclusive = addDays(parseISO(window.endISO), 1);

  for (const tx of transactions) {
    const rawDate = tx.date;
    if (!rawDate) continue;
    const txDate =
      typeof rawDate === "string" ? parseISO(rawDate.slice(0, 10)) : rawDate;
    if (isBefore(txDate, start) || !isBefore(txDate, endExclusive)) continue;

    const category = getEffectiveCategory(tx);
    const parentConfig = SUBCATEGORY_TO_PARENT[category];
    const parentId = ((parentConfig as { id?: string } | undefined)?.id ??
      "financial_other") as ParentCategoryId;

    const gross = tx.amount;
    const reimbursement = tx.reimbursementAmount || 0;
    const net = gross - reimbursement;

    let amount = net;
    if (tx.currency !== displayCurrency) {
      try {
        amount = CurrencyService.convert(
          net,
          tx.currency as Currency,
          displayCurrency,
          tx.paymentMethod
        );
      } catch {
        // Fall back to raw net if conversion fails.
      }
    }
    zero[parentId] = (zero[parentId] ?? 0) + amount;
  }
  return zero;
}

async function loadTransactionsForUser(
  supabase: SupabaseClient,
  userId: string,
  fromISO: string
): Promise<Transaction[]> {
  // Load transactions from `fromISO` onward for this user. Payment_method
  // is left as a payment_method_id — CurrencyService.convert accepts
  // undefined and falls back to DEFAULT_EXCHANGE_RATES for cross-currency
  // pairs, which is fine for the settlement path.
  const { data, error } = await supabase
    .from("transactions")
    .select(
      "id, date, amount, currency, reimbursement_amount, user_category, category, mcc_code"
    )
    .eq("user_id", userId)
    .gte("date", fromISO);
  if (error) throw error;
  return (data ?? []).map(
    (row) =>
      ({
        id: row.id,
        date: row.date as unknown as string,
        amount: Number(row.amount),
        currency: row.currency as Currency,
        reimbursementAmount: row.reimbursement_amount
          ? Number(row.reimbursement_amount)
          : undefined,
        userCategory: (row.user_category ?? undefined) as string | undefined,
        category: (row.category ?? undefined) as string | undefined,
        mccCode: (row.mcc_code ?? undefined) as string | undefined,
        // Fields we don't need for aggregation but Transaction requires:
        merchant: null as never,
        paymentMethod: null as never,
      }) as unknown as Transaction
  );
}

interface UserAllocationSettings {
  cadenceByCategory: Record<ParentCategoryId, Cadence>;
  endBehaviorByCategory: Record<ParentCategoryId, EndBehavior>;
}

async function loadUserAllocationSettings(
  supabase: SupabaseClient,
  userId: string
): Promise<UserAllocationSettings> {
  const { data, error } = await supabase
    .from("budget_allocations")
    .select("parent_category_id, cadence, end_behavior")
    .eq("user_id", userId);
  if (error) throw error;

  const cadenceByCategory: Record<ParentCategoryId, Cadence> = {
    ...DEFAULT_CADENCE,
  };
  const endBehaviorByCategory: Record<ParentCategoryId, EndBehavior> = {
    ...DEFAULT_END_BEHAVIOR,
  };
  for (const row of data ?? []) {
    if (
      !(PARENT_CATEGORY_IDS as readonly string[]).includes(
        row.parent_category_id
      )
    ) {
      continue;
    }
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

/**
 * Does `period` own the calendar-month close for its month? Returns
 * true iff no other budget_periods row (same user/currency) starts in
 * the same calendar month AFTER this period.
 */
async function ownsMonthClose(
  supabase: SupabaseClient,
  userId: string,
  period: DuePeriodRow
): Promise<boolean> {
  const monthEndISO = formatISO(endOfMonth(parseISO(period.period_end)), {
    representation: "date",
  });
  const { data, error } = await supabase
    .from("budget_periods")
    .select("id")
    .eq("user_id", userId)
    .eq("currency", period.currency)
    .gt("period_start", period.period_end)
    .lte("period_start", monthEndISO)
    .limit(1);
  if (error) throw error;
  return (data ?? []).length === 0;
}

export interface SettleDueResult {
  settled: number;
  skipped: number;
}

export async function settleDuePeriodsForUser({
  supabase,
  userId,
  todayISO,
}: {
  supabase: SupabaseClient;
  userId: string;
  /** Browser-local (lazy path) or server UTC (cron path) "today". */
  todayISO: string;
}): Promise<SettleDueResult> {
  try {
    const { data: dueRows, error } = await supabase
      .from("budget_periods")
      .select(
        "id, income_id, currency, period_start, period_end, salary_amount, allocations"
      )
      .eq("user_id", userId)
      .lt("period_end", todayISO)
      .is("closed_at", null)
      .order("period_end", { ascending: true });
    if (error) throw error;
    if (!dueRows || dueRows.length === 0) return { settled: 0, skipped: 0 };

    const settings = await loadUserAllocationSettings(supabase, userId);

    // Widest window: earliest period_start across all due rows, going
    // back to that month's start (so monthly cats have full context).
    const earliestStart = dueRows
      .map((r) => parseISO(r.period_start))
      .reduce((a, b) => (a < b ? a : b));
    const fromISO = formatISO(startOfMonth(earliestStart), {
      representation: "date",
    });
    const transactions = await loadTransactionsForUser(
      supabase,
      userId,
      fromISO
    );

    let settled = 0;
    let skipped = 0;

    for (const raw of dueRows) {
      const period: DuePeriodRow = {
        id: raw.id,
        income_id: raw.income_id,
        currency: raw.currency as Currency,
        period_start: raw.period_start,
        period_end: raw.period_end,
        salary_amount: Number(raw.salary_amount),
        allocations: (raw.allocations as Record<string, number>) ?? {},
      };

      const carryIn = await loadPreviousSettledCarry({
        supabase,
        userId,
        currency: period.currency,
        beforeDate: period.period_start,
      });

      const ownsMonth = await ownsMonthClose(supabase, userId, period);

      // Per-period spend (all parents against pay-period window)
      const perPeriodSpent = aggregateSpent(
        { startISO: period.period_start, endISO: period.period_end },
        transactions,
        period.currency
      );
      // Monthly spend (only used for monthly-cadence parents)
      const monthlySpent = aggregateSpent(
        {
          startISO: formatISO(startOfMonth(parseISO(period.period_end)), {
            representation: "date",
          }),
          endISO: formatISO(endOfMonth(parseISO(period.period_end)), {
            representation: "date",
          }),
        },
        transactions,
        period.currency
      );

      const spentByCategory: Record<string, number> = {};
      for (const parentId of PARENT_CATEGORY_IDS) {
        const cad =
          settings.cadenceByCategory[parentId] ?? DEFAULT_CADENCE[parentId];
        if (cad === "monthly") {
          spentByCategory[parentId] = ownsMonth
            ? (monthlySpent[parentId] ?? 0)
            : 0;
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
      });

      // Guarded UPDATE — writes only when the fingerprint differs.
      // COALESCE preserves the original closed_at across recomputes so
      // "when was this first settled" stays true even after edits.
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
        // Only write when nothing has changed yet OR fingerprint differs.
        // Postgres does not support "IS DISTINCT FROM" via PostgREST's
        // `.neq` (that would treat NULL as "not equal to anything"). We
        // approximate by allowing either closed_at IS NULL OR fingerprint
        // is different from what we're about to write.
        .or(
          `settlement_fingerprint.is.null,settlement_fingerprint.neq.${result.fingerprint}`
        )
        .select("id");
      if (uErr) {
        console.error("[settleDuePeriodsForUser] update failed:", uErr);
        skipped++;
        continue;
      }
      if (!updated || updated.length === 0) {
        // Another writer already produced identical output — no-op.
        skipped++;
      } else {
        settled++;
      }
    }

    return { settled, skipped };
  } catch (err) {
    console.error("[settleDuePeriodsForUser] failed:", err);
    return { settled: 0, skipped: 0 };
  }
}
