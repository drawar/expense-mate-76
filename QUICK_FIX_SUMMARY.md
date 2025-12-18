# Quick Fix: "No reward rules found for this payment method"

## The Problem

You're seeing "Reward Points: 0 points - No reward rules found for this payment method" when adding expenses, even though you've set up payment methods and reward rules.

## Root Cause

The reward system matches payment methods to rules using a **Card Type ID** generated from the payment method's issuer and name. If these don't match exactly, the system can't find the rules.

**Example of mismatch:**
- Your payment method: `issuer="American Express"`, `name="Cobalt Card"`
- Generated ID: `"american express-cobalt-card"`
- Your reward rules: `card_type_id="american express-cobalt"`
- **Result**: No match! ❌

## Quick Fix (3 steps)

### 1. Open the diagnostic tool

1. Start your development server: `npm run dev`
2. Open your browser and navigate to: `http://localhost:5173/diagnose-rewards`
3. Log in if prompted
4. The diagnostic page will show you exactly what's mismatched

### 2. Fix the mismatch

**Option A: Update your payment method** (Recommended)
1. Go to Payment Methods page in your app
2. Edit the card that's not working
3. Update the name to match what the setup script expects:
   - For Amex Cobalt: Change name to exactly `Cobalt` (not "Cobalt Card")
   - For Citibank: Change name to exactly `Rewards+`
4. Make sure issuer is also correct:
   - For Amex: Use `American Express` (not "Amex" or "AMEX")
   - For Citibank: Use `Citibank`
5. Save

**Option B: Recreate the reward rules**
If you prefer to keep your payment method name as-is, you can recreate the rules to match:
1. Note the exact issuer and name from the diagnostic output
2. Edit the setup script to use those exact values
3. Run the setup script again

### 3. Test it

1. Refresh your browser
2. Go to Add Expense
3. Select the payment method
4. Enter an amount
5. You should now see reward points calculated! ✅

## Expected Values

For the setup scripts to work correctly, use these exact values:

| Card | Issuer | Name |
|------|--------|------|
| American Express Cobalt | `American Express` | `Cobalt` |
| Citibank Rewards+ | `Citibank` | `Rewards+` |

## Need More Help?

See [REWARD_RULES_TROUBLESHOOTING.md](./REWARD_RULES_TROUBLESHOOTING.md) for detailed troubleshooting steps.
