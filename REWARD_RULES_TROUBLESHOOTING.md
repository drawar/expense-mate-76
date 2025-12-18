# Reward Rules Troubleshooting Guide

## Problem: "No reward rules found for this payment method"

If you're seeing this message when adding an expense, it means the reward calculation system can't find matching reward rules for your selected payment method.

## How the System Works

The reward system matches payment methods to reward rules using a **Card Type ID**:

1. **Card Type ID Generation**: 
   - Format: `{issuer}-{name}` (lowercase, spaces in name replaced with hyphens)
   - Example: Issuer "American Express" + Name "Cobalt" → `"american express-cobalt"`

2. **Matching Process**:
   - When you select a payment method, the system generates its Card Type ID
   - It searches for reward rules with the same `card_type_id` in the database
   - If no match is found, you see the "No reward rules found" message

## Diagnostic Steps

### Step 1: Run the Diagnostic Tool

Navigate to the diagnostic page in your browser:

```
http://localhost:5173/diagnose-rewards
```

(Or use the production URL if deployed)

This tool will show you:
- All your payment methods and their generated Card Type IDs
- All reward rules and their Card Type IDs
- Which payment methods have matching rules
- Which payment methods are missing rules

### Step 2: Identify the Mismatch

The diagnostic output will show something like:

```
❌ American Express Cobalt Card
   Card Type ID: "american express-cobalt card"
   NO MATCHING RULES FOUND
```

vs.

```
Card Type ID: "american express-cobalt"
  4 rule(s):
    1. 5x Points on Food & Groceries
    2. 3x Points on Streaming
    ...
```

In this example, the payment method has name "Cobalt Card" but the rules were created for name "Cobalt".

## Common Causes

### 1. Payment Method Name Mismatch

**Problem**: Your payment method name doesn't match what the setup script expects.

**Example**:
- Payment method: `issuer="American Express"`, `name="Cobalt Card"`
- Generated Card Type ID: `"american express-cobalt-card"`
- Setup script created rules for: `"american express-cobalt"`
- **Result**: No match ❌

**Solution**: Update your payment method name to match exactly:
1. Go to Payment Methods page
2. Edit the card
3. Change name from "Cobalt Card" to "Cobalt"
4. Save

### 2. Issuer Name Mismatch

**Problem**: Your payment method issuer doesn't match what the setup script expects.

**Example**:
- Payment method: `issuer="Amex"`, `name="Cobalt"`
- Generated Card Type ID: `"amex-cobalt"`
- Setup script created rules for: `"american express-cobalt"`
- **Result**: No match ❌

**Solution**: Update your payment method issuer:
1. Go to Payment Methods page
2. Edit the card
3. Change issuer from "Amex" to "American Express"
4. Save

### 3. Rules Not Created Yet

**Problem**: You haven't run the setup script to create the reward rules.

**Solution**: Run the appropriate setup script:

```bash
# For American Express Cobalt
npx tsx src/scripts/setupAmexCobaltCard.ts

# For Citibank Rewards+
npx tsx src/scripts/setupCitibankRewardsCard.ts

# For multiple cards
npx tsx src/scripts/setupCreditCards.ts
```

### 4. Extra Spaces or Special Characters

**Problem**: Hidden spaces or special characters in the payment method name.

**Example**:
- Payment method: `name="Cobalt "` (trailing space)
- Generated Card Type ID: `"american express-cobalt-"`
- **Result**: No match ❌

**Solution**: Edit the payment method and remove any extra spaces.

## Quick Fix Checklist

- [ ] Run `npm run diagnose:rewards` to identify the issue
- [ ] Check payment method issuer and name match the setup script exactly
- [ ] Remove any extra spaces or special characters
- [ ] Ensure reward rules exist (run setup script if needed)
- [ ] Refresh the page after making changes
- [ ] Try adding an expense again

## Expected Card Type IDs

Here are the expected Card Type IDs for common cards:

| Card | Issuer | Name | Card Type ID |
|------|--------|------|--------------|
| American Express Cobalt | `American Express` | `Cobalt` | `american express-cobalt` |
| Citibank Rewards+ | `Citibank` | `Rewards+` | `citibank-rewards+` |

## Still Having Issues?

If you've followed all the steps and still see the error:

1. Check the browser console for error messages
2. Verify you're logged in (reward rules require authentication)
3. Check that the RuleRepository initialized successfully (look for console logs on page load)
4. Try opening the diagnostic tool again to see if changes took effect

## Technical Details

For developers debugging this issue:

- **Card Type ID Service**: `src/core/rewards/CardTypeIdService.ts`
- **Reward Service**: `src/core/rewards/RewardService.ts`
- **Rule Repository**: `src/core/rewards/RuleRepository.ts`
- **Points Display Component**: `src/components/expense/form/elements/PointsDisplay.tsx`

The matching happens in `RewardService.calculateRewards()`:
1. Generates Card Type ID from payment method
2. Calls `ruleRepository.getRulesForCardType(cardTypeId)`
3. Filters rules by conditions (MCC, merchant, currency, etc.)
4. Applies the highest priority matching rule
