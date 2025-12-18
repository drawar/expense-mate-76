# Requirements Document

## Introduction

This document specifies the requirements for a Card Optimizer Simulator feature that helps users determine which credit card will yield the highest rewards for a given expense. Unlike the expense logging feature, this simulator does not record transactions but instead calculates and compares potential rewards across all active payment methods, converting different reward currencies to a common miles currency for meaningful comparison.

## Glossary

- **Card Optimizer Simulator**: A tool that calculates and compares potential rewards across all active payment methods for a hypothetical transaction
- **Reward Currency**: The points or miles currency specific to a credit card program (e.g., Citi ThankYou Points, Membership Rewards Points)
- **Miles Currency**: A transferable airline or hotel loyalty program currency used as a common denominator for comparison (e.g., KrisFlyer, Asia Miles, Avios, Flying Blue Miles)
- **Conversion Rate**: The ratio at which a reward currency converts to a specific miles currency
- **Active Payment Method**: A credit card that is enabled and available for use in the system
- **Transaction Details**: The merchant, amount, category, and transaction characteristics that determine reward eligibility
- **Reward Calculation**: The process of determining points earned based on card rules, transaction details, and spending patterns

## Requirements

### Requirement 1

**User Story:** As a user, I want to input transaction details without selecting a payment method, so that I can simulate rewards across all my cards.

#### Acceptance Criteria

1. WHEN a user accesses the simulator page THEN the system SHALL display a form with merchant details and transaction details sections
2. WHEN a user views the form THEN the system SHALL exclude payment method selection fields
3. WHEN a user enters transaction details THEN the system SHALL accept merchant name, amount, currency, merchant category, online status, and contactless status
4. WHEN a user enters a merchant name THEN the system SHALL provide merchant address autocomplete functionality
5. WHEN a user selects a merchant category THEN the system SHALL populate the MCC code for reward calculations

### Requirement 2

**User Story:** As a user, I want to see reward calculations for all my active cards, so that I can compare earning potential across my portfolio.

#### Acceptance Criteria

1. WHEN transaction details are entered THEN the system SHALL calculate rewards for all active payment methods
2. WHEN calculating rewards THEN the system SHALL use the same reward calculation engine as the expense logging feature
3. WHEN a payment method has no applicable reward rules THEN the system SHALL display zero rewards for that card
4. WHEN reward calculation fails for a card THEN the system SHALL display an error message for that specific card without blocking other calculations
5. WHEN all calculations complete THEN the system SHALL display results for each active payment method

### Requirement 3

**User Story:** As a user, I want to convert different reward currencies to a common miles currency, so that I can meaningfully compare rewards across different card programs.

#### Acceptance Criteria

1. WHEN viewing reward results THEN the system SHALL provide a miles currency selector with options including KrisFlyer, Asia Miles, Avios, and Flying Blue Miles
2. WHEN a user selects a miles currency THEN the system SHALL convert all reward currencies to the selected miles currency using stored conversion rates
3. WHEN a conversion rate is not defined for a reward currency THEN the system SHALL display the original reward currency value with a notation indicating no conversion available
4. WHEN conversion rates are applied THEN the system SHALL display both the original reward points and the converted miles value
5. WHEN the user changes the selected miles currency THEN the system SHALL recalculate and update all converted values immediately

### Requirement 4

**User Story:** As a user, I want to see cards ranked by earning potential in a horizontal bar chart, so that I can quickly identify the optimal payment method.

#### Acceptance Criteria

1. WHEN reward calculations complete THEN the system SHALL display results as a horizontal bar chart with bars arranged from longest to shortest
2. WHEN multiple cards have the same converted miles value THEN the system SHALL maintain their relative order based on card name alphabetically
3. WHEN a card has no conversion rate available THEN the system SHALL display a faded row with "No conversion available" text and place it at the end of the ranking
4. WHEN displaying the top-ranked card THEN the system SHALL apply a moss-green glow ring around the entire row and display a "#1 Best Option" badge
5. WHEN the miles currency selection changes THEN the system SHALL re-rank all cards and re-animate the bars based on the new converted values

### Requirement 5

**User Story:** As a user, I want to see detailed reward breakdowns for each card via hover tooltips, so that I understand how the rewards were calculated.

#### Acceptance Criteria

1. WHEN displaying a bar chart row THEN the system SHALL show the card name and issuer on the left, a horizontal bar in the center, and the converted miles value on the right
2. WHEN a user hovers over a bar THEN the system SHALL display a tooltip containing base points, bonus points, total points in native currency, reward currency name, conversion rate, tier information, and cap status
3. WHEN a conversion rate is available THEN the system SHALL display the converted miles value prominently on the right side of the bar
4. WHEN monthly caps apply THEN the system SHALL include remaining bonus points capacity in the hover tooltip
5. WHEN a minimum spend requirement is not met THEN the system SHALL include a message in the hover tooltip indicating the requirement and current status

