# American Express Cobalt Card Setup Guide (Canada)

## Understanding Priority

**Priority** determines the order in which reward rules are evaluated:

- **Higher number = Evaluated first** (more specific rules)
- **Lower number = Evaluated last** (catch-all rules)
- The system applies the **first matching rule** and stops

### Example Flow:
```
Transaction: $100 CAD at a restaurant (MCC 5812)

Step 1: Check Priority 40 (Food & Groceries - CAD only)
        ✓ Matches MCC 5812 AND currency CAD → Apply 5x points → STOP

Result: Earns 500 points (5x)
```

## American Express Cobalt Card Rules

### Rule Structure

| Priority | Rule Name | Earn Rate | Conditions |
|----------|-----------|-----------|------------|
| 40 | Food & Groceries | 5x | Specific MCCs + CAD currency |
| 30 | Streaming | 3x | Specific MCCs + CAD currency |
| 20 | Gas & Transit | 2x | Specific MCCs + CAD currency |
| 1 | Base Earn | 1x | Everything else (all currencies) |

### Rule 1: Food & Groceries (Priority 40)

**Earn Rate:** 5 points per $1 CAD

**Monthly Spend Cap:** $2,500 CAD per calendar month
- This equals 10,000 bonus points per month (4 bonus × $2,500)
- After cap is reached, earn 1x base points
- Cap resets on the 1st of each calendar month

**Applies to (CAD transactions only):**

**Restaurants & Dining:**
- MCC 5811: Caterers
- MCC 5812: Eating Places, Restaurants
- MCC 5813: Drinking Places (Bars, Taverns, Nightclubs)
- MCC 5814: Fast Food Restaurants

**Grocery Stores:**
- MCC 5411: Grocery Stores, Supermarkets
- MCC 5422: Freezer and Locker Meat Provisioners
- MCC 5441: Candy, Nut, and Confectionery Stores
- MCC 5451: Dairy Products Stores

**Food & Grocery Delivery:**
- MCC 5499: Miscellaneous Food Stores (includes delivery services)

**Examples that EARN 5x:**
- Tim Hortons, Starbucks, McDonald's (CAD)
- Swiss Chalet, The Keg, local restaurants (CAD)
- Loblaws, Sobeys, Metro, Walmart Supercentre grocery (CAD)
- Uber Eats, DoorDash, Skip the Dishes (CAD)
- Instacart, Grocery Gateway (CAD)

**Examples that DON'T earn 5x:**
- Same merchants but paid in USD or other foreign currency (earns 1x)
- General merchandise at Walmart/Costco (not grocery MCC)
- After spending $2,500 CAD in the month (earns 1x)

**Why Priority 40?**
This is the highest priority because it's the most specific rule - requires both specific MCCs AND CAD currency. This ensures CAD food purchases always get 5x before checking other rules.

### Rule 2: Streaming Subscriptions (Priority 30)

**Earn Rate:** 3 points per $1 CAD

**No Monthly Cap**

**Applies to (CAD transactions only):**

**Matched by Merchant Name** (not MCC code)

**Eligible Providers (check americanexpress.ca/streaming for current list):**
- Netflix
- Spotify
- Apple Music
- Disney+ / Disney Plus
- Amazon Prime Video / Prime Video
- Crave
- HBO Max
- Paramount+ / Paramount Plus
- YouTube Premium
- Apple TV+ / Apple TV Plus
- Deezer
- Tidal
- SiriusXM
- Audible
- And other eligible streaming services

**Important Restrictions:**
- Must be billed directly by the streaming provider
- NOT eligible if bundled with other services
- NOT eligible if billed by third parties (cable/telecom providers, digital platforms, car manufacturers)
- Merchant name must match one of the eligible providers
- When entering transactions, ensure the merchant name matches exactly (e.g., "Netflix", "Spotify")

