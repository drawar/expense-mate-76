# Implementation Plan

- [x] 1. Fix merchant category persistence in edit form
  - [x] 1.1 Update TransactionEditForm to properly pass MCC to ExpenseForm
    - Extract MCC from transaction.merchant.mcc
    - Pass as defaultValues.mcc to ExpenseForm
    - _Requirements: 2.1, 2.4_
  
  - [x] 1.2 Verify useExpenseForm properly initializes selectedMCC state
    - Ensure selectedMCC state initializes from defaultValues.mcc
    - Verify MCC persists in form state during editing
    - _Requirements: 2.1, 2.2_
  
  - [x] 1.3 Write property test for merchant category persistence
    - **Property 2: Merchant category persistence round-trip**
    - **Property 3: Merchant category change persistence**
    - **Validates: Requirements 2.2, 2.3**
  
  - [x] 1.4 Write unit test for MCC form initialization
    - Test that edit form displays existing MCC
    - Test that empty MCC shows empty selector
    - _Requirements: 2.1, 2.4_

- [x] 2. Add reward points as editable field
  - [x] 2.1 Update form schema to include rewardPoints field
    - Add rewardPoints: string field to formSchema
    - Add validation for non-negative numbers with up to 2 decimal places
    - _Requirements: 1.2, 1.4_
  
  - [x] 2.2 Update TransactionEditForm to pass reward points to ExpenseForm
    - Extract rewardPoints from transaction
    - Pass as defaultValues.rewardPoints to ExpenseForm
    - _Requirements: 1.1, 5.2_
  
  - [x] 2.3 Update ExpenseForm to initialize reward points field
    - Add rewardPoints to form default values
    - Ensure field initializes with transaction value when editing
    - Ensure field initializes with calculated value when creating
    - _Requirements: 1.1, 5.2, 5.3_
  
  - [x] 2.4 Write property test for reward points persistence
    - **Property 1: Reward points persistence round-trip**
    - **Validates: Requirements 1.3, 5.1**
  
  - [x] 2.5 Write property test for form initialization
    - **Property 5: Form initialization with reward points**
    - **Validates: Requirements 1.1, 5.2**

- [x] 3. Create editable points field component
  - [x] 3.1 Create EditablePointsField component
    - Input field for editing reward points
    - Display calculated reference value below/beside input
    - Show validation errors for invalid inputs
    - Format: "Calculated: X points" as secondary text
    - _Requirements: 1.1, 1.2, 1.4, 4.1_
  
  - [x] 3.2 Integrate EditablePointsField into PaymentDetailsSection
    - Replace or enhance PointsDisplay with editable field in edit mode
    - Pass current points value and calculated reference
    - Handle onChange to update form state
    - _Requirements: 1.1, 4.1_
  
  - [x] 3.3 Write unit tests for EditablePointsField
    - Test input accepts valid values
    - Test validation rejects invalid values
    - Test calculated reference displays correctly
    - Test error messages display for invalid inputs
    - _Requirements: 1.2, 1.4, 4.1_
  
  - [x] 3.4 Write property test for numeric validation
    - **Property 4: Numeric input validation**
    - **Validates: Requirements 1.2, 1.4**

- [x] 4. Update PointsDisplay for calculated reference
  - [x] 4.1 Modify PointsDisplay to show calculated value as reference
    - Add prop to indicate edit mode
    - Display calculated points alongside editable field
    - Update in real-time as transaction details change
    - _Requirements: 4.1, 4.2_
  
  - [x] 4.2 Update useExpenseForm to track both entered and calculated points
    - Maintain separate state for user-entered points
    - Continue automatic calculation in background
    - Provide both values to components
    - _Requirements: 4.1, 4.2, 4.3_
  
  - [x] 4.3 Write property test for calculated reference updates
    - **Property 9: Calculated reference updates**
    - **Validates: Requirements 4.2**

- [x] 5. Update form submission logic
  - [x] 5.1 Modify ExpenseForm submission to use edited reward points
    - Use value from rewardPoints form field
    - Preserve basePoints and bonusPoints from calculation
    - Handle empty field as zero points
    - _Requirements: 1.3, 1.5, 3.2_
  
  - [x] 5.2 Ensure storage service persists edited points to Supabase Database
    - Verify rewardPoints field saves correctly to Supabase
    - Verify merchant category saves correctly to Supabase
    - Test with both Supabase and local storage fallback
    - _Requirements: 1.3, 5.1, 6.1, 6.2_
  
  - [x] 5.3 Write property test for breakdown preservation
    - **Property 7: Base and bonus breakdown preservation**
    - **Validates: Requirements 3.2**
  
  - [x] 5.4 Write property test for Supabase persistence
    - **Property 11: Supabase persistence for edited transactions**
    - **Validates: Requirements 6.1, 6.2, 6.3**

- [ ] 6. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 7. Add database error handling
  - [ ] 7.1 Implement error handling for Supabase connection failures
    - Display error message when save fails
    - Retain form data for retry
    - _Requirements: 6.4_
  
  - [ ] 7.2 Write property test for database error handling
    - **Property 12: Database error handling**
    - **Validates: Requirements 6.4**

- [ ] 8. Integration testing and validation
  - [ ] 8.1 Write integration test for full edit flow
    - Test loading transaction with MCC and points from Supabase
    - Test editing MCC and saving to Supabase
    - Test editing reward points and saving to Supabase
    - Test calculated reference updates
    - Test error handling when database connection fails
    - _Requirements: 1.3, 2.2, 2.3, 4.2, 6.1, 6.2, 6.3, 6.4_
  
  - [ ] 8.2 Write property test for default points on new transactions
    - **Property 10: Default points for new transactions**
    - **Validates: Requirements 5.3**

- [ ] 9. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
