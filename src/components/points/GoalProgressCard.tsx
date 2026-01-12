/**
 * GoalProgressCard - Display goal with progress bar
 */

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Target,
  Plane,
  Hotel,
  Package,
  MoreHorizontal,
  Calendar,
  Edit2,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { format, formatDistanceToNow, isPast } from "date-fns";
import { cn } from "@/lib/utils";
import type { PointsGoal, BalanceBreakdown } from "@/core/points/types";

interface GoalProgressCardProps {
  goal: PointsGoal;
  currentBalance?: number;
  breakdown?: BalanceBreakdown;
  onEdit?: () => void;
  onComplete?: () => void;
  onCancel?: () => void;
  className?: string;
}

export function GoalProgressCard({
  goal,
  currentBalance = 0,
  onEdit,
  onComplete,
  onCancel,
  className,
}: GoalProgressCardProps) {
  const progressPercent = Math.min(
    (currentBalance / goal.targetPoints) * 100,
    100
  );
  const pointsRemaining = Math.max(goal.targetPoints - currentBalance, 0);
  const isAchieved = currentBalance >= goal.targetPoints;
  const isOverdue = goal.targetDate && isPast(goal.targetDate);

  // Get icon based on goal type
  const getGoalIcon = () => {
    switch (goal.goalType) {
      case "flight":
        return <Plane className="h-4 w-4" />;
      case "hotel":
        return <Hotel className="h-4 w-4" />;
      case "merchandise":
        return <Package className="h-4 w-4" />;
      default:
        return <Target className="h-4 w-4" />;
    }
  };

  // Get priority badge color
  const getPriorityColor = () => {
    switch (goal.priority) {
      case 1:
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
      case 2:
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
      case 3:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
    }
  };

  const getPriorityLabel = () => {
    switch (goal.priority) {
      case 1:
        return "High";
      case 2:
        return "Medium";
      case 3:
        return "Low";
      default:
        return "Normal";
    }
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString(undefined, { maximumFractionDigits: 0 });
  };

  return (
    <Card className={cn("relative", className)}>
      <CardContent className="pt-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center",
                isAchieved
                  ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
                  : "bg-primary/10 text-primary"
              )}
            >
              {isAchieved ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                getGoalIcon()
              )}
            </div>
            <div>
              <h4 className="font-medium text-sm">{goal.goalName}</h4>
              <p className="text-xs text-muted-foreground">
                {goal.rewardCurrency?.displayName}
              </p>
            </div>
          </div>

          {/* Actions */}
          {onEdit && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={onEdit}
            >
              <Edit2 className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Flight details if applicable */}
        {goal.goalType === "flight" &&
          (goal.targetRoute || goal.targetCabin) && (
            <div className="text-xs text-muted-foreground mb-3">
              {goal.targetRoute && <span>{goal.targetRoute}</span>}
              {goal.targetRoute && goal.targetCabin && <span> • </span>}
              {goal.targetCabin && (
                <span className="capitalize">
                  {goal.targetCabin.replace("_", " ")}
                </span>
              )}
            </div>
          )}

        {/* Description */}
        {goal.goalDescription && (
          <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
            {goal.goalDescription}
          </p>
        )}

        {/* Progress Bar */}
        <div className="space-y-2 mb-4">
          <Progress value={progressPercent} className="h-2" />
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">
              {formatNumber(currentBalance)} / {formatNumber(goal.targetPoints)}
            </span>
            <span
              className={cn(
                "font-medium",
                isAchieved ? "text-green-600" : "text-foreground"
              )}
            >
              {progressPercent.toFixed(0)}%
            </span>
          </div>
        </div>

        {/* Points remaining or achieved */}
        {isAchieved ? (
          <div className="flex items-center gap-1 text-sm text-green-600 mb-3">
            <CheckCircle2 className="h-4 w-4" />
            Goal achieved! Ready to redeem
          </div>
        ) : (
          <p className="text-sm text-muted-foreground mb-3">
            <span className="font-medium text-foreground">
              {formatNumber(pointsRemaining)}
            </span>{" "}
            points to go
          </p>
        )}

        {/* Footer - date and priority */}
        <div className="flex items-center justify-between text-xs">
          {/* Target date */}
          {goal.targetDate ? (
            <div
              className={cn(
                "flex items-center gap-1",
                isOverdue && !isAchieved
                  ? "text-red-600"
                  : "text-muted-foreground"
              )}
            >
              <Calendar className="h-3 w-3" />
              {isOverdue && !isAchieved ? (
                <span>Overdue by {formatDistanceToNow(goal.targetDate)}</span>
              ) : (
                <span>Target: {format(goal.targetDate, "MMM d, yyyy")}</span>
              )}
            </div>
          ) : (
            <div />
          )}

          {/* Priority badge */}
          <span
            className={cn(
              "px-2 py-0.5 rounded text-xs font-medium",
              getPriorityColor()
            )}
          >
            {getPriorityLabel()}
          </span>
        </div>

        {/* Action buttons for achieved goals */}
        {isAchieved && (onComplete || onCancel) && (
          <div className="flex gap-2 mt-4 pt-4 border-t">
            {onComplete && (
              <Button size="sm" className="flex-1" onClick={onComplete}>
                <CheckCircle2 className="h-4 w-4 mr-1" />
                Mark Complete
              </Button>
            )}
            {onCancel && (
              <Button size="sm" variant="outline" onClick={onCancel}>
                <XCircle className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * GoalProgressList - List of goal cards
 */
interface GoalProgressListProps {
  goals: PointsGoal[];
  balances: Map<string, number>; // rewardCurrencyId -> currentBalance
  onEditGoal?: (goal: PointsGoal) => void;
  onCompleteGoal?: (goal: PointsGoal) => void;
  onCancelGoal?: (goal: PointsGoal) => void;
  emptyMessage?: string;
}

export function GoalProgressList({
  goals,
  balances,
  onEditGoal,
  onCompleteGoal,
  onCancelGoal,
  emptyMessage = "No active goals",
}: GoalProgressListProps) {
  if (!goals || goals.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  // Sort by priority (1 = high), then by closest to target
  const sortedGoals = [...goals].sort((a, b) => {
    // First by priority
    if (a.priority !== b.priority) {
      return a.priority - b.priority;
    }
    // Then by progress percentage (higher first)
    const aBalance = balances.get(a.rewardCurrencyId) || 0;
    const bBalance = balances.get(b.rewardCurrencyId) || 0;
    const aProgress = aBalance / a.targetPoints;
    const bProgress = bBalance / b.targetPoints;
    return bProgress - aProgress;
  });

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {sortedGoals.map((goal) => (
        <GoalProgressCard
          key={goal.id}
          goal={goal}
          currentBalance={balances.get(goal.rewardCurrencyId) || 0}
          onEdit={onEditGoal ? () => onEditGoal(goal) : undefined}
          onComplete={onCompleteGoal ? () => onCompleteGoal(goal) : undefined}
          onCancel={onCancelGoal ? () => onCancelGoal(goal) : undefined}
        />
      ))}
    </div>
  );
}

export default GoalProgressCard;
