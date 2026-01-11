-- Rename prepaid_card type to gift_card
-- This migration updates all payment methods with type 'prepaid_card' to 'gift_card'

UPDATE payment_methods
SET type = 'gift_card'
WHERE type = 'prepaid_card';
