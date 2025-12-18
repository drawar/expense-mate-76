# Implementation Plan

- [x] 1. Add condition normalization to RewardService
  - Add `normalizeCondition()` private method to handle backward compatibility
  - Convert legacy "online" condition type to "transaction_type"
  - Preserve original condition intent during normalization
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [ ]* 1.1 Write property test for condition normalization
  - **Property 5: Backward compatibility normalization**
  - **Validates: Requirements 3.1, 3.2**

- [x] 2. Enhance transaction type condition evaluation
  - Modify `evaluateTransactionTypeCondition()` to handle "online", "contactless", and "in_store" values
  - Map "online" to `input.isOnline === true`
  - Map "contactless" to `input.isContactless === true`
  - Map "in_store" to `input.isOnline === false`
  - Support "include", "exclude", and "equals" operations
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [ ]* 2.1 Write property test for transaction type evaluation
  - **Property 3: Transaction type condition evaluation**
  - **Validates: Requirements 2.1, 2.2, 2.3**

- [ ]* 2.2 Write property test for condition operations
  - **Property 4: Condition operation support**
  - **Validates: Requirements 2.4, 2.5**

- [x] 3. Update condition evaluation flow
  - Modify `evaluateConditions()` to normalize conditions before evaluation
  - Apply normalization to all conditions in the rule
  - Ensure normalized conditions are evaluated correctly
  - _Requirements: 1.2, 3.1_

- [ ]* 3.1 Write property test for transaction matching
  - **Property 2: Transaction matching correctness**
  - **Validates: Requirements 1.2, 1.3, 1.4**

- [x] 4. Add comprehensive logging
  - Log card type ID generation in `calculateRewards()`
  - Log number of rules retrieved from repository
  - Log condition evaluation results (pass/fail) in `evaluateCondition()`
  - Log applied rule and calculated points
  - Log errors with full transaction context
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ] 5. Add unit tests for edge cases
  - Test normalization with empty values
  - Test normalization with null operations
  - Test transaction type evaluation with missing flags
  - Test condition evaluation with unknown types
  - _Requirements: 1.5, 2.1, 2.2, 2.3_

- [ ]* 5.1 Write property test for card type ID consistency
  - **Property 1: Card type ID consistency**
  - **Validates: Requirements 1.1**

- [ ] 6. Test end-to-end calculation flow
  - Create test payment method with reward rules
  - Simulate transaction through expense form
  - Verify points calculation returns correct result
  - Verify logging captures all required information
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 7. Add converted amount support to CalculationInput
  - Add `convertedAmount?: number` field to CalculationInput interface
  - Add `convertedCurrency?: string` field to CalculationInput interface
  - Update type definitions in types.ts
  - _Requirements: 5.1, 5.2, 5.5_

- [x] 8. Implement amount selection logic in RewardService
  - Add `getCalculationAmount()` private method to determine which amount to use
  - Method should return convertedAmount if provided, otherwise transaction amount
  - Update `calculateRewards()` to use getCalculationAmount() for all point calculations
  - Pass the selected amount to calculateStandardPoints() and calculateBonusPoints()
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ]* 8.1 Write property test for converted amount priority
  - **Property 6: Converted amount priority**
  - **Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5**

- [x] 9. Fix bonus points calculation
  - Verify calculateBonusPoints() uses the same amount as calculateStandardPoints()
  - Ensure bonus points are added to base points correctly in calculateRewards()
  - Verify rounding and block size are applied consistently
  - Add logging for bonus calculation steps
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ]* 9.1 Write property test for bonus points calculation
  - **Property 7: Bonus points calculation correctness**
  - **Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5**

- [x] 10. Update simulateRewards to accept converted amount
  - Add convertedAmount and convertedCurrency parameters to simulateRewards()
  - Pass these values to CalculationInput
  - Update simulatePoints() similarly
  - _Requirements: 5.1, 5.2_

- [x] 11. Update expense form to pass converted amount
  - Modify useExpenseForm to include convertedAmount in reward calculation
  - Pass convertedAmount from form state to simulateRewards()
  - Ensure converted amount is used when payment method currency differs from transaction currency
  - _Requirements: 5.1, 5.5_

- [x] 12. Test end-to-end with converted amount
  - Create test with transaction in CAD and payment in SGD
  - Verify points are calculated using SGD amount
  - Verify bonus multiplier is applied correctly
  - Test with and without converted amount
  - _Requirements: 5.1, 5.2, 6.1_

- [ ] 13. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
