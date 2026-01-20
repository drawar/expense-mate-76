import React from "react";
import { Progress } from "@/components/ui/progress";
import { RewardRule, SpendingPeriodType } from "@/core/rewards/types";
import { PaymentMethod } from "@/types";
import { useCapUsage } from "@/hooks/useCapUsage";

interface CapProgressSectionProps {
  paymentMethod: PaymentMethod;
  rewardRules: RewardRule[];
}

/**
 * CapProgressSection displays progress bars for reward rules with caps.
 *
 * Computes cap usage directly from transactions - no separate tracking table.
 * Automatically updates when transactions change via React Query.
 *
 * Only shows progress bars for rules with non-null cap_duration.
 */
export function CapProgressSection({
  paymentMethod,
  rewardRules,
}: CapProgressSectionProps) {
  const { data: capUsages, isLoading } = useCapUsage(
    paymentMethod,
    rewardRules
  );

  // Don't render if no capped rules
  if (capUsages.length === 0 && !isLoading) {
    return null;
  }

  // Get progress bar color based on percentage
  const getProgressColor = (percentage: number): string => {
    if (percentage >= 90) return "bg-[var(--color-error)]";
    if (percentage >= 70) return "bg-[var(--color-warning)]";
    return "bg-[var(--color-success)]";
  };

  // Format usage display
  const formatUsage = (
    used: number,
    cap: number,
    capType: "bonus_points" | "spend_amount"
  ): string => {
    if (capType === "spend_amount") {
      return `$${used.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / $${cap.toLocaleString()} spent`;
    }
    return `${used.toLocaleString()} / ${cap.toLocaleString()} pts`;
  };

  // Format date for display
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Get period label
  const getPeriodLabel = (periodType: SpendingPeriodType): string => {
    switch (periodType) {
      case "calendar_month":
        return "Resets monthly";
      case "statement":
      case "statement_month":
        return "Resets each statement";
      case "promotional_period":
        return "Promotional period";
      default:
        return "";
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3 px-1 py-2">
        <div className="h-1.5 w-full bg-[var(--color-surface)] rounded-full animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-3 px-1 py-2">
      {capUsages.map((usage) => (
        <div key={usage.identifier} className="space-y-1.5">
          <div className="flex justify-between items-center text-xs">
            <span className="text-[var(--color-text-secondary)] font-medium truncate mr-2">
              {usage.ruleName}
            </span>
            <span className="text-[var(--color-text-tertiary)] whitespace-nowrap">
              {formatUsage(usage.used, usage.cap, usage.capType)}
            </span>
          </div>
          <Progress
            value={usage.percentage}
            className="h-1.5"
            indicatorClassName={getProgressColor(usage.percentage)}
          />
          <div className="flex justify-between text-[10px] text-[var(--color-text-tertiary)]">
            <span>{getPeriodLabel(usage.periodType)}</span>
            {usage.periodType === "promotional_period" && usage.validUntil && (
              <span>Valid until {formatDate(usage.validUntil)}</span>
            )}
            {usage.periodType !== "promotional_period" && (
              <span>{usage.percentage.toFixed(0)}% used</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export default CapProgressSection;
