-- Add category_comparison condition type and grocery vs dining insight
-- This insight shows weekly savings from cooking at home vs dining out

-- First, update the CHECK constraint to include the new condition type
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
    'reward_optimization',
    'savings_rate',
    'milestone',
    'time_based'
  ));

-- Insert the grocery vs dining out comparison insight
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
  'savings',
  'Cooking vs Dining Out',
  'Based on {{days_tracked}} days: You spend ~{{weekly_a}}/week on {{label_a}} and ~{{weekly_b}}/week on {{label_b}}. By cooking more at home, you could save ~{{weekly_savings}}/week ({{potential_savings}} this month so far).',
  'ChefHat',
  'info',
  'category_comparison',
  '{
    "categories_a": ["Groceries"],
    "categories_b": ["Dining Out", "Fast Food & Takeout", "Food Delivery"],
    "label_a": "groceries",
    "label_b": "dining out",
    "cost_multiplier": 2.5,
    "min_transactions": 3
  }',
  'View food spending',
  60,
  true,
  true,
  14
);

COMMENT ON COLUMN public.insights.condition_type IS 'Type of condition to evaluate. category_comparison compares spending between two category groups.';
