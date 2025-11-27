# Error Classes Usage Examples

This document provides examples of how to use the custom error classes in
repository operations.

## Basic Usage

### AuthenticationError

```typescript
import { AuthenticationError } from "./errors";

async function createRule(ruleData: CreateRuleInput): Promise<RewardRule> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new AuthenticationError("createRule");
  }

  // Continue with rule creation...
}
```

### ValidationError

```typescript
import { ValidationError } from "./errors";

async function createRule(ruleData: CreateRuleInput): Promise<RewardRule> {
  if (!ruleData.name || ruleData.name.trim() === "") {
    throw new ValidationError("Rule name is required", "name", "createRule");
  }

  if (!ruleData.cardTypeId) {
    throw new ValidationError(
      "Card type ID is required",
      "cardTypeId",
      "createRule"
    );
  }

  // Continue with rule creation...
}
```

### PersistenceError

```typescript
import { PersistenceError } from "./errors";

async function createRule(ruleData: CreateRuleInput): Promise<RewardRule> {
  try {
    const { data, error } = await supabase
      .from("reward_rules")
      .insert(dbRule)
      .select()
      .single();

    if (error) {
      throw new PersistenceError(
        `Failed to create reward rule: ${error.message}`,
        "createRule",
        ruleData,
        error
      );
    }

    return data;
  } catch (error) {
    if (error instanceof PersistenceError) {
      throw error;
    }

    throw new PersistenceError(
      "Unexpected error during rule creation",
      "createRule",
      ruleData,
      error instanceof Error ? error : undefined
    );
  }
}
```

## Error Handling in UI Components

```typescript
import {
  RepositoryError,
  AuthenticationError,
  ValidationError,
  PersistenceError,
} from "@/core/rewards";
import { toast } from "sonner";

async function handleSaveRule(ruleData: CreateRuleInput) {
  try {
    await ruleRepository.createRule(ruleData);
    toast.success("Rule saved successfully");
  } catch (error) {
    if (error instanceof AuthenticationError) {
      toast.error("Please log in to save rules");
    } else if (error instanceof ValidationError) {
      toast.error(`Validation error: ${error.message} (field: ${error.field})`);
    } else if (error instanceof PersistenceError) {
      toast.error(`Failed to save rule: ${error.message}`);
      console.error("Persistence error details:", {
        operation: error.operation,
        data: error.data,
        cause: error.cause,
      });
    } else if (error instanceof RepositoryError) {
      toast.error(`Repository error: ${error.message}`);
    } else {
      toast.error("An unexpected error occurred");
      console.error("Unexpected error:", error);
    }
  }
}
```

## Logging with Error Context

```typescript
import { logger } from "./logger";
import { PersistenceError } from "./errors";

async function updateRule(rule: RewardRule): Promise<void> {
  logger.info("updateRule", "Updating reward rule", { ruleId: rule.id });

  try {
    const { error } = await supabase
      .from("reward_rules")
      .update(dbRule)
      .eq("id", rule.id);

    if (error) {
      const persistenceError = new PersistenceError(
        `Failed to update reward rule: ${error.message}`,
        "updateRule",
        rule,
        error
      );

      logger.error("updateRule", "Failed to update rule", {
        ruleId: rule.id,
        error: persistenceError,
        cause: error,
      });

      throw persistenceError;
    }

    logger.info("updateRule", "Successfully updated rule", { ruleId: rule.id });
  } catch (error) {
    if (error instanceof PersistenceError) {
      throw error;
    }

    const persistenceError = new PersistenceError(
      "Unexpected error during rule update",
      "updateRule",
      rule,
      error instanceof Error ? error : undefined
    );

    logger.error("updateRule", "Unexpected error", {
      ruleId: rule.id,
      error: persistenceError,
    });

    throw persistenceError;
  }
}
```

## Benefits

1. **Type Safety**: TypeScript can distinguish between different error types
2. **Structured Information**: Each error carries relevant context (operation,
   field, data, cause)
3. **Better Debugging**: Stack traces and cause chains help identify root causes
4. **User-Friendly Messages**: UI can provide specific feedback based on error
   type
5. **Consistent Handling**: All repository operations use the same error types
