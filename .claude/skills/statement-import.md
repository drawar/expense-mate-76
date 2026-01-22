# Credit Card Statement Import Skill

This skill extracts transactions from any credit card PDF statement, calculates
points, and generates SQL for database insertion.

## Workflow Overview

1. **Detect Card** - Identify issuer and card type from statement
2. **Match Payment Method** - Link to user's configured payment method
3. **Set Timezone** - Use region-appropriate timezone for transaction dates
4. **Extract & Present Transactions** - Show each transaction for user approval
5. **Batch Confirm** - Collect all confirmed transactions
6. **Check Duplicates** - Verify no duplicates exist in database before SQL
   generation
7. **Generate SQL** - Create INSERT query for Supabase

---

## Step 1: Card Detection

### Identifying Card from Statement

Look for these indicators in the PDF:

| Issuer           | Detection Patterns                                     |
| ---------------- | ------------------------------------------------------ |
| American Express | "American Express", "AMEX", card number starts with 37 |
| DBS              | "DBS Bank", "DBS Card Services"                        |
| UOB              | "United Overseas Bank", "UOB Card Centre"              |
| OCBC             | "OCBC Bank", "OCBC Card"                               |
| Citibank         | "Citibank", "Citi"                                     |
| HSBC             | "HSBC", "Hongkong and Shanghai Banking"                |
| TD               | "TD Canada Trust", "TD Bank"                           |
| Brim Financial   | "Brim Financial", "Brim"                               |
| Neo Financial    | "Neo Financial", "Neo"                                 |

### Card Type Identification

After identifying issuer, look for card name:

| Issuer           | Card Name Keywords         | Card Type ID                                         |
| ---------------- | -------------------------- | ---------------------------------------------------- |
| American Express | Cobalt                     | american-express-cobalt                              |
| American Express | Platinum (Canada)          | american-express-platinum-canada                     |
| American Express | Platinum Credit            | american-express-platinum-credit                     |
| American Express | Platinum (Singapore)       | american-express-platinum-singapore                  |
| DBS              | Woman's World              | dbs-woman's-world-mastercard                         |
| UOB              | Lady's Solitaire           | uob-lady's-solitaire                                 |
| UOB              | Preferred Visa Platinum    | uob-preferred-visa-platinum                          |
| UOB              | Visa Signature             | uob-visa-signature                                   |
| OCBC             | Rewards World              | ocbc-rewards-world-mastercard                        |
| Citibank         | Rewards Visa Signature     | citibank-rewards-visa-signature                      |
| HSBC             | Revolution                 | hsbc-revolution                                      |
| TD               | Aeroplan Visa Infinite     | td-aeroplan-visa-infinite                            |
| Brim Financial   | Air France-KLM World Elite | brim-financial-air-france-klm-world-elite-mastercard |
| Neo Financial    | Cathay World Elite         | neo-financial-cathay-world-elite-mastercard          |

---

## Step 2: Match Payment Method

Query user's payment methods to find the matching card:

```sql
SELECT pm.id, pm.name, pm.issuer, pm.currency, pm.card_catalog_id,
       cc.card_type_id, cc.region, cc.points_currency
FROM payment_methods pm
LEFT JOIN card_catalog cc ON pm.card_catalog_id = cc.id
WHERE pm.user_id = '00000000-0000-0000-0000-000000000000'
  AND pm.is_active = true
  AND pm.type = 'credit_card'
ORDER BY pm.name;
```

### Matching Logic

1. **By card_catalog_id** (most reliable):

   - Match `cc.card_type_id` with detected card type

2. **By issuer + name** (fallback):

   - Match `pm.issuer` with detected issuer
   - Match `pm.name` contains card name keywords

3. **By last 4 digits** (if visible in statement):
   - Match `pm.last_four_digits` with statement

**IMPORTANT**: Always confirm with user which payment method to use before
proceeding.

---

## Step 3: Timezone Mapping

Set timezone based on card region for accurate transaction dates:

