# Design Document

## Overview

This design addresses critical bugs in the reward points calculation system:

1. **Zero points bug**: The RewardService returns 0 points despite properly configured reward rules due to unsupported "online" condition type
2. **Converted amount bug**: Points are calculated using transaction amount instead of converted amount when currencies differ
3. **Bonus multiplier bug**: Bonus multipliers are not being applied correctly

This design provides solutions that:

1. Extend the RewardService to properly evaluate transaction type conditions
2. Provide backward compatibility for existing rules with "online" condition type
3. Add support for converted amount in points calculation
4. Fix bonus multiplier calculation logic
5. Add comprehensive logging for debugging
6. Ensure the calculation flow works end-to-end from the expense form to the reward service

## Architecture

The reward calculation system follows this flow:

```
ExpenseForm → useExpenseForm → RewardService.simulateRewards() → RewardService.calculateRewards()
                                                                          ↓
                                                                   CardTypeIdService
                                                                          ↓
                                                                   RuleRepository.getRulesForCardType()
                                                                          ↓
                                                                   evaluateConditions()
                                                                          ↓
                                                                   calculatePoints()
```

The fix will be implemented at the `evaluateCondition()` method level to properly handle transaction type conditions.

## Components and Interfaces

### 1. RewardService Enhancement

**Modified Method: `evaluateCondition()`**

Add support for evaluating transaction_type conditions by checking the `isOnline` and `isContactless` flags from the `CalculationInput`.

**Modified Method: `evaluateTransactionTypeCondition()`**

Enhance this method to handle the following transaction types:
- "online": Maps to `input.isOnline === true`
- "contactless": Maps to `input.isContactless === true`
- "in_store": Maps to `input.isOnline === false`
- "purchase": Default transaction type

**New Method: `getCalculationAmount()`**

Add a helper method to determine which amount to use for calculations:

```typescript
private getCalculationAmount(input: CalculationInput): number {
  // Use converted amount if provided, otherwise use transaction amount
  return input.convertedAmount ?? input.amount;
}
```

**Modified Method: `calculateRewards()`**

Update to use `getCalculationAmount()` when calling calculation methods:

```typescript
const calculationAmount = this.getCalculationAmount(input);
// Use calculationAmount instead of input.amount for all point calculations
```

**Modified Methods: `calculateStandardPoints()` and `calculateBonusPoints()`**

These methods already accept amount as a parameter, so no changes needed to their signatures. The caller (`calculateRewards`) will pass the correct amount (converted or transaction).

### 2. Backward Compatibility Handler

**New Method: `normalizeCondition()`**

This method will handle backward compatibility by converting legacy "online" condition types to the proper "transaction_type" format:

```typescript
private normalizeCondition(condition: RuleCondition): RuleCondition {
  // If condition type is "online" (legacy), convert to transaction_type
  if (condition.type === "online") {
    return {
      ...condition,
      type: "transaction_type",
      values: condition.operation === "equals" && condition.values[0] === "true" 
        ? ["online"] 
        : condition.operation === "equals" && condition.values[0] === "false"
        ? ["in_store"]
        : condition.values
    };
  }
  return condition;
}
```

### 3. Enhanced Logging

Add logging at key points:
- When generating card type ID
- When retrieving rules from repository
- When evaluating each condition
- When applying a rule
- When returning final calculation result

## Data Models

### RuleCondition Type Extension

The existing `RuleCondition` type already supports "transaction_type", but the implementation needs to be enhanced to properly map transaction types to the boolean flags in `CalculationInput`.

### CalculationInput Enhancement

Add new field to support converted amount:

```typescript
export interface CalculationInput {
  amount: number;
  currency: string;
  convertedAmount?: number;  // NEW: Amount in payment method currency
  convertedCurrency?: string; // NEW: Payment method currency
  paymentMethod: PaymentMethodInput;
  mcc?: string;
  merchantName?: string;
  transactionType: TransactionType;
  isOnline?: boolean;
  isContactless?: boolean;
  date: Date | { toJSDate: () => Date };
  monthlySpend?: number;
  usedBonusPoints?: number;
}
```

The calculation logic will use `convertedAmount` if provided, otherwise fall back to `amount`.

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Acceptence Criteria Testing Prework:

1.1 WHEN a user selects a payment method with reward rules THEN the system SHALL retrieve the rules using the correct card type ID
Thoughts: This is about ensuring that for any payment method, the card type ID generation is consistent and retrieves the correct rules. We can test this by generating random payment methods, creating rules for them, and verifying retrieval works.
Testable: yes - property

