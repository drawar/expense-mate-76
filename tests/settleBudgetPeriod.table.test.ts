/**
 * Table-driven scenarios from the design doc §54 QA matrix.
 *
 * Every row exercises one end-behavior × spend interaction, isolating a
 * single parent so the assertion stays narrow. Fixtures use "lifestyle"
 * as the parent under test unless the scenario name says otherwise.
 */

import { describe, it, expect } from "@jest/globals";

import {
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

interface Scenario {
  name: string;
  parent: ParentCategoryId;
  base: number;
  carryIn: number;
  spent: number;
  cadence?: Cadence;
  endBehavior: EndBehavior;
  expected: {
    closed_out: number;
    carry_out: number;
    overspend: number;
  };
}

const SCENARIOS: Scenario[] = [
  {
    name: "AC1: reset with positive remaining closes out; no carry",
    parent: "lifestyle",
    base: 404.29,
    carryIn: 0,
    spent: 104.29,
    endBehavior: "reset",
    expected: { closed_out: 300, carry_out: 0, overspend: 0 },
  },
  {
    name: "AC2: rollover with positive remaining carries forward",
    parent: "lifestyle",
    base: 404.29,
    carryIn: 0,
    spent: 104.29,
    endBehavior: "rollover",
    expected: { closed_out: 0, carry_out: 300, overspend: 0 },
  },
  {
    name: "AC3: rollover with overspend carries negative in carry_out (overspend stays 0 to avoid double-count)",
    parent: "lifestyle",
    base: 404.29,
    carryIn: 0,
    spent: 454.29,
    endBehavior: "rollover",
    expected: { closed_out: 0, carry_out: -50, overspend: 0 },
  },
  {
    name: "AC5: reset overspend does NOT reduce next cycle (carry stays 0)",
    parent: "personal_care",
    base: 101.07,
    carryIn: 0,
    spent: 150,
    endBehavior: "reset",
    expected: { closed_out: 0, carry_out: 0, overspend: 48.93 },
  },
  {
    name: "reset with exact spend: everything zeroes",
    parent: "lifestyle",
    base: 300,
    carryIn: 0,
    spent: 300,
    endBehavior: "reset",
    expected: { closed_out: 0, carry_out: 0, overspend: 0 },
  },
  {
    name: "rollover with exact spend: everything zeroes",
    parent: "lifestyle",
    base: 300,
    carryIn: 0,
    spent: 300,
    endBehavior: "rollover",
    expected: { closed_out: 0, carry_out: 0, overspend: 0 },
  },
  {
    name: "rollover with prior positive carry accumulates",
    parent: "lifestyle",
    base: 300,
    carryIn: 250,
    spent: 100,
    endBehavior: "rollover",
    expected: { closed_out: 0, carry_out: 450, overspend: 0 },
  },
  {
    name: "rollover with prior negative carry can go further negative",
    parent: "lifestyle",
    base: 300,
    carryIn: -50,
    spent: 400,
    endBehavior: "rollover",
    expected: { closed_out: 0, carry_out: -150, overspend: 0 },
  },
  {
    name: "rollover with prior negative carry can recover to positive",
    parent: "lifestyle",
    base: 300,
    carryIn: -50,
    spent: 100,
    endBehavior: "rollover",
    expected: { closed_out: 0, carry_out: 150, overspend: 0 },
  },
  {
    name: "reset with prior positive carry (rare mid-flip case): carries in but closes out at end",
    parent: "lifestyle",
    base: 300,
    carryIn: 200,
    spent: 100,
    endBehavior: "reset",
    expected: { closed_out: 400, carry_out: 0, overspend: 0 },
  },
  {
    name: "zero base with positive carry (funding paused after prior surplus)",
    parent: "lifestyle",
    base: 0,
    carryIn: 600,
    spent: 100,
    endBehavior: "rollover",
    expected: { closed_out: 0, carry_out: 500, overspend: 0 },
  },
  {
    name: "zero spend rolls entire available forward",
    parent: "lifestyle",
    base: 300,
    carryIn: 50,
    spent: 0,
    endBehavior: "rollover",
    expected: { closed_out: 0, carry_out: 350, overspend: 0 },
  },
];

function buildInput(s: Scenario): SettlementInput {
  const cadence = s.cadence ?? "per_period";
  const perParent = <T>(v: T): Record<ParentCategoryId, T> =>
    Object.fromEntries(PARENT_CATEGORY_IDS.map((p) => [p, v])) as Record<
      ParentCategoryId,
      T
    >;

  return {
    period: {
      id: `fixture-${s.name}`,
      allocations: {
        ...Object.fromEntries(PARENT_CATEGORY_IDS.map((p) => [p, 0])),
        [s.parent]: s.base,
        [SAVINGS_ID]: 1000,
      },
    },
    carryInByCategory: { [s.parent]: s.carryIn },
    cadenceByCategory: {
      ...perParent<Cadence>("per_period"),
      [s.parent]: cadence,
    },
    endBehaviorByCategory: {
      ...perParent<EndBehavior>("reset"),
      [s.parent]: s.endBehavior,
    },
    spentByCategory: { [s.parent]: s.spent },
  };
}

describe("settleBudgetPeriod — QA scenarios", () => {
  it.each(SCENARIOS)("$name", (scenario) => {
    const result = settleBudgetPeriod(buildInput(scenario));
    expect(result.closed_out[scenario.parent]).toBeCloseTo(
      scenario.expected.closed_out,
      2
    );
    expect(result.carry_out[scenario.parent]).toBeCloseTo(
      scenario.expected.carry_out,
      2
    );
    expect(result.overspend[scenario.parent]).toBeCloseTo(
      scenario.expected.overspend,
      2
    );
  });

  it("snapshots the cadence and end_behavior used at settle time", () => {
    const s = SCENARIOS[1]; // rollover + positive remaining
    const result = settleBudgetPeriod(buildInput(s));
    expect(result.end_behavior_snapshot[s.parent]).toBe("rollover");
    expect(result.cadence_snapshot[s.parent]).toBe("per_period");
  });

  it("fingerprint changes when spend changes; stays when nothing changes", () => {
    const s = SCENARIOS[1];
    const a = settleBudgetPeriod(buildInput(s));
    const bInput = buildInput(s);
    bInput.spentByCategory[s.parent] = s.spent + 50;
    const b = settleBudgetPeriod(bInput);
    expect(a.fingerprint).not.toBe(b.fingerprint);
    const c = settleBudgetPeriod(buildInput(s));
    expect(a.fingerprint).toBe(c.fingerprint);
  });
});
