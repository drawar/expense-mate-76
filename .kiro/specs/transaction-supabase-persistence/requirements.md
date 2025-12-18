# Requirements Document

## Introduction

This feature ensures that transaction edits, including reward points and merchant category (MCC), are properly persisted to the Supabase database. Currently, the application has the following issues:

1. The TransactionDialog component does not provide an edit interface - it only displays transaction details
2. The Supabase transactions table schema is missing columns for base_points, bonus_points, reimbursement_amount, and deleted_at
3. The merchants table mcc column is TEXT but needs to be JSONB to properly store MCC objects
4. The merchants table is missing the is_deleted column
5. When users edit transactions, changes are not saved to Supabase

This feature will add the missing database columns, create an edit interface in TransactionDialog, and ensure all transaction edits persist correctly to Supabase.

## Glossary

- **System**: The expense tracking application
- **Transaction**: A record of a financial expense including merchant details, amount, payment method, and reward points
- **Reward Points**: Points earned from a transaction based on payment method rules and merchant category
- **Base Points**: The standard reward points earned from a transaction
- **Bonus Points**: Additional reward points earned from bonus categories or promotions
- **Merchant Category Code (MCC)**: A four-digit code that classifies the type of goods or services a merchant provides, stored as a JSON object with code and description
- **Supabase Database**: The remote PostgreSQL database service used for persistent storage
- **TransactionDialog**: The UI component that displays transaction details and provides edit functionality
- **ExpenseForm**: The form component used for creating and editing transactions
- **StorageService**: The service layer that handles data persistence to Supabase and localStorage

## Requirements

### Requirement 1

**User Story:** As a user, I want to edit existing transactions through the TransactionDialog, so that I can correct transaction details including reward points and merchant category.

#### Acceptance Criteria

1. WHEN a user clicks the Edit button in TransactionDialog, THE System SHALL display the ExpenseForm with the transaction's current values pre-filled
2. WHEN a user modifies transaction fields in edit mode, THE System SHALL validate the input according to form validation rules
3. WHEN a user saves edited transaction data, THE System SHALL call the StorageService updateTransaction method with the modified values
4. WHEN a user cancels editing, THE System SHALL return to the transaction detail view without saving changes
5. WHEN the edit operation completes successfully, THE System SHALL close the dialog and refresh the transaction list

### Requirement 2

**User Story:** As a developer, I want the Supabase transactions table to have all necessary columns, so that all transaction data can be properly stored and retrieved.

#### Acceptance Criteria

1. WHEN the database schema is updated, THE System SHALL add a base_points column of type NUMERIC to the transactions table
2. WHEN the database schema is updated, THE System SHALL add a bonus_points column of type NUMERIC to the transactions table
3. WHEN the database schema is updated, THE System SHALL add a reimbursement_amount column of type NUMERIC to the transactions table
4. WHEN the database schema is updated, THE System SHALL add a deleted_at column of type TIMESTAMP WITH TIME ZONE to the transactions table
5. WHEN existing transactions are queried, THE System SHALL handle NULL values in new columns gracefully by defaulting to 0 for numeric fields

### Requirement 3

**User Story:** As a developer, I want the merchants table mcc column to be JSONB type, so that MCC objects with code and description can be properly stored and retrieved.

#### Acceptance Criteria

1. WHEN the database schema is updated, THE System SHALL alter the merchants table mcc column from TEXT to JSONB type
2. WHEN a merchant with MCC is saved, THE System SHALL store the MCC as a JSON object with code and description properties
3. WHEN a merchant is retrieved, THE System SHALL parse the JSONB mcc column into a MerchantCategoryCode object
4. WHEN existing merchants with TEXT mcc values are migrated, THE System SHALL convert valid TEXT values to JSONB format
5. WHEN the merchants table is updated, THE System SHALL add an is_deleted column of type BOOLEAN with default false

### Requirement 4

**User Story:** As a user, I want my edited reward points to be saved to Supabase, so that my manual point corrections persist across sessions.

#### Acceptance Criteria

1. WHEN a user edits reward points in a transaction, THE System SHALL save the edited total_points value to the Supabase transactions table
2. WHEN a user edits reward points, THE System SHALL save the base_points value to the Supabase transactions table
3. WHEN a user edits reward points, THE System SHALL save the bonus_points value to the Supabase transactions table
4. WHEN a transaction is retrieved from Supabase, THE System SHALL display the stored total_points, base_points, and bonus_points values
5. WHEN reward points are NULL in the database, THE System SHALL default to 0 points

### Requirement 5

**User Story:** As a user, I want my edited merchant category to be saved to Supabase, so that category selections persist when I edit transactions.

#### Acceptance Criteria

1. WHEN a user edits a transaction's merchant category, THE System SHALL save the MCC object to the merchants table in Supabase
2. WHEN a merchant's MCC is updated, THE System SHALL store both the code and description as JSONB
3. WHEN a transaction is loaded for editing, THE System SHALL retrieve the merchant's MCC from Supabase and display it in the category selector
4. WHEN a merchant has no MCC, THE System SHALL store NULL in the mcc column
5. WHEN the StorageService updates a merchant, THE System SHALL use the upsert operation to handle both new and existing merchants

### Requirement 6

**User Story:** As a user, I want all transaction fields to persist to Supabase when editing, so that no data is lost.

#### Acceptance Criteria

1. WHEN a user edits any transaction field, THE System SHALL persist the change to the corresponding Supabase column
2. WHEN a user edits the reimbursement amount, THE System SHALL save it to the reimbursement_amount column in Supabase
3. WHEN a user edits transaction notes, THE System SHALL save them to the notes column in Supabase
4. WHEN a user edits the transaction date, THE System SHALL save it to the date column in Supabase
5. WHEN a user edits the transaction amount, THE System SHALL save it to the amount column in Supabase

### Requirement 7

**User Story:** As a developer, I want the StorageService updateTransaction method to properly update all transaction fields in Supabase, so that edits are reliably persisted.

#### Acceptance Criteria

1. WHEN updateTransaction is called, THE System SHALL update the base_points field in the Supabase transactions table
2. WHEN updateTransaction is called, THE System SHALL update the bonus_points field in the Supabase transactions table
3. WHEN updateTransaction is called, THE System SHALL update the reimbursement_amount field in the Supabase transactions table
4. WHEN updateTransaction is called with merchant data, THE System SHALL upsert the merchant record with the updated MCC as JSONB
5. WHEN updateTransaction completes, THE System SHALL set the updated_at timestamp to the current time

### Requirement 8

**User Story:** As a user, I want to see error messages when transaction edits fail to save, so that I know to retry or seek help.

#### Acceptance Criteria

1. IF the Supabase update operation fails, THEN THE System SHALL display an error toast notification
2. IF the Supabase update operation fails, THEN THE System SHALL fall back to updating localStorage
3. IF the network connection is lost during save, THEN THE System SHALL display a specific network error message
4. WHEN an error occurs during save, THE System SHALL log the error details to the console for debugging
5. WHEN falling back to localStorage, THE System SHALL notify the user that changes are saved locally only