1.2 WHEN the system evaluates reward rules THEN the system SHALL correctly match rules based on transaction properties including online/offline status
Thoughts: This is about the matching logic working correctly across all possible transaction property combinations. We can generate random transactions and rules and verify matching works correctly.
Testable: yes - property

1.3 WHEN a transaction is online THEN the system SHALL apply rules that specify online transaction conditions
Thoughts: This is a specific case of the matching logic. For any transaction with isOnline=true, rules with online conditions should match.
Testable: yes - property

1.4 WHEN a transaction is offline THEN the system SHALL NOT apply rules that specify online-only conditions
Thoughts: This is the inverse of 1.3. For any transaction with isOnline=false, rules with online-only conditions should not match.
Testable: yes - property

1.5 WHEN no reward rules match a transaction THEN the system SHALL return 0 points with an appropriate message
Thoughts: This is testing the edge case where no rules match. We can create transactions that don't match any rules and verify the result.
Testable: yes - example

2.1 WHEN a reward rule specifies a transaction_type condition with value "online" THEN the system SHALL evaluate it against the transaction's isOnline property
Thoughts: This is testing the mapping between condition values and transaction properties. For any transaction, the evaluation should correctly check isOnline.
Testable: yes - property

2.2 WHEN a reward rule specifies a transaction_type condition with value "contactless" THEN the system SHALL evaluate it against the transaction's isContactless property
Thoughts: Similar to 2.1 but for contactless. For any transaction, the evaluation should correctly check isContactless.
Testable: yes - property

2.3 WHEN a reward rule specifies a transaction_type condition with value "in_store" THEN the system SHALL evaluate it as the inverse of isOnline
Thoughts: This is testing the derived transaction type. For any transaction, in_store should equal !isOnline.
Testable: yes - property

2.4 WHEN evaluating transaction_type conditions THEN the system SHALL support "include", "exclude", and "equals" operations
Thoughts: This is testing that all three operations work correctly. We can test each operation with various inputs.
Testable: yes - property

2.5 WHEN a transaction_type condition uses "include" operation THEN the system SHALL return true if the transaction matches any of the specified types
Thoughts: This is testing the include operation specifically. For any set of transaction types, include should work correctly.
Testable: yes - property

3.1 WHEN the system detects a rule with condition type "online" THEN the system SHALL treat it as a transaction_type condition
Thoughts: This is testing backward compatibility. For any rule with "online" condition, it should be normalized to transaction_type.
Testable: yes - property

3.2 WHEN migrating rules THEN the system SHALL preserve the original rule's intent and behavior
Thoughts: This is about ensuring the migration doesn't change behavior. We can test by comparing results before and after normalization.
Testable: yes - property

3.3 WHEN a rule has condition type "online" with operation "equals" and value "true" THEN the system SHALL convert it to transaction_type condition with operation "include" and value "online"
Thoughts: This is a specific transformation rule. We can test the normalization function directly.
Testable: yes - example

3.4 WHEN a rule has condition type "online" with operation "equals" and value "false" THEN the system SHALL convert it to transaction_type condition with operation "exclude" and value "online"
Thoughts: This is another specific transformation rule. We can test the normalization function directly.
Testable: yes - example

3.5 WHEN migration completes THEN the system SHALL log the changes made for audit purposes
Thoughts: This is about logging behavior, which is not easily testable in an automated way.
Testable: no

4.1 WHEN the system calculates rewards THEN the system SHALL log the card type ID being used
Thoughts: This is about logging behavior, which is not easily testable in an automated way.
Testable: no

4.2 WHEN the system retrieves rules THEN the system SHALL log the number of rules found
Thoughts: This is about logging behavior, which is not easily testable in an automated way.
Testable: no

4.3 WHEN the system evaluates conditions THEN the system SHALL log which conditions pass and fail
Thoughts: This is about logging behavior, which is not easily testable in an automated way.
Testable: no

4.4 WHEN the system applies a rule THEN the system SHALL log which rule was applied and the resulting points
Thoughts: This is about logging behavior, which is not easily testable in an automated way.
Testable: no

4.5 WHEN the system encounters an error THEN the system SHALL log detailed error information including the transaction context
Thoughts: This is about logging behavior, which is not easily testable in an automated way.
Testable: no

5.1 WHEN a transaction has a converted amount THEN the system SHALL use the converted amount for points calculation
Thoughts: This is testing that for any transaction with a converted amount, the calculation uses that amount. We can generate random transactions with converted amounts and verify the calculation uses it.
Testable: yes - property

