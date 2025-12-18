# Design Document: Transaction Supabase Persistence

## Overview

This design ensures that transaction edits, including reward points and merchant category (MCC), are properly persisted to the Supabase database. The solution addresses several issues:

1. **Missing Edit Interface**: TransactionDialog currently only displays transaction details without providing an edit interface
2. **Incomplete Database Schema**: The Supabase transactions table is missing columns for base_points, bonus_points, reimbursement_amount, and deleted_at
3. **Incorrect MCC Column Type**: The merchants table mcc column is TEXT but needs to be JSONB to properly store MCC objects
4. **Missing Merchant Columns**: The merchants table lacks the is_deleted column

The solution involves:
- Adding an edit mode to TransactionDialog that uses ExpenseForm
- Creating database migrations to add missing columns and alter column types
- Updating StorageService.updateTransaction to persist all transaction fields including points breakdown
- Ensuring proper serialization/deserialization of MCC objects as JSONB

## Architecture

### Component Architecture

```
TransactionDialog (modified)
  ├── Transaction Detail View (existing)
  └── Transaction Edit View (new)
      └── ExpenseForm (existing)
          ├── MerchantDetailsSection
          ├── TransactionDetailsSection
          └── PaymentDetailsSection
```

### Data Flow

1. **Loading Transaction for Edit**
   - User clicks Edit button in TransactionDialog
   - Dialog switches to edit mode
   - ExpenseForm receives transaction as defaultValues
   - Form initializes with all transaction fields including MCC and points

2. **Saving Edited Transaction**
   - User modifies transaction fields in ExpenseForm
   - User clicks Save button
   - ExpenseForm calls onSubmit callback with updated transaction data
   - TransactionDialog calls StorageService.updateTransaction
   - StorageService upserts merchant with JSONB MCC
   - StorageService updates transaction with all fields including base_points, bonus_points, reimbursement_amount
   - On success, dialog closes and transaction list refreshes
   - On failure, error toast displays and falls back to localStorage

3. **Database Persistence**
   - Merchant data with MCC is upserted to merchants table
   - MCC is stored as JSONB with {code, description} structure
   - Transaction data is updated in transactions table
   - All point fields (total_points, base_points, bonus_points) are persisted
   - updated_at timestamp is set to current time

## Components and Interfaces

### Modified TransactionDialog Component

```typescript
interface TransactionDialogProps {
  transaction: Transaction | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (transaction: Transaction) => void;
  onDelete?: (transaction: Transaction) => void;
  paymentMethods: PaymentMethod[];
}

// Internal state
interface TransactionDialogState {
  isEditMode: boolean;
  isSaving: boolean;
}
```

### StorageService Updates

The existing `updateTransaction` method needs to be enhanced:

```typescript
async updateTransaction(
  id: string,
  updates: Partial<Transaction>
): Promise<Transaction | null> {
  // Upsert merchant with JSONB MCC
  if (updates.merchant) {
    await supabase.from('merchants').upsert({
      id: updates.merchant.id,
      name: updates.merchant.name,
      address: updates.merchant.address,
      mcc: updates.merchant.mcc, // Will be JSONB
      is_online: updates.merchant.isOnline,
      coordinates: updates.merchant.coordinates,
      is_deleted: false
    });
  }
  
  // Update transaction with all fields
  await supabase.from('transactions').update({
    date: updates.date,
    merchant_id: updates.merchant?.id,
    amount: updates.amount,
    currency: updates.currency,
    payment_method_id: updates.paymentMethod?.id,
    payment_amount: updates.paymentAmount,
    payment_currency: updates.paymentCurrency,
    total_points: updates.rewardPoints,
    base_points: updates.basePoints,  // NEW
    bonus_points: updates.bonusPoints,  // NEW
    is_contactless: updates.isContactless,
    notes: updates.notes,
    reimbursement_amount: updates.reimbursementAmount,  // NEW
    category: updates.category,
    updated_at: new Date().toISOString()
  }).eq('id', id);
}
```

## Data Models

### Database Schema Changes

**Migration 1: Add missing columns to transactions table**
```sql
ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS base_points NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS bonus_points NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS reimbursement_amount NUMERIC,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
```

**Migration 2: Convert merchants.mcc from TEXT to JSONB**
```sql
-- Add new JSONB column
ALTER TABLE public.merchants
ADD COLUMN IF NOT EXISTS mcc_jsonb JSONB;

-- Migrate existing TEXT data to JSONB (if valid JSON)
UPDATE public.merchants
SET mcc_jsonb = mcc::jsonb
WHERE mcc IS NOT NULL AND mcc != '';

-- Drop old TEXT column
ALTER TABLE public.merchants
DROP COLUMN IF EXISTS mcc;

-- Rename new column to mcc
ALTER TABLE public.merchants
RENAME COLUMN mcc_jsonb TO mcc;
```