| Region | Currency | Timezone         | Example Cards            |
| ------ | -------- | ---------------- | ------------------------ |
| CA     | CAD      | America/Toronto  | Amex Cobalt, TD Aeroplan |
| SG     | SGD      | Asia/Singapore   | DBS, UOB, OCBC, Citi SG  |
| US     | USD      | America/New_York | US cards                 |
| AU     | AUD      | Australia/Sydney | Australian cards         |
| UK     | GBP      | Europe/London    | UK cards                 |
| HK     | HKD      | Asia/Hong_Kong   | Hong Kong cards          |

### Date Handling

- Statement dates are in the card's local timezone
- Convert to ISO 8601 format: `YYYY-MM-DD`
- For transactions with time, include timezone: `YYYY-MM-DDTHH:MM:SS+08:00`

---

## Step 4: Transaction Extraction & Presentation

### Extract from Statement

For each transaction, extract:

| Field            | Description                             | Required |
| ---------------- | --------------------------------------- | -------- |
| date             | Transaction date (YYYY-MM-DD)           | Yes      |
| merchant_raw     | Raw merchant name from statement        | Yes      |
| merchant         | Normalized merchant name                | Yes      |
| amount           | Original transaction amount             | Yes      |
| currency         | Original currency (USD, CAD, SGD, etc.) | Yes      |
| payment_amount   | Amount in card currency (after FX)      | Yes      |
| payment_currency | Card's currency                         | Yes      |
| mcc_code         | Merchant Category Code (if known)       | No       |
| is_online        | true/false                              | Yes      |
| is_contactless   | true/false                              | Yes      |
| address          | Merchant location (city, country)       | No       |

### Merchant Normalization Rules

| Statement Shows             | Normalize To  | Notes                |
| --------------------------- | ------------- | -------------------- |
| SAFEWAY #4930 NEW WESTM     | Safeway       | Remove store numbers |
| SAVE ON FOODS #2225 BURNABY | Save-On-Foods | Standard name        |
| UBER\* TRIP HELP.UBER.COM   | Uber          | Ride share           |
| UBER\* EATS HELP.UBER.COM   | Uber Eats     | Food delivery        |
| LYFT \*RIDE SUN 12PM        | Lyft          | Ride share           |
| NETFLIX.COM 866-716-0414    | Netflix       | Streaming            |
| AMAZON.CA\*NR6HP3TL2        | Amazon        | E-commerce           |
| SQ \*COFFEE SHOP            | Coffee Shop   | Square merchant      |
| TST\*MERCHANT NAME          | Merchant Name | Toast POS            |
| SP \*MERCHANT NAME          | Merchant Name | Shopify              |

### Present Transaction for Confirmation

For EACH transaction, display ALL information and wait for user approval:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TRANSACTION 1 of N
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Date:               2025-08-13 (Wed)
Merchant (raw):     UBER* EATS HELP.UBER.COM SAN FRANCISCO
Merchant:           Uber Eats
Location:           San Francisco, USA
Online:             Yes
Contactless:        No

Payment Method:     Cobalt (American Express)

Transaction:        $48.48 CAD
Payment Amount:     $48.48 CAD
(same currency - no FX)

MCC Code:           5812 (Eating Places, Restaurants)

Points Calculation:
  Base (1x):        48 pts
  Bonus (4x):       194 pts (5x Food category - CAD transaction)
  Promo:            0 pts
  ─────────────────────────
  TOTAL:            242 pts

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[A]pprove  [E]dit  [S]kip  [Q]uit
```

### For Foreign Currency Transactions

```
Transaction:        $23.00 USD
Exchange Rate:      1.39739
Payment Amount:     $32.14 CAD
FX Fee:             2.5%

Points Calculation:
  Base (1x):        32 pts (calculated on CAD amount)
  Bonus (1x):       32 pts (2x Transit - applies to USD)
  ─────────────────────────
  TOTAL:            64 pts
