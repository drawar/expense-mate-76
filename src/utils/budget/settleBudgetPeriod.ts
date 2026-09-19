/**
 * Pure function: settle a budget_periods row at end-of-cycle.
 *
 * Given a period snapshot + carry_in from the prior settled period +
 * per-parent cadence + per-parent end_behavior + per-parent spend for
 * the appropriate window, produce the settlement JSONB payload:
 *   settled_spent, closed_out, carry_out, overspend,
 *   cadence_snapshot, end_behavior_snapshot, fingerprint.
 *
 * Design invariants enforced here:
 *   1. carry_in(N) = carry_out(N-1) for rollover keys (seeded upstream).
 *   2. RESET  → carry_out = 0; closed_out = max(remaining, 0);
 *              overspend = min(remaining, 0).
 *   3. ROLLOVER → carry_out = remaining (can be negative);
 *                 closed_out = 0; overspend = min(remaining, 0).
 *   4. Savings is always RESET-forced with zero carry_out/closed_out —
 *      savings is set aside at open, not settled at close.
 *   5. Idempotency: identical inputs → identical outputs + identical
 *      fingerprint. The DB writer's `WHERE fingerprint IS DISTINCT
 *      FROM ?` guard short-circuits no-op re-settles.
 *
 * Cadence × settlement window is the tricky part: this function does
 * NOT decide whether a monthly-cadence category settles on this period
 * — that's the caller's job. The caller must pass 0 in
 * spentByCategory[monthlyParent] for periods that do NOT own the
 * month-closing (see docs at top of file for detection rule). This
 * function trusts its inputs and just produces the settlement math.
 */

import { createHash } from "crypto";

import {
  PARENT_CATEGORY_IDS,
  SAVINGS_ID,
  type Cadence,
  type EndBehavior,
  type ParentCategoryId,
} from "./defaults";

export type SettlementSlotId = ParentCategoryId | typeof SAVINGS_ID;

export interface SettlementInput {
  period: {
    id: string;
    /** Base allocations snapshot: {parent | "savings": dollars}. */
    allocations: Record<string, number>;
  };
  /** {parent | "savings": dollars} inherited from prior settled period. */
  carryInByCategory: Record<string, number>;
  /** Per-parent live cadence (from budget_allocations at settle time). */
  cadenceByCategory: Record<ParentCategoryId, Cadence>;
  /** Per-parent live end_behavior (from budget_allocations at settle time). */
  endBehaviorByCategory: Record<ParentCategoryId, EndBehavior>;
  /**
   * {parent | "savings": dollars} — spend the settlement is computed
   * against. Caller is responsible for choosing the right window per
   * parent's cadence (per-period vs calendar-month) AND for zeroing
   * monthly parents on non-month-closing periods.
   */
  spentByCategory: Record<string, number>;
}

export interface SettlementResult {
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

/**
 * Stable JSON stringify — sorts object keys recursively so the same
 * logical input always hashes to the same fingerprint regardless of
 * key insertion order.
 */
function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  return `{${keys
    .map((k) => `${JSON.stringify(k)}:${stableStringify(obj[k])}`)
    .join(",")}}`;
}

/**
 * Deterministic fingerprint of the settlement input. Two inputs that
 * produce the same output must hash to the same fingerprint.
 */
export function computeSettlementFingerprint(input: SettlementInput): string {
  const h = createHash("sha256");
  h.update(
    stableStringify({
      period_id: input.period.id,
      allocations: input.period.allocations,
      carry_in: input.carryInByCategory,
      spent: input.spentByCategory,
      cadence: input.cadenceByCategory,
      end_behavior: input.endBehaviorByCategory,
    })
  );
  return h.digest("hex");
}

export function settleBudgetPeriod(input: SettlementInput): SettlementResult {
  const settled_spent: Record<string, number> = {};
  const closed_out: Record<string, number> = {};
  const carry_out: Record<string, number> = {};
  const overspend: Record<string, number> = {};
  const cadence_snapshot: Record<string, Cadence> = {};
  const end_behavior_snapshot: Record<string, EndBehavior> = {};

  // Spending parent categories
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
      // Rollover: the negative remaining carries as negative carry_out.
      // We deliberately DO NOT also populate `overspend` here — that
      // would double-count the same money, breaking the conservation
      // identity `base + carry_in = spent + closed_out + carry_out -
      // overspend`. The summary tile can render rollover overspend
      // trivially as `Math.min(carry_out[k], 0) * -1`.
      carry_out[parentId] = remaining; // may be negative
      closed_out[parentId] = 0;
      overspend[parentId] = 0;
    } else {
      // Reset: overspend is the ONLY way the debt is recorded, since
      // carry_out is forced to 0.
      carry_out[parentId] = 0;
      closed_out[parentId] = remaining > 0 ? remaining : 0;
      overspend[parentId] = remaining < 0 ? round2(-remaining) : 0;
    }
  }

  // Savings slot — always RESET-forced, no carry, no closed_out.
  // The savings dollars were set aside at open; there is no
  // "unused savings budget" to sweep and no "overspent savings"
  // concept. Snapshot the enforced values so historical readers
  // see the truth of how savings was actually treated.
  settled_spent[SAVINGS_ID] = 0;
  carry_out[SAVINGS_ID] = 0;
  closed_out[SAVINGS_ID] = 0;
  overspend[SAVINGS_ID] = 0;

  return {
    settled_spent,
    closed_out,
    carry_out,
    overspend,
    cadence_snapshot,
    end_behavior_snapshot,
    fingerprint: computeSettlementFingerprint(input),
  };
}

/**
 * Convenience: sum every value in a JSONB {slot: dollars} map.
 * Ignores the savings slot; feeds the aggregate summary tile.
 */
export function sumSpendingSlots(map: Record<string, number>): number {
  let sum = 0;
  for (const [k, v] of Object.entries(map)) {
    if (k === SAVINGS_ID) continue;
    sum += Number(v) || 0;
  }
  return round2(sum);
}
