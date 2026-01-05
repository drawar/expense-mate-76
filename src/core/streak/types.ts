// src/core/streak/types.ts

export type BadgeMilestone = 3 | 7 | 14 | 30;

export type BadgeTier = "bronze" | "silver" | "gold" | "diamond";

export interface Badge {
  milestone: BadgeMilestone;
  name: string;
  tier: BadgeTier;
  description: string;
}

export interface EarnedBadge {
  milestone: BadgeMilestone;
  earnedAt: string; // ISO date string
  month: string; // "YYYY-MM" format
}

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastCheckedDate: string | null;
  earnedBadges: EarnedBadge[];
}

export interface StreakCalculation {
  currentStreak: number;
  isBroken: boolean;
  lastOnTrackDate: string | null;
}

export interface NextBadgeProgress {
  milestone: BadgeMilestone;
  remaining: number;
  progress: number; // 0-1
}
