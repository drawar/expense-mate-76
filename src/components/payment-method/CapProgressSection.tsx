import React, { useEffect, useState } from "react";
import { Progress } from "@/components/ui/progress";
import { RewardRule, SpendingPeriodType } from "@/core/rewards/types";
import { bonusPointsTracker } from "@/core/rewards/BonusPointsTracker";

interface CapProgressSectionProps {
  paymentMethodId: string;
  rewardRules: RewardRule[];
  statementDay?: number;
  /** Optional transaction count that triggers a refresh when changed */
  transactionCount?: number;
}

interface CapUsageInfo {
  identifier: string;
  name: string;
  used: number;
  cap: number;
  capType: "bonus_points" | "spend_amount";
  periodType: SpendingPeriodType;
  validUntil?: Date;
  percentage: number;
}

/**
 * CapProgressSection displays progress bars for reward rules with caps
 * Shows current usage vs cap limit with color-coded indicators
 */
export function CapProgressSection({
  paymentMethodId,
  rewardRules,
  statementDay = 1,
  transactionCount,
}: CapProgressSectionProps) {
  const [capUsages, setCapUsages] = useState<CapUsageInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCapUsage = async () => {
      setLoading(true);
      try {
        // Clear cache for this payment method to ensure fresh data from database
        // This is important because cap usage may have been updated by a recent transaction
        bonusPointsTracker.clearCacheForPaymentMethod(paymentMethodId);

        const usageMap = await bonusPointsTracker.getCapUsageForRules(
          rewardRules,
          paymentMethodId,
          statementDay
        );

        // Build the cap usages array, grouping rules by capGroupId
        const processedCapGroups = new Set<string>();
        const usages: CapUsageInfo[] = [];

        const now = new Date();

        for (const rule of rewardRules) {
          if (!rule.reward.monthlyCap) continue;

          const capGroupId = rule.reward.capGroupId;
          const identifier = capGroupId || rule.id;

          // Skip if we already processed this cap group
          if (processedCapGroups.has(identifier)) continue;
          processedCapGroups.add(identifier);

          const usage = usageMap.get(identifier);
          if (!usage) continue;

          // Skip expired promotional trackers
          if (
            usage.periodType === "promotional" &&
            usage.validUntil &&
            usage.validUntil < now
          ) {
            continue;
          }

          const percentage = Math.min(100, (usage.used / usage.cap) * 100);

          // For shared caps, find all rules that share this cap and create a combined name
          let name = rule.name;
          if (capGroupId) {
            const sharedRules = rewardRules.filter(
              (r) => r.reward.capGroupId === capGroupId
            );
            if (sharedRules.length > 1) {
              // Use a shortened combined name or just "Promotional Cap"
              const isPromo = usage.periodType === "promotional";
              name = isPromo
                ? "Promotional Bonus Cap"
                : `${sharedRules.length} Rules Shared Cap`;
            }
          }

          usages.push({
            identifier,
            name,
            used: usage.used,
            cap: usage.cap,
            capType: usage.capType,
            periodType: usage.periodType,
            validUntil: usage.validUntil,
            percentage,
          });
        }

        setCapUsages(usages);
      } catch (error) {
        console.error("Error fetching cap usage:", error);
      } finally {
        setLoading(false);
      }
    };

    if (rewardRules.length > 0) {
      fetchCapUsage();
    } else {
      setCapUsages([]);
      setLoading(false);
    }
  }, [paymentMethodId, rewardRules, statementDay, transactionCount]);

  // Don't render if no capped rules
  if (capUsages.length === 0 && !loading) {
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
      return `$${used.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })} / $${cap.toLocaleString()} spent`;
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
      case "calendar":
        return "Resets monthly";
      case "statement":
      case "statement_month":
        return "Resets each statement";
      case "promotional":
        return "Promotional period";
      default:
        return "";
    }
  };

  if (loading) {
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
              {usage.name}
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
            {usage.periodType === "promotional" && usage.validUntil && (
              <span>Valid until {formatDate(usage.validUntil)}</span>
            )}
            {usage.periodType !== "promotional" && (
              <span>{usage.percentage.toFixed(0)}% used</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export default CapProgressSection;