**Migration 3: Add is_deleted to merchants table**
```sql
ALTER TABLE public.merchants
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;
```

### MCC Serialization Format

MCC objects are stored as JSONB in the following format:
```json
{
  "code": "5411",
  "description": "Grocery Stores, Supermarkets"
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Edit form initialization
*For any* transaction, opening the edit form should display all transaction fields including reward points and merchant category in the form inputs.
**Validates: Requirements 1.1**

### Property 2: Form validation consistency
*For any* input to the edit form, the validation rules should accept valid inputs and reject invalid inputs consistently.
**Validates: Requirements 1.2**

### Property 3: Update method invocation
*For any* transaction edit, saving the form should call StorageService.updateTransaction with the modified values.
**Validates: Requirements 1.3**

### Property 4: Cancel preserves original state
*For any* transaction, editing and then canceling should not persist any changes to the database or localStorage.
**Validates: Requirements 1.4**

### Property 5: NULL value handling
*For any* transaction with NULL values in base_points, bonus_points, or reimbursement_amount columns, retrieving the transaction should default these fields to 0.
**Validates: Requirements 2.5**

### Property 6: MCC serialization round-trip
*For any* merchant with an MCC object, saving to Supabase and then retrieving should return an equivalent MCC object with the same code and description.
**Validates: Requirements 3.2, 3.3, 5.1, 5.2, 5.3**

### Property 7: Reward points persistence round-trip
*For any* transaction with edited reward points (total, base, and bonus), saving to Supabase and then retrieving should return the same point values.
**Validates: Requirements 4.1, 4.2, 4.3, 4.4**

### Property 8: Merchant upsert behavior
*For any* merchant, calling upsert should insert the merchant if it doesn't exist, or update it if it does exist, with the same final result.
**Validates: Requirements 5.5**

### Property 9: Transaction field persistence
*For any* transaction field (amount, date, notes, reimbursement_amount, etc.), editing and saving should persist the change to the corresponding Supabase column.
**Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5**

### Property 10: Updated timestamp
*For any* transaction update, the updated_at timestamp should be set to a value greater than or equal to the time the update was initiated.
**Validates: Requirements 7.5**

### Property 11: Error fallback to localStorage
*For any* transaction update that fails due to Supabase errors, the system should fall back to updating localStorage and the transaction should be retrievable from localStorage.
**Validates: Requirements 8.2**

### Property 12: Error logging
*For any* error during transaction update, the error details should be logged to the console.
**Validates: Requirements 8.4**

## Error Handling

### Supabase Connection Errors

1. **Network Failures**
   - Detect network errors during update operations
   - Display toast: "Network error. Changes saved locally only."
   - Fall back to localStorage update
   - Log error details to console

2. **Authentication Errors**
   - Detect when user session expires
   - Display toast: "Session expired. Please log in again."
   - Fall back to localStorage update
   - Redirect to login if necessary

3. **Permission Errors**
   - Detect RLS policy violations
   - Display toast: "Permission denied. Changes saved locally only."
   - Fall back to localStorage update
   - Log error details to console

### Data Validation Errors

1. **Invalid MCC Format**
   - Validate MCC has code and description before saving
   - Display toast: "Invalid merchant category format"
   - Prevent save operation
   - Keep form open for correction

2. **Missing Required Fields**
   - Validate all required fields before calling updateTransaction
   - Display field-specific error messages
   - Prevent save operation
   - Keep form open for correction

### Migration Errors

1. **Column Already Exists**
   - Use IF NOT EXISTS in ALTER TABLE statements
   - Log warning if column already exists
   - Continue with migration

2. **Data Type Conversion Failures**
   - Handle TEXT to JSONB conversion errors gracefully
   - Set mcc to NULL for invalid JSON strings
   - Log conversion errors
   - Continue with migration

## Testing Strategy

### Unit Testing Approach

Unit tests will verify specific examples and edge cases:

1. **Component Tests**
   - TransactionDialog renders in view mode by default
   - Clicking Edit button switches to edit mode
   - Clicking Cancel returns to view mode without saving
   - Clicking Save calls updateTransaction with correct data
   - Error toast displays when save fails

2. **StorageService Tests**
   - updateTransaction persists all transaction fields to Supabase
   - updateTransaction upserts merchant with JSONB MCC
   - updateTransaction sets updated_at timestamp
   - updateTransaction falls back to localStorage on Supabase errors
   - NULL values in database default to 0 when retrieved

3. **Migration Tests**
   - Migration adds base_points column successfully
   - Migration adds bonus_points column successfully
   - Migration adds reimbursement_amount column successfully
   - Migration adds deleted_at column successfully
   - Migration converts mcc from TEXT to JSONB successfully
   - Migration adds is_deleted column to merchants successfully

### Property-Based Testing Approach

Property-based tests will verify universal properties across all inputs using **fast-check** library for TypeScript. Each test will run a minimum of 100 iterations.

1. **Form Initialization Properties**
   - Property 1: Edit form initialization (Requirements 1.1)
   - Property 2: Form validation consistency (Requirements 1.2)

2. **Persistence Properties**
   - Property 6: MCC serialization round-trip (Requirements 3.2, 3.3, 5.1, 5.2, 5.3)
   - Property 7: Reward points persistence round-trip (Requirements 4.1, 4.2, 4.3, 4.4)
   - Property 9: Transaction field persistence (Requirements 6.1, 6.2, 6.3, 6.4, 6.5)

3. **Update Behavior Properties**
   - Property 3: Update method invocation (Requirements 1.3)
   - Property 4: Cancel preserves original state (Requirements 1.4)
   - Property 8: Merchant upsert behavior (Requirements 5.5)
   - Property 10: Updated timestamp (Requirements 7.5)

4. **Error Handling Properties**
   - Property 5: NULL value handling (Requirements 2.5)
   - Property 11: Error fallback to localStorage (Requirements 8.2)
   - Property 12: Error logging (Requirements 8.4)

### Test Data Generators

Property-based tests will use generators for:
- Random transactions with all fields populated
- Random MCC objects with valid codes and descriptions
- Random point values (0 to 100,000 with up to 2 decimals)
- Random transaction field updates
- Random Supabase error conditions
- Random NULL values in database columns

### Testing Tools

- **Unit Testing**: Jest with React Testing Library
- **Property-Based Testing**: fast-check
- **Database Testing**: Supabase local development with test database
- **Integration Testing**: Jest with mocked Supabase client

## Implementation Notes

### Database Migration Strategy

1. **Run migrations in order**
   - First add new columns to transactions table
   - Then convert mcc column type in merchants table
   - Finally add is_deleted column to merchants table

2. **Handle existing data**
   - New columns default to NULL or 0 as appropriate
   - Existing mcc TEXT values are converted to JSONB
   - Invalid JSON strings in mcc are set to NULL

3. **Test migrations locally**
   - Use Supabase local development environment
   - Test with sample data before deploying to production
   - Verify data integrity after migration

### Backward Compatibility

1. **Existing Transactions**
   - Transactions without base_points/bonus_points will default to 0
   - Transactions without reimbursement_amount will default to NULL
   - All existing transactions remain queryable

2. **Existing Merchants**
   - Merchants with TEXT mcc values are converted to JSONB
   - Merchants without mcc remain NULL
   - All existing merchants remain queryable

3. **API Compatibility**
   - StorageService methods maintain same signatures
   - Additional fields are optional in update operations
   - Existing code continues to work without changes

### Performance Considerations

1. **Upsert Operations**
   - Use Supabase upsert with onConflict to minimize round trips
   - Batch merchant and transaction updates in single transaction
   - Index merchant_id and payment_method_id for faster joins

2. **JSONB Queries**
   - JSONB mcc column supports efficient querying by code or description
   - Consider adding GIN index on mcc column for faster searches
   - Use JSONB operators for filtering by MCC properties

3. **Timestamp Updates**
   - updated_at is set automatically on every update
   - Use database triggers if automatic timestamp updates are needed
   - Index updated_at for efficient sorting by modification time

## Dependencies

### External Libraries
- fast-check: ^3.15.0 (for property-based testing)
- @supabase/supabase-js: (existing)
- react-hook-form: (existing)

### Internal Dependencies
- StorageService: Core service for data persistence
- ExpenseForm: Form component for transaction editing
- TransactionDialog: Dialog component for transaction details and editing
- Supabase Client: Database connection and operations

### Database Dependencies
- PostgreSQL 14+ (for JSONB support)
- Supabase RLS policies (for row-level security)
- Supabase migrations (for schema changes)

## Future Enhancements

1. **Optimistic Updates**
   - Update UI immediately before Supabase confirmation
   - Revert changes if Supabase update fails
   - Show loading indicator during save

2. **Conflict Resolution**
   - Detect when transaction was modified by another user
   - Display conflict resolution UI
   - Allow user to choose which version to keep

3. **Audit Trail**
   - Track all transaction edits in separate audit table
   - Store previous values before updates
   - Display edit history in transaction details

4. **Batch Editing**
   - Allow editing multiple transactions at once
   - Batch update operations for better performance
   - Show progress indicator for batch operations

5. **Offline Support**
   - Queue updates when offline
   - Sync to Supabase when connection restored
   - Handle conflicts from offline edits
