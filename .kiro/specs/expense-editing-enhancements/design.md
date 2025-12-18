# Design Document: Expense Editing Enhancements

## Overview

This design enhances the expense editing functionality to ensure all transaction fields can be properly edited and persisted. The solution addresses two main issues:

1. **Merchant Category Persistence**: The MCC field does not properly initialize when editing, appearing empty even when the transaction has a category
2. **Editable Reward Points**: Users cannot edit reward points, which is needed when automatic calculation is incorrect or for promotional bonuses

The solution modifies the ExpenseForm component to:
- Properly initialize with transaction data including MCC
- Add reward points as an editable field with validation
- Display automatically calculated points as a reference for comparison

The design keeps the implementation simple - reward points become a regular editable field like amount or merchant name, with automatic calculation providing a helpful reference value.

## Architecture

### Component Architecture

```
TransactionDialog (existing)
  └── TransactionEditForm (existing)
      └── ExpenseForm (modified)
          ├── MerchantDetailsSection (modified)
          │   └── MerchantCategorySelect (modified)
          ├── TransactionDetailsSection (existing)
          └── PaymentDetailsSection (modified)
              └── PointsDisplay (modified)
                  └── ManualPointsEditor (new)
```

### Data Flow

1. **Loading Transaction for Edit**
   - TransactionDialog receives transaction from Supabase Database with all fields
   - TransactionEditForm passes transaction data to ExpenseForm as defaultValues
   - ExpenseForm initializes form state with merchant category and points values
   - EditablePointsField displays current reward points value

2. **Manual Points Override**
   - User edits reward points in EditablePointsField
   - User enters custom point value
   - Form state updates with manual value
   - Automatic calculation continues in background for reference display

3. **Saving Transaction**
   - Form submission includes edited reward points value and merchant category
   - Storage service persists all changes to Supabase Database
   - On successful save, transaction is updated in database
   - On failure, error message displays and form data is retained for retry
   - Base and bonus point breakdown preserved for reference

## Components and Interfaces

### Transaction Type (No Changes Needed)

The existing Transaction type already has all necessary fields:
```typescript
export type Transaction = {
  id: string;
  date: string;
  merchant: Merchant;
  amount: number;
  currency: Currency;
  paymentMethod: PaymentMethod;
  paymentAmount: number;
  paymentCurrency: Currency;
  rewardPoints: number;  // This becomes editable
  basePoints: number;
  bonusPoints: number;
  isContactless: boolean;
  notes?: string;
  reimbursementAmount?: number;
  category?: string;
  is_deleted?: boolean;
};
```

### Modified PointsDisplay Component

```typescript
interface PointsDisplayProps {
  amount: number;
  currency: string;
  paymentMethod: PaymentMethod | null;
  mcc?: string;
  merchantName?: string;
  isOnline?: boolean;
  isContactless?: boolean;
  // New props for edit mode
  isEditMode?: boolean;
  editablePoints?: number;  // Current value in the editable field
  onPointsChange?: (points: number) => void;  // Callback when user edits
}
```

### New Component: EditablePointsField

A simple input field component for editing reward points:
```typescript
interface EditablePointsFieldProps {
  value: number;
  calculatedValue: number;  // For reference display
  pointsCurrency: string;
  onChange: (value: number) => void;
  onBlur?: () => void;
}
```

## Data Models

### Form Values Extension

```typescript
interface FormValues {
  merchantName: string;
  merchantAddress?: string;
  isOnline: boolean;
  isContactless: boolean;
  amount: string;
  currency: string;
  paymentMethodId: string;
  paymentAmount?: string;
  date: Date;
  notes?: string;
  mcc: MerchantCategoryCode | null; // Ensure this is properly typed
  // New field
  rewardPoints: string;  // Editable reward points field
}
```

### Storage Layer

The existing storage service already handles rewardPoints and merchant category persistence to Supabase Database. No schema changes are required since we're just making existing fields editable.

