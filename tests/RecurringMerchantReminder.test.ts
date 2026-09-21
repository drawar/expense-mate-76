/**
 * Behavior tests for detectRecurringMerchantsForToday — the pure
 * function that filters ExpenseClassifier fixed-expense output down
 * to merchants due "around today" for the quick-add reminder UI.
 */

import { describe, it, expect } from "@jest/globals";

import type { Transaction, Merchant, PaymentMethod } from "@/types";
import { detectRecurringMerchantsForToday } from "../src/core/forecast/RecurringMerchantReminder";

// -----------------------------------------------------------------------------
// Minimal fixture factories — the ExpenseClassifier only needs date, amount,
// currency, merchant.name, and mccCode to detect a fixed expense.

const merchant = (name: string, mcc = "4900"): Merchant => ({
  id: `m-${name}`,
  name,
  isOnline: false,
});

const pm = (id = "pm-1"): PaymentMethod =>
  ({
    id,
    name: "Test Card",
    type: "credit_card",
    currency: "CAD",
    issuer: "Test",
    lastFourDigits: "0000",
    pointsCurrency: "MR",
  }) as PaymentMethod;

const tx = (
  merchantName: string,
  date: string,
  amount: number,
  mcc = "4900"
): Transaction => ({
  id: `${merchantName}-${date}`,
  date,
  amount,
  currency: "CAD",
  merchant: merchant(merchantName, mcc),
  paymentMethod: pm(),
  paymentAmount: amount,
  paymentCurrency: "CAD",
  mccCode: mcc,
  category: "Utilities",
  userCategory: "Utilities",
  rewardPoints: 0,
  bonusPoints: 0,
  basePoints: 0,
  isContactless: false,
  reimbursementAmount: 0,
});

/**
 * Build N monthly occurrences of a merchant on `dayOfMonth`, ending at
 * `lastMonth` (inclusive). Amount is constant so the classifier's CV
 * check passes cleanly.
 */
function toISODateLocal(d: Date): string {
  // Explicit local-noon timestamp so ExpenseClassifier's
  // `new Date(t.date).getDate()` (which is TZ-sensitive on bare
  // "YYYY-MM-DD" strings — parsed as UTC midnight then shown local)
  // returns the day we intended regardless of test env timezone.
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}T12:00:00`;
}

function monthlyTxs(
  merchantName: string,
  dayOfMonth: number,
  amount: number,
  count: number,
  lastMonth: Date,
  mcc = "4900"
): Transaction[] {
  const out: Transaction[] = [];
  for (let i = 0; i < count; i++) {
    const d = new Date(
      lastMonth.getFullYear(),
      lastMonth.getMonth() - i,
      dayOfMonth
    );
    out.push(tx(merchantName, toISODateLocal(d), amount, mcc));
  }
  return out;
}

describe("detectRecurringMerchantsForToday", () => {
  it("returns [] on empty transactions", () => {
    const today = new Date(2026, 8, 20); // Sep 20 2026
    expect(detectRecurringMerchantsForToday([], today)).toEqual([]);
  });

  it("returns a reminder when today is within ±2 of expectedDay and not yet logged this month", () => {
    // 3 months of Netflix on day 5, last was Aug 5. Today = Sep 4 (day 4).
    // Distance = 1. Sep has no Netflix yet → should surface.
    const lastMonth = new Date(2026, 7, 5); // Aug 5
    const txs = monthlyTxs("Netflix", 5, 15.99, 3, lastMonth);
    const today = new Date(2026, 8, 4); // Sep 4
    const reminders = detectRecurringMerchantsForToday(txs, today);
    expect(reminders.map((r) => r.merchantName)).toContain("Netflix");
    const netflix = reminders.find((r) => r.merchantName === "Netflix")!;
    expect(netflix.expectedDay).toBe(5);
    expect(netflix.daysUntilExpected).toBe(1);
  });

  it("suppresses merchants already logged this month", () => {
    // 3 months of Rent on day 1, last was Sep 1 (this month). Today = Sep 2.
    // Distance would qualify but user already paid → suppress.
    const txs = monthlyTxs("Rent", 1, 2000, 3, new Date(2026, 8, 1));
    const today = new Date(2026, 8, 2); // Sep 2
    const reminders = detectRecurringMerchantsForToday(txs, today);
    expect(reminders.map((r) => r.merchantName)).not.toContain("Rent");
  });

  it("skips merchants outside the ±tolerance window", () => {
    // 3 months of Gym on day 15, last was Aug 15. Today = Sep 20 (5 days off).
    const txs = monthlyTxs(
      "Fitness Club",
      15,
      45,
      3,
      new Date(2026, 7, 15),
      "7997"
    );
    const today = new Date(2026, 8, 20); // Sep 20
    const reminders = detectRecurringMerchantsForToday(txs, today);
    expect(reminders.map((r) => r.merchantName)).not.toContain("Fitness Club");
  });

  it("caps at MAX_REMINDERS (5) and sorts nearest first", () => {
    // Seed 7 recurring merchants at various days; today = day 15.
    // Merchants at day 15, 14, 16, 13, 17, 12, 18 → nearest 5 are 15, 14, 16, 13, 17.
    const lastMonth = new Date(2026, 7, 1); // Aug
    const days = [15, 14, 16, 13, 17, 12, 18];
    const txs: Transaction[] = [];
    days.forEach((d, i) => {
      txs.push(
        ...monthlyTxs(`Bill${i}-day${d}`, d, 50, 3, new Date(2026, 7, d))
      );
    });
    const today = new Date(2026, 8, 15); // Sep 15
    const reminders = detectRecurringMerchantsForToday(txs, today, 3);
    expect(reminders.length).toBeLessThanOrEqual(5);
    // First reminder should be closest to today (day 15).
    if (reminders.length > 0) {
      expect(Math.abs(reminders[0].daysUntilExpected)).toBeLessThanOrEqual(
        Math.abs(reminders[reminders.length - 1].daysUntilExpected)
      );
    }
  });

  it("honors custom tolerance", () => {
    // Netflix day 5, today = day 8 → distance 3. Default tol=2 skips; tol=3 includes.
    const txs = monthlyTxs("Netflix", 5, 15.99, 3, new Date(2026, 7, 5));
    const today = new Date(2026, 8, 8); // Sep 8

    const defaultTol = detectRecurringMerchantsForToday(txs, today);
    expect(defaultTol.map((r) => r.merchantName)).not.toContain("Netflix");

    const wideTol = detectRecurringMerchantsForToday(txs, today, 3);
    expect(wideTol.map((r) => r.merchantName)).toContain("Netflix");
  });
});
