-- Create insights/recommendations table for financial advice templates
-- These are rule-based insights that trigger based on user spending patterns

CREATE TABLE public.insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Categorization
  category TEXT NOT NULL CHECK (category IN (
    'spending',      -- General spending patterns
    'budget',        -- Budget adherence
    'savings',       -- Savings opportunities
    'behavior',      -- Behavioral patterns (impulse, timing, etc.)
    'optimization',  -- Card/reward optimization
    'milestone',     -- Achievements and progress
    'warning'        -- Urgent warnings
  )),

  -- Content
  title TEXT NOT NULL,                    -- Short headline (e.g., "Dining Out Alert")
  message_template TEXT NOT NULL,         -- Message with {{placeholders}} for dynamic values
  icon TEXT,                              -- Icon name (lucide icon)
  severity TEXT NOT NULL DEFAULT 'info' CHECK (severity IN ('info', 'success', 'warning', 'danger')),

  -- Trigger conditions
  condition_type TEXT NOT NULL CHECK (condition_type IN (
    'category_ratio',         -- When a category exceeds X% of total
    'category_amount',        -- When a category exceeds $X
    'tier_ratio',             -- Essentials/Lifestyle/Other ratio
    'spending_trend',         -- Month-over-month change
    'budget_status',          -- Over/under/near budget
    'transaction_pattern',    -- Frequency, timing, size patterns
    'merchant_pattern',       -- New merchants, concentration
    'reward_optimization',    -- Missed rewards opportunities
    'savings_rate',           -- Savings as % of income
    'milestone',              -- Achievement triggers
    'time_based'              -- Day of week, end of month, etc.
  )),

  -- Condition parameters (JSON)
  -- Examples:
  -- {"category": "Food & Drinks", "threshold": 0.3, "operator": ">"}
  -- {"trend_direction": "up", "threshold": 0.2}
  -- {"budget_status": "over"}
  condition_params JSONB NOT NULL DEFAULT '{}',

  -- Action
  action_text TEXT,                       -- Optional CTA (e.g., "Set a dining budget")
  action_type TEXT CHECK (action_type IN ('link', 'modal', 'none')),
  action_target TEXT,                     -- URL or modal ID

  -- Display control
  priority INTEGER NOT NULL DEFAULT 50,   -- Higher = more important (1-100)
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_dismissible BOOLEAN NOT NULL DEFAULT true,
  cooldown_days INTEGER DEFAULT 7,        -- Don't show again for X days after dismissed

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for efficient querying
CREATE INDEX idx_insights_category ON public.insights(category);
CREATE INDEX idx_insights_condition_type ON public.insights(condition_type);
CREATE INDEX idx_insights_active ON public.insights(is_active) WHERE is_active = true;
CREATE INDEX idx_insights_priority ON public.insights(priority DESC);

-- RLS policies
ALTER TABLE public.insights ENABLE ROW LEVEL SECURITY;

-- Anyone can read active insights (they're templates, not user data)
CREATE POLICY "Insights are publicly readable"
  ON public.insights FOR SELECT
  USING (is_active = true);

-- User insight dismissals tracking
CREATE TABLE public.user_insight_dismissals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  insight_id UUID NOT NULL REFERENCES public.insights(id) ON DELETE CASCADE,
  dismissed_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(user_id, insight_id)
);

CREATE INDEX idx_user_insight_dismissals_user ON public.user_insight_dismissals(user_id);
CREATE INDEX idx_user_insight_dismissals_insight ON public.user_insight_dismissals(insight_id);

ALTER TABLE public.user_insight_dismissals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own dismissals"
  ON public.user_insight_dismissals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own dismissals"
  ON public.user_insight_dismissals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own dismissals"
  ON public.user_insight_dismissals FOR DELETE
  USING (auth.uid() = user_id);

-- =============================================================================
-- SEED DATA: Comprehensive Financial Insights
-- =============================================================================

-- -----------------------------------------------------------------------------
-- CATEGORY: SPENDING - General spending pattern insights
-- -----------------------------------------------------------------------------