```

### User Actions

- **[A]pprove**: Add to confirmed list, move to next
- **[E]dit**: Allow editing any field (merchant, MCC, points, etc.)
- **[S]kip**: Skip this transaction, don't include in import
- **[Q]uit**: Stop processing, keep confirmed transactions

---

## Step 5: Points Calculation

### Calculation Rules by Card

#### American Express Cobalt (CA)

Method: `total_first` with `Math.round` (nearest)

| Category         | Multiplier | MCC Codes                                | Currency |
| ---------------- | ---------- | ---------------------------------------- | -------- |
| Food & Groceries | 5x         | 5411, 5422, 5441, 5451, 5499, 5811-5814  | CAD only |
| Streaming        | 3x         | Merchant name match                      | CAD only |
| Gas & Transit    | 2x         | 4011, 4111, 4121, 4131, 4789, 5541, 5542 | Any      |
| All Other        | 1x         | Everything else                          | Any      |

```typescript
const totalPoints = Math.round(paymentAmount * totalMultiplier);
const basePoints = Math.round(paymentAmount * 1);
const bonusPoints = totalPoints - basePoints;
```

#### DBS Woman's World MasterCard (SG)

Method: `standard` with `Math.floor`

| Category    | Multiplier | MCC Codes             | Min Spend |
| ----------- | ---------- | --------------------- | --------- |
| Online      | 4x         | Any (online purchase) | $800/mo   |
| Contactless | 4x         | Any (contactless tap) | $800/mo   |
| All Other   | 0.3x       | Everything else       | -         |

```typescript
// Check monthly min spend ($800) first
const basePoints = Math.floor(paymentAmount * 0.3);
const bonusPoints =
  meetsMinSpend && (isOnline || isContactless)
    ? Math.floor(paymentAmount * 3.7) // 4x - 0.3x base
    : 0;
```

#### Citibank Rewards Visa Signature (SG)

Method: `standard` with `Math.floor`

| Category  | Multiplier | Notes                    |
| --------- | ---------- | ------------------------ |
| All Spend | 4x         | On all purchases, no cap |

```typescript
const basePoints = Math.floor(paymentAmount * 1);
const bonusPoints = Math.floor(paymentAmount * 3);
```

#### HSBC Revolution (SG)

Method: `standard` with `Math.floor`, block size 5

| Category      | Multiplier | Notes                     |
| ------------- | ---------- | ------------------------- |
| Dining        | 4x         | MCC 5811-5814             |
| Entertainment | 4x         | MCC 7832, 7922, 7929, etc |
| Online        | 4x         | Any online purchase       |
| All Other     | 0.4x       | Everything else           |

```typescript
// Points awarded per $5 block
const blocks = Math.floor(paymentAmount / 5);
const basePoints = blocks * 2; // 0.4 pts/$1 = 2 pts/$5
const bonusPoints = isBonus ? blocks * 18 : 0; // 4x = 20 pts/$5, bonus = 18
```

#### For Other Cards

Use the RewardService calculation if rules are configured, otherwise ask user
for manual point input.

---

## Step 6: After All Transactions Confirmed

### Summary Display

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
IMPORT SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Card:               Cobalt (American Express)
Statement Period:   Aug 4 - Sep 3, 2025

Transactions:       35 total
  - Approved:       33
  - Skipped:        2

By Category:
  5x Food/Grocery:  $1,007.10  →  5,036 pts
  3x Streaming:     $37.76     →  113 pts
  2x Transit:       $330.93    →  662 pts
  1x Other:         $176.50    →  177 pts
  ──────────────────────────────────────────
  TOTAL:            $1,552.29  →  5,988 pts

Do you have more statements to import? [Y/N]
```

### If More Statements

- Add to running total of confirmed transactions
- Continue to next statement

### If No More Statements

Proceed to duplicate checking.

---

## Step 6: Check Duplicates

**IMPORTANT**: Before generating SQL, check ALL confirmed transactions against
the database to identify potential duplicates.

### Duplicate Detection Query

