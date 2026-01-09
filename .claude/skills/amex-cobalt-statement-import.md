# Amex Cobalt Statement Import Skill

This skill extracts transactions and calculates points from American Express
Cobalt credit card statements.

## Statement Structure

Amex Cobalt statements (PDF) contain:

- **Page 1**: Account summary, balance, payment info
- **Page 2-4**: Transaction details (date, merchant, amount)
- **Page 5-6**: Interest rates, statement info
- **Page 7-8**: Membership Rewards points breakdown by category

## Reward Structure

Amex Cobalt uses the following multipliers with **nearest rounding**
(`Math.round`):

| Category         | Multiplier | MCC Codes                                             | Currency Condition |
| ---------------- | ---------- | ----------------------------------------------------- | ------------------ |
| Food & Groceries | 5x         | 5411, 5422, 5441, 5451, 5499, 5811, 5812, 5813, 5814  | CAD only           |
| Streaming        | 3x         | Merchant name match (Netflix, Spotify, Audible, etc.) | CAD only           |
| Gas & Transit    | 2x         | 4011, 4111, 4121, 4131, 4789, 5541, 5542              | Any currency       |
| All Other        | 1x         | Everything else                                       | Any currency       |

**Important**: Food/Grocery (5x) and Streaming (3x) bonuses require CAD currency.
Gas & Transit (2x) applies to all currencies including USD.

## Points Calculation Formula

Using `total_first` calculation method (Amex Canada standard):

```typescript
// Calculate points with nearest rounding
const totalMultiplier = baseMultiplier + bonusMultiplier; // e.g., 1 + 4 = 5 for food
const totalPoints = Math.round(paymentAmount * totalMultiplier);
const basePoints = Math.round(paymentAmount * baseMultiplier);
const bonusPoints = totalPoints - basePoints;
```

## Extracting Transactions from Statement

### Transaction Fields to Extract

From statement pages 2-4:

- **Transaction Date**: First date column (when purchase was made)
- **Posting Date**: Second date column (when posted to account)
- **Merchant Name**: Description field - clean up store numbers, locations
- **Amount**: Dollar amount (positive = purchase, negative = refund/credit)
- **Foreign Currency**: If present, shows original amount and exchange rate

### Merchant Name Normalization

| Statement Shows                | Normalize To                  |
| ------------------------------ | ----------------------------- |
| SAFEWAY #4930 NEW WESTM        | Safeway                       |
| SAVE ON FOODS #2225 BURNABY    | Save-On-Foods                 |
| PRICESMART FOODS #2281 BURNABY | PriceSmart                    |
| UBER TRIP HTTPS://HELP.UB      | Uber                          |
| LYFT \*RIDE SUN 12PM VANCOUVER | Lyft                          |
| NETFLIX.COM 866-716-0414       | Netflix                       |
| AMAZON.CA\*NR6HP3TL2           | Amazon                        |
| LULULEMON ON STANFOR PALO ALTO | Lululemon (address: Stanford) |

### Handling Foreign Currency Transactions

Statement shows:
`CALTRAIN SAN CARLOS $32.14 UNITED STATES DOLLAR 23.00 @ 1.39739`

Extract:

- `amount`: 23.00 (original USD)
- `currency`: USD
- `payment_amount`: 32.14 (converted CAD)
- `payment_currency`: CAD

**Points calculated on `payment_amount` (CAD). Currency condition uses
`currency` (USD) → 1x for food/streaming, but 2x for transit/ride share.**

### Exclude from Import

- Payment received entries
- Amex Offers credits (BrownsShoesOffer, ShopSmallOffer, etc.)
- Membership fee installments
- Interest charges

## Database Schema

### Transactions Table

```typescript
{
  id: string;                    // UUID
  user_id: string;               // From auth
  date: string;                  // ISO date (transaction date)
  merchant_id: string;           // FK to merchants
  amount: number;                // Original amount (in original currency)
  currency: string;              // Original currency (USD, CAD, etc.)
  payment_method_id: string;     // FK to payment_methods
  payment_amount: number;        // Converted amount (in card currency)
  payment_currency: string;      // Card currency (CAD for Cobalt)
  total_points: number;
  base_points: number;
  bonus_points: number;
  is_contactless: boolean;
  mcc_code: string;
  notes?: string;
}
```

### Amex Cobalt Payment Method

- **ID**: Look up by name "Cobalt" and issuer "American Express"
- **Card Type ID**: `american-express-cobalt`
- **Currency**: CAD

## Import Process

1. **Read PDF statement** using the Read tool
2. **Extract transactions** from pages 2-4
3. **Query existing transactions** in date range to avoid duplicates (match on
   merchant name + amount)
4. **Present new transactions to user for review** - IMPORTANT: Show a detailed
   table with:
   - All transactions grouped by category (5x Food, 3x Streaming, 2x Transit,
     1x Other)
   - Date, merchant name, amount, points, location/notes
   - Highlight foreign currency transactions (show original + converted amount)
   - Summary totals by category
   - Overall totals to verify against statement
5. **Ask for MCC codes** if not determinable from merchant name
6. **Calculate points** using RewardService logic or manual calculation with
   rules above
7. **Cross-reference with statement** pages 7-8 to verify points
8. **Get user approval** before importing
9. **Look up existing merchants first** - ALWAYS query for existing merchants by
   exact name before creating new ones. This prevents duplicate merchant records
   for common merchants like Uber, Lyft, Compass, etc.
10. **Insert transactions** to database
11. **Reconcile totals** - if calculated differs from statement, adjust to match