INSERT INTO public.insights (category, title, message_template, icon, severity, condition_type, condition_params, action_text, priority) VALUES

-- Food & Dining
('spending', 'Dining Out Alert',
 'You''ve spent {{amount}} on dining out this month - that''s {{percentage}}% of your total spending. The recommended limit is 10-15%.',
 'UtensilsCrossed', 'warning', 'category_ratio',
 '{"category": "Food & Drinks", "threshold": 0.25, "operator": ">"}',
 'Set a dining budget', 70),

('spending', 'The Latte Factor',
 'Small purchases at coffee shops added up to {{amount}} this month. That''s {{yearly_projection}} per year!',
 'Coffee', 'info', 'category_amount',
 '{"merchants_like": ["Starbucks", "Coffee", "Café", "Cafe"], "threshold": 100}',
 'Track coffee spending', 55),

('spending', 'Food Delivery Habit',
 'You''ve ordered delivery {{count}} times this month, spending {{amount}}. Cooking at home could save you {{savings_estimate}}.',
 'Bike', 'warning', 'merchant_pattern',
 '{"merchants_like": ["GrabFood", "Foodpanda", "Deliveroo", "DoorDash", "Uber Eats"], "min_count": 8}',
 'Try meal prepping', 65),

-- Shopping
('spending', 'Retail Therapy Warning',
 'Shopping accounts for {{percentage}}% of your spending ({{amount}}). This is above the recommended 5-10% for discretionary purchases.',
 'ShoppingBag', 'warning', 'category_ratio',
 '{"category": "Shopping", "threshold": 0.20, "operator": ">"}',
 'Review purchases', 60),

('spending', 'Impulse Purchase Pattern',
 'You made {{count}} shopping transactions under $50 this week. Small purchases add up - consider a 24-hour rule before buying.',
 'Zap', 'info', 'transaction_pattern',
 '{"category": "Shopping", "amount_max": 50, "min_count": 5, "period": "week"}',
 NULL, 50),

('spending', 'Subscription Creep',
 'We detected {{count}} recurring charges totaling {{amount}}/month. When did you last audit your subscriptions?',
 'RefreshCw', 'info', 'merchant_pattern',
 '{"recurring": true, "min_count": 5}',
 'Review subscriptions', 55),

-- Entertainment
('spending', 'Entertainment Splurge',
 'Entertainment spending hit {{amount}} this month ({{percentage}}% of total). Consider free alternatives for some activities.',
 'Film', 'info', 'category_ratio',
 '{"category": "Entertainment", "threshold": 0.15, "operator": ">"}',
 'Find free activities', 45),

-- Transport
('spending', 'Transport Costs Rising',
 'You''ve spent {{amount}} on transport this month. If using ride-sharing frequently, a monthly transit pass might save money.',
 'Car', 'info', 'category_amount',
 '{"category": "Automotive", "threshold": 300}',
 'Compare options', 50),

('spending', 'Ride-Share Habit',
 '{{count}} Grab/taxi rides this month totaling {{amount}}. Public transport for some trips could save {{savings_estimate}}.',
 'MapPin', 'info', 'merchant_pattern',
 '{"merchants_like": ["Grab", "Gojek", "Uber", "Taxi", "ComfortDelGro"], "min_count": 15}',
 NULL, 55),

-- -----------------------------------------------------------------------------
-- CATEGORY: BUDGET - Budget adherence insights
-- -----------------------------------------------------------------------------

('budget', 'Over Budget Alert',
 'You''ve exceeded your monthly budget by {{overage_amount}} ({{overage_percentage}}% over). Immediate action needed to get back on track.',
 'AlertTriangle', 'danger', 'budget_status',
 '{"status": "over", "threshold": 0}',
 'Review spending', 95),

('budget', 'Approaching Budget Limit',
 'You''ve used {{percentage}}% of your monthly budget with {{days_remaining}} days left. Consider slowing down discretionary spending.',
 'AlertCircle', 'warning', 'budget_status',
 '{"status": "near", "threshold": 0.9}',
 'View remaining budget', 80),

