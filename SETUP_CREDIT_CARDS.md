# Credit Card Setup Guide

This guide will help you fix the reward rules error and set up three credit cards with their reward structures.

## Problem: "Error Loading Rules - Failed to load reward rules"

### Root Cause

The `reward_rules` table has `card_type_id` defined as `uuid` type, but the application uses string-based card type IDs like `"american express-cobalt"`. This type mismatch causes database queries to fail.

### Solution

Apply the database migration to fix the column type:

```bash
# Option 1: Using Supabase CLI (recommended)
supabase db push

# Option 2: Manual SQL execution
# Go to Supabase Dashboard > SQL Editor and run the migration file:
# supabase/migrations/20251127000000_fix_card_type_id_type.sql
```

## Step-by-Step Setup

### Step 1: Apply Database Migration

1. Open Supabase Dashboard (https://supabase.com/dashboard)
2. Select your project
3. Go to "SQL Editor"
4. Click "New Query"
5. Copy and paste the contents of `supabase/migrations/20251127000000_fix_card_type_id_type.sql`
6. Click "Run"
7. Verify success message

### Step 2: Verify Migration

Run this query in SQL Editor to verify the fix:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'reward_rules' AND column_name = 'card_type_id';
```

Expected result: `data_type` should be `text` (not `uuid`)

### Step 3: Create Payment Methods

Go to the app's "Payment Methods" page and create these three cards:

#### Card 1: American Express Cobalt (Canada)

```
Name: Cobalt
Issuer: American Express
Type: Credit Card
Currency: CAD
Last 4 Digits: [your card's last 4 digits]
Statement Start Day: [optional, e.g., 1]
```

#### Card 2: Citibank Rewards Visa Signature (Singapore)

```
Name: Rewards Visa Signature
Issuer: Citibank
Type: Credit Card
Currency: SGD
Last 4 Digits: [your card's last 4 digits]
Statement Start Day: [optional, e.g., 1]
```

#### Card 3: American Express Aeroplan Reserve (Canada)

```
Name: Aeroplan Reserve
Issuer: American Express
Type: Credit Card
Currency: CAD
Last 4 Digits: [your card's last 4 digits]
Statement Start Day: [optional, e.g., 1]
```

**Important:** The `Issuer` and `Name` fields must match exactly as shown above for the reward rules to work correctly.

### Step 4: Set Up Reward Rules

#### Option A: Automated Setup (Recommended)

1. Open browser console (F12)
2. Run the setup script:

```javascript
// Import and execute the setup script
const module = await import('/src/scripts/setupCreditCards.ts');
```

This will automatically create all reward rules for the three cards.

#### Option B: Manual Setup

For each card, click "Manage Reward Rules" and create the rules manually:

##### American Express Cobalt Rules

**Rule 1: 5x Points on Eats & Drinks**
- Name: `5x Points on Eats & Drinks`
- Description: `Earn 5x points on eligible eats and drinks purchases`
- Priority: `10`
- Enabled: ✓
- Conditions:
  - Type: `MCC`
  - Operation: `Include`
  - Values: `5812, 5813, 5814` (Restaurants, bars, drinking places)
- Reward:
  - Base Multiplier: `1`
  - Bonus Multiplier: `4`
  - Points Currency: `MR`

**Rule 2: 3x Points on Streaming**
- Name: `3x Points on Streaming`
- Description: `Earn 3x points on eligible streaming subscriptions`
- Priority: `9`
- Enabled: ✓
- Conditions:
  - Type: `MCC`
  - Operation: `Include`
  - Values: `4899, 7841` (Cable/streaming services)
- Reward:
  - Base Multiplier: `1`
  - Bonus Multiplier: `2`
  - Points Currency: `MR`

**Rule 3: 2x Points on Transit & Gas**
- Name: `2x Points on Transit & Gas`
- Description: `Earn 2x points on transit and gas station purchases`
- Priority: `8`
- Enabled: ✓
- Conditions:
  - Type: `MCC`
  - Operation: `Include`
  - Values: `4111, 4112, 4121, 4131, 5541, 5542` (Transit and gas)
- Reward:
  - Base Multiplier: `1`
  - Bonus Multiplier: `1`
  - Points Currency: `MR`

**Rule 4: 1x Points on Everything Else**
- Name: `1x Points on All Other Purchases`
- Description: `Earn 1x points on all other eligible purchases`
- Priority: `1`
- Enabled: ✓
- Conditions: (none - catch-all rule)
- Reward:
  - Base Multiplier: `1`
  - Bonus Multiplier: `0`
  - Points Currency: `MR`

##### Citibank Rewards Visa Signature Rules

**Rule 1: 10x Points on Online Spend**
- Name: `10x Points on Online Spend`
- Description: `Earn 10x points on online purchases (capped at SGD 2,000/month)`
- Priority: `10`
- Enabled: ✓
- Conditions:
  - Type: `Online`
  - Operation: `Equals`
  - Values: `true`
- Reward:
  - Base Multiplier: `1`
  - Bonus Multiplier: `9`
  - Points Currency: `Citi Points`
  - Monthly Cap: `20000` (2000 SGD × 10 points)

**Rule 2: 2x Points on Dining**
- Name: `2x Points on Dining`
- Description: `Earn 2x points on dining purchases`
- Priority: `9`
- Enabled: ✓
- Conditions:
  - Type: `MCC`
  - Operation: `Include`
  - Values: `5812, 5813, 5814`
- Reward:
  - Base Multiplier: `1`
  - Bonus Multiplier: `1`
  - Points Currency: `Citi Points`

**Rule 3: 1x Points on Everything Else**
- Name: `1x Points on All Other Purchases`
- Description: `Earn 1x points on all other eligible purchases`
- Priority: `1`
- Enabled: ✓
- Conditions: (none - catch-all rule)
- Reward:
  - Base Multiplier: `1`
  - Bonus Multiplier: `0`
  - Points Currency: `Citi Points`

##### American Express Aeroplan Reserve Rules

**Rule 1: 3x Points on Air Canada**
- Name: `3x Points on Air Canada`
- Description: `Earn 3x points on Air Canada purchases`
- Priority: `10`
- Enabled: ✓
- Conditions:
  - Type: `Merchant`
  - Operation: `Include`
  - Values: `Air Canada, AIR CANADA`
- Reward:
  - Base Multiplier: `1`
  - Bonus Multiplier: `2`
  - Points Currency: `Aeroplan`

**Rule 2: 2x Points on Dining, Groceries & Travel**
- Name: `2x Points on Dining, Groceries & Travel`
- Description: `Earn 2x points on dining, groceries, and travel purchases`
- Priority: `9`
- Enabled: ✓
- Conditions:
  - Type: `MCC`
  - Operation: `Include`
  - Values: `5812, 5813, 5814, 5411, 5422, 5441, 5451, 5462, 3000-3299, 4511, 4722`
- Reward:
  - Base Multiplier: `1`
  - Bonus Multiplier: `1`
  - Points Currency: `Aeroplan`

**Rule 3: 1.25x Points on Everything Else**
- Name: `1.25x Points on All Other Purchases`
- Description: `Earn 1.25x points on all other eligible purchases`
- Priority: `1`
- Enabled: ✓
- Conditions: (none - catch-all rule)
- Reward:
  - Base Multiplier: `1.25`
  - Bonus Multiplier: `0`
  - Points Currency: `Aeroplan`

### Step 5: Verify Setup

1. Go to "Payment Methods" page
2. Select each card
3. Click "Manage Reward Rules"
4. Verify that all rules are displayed correctly
5. Test by adding a transaction with each card

## Common MCC Codes Reference

For creating custom rules, here are common MCC codes:

### Dining
- `5812` - Eating Places, Restaurants
- `5813` - Drinking Places (Alcoholic Beverages), Bars, Taverns, Cocktail Lounges, Nightclubs, Discotheques
- `5814` - Fast Food Restaurants

### Groceries
- `5411` - Grocery Stores, Supermarkets
- `5422` - Freezer and Locker Meat Provisioners
- `5441` - Candy, Nut, and Confectionery Stores
- `5451` - Dairy Products Stores
- `5462` - Bakeries

### Gas Stations
- `5541` - Service Stations (with or without Ancillary Services)
- `5542` - Automated Fuel Dispensers

### Transit
- `4111` - Local and Suburban Commuter Passenger Transportation
- `4112` - Passenger Railways
- `4121` - Taxicabs and Limousines
- `4131` - Bus Lines

### Travel
- `3000-3299` - Airlines
- `4511` - Airlines, Air Carriers
- `4722` - Travel Agencies and Tour Operators
- `7011` - Hotels, Motels, Resorts

### Entertainment
- `4899` - Cable, Satellite, and Other Pay Television and Radio Services
- `7832` - Motion Picture Theaters
- `7841` - Video Tape Rental Stores
- `7922` - Theatrical Producers (except Motion Pictures), Ticket Agencies
- `7929` - Bands, Orchestras, and Miscellaneous Entertainers

### Online Shopping
- `5999` - Miscellaneous and Specialty Retail Stores
- `5942` - Book Stores
- `5945` - Hobby, Toy, and Game Shops

## Troubleshooting

### Issue: "Failed to load reward rules"

**Solution:** Apply the database migration (Step 1 above)

### Issue: Rules not appearing for a card

**Possible causes:**
1. Card name/issuer doesn't match exactly
2. Rules were created for a different card type ID

**Solution:**
1. Check the card type ID in browser console:
```javascript
import { cardTypeIdService } from '@/core/rewards/CardTypeIdService';
const cardTypeId = cardTypeIdService.generateCardTypeId('American Express', 'Cobalt');
console.log('Card Type ID:', cardTypeId);
```

2. Query the database to see what rules exist:
```sql
SELECT card_type_id, name FROM reward_rules ORDER BY card_type_id, priority DESC;
```

3. If the IDs don't match, either:
   - Update the payment method name/issuer to match
   - Update the rules' card_type_id to match

### Issue: Rules created but not calculating points correctly

**Solution:** Check the rule priority and conditions. Higher priority rules are evaluated first. Make sure your catch-all rule (no conditions) has the lowest priority (1).

## Testing

After setup, test the reward calculation:

1. Go to "Add Expense" page
2. Select one of the configured cards
3. Enter a transaction amount
4. Select a merchant category that matches a rule
5. Verify the correct points are calculated and displayed

Example test cases:

- **Amex Cobalt + Restaurant (MCC 5812):** Should earn 5x points
- **Citibank + Online purchase:** Should earn 10x points (up to monthly cap)
- **Amex Aeroplan + Air Canada:** Should earn 3x points

## Support

If you encounter issues:

1. Check browser console for error messages
2. Run diagnostic script: `import('/src/scripts/diagnoseRewardRules.ts')`
3. Verify database schema matches expected structure
4. Check Supabase logs for authentication/permission issues
5. Refer to `REWARD_RULES_TROUBLESHOOTING.md` for detailed debugging steps
