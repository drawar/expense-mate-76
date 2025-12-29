-- Fix conditional tense: use past perfect for hypothetical scenario

UPDATE public.insights
SET
  message_template = 'You spent ~{{weekly_a}}/week on {{label_a}}. Your average {{label_b}} meal cost {{avg_meal_cost}}. If you had dined out for lunch and dinner every day, that would have been {{projected_weekly_dining}}/week. By cooking at home instead, you saved ~{{weekly_savings}}/week.'
WHERE title = 'Cooking vs Dining Out'
  AND condition_type = 'category_comparison';
