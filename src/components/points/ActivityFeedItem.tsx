/**
 * ActivityFeedItem - Type-specific rendering for activity feed items
 */

import React from "react";
import { format } from "date-fns";
import {
  TrendingUp,
  TrendingDown,
  ArrowRightLeft,
  Plane,
  Gift,
  CreditCard,
  Package,
  MoreHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ActivityItem } from "@/core/points/types";
import { CPPBadge } from "./BalanceCard";

interface ActivityFeedItemProps {
  item: ActivityItem;
  onClick?: () => void;
}

export function ActivityFeedItem({ item, onClick }: ActivityFeedItemProps) {
  const { type, data, date } = item;

  const formatNumber = (num: number) => {
    return num.toLocaleString(undefined, { maximumFractionDigits: 0 });
  };

  // Get icon based on activity type
  const getIcon = () => {
    if (type === "adjustment") {
      return data.amount >= 0 ? (
        <TrendingUp className="h-4 w-4 text-green-500" />
      ) : (
        <TrendingDown className="h-4 w-4 text-red-500" />
      );
    }

    if (type === "redemption") {
      switch (data.redemptionType) {
        case "flight":
          return <Plane className="h-4 w-4 text-blue-500" />;
        case "hotel":
          return <Gift className="h-4 w-4 text-purple-500" />;
        case "cash_back":
        case "statement_credit":
          return <CreditCard className="h-4 w-4 text-orange-500" />;
        case "merchandise":
          return <Package className="h-4 w-4 text-yellow-500" />;
        default:
          return <MoreHorizontal className="h-4 w-4 text-gray-500" />;
      }
    }

    if (type === "transfer") {
      return <ArrowRightLeft className="h-4 w-4 text-blue-500" />;
    }

    return <MoreHorizontal className="h-4 w-4 text-gray-500" />;
  };

  // Get title based on activity type
  const getTitle = () => {
    if (type === "adjustment") {
      const typeLabels: Record<string, string> = {
        bonus: "Bonus",
        correction: "Correction",
        expired: "Points Expired",
        promotional: "Promotional",
        other: "Adjustment",
      };
      return typeLabels[data.adjustmentType] || "Adjustment";
    }

    if (type === "redemption") {
      const typeLabels: Record<string, string> = {
        flight: "Flight Award",
        hotel: "Hotel Reward",
        merchandise: "Merchandise",
        cash_back: "Cash Back",
        statement_credit: "Statement Credit",
        transfer_out: "Transfer Out",
        other: "Redemption",
      };
      return typeLabels[data.redemptionType] || "Redemption";
    }

    if (type === "transfer") {
      return "Points Transfer";
    }

    return "Activity";
  };

  // Get description
  const getDescription = () => {
    if (type === "adjustment") {
      return data.description || "Manual adjustment";
    }

    if (type === "redemption") {
      if (data.redemptionType === "flight" && data.flightRoute) {
        const cabinLabel = data.cabinClass
          ? ` (${data.cabinClass.replace("_", " ")})`
          : "";
        return `${data.flightRoute}${cabinLabel}`;
      }
      return data.description || "Points redeemed";
    }

    if (type === "transfer") {
      const sourceName = data.sourceCurrency?.displayName || "Points";
      const destName = data.destinationCurrency?.displayName || "Miles";
      return `${sourceName} → ${destName}`;
    }

    return "";
  };

  // Get points change
  const getPointsChange = () => {
    if (type === "adjustment") {
      const isPositive = data.amount >= 0;
      return {
        value: data.amount,
        isPositive,
        currency: data.rewardCurrency?.displayName || "pts",
      };
    }

    if (type === "redemption") {
      return {
        value: -data.pointsRedeemed,
        isPositive: false,
        currency: data.rewardCurrency?.displayName || "pts",
      };
    }

    if (type === "transfer") {
      return {
        value: -data.sourceAmount,
        isPositive: false,
        currency: data.sourceCurrency?.displayName || "pts",
        secondaryValue: data.destinationAmount,
        secondaryCurrency: data.destinationCurrency?.displayName || "miles",
      };
    }

    return { value: 0, isPositive: true, currency: "pts" };
  };

  const pointsChange = getPointsChange();

  return (
    <div
      className={cn(
        "flex items-start gap-3 p-3 rounded-lg transition-colors",
        onClick && "hover:bg-muted/50 cursor-pointer"
      )}
      onClick={onClick}
    >
      {/* Icon */}
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
        {getIcon()}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <div className="font-medium text-sm truncate">{getTitle()}</div>
          <div
            className={cn(
              "text-sm font-medium flex-shrink-0",
              pointsChange.isPositive ? "text-green-600" : "text-red-600"
            )}
          >
            {pointsChange.isPositive ? "+" : ""}
            {formatNumber(pointsChange.value)}
          </div>
        </div>

        <div className="text-sm text-muted-foreground truncate">
          {getDescription()}
        </div>

        {/* Secondary info row */}
        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
          <span>{format(date, "MMM d, yyyy")}</span>

          {/* Transfer secondary amount */}
          {type === "transfer" && pointsChange.secondaryValue && (
            <>
              <span>•</span>
              <span className="text-green-600">
                +{formatNumber(pointsChange.secondaryValue)}{" "}
                {pointsChange.secondaryCurrency}
              </span>
            </>
          )}

          {/* CPP for redemptions */}
          {type === "redemption" && data.cpp && (
            <>
              <span>•</span>
              <CPPBadge cpp={data.cpp} />
            </>
          )}

          {/* Transfer bonus */}
          {type === "transfer" && data.transferBonusRate && (
            <>
              <span>•</span>
              <span className="text-green-600">
                +{data.transferBonusRate}% bonus
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * ActivityFeedList - List of activity items with optional grouping
 */
interface ActivityFeedListProps {
  items: ActivityItem[];
  onItemClick?: (item: ActivityItem) => void;
  emptyMessage?: string;
}

export function ActivityFeedList({
  items,
  onItemClick,
  emptyMessage = "No activity yet",
}: ActivityFeedListProps) {
  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="divide-y">
      {items.map((item, index) => (
        <ActivityFeedItem
          key={`${item.type}-${item.data.id}-${index}`}
          item={item}
          onClick={onItemClick ? () => onItemClick(item) : undefined}
        />
      ))}
    </div>
  );
}

export default ActivityFeedItem;
