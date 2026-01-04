/**
 * Hook for tracking budget streaks with Supabase persistence
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { Currency } from "@/types";
import { ForecastResult } from "@/core/forecast/types";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  streakService,
  EarnedBadge,
  BadgeMilestone,
  NextBadgeProgress,
} from "@/core/streak";
import { format } from "date-fns";

interface StreakDbRow {
  current_streak: number;
  longest_streak: number;
  last_checked_date: string | null;
  earned_badges: EarnedBadge[];
}

interface BudgetStreakResult {
  /** Current streak count (days under forecast) */
  currentStreak: number;
  /** Longest streak ever achieved */
  longestStreak: number;
  /** Badges earned (all time) */
  earnedBadges: EarnedBadge[];
  /** Progress towards next badge */
  nextBadge: NextBadgeProgress | null;
  /** Whether streak data is loading */
  isLoading: boolean;
  /** Whether streak is currently broken (over forecast) */
  isBroken: boolean;
  /** Newly earned badges this session (for celebration) */
  newlyEarnedBadges: BadgeMilestone[];
  /** Clear newly earned badges (after showing celebration) */
  clearNewlyEarned: () => void;
}

/**
 * Hook to track and persist budget streak data
 */
export function useBudgetStreak(
  currency: Currency,
  forecast: ForecastResult | null
): BudgetStreakResult {
  const { user } = useAuth();
  const [dbData, setDbData] = useState<StreakDbRow | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [newlyEarnedBadges, setNewlyEarnedBadges] = useState<BadgeMilestone[]>(
    []
  );

  // Load streak data from Supabase
  useEffect(() => {
    const loadStreak = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("budget_streaks")
          .select(
            "current_streak, longest_streak, last_checked_date, earned_badges"
          )
          .eq("user_id", user.id)
          .eq("currency", currency)
          .single();

        if (error && error.code !== "PGRST116") {
          console.error("Error loading streak:", error);
        }

        if (data) {
          setDbData({
            current_streak: data.current_streak,
            longest_streak: data.longest_streak,
            last_checked_date: data.last_checked_date,
            earned_badges: (data.earned_badges as EarnedBadge[]) || [],
          });
        } else {
          setDbData(null);
        }
      } catch (error) {
        console.error("Error loading streak:", error);
        setDbData(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadStreak();
  }, [user, currency]);

  // Calculate current streak from forecast data
  const calculatedStreak = useMemo(() => {
    if (!forecast?.dailyForecasts) {
      return { currentStreak: 0, isBroken: false, lastOnTrackDate: null };
    }
    return streakService.calculateStreak(forecast.dailyForecasts);
  }, [forecast?.dailyForecasts]);

  // Get current month for badge tracking
  const currentMonth = useMemo(() => {
    return format(new Date(), "yyyy-MM");
  }, []);

  // Save streak to database
  const saveStreak = useCallback(
    async (
      currentStreak: number,
      longestStreak: number,
      earnedBadges: EarnedBadge[]
    ) => {
      if (!user) return;

      const today = format(new Date(), "yyyy-MM-dd");

      try {
        const { error } = await supabase.from("budget_streaks").upsert(
          {
            user_id: user.id,
            currency,
            current_streak: currentStreak,
            longest_streak: longestStreak,
            last_checked_date: today,
            earned_badges: earnedBadges,
          },
          {
            onConflict: "user_id,currency",
          }
        );

        if (error) {
          console.error("Error saving streak:", error);
        }
      } catch (error) {
        console.error("Error saving streak:", error);
      }
    },
    [user, currency]
  );

  // Update streak and check for new badges when forecast changes
  useEffect(() => {
    if (isLoading || !forecast) return;

    const { currentStreak } = calculatedStreak;
    const existingBadges = dbData?.earned_badges || [];
    const existingLongest = dbData?.longest_streak || 0;

    // Check for new badges
    const newBadgeMilestones = streakService.checkNewBadges(
      currentStreak,
      existingBadges,
      currentMonth
    );

    if (newBadgeMilestones.length > 0) {
      setNewlyEarnedBadges(newBadgeMilestones);
    }

    // Create new badge objects
    const newBadgeObjects = streakService.createEarnedBadges(
      newBadgeMilestones,
      currentMonth
    );

    // Merge with existing badges
    const allBadges = [...existingBadges, ...newBadgeObjects];

    // Calculate longest streak
    const newLongest = Math.max(existingLongest, currentStreak);

    // Check if we need to save (streak changed or new badges)
    const streakChanged = currentStreak !== (dbData?.current_streak || 0);
    const longestChanged = newLongest !== existingLongest;
    const badgesChanged = newBadgeMilestones.length > 0;

    if (streakChanged || longestChanged || badgesChanged) {
      // Update local state
      setDbData({
        current_streak: currentStreak,
        longest_streak: newLongest,
        last_checked_date: format(new Date(), "yyyy-MM-dd"),
        earned_badges: allBadges,
      });

      // Save to database
      saveStreak(currentStreak, newLongest, allBadges);
    }
  }, [calculatedStreak, currentMonth, dbData, forecast, isLoading, saveStreak]);

  // Get next badge progress
  const nextBadge = useMemo(() => {
    return streakService.getNextBadgeProgress(calculatedStreak.currentStreak);
  }, [calculatedStreak.currentStreak]);

  // Clear newly earned badges (call after showing celebration)
  const clearNewlyEarned = useCallback(() => {
    setNewlyEarnedBadges([]);
  }, []);

  return {
    currentStreak: calculatedStreak.currentStreak,
    longestStreak: dbData?.longest_streak || 0,
    earnedBadges: dbData?.earned_badges || [],
    nextBadge,
    isLoading,
    isBroken: calculatedStreak.isBroken,
    newlyEarnedBadges,
    clearNewlyEarned,
  };
}