('budget', 'Budget on Track',
 'Great job! You''re at {{percentage}}% of budget with {{days_remaining}} days remaining. You''re pacing well this month.',
 'CheckCircle', 'success', 'budget_status',
 '{"status": "on_track", "threshold_min": 0.5, "threshold_max": 0.8}',
 NULL, 40),

('budget', 'Significant Savings',
 'You''re {{percentage}}% under budget! Consider moving {{surplus_amount}} to savings or investments.',
 'PiggyBank', 'success', 'budget_status',
 '{"status": "under", "threshold": 0.2}',
 'Transfer to savings', 60),

('budget', 'Three Months Overspending',
 'You''ve been over budget for 3 consecutive months. This pattern suggests your budget may need adjustment, or spending habits need review.',
 'TrendingUp', 'danger', 'spending_trend',
 '{"consecutive_over_budget": 3}',
 'Adjust budget', 90),

-- -----------------------------------------------------------------------------
-- CATEGORY: SAVINGS - Savings and wealth building
-- -----------------------------------------------------------------------------

('savings', 'Pay Yourself First',
 'No savings detected this month. Aim to save at least 20% of income before spending on wants.',
 'Wallet', 'warning', 'savings_rate',
 '{"threshold": 0, "operator": "<="}',
 'Set up auto-save', 85),

('savings', 'Below Savings Target',
 'Your savings rate is {{percentage}}%. Financial experts recommend saving 20% of income. You''re {{shortfall}} short of that target.',
 'Target', 'info', 'savings_rate',
 '{"threshold": 0.20, "operator": "<"}',
 'Increase savings', 70),

('savings', 'Emergency Fund Gap',
 'Based on your spending, you need {{emergency_fund_target}} for a 3-month emergency fund. You currently have {{current_savings}}.',
 'Shield', 'warning', 'savings_rate',
 '{"emergency_months": 3, "status": "below_target"}',
 'Build emergency fund', 75),

('savings', 'Savings Milestone',
 'Congratulations! You''ve saved {{amount}} this month - that''s {{percentage}}% of your income. Keep it up!',
 'Award', 'success', 'savings_rate',
 '{"threshold": 0.20, "operator": ">="}',
 NULL, 50),

('savings', 'Found Money',
 'Your Lifestyle spending dropped {{percentage}}% this month. That''s {{amount}} you could redirect to savings!',
 'Sparkles', 'success', 'tier_ratio',
 '{"tier": "Lifestyle", "trend": "down", "threshold": 0.15}',
 'Move to savings', 55),

-- -----------------------------------------------------------------------------
-- CATEGORY: BEHAVIOR - Behavioral spending patterns
-- -----------------------------------------------------------------------------

('behavior', 'Late Night Shopping',
 '{{count}} purchases made after 10pm this month. Late-night shopping often leads to impulse buys you might regret.',
 'Moon', 'info', 'transaction_pattern',
 '{"hour_start": 22, "hour_end": 4, "min_count": 5}',
 'Enable purchase limits', 50),

('behavior', 'Weekend Warrior',
 'You spend {{percentage}}% more on weekends ({{weekend_amount}}) than weekdays ({{weekday_amount}}). Weekend budgeting could help.',
 'Calendar', 'info', 'transaction_pattern',
 '{"weekend_vs_weekday_ratio": 1.5}',
 'Set weekend budget', 45),

('behavior', 'Payday Splurge',
 'Your spending spikes {{percentage}}% in the 3 days after payday. Try the envelope method to pace your spending.',
 'Banknote', 'warning', 'transaction_pattern',
 '{"post_payday_spike": 0.4, "days": 3}',
 'Learn envelope method', 60),

('behavior', 'Nickel and Diming',
 'You made {{count}} transactions under $10 this week. These small amounts totaled {{amount}}. Mindful spending on small purchases helps!',
 'Coins', 'info', 'transaction_pattern',
 '{"amount_max": 10, "min_count": 20, "period": "week"}',
 NULL, 40),

