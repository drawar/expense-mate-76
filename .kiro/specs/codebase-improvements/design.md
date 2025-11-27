# Design Document

## Overview

This design addresses critical issues in a personal finance application's reward
rules management system and proposes two new features for spending optimization
and multi-currency reward tracking. The application is built with React,
TypeScript, and Supabase, and currently suffers from persistence failures in the
reward rules system.

### Current Issues

1. **Reward Rules Persistence Failure**: Reward rules appear to save in the UI
   but don't persist to Supabase
2. **Inconsistent Card Type ID Generation**: Different code paths generate card
   type IDs differently
3. **Type Mapping Issues**: Mismatches between database schema and application
   types
4. **Singleton Pattern Problems**: RuleRepository initialization and lifecycle
   issues
5. **Silent Failures**: Read-only mode flag and missing error handling

### Proposed Enhancements

1. **Spending Optimization Engine**: Analyzes transaction history to recommend
   better payment methods
2. **Multi-Currency Reward Tracker**: Tracks balances across different loyalty
   programs

## Architecture

### Current Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         React UI Layer                       │
│  ┌──────────────────┐  ┌──────────────────┐                │
│  │ PaymentMethods   │  │ RewardRuleManager│                │
│  │ Page             │  │ Component        │                │
│  └────────┬─────────┘  └────────┬─────────┘                │
└───────────┼────────────────────┼──────────────────────────┘
            │                    │
            ▼                    ▼
┌─────────────────────────────────────────────────────────────┐
│                      Service Layer                           │
│  ┌──────────────────┐  ┌──────────────────┐                │
│  │ StorageService   │  │ RewardService    │                │
│  └────────┬─────────┘  └────────┬─────────┘                │
└───────────┼────────────────────┼──────────────────────────┘
            │                    │
            ▼                    ▼
┌─────────────────────────────────────────────────────────────┐
│                    Repository Layer                          │
│  ┌──────────────────┐  ┌──────────────────┐                │
│  │ RuleRepository   │  │ (Singleton)      │                │
│  └────────┬─────────┘  └──────────────────┘                │
└───────────┼──────────────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Supabase Backend                          │
│  ┌──────────────────┐  ┌──────────────────┐                │
│  │ reward_rules     │  │ payment_methods  │                │
│  │ table            │  │ table            │                │
│  └──────────────────┘  └──────────────────┘                │
└─────────────────────────────────────────────────────────────┘
```

### Proposed Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         React UI Layer                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐ │
│  │ Payment      │  │ Reward Rule  │  │ Optimization Dashboard   │ │
│  │ Methods Page │  │ Manager      │  │ Component                │ │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────────────────┘ │
└─────────┼──────────────────┼──────────────────┼─────────────────────┘
          │                  │                  │
          ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      Service Layer                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐ │
│  │ Storage      │  │ Reward       │  │ Optimization             │ │
│  │ Service      │  │ Service      │  │ Service                  │ │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────────────────┘ │
│         │                  │                  │                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │              CardTypeIdService (NEW)                         │  │
│  │              Centralized ID generation                       │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────┼──────────────────┼──────────────────┼─────────────────────┘
          │                  │                  │
          ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    Repository Layer                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐ │
│  │ Rule         │  │ Transaction  │  │ RewardBalance            │ │
│  │ Repository   │  │ Repository   │  │ Repository (NEW)         │ │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────────────────┘ │
└─────────┼──────────────────┼──────────────────┼─────────────────────┘
          │                  │                  │
          ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    Supabase Backend                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐ │
│  │ reward_rules │  │ transactions │  │ reward_balances (NEW)    │ │
│  └──────────────┘  └──────────────┘  └──────────────────────────┘ │
│  ┌──────────────┐  ┌──────────────┐                                │
│  │ payment_     │  │ optimization_│                                │
│  │ methods      │  │ preferences  │                                │
│  └──────────────┘  └──────────────┘                                │
└─────────────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. CardTypeIdService (NEW)

Centralized service for generating consistent card type IDs.

```typescript
interface CardTypeIdService {
  /**
   * Generate a card type ID from payment method properties
   */
  generateCardTypeId(issuer: string, name: string): string;

  /**
   * Generate a card type ID from a payment method object
   */
  generateCardTypeIdFromPaymentMethod(paymentMethod: PaymentMethod): string;