For each confirmed transaction, run this query to find potential duplicates:

```sql
-- Strict match on: currency + amount
-- Fuzzy match on: merchant name (using normalized name keywords)
SELECT
  t.id,
  t.date,
  t.amount,
  t.currency,
  t.payment_amount,
  t.payment_currency,
  t.total_points,
  m.name as merchant_name
FROM transactions t
JOIN merchants m ON t.merchant_id = m.id
WHERE t.payment_method_id = 'pm-uuid'
  AND t.currency = 'CAD'                    -- STRICT: exact currency match
  AND t.amount = 48.48                      -- STRICT: exact amount match
  AND (t.is_deleted = false OR t.is_deleted IS NULL)
ORDER BY t.date DESC
LIMIT 10;
```

### Fuzzy Merchant Matching

After finding transactions with matching currency + amount, apply fuzzy merchant
matching:

1. **Extract keywords** from normalized merchant name:

   - "Uber Eats" → `['uber', 'eats']`
   - "Save-On-Foods" → `['save', 'on', 'foods']`
   - "PriceSmart Foods" → `['pricesmart', 'foods']`

2. **Match if ANY keyword appears** in existing merchant name:

   ```sql
   -- Example: Looking for "Uber Eats" duplicates
   AND (
     LOWER(m.name) LIKE '%uber%'
     OR LOWER(m.name) LIKE '%eats%'
   )
   ```

3. **Scoring** (for multiple matches):
   - Exact name match: 100% confidence
   - All keywords match: 90% confidence
   - Some keywords match: 50-80% confidence
   - Single keyword match: 30% confidence

### Batch Duplicate Check

Run duplicate check for all confirmed transactions at once:

```sql
-- Get all potential duplicates for the statement period
SELECT
  t.id,
  t.date,
  t.amount,
  t.currency,
  t.payment_amount,
  m.name as merchant_name,
  t.total_points
FROM transactions t
JOIN merchants m ON t.merchant_id = m.id
WHERE t.payment_method_id = 'pm-uuid'
  AND t.date >= '2025-08-01'              -- Statement start date - 3 days buffer
  AND t.date <= '2025-09-06'              -- Statement end date + 3 days buffer
  AND (t.is_deleted = false OR t.is_deleted IS NULL)
ORDER BY t.date, m.name;
```

Then match in-memory against confirmed transactions using:

- **Strict**: `currency` AND `amount` must match exactly
- **Fuzzy**: `merchant` keywords overlap

### Duplicate Report Display

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DUPLICATE CHECK RESULTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Checked: 33 confirmed transactions
Found:   3 potential duplicates

─────────────────────────────────────────────────────────────────────
DUPLICATE 1 of 3
─────────────────────────────────────────────────────────────────────

NEW (from statement):
  Date:      2025-08-13
  Merchant:  Uber Eats
  Amount:    $48.48 CAD
  Points:    242

EXISTING (in database):
  ID:        abc123-def456
  Date:      2025-08-13
  Merchant:  Uber Eats
  Amount:    $48.48 CAD
  Points:    242

Match confidence: 100% (exact merchant + amount + currency)

Action: [K]eep new  [S]kip new  [R]eplace existing

─────────────────────────────────────────────────────────────────────
DUPLICATE 2 of 3
─────────────────────────────────────────────────────────────────────

NEW (from statement):
  Date:      2025-08-14
  Merchant:  Save-On-Foods
  Amount:    $25.99 CAD
  Points:    130

EXISTING (in database):
  ID:        xyz789-uvw012
  Date:      2025-08-14
  Merchant:  Save On Foods        ← slight name variation
  Amount:    $25.99 CAD
  Points:    130

Match confidence: 90% (fuzzy merchant match: 'save', 'foods')

Action: [K]eep new  [S]kip new  [R]eplace existing

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### User Actions for Duplicates

- **[K]eep new**: Include in SQL INSERT (will create duplicate)
- **[S]kip new**: Remove from confirmed list, don't insert
- **[R]eplace existing**: Generate UPDATE instead of INSERT for this transaction