('behavior', 'Convenience Tax',
 '{{percentage}}% of your spending is on Convenience items (food delivery, ride-share, etc.). These "lazy money" expenses are the easiest to cut.',
 'Zap', 'warning', 'tier_ratio',
 '{"behavior": "Convenience", "threshold": 0.25}',
 'Identify alternatives', 65),

('behavior', 'Emotional Spending',
 'You had {{count}} transactions on {{day}} - much higher than your average of {{average}}. Stress or celebration spending?',
 'Heart', 'info', 'transaction_pattern',
 '{"daily_spike_ratio": 3}',
 NULL, 35),

('behavior', 'New Merchant Discovery',
 'You''ve tried {{count}} new merchants this month. Exploring is fun, but familiarity helps with budgeting and rewards optimization.',
 'Compass', 'info', 'merchant_pattern',
 '{"new_merchants": true, "min_count": 10}',
 NULL, 30),

-- -----------------------------------------------------------------------------
-- CATEGORY: OPTIMIZATION - Card and reward optimization
-- -----------------------------------------------------------------------------

('optimization', 'Wrong Card for Category',
 'You used {{card_used}} for {{category}} transactions ({{amount}}). Your {{better_card}} earns {{multiplier}}x more points on this category!',
 'CreditCard', 'info', 'reward_optimization',
 '{"optimization_type": "category_mismatch"}',
 'View card benefits', 70),

('optimization', 'Foreign Currency Alert',
 'You spent {{amount}} in foreign currency using a card with {{fee_percentage}}% FX fee. A travel card could have saved you {{savings}}.',
 'Globe', 'warning', 'reward_optimization',
 '{"optimization_type": "fcf_fees", "min_amount": 100}',
 'Get a travel card', 65),

('optimization', 'Missed Cashback',
 'You spent {{amount}} on {{category}} with cards earning 0 points. Using the right card could have earned {{points_missed}} points.',
 'Gift', 'info', 'reward_optimization',
 '{"optimization_type": "zero_earn", "min_amount": 200}',
 'Optimize card usage', 55),

('optimization', 'Bonus Category Opportunity',
 'Your {{card_name}} earns {{multiplier}}x on {{category}} this quarter. You''ve only spent {{current}} of the {{cap}} cap.',
 'Flame', 'success', 'reward_optimization',
 '{"optimization_type": "bonus_underutilized"}',
 'Maximize bonus', 60),

('optimization', 'Points Expiring Soon',
 'You have {{points}} points with {{program}} expiring in {{days}} days. Consider redeeming or transferring them.',
 'Clock', 'warning', 'reward_optimization',
 '{"optimization_type": "expiring_points", "days_threshold": 30}',
 'Redeem points', 80),

('optimization', 'Contactless Bonus Missed',
 '{{count}} in-store transactions weren''t contactless. Some cards offer bonus points for tap-to-pay.',
 'Smartphone', 'info', 'transaction_pattern',
 '{"contactless": false, "in_store": true, "min_count": 10}',
 NULL, 35),

-- -----------------------------------------------------------------------------
-- CATEGORY: MILESTONE - Achievements and progress
-- -----------------------------------------------------------------------------

('milestone', 'First Week Complete',
 'You''ve tracked expenses for a full week! Consistency is key to financial awareness.',
 'Flag', 'success', 'milestone',
 '{"type": "tracking_streak", "days": 7}',
 NULL, 40),

('milestone', 'Month of Tracking',
 'One month of expense tracking complete! You now have enough data for meaningful insights.',
 'Trophy', 'success', 'milestone',
 '{"type": "tracking_streak", "days": 30}',
 'View monthly report', 50),

('milestone', 'Spending Decreased',
 'Your spending is down {{percentage}}% compared to last month. That''s {{amount}} saved!',
 'TrendingDown', 'success', 'spending_trend',
 '{"direction": "down", "threshold": 0.1}',
 NULL, 60),

