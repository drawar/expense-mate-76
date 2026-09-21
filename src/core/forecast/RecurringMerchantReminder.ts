/**
 * Recurring-merchant reminder — wraps ExpenseClassifier to surface
 * merchants due "around today" in the quick-add UX.
 *
 * The ExpenseClassifier already detects fixed/recurring merchants and
 * hands back FixedExpense[] with expectedDay + lastOccurrence. This
 * module adds two extra filters on top:
 *
 *   1. Proximity: today's day-of-month is within ±tolerance days of
 *      expectedDay, using circular distance so month-length differences
 *      wrap correctly (day 31 near month-end vs day 1 of a short month).
 *   2. Already-logged suppression: if the merchant has a lastOccurrence
 *      in the same calendar month as today, don't remind — the user
 *      already paid this cycle.
 *
 * Client-side only. Called from a React Query hook keyed on the day so
 * a session only recomputes once per calendar day.
 */

import { getDaysInMonth, parseISO } from "date-fns";

import type { Transaction } from "@/types";
import { dayOfMonthDistance } from "@/utils/dates/formatters";
import { expenseClassifier } from "./ExpenseClassifier";

export interface RecurringReminder {
  merchantName: string;
  expectedDay: number;
  expectedAmount: number;
  /** ISO date string of the most recent occurrence. */
  lastOccurrence: string;
  /**
   * Signed days from today to expectedDay (clamped to current month
   * length). Negative = past-due (charge already happened), positive =
   * upcoming. Zero = today.
   */
  daysUntilExpected: number;
  /** ExpenseClassifier confidence 0-1. */
  confidence: number;
  /** Number of historical occurrences the classifier found. */
  occurrenceCount: number;
}

const DEFAULT_TOLERANCE = 2;
const MAX_REMINDERS = 5;

/**
 * Signed day-of-month delta clamped to the current month's length.
 * Uses the circular direction that's closest — a merchant expected on
 * day 30 with today = day 2 in a 30-day month is +2 (upcoming), not
 * -28. Kept internal because the pure-distance helper elsewhere is
 * unsigned; the signed version is only meaningful for the reminder UI.
 */
function signedDayDelta(
  today: number,
  expected: number,
  monthLen: number
): number {
  const clampToday = Math.min(Math.max(1, today), monthLen);
  const clampExpected = Math.min(Math.max(1, expected), monthLen);
  const forward = (clampExpected - clampToday + monthLen) % monthLen;
  const backward = forward - monthLen;
  return Math.abs(forward) <= Math.abs(backward) ? forward : backward;
}

function sameYearMonth(dateISO: string, ref: Date): boolean {
  try {
    const d = parseISO(dateISO);
    return (
      d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth()
    );
  } catch {
    return false;
  }
}

export function detectRecurringMerchantsForToday(
  transactions: Transaction[],
  today: Date,
  tolerance: number = DEFAULT_TOLERANCE
): RecurringReminder[] {
  if (!transactions || transactions.length === 0) return [];

  const monthLen = getDaysInMonth(today);
  const todayDay = today.getDate();

  const { fixed } = expenseClassifier.classify(transactions);

  const eligible: RecurringReminder[] = [];
  for (const fx of fixed) {
    // Already logged this cycle → user already paid; don't remind.
    if (sameYearMonth(fx.lastOccurrence, today)) continue;

    const dist = dayOfMonthDistance(todayDay, fx.expectedDay, monthLen);
    if (dist > tolerance) continue;

    eligible.push({
      merchantName: fx.merchantName,
      expectedDay: fx.expectedDay,
      expectedAmount: fx.expectedAmount,
      lastOccurrence: fx.lastOccurrence,
      daysUntilExpected: signedDayDelta(todayDay, fx.expectedDay, monthLen),
      confidence: fx.confidence,
      occurrenceCount: fx.occurrenceCount,
    });
  }

  // Nearest first (today, then ±1, then ±2). Tie-break by confidence.
  eligible.sort((a, b) => {
    const dA = Math.abs(a.daysUntilExpected);
    const dB = Math.abs(b.daysUntilExpected);
    if (dA !== dB) return dA - dB;
    return b.confidence - a.confidence;
  });

  return eligible.slice(0, MAX_REMINDERS);
}

/**
 * Singleton wrapper for parity with expenseClassifier / spenderProfiler.
 * Deliberately thin — the pure function above is the interesting bit,
 * this just gives consumers a namespaced call site.
 */
export const recurringMerchantReminder = {
  detect: detectRecurringMerchantsForToday,
} as const;
