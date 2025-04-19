// tests/MonthlySpendingRepository.test.ts

import { MonthlySpendingRepository } from "../src/core/analytics/MonthlySpendingRepository";
import { DateTime } from "luxon";
import { SupabaseClient } from "@supabase/supabase-js";
import { MonthlyTransactionRow } from "../src/types/MonthlyTransactionRow";

const mockData: MonthlyTransactionRow[] = [
  {
    id: "tx1",
    merchant_id: "m1",
    payment_method_id: "pm1",
    amount: 100,
    currency: "SGD",
    payment_amount: 100,
    payment_currency: "SGD",
    date: new Date().toISOString(),
    category: "Food",
    merchant_name: "Starbucks",
    payment_method_display_name: "Amex True Cashback",
  },
];

const mockSupabase: Partial<SupabaseClient> = {
  from: () => ({
    select: () => ({
      gte: () => ({
        lt: () => ({
          eq: () => ({
            eq: () => ({
              then: (
                cb: (result: {
                  data: MonthlyTransactionRow[] | null;
                  error: Error | null;
                }) => void
              ) => cb({ data: mockData, error: null }),
            }),
          }),
        }),
      }),
    }),
  }),
};

describe("MonthlySpendingRepository", () => {
  it("returns properly shaped MonthlyTransactionRow objects", async () => {
    const repo = new MonthlySpendingRepository(mockSupabase as SupabaseClient);
    const txs = await repo.getMonthlyTransactions(
      DateTime.now().minus({ days: 30 }),
      DateTime.now()
    );

    expect(txs.length).toBe(1);
    expect(txs[0].merchant_id).toBe("m1");
    expect(txs[0].payment_method_display_name).toBe("Amex True Cashback");
    expect(txs[0].amount).toBe(100);
  });
});
