// src/components/streak/StreakDisplay.tsx

import { EarnedBadge, NextBadgeProgress } from "@/core/streak/types";
import { BADGE_DEFINITIONS } from "@/core/streak/constants";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { format, startOfMonth } from "date-fns";
import { BadgeIcon, UI_ICONS } from "@/utils/constants/icons";

interface StreakDisplayProps {
  streak: number;
  badges: EarnedBadge[];
  nextBadge: NextBadgeProgress | null;
  currentMonth: string;
}

export function StreakDisplay({
  streak,
  badges,
  nextBadge,
  currentMonth,
}: StreakDisplayProps) {
  // Get badges earned this month that are actually valid for current streak
  const badgesThisMonth = badges.filter(
    (b) => b.month === currentMonth && b.milestone <= streak
  );

  // Calculate streak start date (start of current month)
  const streakStartDate = format(startOfMonth(new Date()), "MMM d");

  // No active streak - show encouragement message
  if (streak === 0) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <p className="text-xs text-muted-foreground cursor-help">
            Stay under forecast to start your streak
          </p>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-[240px]">
          <p className="font-medium text-xs mb-1">How streaks work</p>
          <p className="text-xs text-muted-foreground">
            Your streak counts consecutive days since {streakStartDate} where
            your <span className="font-medium">cumulative spending</span> stayed
            at or below the cumulative forecast.
          </p>
          <p className="text-xs text-muted-foreground mt-1.5">
            The streak resets if your total spending exceeds the forecast, or at
            the start of each month.
          </p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <div className="flex flex-col gap-0.5">
      {/* Main streak info */}
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-1.5 cursor-help">
            <UI_ICONS.fire size={18} className="text-orange-500" />
            <span className="text-xs font-medium text-foreground">
              {streak} day{streak !== 1 ? "s" : ""} under forecast
            </span>
            {/* Earned badges */}
            {badgesThisMonth.map((badge) => (
              <BadgeIcon
                key={badge.milestone}
                tier={BADGE_DEFINITIONS[badge.milestone].tier}
                size={16}
              />
            ))}
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-[240px]">
          <p className="font-medium text-xs mb-1">How streaks work</p>
          <p className="text-xs text-muted-foreground">
            Your streak counts consecutive days since {streakStartDate} where
            your <span className="font-medium">cumulative spending</span> stayed
            at or below the cumulative forecast.
          </p>
          <p className="text-xs text-muted-foreground mt-1.5">
            The streak resets if your total spending exceeds the forecast, or at
            the start of each month.
          </p>
        </TooltipContent>
      </Tooltip>

      {/* Progress to next badge */}
      {nextBadge && (
        <p className="text-[11px] text-muted-foreground ml-6 flex items-center gap-1">
          {nextBadge.remaining} more day{nextBadge.remaining !== 1 ? "s" : ""}{" "}
          to{" "}
          <BadgeIcon
            tier={BADGE_DEFINITIONS[nextBadge.milestone].tier}
            size={12}
          />{" "}
          {BADGE_DEFINITIONS[nextBadge.milestone].name}
        </p>
      )}
    </div>
  );
}