### Requirement 6

**User Story:** As a user, I want to manage conversion rates between reward currencies and miles programs, so that the simulator provides accurate comparisons.

#### Acceptance Criteria

1. WHEN a user accesses conversion rate management THEN the system SHALL display a table of reward currencies and their conversion rates to each miles program
2. WHEN a user edits a conversion rate THEN the system SHALL validate that the rate is a positive number
3. WHEN a user saves conversion rate changes THEN the system SHALL persist the rates to the database
4. WHEN conversion rates are updated THEN the system SHALL immediately reflect changes in active simulator calculations
5. WHEN a new reward currency is added to the system THEN the system SHALL initialize conversion rates to undefined for all miles programs

### Requirement 7

**User Story:** As a user, I want the simulator to consider my current monthly spending, so that reward calculations account for tiered bonuses and spending caps.

#### Acceptance Criteria

1. WHEN calculating rewards THEN the system SHALL retrieve current monthly spending for each payment method
2. WHEN a card has tiered rewards based on monthly spend THEN the system SHALL apply the appropriate tier based on current spending plus the simulated transaction
3. WHEN a card has monthly bonus caps THEN the system SHALL calculate remaining capacity and apply it to the simulated transaction
4. WHEN monthly spending data is unavailable THEN the system SHALL calculate rewards assuming zero prior spending for the month
5. WHEN displaying results with spending-dependent rewards THEN the system SHALL indicate which tier or cap status was applied

### Requirement 8

**User Story:** As a user, I want to simulate foreign currency transactions, so that I can optimize card selection for international purchases.

#### Acceptance Criteria

1. WHEN entering transaction details THEN the system SHALL allow selection of any supported currency
2. WHEN a foreign currency is selected THEN the system SHALL provide a converted amount field for the card's billing currency
3. WHEN calculating rewards THEN the system SHALL use the converted amount if provided, otherwise use the original transaction amount
4. WHEN displaying results THEN the system SHALL show both the original transaction amount and currency alongside the converted amount
5. WHEN a converted amount is not provided for a foreign currency transaction THEN the system SHALL display a warning that conversion rates may affect actual rewards

### Requirement 9

**User Story:** As a system, I want to reuse existing form components and validation logic, so that the simulator maintains consistency with the expense logging feature.

#### Acceptance Criteria

1. WHEN rendering the merchant details section THEN the system SHALL use the same MerchantDetailsSection component as the expense form
2. WHEN rendering the transaction details section THEN the system SHALL use the same TransactionDetailsSection component as the expense form
3. WHEN validating form inputs THEN the system SHALL apply the same validation rules as the expense form
4. WHEN handling merchant address selection THEN the system SHALL use the same autocomplete functionality as the expense form
5. WHEN handling MCC selection THEN the system SHALL use the same category selector component as the expense form

### Requirement 10

**User Story:** As a user, I want the simulator to be accessible from the main navigation, so that I can easily access the optimization tool.

#### Acceptance Criteria

1. WHEN viewing the application navigation THEN the system SHALL display a link to the Card Optimizer Simulator
2. WHEN a user clicks the simulator link THEN the system SHALL navigate to the simulator page
3. WHEN the simulator page loads THEN the system SHALL initialize the reward calculation system
4. WHEN initialization fails THEN the system SHALL display an error message with retry options
5. WHEN no active payment methods exist THEN the system SHALL display a message prompting the user to add payment methods

### Requirement 11

**User Story:** As a user, I want the simulator to have a visually appealing and consistent design, so that the interface is pleasant to use and easy to understand.

#### Acceptance Criteria

1. WHEN viewing the chart panel THEN the system SHALL use a dark slate background (#121417) in dark mode or white background in light mode
2. WHEN displaying horizontal bars THEN the system SHALL fill them with a moss-green gradient (#a3b18a)
3. WHEN displaying the top-ranked card THEN the system SHALL apply a moss-green glow effect around the entire row and make the bar slightly thicker
4. WHEN displaying text THEN the system SHALL use pure white (#f1f3f5) in dark mode or dark text in light mode for optimal contrast
5. WHEN a user hovers over a bar THEN the system SHALL display a smooth fade-in animation for the tooltip
6. WHEN bars are rendered or re-ranked THEN the system SHALL animate the bar width changes with a smooth transition
7. WHEN displaying the chart footer THEN the system SHALL show the disclaimer text "This tool simulates rewards only — no transaction will be saved"
