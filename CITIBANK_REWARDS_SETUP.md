# Citibank Rewards Visa Signature Setup Guide

## Understanding Priority

**Priority** determines the order in which reward rules are evaluated:

- **Higher number = Evaluated first** (more specific rules)
- **Lower number = Evaluated last** (catch-all rules)
- The system applies the **first matching rule** and stops

### Example Flow:
```
Transaction: $100 online purchase at Zara (MCC 5621 - Women's Clothing)

Step 1: Check Priority 20 (Fashion & Department Stores)
        ✓ Matches MCC 5621 → Apply 10x points → STOP

Result: Earns 10x points (not checked against other rules)
```

### Priority Best Practices:
- **Priority 20+**: Very specific rules (e.g., specific merchants or categories)
- **Priority 10-19**: Moderately specific rules (e.g., online transactions)
- **Priority 1-9**: General rules
- **Priority 1**: Always use for catch-all rules (no conditions)

## Citibank Rewards Visa Signature Rules

### Rule Structure

| Priority | Rule Name | Earn Rate | Conditions |
|----------|-----------|-----------|------------|
| 20 | Fashion & Department Stores | 10x (4 mpd) | Specific MCCs (online or offline) |
| 10 | Online Transactions | 10x (4 mpd) | Online = true, NOT travel MCCs |
| 1 | Base Earn | 1x (1 mpd) | Everything else |

### Rule 1: Fashion & Department Stores (Priority 20)

**Earn Rate:** 10x points (4 miles per dollar)

**Monthly Cap:** 9,000 bonus points per statement month (shared with online transactions)

**Applies to:**
- Department stores (MCC 5311)
- Men's and boys' clothing (MCC 5611)
- Women's ready-to-wear (MCC 5621)
- Women's accessories (MCC 5631)
- Children's and infants' wear (MCC 5641)
- Family clothing stores (MCC 5651)
- Sports and riding apparel (MCC 5655)
- Shoe stores (MCC 5661)
- Men's and women's clothing (MCC 5691)
- Miscellaneous apparel (MCC 5699)
- Luggage and leather goods (MCC 5948)

**Examples:**
- Takashimaya, TANGS, Isetan, OG, Metro, BHG, Marks & Spencer
- Zara, H&M, Uniqlo, ASOS, Burberry
- Nike, Lululemon, Adidas
- Charles & Keith, Skechers, Bata
- Louis Vuitton, Coach, Rimowa

**Why Priority 20?**
This rule has the highest priority because it applies to specific MCCs regardless of whether the transaction is online or offline. If a transaction matches these MCCs, it should earn 10x points immediately without checking other rules.

### Rule 2: Online Transactions (Priority 10)

**Earn Rate:** 10x points (4 miles per dollar)

**Monthly Cap:** 9,000 bonus points per statement month (shared with fashion category)

**Applies to:**
- All online transactions
- **EXCEPT:**
  - Travel-related transactions (see blacklist below)
  - In-app mobile wallet payments (Apple Pay/Google Pay virtual transactions)

**Travel MCCs Excluded:**
- Airlines: 3000-3350, 4511
- Car Rental: 3351-3500, 7512
- Lodging/Hotels: 3501-3999, 7011
- Passenger Transport: 4111, 4112, 4789
- Cruise Lines: 4411
- Travel Agencies: 4722, 4723
- Direct Marketing Travel: 5962
- Timeshares: 7012

**Examples that EARN 10x:**
- Online shopping at Lazada, Shopee, Amazon
- Food delivery (Deliveroo, GrabFood) - when paying with credit card directly
- Online subscriptions (Netflix, Spotify)
- Online groceries (FairPrice Online, RedMart)

**Examples that DON'T earn 10x:**
- Booking flights online (travel MCC)
- Booking hotels online (travel MCC)
- In-app Google Pay payment on Deliveroo
- In-app Apple Pay payment on Kris+

**Why Priority 10?**
This rule is less specific than the fashion rule. If a transaction is an online fashion purchase, it should match Rule 1 (Priority 20) first and earn 10x from that rule, not this one.

