-- Update Weekend Warrior insight action text to navigate to transactions
-- Instead of "Set weekend budget", show "Review what you spent this weekend"

UPDATE public.insights
SET action_text = 'Review weekend spending'
WHERE title = 'Weekend Warrior'
  AND condition_type = 'transaction_pattern';
