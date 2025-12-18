# Payment Method Update Fix

## Problem
When editing an existing transaction and changing the payment method, the changes would not persist after clicking "Save Transaction". The payment method would revert to the original value.

## Root Cause
The `updateTransaction` method in `src/core/storage/StorageService.ts` was missing the `payment_method_id` field in the Supabase update query.

While the method correctly handled other fields like `amount`, `currency`, `merchant_id`, etc., it was not updating the `payment_method_id` column in the database.

## Solution
Added `payment_method_id: updates.paymentMethod?.id` to the Supabase update query in the `updateTransaction` method (line 721).

### Code Change
```typescript
const { data, error } = await supabase
  .from("transactions")
  .update({
    date: updates.date,
    merchant_id: (updates.merchant?.id && updates.merchant.id.trim() !== "") ? updates.merchant.id : null,
    amount: updates.amount,
    currency: updates.currency,
    payment_method_id: updates.paymentMethod?.id,  // ← ADDED THIS LINE
    payment_amount: updates.paymentAmount,
    payment_currency: updates.paymentCurrency,
    total_points: updates.rewardPoints,
    base_points: updates.basePoints ?? 0,
    bonus_points: updates.bonusPoints ?? 0,
    is_contactless: updates.isContactless,
    notes: updates.notes,
    reimbursement_amount: updates.reimbursementAmount,
    category: updates.category,
    updated_at: new Date().toISOString(),
  })
  .eq("id", id)
  .select()
  .single();
```

## Testing
A test script has been created at `src/scripts/testPaymentMethodUpdate.ts` to verify the fix:

```bash
npm run dev
# Then in browser console, run:
# import('/src/scripts/testPaymentMethodUpdate.ts')
```

The script will:
1. Get an existing transaction
2. Update it to a different payment method
3. Refetch the transaction to verify persistence
4. Restore the original payment method

## Verification
To manually verify the fix:
1. Go to the Transactions page
2. Click on any transaction to view details
3. Click "Edit"
4. Change the payment method to a different card
5. Click "Save Transaction"
6. Close and reopen the transaction details
7. Verify the payment method has changed and persisted

The payment method should now correctly persist after editing.
