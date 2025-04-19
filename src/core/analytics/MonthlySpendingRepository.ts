// src/core/analytics/MonthlySpendingRepository.ts

import { SupabaseClient } from "@supabase/supabase-js";
import { DateTime } from "luxon";
import { MonthlyTransactionRow } from "../rewards/types";

export class MonthlySpendingRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async getMonthlyTransactions(
    startDate: DateTime,
    endDate: DateTime,
    filters?: {
      paymentMethodId?: string;
      merchantId?: string;
      category?: string;
    }
  ): Promise<MonthlyTransactionRow[]> {
    let query = this.supabase
      .from("transactions")
      .select(
        `
        id,
        amount,
        currency,
        payment_amount,
        payment_currency,
        date,
        category,
        merchant_id,
        payment_method_id,
        merchant:merchants (
          id,
          name
        ),
        paymentMethod:payment_methods (
          id,
          name,
          issuer
        )
      `
      )
      .gte("date", startDate.toISO())
      .lt("date", endDate.toISO());

    if (filters?.paymentMethodId) {
      query = query.eq("payment_method_id", filters.paymentMethodId);
    }

    if (filters?.merchantId) {
      query = query.eq("merchant_id", filters.merchantId);
    }

    if (filters?.category) {
      query = query.eq("category", filters.category);
    }

    const { data, error } = await query;

    if (error || !data) {
      console.error("[MonthlySpendingRepository] Supabase error:", error);
      return [];
    }

    return (
      data as Array<{
        id: string;
        merchant_id: string;
        payment_method_id: string;
        amount: number;
        currency: string;
        payment_amount: number;
        payment_currency: string;
        date: string;
        category: string;
        merchant?: { name: string };
        paymentMethod?: { issuer: string; name: string };
      }>
    ).map((row) => ({
      id: row.id,
      merchant_id: row.merchant_id,
      payment_method_id: row.payment_method_id,

      amount: row.amount,
      currency: row.currency,
      payment_amount: row.payment_amount,
      payment_currency: row.payment_currency,

      date: row.date,
      category: row.category,

      merchant_name: row.merchant?.name,
      payment_method_display_name:
        `${row.paymentMethod?.issuer ?? ""} ${row.paymentMethod?.name ?? ""}`.trim(),
    }));
  }
}