### After Duplicate Resolution

Update the summary with final counts:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FINAL IMPORT SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Original confirmed:  33 transactions
Duplicates found:    3
  - Skipped:         2
  - Kept:            1
  - Replacing:       0

Final to insert:     31 transactions
Final to update:     0 transactions

Proceed to SQL generation? [Y/N]
```

---

## Step 7: SQL Generation

### Find or Create Merchants First

For each unique merchant, check if exists:

```sql
-- Check existing merchant
SELECT id FROM merchants
WHERE name = 'Uber Eats'
  AND (is_deleted = false OR is_deleted IS NULL)
LIMIT 1;
```

If not found, generate INSERT:

```sql
INSERT INTO merchants (id, name, mcc_code, mcc, is_online, address, user_id)
VALUES (
  'uuid-here',
  'Uber Eats',
  '5812',
  '{"code": "5812", "description": "Eating Places, Restaurants"}',
  true,
  NULL,
  '00000000-0000-0000-0000-000000000000'
);
```

### Transaction INSERT Template

```sql
INSERT INTO transactions (
  id,
  date,
  merchant_id,
  amount,
  currency,
  payment_method_id,
  payment_amount,
  payment_currency,
  total_points,
  base_points,
  bonus_points,
  promo_bonus_points,
  is_contactless,
  mcc_code,
  user_category,
  category,
  user_id,
  created_at,
  updated_at
) VALUES
  -- Transaction 1
  (
    'uuid-1',
    '2025-08-13',
    'merchant-uuid',
    48.48,
    'CAD',
    'payment-method-uuid',
    48.48,
    'CAD',
    242,
    48,
    194,
    0,
    false,
    '5812',
    'Food Delivery',
    'Food Delivery',
    '00000000-0000-0000-0000-000000000000',
    NOW(),
    NOW()
  ),
  -- Transaction 2
  (
    ...
  );
```

### Complete SQL Script Template

```sql
-- ============================================================
-- STATEMENT IMPORT: [Card Name]
-- Period: [Start Date] - [End Date]
-- Generated: [Timestamp]
-- ============================================================

BEGIN;

-- ============================================================
-- STEP 1: Create new merchants (if any)
-- ============================================================

INSERT INTO merchants (id, name, mcc_code, mcc, is_online, user_id)
VALUES
  ('new-merchant-uuid-1', 'New Merchant 1', '5812', '{"code": "5812", "description": "Restaurants"}', false, '00000000-0000-0000-0000-000000000000'),
  ('new-merchant-uuid-2', 'New Merchant 2', '5411', '{"code": "5411", "description": "Grocery Stores"}', false, '00000000-0000-0000-0000-000000000000')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- STEP 2: Insert transactions
-- ============================================================