### Rule 3: Base Earn (Priority 1)

**Earn Rate:** 1x points (1 mile per dollar)

**Applies to:**
- All other transactions that don't match the above rules

**Examples:**
- Offline grocery shopping
- Petrol stations
- Restaurants and dining
- Travel bookings
- In-app mobile wallet payments

**Why Priority 1?**
This is the catch-all rule. It has no conditions, so it matches everything. By giving it the lowest priority, it only applies when no other rules match.

## Points Calculation

### Formula:
```
Base Points (1x)  = ROUNDDOWN(Amount, 0) × 1
Bonus Points (9x) = ROUNDDOWN(Amount, 0) × 9
Total Points      = Base + Bonus
```

### Examples:

**Example 1: $50.75 at Zara (online)**
- Matches: Rule 1 (Fashion, Priority 20)
- Amount rounded down: $50
- Base points: 50 × 1 = 50
- Bonus points: 50 × 9 = 450
- **Total: 500 points (10x)**

**Example 2: $100.50 at Lazada (online, not fashion)**
- Matches: Rule 2 (Online, Priority 10)
- Amount rounded down: $100
- Base points: 100 × 1 = 100
- Bonus points: 100 × 9 = 900
- **Total: 1,000 points (10x)**

**Example 3: $75.25 at restaurant (offline)**
- Matches: Rule 3 (Base, Priority 1)
- Amount rounded down: $75
- Base points: 75 × 1 = 75
- Bonus points: 0
- **Total: 75 points (1x)**

**Example 4: $200 flight booking (online)**
- Matches: Rule 3 (Base, Priority 1) - excluded from online bonus due to travel MCC
- Amount rounded down: $200
- Base points: 200 × 1 = 200
- Bonus points: 0
- **Total: 200 points (1x)**

## In-App Mobile Wallet Payments

### What are they?
In-app mobile wallet payments are virtual transactions where you use Apple Pay or Google Pay **within an app** (not tapping your phone at a physical terminal).

### Examples:

**❌ DON'T earn 10x (in-app mobile wallet):**
- Opening Deliveroo app → Selecting Google Pay → Paying
- Opening Kris+ app → Selecting Apple Pay → Paying
- Opening Grab app → Selecting Apple Pay → Paying

**✅ DO earn 10x (direct credit card):**
- Opening Deliveroo app → Selecting "Credit Card" → Entering card details
- Opening Grab app → Selecting "Credit Card" → Using saved card
- Opening Shopee app → Paying with credit card directly

**✅ DO earn 10x (in-person tap):**
- Tapping phone at physical store terminal (if MCC qualifies)
- Using Apple Pay/Google Pay at physical checkout

### How to Handle in Your App:

When entering transactions, mark in-app mobile wallet payments as **NOT online** to ensure they don't earn the online bonus:

1. Go to "Add Expense"
2. Enter transaction details
3. **Uncheck "Online Transaction"** if it was an in-app mobile wallet payment
4. The transaction will earn 1x (base rate) instead of 10x

## Setup Instructions

### Step 1: Apply Database Migration

First, fix the `card_type_id` column type issue (if not already done):

```sql
-- Run this in Supabase SQL Editor
ALTER TABLE reward_rules 
ALTER COLUMN card_type_id TYPE text USING card_type_id::text;
```

See `QUICK_FIX_SUMMARY.md` for complete migration SQL.

### Step 2: Create Payment Method

