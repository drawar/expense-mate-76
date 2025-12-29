-- Add per-merchant anomaly detection insight
-- This compares transactions to the merchant's historical average

-- First, add merchant_anomaly to the check constraint
ALTER TABLE public.insights DROP CONSTRAINT IF EXISTS insights_condition_type_check;
ALTER TABLE public.insights ADD CONSTRAINT insights_condition_type_check
  CHECK (condition_type IN (
    'category_ratio',
    'category_amount',
    'category_comparison',
    'tier_ratio',
    'spending_trend',
    'budget_status',
    'transaction_pattern',
    'merchant_pattern',
    'merchant_anomaly',
    'reward_optimization',
    'savings_rate',
    'milestone',
    'time_based'
  ));

-- Insert new per-merchant anomaly insight
INSERT INTO public.insights (
  category,
  title,
  message_template,
  icon,
  severity,
  condition_type,
  condition_params,
  action_text,
  priority,
  is_active,
  is_dismissible,
  cooldown_days
) VALUES (
  'warning',
  'Unusual Spending at Merchant',
  'A {{amount}} transaction at {{merchant}} is {{multiplier}}x higher than usual for this merchant. Was this intentional?',
  'AlertOctagon',
  'warning',
  'merchant_anomaly',
  '{"lookback_days": 7, "min_history": 3, "threshold_multiplier": 1.5}',
  'Review transaction',
  85,
  true,
  true,
  1
);
