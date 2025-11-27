# Implementation Plan

## Phase 1: Investigate and Fix Reward Rules Persistence

- [x] 1. Investigate reward rules persistence failure
- [x] 1.1 Add comprehensive logging to RuleRepository methods

  - Add logging before and after each database operation
  - Log the data being sent to Supabase
  - Log any errors returned from Supabase
  - _Requirements: 11.1, 11.2_

- [x] 1.2 Verify Supabase authentication and connection

  - Check if Supabase client is properly initialized
  - Verify user authentication status
  - Test database connection with a simple query
  - _Requirements: 7.1, 11.3_

- [x] 1.3 Identify and fix the read-only mode issue

  - Check where readOnly flag is being set
  - Remove or fix the read-only mode logic
  - Ensure production mode allows database writes
  - _Requirements: 11.5_

- [x] 1.4 Fix type mapping between application and database

  - Review RuleMapper implementation
  - Fix any field name mismatches
  - Ensure all required fields are mapped correctly
  - _Requirements: 1.5, 4.1, 4.2, 11.4_

- [x] 1.5 Write property test for reward rule persistence

  - **Property 1: Reward rule persistence round-trip**
  - **Validates: Requirements 1.2, 1.3, 1.5**

- [x] 1.6 Test reward rule CRUD operations manually
  - Create a reward rule through the UI
  - Verify it appears in Supabase database
  - Edit the rule and verify changes persist
  - Delete the rule and verify it's removed
  - _Requirements: 1.2, 1.3, 1.4_

## Phase 2: Implement CardTypeIdService

- [x] 2. Create centralized CardTypeIdService
- [x] 2.1 Implement CardTypeIdService class

  - Create service with generateCardTypeId method
  - Implement consistent ID generation logic (issuer-name format)
  - Add validation method for card type IDs
  - _Requirements: 2.1, 2.4_

- [x] 2.2 Write property test for card type ID consistency

  - **Property 2: Card type ID consistency**
  - **Validates: Requirements 2.1, 2.2**

- [x] 2.3 Update all code to use CardTypeIdService

  - Replace ID generation in PaymentMethods page
  - Replace ID generation in RuleRepository
  - Replace ID generation in RewardService
  - _Requirements: 2.2_

- [x] 2.4 Write unit tests for CardTypeIdService
  - Test ID generation with various inputs
  - Test validation logic
  - Test edge cases (empty strings, special characters)
  - _Requirements: 2.1_

## Phase 3: Enhance Error Handling

- [x] 3. Implement comprehensive error handling
- [x] 3.1 Create custom error classes

  - Implement RepositoryError base class
  - Implement AuthenticationError class
  - Implement ValidationError class
  - Implement PersistenceError class
  - _Requirements: 6.1, 6.2_

- [x] 3.2 Add error handling to RuleRepository

  - Wrap all Supabase operations in try-catch
  - Throw appropriate error types
  - Add error logging
  - _Requirements: 6.1, 6.2, 7.5, 7.6_

- [x] 3.3 Write property test for database operation verification

  - **Property 13: Database operation verification**
  - **Validates: Requirements 7.5, 7.6**

- [x] 3.4 Update UI components to display errors

  - Catch errors in RewardRuleManager
  - Display user-friendly error messages with toast
  - Handle offline/connection errors gracefully
  - _Requirements: 6.2, 1.6_

- [x] 3.5 Write unit tests for error handling
  - Test error creation and properties
  - Test error handling in repository
  - Test UI error display
  - _Requirements: 6.1, 6.2_

## Phase 4: Fix Repository Initialization

- [x] 4. Fix RuleRepository singleton pattern
- [x] 4.1 Refactor RuleRepository initialization

  - Ensure singleton is initialized on app startup
  - Remove fallback mock repository
  - Add proper error if not initialized
  - _Requirements: 7.1, 7.3, 7.4_

- [x] 4.2 Write property test for singleton consistency

  - **Property 5: Repository singleton consistency**
  - **Validates: Requirements 7.2**

- [x] 4.3 Initialize RuleRepository in App.tsx

  - Call initializeRuleRepository on app mount
  - Handle initialization errors
  - _Requirements: 7.1, 7.4_

- [x] 4.4 Write unit tests for repository initialization
  - Test singleton behavior
  - Test initialization with Supabase client
  - Test error handling when not initialized
  - _Requirements: 7.1, 7.2, 7.3_

## Phase 5: Improve Reward Calculation Logic

- [x] 5. Enhance RewardService
- [x] 5.1 Fix rule matching logic

  - Ensure card type ID matching works correctly
  - Implement proper condition evaluation
  - _Requirements: 5.1, 5.3_

