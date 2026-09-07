/**
 * Property-based tests for computeBudgetPeriod: the pure math that turns a
 * salary event + allocation percentages into a persisted budget_periods row.
 */

import { describe, it, expect } from "@jest/globals";
import fc from "fast-check";
import {
  computeBudgetPeriod,
  type SalaryInput,
} from "../src/utils/budget/computeBudgetPeriod";
import {
  DEFAULT_ALLOCATIONS,
  DEFAULT_SAVINGS_PCT,
  PARENT_CATEGORY_IDS,
  SAVINGS_ID,
  type ParentCategoryId,
} from "../src/utils/budget/defaults";

const salaryArb = (): fc.Arbitrary<SalaryInput> =>
  fc.record({
    id: fc.uuid(),
    startDate: fc.constantFrom(
      "2026-01-15",
      "2026-06-05",
      "2026-09-05",
      "2026-12-31"
    ),
    amount: fc
      .float({
        min: Math.fround(0.01),
        max: Math.fround(100_000),
        noNaN: true,
        noDefaultInfinity: true,
      })
      .map((n) => Math.round(n * 100) / 100),
    currency: fc.constantFrom("CAD" as const, "USD" as const, "SGD" as const),
    frequency: fc.constantFrom("biweekly" as const, "monthly" as const),
  });

const allocationsArb = (): fc.Arbitrary<Record<ParentCategoryId, number>> =>
  fc
    .tuple(
      ...(PARENT_CATEGORY_IDS.map(() =>
        fc.integer({ min: 0, max: 100 })
      ) as fc.Arbitrary<number>[])
    )
    .map((pcts) => {
      const total = pcts.reduce((a, b) => a + b, 0);
      // Scale down so the sum is at most 100 (matches the "sum ≤ 100" invariant
      // the settings UI enforces; sums > 100 are treated as a warning at the
      // UI layer, not at compute time, but we test the well-formed shape here).
      const scale = total > 100 ? 100 / total : 1;
      return Object.fromEntries(
        PARENT_CATEGORY_IDS.map((id, i) => [id, Math.floor(pcts[i] * scale)])
      ) as Record<ParentCategoryId, number>;
    });

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

describe("computeBudgetPeriod", () => {
  it("each allocation equals round2(salary × pct/100)", () => {
    fc.assert(
      fc.property(salaryArb(), allocationsArb(), (salary, pcts) => {
        const out = computeBudgetPeriod(salary, pcts);
        for (const id of PARENT_CATEGORY_IDS) {
          expect(out.allocations[id]).toBe(
            round2((salary.amount * (pcts[id] ?? 0)) / 100)
          );
        }
      })
    );
  });

  it("sum of spending allocations equals round2(salary × sum(pct)/100) within 1¢ per category", () => {
    fc.assert(
      fc.property(salaryArb(), allocationsArb(), (salary, pcts) => {
        // Pass savingsPct = 0 so the total reflects only the spending categories.
        const out = computeBudgetPeriod(salary, pcts, 0);
        const totalPct = Object.values(pcts).reduce((a, b) => a + b, 0);
        const expectedTotal = round2((salary.amount * totalPct) / 100);
        const spendingSum = PARENT_CATEGORY_IDS.reduce(
          (a, id) => a + (out.allocations[id] ?? 0),
          0
        );
        // Rounding drift is bounded by ¢/category (six categories).
        expect(
          Math.abs(round2(spendingSum) - expectedTotal)
        ).toBeLessThanOrEqual(0.06);
        // Savings slot is present and honors savingsPct = 0.
        expect(out.allocations[SAVINGS_ID]).toBe(0);
      })
    );
  });

  it("savings slot equals round2(salary × savingsPct / 100)", () => {
    fc.assert(
      fc.property(
        salaryArb(),
        fc.integer({ min: 0, max: 100 }),
        (salary, savingsPct) => {
          const out = computeBudgetPeriod(
            salary,
            DEFAULT_ALLOCATIONS,
            savingsPct
          );
          expect(out.allocations[SAVINGS_ID]).toBe(
            round2((salary.amount * savingsPct) / 100)
          );
        }
      )
    );
  });

  it("passes through income_id, currency, salary_amount, period_start unchanged", () => {
    fc.assert(
      fc.property(salaryArb(), (salary) => {
        const out = computeBudgetPeriod(salary);
        expect(out.income_id).toBe(salary.id);
        expect(out.currency).toBe(salary.currency);
        expect(out.salary_amount).toBe(salary.amount);
        expect(out.period_start).toBe(salary.startDate);
      })
    );
  });

  it("uses DEFAULT_ALLOCATIONS + DEFAULT_SAVINGS_PCT when no percentages provided", () => {
    const salary: SalaryInput = {
      id: "test",
      startDate: "2026-09-05",
      amount: 5000,
      currency: "CAD",
      frequency: "biweekly",
    };
    const out = computeBudgetPeriod(salary);
    expect(out.allocations.essentials).toBe(
      round2((5000 * DEFAULT_ALLOCATIONS.essentials) / 100)
    );
    expect(out.allocations[SAVINGS_ID]).toBe(
      round2((5000 * DEFAULT_SAVINGS_PCT) / 100)
    );
    expect(out.period_end).toBe("2026-09-19");
    // Defaults: savings + spending must sum to 100.
    const spendingTotal = Object.values(DEFAULT_ALLOCATIONS).reduce(
      (a, b) => a + b,
      0
    );
    expect(spendingTotal + DEFAULT_SAVINGS_PCT).toBe(100);
  });
});
