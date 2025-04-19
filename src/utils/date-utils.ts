import { DateTime } from "luxon";
import {
  SpendingPeriodType,
  SpendingPeriodScope,
  SpendingFilter,
} from "@/core/rewards/types";

export interface DateRange {
  startDate: DateTime;
  endDate: DateTime;
}

export function calculateDateRange(filter: SpendingFilter): DateRange {
  const base = DateTime.fromJSDate(filter.date ?? new Date());
  const statementDay = filter.statementDay ?? 1;
  let current: DateTime;

  if (filter.scope === "previous") {
    current = base.minus({ months: 1 });
  } else {
    current = base;
  }

  if (filter.type === "calendar_month") {
    const startDate = current.startOf("month");
    const endDate = current.endOf("month").plus({ days: 1 }); // exclusive
    return { startDate, endDate };
  } else if (filter.type === "statement_month") {
    const anchorDay = statementDay;
    const anchor = current.set({ day: anchorDay });

    let startDate: DateTime;
    if (current.day >= anchorDay) {
      startDate = anchor;
    } else {
      startDate = anchor.minus({ months: 1 });
    }

    const endDate = startDate.plus({ months: 1 });
    return { startDate, endDate };
  }

  throw new Error("Unknown period type");
}

export function createDateCacheKey(
  paymentMethodId: string,
  filter: SpendingFilter
): string {
  const period = calculateDateRange(filter);
  return `${paymentMethodId}-${filter.type}-${filter.scope}-${period.startDate.toISODate()}`;
}
