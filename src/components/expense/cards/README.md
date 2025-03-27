# Credit Card Reward System Architecture

This document outlines the object-oriented architecture for the credit card reward system, designed to be modular, extensible, and user-configurable.

## Architecture Overview

The system is built around an abstract `BaseRewardCard` class that defines common functionality and interfaces for all credit card reward calculations. Each specific card type extends this base class and implements its unique logic.

### Key Components

1. **BaseRewardCard**: Abstract class that provides a standardized structure for reward cards
2. **RewardRule**: Interface for defining eligibility criteria and point calculations
3. **BonusPointsCap**: Interface for managing bonus point caps with different strategies
4. **RewardRuleFactory**: Factory for creating common rule types
5. **Card Implementations**: Concrete implementations for specific cards
6. **RewardRuleEditor**: UI component for user-customization of reward rules

## How It Works

### Base Card Structure

The `BaseRewardCard` abstract class requires each card to implement:

- `calculateRoundedAmount`: How the transaction amount is rounded (e.g., to nearest dollar, nearest $5)
- `calculateBasePoints`: Calculation of base points for a given amount
- `getBonusPointsEligibility`: Determines if a transaction is eligible for bonus points
- `calculateBonusPoints`: Calculation of bonus points for a given amount
- `getBonusPointsCap`: Returns the cap implementation for the card

The base class handles the common flow:
1. Round transaction amount according to card rules
2. Calculate base points
3. Check bonus point eligibility
4. Calculate bonus points if eligible
5. Apply bonus point cap
6. Calculate remaining bonus points
7. Render the standardized UI

### Rule Composition

The system enables flexible rule composition through the `RewardRule` interface and `RewardRuleFactory`:

```typescript
// Create a compound rule for online shopping at eligible merchants
const onlineShoppingRule = RewardRuleFactory.createCompoundRule([
  RewardRuleFactory.createOnlineTransactionRule(),
  RewardRuleFactory.createMCCInclusionRule(['5311', '5411', '5691'])
]);

// Create an "any of these" rule
const eligibilityRule = RewardRuleFactory.createAnyRule([
  RewardRuleFactory.createContactlessTransactionRule(),
  onlineShoppingRule
]);
```

### Different Cap Strategies

The system supports different bonus point capping strategies:

1. **MonthlyCap**: Standard monthly cap on bonus points
2. **CombinedPointsCap**: Special cap for cards like UOB Signature that have a combined total cap

## Modularization Benefits

This architecture provides several key benefits:

1. **Code Reuse**: Common logic is defined once in the base class
2. **Reduced Duplication**: Shared rules and calculations are centralized
3. **Consistency**: All cards follow the same structure and render similar UIs
4. **Extensibility**: Adding new card types only requires extending the base class
5. **Testability**: Each component can be tested in isolation
6. **User Customization**: Rules can be edited through the UI

## User-Editable Reward Rules

The architecture supports user-editable reward rules through the `RewardRuleEditor` component:

1. Users can create and modify rule sets through a friendly UI
2. Rule configurations include:
   - Base and bonus point rates
   - Monthly caps
   - Eligibility criteria (online, contactless)
   - Included/excluded MCC codes
   - Spending thresholds
   - Currency restrictions

Implementation options:
1. **Admin Panel**: Allow administrators to create and modify card rules
2. **User Preferences**: Let users create personal reward rules for their own cards
3. **Card Management**: Enable users to add custom cards with their own rules

## Card Implementation Examples

### Citibank Rewards Card

```typescript
export class CitibankRewardsCardRefactored extends BaseRewardCard<CitibankRewardsCardProps> {
  // Card-specific MCC codes
  private readonly exclusionMCCs = ['4511', '7512', '7011', /* ... */];
  private readonly inclusionMCCs = ['5311', '5611', '5621', /* ... */];
  
  // Eligibility rule composition
  private readonly bonusEligibilityRule = RewardRuleFactory.createAnyRule([
    // Online shopping excluding certain categories
    RewardRuleFactory.createCompoundRule([
      RewardRuleFactory.createOnlineTransactionRule(),
      RewardRuleFactory.createMCCExclusionRule(this.exclusionMCCs)
    ]),
    // Shopping at included merchants regardless of online status
    RewardRuleFactory.createMCCInclusionRule(this.inclusionMCCs)
  ]);
  
  // Implementation of abstract methods
  calculateRoundedAmount(amount: number): number {
    return Math.floor(amount); // Round down to nearest dollar
  }
  
  calculateBasePoints(roundedAmount: number): number {
    return Math.round(roundedAmount * 0.4); // 0.4 points per dollar
  }
  
  getBonusPointsEligibility(props: CitibankRewardsCardProps): boolean {
    return this.bonusEligibilityRule.isEligible(props);
  }
  
  calculateBonusPoints(roundedAmount: number): number {
    return Math.round(roundedAmount * 3.6); // 3.6 additional points per dollar
  }
  
  getBonusPointsCap(): MonthlyCap {
    return new MonthlyCap(4000); // 4000 points monthly cap
  }
}
```

## Further Enhancements

1. **Dynamic Rule Loading**: Load card rules from a database or API
2. **Reward Simulation**: Allow users to simulate rewards for different spending patterns
3. **Rule Templates**: Provide pre-defined templates for common reward structures
4. **Category Learning**: Use machine learning to suggest MCC codes for different spending categories
5. **Reward Optimization**: Suggest the best card to use for a given transaction