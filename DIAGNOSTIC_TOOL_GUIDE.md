# Reward Rules Diagnostic Tool

## Overview

The Reward Rules Diagnostic Tool is a browser-based page that helps you identify why reward points aren't showing up for your payment methods.

## How to Access

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Open your browser and navigate to:
   ```
   http://localhost:5173/diagnose-rewards
   ```

3. Log in if prompted (the tool requires authentication)

## What It Shows

The diagnostic tool displays:

### 1. Summary Section
- Total payment methods
- How many have matching reward rules (✅ green)
- How many are missing rules (❌ red)
- Total reward rules in the database
- Orphaned card types (rules without matching payment methods)

### 2. Payment Methods with Matching Rules
Shows all payment methods that are working correctly:
- Payment method name (issuer + name)
- Generated Card Type ID
- Number of matching rules

### 3. Payment Methods WITHOUT Matching Rules ⚠️
**This is the most important section!** Shows payment methods that won't display reward points:
- Payment method name
- Generated Card Type ID
- Why it's not matching
- How to fix it

### 4. Orphaned Reward Rules
Shows reward rules that don't match any payment methods (these won't be used)

## Understanding the Results

### Example: Working Payment Method ✅

```
American Express Cobalt
Card Type ID: american express-cobalt
4 rules
```

This payment method will show reward points correctly.

### Example: Broken Payment Method ❌

```
American Express Cobalt Card
Generated Card Type ID: american express-cobalt-card
❌ No reward rules found with this Card Type ID
```

**Problem**: The payment method name is "Cobalt Card" but the reward rules were created for "Cobalt" (without "Card").

**Solution**: Edit the payment method and change the name from "Cobalt Card" to "Cobalt".

## Common Issues and Fixes

### Issue 1: Extra Words in Name

**Diagnostic shows:**
```
Card Type ID: american express-cobalt-card
❌ No matching rules
```

**Fix:** Remove "Card" from the payment method name.

### Issue 2: Wrong Issuer

**Diagnostic shows:**
```
Card Type ID: amex-cobalt
❌ No matching rules
```

**Fix:** Change issuer from "Amex" to "American Express".

### Issue 3: Extra Spaces

**Diagnostic shows:**
```
Card Type ID: american express-cobalt-
❌ No matching rules
```

**Fix:** Remove trailing spaces from the payment method name.

### Issue 4: No Rules Created

**Diagnostic shows:**
```
0 reward rules in database
```

**Fix:** Run the setup script to create reward rules:
```bash
npx tsx src/scripts/setupAmexCobaltCard.ts
```

## Step-by-Step Fix Process

1. **Open the diagnostic tool** at `/diagnose-rewards`

2. **Look at the "WITHOUT Matching Rules" section**
   - If this section is empty, all your payment methods are working! ✅
   - If you see payment methods here, they need to be fixed

3. **For each broken payment method:**
   - Note the "Generated Card Type ID"
   - Go to the Payment Methods page in your app
   - Edit the payment method
   - Update the issuer and/or name to match what the setup script expects
   - Save

4. **Refresh the diagnostic page**
   - The payment method should now appear in the "With Matching Rules" section
   - If not, double-check the issuer and name

5. **Test it**
   - Go to Add Expense
   - Select the payment method
   - Enter an amount
   - You should see reward points calculated! 🎉

## Expected Card Type IDs

For reference, here are the expected values for common cards:

| Card | Issuer | Name | Card Type ID |
|------|--------|------|--------------|
| Amex Cobalt | `American Express` | `Cobalt` | `american express-cobalt` |
| Citibank Rewards+ | `Citibank` | `Rewards+` | `citibank-rewards+` |

## Troubleshooting the Diagnostic Tool

### "Not authenticated" error
- Make sure you're logged in to the app
- Try logging out and back in

### Page shows loading forever
- Check the browser console for errors
- Make sure the RuleRepository initialized (check console on app load)
- Verify your Supabase connection is working

### Changes not showing up
- Hard refresh the page (Ctrl+Shift+R or Cmd+Shift+R)
- Clear browser cache
- Make sure you saved the payment method changes

## Technical Details

The diagnostic tool:
- Queries the `payment_methods` table
- Queries the `reward_rules` table
- Generates Card Type IDs using `CardTypeIdService`
- Compares them to find matches and mismatches
- Displays results in a user-friendly format

The Card Type ID generation logic:
```typescript
cardTypeId = `${issuer.toLowerCase()}-${name.toLowerCase().replace(/\s+/g, '-')}`
```

Example:
- Issuer: "American Express"
- Name: "Cobalt"
- Result: "american express-cobalt"
