-- Fix MCC 7299 description: the seed had "Miscellaneous Recreation Services",
-- but the official Visa/Mastercard definition of 7299 is
-- "Services—Miscellaneous Personal Services". Recreation services live under 7999.

UPDATE public.mcc
SET description = 'Miscellaneous Personal Services'
WHERE code = '7299';