5.2 WHEN a transaction has no converted amount THEN the system SHALL use the transaction amount for points calculation
Thoughts: This is testing the fallback behavior. For any transaction without a converted amount, the original amount should be used.
Testable: yes - property

5.3 WHEN calculating base points THEN the system SHALL apply the base multiplier to the converted amount if available
Thoughts: This is a specific case of 5.1. It's redundant with the general property.
Testable: redundant with 5.1

5.4 WHEN calculating bonus points THEN the system SHALL apply the bonus multiplier to the converted amount if available
Thoughts: This is a specific case of 5.1. It's redundant with the general property.
Testable: redundant with 5.1

5.5 WHEN both transaction amount and converted amount are provided THEN the system SHALL prioritize the converted amount for all calculations
Thoughts: This is the same as 5.1 - testing that converted amount takes priority.
Testable: redundant with 5.1

6.1 WHEN a reward rule has a bonus multiplier greater than 0 THEN the system SHALL calculate bonus points using that multiplier
Thoughts: This is testing that for any rule with a bonus multiplier, bonus points are calculated. We can generate random rules and transactions and verify bonus points are non-zero when multiplier > 0.
Testable: yes - property

6.2 WHEN calculating bonus points THEN the system SHALL use the same amount (converted or transaction) as used for base points
Thoughts: This is testing consistency between base and bonus calculations. For any transaction, both should use the same amount.
Testable: yes - property

6.3 WHEN a rule has both base and bonus multipliers THEN the system SHALL calculate both base and bonus points separately
Thoughts: This is testing that both calculations happen. For any rule with both multipliers, both point types should be calculated.
Testable: yes - property

6.4 WHEN bonus points are calculated THEN the system SHALL apply the same rounding and block size rules as base points
Thoughts: This is testing that the calculation parameters are consistent. For any transaction, the rounding should be applied the same way.
Testable: yes - property

6.5 WHEN the total points are calculated THEN the system SHALL sum base points and bonus points correctly
Thoughts: This is testing basic arithmetic. For any calculation, total should equal base + bonus.
Testable: yes - property

### Property Reflection:

Looking at the properties identified:

- Properties 1.3 and 1.4 are complementary cases of property 1.2 (correct matching based on online/offline status)
- Properties 2.1, 2.2, and 2.3 are specific cases of how transaction_type conditions are evaluated
- Property 2.5 is a specific case of property 2.4 (testing one operation type)
- Properties 3.3 and 3.4 are specific examples of property 3.1 (normalization)
- Properties 5.3, 5.4, and 5.5 are all redundant with 5.1 (converted amount usage)
- Properties 5.1 and 5.2 are complementary (converted amount vs fallback)
- Properties 6.2, 6.3, 6.4, and 6.5 are all aspects of correct bonus calculation

We can consolidate:
- Combine 1.2, 1.3, 1.4 into a single comprehensive property about transaction matching
- Combine 2.1, 2.2, 2.3 into a single property about transaction type mapping
- Keep 2.4 and 2.5 separate as they test different aspects
- Keep 3.1 and 3.2 as they test different aspects of normalization
- Use 3.3 and 3.4 as unit test examples rather than separate properties
- Combine 5.1 and 5.2 into a single property about amount selection
- Combine 6.1, 6.2, 6.3, 6.4, 6.5 into a single comprehensive property about bonus calculation

## Correctness Properties

Property 1: Card type ID consistency
*For any* payment method with issuer and name, generating the card type ID and using it to retrieve rules should return the rules associated with that payment method
**Validates: Requirements 1.1**

Property 2: Transaction matching correctness
*For any* transaction and set of reward rules, the system should apply rules whose conditions match the transaction properties (including isOnline, isContactless, MCC, etc.)
**Validates: Requirements 1.2, 1.3, 1.4**

Property 3: Transaction type condition evaluation
*For any* transaction with isOnline or isContactless flags, evaluating a transaction_type condition should correctly map "online" to isOnline, "contactless" to isContactless, and "in_store" to !isOnline
**Validates: Requirements 2.1, 2.2, 2.3**

Property 4: Condition operation support
*For any* transaction_type condition with "include", "exclude", or "equals" operation, the evaluation should correctly apply the operation logic
**Validates: Requirements 2.4, 2.5**

