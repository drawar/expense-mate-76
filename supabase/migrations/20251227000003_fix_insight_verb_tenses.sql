-- Fix verb tenses: use past tense for historical data

UPDATE public.insights
SET
  message_template = 'You spent ~{{weekly_a}}/week on {{label_a}}. Your average {{label_b}} meal cost {{avg_meal_cost}}. If you dined out for lunch and dinner every day, that would be {{projected_weekly_dining}}/week. By cooking at home instead, you could save ~{{weekly_savings}}/week.'
WHERE title = 'Cooking vs Dining Out'
  AND condition_type = 'category_comparison';