**Supabase Persistence:**
- All transaction edits are saved to the Supabase Database
- The storage service handles both Supabase and local storage fallback
- Merchant category (MCC) is persisted as part of the merchant object
- Reward points are persisted as part of the transaction record

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property 1: Reward points persistence round-trip
*For any* transaction with edited reward points, saving and then loading the transaction should return the user-entered value.
**Validates: Requirements 1.3, 5.1**

### Property 2: Merchant category persistence round-trip
*For any* transaction with a merchant category, saving without changing the category should preserve the original category value.
**Validates: Requirements 2.2**

### Property 3: Merchant category change persistence
*For any* transaction and any new merchant category, saving with the new category should result in the new category being stored and retrieved.
**Validates: Requirements 2.3**

### Property 4: Numeric input validation
*For any* non-negative numeric input with up to 2 decimal places, the reward points field should accept the value; for any invalid input (negative, more than 2 decimals, non-numeric), the field should reject the value and display an error.
**Validates: Requirements 1.2, 1.4**

### Property 5: Form initialization with reward points
*For any* transaction with reward points, opening the edit form should display those points in the editable field.
**Validates: Requirements 1.1, 5.2**

### Property 6: Form initialization with merchant category
*For any* transaction with a merchant category, opening the edit form should display that category in the selector.
**Validates: Requirements 2.1**

### Property 7: Base and bonus breakdown preservation
*For any* transaction where total points are edited, the base and bonus point breakdown values should remain unchanged.
**Validates: Requirements 3.2**

### Property 8: Calculated reference display
*For any* transaction in edit mode, the automatically calculated points should be displayed as a reference value.
**Validates: Requirements 4.1**

### Property 9: Calculated reference updates
*For any* transaction in edit mode, changing transaction details that affect point calculation should update the calculated reference value.
**Validates: Requirements 4.2**

### Property 10: Default points for new transactions
*For any* new transaction being created, the reward points field should default to the automatically calculated value.
**Validates: Requirements 5.3**

### Property 11: Supabase persistence for edited transactions
*For any* transaction with edited fields, saving should persist all changes to the Supabase Database and subsequent retrieval should return the edited values.
**Validates: Requirements 6.1, 6.2, 6.3**

### Property 12: Database error handling
*For any* save operation that fails due to database connection issues, the system should display an error message and retain form data.
**Validates: Requirements 6.4**

## Error Handling

### Input Validation Errors

1. **Invalid Point Values**
   - Non-numeric input in reward points field
   - Negative point values
   - More than 2 decimal places
   - Point values exceeding reasonable limits (e.g., > 1,000,000)
   - Error message: "Please enter a valid non-negative number with up to 2 decimal places"

2. **Missing Required Fields**
   - Merchant category cleared when required
   - Error message: "Merchant category is required"

### Data Persistence Errors

1. **Save Failures**
   - Network errors when saving to Supabase
   - Local storage quota exceeded
   - Error message: "Failed to save transaction. Please try again."
   - Fallback: Retain form state for retry

2. **Load Failures**
   - Transaction not found
   - Corrupted transaction data
   - Error message: "Failed to load transaction details"
   - Fallback: Close edit dialog and refresh transaction list

### State Consistency Errors

1. **Calculation Errors**
   - Reward service calculation fails
   - Error message: "Unable to calculate reward points automatically"
   - Fallback: Allow manual point entry, show last calculated value as reference

## Testing Strategy

### Unit Testing Approach

Unit tests will verify specific examples and edge cases:

1. **Component Rendering Tests**
   - EditablePointsField renders correctly with value
   - Calculated reference value displays alongside editable field
   - Empty merchant category displays selector in empty state
   - Validation errors display for invalid inputs

2. **Form Validation Tests**
   - Numeric validation accepts valid inputs (non-negative with up to 2 decimals)
   - Numeric validation rejects invalid inputs (negative, more than 2 decimals, non-numeric)
   - Empty points field defaults to zero

3. **Integration Tests**
   - ExpenseForm correctly initializes with transaction data including merchant category and reward points
   - Form submission includes edited reward points value
   - Storage service correctly saves and retrieves edited reward points from Supabase Database
   - Error handling displays message and retains form data when database connection fails

