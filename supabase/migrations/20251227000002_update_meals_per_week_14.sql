-- Update meals_per_week to 14 (lunch + dinner daily)

UPDATE public.insights
SET
  message_template = 'You spend ~{{weekly_a}}/week on {{label_a}}. Your average {{label_b}} meal costs {{avg_meal_cost}}. If you dined out for lunch and dinner every day, that would be {{projected_weekly_dining}}/week. By cooking at home instead, you could save ~{{weekly_savings}}/week.',
  condition_params = '{
    "categories_a": ["Groceries"],
    "categories_b": ["Dining Out", "Fast Food & Takeout", "Food Delivery"],
    "label_a": "groceries",
    "label_b": "dining out",
    "cost_multiplier": 2.5,
    "min_transactions": 3,
    "meals_per_week": 14
  }'
WHERE title = 'Cooking vs Dining Out'
  AND condition_type = 'category_comparison';
