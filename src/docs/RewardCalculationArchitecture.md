# Reward Calculation Architecture

This document outlines the architecture of the reward points calculation system in Expense Mate.

## Key Components

### 1. Calculation Layer (Business Logic)

- **BaseCalculator**: Abstract class defining the foundation for all reward calculations
- **RuleBasedCalculator**: Implementation that calculates rewards based on card rules
- **CalculatorRegistry**: Maintains calculator instances and matches them to payment methods

### 2. Service Layer

- **RewardCalculationService**: Centralized service that delegates to the appropriate calculator
- **BonusPointsTrackingService**: Tracks used bonus points to enforce monthly caps
- **CardRuleService**: Manages user-editable reward rules for different card types

### 3. Adapter Layer

- **rewardCalculationAdapter**: Provides standardized methods for using the calculation system
- Handles sync/async calculations and error handling

### 4. UI Layer

- **useRewardPoints**: React hook that provides reward calculation to UI components
- **PointsDisplay**: Component that displays reward calculations from the hook
- **GenericPointsCard**: UI representation of reward points

## Data Flow

1. User edits reward rules through card management UI
2. Rules are stored in database via CardRuleService
3. RuleBasedCalculator retrieves rules from CardRuleService
4. RewardCalculationService uses CalculatorRegistry to get the appropriate calculator
5. UI components use useRewardPoints hook to access calculations
6. PointsDisplay renders the results consistently

## User-Editable Rules

The system maintains a tight connection between card UI components and their calculation logic through CardRuleService. When users modify card rules through the PaymentMethodCard component:

1. Changes are saved to the database via CardRuleService
2. RuleBasedCalculator fetches these updated rules when performing calculations
3. All calculations automatically reflect the user-defined rules

## Single Source of Truth

This architecture establishes the calculator layer as the single source of truth for all reward calculations. The key benefits include:

1. **Consistency**: The same calculation logic is used across all parts of the application
2. **Maintainability**: Card-specific logic is centralized in calculator implementations
3. **Configurability**: Rules can be edited without changing code
4. **Testability**: Business logic can be tested independently of UI components

## Adding New Cards

To add a new card type to the system:

1. Define card-specific rules in the database or add them to the fallback rules in CardRuleService
2. Register the card type in CalculatorRegistry (if needed)
3. Update the card registry UI components if needed

The calculation will automatically work for the new card without any changes to the core calculation system.

## Debugging Tips

If you encounter inconsistencies in reward calculations:

1. Check if the appropriate calculator is being used in CalculatorRegistry
2. Verify that CardRuleService has the correct rules for the card
3. Ensure that BonusPointsTrackingService correctly tracks used bonus points
4. Check that UI components are using the useRewardPoints hook properly