In the app:
1. Go to "Payment Methods"
2. Click "Add Method"
3. Enter:
   - **Name:** `Rewards Visa Signature`
   - **Issuer:** `Citibank`
   - **Type:** Credit Card
   - **Currency:** SGD
   - **Last 4 Digits:** [your card's last 4 digits]

### Step 3: Run Setup Script

Open browser console (F12) and run:

```javascript
const module = await import('/src/scripts/setupCitibankRewardsCard.ts');
```

This will:
1. Delete any existing rules for this card
2. Create the 3 new rules with correct priorities
3. Configure all MCCs and conditions

### Step 4: Verify Setup

1. Go to "Payment Methods"
2. Select "Citibank Rewards Visa Signature"
3. Click "Manage Reward Rules"
4. You should see 3 rules:
   - ✅ 10x Points on Fashion & Department Stores (Priority 20)
   - ✅ 10x Points on Online Transactions (Priority 10)
   - ✅ 1x Points on All Other Purchases (Priority 1)

## Testing

### Test Case 1: Online Fashion Purchase
```
Amount: $100
Merchant: Zara
MCC: 5621 (Women's Clothing)
Online: Yes

Expected: 1,000 points (10x from Rule 1)
```

### Test Case 2: Online Non-Fashion Purchase
```
Amount: $100
Merchant: Lazada
MCC: 5999 (Misc Retail)
Online: Yes

Expected: 1,000 points (10x from Rule 2)
```

### Test Case 3: Offline Restaurant
```
Amount: $100
Merchant: Restaurant
MCC: 5812 (Restaurants)
Online: No

Expected: 100 points (1x from Rule 3)
```

### Test Case 4: Online Flight Booking
```
Amount: $500
Merchant: Singapore Airlines
MCC: 3000 (Airlines)
Online: Yes

Expected: 500 points (1x from Rule 3, travel excluded)
```

### Test Case 5: In-App Mobile Wallet
```
Amount: $50
Merchant: Deliveroo
MCC: 5812 (Restaurants)
Online: No (marked as not online due to in-app wallet)

Expected: 50 points (1x from Rule 3)
```

## Troubleshooting

### Issue: Fashion purchases earning 1x instead of 10x

**Cause:** MCC not in the fashion list

**Solution:** Check the MCC code and add it to Rule 1 if it should be included

### Issue: Online purchases earning 1x instead of 10x

**Possible causes:**
1. Transaction not marked as "Online"
2. MCC is in the travel blacklist
3. In-app mobile wallet payment

**Solution:** 
- Verify the transaction is marked as online
- Check if MCC is in travel blacklist (3000-3999, 4111, 4112, 4411, 4511, 4722, 4723, 4789, 5962, 7011, 7012, 7512)
- If in-app mobile wallet, it should earn 1x (correct behavior)

### Issue: Wrong rule being applied

**Cause:** Priority order incorrect

**Solution:** 
- Fashion rule should be Priority 20 (highest)
- Online rule should be Priority 10 (middle)
- Base rule should be Priority 1 (lowest)

## Additional Notes

### Converting Points to Miles

Citi ThankYou Points can be converted to various airline miles:
- 1 point = 1 KrisFlyer mile (Singapore Airlines)
- 1 point = 1 Asia Mile (Cathay Pacific)
- And other airline partners

So "4 mpd" (miles per dollar) = 10x points = 10 ThankYou Points per dollar spent.

### Monthly Caps

The Citibank Rewards Visa Signature card has a **9,000 bonus points cap per statement month** that is **shared across both bonus categories** (fashion and online).

**What this means:**
- You can earn up to 9,000 bonus points per month from 10x categories
- This equals approximately SGD 1,000 in qualifying spend (9,000 ÷ 9 bonus multiplier)
- After hitting the cap, you still earn 1x base points on all purchases
- The cap resets at the start of each statement month
- Both fashion and online purchases count toward the same 9,000 point cap

**Example:**
- Spend SGD 500 on fashion → Earn 4,500 bonus points (500 × 9)
- Spend SGD 500 online → Earn 4,500 bonus points (500 × 9)
- **Total: 9,000 bonus points (cap reached)**
- Further 10x purchases that month earn only 1x base points

### Foreign Currency Transactions

Both SGD and foreign currency (FCY) transactions earn the same rates, as long as they meet the category requirements.

## Support

If you encounter issues:
1. Check browser console for errors
2. Verify card name and issuer match exactly: "Citibank" / "Rewards Visa Signature"
3. Run diagnostic: `import('/src/scripts/diagnoseRewardRules.ts')`
4. Check rule priorities in "Manage Reward Rules"
5. Refer to `REWARD_RULES_TROUBLESHOOTING.md` for detailed debugging