## Merchant Lookup Pattern

Always check for existing merchants before creating new ones:

```typescript
// Cache for merchant lookups
const merchantCache: Map<string, string> = new Map();

async function findOrCreateMerchant(
  name: string,
  mccCode: string,
  mccDescription: string,
  isOnline: boolean,
  address?: string
): Promise<string | null> {
  // Check cache first
  const cacheKey = name.toLowerCase();
  if (merchantCache.has(cacheKey)) {
    return merchantCache.get(cacheKey)!;
  }

  // Look for existing merchant by exact name match
  const { data: existing } = await supabase
    .from("merchants")
    .select("id, name")
    .eq("name", name)
    .eq("is_deleted", false)
    .limit(1);

  if (existing && existing.length > 0) {
    merchantCache.set(cacheKey, existing[0].id);
    return existing[0].id;
  }

  // Create new merchant only if not found
  const merchantId = crypto.randomUUID();
  const { error } = await supabase.from("merchants").insert([
    {
      id: merchantId,
      name: name,
      address: address || null,
      mcc: { code: mccCode, description: mccDescription },
      mcc_code: mccCode,
      is_online: isOnline,
    },
  ]);

  if (error) {
    console.error(`Error creating merchant ${name}:`, error);
    return null;
  }

  merchantCache.set(cacheKey, merchantId);
  return merchantId;
}
```

### Common Consolidated Merchants

These merchants have been standardized - always use exact names:

| Merchant | MCC | Type |
| -------- | --- | ---- |
| Compass | 4111 | Transit |
| Presto | 4111 | Transit |
| Caltrain | 4111 | Transit |
| Lyft | 4121 | Ride Share |
| Uber | 4121 | Ride Share |
| Uber Eats | 5812 | Food Delivery |
| Oddbunch | 5411 | Grocery |

## Verification Against Statement

Statement page 7-8 shows points breakdown:

- "5 pts/$1 Eligible Food/Drink: $X,XXX.XX → X,XXX pts"
- "3 pts/$1 Eligible Streaming: $XX.XX → XXX pts"
- "2 pts/$1 Eligible Gas/Transit/Ride Share: $XXX.XX → XXX pts"

Sum these and compare to your calculated totals. If there's a gap:

1. Check if any transaction is miscategorized
2. USD food/streaming transactions get 1x only; USD transit gets 2x
3. Adjust individual transactions to match statement values

## Example Import Script

```typescript
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(url, key);

interface TransactionInput {
  date: string; // YYYY-MM-DD
  merchant: string; // Normalized name
  amount: number; // Original amount
  currency: string; // Original currency
  paymentAmount: number; // CAD amount (for foreign transactions)
  mccCode: string;
  isOnline?: boolean;
  address?: string;
}

// MCCs that get bonus regardless of currency
const TRANSIT_MCCS = ["4011", "4111", "4121", "4131", "4789", "5541", "5542"];
// MCCs that require CAD for bonus
const FOOD_MCCS = ["5411", "5422", "5441", "5451", "5499", "5811", "5812", "5813", "5814"];

function calculatePoints(
  paymentAmount: number,
  mccCode: string,
  currency: string
) {
  let multiplier = 1; // default

  if (TRANSIT_MCCS.includes(mccCode)) {
    // Transit: 2x for any currency
    multiplier = 2;
  } else if (currency === "CAD" && FOOD_MCCS.includes(mccCode)) {
    // Food/Grocery: 5x CAD only
    multiplier = 5;
  }
  // Streaming: 3x CAD only (requires merchant name match, not MCC)

  const totalPoints = Math.round(paymentAmount * multiplier);
  const basePoints = Math.round(paymentAmount * 1);
  const bonusPoints = totalPoints - basePoints;

  return { basePoints, bonusPoints, totalPoints };
}
```

## Common Issues

1. **Points don't match statement**: Check currency conditions - USD food/streaming
   gets 1x only, but USD transit gets 2x
2. **Walmart categorization**: Can be grocery (5411) at 5x or dept store (5311)
   at 1x - verify against statement
3. **Refunds**: Use negative amounts, points are negative too
4. **Rounding differences**: Always use `Math.round()` (nearest), not
   `Math.floor()`

## Script Setup Notes

When creating import scripts in this codebase:

1. **Environment variables**: The file is `.env` (not `.env.local`). Load it
   manually:

   ```typescript
   import { readFileSync } from "fs";
   import { join } from "path";

   const envPath = join(process.cwd(), ".env");
   const envContent = readFileSync(envPath, "utf-8");
   const envVars: Record<string, string> = {};
   for (const line of envContent.split("\n")) {
     const match = line.match(/^([^=]+)="?([^"]*)"?$/);
     if (match) {
       envVars[match[1]] = match[2];
     }
   }
   ```

2. **Supabase keys**: Use `SUPABASE_SERVICE_ROLE_KEY` for scripts (bypasses
   RLS), not `VITE_SUPABASE_PUBLISHABLE_KEY` which is for client-side.

3. **Don't use dotenv**: It's not installed. Use manual env parsing above.

4. **Run scripts with**: `npx tsx src/scripts/<script>.ts`

5. **Default user ID**: Use `"00000000-0000-0000-0000-000000000000"` for
   `user_id` field when inserting transactions via scripts.

## Bonus Points Clarification

The statement "Bonus Points" line refers to the **monthly welcome bonus
promo**, not the category multiplier bonuses. Category bonuses are included in
"Points Earned". To verify:

- Total Points Earned = Sum of all transaction points
- This includes both base (1x) and category multiplier points
