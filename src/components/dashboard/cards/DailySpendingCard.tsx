// components/dashboard/cards/DailySpendingCard.tsx
/**
 * Daily Spending Card - TimeRange heatmap showing spending by day
 */

import React, { useMemo } from "react";
import { CalendarDaysIcon } from "lucide-react";
import { ResponsiveTimeRange } from "@nivo/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Transaction } from "@/types";
import { useDashboardContext } from "@/contexts/DashboardContext";
import { useCurrencyFormatter } from "@/hooks/useCurrencyFormatter";

interface DailySpendingCardProps {
  className?: string;
  transactions?: Transaction[];
}

const DailySpendingCard: React.FC<DailySpendingCardProps> = ({
  className = "",
  transactions = [],
}) => {
  const { displayCurrency } = useDashboardContext();
  const { formatCurrency } = useCurrencyFormatter(displayCurrency);

  // Calculate daily spending for TimeRange chart
  const dailySpendingData = useMemo(() => {
    const dailyTotals = new Map<string, number>();

    transactions.forEach((tx) => {
      if (tx.date && tx.amount > 0) {
        const dateStr = tx.date.split("T")[0]; // Get YYYY-MM-DD
        const amount = tx.paymentAmount ?? tx.amount;
        dailyTotals.set(dateStr, (dailyTotals.get(dateStr) || 0) + amount);
      }
    });

    return Array.from(dailyTotals.entries()).map(([day, value]) => ({
      day,
      value: Math.round(value * 100) / 100,
    }));
  }, [transactions]);

  // Get date range for current period
  const { periodStartDate, periodEndDate } = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const start = new Date(currentYear, currentMonth, 1);
    const end = new Date(currentYear, currentMonth + 1, 0);
    return {
      periodStartDate: start.toISOString().split("T")[0],
      periodEndDate: end.toISOString().split("T")[0],
    };
  }, []);

  // Calculate total and average
  const { total, average, daysWithSpending } = useMemo(() => {
    const total = dailySpendingData.reduce((sum, d) => sum + d.value, 0);
    const daysWithSpending = dailySpendingData.length;
    const average = daysWithSpending > 0 ? total / daysWithSpending : 0;
    return { total, average, daysWithSpending };
  }, [dailySpendingData]);

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-xl flex items-center gap-2">
          <CalendarDaysIcon className="h-5 w-5 text-primary" />
          Daily Spending
        </CardTitle>
      </CardHeader>
      <CardContent>
        {dailySpendingData.length > 0 ? (
          <>
            <div className="h-44">
              <ResponsiveTimeRange
                data={dailySpendingData}
                from={periodStartDate}
                to={periodEndDate}
                direction="vertical"
                weekdays={["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]}
                weekdayLegendOffset={6}
                firstWeekday="monday"
                emptyColor="#f3f4f6"
                colors={["#fde8dc", "#f5c4a8", "#e8a07a", "#d4845c", "#b86543"]}
                margin={{ top: 40, right: 10, bottom: 10, left: 40 }}
                dayBorderWidth={2}
                dayBorderColor="#ffffff"
                tooltip={({ day, value }) => (
                  <div className="bg-popover text-popover-foreground px-3 py-2 rounded-md shadow-md border text-sm">
                    <div className="font-medium">{day}</div>
                    <div>
                      Spent: <strong>{formatCurrency(value)}</strong>
                    </div>
                  </div>
                )}
              />
            </div>
            <div className="flex justify-between text-sm text-muted-foreground mt-2 pt-2 border-t border-border/30">
              <span>
                Avg:{" "}
                <strong className="text-foreground">
                  {formatCurrency(average)}
                </strong>
                /day
              </span>
              <span>
                <strong className="text-foreground">{daysWithSpending}</strong>{" "}
                days with spending
              </span>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            No spending data for this period
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default React.memo(DailySpendingCard);
