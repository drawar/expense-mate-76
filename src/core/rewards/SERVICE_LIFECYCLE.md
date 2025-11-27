# Reward System Service Lifecycle

This document describes the initialization and lifecycle of services in the
reward system.

## Architecture Overview

The reward system follows a **singleton pattern** for all core services to
ensure:

- Single source of truth for state
- Consistent behavior across the application
- Efficient resource usage
- Simplified dependency management

## Service Initialization Order

Services must be initialized in the following order:

### 1. RuleRepository (Required First)

**Location**: `src/core/rewards/RuleRepository.ts`

The RuleRepository must be initialized before any other reward services because
it provides access to reward rules stored in the database.

```typescript
import { initializeRuleRepository } from "@/core/rewards/RuleRepository";
import { supabase } from "@/integrations/supabase/client";

// Initialize in App.tsx on mount
const repository = initializeRuleRepository(supabase);
```

**Initialization Pattern**:

- Uses explicit initialization function:
  `initializeRuleRepository(supabaseClient)`
- Requires Supabase client to be passed in
- Throws error if accessed before initialization
- Returns singleton instance

**Why explicit initialization?**

- Requires external dependency (Supabase client)
- Needs to be initialized after authentication
- Must be ready before reward calculations

### 2. Auto-Initialized Services (Lazy)

The following services use lazy initialization and don't require explicit setup:

#### CardTypeIdService

**Location**: `src/core/rewards/CardTypeIdService.ts`

Provides consistent card type ID generation across the application.

```typescript
import { cardTypeIdService } from "@/core/rewards/CardTypeIdService";

// Use directly - no initialization needed
const cardTypeId = cardTypeIdService.generateCardTypeId(issuer, name);
```

**Initialization Pattern**:

- Auto-initialized on first import
- No external dependencies
- Stateless service

#### BonusPointsTracker

**Location**: `src/core/rewards/BonusPointsTracker.ts`

Tracks monthly bonus points usage for enforcing caps.

```typescript
import { bonusPointsTracker } from "@/core/rewards/BonusPointsTracker";

// Use directly - no initialization needed
const used = await bonusPointsTracker.getUsedBonusPoints(
  cardTypeId,
  month,
  year
);
```

**Initialization Pattern**:

- Auto-initialized on first import
- Maintains in-memory cache
- Persists to localStorage

#### MonthlySpendingTracker

**Location**: `src/core/rewards/MonthlySpendingTracker.ts`

Tracks monthly spending for minimum spend requirements.

```typescript
import { monthlySpendingTracker } from "@/core/rewards/MonthlySpendingTracker";

// Use directly - no initialization needed
const spend = await monthlySpendingTracker.getMonthlySpend(
  cardTypeId,
  month,
  year
);
```

**Initialization Pattern**:

- Auto-initialized on first import
- Maintains in-memory cache
- Persists to localStorage

#### CardRegistry

**Location**: `src/core/rewards/CardRegistry.ts`

Registry of card types and their default rules.

```typescript
import { cardRegistry } from "@/core/rewards/CardRegistry";

// Use directly - no initialization needed
const cardType = cardRegistry.getCardType(cardTypeId);
```

**Initialization Pattern**:

- Auto-initialized on first import
- Maintains in-memory registry
- Stateful but self-contained

#### RewardService

**Location**: `src/core/rewards/RewardService.ts`

Main service for calculating reward points.

```typescript
import { rewardService } from "@/core/rewards/RewardService";

// Use directly - depends on RuleRepository being initialized
const result = await rewardService.calculateRewards(input);
```

**Initialization Pattern**:

- Auto-initialized on first import
- Depends on RuleRepository being initialized
- Coordinates other services

## Singleton Pattern Implementation

All services follow this consistent singleton pattern:

```typescript
export class ServiceName {
  private static instance: ServiceName;

  private constructor() {
    // Private constructor prevents direct instantiation
  }

  public static getInstance(): ServiceName {
    if (!ServiceName.instance) {
      ServiceName.instance = new ServiceName();
    }
    return ServiceName.instance;
  }
}

// Export singleton instance for convenience
export const serviceName = ServiceName.getInstance();
```

**Exception**: RuleRepository uses explicit initialization:

```typescript
export class RuleRepository {
  private static instance: RuleRepository;

  private constructor(supabaseClient: SupabaseClient) {
    // Requires external dependency
  }

  public static getInstance(): RuleRepository {
    if (!RuleRepository.instance) {
      throw new Error("RuleRepository not initialized");
    }
    return RuleRepository.instance;
  }

  private static setInstance(client: SupabaseClient): RuleRepository {
    if (!RuleRepository.instance) {
      RuleRepository.instance = new RuleRepository(client);
    }
    return RuleRepository.instance;
  }
}

export const initializeRuleRepository = (client: SupabaseClient) => {
  return RuleRepository["setInstance"](client);
};
```

## Application Initialization

In `src/App.tsx`:

```typescript
useEffect(() => {
  const initializeServices = async () => {
    try {
      // 1. Initialize RuleRepository first
      await initializeRuleRepository(supabase);

      // 2. Other services auto-initialize on first use
      // No additional setup needed

      console.log("Reward system initialized");
    } catch (error) {
      console.error("Failed to initialize reward system:", error);
      toast.error("Failed to initialize reward system");
    }
  };

  initializeServices();
}, []);
```

## Service Dependencies

```
RuleRepository (explicit init)
    ↓
RewardService (auto-init)
    ↓
    ├── BonusPointsTracker (auto-init)
    ├── MonthlySpendingTracker (auto-init)
    ├── CardRegistry (auto-init)
    └── CardTypeIdService (auto-init)
```

## Testing

For testing, services can be reset:

```typescript
// Reset singleton for testing
RuleRepository.resetInstance();
BonusPointsTracker.resetInstance();
MonthlySpendingTracker.resetInstance();
```

## Best Practices

1. **Always initialize RuleRepository first** in App.tsx
2. **Import singleton instances** rather than calling getInstance()
3. **Don't create new instances** - use exported singletons
4. **Handle initialization errors** gracefully with user feedback
5. **Reset instances in tests** to ensure isolation

## Common Pitfalls

❌ **Don't**: Try to use RuleRepository before initialization

```typescript
// This will throw an error
const repo = getRuleRepository(); // Error: not initialized
```

✅ **Do**: Initialize in App.tsx first

```typescript
// In App.tsx
initializeRuleRepository(supabase);

// Later in components
const repo = getRuleRepository(); // Works!
```

❌ **Don't**: Create new instances

```typescript
const tracker = new BonusPointsTracker(); // Error: constructor is private
```

✅ **Do**: Use exported singleton

```typescript
import { bonusPointsTracker } from "@/core/rewards/BonusPointsTracker";
```

## Migration Notes

If you need to change the initialization pattern:

1. Update the service class
2. Update exports in `src/core/rewards/index.ts`
3. Update initialization in `src/App.tsx`
4. Update all imports throughout the codebase
5. Update this documentation
