/**
 * Unit tests for the pure ranking function that powers
 * useRecommendedPaymentMethods.
 */

import { describe, it, expect } from "@jest/globals";

import type { PaymentMethod, Transaction } from "@/types";
import { rankPaymentMethods } from "../src/utils/expense/rankPaymentMethods";

const pm = (id: string, name: string): PaymentMethod =>
  ({
    id,
    name,
    type: "credit_card",
    currency: "CAD",
    issuer: "Test",
    lastFourDigits: "0000",
  }) as PaymentMethod;

const tx = (pmId: string, date: string): Transaction =>
  ({
    id: `t-${pmId}-${date}`,
    date,
    amount: 10,
    currency: "CAD",
    merchant: { id: "m", name: "Merchant", isOnline: false } as never,
    paymentMethod: { id: pmId } as PaymentMethod,
    paymentAmount: 10,
    paymentCurrency: "CAD",
    category: "",
    userCategory: "",
    rewardPoints: 0,
    bonusPoints: 0,
    basePoints: 0,
    isContactless: false,
    reimbursementAmount: 0,
  }) as unknown as Transaction;

const COBALT = pm("pm-cobalt", "Amex Cobalt");
const ION_PLUS = pm("pm-ion", "RBC ION+");
const KOODO = pm("pm-koodo", "Koodo");
const ARCHIVED = pm("pm-old", "Old Card");

describe("rankPaymentMethods", () => {
  it("returns [] on empty transactions", () => {
    expect(rankPaymentMethods([], [COBALT, ION_PLUS])).toEqual([]);
  });

  it("ranks by count desc — top 3 by frequency", () => {
    // 3× Cobalt, 2× ION+, 1× Koodo
    const txs = [
      tx("pm-cobalt", "2026-09-01"),
      tx("pm-cobalt", "2026-09-05"),
      tx("pm-cobalt", "2026-09-10"),
      tx("pm-ion", "2026-09-02"),
      tx("pm-ion", "2026-09-07"),
      tx("pm-koodo", "2026-09-15"),
    ];
    const result = rankPaymentMethods(txs, [COBALT, ION_PLUS, KOODO]);
    expect(result.map((r) => r.id)).toEqual([
      "pm-cobalt",
      "pm-ion",
      "pm-koodo",
    ]);
  });

  it("caps at topN (default 3)", () => {
    const txs = [
      tx("pm-cobalt", "2026-09-01"),
      tx("pm-ion", "2026-09-02"),
      tx("pm-koodo", "2026-09-03"),
      tx("pm-old", "2026-09-04"),
    ];
    const result = rankPaymentMethods(txs, [COBALT, ION_PLUS, KOODO, ARCHIVED]);
    expect(result.length).toBe(3);
  });

  it("tie-breaks by latest date desc", () => {
    // Both Cobalt and ION+ used once; ION+ is more recent → wins the tie
    const txs = [tx("pm-cobalt", "2026-08-15"), tx("pm-ion", "2026-09-15")];
    const result = rankPaymentMethods(txs, [COBALT, ION_PLUS]);
    expect(result.map((r) => r.id)).toEqual(["pm-ion", "pm-cobalt"]);
  });

  it("filters out PMs not in the current active list (archived cards)", () => {
    // 5× on an archived PM, 1× on Cobalt → Cobalt should be the only result
    const txs = [
      tx("pm-old", "2026-09-01"),
      tx("pm-old", "2026-09-02"),
      tx("pm-old", "2026-09-03"),
      tx("pm-old", "2026-09-04"),
      tx("pm-old", "2026-09-05"),
      tx("pm-cobalt", "2026-09-06"),
    ];
    // Active list does NOT include pm-old
    const result = rankPaymentMethods(txs, [COBALT, ION_PLUS]);
    expect(result.map((r) => r.id)).toEqual(["pm-cobalt"]);
  });

  it("honors custom topN", () => {
    const txs = [
      tx("pm-cobalt", "2026-09-01"),
      tx("pm-ion", "2026-09-02"),
      tx("pm-koodo", "2026-09-03"),
    ];
    const result = rankPaymentMethods(txs, [COBALT, ION_PLUS, KOODO], 2);
    expect(result.length).toBe(2);
  });
});
