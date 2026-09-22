-- Allow a transaction to be excluded from monthly/period budget aggregation
-- (e.g. a large one-off purchase like a car that would otherwise distort
-- the "over budget" percentage for its category).

ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS exclude_from_budget BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN transactions.exclude_from_budget IS 'When true, this transaction is omitted from monthly/period budget aggregation (e.g. a large one-off purchase like a car).';
