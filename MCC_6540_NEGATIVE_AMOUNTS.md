# MCC 6540 Negative Amount Support

## Summary
The Transaction Amount field in the expense form now accepts both positive and negative values when MCC 6540 (POI Funding Transactions) is selected.

## What Changed

### 1. Form Schema Validation (`src/hooks/expense/expense-form/formSchema.ts`)
- Added `superRefine` validation to check MCC code before validating amount
- For MCC 6540: Allows both positive and negative values (but not zero)
- For all other MCCs: Requires positive values only (> 0)
- Provides clear error messages based on the selected MCC

### 2. UI Component (`src/components/expense/form/sections/TransactionDetailsSection.tsx`)
- Watches the `mcc` field to determine if negative amounts are allowed
- Dynamically removes the `min="0.01"` attribute when MCC 6540 is selected
- Updates placeholder text to indicate "(+ or -)" when negative values are allowed
- Adds a visual hint "(positive or negative)" next to the label for MCC 6540

### 3. Form State Synchronization
- **`useExpenseForm.ts`**: Added useEffect to sync `selectedMCC` state to form's `mcc` field
- **`MerchantDetailsSection.tsx`**: Updates form's `mcc` field when MCC is selected
- This ensures the validation has access to the current MCC value

### 3. Test Coverage (`tests/ExpenseForm.mcc6540.test.ts`)
New test suite with 6 passing tests:
- ✓ Allows negative amounts for MCC 6540
- ✓ Allows positive amounts for MCC 6540
- ✓ Rejects zero amounts for MCC 6540
- ✓ Rejects negative amounts for non-6540 MCC codes
- ✓ Allows positive amounts for non-6540 MCC codes
- ✓ Rejects negative amounts when no MCC is selected

## MCC 6540 Details
**Code:** 6540  
**Description:** POI (Point of Interaction) Funding Transactions (Excluding MoneySend)

This MCC is used for transactions like:
- Loading prepaid cards
- Money transfers
- Refunds/reversals (negative amounts)

## User Experience
1. User selects MCC 6540 from the merchant category dropdown
2. The Transaction Amount field label updates to show "(positive or negative)"
3. The placeholder changes to "0.00 (+ or -)"
4. User can now enter negative values (e.g., -50.00)
5. Form validation ensures the amount is not zero
6. For any other MCC or no MCC, only positive values are accepted
