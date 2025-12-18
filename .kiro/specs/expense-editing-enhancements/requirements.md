# Requirements Document

## Introduction

This feature enhances the expense editing functionality to ensure all transaction fields can be properly edited and persisted. Currently, there are issues with editing transactions:
1. Reward points cannot be manually edited or overridden
2. Merchant category (MCC) selections do not persist when editing - the field appears empty even though the transaction has a category
3. All other fields should be editable and persist correctly

This feature will fix these issues and ensure the edit form properly initializes with all transaction data and saves all changes correctly.

## Glossary

- **System**: The expense tracking application
- **Transaction**: A record of a financial expense including merchant details, amount, payment method, and reward points
- **Reward Points**: Points earned from a transaction based on payment method rules and merchant category
- **Merchant Category Code (MCC)**: A four-digit code that classifies the type of goods or services a merchant provides
- **Edit Form**: The user interface for modifying existing transaction data
- **Validation Error**: A message displayed when user input does not meet system requirements
- **Supabase Database**: The remote database service used for persistent storage of transaction data

## Requirements

### Requirement 1

**User Story:** As a user, I want to edit reward points for a transaction, so that I can correct points when the automatic calculation is incorrect or when I receive promotional bonuses.

#### Acceptance Criteria

1. WHEN a user opens the Edit Form for a transaction, THE System SHALL display the current reward points value in an editable field
2. WHEN a user modifies the reward points field, THE System SHALL accept numeric input with up to 2 decimal places and non-negative values
3. WHEN a user saves a transaction with edited reward points, THE System SHALL persist the user-provided value
4. IF a user enters invalid input in the reward points field, THEN THE System SHALL display a Validation Error message
5. WHEN a user clears the reward points field, THE System SHALL treat the empty value as zero points

### Requirement 2

**User Story:** As a user, I want the merchant category to persist when editing a transaction, so that I don't have to re-select it every time I edit other transaction details.

#### Acceptance Criteria

1. WHEN a user opens the Edit Form for a transaction, THE System SHALL display the previously selected Merchant Category Code in the category selector
2. WHEN a user saves a transaction without changing the Merchant Category Code, THE System SHALL preserve the original Merchant Category Code value
3. WHEN a user changes the Merchant Category Code and saves, THE System SHALL persist the new Merchant Category Code value
4. WHEN a transaction has no Merchant Category Code set, THE System SHALL display the category selector in its empty state

### Requirement 3

**User Story:** As a user, I want to see the breakdown of base and bonus points when editing, so that I understand how my reward points are calculated.

#### Acceptance Criteria

1. WHEN a user views the Transaction details, THE System SHALL display the total Reward Points, base points, and bonus points separately
2. WHEN a user edits the total Reward Points, THE System SHALL preserve the base and bonus point breakdown for reference
3. WHEN a user changes Transaction details that affect point calculation, THE System SHALL display the new automatically calculated values as a reference

### Requirement 4

**User Story:** As a user, I want to see the automatically calculated points as a reference, so that I can compare with my edited value if needed.

#### Acceptance Criteria

1. WHEN a user views the Edit Form, THE System SHALL display the automatically calculated Reward Points as a reference
2. WHEN a user changes Transaction details that affect points calculation, THE System SHALL update the calculated reference value
3. WHEN the calculated Reward Points differ from the entered Reward Points, THE System SHALL display both values for comparison

### Requirement 5

**User Story:** As a developer, I want the reward points field to be editable like other transaction fields, so that users can correct values when needed.

#### Acceptance Criteria

1. WHEN a Transaction is saved with edited Reward Points, THE System SHALL persist the user-entered value to the Supabase Database
2. WHEN a Transaction is loaded for editing, THE System SHALL display the stored Reward Points value in the editable field
3. WHEN a Transaction is created, THE System SHALL use the automatically calculated Reward Points as the default value
4. WHEN Reward Points are used in analytics or dashboards, THE System SHALL use the stored value regardless of how the value was entered

### Requirement 6

**User Story:** As a user, I want my transaction edits to be permanently saved, so that my changes are available across sessions and devices.

#### Acceptance Criteria

1. WHEN a user saves an edited Transaction, THE System SHALL persist all changes to the Supabase Database
2. WHEN a user saves a Transaction with an edited Merchant Category Code, THE System SHALL persist the Merchant Category Code to the Supabase Database
3. WHEN a user reopens the application after editing a Transaction, THE System SHALL retrieve the edited values from the Supabase Database
4. IF the Supabase Database connection fails during save, THEN THE System SHALL display an error message and retain the form data for retry
