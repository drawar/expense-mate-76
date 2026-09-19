/**
 * Property-based tests for settleBudgetPeriod: the pure settlement math
 * that turns a period snapshot + carry_in + spend into a settlement
 * payload (closed_out, carry_out, overspend, snapshot fields).
 *
 * Invariants under test:
 *   1. RESET forces carry_out[k] === 0 for all inputs.
 *   2. ROLLOVER can produce negative carry_out (overspend carries).
 *   3. Conservation: base + carry_in = spent + closed_out - overspend + carry_out
 *      per parent (with overspend as a positive absolute).
 *   4. Idempotency: same input → same output → same fingerprint.
 *   5. Savings always frozen: settled_spent/carry_out/closed_out/overspend
 *      are 0 regardless of what the user configured.
 *   6. Fingerprint is order-independent (stable stringify).
 */

import { describe, it, expect } from "@jest/globals";
import fc from "fast-check";

import {
  computeSettlementFingerprint,
  settleBudgetPeriod,
  type SettlementInput,
} from "../src/utils/budget/settleBudgetPeriod";
import {
  PARENT_CATEGORY_IDS,
  SAVINGS_ID,
  type Cadence,
  type EndBehavior,
  type ParentCategoryId,
} from "../src/utils/budget/defaults";

const money = () =>
  fc
    .float({
      min: Math.fround(0),
      max: Math.fround(10_000),
      noNaN: true,
      noDefaultInfinity: true,
    })
    .map((n) => Math.round(n * 100) / 100);

const signedMoney = () =>
  fc
    .float({
      min: Math.fround(-5_000),
      max: Math.fround(10_000),
      noNaN: true,
      noDefaultInfinity: true,
    })
    .map((n) => Math.round(n * 100) / 100);

const cadenceArb = (): fc.Arbitrary<Cadence> =>
  fc.constantFrom("per_period" as const, "monthly" as const);

const endBehaviorArb = (): fc.Arbitrary<EndBehavior> =>
  fc.constantFrom("reset" as const, "rollover" as const);

const perParentMap = <T>(
  arb: fc.Arbitrary<T>
): fc.Arbitrary<Record<ParentCategoryId, T>> =>
  fc
    .tuple(...PARENT_CATEGORY_IDS.map(() => arb))
    .map(
      (vals) =>
        Object.fromEntries(
          PARENT_CATEGORY_IDS.map((id, i) => [id, vals[i]])
        ) as Record<ParentCategoryId, T>
    );

const inputArb = (): fc.Arbitrary<SettlementInput> =>
  fc.record({
    period: fc.record({
      id: fc.uuid(),
      allocations: perParentMap(money()).map((m) => ({
        ...m,
        [SAVINGS_ID]: 500,
      })),
    }),
    carryInByCategory: perParentMap(signedMoney()) as unknown as fc.Arbitrary<
      Record<string, number>
    >,
    cadenceByCategory: perParentMap(cadenceArb()),
    endBehaviorByCategory: perParentMap(endBehaviorArb()),
    spentByCategory: perParentMap(money()) as unknown as fc.Arbitrary<
      Record<string, number>
    >,
  });

// Two round2 boundaries in the settlement math (available and remaining),
// each can drop up to 0.005 → cumulative up to 0.02.
const EPSILON = 0.02;