  /**
   * Validate a card type ID format
   */
  isValidCardTypeId(cardTypeId: string): boolean;
}
```

### 2. Enhanced RuleRepository

Fixed repository with proper error handling and persistence verification.

```typescript
interface RuleRepository {
  /**
   * Find rules applicable to a transaction
   */
  findApplicableRules(input: CalculationInput): Promise<RewardRule[]>;

  /**
   * Get all rules for a specific card type
   */
  getRulesForCardType(cardTypeId: string): Promise<RewardRule[]>;

  /**
   * Create a new reward rule
   * @throws {RepositoryError} if operation fails
   */
  createRule(ruleData: CreateRuleInput): Promise<RewardRule>;

  /**
   * Update an existing reward rule
   * @throws {RepositoryError} if operation fails
   */
  updateRule(rule: RewardRule): Promise<void>;

  /**
   * Delete a reward rule
   * @throws {RepositoryError} if operation fails
   */
  deleteRule(ruleId: string): Promise<void>;

  /**
   * Verify database connection and authentication
   */
  verifyConnection(): Promise<boolean>;
}
```

### 3. OptimizationService (NEW)

Service for analyzing spending patterns and recommending optimizations.

```typescript
interface OptimizationService {
  /**
   * Analyze spending history and identify optimization opportunities
   */
  analyzeSpending(
    transactions: Transaction[],
    paymentMethods: PaymentMethod[],
    preferences: OptimizationPreferences
  ): Promise<OptimizationReport>;

  /**
   * Compare payment methods for a specific transaction
   */
  comparePaymentMethods(
    transaction: Transaction,
    paymentMethods: PaymentMethod[]
  ): Promise<PaymentMethodComparison[]>;

  /**
   * Calculate potential savings by switching payment methods
   */
  calculatePotentialSavings(
    transactions: Transaction[],
    currentMethod: PaymentMethod,
    recommendedMethod: PaymentMethod
  ): Promise<SavingsProjection>;
}

interface OptimizationReport {
  opportunities: OptimizationOpportunity[];
  totalPotentialSavings: number;
  totalPotentialRewards: number;
  recommendations: Recommendation[];
}

interface OptimizationOpportunity {
  category: string;
  currentMethod: PaymentMethod;
  recommendedMethod: PaymentMethod;
  transactionCount: number;
  potentialSavings: number;
  potentialAdditionalRewards: number;
  reason: string;
}
```

### 4. RewardBalanceService (NEW)

Service for tracking multi-currency reward balances.

```typescript
interface RewardBalanceService {
  /**
   * Get current balance for a specific reward currency
   */
  getBalance(currency: string): Promise<number>;

  /**
   * Get all reward balances
   */
  getAllBalances(): Promise<RewardBalance[]>;

  /**
   * Add points to a balance (from transaction)
   */
  addPoints(
    currency: string,
    points: number,
    transactionId: string
  ): Promise<void>;

  /**
   * Subtract points from a balance (redemption)
   */
  redeemPoints(
    currency: string,
    points: number,
    description: string
  ): Promise<void>;

  /**
   * Manual adjustment to balance
   */
  adjustBalance(
    currency: string,
    points: number,
    reason: string
  ): Promise<void>;

  /**
   * Get total value across all currencies in a common currency
   */
  getTotalValue(targetCurrency: string): Promise<number>;
}

interface RewardBalance {
  currency: string;
  balance: number;
  lastUpdated: Date;
  equivalentValue?: number; // in user's preferred currency
}
```

## Data Models

### Existing Models (Enhanced)

```typescript
// Enhanced RewardRule with better type safety
interface RewardRule {
  id: string;
  cardTypeId: string; // Generated by CardTypeIdService
  name: string;
  description: string;
  enabled: boolean;
  priority: number;
  conditions: RuleCondition[];
  reward: RewardConfiguration;
  createdAt: Date;
  updatedAt: Date;
}

// Database representation
interface DbRewardRule {
  id: string;
  card_type_id: string;
  name: string;
  description: string | null;
  enabled: boolean | null;
  priority: number | null;
  conditions: Json | null;
  bonus_tiers: Json | null;
  monthly_bonus_cap: number | null;
  min_spend: number | null;
  max_bonus_per_transaction: number | null;
  qualifying_period_days: number | null;
  excluded_categories: string[] | null;
  included_categories: string[] | null;
  excluded_merchants: string[] | null;
  included_merchants: string[] | null;
  created_at: string | null;
  updated_at: string | null;
}
```

### New Models

```typescript
// Reward balance tracking
interface RewardBalanceRecord {
  id: string;
  userId: string;
  currency: string; // e.g., "aeroplan", "krisflyer", "asiamiles"
  balance: number;
  lastUpdated: Date;
  createdAt: Date;
}