**Examples that EARN 3x:**
- Netflix subscription billed directly (CAD) - merchant name "Netflix"
- Spotify Premium billed directly (CAD) - merchant name "Spotify"
- Disney+ subscription (CAD) - merchant name "Disney+" or "Disney Plus"
- Apple Music (CAD) - merchant name "Apple Music"

**Examples that DON'T earn 3x:**
- Netflix bundled with Rogers cable package (merchant name "Rogers")
- Spotify billed through Apple App Store (merchant name "Apple.com/bill")
- Amazon Prime (includes shipping, not just streaming)
- Same services paid in USD (earns 1x)
- Merchant name doesn't match eligible list

**Why Priority 30?**
Lower than food/groceries but higher than gas/transit. Requires specific merchant names AND CAD currency.

### Rule 3: Gas & Transit (Priority 20)

**Earn Rate:** 2 points per $1 CAD

**No Monthly Cap**

**Applies to (CAD transactions only):**

**Gas Stations:**
- MCC 5541: Service Stations (with or without ancillary services)
- MCC 5542: Automated Fuel Dispensers

**Local Commuter Transportation:**
- MCC 4111: Local/Suburban Commuter Passenger Transportation
- MCC 4121: Taxicabs and Limousines
- MCC 4131: Bus Lines
- MCC 4789: Transportation Services (ride sharing)
- MCC 4011: Railroads (local commuter)

**Examples that EARN 2x:**
- Petro-Canada, Shell, Esso (CAD)
- TTC, STM, TransLink transit passes (CAD)
- Uber, Lyft rides (CAD)
- Beck Taxi, local taxi services (CAD)
- GO Transit, VIA Rail local commuter (CAD)

**Examples that DON'T earn 2x:**
- Gas purchased at Costco (general merchandise MCC)
- Gas purchased in USD
- Long-distance train/bus travel (different MCC)
- Airport transportation (may use different MCC)

**Why Priority 20?**
Lower than streaming. Requires specific MCCs AND CAD currency.

### Rule 4: Base Earn (Priority 1)

**Earn Rate:** 1 point per $1

**Applies to:**
- All other transactions that don't match the above rules
- ALL foreign currency transactions (even in bonus categories)
- Transactions after hitting the $2,500 monthly cap

**Examples:**
- Shopping, electronics, clothing (any currency)
- Hotels, flights (any currency)
- Restaurant in USD (even though restaurants are 5x in CAD)
- Grocery in EUR (even though groceries are 5x in CAD)
- Food delivery after hitting $2,500 CAD cap

**Why Priority 1?**
This is the catch-all rule. It has no conditions, so it matches everything. By giving it the lowest priority, it only applies when no other rules match.

## Points Calculation

### Formula:
```
Base Points (1x)  = FLOOR(Amount) × 1
Bonus Points (Nx) = FLOOR(Amount) × (N - 1)
Total Points      = Base + Bonus
```

### Examples:

**Example 1: $50.75 CAD at a restaurant**
- Matches: Rule 1 (Food & Groceries, Priority 40)
- Amount rounded down: $50
- Base points: 50 × 1 = 50
- Bonus points: 50 × 4 = 200
- **Total: 250 points (5x)**

**Example 2: $100.50 CAD at Petro-Canada**
- Matches: Rule 3 (Gas & Transit, Priority 20)
- Amount rounded down: $100
- Base points: 100 × 1 = 100
- Bonus points: 100 × 1 = 100
- **Total: 200 points (2x)**

**Example 3: $75.25 USD at a restaurant in New York**
- Matches: Rule 4 (Base, Priority 1) - foreign currency
- Amount rounded down: $75
- Base points: 75 × 1 = 75
- Bonus points: 0
- **Total: 75 points (1x)**

**Example 4: $30 CAD Netflix subscription**
- Matches: Rule 2 (Streaming, Priority 30)
- Amount rounded down: $30
- Base points: 30 × 1 = 30
- Bonus points: 30 × 2 = 60
- **Total: 90 points (3x)**