describe("settleBudgetPeriod — properties", () => {
  it("RESET keys always produce carry_out === 0", () => {
    fc.assert(
      fc.property(inputArb(), (input) => {
        const result = settleBudgetPeriod(input);
        for (const parentId of PARENT_CATEGORY_IDS) {
          if (input.endBehaviorByCategory[parentId] === "reset") {
            expect(result.carry_out[parentId]).toBe(0);
          }
        }
      })
    );
  });

  it("ROLLOVER keys can produce negative carry_out on overspend", () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        fc.float({
          min: Math.fround(10),
          max: Math.fround(100),
          noNaN: true,
          noDefaultInfinity: true,
        }),
        fc.float({
          min: Math.fround(200),
          max: Math.fround(500),
          noNaN: true,
          noDefaultInfinity: true,
        }),
        (id, base, spend) => {
          const input: SettlementInput = {
            period: {
              id,
              allocations: Object.fromEntries(
                PARENT_CATEGORY_IDS.map((p) => [p, base])
              ),
            },
            carryInByCategory: {},
            cadenceByCategory: Object.fromEntries(
              PARENT_CATEGORY_IDS.map((p) => [p, "per_period"])
            ) as Record<ParentCategoryId, Cadence>,
            endBehaviorByCategory: Object.fromEntries(
              PARENT_CATEGORY_IDS.map((p) => [p, "rollover"])
            ) as Record<ParentCategoryId, EndBehavior>,
            spentByCategory: Object.fromEntries(
              PARENT_CATEGORY_IDS.map((p) => [p, spend])
            ),
          };
          const result = settleBudgetPeriod(input);
          for (const parentId of PARENT_CATEGORY_IDS) {
            expect(result.carry_out[parentId]).toBeLessThan(0);
          }
        }
      )
    );
  });

  it("conservation: base + carry_in ≈ spent + closed_out + carry_out − overspend (per parent)", () => {
    // Rollover: overspend stays 0 (debt lives in negative carry_out).
    // Reset:    carry_out stays 0 (debt lives in overspend).
    // In both, the identity below balances.
    fc.assert(
      fc.property(inputArb(), (input) => {
        const result = settleBudgetPeriod(input);
        for (const parentId of PARENT_CATEGORY_IDS) {
          const base = input.period.allocations[parentId] ?? 0;
          const carryIn = input.carryInByCategory[parentId] ?? 0;
          const spent = result.settled_spent[parentId] ?? 0;
          const closedOut = result.closed_out[parentId] ?? 0;
          const overspendVal = result.overspend[parentId] ?? 0;
          const carryOut = result.carry_out[parentId] ?? 0;
          const lhs = base + carryIn;
          const rhs = spent + closedOut + carryOut - overspendVal;
          expect(Math.abs(lhs - rhs)).toBeLessThan(EPSILON);
        }
      })
    );
  });

  it("idempotency: same input → same output + same fingerprint", () => {
    fc.assert(
      fc.property(inputArb(), (input) => {
        const a = settleBudgetPeriod(input);
        const b = settleBudgetPeriod(input);
        expect(a).toEqual(b);
        expect(a.fingerprint).toBe(b.fingerprint);
      })
    );
  });

  it("savings slot always frozen (0 spent/carry/closed/overspend regardless of config)", () => {
    fc.assert(
      fc.property(inputArb(), (input) => {
        const result = settleBudgetPeriod(input);
        expect(result.settled_spent[SAVINGS_ID]).toBe(0);
        expect(result.carry_out[SAVINGS_ID]).toBe(0);
        expect(result.closed_out[SAVINGS_ID]).toBe(0);
        expect(result.overspend[SAVINGS_ID]).toBe(0);
      })
    );
  });

  it("fingerprint is stable across key insertion order", () => {
    const base: SettlementInput = {
      period: {
        id: "abc",
        allocations: { essentials: 100, lifestyle: 50, [SAVINGS_ID]: 200 },
      },
      carryInByCategory: { essentials: 10, lifestyle: 5 },
      cadenceByCategory: {
        essentials: "monthly",
        lifestyle: "per_period",
        home_living: "monthly",
        personal_care: "per_period",
        work_education: "per_period",
        financial_other: "per_period",
      },
      endBehaviorByCategory: {
        essentials: "reset",
        lifestyle: "rollover",
        home_living: "reset",
        personal_care: "reset",
        work_education: "reset",
        financial_other: "reset",
      },
      spentByCategory: { essentials: 50, lifestyle: 30 },
    };
    // Reordered version — same logical data, different insertion order.
    const reordered: SettlementInput = {
      period: {
        id: "abc",
        allocations: { [SAVINGS_ID]: 200, lifestyle: 50, essentials: 100 },
      },
      carryInByCategory: { lifestyle: 5, essentials: 10 },
      cadenceByCategory: {
        financial_other: "per_period",
        work_education: "per_period",
        personal_care: "per_period",
        home_living: "monthly",
        lifestyle: "per_period",
        essentials: "monthly",
      },
      endBehaviorByCategory: {
        financial_other: "reset",
        work_education: "reset",
        personal_care: "reset",
        home_living: "reset",
        lifestyle: "rollover",
        essentials: "reset",
      },
      spentByCategory: { lifestyle: 30, essentials: 50 },
    };
    expect(computeSettlementFingerprint(base)).toBe(
      computeSettlementFingerprint(reordered)
    );
  });
});