// Database representation
interface DbRewardBalance {
  id: string;
  user_id: string;
  currency: string;
  balance: number;
  last_updated: string;
  created_at: string;
}

// Balance transaction history
interface BalanceTransaction {
  id: string;
  balanceId: string;
  type: "earn" | "redeem" | "adjust";
  amount: number;
  description: string;
  transactionId?: string; // Link to original transaction if applicable
  createdAt: Date;
}

// Optimization preferences
interface OptimizationPreferences {
  priority: "rewards" | "cashback" | "fees" | "balanced";
  preferredRewardCurrencies?: string[];
  minimumSavingsThreshold?: number; // Don't show recommendations below this
  excludePaymentMethods?: string[]; // Payment methods to exclude from recommendations
}

// Database representation
interface DbOptimizationPreferences {
  id: string;
  user_id: string;
  priority: string;
  preferred_reward_currencies: string[] | null;
  minimum_savings_threshold: number | null;
  exclude_payment_methods: string[] | null;
  created_at: string;
  updated_at: string;
}
```

## Correctness Properties

_A property is a characteristic or behavior that should hold true across all
valid executions of a system-essentially, a formal statement about what the
system should do. Properties serve as the bridge between human-readable
specifications and machine-verifiable correctness guarantees._

### Property 1: Reward rule persistence round-trip

_For any_ reward rule created through the UI, saving then reloading the rule
should produce an equivalent rule with all fields preserved. **Validates:
Requirements 1.2, 1.3, 1.5**

### Property 2: Card type ID consistency

_For any_ payment method with the same issuer and name, the card type ID
generated during creation should match the ID generated during rule queries.
**Validates: Requirements 2.1, 2.2**

### Property 3: Database type mapping preservation

_For any_ reward rule, mapping from application type to database type and back
should preserve all data without loss. **Validates: Requirements 4.1, 4.2**

### Property 4: Rule deletion persistence

_For any_ reward rule that is deleted, the rule should not appear in subsequent
queries after page refresh. **Validates: Requirements 1.4**

### Property 5: Repository singleton consistency

_For any_ two accesses to the RuleRepository, they should return the same
instance. **Validates: Requirements 7.2**

### Property 6: Applicable rules filtering

_For any_ transaction, the RewardService should only return rules where the card
type ID matches the transaction's payment method. **Validates: Requirements
5.1**

### Property 7: Rule priority ordering

_For any_ set of matching rules, they should be applied in ascending priority
order (lower priority number = higher precedence). **Validates: Requirements
5.2**

### Property 8: Condition evaluation completeness

_For any_ rule with multiple conditions, all conditions must evaluate to true
for the rule to be applied. **Validates: Requirements 5.3**

### Property 9: Monthly cap enforcement

_For any_ rule with a monthly cap, the total bonus points awarded in a calendar
month should not exceed the cap value. **Validates: Requirements 5.4**

### Property 10: Points calculation accuracy

_For any_ transaction, the calculated points should equal (amount /
blockSize) \* baseMultiplier + bonusPoints, rounded according to the rounding
strategy. **Validates: Requirements 5.5**

### Property 11: Validation error specificity

_For any_ invalid reward rule input, the validation error should indicate which
specific field is invalid. **Validates: Requirements 6.3**

### Property 12: Required field validation

_For any_ reward rule with missing required fields (name, cardTypeId), the save
operation should be rejected with a validation error. **Validates: Requirements
8.4**

### Property 13: Database operation verification

_For any_ create, update, or delete operation, the RuleRepository should verify
the operation succeeded before returning. **Validates: Requirements 7.5, 7.6**

### Property 14: Authentication verification

_For any_ RuleRepository method call, the Supabase client should be
authenticated before executing the operation. **Validates: Requirements 11.3**

### Property 15: Optimization opportunity identification

_For any_ spending history, if there exists a payment method that would yield
more rewards for a category, the OptimizationService should identify it.
**Validates: Requirements 12.1**

### Property 16: Foreign currency cost comparison

_For any_ foreign currency transaction, the comparison should include exchange
rates and foreign transaction fees for all payment methods. **Validates:
Requirements 12.2**

### Property 17: Optimization recommendation generation

_For any_ identified optimization opportunity, a recommendation should be
generated with projected savings. **Validates: Requirements 12.3**

### Property 18: Reward balance update accuracy

_For any_ transaction that earns points, the corresponding reward currency
balance should increase by exactly the points earned. **Validates: Requirements
13.2**

### Property 19: Redemption balance adjustment

_For any_ points redemption, the reward currency balance should decrease by
exactly the redeemed amount. **Validates: Requirements 13.3**

## Error Handling

### Error Types

```typescript
// Base error class for repository operations
class RepositoryError extends Error {
  constructor(
    message: string,
    public readonly operation: string,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = "RepositoryError";
  }
}

