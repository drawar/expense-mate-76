# Debugging with Console Logs

When troubleshooting the "No reward rules found" issue, the browser console provides valuable debugging information.

## How to Open the Console

- **Chrome/Edge**: Press `F12` or `Ctrl+Shift+J` (Windows) / `Cmd+Option+J` (Mac)
- **Firefox**: Press `F12` or `Ctrl+Shift+K` (Windows) / `Cmd+Option+K` (Mac)
- **Safari**: Enable Developer menu first, then press `Cmd+Option+C`

## What to Look For

### 1. RuleRepository Initialization

When the app loads, you should see:

```
Initializing RuleRepository...
RuleRepository initialized successfully
```

If you see an error here, the reward system won't work at all.

### 2. Points Calculation Logs

When you select a payment method and enter an amount, look for:

```
PointsDisplay calculating for: {
  amount: 100,
  currency: "CAD",
  paymentMethodId: "some-uuid",
  mcc: "5812",
  merchantName: "Restaurant",
  isOnline: false,
  isContactless: true
}
```

This shows what data is being sent to the reward calculation.

### 3. Card Type ID Generation

Look for logs from the RewardService:

```
Generated card type ID: "american express-cobalt"
```

This is the key! This ID must match the `card_type_id` in your reward rules.

### 4. Rules Fetched

You should see:

```
Fetching rules for card type: "american express-cobalt"
Found X rules for card type
```

If it says "Found 0 rules", that's your problem - the Card Type ID doesn't match any rules in the database.

### 5. Calculation Result

Finally, you should see:

```
PointsDisplay calculation result: {
  totalPoints: 500,
  basePoints: 100,
  bonusPoints: 400,
  pointsCurrency: "Membership Rewards",
  messages: []
}
```

If `totalPoints` is 0 and there's a message like "No reward rules found", that confirms the mismatch.

## Common Error Messages

### "RuleRepository has not been initialized"

**Cause**: The RuleRepository wasn't initialized when the app loaded.

**Fix**: 
1. Check if there's an error during app initialization
2. Make sure you're logged in (authentication is required)
3. Refresh the page

### "Failed to fetch rules for card type"

**Cause**: Database query failed.

**Fix**:
1. Check your internet connection
2. Verify you're logged in
3. Check Supabase connection status

### "No reward rules found for this payment method"

**Cause**: Card Type ID mismatch (most common issue).

**Fix**: Open the diagnostic tool to identify the mismatch:
```
http://localhost:5173/diagnose-rewards
```

## Example: Successful Flow

Here's what a successful reward calculation looks like in the console:

```
1. Initializing RuleRepository...
2. RuleRepository initialized successfully
3. PointsDisplay calculating for: {
     amount: 50,
     currency: "CAD",
     paymentMethodId: "abc-123",
     mcc: "5812",
     merchantName: "Tim Hortons"
   }
4. Generated card type ID: "american express-cobalt"
5. Fetching rules for card type: "american express-cobalt"
6. Found 4 rules for card type
7. Evaluating conditions for rule: "5x Points on Food & Groceries"
8. Rule matched! Calculating points...
9. PointsDisplay calculation result: {
     totalPoints: 250,
     basePoints: 50,
     bonusPoints: 200,
     pointsCurrency: "Membership Rewards"
   }
```

## Example: Failed Flow (Mismatch)

Here's what you see when there's a Card Type ID mismatch:

```
1. Initializing RuleRepository...
2. RuleRepository initialized successfully
3. PointsDisplay calculating for: {
     amount: 50,
     currency: "CAD",
     paymentMethodId: "abc-123",
     mcc: "5812"
   }
4. Generated card type ID: "american express-cobalt-card"  ← Note the extra "-card"
5. Fetching rules for card type: "american express-cobalt-card"
6. Found 0 rules for card type  ← This is the problem!
7. PointsDisplay calculation result: {
     totalPoints: 0,
     basePoints: 0,
     bonusPoints: 0,
     pointsCurrency: "points",
     messages: ["No reward rules found for this payment method"]
   }
```

The issue is clear: the generated Card Type ID is `"american express-cobalt-card"` but the rules in the database are for `"american express-cobalt"`.

## Enabling Detailed Logging

The RuleRepository has detailed logging built in. All operations log:
- What they're doing
- What data they're working with
- Success or failure
- Error details

These logs use the format:
```
[operation] message { context }
```

For example:
```
[getRulesForCardType] Fetching rules for card type { cardTypeId: "american express-cobalt" }
[getRulesForCardType] Successfully fetched and mapped rules { cardTypeId: "american express-cobalt", rulesCount: 4 }
```

## Next Steps

If you see errors in the console:
1. Copy the error message
2. Check the troubleshooting guide: [REWARD_RULES_TROUBLESHOOTING.md](./REWARD_RULES_TROUBLESHOOTING.md)
3. Open the diagnostic tool: `http://localhost:5173/diagnose-rewards`