## Monthly Spend Cap Explained

### The $2,500 CAD Monthly Spend Cap

Only applies to the 5x category (restaurants, groceries, food delivery).

**Key Facts:**
1. **Cap Amount:** $2,500 CAD in eligible spend per calendar month
2. **Bonus Points Cap:** 10,000 bonus points (4 bonus × $2,500)
3. **Calendar Month:** Resets on the 1st of each month (not statement month)
4. **After Cap:** You still earn 1x base points on all purchases
5. **CAD Only:** Only CAD transactions count toward the cap

### Example Scenario

Let's track spending through January:

| Date | Transaction | Amount | Points Earned | Spend Used | Remaining Cap |
|------|-------------|--------|---------------|------------|---------------|
| Jan 3 | Loblaws (grocery) | $200 CAD | 1,000 | $200 | $2,300 |
| Jan 7 | Restaurant | $150 CAD | 750 | $350 | $2,150 |
| Jan 10 | Uber Eats | $50 CAD | 250 | $400 | $2,100 |
| Jan 15 | Sobeys (grocery) | $300 CAD | 1,500 | $700 | $1,800 |
| ... | ... | ... | ... | ... | ... |
| Jan 28 | Restaurant | $500 CAD | 2,500 | $2,500 | **$0 (CAP REACHED)** |
| Jan 30 | Grocery | $100 CAD | 100 | $2,600 | $0 |
| Feb 1 | Restaurant | $80 CAD | 400 | $80 | $2,420 |

**Total for January:**
- Qualifying spend: $2,600 CAD
- Total points from 5x category: 12,600 points
- Bonus points: 10,000 (capped)
- Base points: 2,600 (always earned)

## Foreign Currency Transactions

**Critical Rule:** Bonus points ONLY apply to CAD transactions.

### Examples:

**Scenario 1: Restaurant in Toronto (CAD)**
- Amount: $100 CAD
- MCC: 5812 (Restaurant)
- **Result: 500 points (5x)**

**Scenario 2: Restaurant in New York (USD)**
- Amount: $100 USD
- MCC: 5812 (Restaurant)
- **Result: 100 points (1x)** - Foreign currency, no bonus

**Scenario 3: Gas in Vancouver (CAD)**
- Amount: $60 CAD
- MCC: 5541 (Gas Station)
- **Result: 120 points (2x)**

**Scenario 4: Gas in Seattle (USD)**
- Amount: $60 USD
- MCC: 5541 (Gas Station)
- **Result: 60 points (1x)** - Foreign currency, no bonus

## Setup Instructions

### Step 1: Create Payment Method

