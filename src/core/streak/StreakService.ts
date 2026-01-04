// src/core/streak/StreakService.ts

import { DailyForecast } from "@/core/forecast/types";
import { BADGE_MILESTONES, BADGE_DEFINITIONS } from "./constants";
import {
  BadgeMilestone,
  EarnedBadge,
  NextBadgeProgress,
  StreakCalculation,
} from "./types";
import { format } from "date-fns";

export class StreakService {
  /**
   * Calculate current streak from daily forecast data.
   * Streak counts consecutive days from month start where
   * cumulativeActual <= cumulativeForecast.
   */
  calculateStreak(dailyForecasts: DailyForecast[]): StreakCalculation {
    let streak = 0;
    let lastOnTrackDate: string | null = null;

    // Sort by date to ensure correct order
    const sortedForecasts = [...dailyForecasts].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Filter to only days with actual data
    const daysWithActuals = sortedForecasts.filter(
      (day) =>
        day.actualAmount !== undefined && day.cumulativeActual !== undefined
    );

    if (daysWithActuals.length === 0) {
      return { currentStreak: 0, isBroken: false, lastOnTrackDate: null };
    }

    // Check if user is currently on track (last day with data)
    const lastDay = daysWithActuals[daysWithActuals.length - 1];
    const isCurrentlyOnTrack =
      lastDay.cumulativeActual! <= lastDay.cumulativeForecast;

    // If currently over forecast, streak is broken (0)
    if (!isCurrentlyOnTrack) {
      return { currentStreak: 0, isBroken: true, lastOnTrackDate: null };
    }

    // Count consecutive days from start where cumulative stayed under forecast
    for (const day of daysWithActuals) {
      const isOnTrack = day.cumulativeActual! <= day.cumulativeForecast;

      if (isOnTrack) {
        streak++;
        lastOnTrackDate = day.date;
      } else {
        // This shouldn't happen if isCurrentlyOnTrack is true, but safety check
        break;
      }
    }

    return {
      currentStreak: streak,
      isBroken: false,
      lastOnTrackDate,
    };
  }

  /**
   * Check if user has earned any new badges based on current streak.
   * Returns array of newly earned badge milestones.
   */
  checkNewBadges(
    currentStreak: number,
    earnedBadges: EarnedBadge[],
    currentMonth: string
  ): BadgeMilestone[] {
    const newBadges: BadgeMilestone[] = [];

    // Get milestones already earned this month
    const earnedThisMonth = new Set(
      earnedBadges
        .filter((b) => b.month === currentMonth)
        .map((b) => b.milestone)
    );

    // Check each milestone
    for (const milestone of BADGE_MILESTONES) {
      if (currentStreak >= milestone && !earnedThisMonth.has(milestone)) {
        newBadges.push(milestone);
      }
    }

    return newBadges;
  }

  /**
   * Get progress towards the next badge milestone.
   */
  getNextBadgeProgress(currentStreak: number): NextBadgeProgress | null {
    // Find the next milestone user hasn't reached
    const nextMilestone = BADGE_MILESTONES.find((m) => currentStreak < m);

    if (!nextMilestone) {
      // User has earned all badges!
      return null;
    }

    // Find previous milestone for progress calculation
    const prevMilestoneIndex = BADGE_MILESTONES.indexOf(nextMilestone) - 1;
    const prevMilestone =
      prevMilestoneIndex >= 0 ? BADGE_MILESTONES[prevMilestoneIndex] : 0;

    const progressRange = nextMilestone - prevMilestone;
    const progressAmount = currentStreak - prevMilestone;
    const progress = progressAmount / progressRange;

    return {
      milestone: nextMilestone,
      remaining: nextMilestone - currentStreak,
      progress: Math.min(1, Math.max(0, progress)),
    };
  }

  /**
   * Create EarnedBadge objects for newly earned milestones.
   */
  createEarnedBadges(
    milestones: BadgeMilestone[],
    currentMonth: string
  ): EarnedBadge[] {
    const today = format(new Date(), "yyyy-MM-dd");

    return milestones.map((milestone) => ({
      milestone,
      earnedAt: today,
      month: currentMonth,
    }));
  }

  /**
   * Get badge definition by milestone.
   */
  getBadgeDefinition(milestone: BadgeMilestone) {
    return BADGE_DEFINITIONS[milestone];
  }

  /**
   * Format streak for display.
   */
  formatStreakDisplay(streak: number): string {
    if (streak === 0) return "No streak";
    if (streak === 1) return "1 day streak";
    return `${streak} day streak`;
  }
}

// Export singleton instance
export const streakService = new StreakService();
