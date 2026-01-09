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
| Gas & Transit    | 2x         | 4011, 4111, 4121, 4131, 4789, 5541, 5542              | CAD only           |
| All Other        | 1x         | Everything else                                       | Any currency       |

**Important**: USD transactions only get 1x base rate (no bonus) because bonus
categories require CAD currency.

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

**Points calculated on `payment_amount` (CAD), but currency condition uses
`currency` (USD) → 1x only**

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
4. **Present new transactions** to user for review
5. **Ask for MCC codes** if not determinable from merchant name
6. **Calculate points** using RewardService logic or manual calculation with
   rules above
7. **Cross-reference with statement** pages 7-8 to verify points
8. **Insert transactions** to database
9. **Reconcile totals** - if calculated differs from statement, adjust to match

## Verification Against Statement

Statement page 7-8 shows points breakdown:

- "5 pts/$1 Eligible Food/Drink: $X,XXX.XX → X,XXX pts"
- "3 pts/$1 Eligible Streaming: $XX.XX → XXX pts"
- "2 pts/$1 Eligible Gas/Transit/Ride Share: $XXX.XX → XXX pts"

Sum these and compare to your calculated totals. If there's a gap:

1. Check if any transaction is miscategorized
2. USD transactions should be 1x only
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

const MCC_MULTIPLIERS: Record<string, number> = {
  "5411": 5,
  "5812": 5, // Food/Grocery/Restaurant
  "5968": 3, // Streaming
  "4121": 2, // Transit/Ride Share
  // Everything else: 1
};

function calculatePoints(
  paymentAmount: number,
  mccCode: string,
  currency: string
) {
  // USD transactions only get 1x
  const multiplier = currency === "CAD" ? MCC_MULTIPLIERS[mccCode] || 1 : 1;

  const totalPoints = Math.round(paymentAmount * multiplier);
  const basePoints = Math.round(paymentAmount * 1);
  const bonusPoints = totalPoints - basePoints;

  return { basePoints, bonusPoints, totalPoints };
}
```

## Common Issues

1. **Points don't match statement**: Check currency conditions - USD gets 1x
   only
2. **Walmart categorization**: Can be grocery (5411) at 5x or dept store (5311)
   at 1x - verify against statement
3. **Refunds**: Use negative amounts, points are negative too
4. **Rounding differences**: Always use `Math.round()` (nearest), not
   `Math.floor()`