In the app:
1. Go to "Payment Methods"
2. Click "Add Method"
3. Enter:
   - **Name:** `Cobalt`
   - **Issuer:** `American Express`
   - **Type:** Credit Card
   - **Currency:** CAD
   - **Last 4 Digits:** [your card's last 4 digits]

### Step 2: Run Setup Script

Open browser console (F12) and run:

```javascript
const module = await import('/src/scripts/setupAmexCobaltCard.ts');
```

This will:
1. Delete any existing rules for this card
2. Create the 4 new rules with correct priorities
3. Configure all MCCs and conditions

### Step 3: Verify Setup

1. Go to "Payment Methods"
2. Select "American Express Cobalt"
3. Click "Manage Reward Rules"
4. You should see 4 rules:
   - ✅ 5x Points on Food & Groceries (Priority 40)
   - ✅ 3x Points on Streaming (Priority 30)
   - ✅ 2x Points on Gas & Transit (Priority 20)
   - ✅ 1x Points on All Other Purchases (Priority 1)

## Testing

### Test Case 1: CAD Restaurant
```
Amount: $100 CAD
Merchant: Swiss Chalet
MCC: 5812 (Restaurant)
Currency: CAD

Expected: 500 points (5x from Rule 1)
```

### Test Case 2: USD Restaurant
```
Amount: $100 USD
Merchant: Restaurant in USA
MCC: 5812 (Restaurant)
Currency: USD

Expected: 100 points (1x from Rule 4)
```

### Test Case 3: CAD Grocery
```
Amount: $150 CAD
Merchant: Loblaws
MCC: 5411 (Grocery)
Currency: CAD

Expected: 750 points (5x from Rule 1)
```

### Test Case 4: CAD Gas
```
Amount: $60 CAD
Merchant: Petro-Canada
MCC: 5541 (Gas Station)
Currency: CAD

Expected: 120 points (2x from Rule 3)
```

### Test Case 5: CAD Streaming
```
Amount: $15 CAD
Merchant: Netflix
Currency: CAD

Expected: 45 points (3x from Rule 2)
Note: Merchant name must match "Netflix" exactly
```

### Test Case 6: After Monthly Cap
```
Amount: $100 CAD
Merchant: Restaurant
MCC: 5812
Currency: CAD
Monthly spend already: $2,500 CAD

Expected: 100 points (1x - cap reached)
```

## Troubleshooting

### Issue: CAD restaurant earning 1x instead of 5x

**Possible causes:**
1. Transaction not marked as CAD currency
2. MCC not in the restaurant/grocery/delivery list
3. Monthly cap already reached ($2,500 CAD)

**Solution:**
- Verify currency is set to CAD
- Check MCC code
- Check monthly spend total

### Issue: Streaming service earning 1x instead of 3x

**Possible causes:**
1. Merchant name doesn't match eligible list
2. Not billed directly by streaming provider
3. Bundled with other services
4. Not in CAD currency
5. Provider not on eligible list

**Solution:**
- Check the merchant name matches exactly (e.g., "Netflix", not "NETFLIX INC")
- Verify it's billed directly (not through cable/telecom)
- Check if it's a standalone subscription
- Verify currency is CAD
- Check americanexpress.ca/streaming for eligible providers
- You may need to manually add the merchant name to the rule if it's a valid provider

### Issue: Foreign transaction earning bonus points

**This should not happen.** Only CAD transactions should earn bonus points.

**Solution:**
- Verify the currency condition is properly set in the rules
- Check that foreign currency transactions are being tagged correctly

## Additional Notes

### Converting Points to Travel

Membership Rewards points can be transferred to various airline and hotel partners:
- Aeroplan (Air Canada)
- British Airways Executive Club
- Marriott Bonvoy
- And many others

Transfer ratios vary by partner.

### Annual Fee

The Amex Cobalt card has a monthly fee structure (typically $12.99/month = ~$156/year).

### Best Practices

1. **Use for all CAD food/grocery purchases** to maximize 5x earnings
2. **Track your monthly spend** to know when you're approaching the $2,500 cap
3. **Switch cards after cap** - use a different card for food/groceries after hitting $2,500
4. **Use for CAD streaming** subscriptions (3x with no cap)
5. **Use for CAD gas and transit** (2x with no cap)
6. **Don't use for foreign currency** - use a no-FX-fee card instead

## Updating the Streaming Merchant List

The list of eligible streaming providers may change over time. To add or remove merchants:

1. Go to "Payment Methods" → "American Express Cobalt" → "Manage Reward Rules"
2. Find the "3x Points on Streaming" rule
3. Edit the rule and update the merchant name list
4. Save the changes

Alternatively, you can modify the `streamingMerchants` array in `src/scripts/setupAmexCobaltCard.ts` and re-run the setup script.

**Note:** Merchant name matching is case-sensitive and must match exactly as it appears on your transaction records.

## Support

If you encounter issues:
1. Check browser console for errors
2. Verify card name and issuer match exactly: "American Express" / "Cobalt"
3. Check rule priorities in "Manage Reward Rules"
4. Verify currency is set correctly for each transaction
5. Check monthly spend tracking for the 5x category
6. For streaming issues, verify the merchant name matches the eligible list exactly