// Specific error types
class AuthenticationError extends RepositoryError {
  constructor(operation: string, cause?: Error) {
    super("User is not authenticated", operation, cause);
    this.name = "AuthenticationError";
  }
}

class ValidationError extends RepositoryError {
  constructor(
    message: string,
    public readonly field: string,
    operation: string
  ) {
    super(message, operation);
    this.name = "ValidationError";
  }
}

class PersistenceError extends RepositoryError {
  constructor(
    message: string,
    operation: string,
    public readonly data?: any,
    cause?: Error
  ) {
    super(message, operation, cause);
    this.name = "PersistenceError";
  }
}
```

### Error Handling Strategy

1. **Repository Layer**: Catch all Supabase errors, wrap them in appropriate
   error types, and rethrow
2. **Service Layer**: Catch repository errors, log them, and either rethrow or
   return error results
3. **UI Layer**: Catch service errors and display user-friendly messages using
   toast notifications

### Logging Strategy

```typescript
interface LogEntry {
  timestamp: Date;
  level: "debug" | "info" | "warn" | "error";
  operation: string;
  message: string;
  data?: any;
  error?: Error;
}

// Log all database operations
logger.info("createRule", "Creating reward rule", { ruleData });
logger.error("createRule", "Failed to create reward rule", { ruleData, error });
```

## Testing Strategy

### Unit Testing

Unit tests will verify specific examples and edge cases:

- **RuleRepository**: Test CRUD operations with mock Supabase client
- **CardTypeIdService**: Test ID generation with various inputs
- **RewardService**: Test calculation logic with specific transaction examples
- **OptimizationService**: Test recommendation logic with sample data
- **Type Mappers**: Test conversion between database and application types

### Property-Based Testing

Property-based tests will verify universal properties using **fast-check**
(TypeScript PBT library):

- Configure each property test to run **minimum 100 iterations**
- Tag each test with format:
  `**Feature: codebase-improvements, Property {number}: {property_text}**`
- Each correctness property will be implemented by a SINGLE property-based test

Example property test structure:

```typescript
import fc from "fast-check";

describe("Reward Rule Persistence", () => {
  it("**Feature: codebase-improvements, Property 1: Reward rule persistence round-trip**", async () => {
    await fc.assert(
      fc.asyncProperty(rewardRuleArbitrary(), async (rule) => {
        const saved = await repository.createRule(rule);
        const loaded = await repository.getRulesForCardType(rule.cardTypeId);
        expect(loaded).toContainEqual(expect.objectContaining(rule));
      }),
      { numRuns: 100 }
    );
  });
});
```

### Integration Testing

Integration tests will verify the complete flow:

- **End-to-end reward rule management**: Create, read, update, delete through UI
- **Reward calculation flow**: Transaction creation → rule matching → points
  calculation → balance update
- **Optimization flow**: Load transactions → analyze → generate recommendations
- **Multi-currency tracking**: Earn points → update balances → redeem points

### Test Coverage Goals

- Minimum 80% code coverage for reward-related modules
- 100% coverage for critical paths (CRUD operations, calculations)
- All edge cases covered (caps, tiers, multiple rules, offline scenarios)

## Implementation Plan Overview

### Phase 1: Fix Reward Rules Persistence (Priority: Critical)

1. Investigate and fix RuleRepository persistence issues
2. Implement CardTypeIdService for consistent ID generation
3. Fix type mapping between database and application
4. Add comprehensive error handling and logging
5. Write property-based tests for persistence

### Phase 2: Code Quality Improvements (Priority: High)

1. Refactor service initialization and dependency injection
2. Implement proper singleton pattern for repositories
3. Add validation and error messages throughout
4. Write unit tests for existing functionality
5. Document all public APIs

### Phase 3: Spending Optimization Feature (Priority: Medium)

1. Design and implement OptimizationService
2. Create optimization analysis algorithms
3. Build UI for viewing recommendations
4. Add user preferences for optimization priorities
5. Write tests for optimization logic

### Phase 4: Multi-Currency Reward Tracking (Priority: Medium)

1. Create reward_balances table in Supabase
2. Implement RewardBalanceService and repository
3. Build UI for viewing and managing balances
4. Integrate with transaction creation flow
5. Add redemption tracking functionality
6. Write tests for balance management

## Database Schema Changes

### New Tables

```sql
-- Reward balances table
CREATE TABLE IF NOT EXISTS reward_balances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  currency text NOT NULL,
  balance numeric NOT NULL DEFAULT 0,
  last_updated timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, currency)
);