- [x] 5.2 Write property test for applicable rules filtering

  - **Property 6: Applicable rules filtering**
  - **Validates: Requirements 5.1**

- [x] 5.3 Write property test for rule priority ordering

  - **Property 7: Rule priority ordering**
  - **Validates: Requirements 5.2**

- [x] 5.4 Write property test for condition evaluation

  - **Property 8: Condition evaluation completeness**
  - **Validates: Requirements 5.3**

- [x] 5.5 Implement monthly cap tracking

  - Track bonus points used per month
  - Enforce caps correctly
  - _Requirements: 5.4_

- [x] 5.6 Write property test for monthly cap enforcement

  - **Property 9: Monthly cap enforcement**
  - **Validates: Requirements 5.4**

- [x] 5.7 Write property test for points calculation

  - **Property 10: Points calculation accuracy**
  - **Validates: Requirements 5.5**

- [x] 5.8 Write unit tests for RewardService
  - Test calculation with specific examples
  - Test edge cases (zero amount, negative values)
  - Test tiered rewards
  - _Requirements: 5.5_

## Phase 6: Improve Reward Rule Editor UI

- [x] 6. Enhance RewardRuleEditor component
- [x] 6.1 Add validation to reward rule form

  - Validate required fields (name, cardTypeId)
  - Validate numeric fields (priority, multipliers)
  - Show validation errors inline
  - _Requirements: 8.4_

- [x] 6.2 Write property test for required field validation

  - **Property 12: Required field validation**
  - **Validates: Requirements 8.4**

- [x] 6.3 Write property test for validation error specificity

  - **Property 11: Validation error specificity**
  - **Validates: Requirements 6.3**

- [x] 6.4 Improve condition configuration UI

  - Support all condition types (MCC, merchant, transaction type)
  - Add helpful examples and tooltips
  - _Requirements: 8.2_

- [x] 6.5 Improve reward configuration UI

  - Support all reward types (base, bonus, tiered, caps)
  - Add helpful examples and tooltips
  - _Requirements: 8.3_

- [x] 6.6 Write unit tests for form validation
  - Test validation logic
  - Test error message display
  - _Requirements: 8.4_

## Phase 7: Code Cleanup and Consolidation

- [x] 7. Remove obsolete code and consolidate duplicates
- [x] 7.1 Identify and remove unused components

  - Search for unused reward-related components
  - Remove dead code and commented-out sections
  - _Requirements: 3.1, 3.2, 3.3_

- [x] 7.2 Consolidate duplicate type definitions

  - Identify duplicate types across files
  - Create single source of truth for types
  - Update imports throughout codebase
  - _Requirements: 4.3_

- [x] 7.3 Consolidate type mapping logic

  - Create single RuleMapper class
  - Remove scattered mapping code
  - _Requirements: 4.1, 4.2_

- [x] 7.4 Write property test for type mapping

  - **Property 3: Database type mapping preservation**
  - **Validates: Requirements 4.1, 4.2**

- [x] 7.5 Simplify service initialization

  - Replace multiple singleton patterns with consistent approach
  - Document service lifecycle
  - _Requirements: 3.4_

- [x] 7.6 Add JSDoc comments to public APIs
  - Document all service methods
  - Document all repository methods
  - Document error types
  - _Requirements: 3.1, 3.2, 3.3_

## Phase 8: Fix Failing Tests and Checkpoint

- [ ] 8. Fix failing property-based tests
- [x] 8.1 Fix RuleRepository.verification.pbt.test.ts failures

  - Update test generators to produce valid rule data (non-empty names, valid
    card type IDs)
  - Ensure generated test data passes validation before testing database
    operations
  - Fix the 4 failing test cases in the verification suite
  - _Requirements: 7.5, 7.6_

- [x] 8.2 Checkpoint - Ensure all tests pass
  - Run full test suite and verify all 170+ tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Phase 9: Final Testing and Documentation

- [-] 9. Comprehensive testing and documentation
- [ ] 9.1 Run all property-based tests

  - Verify all implemented properties pass
  - Fix any remaining failures
  - _Requirements: All_

- [ ] 9.2 Run all unit tests

  - Verify all unit tests pass
  - Achieve 80%+ code coverage for reward modules
  - _Requirements: 9.1, 9.2, 9.5_

- [x] 9.3 Manual end-to-end testing

  - Test reward rule CRUD operations through UI
  - Test reward calculation with various scenarios
  - Test error handling and edge cases
  - _Requirements: 1.2, 1.3, 1.4, 5.5_

- [ ] 9.4 Update documentation
  - Document all service methods with JSDoc
  - Update README with reward rules management guide
  - Document error handling patterns
  - _Requirements: 3.1, 3.2, 3.3_

## Phase 10: Final Checkpoint

- [ ] 10. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
