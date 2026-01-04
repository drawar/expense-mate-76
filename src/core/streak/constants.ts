// src/core/streak/constants.ts

import { Badge, BadgeMilestone } from "./types";

export const BADGE_DEFINITIONS: Record<BadgeMilestone, Badge> = {
  3: {
    milestone: 3,
    name: "Budget Rookie",
    emoji: "\u{1F949}", // 🥉
    tier: "bronze",
    description: "3 days under forecast",
  },
  7: {
    milestone: 7,
    name: "Week Warrior",
    emoji: "\u{1F948}", // 🥈
    tier: "silver",
    description: "1 week under forecast",
  },
  14: {
    milestone: 14,
    name: "Fortnight Fighter",
    emoji: "\u{1F947}", // 🥇
    tier: "gold",
    description: "2 weeks under forecast",
  },
  30: {
    milestone: 30,
    name: "Budget Champion",
    emoji: "\u{1F48E}", // 💎
    tier: "diamond",
    description: "Full month under forecast",
  },
};

export const BADGE_MILESTONES: BadgeMilestone[] = [3, 7, 14, 30];

export const STREAK_FIRE_EMOJI = "\u{1F525}"; // 🔥