### Property-Based Testing Approach

Property-based tests will verify universal properties across all inputs using **fast-check** library for TypeScript. Each test will run a minimum of 100 iterations.

1. **Persistence Properties**
   - Property 1: Reward points round-trip (Requirements 1.3, 5.1)
   - Property 2: Merchant category persistence (Requirements 2.2)
   - Property 3: Merchant category change persistence (Requirements 2.3)

2. **Validation Properties**
   - Property 4: Numeric input validation (Requirements 1.2, 1.4)

3. **Initialization Properties**
   - Property 5: Form initialization with reward points (Requirements 1.1, 5.2)
   - Property 6: Form initialization with merchant category (Requirements 2.1)

4. **Invariant Properties**
   - Property 7: Breakdown preservation (Requirements 3.2)

5. **Reference Display Properties**
   - Property 8: Calculated reference display (Requirements 4.1)
   - Property 9: Calculated reference updates (Requirements 4.2)
   - Property 10: Default points for new transactions (Requirements 5.3)

6. **Database Persistence Properties**
   - Property 11: Supabase persistence for edited transactions (Requirements 6.1, 6.2, 6.3)
   - Property 12: Database error handling (Requirements 6.4)

### Test Data Generators

Property-based tests will use generators for:
- Random transactions with varying fields
- Random merchant categories from valid MCC list
- Random point values (0 to 100,000 with up to 2 decimals)
- Random transaction detail changes (amount, merchant, payment method)
- Random valid and invalid numeric inputs

### Testing Tools

- **Unit Testing**: Jest with React Testing Library
- **Property-Based Testing**: fast-check
- **Component Testing**: React Testing Library with user event simulation
- **Integration Testing**: Jest with mocked storage service

## Implementation Notes

### Backward Compatibility

Existing transactions already have `rewardPoints` field:
- No schema changes needed
- Existing transactions can be edited immediately
- All existing reward points values remain valid

### Performance Considerations

1. **Automatic Calculation**
   - Continue calculating in background as reference
   - Debounce calculation when transaction details change
   - Cache calculation results to avoid redundant API calls

2. **Form State Management**
   - Use React Hook Form for efficient form state
   - Minimize re-renders when updating calculated reference
   - Preserve form state during editing

### UI/UX Considerations

1. **Editable Points Field**
   - Standard input field for reward points (like amount or merchant name)
   - Validation feedback for invalid inputs
   - Clear label: "Reward Points"

2. **Calculated Reference Display**
   - Show automatically calculated points below or beside the editable field
   - Label: "Calculated: X points" (subtle, secondary text)
   - Updates in real-time as transaction details change
   - Helps user verify if their entered value is reasonable

3. **Merchant Category Persistence**
   - Pre-select category in dropdown when editing
   - Maintain selection even if user navigates to other form fields
   - Clear visual feedback when category is selected

## Migration Strategy

### No Database Migration Needed

The existing schema already supports all required functionality:
- `rewardPoints` field exists and will become editable
- `basePoints` and `bonusPoints` fields exist for breakdown display
- `merchant.mcc` field exists for category persistence

No schema changes or data migration required.

## Dependencies

### External Libraries
- fast-check: ^3.15.0 (for property-based testing)
- react-hook-form: (existing)
- zod: (existing, for form validation)

### Internal Dependencies
- RewardService: For automatic point calculation
- StorageService: For transaction persistence to Supabase Database
- Supabase Client: For database connection and operations
- ExpenseForm: Core form component to be modified
- TransactionEditForm: Wrapper component for edit mode

## Future Enhancements

1. **Audit Trail**
   - Track when points were edited
   - Store original calculated value at time of edit
   - Show history of point changes

2. **Bulk Edit**
   - Edit reward points for multiple transactions at once
   - Batch update merchant categories

3. **Smart Suggestions**
   - Highlight when entered points differ significantly from calculated
   - Suggest review when points are unusually high/low

4. **Quick Fill**
   - Button to quickly copy calculated value to editable field
   - Keyboard shortcut for common editing actions
