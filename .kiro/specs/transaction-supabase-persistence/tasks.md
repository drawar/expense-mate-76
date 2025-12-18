# Implementation Plan

- [x] 1. Create database migrations for schema changes
  - [x] 1.1 Create migration to add columns to transactions table
    - Add base_points NUMERIC column with default 0
    - Add bonus_points NUMERIC column with default 0
    - Add reimbursement_amount NUMERIC column
    - Add deleted_at TIMESTAMP WITH TIME ZONE column
    - _Requirements: 2.1, 2.2, 2.3, 2.4_
  
  - [x] 1.2 Create migration to convert merchants.mcc from TEXT to JSONB
    - Add temporary mcc_jsonb JSONB column
    - Migrate existing TEXT data to JSONB format
    - Drop old mcc TEXT column
    - Rename mcc_jsonb to mcc
    - _Requirements: 3.1, 3.4_
  
  - [x] 1.3 Create migration to add is_deleted column to merchants table
    - Add is_deleted BOOLEAN column with default false
    - _Requirements: 3.5_
  
  - [ ]* 1.4 Write unit tests for migration scripts
    - Test that columns are added successfully
    - Test that mcc TEXT to JSONB conversion works
    - Test that existing data is preserved
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 3.1, 3.4, 3.5_

- [x] 2. Update StorageService.updateTransaction method
  - [x] 2.1 Add base_points and bonus_points to update operation
    - Include base_points in Supabase update call
    - Include bonus_points in Supabase update call
    - Handle NULL values by defaulting to 0
    - _Requirements: 4.2, 4.3, 7.1, 7.2_
  
  - [x] 2.2 Add reimbursement_amount to update operation
    - Include reimbursement_amount in Supabase update call
    - Handle NULL values appropriately
    - _Requirements: 6.2, 7.3_
  
  - [x] 2.3 Update merchant upsert to use JSONB for mcc
    - Serialize MCC object to JSONB format
    - Include mcc in merchant upsert operation
    - Include is_deleted field in merchant upsert
    - _Requirements: 3.2, 5.1, 5.2, 7.4_
  
  - [x] 2.4 Add updated_at timestamp to update operation
    - Set updated_at to current timestamp on every update
    - _Requirements: 7.5_
  
  - [x] 2.5 Write property test for reward points persistence
    - **Property 7: Reward points persistence round-trip**
    - **Validates: Requirements 4.1, 4.2, 4.3, 4.4**
  
  - [x] 2.6 Write property test for MCC serialization
    - **Property 6: MCC serialization round-trip**
    - **Validates: Requirements 3.2, 3.3, 5.1, 5.2, 5.3**
  
  - [x] 2.7 Write property test for transaction field persistence
    - **Property 9: Transaction field persistence**
    - **Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5**

- [x] 3. Update StorageService.getTransactions method
  - [x] 3.1 Add parsing for new transaction columns
    - Parse base_points from database, default to 0 if NULL
    - Parse bonus_points from database, default to 0 if NULL
    - Parse reimbursement_amount from database
    - Parse deleted_at from database
    - _Requirements: 2.5, 4.4, 4.5_
  
  - [x] 3.2 Update MCC parsing to handle JSONB
    - Parse JSONB mcc column into MerchantCategoryCode object
    - Handle NULL mcc values
    - _Requirements: 3.3, 5.3, 5.4_
  
  - [x] 3.3 Write property test for NULL value handling
    - **Property 5: NULL value handling**
    - **Validates: Requirements 2.5**

- [ ] 4. Add edit mode to TransactionDialog component
  - [ ] 4.1 Add isEditMode state to TransactionDialog
    - Initialize isEditMode to false
    - Add setIsEditMode state setter
    - Toggle between view and edit modes
    - _Requirements: 1.1_
  
  - [ ] 4.2 Render ExpenseForm in edit mode
    - Pass transaction as defaultValues to ExpenseForm
    - Pass paymentMethods to ExpenseForm
    - Set isEditMode prop to true
    - _Requirements: 1.1_
  
  - [ ] 4.3 Implement handleSave callback
    - Call StorageService.updateTransaction with transaction id and updates
    - Handle success: close dialog and refresh transaction list
    - Handle errors: display error toast and fall back to localStorage
    - _Requirements: 1.3, 1.5, 8.1, 8.2_
  
  - [ ] 4.4 Implement handleCancel callback
    - Reset form to original values
    - Switch back to view mode
    - Do not persist any changes
    - _Requirements: 1.4_
  
  - [ ] 4.5 Write property test for edit form initialization
    - **Property 1: Edit form initialization**
    - **Validates: Requirements 1.1**
  
  - [ ] 4.6 Write property test for update method invocation
    - **Property 3: Update method invocation**
    - **Validates: Requirements 1.3**
  
  - [ ] 4.7 Write property test for cancel behavior
    - **Property 4: Cancel preserves original state**
    - **Validates: Requirements 1.4**

- [ ] 5. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 6. Implement error handling and fallback logic
  - [ ] 6.1 Add error handling to updateTransaction
    - Catch Supabase errors and log to console
    - Display error toast with appropriate message
    - Fall back to localStorage update on Supabase errors
    - _Requirements: 8.1, 8.2, 8.4_
  
  - [ ] 6.2 Add network error detection
    - Detect network errors specifically
    - Display "Network error. Changes saved locally only." toast
    - _Requirements: 8.3_
  
  - [ ] 6.3 Add localStorage fallback notification
    - Display "Changes saved locally only" when falling back
    - _Requirements: 8.5_
  
  - [ ] 6.4 Write property test for error fallback
    - **Property 11: Error fallback to localStorage**
    - **Validates: Requirements 8.2**
  
  - [ ] 6.5 Write property test for error logging
    - **Property 12: Error logging**
    - **Validates: Requirements 8.4**

- [ ] 7. Integration testing and validation
  - [ ]* 7.1 Write integration test for full edit flow
    - Test loading transaction with all fields from Supabase
    - Test editing transaction fields in ExpenseForm
    - Test saving edited transaction to Supabase
    - Test that all fields persist correctly
    - Test error handling when Supabase fails
    - _Requirements: 1.1, 1.3, 1.5, 4.1, 4.2, 4.3, 5.1, 6.1, 6.2, 6.3, 8.1, 8.2_
  
  - [ ]* 7.2 Write property test for form validation
    - **Property 2: Form validation consistency**
    - **Validates: Requirements 1.2**
  
  - [ ]* 7.3 Write property test for merchant upsert
    - **Property 8: Merchant upsert behavior**
    - **Validates: Requirements 5.5**
  
  - [ ]* 7.4 Write property test for updated timestamp
    - **Property 10: Updated timestamp**
    - **Validates: Requirements 7.5**

- [ ] 8. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