Property 5: Backward compatibility normalization
*For any* rule with condition type "online", normalizing the condition should convert it to an equivalent transaction_type condition that preserves the original matching behavior
**Validates: Requirements 3.1, 3.2**

Property 6: Converted amount priority
*For any* transaction, when a converted amount is provided, the system should use it for all point calculations; when no converted amount is provided, the system should use the transaction amount
**Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5**

Property 7: Bonus points calculation correctness
*For any* transaction and reward rule with a bonus multiplier greater than 0, the system should calculate bonus points using the same amount as base points, apply the bonus multiplier correctly, use consistent rounding and block size rules, and sum base and bonus points to get the total
**Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5**

## Error Handling

### Invalid Condition Types

When an unknown condition type is encountered:
1. Log a warning with the condition details
2. Apply backward compatibility normalization if applicable
3. Return `true` (permissive) to avoid breaking existing rules
4. Include a message in the calculation result

### Missing Transaction Properties

When required transaction properties are missing:
1. Log the missing properties
2. Treat missing boolean flags as `false`
3. Continue with calculation using available data

### Rule Retrieval Failures

When rule retrieval fails:
1. Log the error with card type ID
2. Return 0 points with an error message
3. Do not throw an exception (graceful degradation)

## Testing Strategy

### Unit Tests

1. **Condition Normalization Tests**
   - Test conversion of "online" type to "transaction_type"
   - Test preservation of other condition types
   - Test edge cases (empty values, null operations)

2. **Transaction Type Evaluation Tests**
   - Test "online" mapping to isOnline
   - Test "contactless" mapping to isContactless
   - Test "in_store" mapping to !isOnline
   - Test "include", "exclude", "equals" operations

3. **Card Type ID Generation Tests**
   - Test consistent ID generation from issuer/name
   - Test case normalization
   - Test special character handling

### Property-Based Tests

Property-based tests will use the `fast-check` library for TypeScript. Each test should run a minimum of 100 iterations.

1. **Property Test: Card Type ID Consistency**
   - Generate random payment methods
   - Verify card type ID generation is consistent
   - Tag: `**Feature: reward-calculation-fix, Property 1: Card type ID consistency**`
   - **Validates: Requirements 1.1**

2. **Property Test: Transaction Matching Correctness**
   - Generate random transactions and rules
   - Verify matching logic works correctly
   - Tag: `**Feature: reward-calculation-fix, Property 2: Transaction matching correctness**`
   - **Validates: Requirements 1.2, 1.3, 1.4**

3. **Property Test: Transaction Type Condition Evaluation**
   - Generate random transactions with various flag combinations
   - Verify transaction_type conditions evaluate correctly
   - Tag: `**Feature: reward-calculation-fix, Property 3: Transaction type condition evaluation**`
   - **Validates: Requirements 2.1, 2.2, 2.3**

4. **Property Test: Condition Operation Support**
   - Generate random transaction_type conditions with different operations
   - Verify all operations work correctly
   - Tag: `**Feature: reward-calculation-fix, Property 4: Condition operation support**`
   - **Validates: Requirements 2.4, 2.5**

5. **Property Test: Backward Compatibility Normalization**
   - Generate random rules with "online" condition type
   - Verify normalization preserves behavior
   - Tag: `**Feature: reward-calculation-fix, Property 5: Backward compatibility normalization**`
   - **Validates: Requirements 3.1, 3.2**

6. **Property Test: Converted Amount Priority**
   - Generate random transactions with and without converted amounts
   - Verify correct amount is used for calculations
   - Tag: `**Feature: reward-calculation-fix, Property 6: Converted amount priority**`
   - **Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5**

7. **Property Test: Bonus Points Calculation Correctness**
   - Generate random transactions and rules with bonus multipliers
   - Verify bonus points are calculated correctly and consistently with base points
   - Tag: `**Feature: reward-calculation-fix, Property 7: Bonus points calculation correctness**`
   - **Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5**

### Integration Tests

1. **End-to-End Calculation Test**
   - Create a payment method with reward rules
   - Simulate a transaction through the expense form
   - Verify points are calculated correctly

2. **Rule Retrieval Test**
   - Create rules with various card type IDs
   - Verify retrieval works for all payment methods

3. **Logging Verification Test**
   - Capture logs during calculation
   - Verify all required information is logged

## Implementation Notes

1. The fix should be implemented in the RewardService class
2. Backward compatibility must be maintained for existing rules
3. No database migration is required - normalization happens at runtime
4. Logging should use the existing logger utility
5. The fix should not change the public API of RewardService