-- Balance transaction history
CREATE TABLE IF NOT EXISTS balance_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  balance_id uuid REFERENCES reward_balances(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL CHECK (type IN ('earn', 'redeem', 'adjust')),
  amount numeric NOT NULL,
  description text,
  transaction_id uuid REFERENCES transactions(id) ON DELETE SET NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- Optimization preferences
CREATE TABLE IF NOT EXISTS optimization_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  priority text NOT NULL DEFAULT 'balanced',
  preferred_reward_currencies text[],
  minimum_savings_threshold numeric,
  exclude_payment_methods uuid[],
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE reward_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE balance_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE optimization_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own reward balances"
  ON reward_balances FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own reward balances"
  ON reward_balances FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own balance transactions"
  ON balance_transactions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM reward_balances
    WHERE reward_balances.id = balance_transactions.balance_id
    AND reward_balances.user_id = auth.uid()
  ));

CREATE POLICY "Users can manage their own balance transactions"
  ON balance_transactions FOR ALL
  USING (EXISTS (
    SELECT 1 FROM reward_balances
    WHERE reward_balances.id = balance_transactions.balance_id
    AND reward_balances.user_id = auth.uid()
  ));

CREATE POLICY "Users can view their own optimization preferences"
  ON optimization_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own optimization preferences"
  ON optimization_preferences FOR ALL
  USING (auth.uid() = user_id);
```

## Security Considerations

1. **Row-Level Security**: All new tables have RLS enabled with user-scoped
   policies
2. **Authentication**: All repository operations verify user authentication
   before proceeding
3. **Input Validation**: All user inputs are validated before database
   operations
4. **SQL Injection**: Using Supabase client prevents SQL injection
5. **Data Privacy**: Users can only access their own data through RLS policies

## Performance Considerations

1. **Caching**: Consider caching reward rules in memory since they change
   infrequently
2. **Batch Operations**: Optimize balance updates when processing multiple
   transactions
3. **Indexing**: Add indexes on frequently queried fields (card_type_id,
   user_id, currency)
4. **Query Optimization**: Use Supabase query builder efficiently to minimize
   round trips

## Migration Strategy

1. **Backward Compatibility**: Existing reward rules data structure remains
   unchanged
2. **Gradual Rollout**: New features can be enabled independently
3. **Data Migration**: No migration needed for existing data
4. **Feature Flags**: Consider feature flags for new optimization and tracking
   features

## Code Cleanup Strategy

### Files and Code to Remove

As part of this refactoring, we will identify and remove obsolete code:

1. **Duplicate Type Definitions**: Consolidate type definitions that exist in
   multiple places
2. **Unused Components**: Remove any reward-related components that are not
   being used
3. **Dead Code**: Remove commented-out code and unused functions
4. **Obsolete Utilities**: Remove utility functions that are no longer needed
5. **Redundant Services**: Consolidate services that have overlapping
   responsibilities

### Consolidation Opportunities

1. **Type Mappers**: Create a single, well-tested mapper instead of scattered
   mapping logic
2. **Service Initialization**: Replace multiple singleton patterns with a single
   dependency injection approach
3. **Error Handling**: Replace scattered try-catch blocks with centralized error
   handling
4. **Validation Logic**: Consolidate validation rules into reusable validators

### Refactoring Principles

- **Delete before adding**: Remove obsolete code before implementing new
  features
- **Consolidate duplicates**: Merge duplicate functionality into single,
  well-tested implementations
- **Simplify complexity**: Replace complex patterns with simpler, more
  maintainable solutions
- **Document decisions**: Add comments explaining why code was removed or
  refactored
