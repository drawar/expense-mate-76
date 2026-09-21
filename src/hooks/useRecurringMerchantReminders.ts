/**
 * Recurring-merchant reminders for the quick-add form.
 *
 * Computes once per calendar day per session using a react-query key
 * that includes today's date. Under the hood it walks all transactions
 * (via useTransactionsQuery, itself cached with staleTime 5 min) so
 * the extra work here is bounded to the one classifier pass plus the
 * proximity filter.
 *
 * Returns [] when there are no transactions yet, when no merchants
 * qualify as recurring, or when nothing is due within ±tolerance.
 */

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";

import { useTransactionsQuery } from "@/hooks/queries/useTransactionsQuery";
import {
  detectRecurringMerchantsForToday,
  type RecurringReminder,
} from "@/core/forecast/RecurringMerchantReminder";

interface Options {
  /** Override "today" (defaults to browser now). Useful for tests. */
  today?: Date;
  /** Days of proximity to expectedDay to count as "due". Default 2. */
  tolerance?: number;
}

export function useRecurringMerchantReminders(options: Options = {}): {
  data: RecurringReminder[];
  isLoading: boolean;
} {
  const { today = new Date(), tolerance = 2 } = options;
  const { data: transactions = [], isLoading: isLoadingTxs } =
    useTransactionsQuery();

  const todayKey = format(today, "yyyy-MM-dd");

  const query = useQuery({
    queryKey: [
      "recurringMerchantReminders",
      todayKey,
      tolerance,
      transactions.length,
    ] as const,
    queryFn: () =>
      detectRecurringMerchantsForToday(transactions, today, tolerance),
    enabled: !isLoadingTxs && transactions.length > 0,
    staleTime: 60 * 60 * 1000, // 1 hour — day-key invalidates naturally
  });

  return useMemo(
    () => ({
      data: query.data ?? [],
      isLoading: isLoadingTxs || query.isLoading,
    }),
    [query.data, query.isLoading, isLoadingTxs]
  );
}
