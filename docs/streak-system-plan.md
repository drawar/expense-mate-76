# Budget Streak System with Badges - Implementation Plan

## Overview

Add a gamified streak system to encourage users to stay under their forecasted
budget. Streaks are cumulative-based (cumulative actual < cumulative forecast)
with badge milestones at 3, 7, 14, and 30 days. Displayed inside
SpendingTrendCard near the spender profile.

## Badge Definitions

| Days | Name              | Emoji | Tier    | Description               |
| ---- | ----------------- | ----- | ------- | ------------------------- |
| 3    | Budget Rookie     | 🥉    | Bronze  | 3 days under forecast     |
| 7    | Week Warrior      | 🥈    | Silver  | 1 week under forecast     |
| 14   | Fortnight Fighter | 🥇    | Gold    | 2 weeks under forecast    |
| 30   | Budget Champion   | 💎    | Diamond | Full month under forecast |

## Visual Design

```
┌─────────────────────────────────────────────────┐
│  🦕 Back Loader Spender        Next 7 days total│
│     84% confidence               C$87.33        │
│                                                 │
│  🔥 15 day streak                               │
│  🥉 🥈 🥇 (badges earned)                       │
└─────────────────────────────────────────────────┘
```

## Streak Logic

**Cumulative-based:** Streak counts consecutive days ending at today where
cumulative actual spending <= cumulative forecasted spending.

**Forgiving recovery:** Unlike strict "from start of month" counting, if you go
over budget but later recover (cumulative drops back under forecast), your
streak restarts from when you got back under budget.

```typescript
function calculateStreak(dailyForecasts: DailyForecast[]): number {
  const daysWithActuals = dailyForecasts.filter(
    (d) => d.actualAmount !== undefined
  );
  if (daysWithActuals.length === 0) return 0;

  // Check if currently on track
  const lastDay = daysWithActuals[daysWithActuals.length - 1];
  if (lastDay.cumulativeActual > lastDay.cumulativeForecast) return 0;

  // Count backwards from today
  let streak = 0;
  for (let i = daysWithActuals.length - 1; i >= 0; i--) {
    if (
      daysWithActuals[i].cumulativeActual <=
      daysWithActuals[i].cumulativeForecast
    ) {
      streak++;
    } else {
      break; // Found a day that was over budget
    }
  }
  return streak;
}
```

**Reset behavior:**

- Streak is 0 when cumulative actual exceeds cumulative forecast
- Streak recovers when you get back under budget (forgiving)
- Streak resets at the start of each month
- Longest streak (all-time) is preserved

## Implementation Steps

### Step 1: Database Migration

Create `supabase/migrations/20260105000000_create_budget_streaks.sql`:

```sql
CREATE TABLE public.budget_streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  currency TEXT NOT NULL,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_checked_date DATE,
  earned_badges JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, currency)
);

-- RLS policies
ALTER TABLE public.budget_streaks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own streaks"
  ON public.budget_streaks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own streaks"
  ON public.budget_streaks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own streaks"
  ON public.budget_streaks FOR UPDATE
  USING (auth.uid() = user_id);
```

### Step 2: Core Types & Constants

Create `src/core/streak/types.ts`:

```typescript
export type BadgeMilestone = 3 | 7 | 14 | 30;

export interface Badge {
  milestone: BadgeMilestone;
  name: string;
  emoji: string;
  tier: "bronze" | "silver" | "gold" | "diamond";
  description: string;
}

export interface EarnedBadge {
  milestone: BadgeMilestone;
  earnedAt: string; // ISO date
  month: string; // "2026-01"
}

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastCheckedDate: string | null;
  earnedBadges: EarnedBadge[];
}
```

Create `src/core/streak/constants.ts`:

```typescript
export const BADGE_DEFINITIONS: Record<BadgeMilestone, Badge> = {
  3: {
    milestone: 3,
    name: "Budget Rookie",
    emoji: "🥉",
    tier: "bronze",
    description: "3 days under forecast",
  },
  7: {
    milestone: 7,
    name: "Week Warrior",
    emoji: "🥈",
    tier: "silver",
    description: "1 week under forecast",
  },
  14: {
    milestone: 14,
    name: "Fortnight Fighter",
    emoji: "🥇",
    tier: "gold",
    description: "2 weeks under forecast",
  },
  30: {
    milestone: 30,
    name: "Budget Champion",
    emoji: "💎",
    tier: "diamond",
    description: "Full month under forecast",
  },
};

export const BADGE_MILESTONES: BadgeMilestone[] = [3, 7, 14, 30];
```

### Step 3: Streak Service

Create `src/core/streak/StreakService.ts`:

```typescript
export class StreakService {
  calculateStreak(dailyForecasts: DailyForecast[]): number;
  checkNewBadges(
    currentStreak: number,
    earnedBadges: EarnedBadge[]
  ): BadgeMilestone[];
  getNextBadgeProgress(currentStreak: number): {
    nextMilestone: BadgeMilestone | null;
    remaining: number;
  };
}
```

### Step 4: React Hook

Create `src/hooks/useBudgetStreak.ts`:

```typescript
export function useBudgetStreak(
  currency: Currency,
  forecast: ForecastResult | null
): {
  currentStreak: number;
  longestStreak: number;
  earnedBadges: EarnedBadge[];
  isLoading: boolean;
  nextBadge: { milestone: BadgeMilestone; remaining: number } | null;
};
```

### Step 5: UI Components

Create `src/components/streak/StreakDisplay.tsx`:

```tsx
interface StreakDisplayProps {
  streak: number;
  badges: EarnedBadge[];
  nextBadge: { milestone: BadgeMilestone; remaining: number } | null;
}

export function StreakDisplay({
  streak,
  badges,
  nextBadge,
}: StreakDisplayProps) {
  if (streak === 0) return null;

  return (
    <div className="flex items-center gap-2 mt-2">
      <span className="text-lg">🔥</span>
      <div>
        <p className="text-xs font-medium">{streak} day streak</p>
        <div className="flex gap-0.5">
          {badges.map((badge) => (
            <span key={badge.milestone} className="text-xs">
              {BADGE_DEFINITIONS[badge.milestone].emoji}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
```

### Step 6: Integration

Modify `src/components/dashboard/cards/SpendingTrendCard.tsx`:

```tsx
// Add imports
import { StreakDisplay } from "@/components/streak/StreakDisplay";
import { useBudgetStreak } from "@/hooks/useBudgetStreak";

// In TrendAndAverage component (after line 325):
const { currentStreak, earnedBadges, nextBadge } = useBudgetStreak(
  currency,
  forecast
);

// Render after spender profile div:
{
  shouldShowForecast && currentStreak > 0 && (
    <StreakDisplay
      streak={currentStreak}
      badges={earnedBadges}
      nextBadge={nextBadge}
    />
  );
}
```

## Files to Create

1. `supabase/migrations/20260105000000_create_budget_streaks.sql`
2. `src/core/streak/types.ts`
3. `src/core/streak/constants.ts`
4. `src/core/streak/StreakService.ts`
5. `src/core/streak/index.ts`
6. `src/hooks/useBudgetStreak.ts`
7. `src/components/streak/StreakDisplay.tsx`
8. `src/components/streak/index.ts`

## Files to Modify

1. `src/components/dashboard/cards/SpendingTrendCard.tsx` - Add streak display

## Key References

- `src/hooks/useBudget.ts` - Hook pattern with Supabase persistence
- `src/core/forecast/types.ts` - DailyForecast interface with
  cumulativeActual/cumulativeForecast
- `supabase/migrations/20251222500000_create_budgets_table.sql` - Migration
  pattern with RLS
- `src/components/dashboard/cards/SpendingTrendCard.tsx` lines 309-346 -
  Integration point

## Edge Cases

1. **First day of month:** Streak = 1 if under budget, 0 if over
2. **No forecast data:** Don't show streak (requires forecast)
3. **Multiple currencies:** Separate streak per currency
4. **Month rollover:** Reset current streak, preserve longest streak
5. **Going over mid-month:** Streak breaks (0), but recovers when you get back
   under budget
6. **Recovery after overspending:** Streak restarts from the day you got back
   under budget
