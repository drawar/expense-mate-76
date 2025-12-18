# Requirements Document

## Introduction

This document specifies the requirements for fixing critical bugs in the reward points calculation system:

1. **Zero points bug**: Reward points calculation returns 0 points on the Add Expense page, even when payment methods have properly configured reward rules. The root cause is that reward rules use an unsupported condition type "online" which is not recognized by the RewardService, causing rules to fail matching.

2. **Converted amount bug**: Points are calculated based on the transaction amount instead of the converted amount when the payment method currency differs from the transaction currency.

3. **Bonus multiplier bug**: Bonus multipliers are not being applied correctly, resulting in incorrect point calculations even when rules match properly.

## Glossary

- **RewardService**: The service responsible for calculating reward points based on transaction details and reward rules
- **RuleCondition**: A condition that must be met for a reward rule to apply to a transaction
- **CardTypeId**: A unique identifier for a payment method type, generated from issuer and name (e.g., "citibank-rewards-visa-signature")
- **Transaction Type**: A classification of the transaction (e.g., "purchase", "online", "contactless")
- **MCC**: Merchant Category Code - a four-digit number used to classify businesses by the type of goods or services they provide
- **Transaction Amount**: The original amount of the transaction in the transaction currency
- **Converted Amount**: The actual amount charged to the payment method when the payment method currency differs from the transaction currency
- **Base Points**: Points earned from the base multiplier applied to the transaction amount
- **Bonus Points**: Additional points earned from bonus multipliers or tiered rewards

## Requirements

### Requirement 1

**User Story:** As a user adding an expense, I want the reward points to be calculated correctly based on my payment method's reward rules, so that I can see accurate points earned for my transaction.

#### Acceptance Criteria

1. WHEN a user selects a payment method with reward rules THEN the system SHALL retrieve the rules using the correct card type ID
2. WHEN the system evaluates reward rules THEN the system SHALL correctly match rules based on transaction properties including online/offline status
3. WHEN a transaction is online THEN the system SHALL apply rules that specify online transaction conditions
4. WHEN a transaction is offline THEN the system SHALL NOT apply rules that specify online-only conditions
5. WHEN no reward rules match a transaction THEN the system SHALL return 0 points with an appropriate message

### Requirement 2

**User Story:** As a developer, I want the reward rule condition system to support transaction type conditions, so that rules can differentiate between online and offline transactions.

#### Acceptance Criteria

1. WHEN a reward rule specifies a transaction_type condition with value "online" THEN the system SHALL evaluate it against the transaction's isOnline property
2. WHEN a reward rule specifies a transaction_type condition with value "contactless" THEN the system SHALL evaluate it against the transaction's isContactless property
3. WHEN a reward rule specifies a transaction_type condition with value "in_store" THEN the system SHALL evaluate it as the inverse of isOnline
4. WHEN evaluating transaction_type conditions THEN the system SHALL support "include", "exclude", and "equals" operations
5. WHEN a transaction_type condition uses "include" operation THEN the system SHALL return true if the transaction matches any of the specified types

### Requirement 3

**User Story:** As a system administrator, I want existing reward rules with invalid condition types to be migrated to the correct format, so that they work properly without manual intervention.

#### Acceptance Criteria

1. WHEN the system detects a rule with condition type "online" THEN the system SHALL treat it as a transaction_type condition
2. WHEN migrating rules THEN the system SHALL preserve the original rule's intent and behavior
3. WHEN a rule has condition type "online" with operation "equals" and value "true" THEN the system SHALL convert it to transaction_type condition with operation "include" and value "online"
4. WHEN a rule has condition type "online" with operation "equals" and value "false" THEN the system SHALL convert it to transaction_type condition with operation "exclude" and value "online"
5. WHEN migration completes THEN the system SHALL log the changes made for audit purposes

### Requirement 4

**User Story:** As a developer, I want comprehensive logging during reward calculation, so that I can debug issues when points are not calculated correctly.

#### Acceptance Criteria

1. WHEN the system calculates rewards THEN the system SHALL log the card type ID being used
2. WHEN the system retrieves rules THEN the system SHALL log the number of rules found
3. WHEN the system evaluates conditions THEN the system SHALL log which conditions pass and fail
4. WHEN the system applies a rule THEN the system SHALL log which rule was applied and the resulting points
5. WHEN the system encounters an error THEN the system SHALL log detailed error information including the transaction context

### Requirement 5

**User Story:** As a user, I want reward points to be calculated based on the actual amount charged to my payment method, so that I earn the correct number of points when making purchases in foreign currencies.

#### Acceptance Criteria

1. WHEN a transaction has a converted amount THEN the system SHALL use the converted amount for points calculation
2. WHEN a transaction has no converted amount THEN the system SHALL use the transaction amount for points calculation
3. WHEN calculating base points THEN the system SHALL apply the base multiplier to the converted amount if available
4. WHEN calculating bonus points THEN the system SHALL apply the bonus multiplier to the converted amount if available
5. WHEN both transaction amount and converted amount are provided THEN the system SHALL prioritize the converted amount for all calculations

### Requirement 6

**User Story:** As a user, I want bonus multipliers to be applied correctly to my transactions, so that I earn the correct bonus points for qualifying purchases.

#### Acceptance Criteria

1. WHEN a reward rule has a bonus multiplier greater than 0 THEN the system SHALL calculate bonus points using that multiplier
2. WHEN calculating bonus points THEN the system SHALL use the same amount (converted or transaction) as used for base points
3. WHEN a rule has both base and bonus multipliers THEN the system SHALL calculate both base and bonus points separately
4. WHEN bonus points are calculated THEN the system SHALL apply the same rounding and block size rules as base points
5. WHEN the total points are calculated THEN the system SHALL sum base points and bonus points correctly
