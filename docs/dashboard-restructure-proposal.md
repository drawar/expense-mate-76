# Dashboard Restructure Proposal

## Current Problems

| Element | Issue |
|---------|-------|
| Sankey | Decorative, not actionable. "Money flows to categories" - so what? |
| Stat cards | Trivia, not insights. "Largest was Cathay Pacific" - is that good or bad? |
| Budget bar | No projection, no context, no "what to do" |
| Daily heatmap | Interesting pattern, but disconnected from action |

## Core Questions Users Need Answered

1. **Am I on track?** (status)
2. **Where am I headed?** (projection)
3. **What's driving it?** (diagnosis)
4. **What should I do?** (action)

## Proposed Layout

```
┌─────────────────────────────────────────────────────────┐
│ HERO: Status + Projection                               │
│ "Spent $5,740 of $4,000 budget"                        │
│ ██████████████████████████░░░░░░░░  143%               │
│ At this pace → $8,200 by month end (+$4,200 over)      │
└─────────────────────────────────────────────────────────┘

┌──────────────────────┐ ┌──────────────────────────────┐
│ vs LAST MONTH        │ │ BUDGET VARIANCE BY CATEGORY  │
│ +12% (+$640)         │ │ Lifestyle:  ████ +$800 over  │
│ ▲ trending up        │ │ Essentials: ██   on track    │
└──────────────────────┘ │ Home:       █    under       │
                         └──────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ INSIGHT: Your Lifestyle spending ($2,558) is 64%        │
│ above budget. Largest driver: Cathay Pacific ($1,584)   │
│ → To stay on track, reduce daily spend to $X/day        │
└─────────────────────────────────────────────────────────┘
```

## Key Changes

### 1. Kill the Sankey
- It's visual noise
- Category breakdown belongs in a simple bar/variance chart
- Takes up huge space for low information density

### 2. Lead with Projection
- "At this pace" is the most actionable metric
- Shows where user is headed, not just where they are
- Creates urgency when over budget

### 3. Show Variance, Not Absolutes
- "+$800 over" beats "$2,558 spent"
- Variance immediately tells you if something is good or bad
- Absolutes require mental math against budget

### 4. Connect Facts to Actions
- Every insight should suggest what to do
- "Reduce daily spend to $X" is actionable
- "Cathay Pacific was your largest transaction" is just trivia

## Components to Build

### Hero Section
- Current spend vs budget (amount + percentage)
- Progress bar with visual indication of over/under
- Month-end projection based on current daily rate
- Days remaining in period

### Comparison Card
- vs Last Period: +/- X% (amount)
- Trend indicator (up/down arrow)
- Optional: vs same period last year

### Category Variance Card
- Each category: actual vs budget
- Horizontal bar showing over/under
- Sorted by largest variance (problems first)
- Click to drill down

### Actionable Insight Card
- Auto-generated insight based on data
- Identifies the biggest problem/opportunity
- Suggests specific action
- Examples:
  - "Lifestyle is 64% over budget, driven by travel"
  - "You're under budget! At this pace, you'll save $X"
  - "Dining out increased 40% vs last month"

### Daily Spending (Optional/Collapsible)
- Keep the heatmap but make it secondary
- Useful for pattern recognition (weekend spending, etc.)
- Could highlight anomaly days

## Questions to Discuss

1. Should we completely remove the Sankey or make it a toggle/secondary view?
2. Do users set budgets per category, or just an overall budget?
3. How do we handle months with irregular large expenses (flights, etc.)?
4. Should projection exclude known one-time expenses?
5. What's the right level of "prescriptive" advice? Some users may find it preachy.

## Data Requirements

- Current period spending by category
- Budget (overall and/or by category)
- Previous period spending (for comparison)
- Daily spending totals (for projection calculation)
- Transaction details (for identifying drivers)

## Success Metrics

A good dashboard should:
- Be understood in < 5 seconds
- Answer "Am I okay?" immediately
- Guide user to take action if needed
- Not require scrolling for key info