INSERT INTO transactions (
  id, date, merchant_id, amount, currency,
  payment_method_id, payment_amount, payment_currency,
  total_points, base_points, bonus_points, promo_bonus_points,
  is_contactless, mcc_code, user_category, category, user_id,
  created_at, updated_at
) VALUES
  -- 5x FOOD/GROCERY (N transactions, $X.XX, XXXX pts)
  ('tx-uuid-1', '2025-08-13', 'merchant-uuid', 48.48, 'CAD', 'pm-uuid', 48.48, 'CAD', 242, 48, 194, 0, false, '5812', 'Food Delivery', 'Food Delivery', '00000000-0000-0000-0000-000000000000', NOW(), NOW()),
  ('tx-uuid-2', '2025-08-14', 'merchant-uuid', 25.99, 'CAD', 'pm-uuid', 25.99, 'CAD', 130, 26, 104, 0, false, '5411', 'Groceries', 'Groceries', '00000000-0000-0000-0000-000000000000', NOW(), NOW()),

  -- 3x STREAMING (N transactions, $X.XX, XXX pts)
  ('tx-uuid-3', '2025-08-16', 'merchant-uuid', 21.46, 'CAD', 'pm-uuid', 21.46, 'CAD', 64, 21, 43, 0, false, '5968', 'Streaming', 'Streaming', '00000000-0000-0000-0000-000000000000', NOW(), NOW()),

  -- 2x TRANSIT (N transactions, $X.XX, XXX pts)
  ('tx-uuid-4', '2025-08-16', 'merchant-uuid', 100.00, 'CAD', 'pm-uuid', 100.00, 'CAD', 200, 100, 100, 0, false, '4111', 'Transit', 'Transit', '00000000-0000-0000-0000-000000000000', NOW(), NOW()),

  -- 1x OTHER (N transactions, $X.XX, XXX pts)
  ('tx-uuid-5', '2025-08-14', 'merchant-uuid', 21.94, 'CAD', 'pm-uuid', 21.94, 'CAD', 22, 22, 0, 0, false, '5921', 'Liquor', 'Liquor', '00000000-0000-0000-0000-000000000000', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- VERIFICATION
-- ============================================================

-- Check inserted count
SELECT COUNT(*) as inserted_count FROM transactions
WHERE payment_method_id = 'pm-uuid'
  AND date >= '2025-08-04'
  AND date <= '2025-09-03';

-- Verify totals
SELECT
  COUNT(*) as transaction_count,
  SUM(payment_amount) as total_amount,
  SUM(total_points) as total_points,
  SUM(base_points) as base_points,
  SUM(bonus_points) as bonus_points
FROM transactions
WHERE payment_method_id = 'pm-uuid'
  AND date >= '2025-08-04'
  AND date <= '2025-09-03';

COMMIT;
```

---

## Common MCC Codes Reference

| MCC  | Description                   | Category   |
| ---- | ----------------------------- | ---------- |
| 4011 | Railroads                     | Transit    |
| 4111 | Local/Suburban Transit        | Transit    |
| 4121 | Taxicabs/Limousines           | Ride Share |
| 4131 | Bus Lines                     | Transit    |
| 4789 | Transportation Services       | Transit    |
| 5411 | Grocery Stores                | Grocery    |
| 5422 | Freezer/Locker Meat           | Grocery    |
| 5441 | Candy/Nut/Confectionery       | Grocery    |
| 5451 | Dairy Products                | Grocery    |
| 5462 | Bakeries                      | Food       |
| 5499 | Misc Food Stores              | Grocery    |
| 5541 | Service Stations              | Gas        |
| 5542 | Automated Fuel Dispensers     | Gas        |
| 5811 | Caterers                      | Food       |
| 5812 | Eating Places, Restaurants    | Food       |
| 5813 | Drinking Places (Bars)        | Food       |
| 5814 | Fast Food Restaurants         | Food       |
| 5921 | Package Stores (Liquor)       | Liquor     |
| 5651 | Family Clothing Stores        | Shopping   |
| 5968 | Direct Marketing - Continuity | Streaming  |
| 5999 | Miscellaneous Retail          | Shopping   |

---

## Exclusions

Skip these entries from import:

- Payment received / Payment thank you
- Amex Offers credits (BrownsShoesOffer, etc.)
- Statement credits
- Interest charges
- Membership fee installments
- Annual fee charges
- Cashback redemptions
- Balance transfers

---

## Error Handling

### Missing Payment Method

```
❌ No matching payment method found for: American Express Cobalt

Available payment methods:
  1. Visa Platinum (DBS) - SGD
  2. Revolution (HSBC) - SGD

Please select a payment method or add the card first.
```

### Points Verification Failed

```
⚠️ Points verification discrepancy

Statement shows:   5,988 pts
Calculated:        5,986 pts
Difference:        2 pts

This may be due to rounding differences. Continue anyway? [Y/N]
```

### Invalid MCC

```
⚠️ Unknown MCC for merchant: RANDOM STORE

Please provide MCC code (or press Enter for 5999 - Miscellaneous):
```
