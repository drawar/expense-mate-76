# Citibank Rewards Visa Signature - Quick Setup

## What is Priority?

**Priority = Order of evaluation**

- Priority 20 (checked first) → Priority 10 → Priority 1 (checked last)
- First matching rule wins
- Use Priority 1 for catch-all rules (no conditions)

## The 3 Rules

| Priority | Rule | Earn Rate | Monthly Cap | When It Applies |
|----------|------|-----------|-------------|-----------------|
| **20** | Fashion & Dept Stores | **10x** | 9,000 bonus pts | Specific MCCs (Zara, Uniqlo, Nike, etc.) |
| **10** | Online Transactions | **10x** | 9,000 bonus pts (shared) | Online purchases (excluding travel) |
| **1** | Everything Else | **1x** | None | All other transactions |

## Quick Setup (3 Steps)

### 1. Fix Database (if not done)

Supabase Dashboard → SQL Editor → Run:

```sql
ALTER TABLE reward_rules 
ALTER COLUMN card_type_id TYPE text USING card_type_id::text;
```

### 2. Create Payment Method

App → Payment Methods → Add Method:
- Issuer: `Citibank`
- Name: `Rewards Visa Signature`
- Currency: `SGD`

### 3. Run Setup Script

Browser Console (F12):

```javascript
const module = await import('/src/scripts/setupCitibankRewardsCard.ts');
```

## What Earns 10x?

### ✅ Fashion & Department Stores (Priority 20)
- Zara, H&M, Uniqlo, ASOS
- Nike, Adidas, Lululemon
- Charles & Keith, Skechers
- Takashimaya, TANGS, Isetan
- Louis Vuitton, Coach

### ✅ Online Purchases (Priority 10)
- Lazada, Shopee, Amazon
- Food delivery (Deliveroo, GrabFood) - direct credit card
- Netflix, Spotify subscriptions
- FairPrice Online, RedMart

### ❌ What DOESN'T Earn 10x?
- Travel bookings (flights, hotels, car rental)
- In-app mobile wallet payments (Apple Pay/Google Pay in apps)
- Offline non-fashion purchases (restaurants, groceries, petrol)

## In-App Mobile Wallet

**Don't earn 10x:**
- Deliveroo app → Pay with Google Pay ❌
- Kris+ app → Pay with Apple Pay ❌

**Do earn 10x:**
- Deliveroo app → Pay with Credit Card ✓
- Physical store → Tap phone to pay ✓

**In your app:** Mark in-app wallet payments as "NOT online" to earn correct 1x rate.

## Monthly Cap: 9,000 Bonus Points

**Shared cap** across fashion and online categories per statement month.

- Cap = 9,000 bonus points/month
- Equals ~SGD 1,000 spend at 10x (9,000 ÷ 9 bonus multiplier)
- After cap: Still earn 1x base points
- Resets each statement month

**Example:**
- SGD 500 fashion + SGD 500 online = 9,000 bonus points (cap reached)
- Further 10x purchases earn only 1x that month

## Example Calculations

All amounts rounded down to nearest dollar:

| Transaction | Priority | Points | Calculation | Notes |
|-------------|----------|--------|-------------|-------|
| $50.75 at Zara (online) | 20 | 500 | $50 × 10 | Counts toward cap |
| $100.50 at Lazada | 10 | 1,000 | $100 × 10 | Counts toward cap |
| $75.25 at restaurant | 1 | 75 | $75 × 1 | No cap |
| $200 flight booking | 1 | 200 | $200 × 1 | No cap |

## Verify It Works

Payment Methods → Select Card → Manage Reward Rules

You should see:
- ✅ 10x Points on Fashion & Department Stores (Priority 20)
- ✅ 10x Points on Online Transactions (Priority 10)
- ✅ 1x Points on All Other Purchases (Priority 1)

## Need More Details?

- Complete guide: `CITIBANK_REWARDS_SETUP.md`
- All MCCs and examples included
- Troubleshooting section
- Test cases