('milestone', 'Category Under Control',
 'Your {{category}} spending dropped {{percentage}}% this month. Great progress!',
 'ThumbsUp', 'success', 'spending_trend',
 '{"direction": "down", "threshold": 0.2, "by_category": true}',
 NULL, 45),

('milestone', 'Budget Streak',
 'You''ve stayed under budget for {{months}} consecutive months! Your discipline is paying off.',
 'Flame', 'success', 'milestone',
 '{"type": "under_budget_streak", "months": 3}',
 NULL, 70),

('milestone', 'Points Milestone',
 'You''ve earned {{points}} points this month - a new personal best!',
 'Star', 'success', 'milestone',
 '{"type": "points_record"}',
 'View rewards', 55),

-- -----------------------------------------------------------------------------
-- CATEGORY: WARNING - Urgent financial warnings
-- -----------------------------------------------------------------------------

('warning', 'Unusual Large Transaction',
 'A {{amount}} transaction at {{merchant}} is {{multiplier}}x larger than your average. Was this intentional?',
 'AlertOctagon', 'danger', 'transaction_pattern',
 '{"amount_vs_average_ratio": 5}',
 'Review transaction', 90),

('warning', 'Spending Velocity High',
 'You''ve spent {{amount}} in the last 3 days - that''s {{percentage}}% of your monthly average. Slow down if unplanned.',
 'Gauge', 'warning', 'spending_trend',
 '{"recent_days": 3, "vs_monthly_percentage": 0.4}',
 'View recent spending', 85),

('warning', 'Category Explosion',
 '{{category}} spending is up {{percentage}}% vs last month. This sudden increase might need attention.',
 'TrendingUp', 'warning', 'spending_trend',
 '{"direction": "up", "threshold": 0.5, "by_category": true}',
 'Review category', 75),

('warning', 'Lifestyle Inflation',
 'Your spending has increased {{percentage}}% while tracking similar income. Watch out for lifestyle creep.',
 'ArrowUpRight', 'warning', 'spending_trend',
 '{"direction": "up", "threshold": 0.15, "consecutive_months": 3}',
 'Review habits', 70),

('warning', 'Single Merchant Dependency',
 'You''ve spent {{amount}} ({{percentage}}% of total) at {{merchant}}. Consider diversifying for better deals and rewards.',
 'Building', 'info', 'merchant_pattern',
 '{"single_merchant_ratio": 0.25, "min_amount": 500}',
 NULL, 50);

-- -----------------------------------------------------------------------------
-- TIME-BASED INSIGHTS
-- -----------------------------------------------------------------------------

INSERT INTO public.insights (category, title, message_template, icon, severity, condition_type, condition_params, action_text, priority) VALUES

('spending', 'End of Month Check',
 'Only {{days}} days left this month. You have {{remaining}} left in your budget. Plan your remaining purchases carefully.',
 'CalendarCheck', 'info', 'time_based',
 '{"day_of_month_min": 25}',
 'View budget', 65),

('spending', 'Start Fresh',
 'New month, new opportunity! Last month you spent {{last_month_total}}. Set an intention for this month.',
 'Sunrise', 'info', 'time_based',
 '{"day_of_month": 1}',
 'Set monthly goal', 50),

('budget', 'Mid-Month Review',
 'Halfway through the month! You''ve spent {{amount}} ({{percentage}}% of budget). {{status_message}}',
 'Calendar', 'info', 'time_based',
 '{"day_of_month_range": [14, 16]}',
 'Review progress', 55),

('savings', 'Payday Reminder',
 'Payday detected! Remember to transfer {{recommended_amount}} to savings before spending on wants.',
 'Banknote', 'info', 'time_based',
 '{"event": "payday_detected"}',
 'Transfer now', 75);

-- Add comment explaining the table
COMMENT ON TABLE public.insights IS 'Financial insight templates with trigger conditions. These are evaluated against user spending data to generate personalized recommendations.';
COMMENT ON COLUMN public.insights.condition_params IS 'JSON parameters for the condition. Keys depend on condition_type. Use {{placeholders}} in message_template to reference calculated values.';
