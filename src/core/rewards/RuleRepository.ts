import { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { RewardRule, DbRewardRule, CalculationInput } from "./types";
import { RuleMapper } from "./RuleMapper";
import { logger } from "./logger";
import {
  RepositoryError,
  AuthenticationError,
  ValidationError,
  PersistenceError,
} from "./errors";

export class RuleRepository {
  private supabase: SupabaseClient;
  private static instance: RuleRepository;
  private ruleMapper: RuleMapper;

  // Caching infrastructure for rules
  private rulesCache: Map<string, RewardRule[]> = new Map();
  private ruleCacheTimestamps: Map<string, number> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  private constructor(supabaseClient: SupabaseClient) {
    this.supabase = supabaseClient;
    this.ruleMapper = new RuleMapper();
    logger.info("constructor", "RuleRepository instance created", {
      hasSupabaseClient: !!supabaseClient,
    });
  }

  /**
   * Check if cache is valid for a specific cardTypeId
   */
  private isCacheValid(cardTypeId: string): boolean {
    const timestamp = this.ruleCacheTimestamps.get(cardTypeId);
    return timestamp !== undefined && Date.now() - timestamp < this.CACHE_TTL;
  }

  /**
   * Invalidate cache for a specific cardTypeId or all caches
   */
  public invalidateCache(cardTypeId?: string): void {
    if (cardTypeId) {
      this.rulesCache.delete(cardTypeId);
      this.ruleCacheTimestamps.delete(cardTypeId);
      logger.debug("invalidateCache", "Cache invalidated for cardTypeId", {
        cardTypeId,
      });
    } else {
      this.rulesCache.clear();
      this.ruleCacheTimestamps.clear();
      logger.debug("invalidateCache", "All caches invalidated");
    }
  }

  /**
   * Verify that the user is authenticated before performing operations
   * @throws {AuthenticationError} if user is not authenticated
   */
  private async ensureAuthenticated(operation: string): Promise<void> {
    try {
      const {
        data: { session },
        error,
      } = await this.supabase.auth.getSession();

      if (error) {
        logger.error(operation, "Failed to get session", {}, error);
        throw new AuthenticationError(operation, error);
      }

      if (!session?.user) {
        logger.error(operation, "User is not authenticated", {});
        throw new AuthenticationError(operation);
      }

      logger.debug(operation, "User authentication verified", {
        userId: session.user.id,
      });
    } catch (error) {
      if (error instanceof AuthenticationError) {
        throw error;
      }
      logger.error(
        operation,
        "Error checking authentication",
        {},
        error instanceof Error ? error : new Error(String(error))
      );
      throw new AuthenticationError(
        operation,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Validate that required fields are present in rule data
   * @throws {ValidationError} if validation fails
   */
  private validateRuleData(
    ruleData: Partial<RewardRule>,
    operation: string
  ): void {
    if (!ruleData.name || ruleData.name.trim() === "") {
      logger.error(operation, "Validation failed: name is required", {
        ruleData,
      });
      throw new ValidationError("Rule name is required", "name", operation);
    }

    if (!ruleData.cardCatalogId || ruleData.cardCatalogId.trim() === "") {
      logger.error(operation, "Validation failed: cardCatalogId is required", {
        ruleData,
      });
      throw new ValidationError(
        "Card catalog ID is required",
        "cardCatalogId",
        operation
      );
    }

    if (
      ruleData.priority !== undefined &&
      (typeof ruleData.priority !== "number" || ruleData.priority < 0)
    ) {
      logger.error(
        operation,
        "Validation failed: priority must be a non-negative number",
        { ruleData }
      );
      throw new ValidationError(
        "Priority must be a non-negative number",
        "priority",
        operation
      );
    }

    logger.debug(operation, "Rule data validation passed", {
      name: ruleData.name,
      cardTypeId: ruleData.cardTypeId,
    });
  }

  public static getInstance(): RuleRepository {
    if (!RuleRepository.instance) {
      logger.error("getInstance", "RuleRepository not initialized", {
        message:
          "Call initializeRuleRepository() before accessing the repository",
      });
      throw new Error(
        "RuleRepository has not been initialized. Call initializeRuleRepository() with a Supabase client before accessing the repository."
      );
    }
    logger.debug(
      "getInstance",
      "Returning existing RuleRepository singleton instance"
    );
    return RuleRepository.instance;
  }

  /**
   * Internal method to set the singleton instance
   * Should only be called by initializeRuleRepository
   */
  private static setInstance(supabaseClient: SupabaseClient): RuleRepository {
    if (RuleRepository.instance) {
      logger.warn(
        "setInstance",
        "RuleRepository already initialized, returning existing instance"
      );
      return RuleRepository.instance;
    }

    logger.info(
      "setInstance",
      "Creating new RuleRepository singleton instance"
    );
    RuleRepository.instance = new RuleRepository(supabaseClient);
    return RuleRepository.instance;
  }

  /**
   * Reset the singleton instance (for testing purposes only)
   */
  public static resetInstance(): void {
    logger.info("resetInstance", "Resetting RuleRepository singleton instance");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    RuleRepository.instance = null as any;
  }

  /**
   * Find applicable rules for a transaction.
   *
   * @deprecated Use getRulesForCardType with CardTypeIdService instead.
   * This method uses the payment method ID directly as the card type ID,
   * which is a legacy approach. New code should use CardTypeIdService
   * to generate consistent card type IDs.
   *
   * Note: This method returns all rules for the card type.
   * Condition evaluation and filtering should be done by the RewardService.
   *
   * @param input - The calculation input containing payment method and transaction details
   * @returns Promise resolving to an array of applicable reward rules
   * @throws {ValidationError} if payment method is missing
   * @throws {PersistenceError} if database operation fails
   *
   * @example
   * ```typescript
   * const rules = await repository.findApplicableRules({
   *   amount: 100,
   *   currency: 'USD',
   *   paymentMethod: { id: 'chase-sapphire-reserve', ... },
   *   // ... other fields
   * });
   * ```
   */
  async findApplicableRules(input: CalculationInput): Promise<RewardRule[]> {
    const operation = "findApplicableRules";
    logger.info(operation, "Starting to find applicable rules", {
      paymentMethodId: input.paymentMethod.id,
      amount: input.amount,
      mcc: input.mcc,
      merchantName: input.merchantName,
      transactionType: input.transactionType,
    });

    try {
      // Validate input
      if (!input.paymentMethod || !input.paymentMethod.id) {
        logger.error(
          operation,
          "Validation failed: payment method is required",
          { input }
        );
        throw new ValidationError(
          "Payment method is required",
          "paymentMethod",
          operation
        );
      }

      // Use the payment method's ID as card type ID
      // Note: This is a legacy approach. New code should use CardTypeIdService
      const cardTypeId = input.paymentMethod.id;
      logger.debug(operation, "Using card type ID", { cardTypeId });

      const rules = await this.getRulesForCardType(cardTypeId);

      logger.info(operation, "Successfully found applicable rules", {
        cardTypeId,
        rulesCount: rules.length,
      });

      return rules;
    } catch (error) {
      // Re-throw custom errors
      if (error instanceof RepositoryError) {
        throw error;
      }

      // Wrap unexpected errors
      logger.error(
        operation,
        "Unexpected error finding applicable rules",
        {
          paymentMethodId: input.paymentMethod.id,
          amount: input.amount,
        },
        error instanceof Error ? error : new Error(String(error))
      );
      throw new PersistenceError(
        `Unexpected error finding applicable rules: ${error instanceof Error ? error.message : String(error)}`,
        operation,
        { input },
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Get all reward rules for a specific card catalog entry.
   *
   * This is the PREFERRED method for retrieving rules as it uses a proper UUID
   * foreign key instead of the text-based card_type_id which can become stale.
   *
   * @param cardCatalogId - The card catalog UUID (from payment_methods.card_catalog_id)
   * @returns Promise resolving to an array of reward rules for the card
   * @throws {ValidationError} if cardCatalogId is empty
   * @throws {AuthenticationError} if user is not authenticated
   * @throws {PersistenceError} if database operation fails
   *
   * @example
   * ```typescript
   * const rules = await repository.getRulesForCardCatalogId(paymentMethod.cardCatalogId);
   * ```
   */
  async getRulesForCardCatalogId(cardCatalogId: string): Promise<RewardRule[]> {
    const operation = "getRulesForCardCatalogId";
    logger.info(operation, "Fetching rules for card catalog", {
      cardCatalogId,
    });

    try {
      if (!cardCatalogId || cardCatalogId.trim() === "") {
        logger.error(
          operation,
          "Validation failed: cardCatalogId is required",
          {
            cardCatalogId,
          }
        );
        throw new ValidationError(
          "Card catalog ID is required",
          "cardCatalogId",
          operation
        );
      }

      // Check cache first (using cardCatalogId as key)
      const cacheKey = `catalog:${cardCatalogId}`;
      if (this.isCacheValid(cacheKey)) {
        const cachedRules = this.rulesCache.get(cacheKey);
        if (cachedRules) {
          logger.debug(operation, "Returning cached rules", {
            cardCatalogId,
            rulesCount: cachedRules.length,
          });
          return cachedRules;
        }
      }

      await this.ensureAuthenticated(operation);

      logger.debug(operation, "Executing Supabase query", {
        table: "reward_rules",
        filter: { card_catalog_id: cardCatalogId },
      });

      const { data, error } = await this.supabase
        .from("reward_rules")
        .select("*")
        .eq("card_catalog_id", cardCatalogId);

      if (error) {
        logger.error(
          operation,
          "Supabase query returned error",
          { cardCatalogId, error },
          error
        );
        throw new PersistenceError(
          `Failed to fetch rules for card catalog: ${error.message}`,
          operation,
          { cardCatalogId },
          error
        );
      }

      if (!data) {
        logger.error(operation, "Supabase query returned null data", {
          cardCatalogId,
        });
        throw new PersistenceError(
          "Database query returned no data",
          operation,
          { cardCatalogId }
        );
      }

      logger.debug(operation, "Supabase query successful", {
        cardCatalogId,
        rowsReturned: data.length,
      });

      const mappedRules = data.map((dbRule) =>
        this.ruleMapper.mapDbRuleToRewardRule(dbRule)
      );

      // Cache the results
      this.rulesCache.set(cacheKey, mappedRules);
      this.ruleCacheTimestamps.set(cacheKey, Date.now());

      logger.info(operation, "Successfully fetched and mapped rules", {
        cardCatalogId,
        rulesCount: mappedRules.length,
      });

      return mappedRules;
    } catch (error) {
      if (error instanceof RepositoryError) {
        throw error;
      }

      logger.error(
        operation,
        "Unexpected error fetching rules for card catalog",
        { cardCatalogId },
        error instanceof Error ? error : new Error(String(error))
      );
      throw new PersistenceError(
        `Unexpected error fetching rules: ${error instanceof Error ? error.message : String(error)}`,
        operation,
        { cardCatalogId },
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * @deprecated The card_type_id column has been removed from reward_rules table.
   * Use getRulesForCardCatalogId instead, which uses proper UUID foreign keys.
   *
   * @throws {Error} Always throws - this method is no longer functional
   */
  async getRulesForCardType(cardTypeId: string): Promise<RewardRule[]> {
    const operation = "getRulesForCardType";
    logger.error(
      operation,
      "DEPRECATED: card_type_id column no longer exists. Use getRulesForCardCatalogId instead.",
      { cardTypeId }
    );
    throw new Error(
      `getRulesForCardType is deprecated: card_type_id column was removed. ` +
        `Use getRulesForCardCatalogId with a UUID instead. Received: ${cardTypeId}`
    );
  }

  /**
   * Update an existing reward rule.
   *
   * Updates all fields of the rule and sets the updated_at timestamp.
   * The rule must already exist in the database.
   *
   * @param rule - The complete reward rule with updated values
   * @returns Promise that resolves when the update is complete
   * @throws {ValidationError} if required fields are missing or invalid
   * @throws {AuthenticationError} if user is not authenticated
   * @throws {PersistenceError} if database operation fails or rule doesn't exist
   *
   * @example
   * ```typescript
   * const rule = await repository.getRulesForCardType(cardTypeId)[0];
   * rule.enabled = false;
   * rule.priority = 10;
   * await repository.updateRule(rule);
   * ```
   */
  async updateRule(rule: RewardRule): Promise<void> {
    const operation = "updateRule";
    logger.info(operation, "Starting rule update", {
      ruleId: rule.id,
      ruleName: rule.name,
      cardTypeId: rule.cardTypeId,
    });

    try {
      // Validate input
      if (!rule.id || rule.id.trim() === "") {
        logger.error(operation, "Validation failed: rule ID is required", {
          rule,
        });
        throw new ValidationError("Rule ID is required", "id", operation);
      }
      this.validateRuleData(rule, operation);

      // Verify authentication
      await this.ensureAuthenticated(operation);

      logger.debug(operation, "Mapping rule to database format", { rule });
      const dbRule = this.ruleMapper.mapRewardRuleToDbRule(rule);

      logger.debug(operation, "Mapped database rule", { dbRule });

      const updateData = {
        ...dbRule,
        updated_at: new Date().toISOString(),
      };

      logger.debug(operation, "Executing Supabase update", {
        table: "reward_rules",
        ruleId: rule.id,
        updateData,
      });

      const { error, data } = await this.supabase
        .from("reward_rules")
        .update(updateData)
        .eq("id", rule.id)
        .select();

      if (error) {
        logger.error(
          operation,
          "Supabase update returned error",
          {
            ruleId: rule.id,
            error,
          },
          error
        );
        throw new PersistenceError(
          `Failed to update rule: ${error.message}`,
          operation,
          { ruleId: rule.id, rule },
          error
        );
      }

      // Verify the operation succeeded
      if (!data || data.length === 0) {
        logger.error(
          operation,
          "Supabase update returned no data - rule may not exist",
          {
            ruleId: rule.id,
          }
        );
        throw new PersistenceError(
          "Rule update did not affect any rows - rule may not exist",
          operation,
          { ruleId: rule.id, rule }
        );
      }

      // Invalidate cache for the card type
      this.invalidateCache(rule.cardTypeId);

      logger.info(operation, "Rule updated successfully", {
        ruleId: rule.id,
        ruleName: rule.name,
      });
    } catch (error) {
      // Re-throw custom errors
      if (error instanceof RepositoryError) {
        throw error;
      }

      // Wrap unexpected errors
      logger.error(
        operation,
        "Unexpected error updating rule",
        {
          ruleId: rule.id,
          ruleName: rule.name,
          cardTypeId: rule.cardTypeId,
        },
        error instanceof Error ? error : new Error(String(error))
      );
      throw new PersistenceError(
        `Unexpected error updating rule: ${error instanceof Error ? error.message : String(error)}`,
        operation,
        { ruleId: rule.id, rule },
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Create a new reward rule.
   *
   * Generates a new ID and timestamps for the rule, then persists it to the database.
   *
   * @param ruleData - The reward rule data (without id, createdAt, updatedAt)
   * @returns Promise resolving to the created reward rule with generated ID and timestamps
   * @throws {ValidationError} if required fields are missing or invalid
   * @throws {AuthenticationError} if user is not authenticated
   * @throws {PersistenceError} if database operation fails
   *
   * @example
   * ```typescript
   * const newRule = await repository.createRule({
   *   cardTypeId: 'chase-sapphire-reserve',
   *   name: 'Dining Bonus',
   *   description: '3x points on dining',
   *   enabled: true,
   *   priority: 10,
   *   conditions: [{ type: 'mcc', operation: 'include', values: ['5812'] }],
   *   reward: {
   *     calculationMethod: 'standard',
   *     baseMultiplier: 1,
   *     bonusMultiplier: 2,
   *     // ... other reward config
   *   }
   * });
   * ```
   */
  async createRule(
    ruleData: Omit<RewardRule, "id" | "createdAt" | "updatedAt">
  ): Promise<RewardRule> {
    const operation = "createRule";
    logger.info(operation, "Starting rule creation", {
      ruleName: ruleData.name,
      cardCatalogId: ruleData.cardCatalogId,
      priority: ruleData.priority,
    });

    try {
      // Validate input
      this.validateRuleData(ruleData, operation);

      // Verify authentication
      await this.ensureAuthenticated(operation);

      const newRule: RewardRule = {
        ...ruleData,
        id: crypto.randomUUID(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      logger.debug(operation, "Generated new rule with ID", {
        ruleId: newRule.id,
        ruleName: newRule.name,
      });

      logger.debug(operation, "Mapping rule to database format", { newRule });
      const dbRule = this.ruleMapper.mapRewardRuleToDbRule(newRule);

      logger.debug(operation, "Mapped database rule", { dbRule });

      const insertData = {
        ...dbRule,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      logger.debug(operation, "Executing Supabase insert", {
        table: "reward_rules",
        insertData,
      });

      const { error, data } = await this.supabase
        .from("reward_rules")
        .insert([insertData])
        .select();

      if (error) {
        logger.error(
          operation,
          "Supabase insert returned error",
          {
            ruleName: ruleData.name,
            cardTypeId: ruleData.cardTypeId,
            error,
          },
          error
        );
        throw new PersistenceError(
          `Failed to create rule: ${error.message}`,
          operation,
          ruleData,
          error
        );
      }

      // Verify the operation succeeded
      if (!data || data.length === 0) {
        logger.error(operation, "Supabase insert returned no data", {
          ruleName: ruleData.name,
          cardTypeId: ruleData.cardTypeId,
        });
        throw new PersistenceError(
          "Rule creation did not return created data",
          operation,
          ruleData
        );
      }

      logger.debug(operation, "Supabase insert response", { data });

      // Invalidate cache for the card type
      this.invalidateCache(newRule.cardTypeId);

      logger.info(operation, "Rule created successfully", {
        ruleId: newRule.id,
        ruleName: newRule.name,
        cardTypeId: newRule.cardTypeId,
      });

      return newRule;
    } catch (error) {
      // Re-throw custom errors
      if (error instanceof RepositoryError) {
        throw error;
      }

      // Wrap unexpected errors
      logger.error(
        operation,
        "Unexpected error creating rule",
        {
          ruleName: ruleData.name,
          cardTypeId: ruleData.cardTypeId,
          priority: ruleData.priority,
        },
        error instanceof Error ? error : new Error(String(error))
      );
      throw new PersistenceError(
        `Unexpected error creating rule: ${error instanceof Error ? error.message : String(error)}`,
        operation,
        ruleData,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Delete a reward rule.
   *
   * Permanently removes the rule from the database.
   * This operation cannot be undone.
   *
   * @param ruleId - The ID of the rule to delete
   * @returns Promise that resolves when the deletion is complete
   * @throws {ValidationError} if ruleId is empty
   * @throws {AuthenticationError} if user is not authenticated
   * @throws {PersistenceError} if database operation fails or rule doesn't exist
   *
   * @example
   * ```typescript
   * await repository.deleteRule('rule-id-123');
   * ```
   */
  async deleteRule(ruleId: string): Promise<void> {
    const operation = "deleteRule";
    logger.info(operation, "Starting rule deletion", { ruleId });

    try {
      // Validate input
      if (!ruleId || ruleId.trim() === "") {
        logger.error(operation, "Validation failed: rule ID is required", {
          ruleId,
        });
        throw new ValidationError("Rule ID is required", "id", operation);
      }

      // Verify authentication
      await this.ensureAuthenticated(operation);

      logger.debug(operation, "Executing Supabase delete", {
        table: "reward_rules",
        ruleId,
      });

      const { error, data } = await this.supabase
        .from("reward_rules")
        .delete()
        .eq("id", ruleId)
        .select();

      if (error) {
        logger.error(
          operation,
          "Supabase delete returned error",
          {
            ruleId,
            error,
          },
          error
        );
        throw new PersistenceError(
          `Failed to delete rule: ${error.message}`,
          operation,
          { ruleId },
          error
        );
      }

      // Verify the operation succeeded
      if (!data || data.length === 0) {
        logger.error(
          operation,
          "Supabase delete returned no data - rule may not exist",
          {
            ruleId,
          }
        );
        throw new PersistenceError(
          "Rule deletion did not affect any rows - rule may not exist",
          operation,
          { ruleId }
        );
      }

      logger.debug(operation, "Supabase delete response", { data });

      // Invalidate all caches (we don't have cardTypeId in deleteRule)
      this.invalidateCache();

      logger.info(operation, "Rule deleted successfully", { ruleId });
    } catch (error) {
      // Re-throw custom errors
      if (error instanceof RepositoryError) {
        throw error;
      }

      // Wrap unexpected errors
      logger.error(
        operation,
        "Unexpected error deleting rule",
        { ruleId },
        error instanceof Error ? error : new Error(String(error))
      );
      throw new PersistenceError(
        `Unexpected error deleting rule: ${error instanceof Error ? error.message : String(error)}`,
        operation,
        { ruleId },
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Verify that the Supabase client is properly initialized.
   *
   * This is a diagnostic method useful for troubleshooting initialization issues.
   *
   * @returns true if client is initialized, false otherwise
   *
   * @example
   * ```typescript
   * if (!repository.isSupabaseClientInitialized()) {
   *   console.error('Supabase client not initialized');
   * }
   * ```
   */
  isSupabaseClientInitialized(): boolean {
    const operation = "isSupabaseClientInitialized";
    const isInitialized = !!this.supabase;

    logger.info(operation, "Checking Supabase client initialization", {
      isInitialized,
    });

    return isInitialized;
  }

  /**
   * Verify user authentication status.
   *
   * This is a diagnostic method useful for troubleshooting authentication issues.
   *
   * @returns Promise resolving to authentication status object
   * @returns {boolean} isAuthenticated - Whether the user is authenticated
   * @returns {string} [userId] - The user's ID if authenticated
   * @returns {string} [error] - Error message if authentication check failed
   *
   * @example
   * ```typescript
   * const auth = await repository.verifyAuthentication();
   * if (!auth.isAuthenticated) {
   *   console.error('User not authenticated:', auth.error);
   * }
   * ```
   */
  async verifyAuthentication(): Promise<{
    isAuthenticated: boolean;
    userId?: string;
    error?: string;
  }> {
    const operation = "verifyAuthentication";
    logger.info(operation, "Verifying user authentication");

    try {
      const {
        data: { session },
        error,
      } = await this.supabase.auth.getSession();

      if (error) {
        logger.error(operation, "Error getting session", {}, error);
        return {
          isAuthenticated: false,
          error: error.message,
        };
      }

      const isAuthenticated = !!session?.user;
      const userId = session?.user?.id;

      logger.info(operation, "Authentication verification complete", {
        isAuthenticated,
        userId: userId || "none",
      });

      return {
        isAuthenticated,
        userId,
      };
    } catch (error) {
      logger.error(
        operation,
        "Error verifying authentication",
        {},
        error instanceof Error ? error : new Error(String(error))
      );
      return {
        isAuthenticated: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Test database connection with a simple query.
   *
   * This is a diagnostic method useful for troubleshooting connection issues.
   * Performs a lightweight HEAD request to the reward_rules table.
   *
   * @returns Promise resolving to connection status object
   * @returns {boolean} isConnected - Whether the database is reachable
   * @returns {string} [error] - Error message if connection failed
   * @returns {number} [latencyMs] - Round-trip latency in milliseconds
   *
   * @example
   * ```typescript
   * const conn = await repository.verifyConnection();
   * if (!conn.isConnected) {
   *   console.error('Database unreachable:', conn.error);
   * } else {
   *   console.log(`Database latency: ${conn.latencyMs}ms`);
   * }
   * ```
   */
  async verifyConnection(): Promise<{
    isConnected: boolean;
    error?: string;
    latencyMs?: number;
  }> {
    const operation = "verifyConnection";
    logger.info(operation, "Testing database connection");

    const startTime = Date.now();

    try {
      // Perform a simple query to test the connection
      const { error, count } = await this.supabase
        .from("reward_rules")
        .select("*", { count: "exact", head: true });

      const latencyMs = Date.now() - startTime;

      if (error) {
        logger.error(
          operation,
          "Database connection test failed",
          {
            latencyMs,
            error,
          },
          error
        );
        return {
          isConnected: false,
          error: error.message,
          latencyMs,
        };
      }

      logger.info(operation, "Database connection test successful", {
        latencyMs,
        rowCount: count,
      });

      return {
        isConnected: true,
        latencyMs,
      };
    } catch (error) {
      const latencyMs = Date.now() - startTime;
      logger.error(
        operation,
        "Error testing database connection",
        { latencyMs },
        error instanceof Error ? error : new Error(String(error))
      );
      return {
        isConnected: false,
        error: error instanceof Error ? error.message : String(error),
        latencyMs,
      };
    }
  }
}

/**
 * Initialize the RuleRepository singleton with a Supabase client.
 *
 * This function MUST be called before any repository operations.
 * It should be called once during application startup (typically in App.tsx).
 *
 * If the repository is already initialized, this function returns the existing instance
 * and does not create a new one.
 *
 * @param supabaseClient - The Supabase client to use for database operations
 * @returns The initialized RuleRepository singleton instance
 * @throws {Error} if supabaseClient is not provided
 *
 * @example
 * ```typescript
 * // In App.tsx
 * import { supabase } from '@/integrations/supabase/client';
 * import { initializeRuleRepository } from '@/core/rewards/RuleRepository';
 *
 * useEffect(() => {
 *   const repository = initializeRuleRepository(supabase);
 *   console.log('Repository initialized');
 * }, []);
 * ```
 */
export const initializeRuleRepository = (
  supabaseClient: SupabaseClient
): RuleRepository => {
  logger.info("initializeRuleRepository", "Initializing rule repository", {
    hasProvidedClient: !!supabaseClient,
  });

  if (!supabaseClient) {
    logger.error("initializeRuleRepository", "No Supabase client provided");
    throw new Error("Supabase client is required to initialize RuleRepository");
  }

  const instance = RuleRepository["setInstance"](supabaseClient);
  logger.info(
    "initializeRuleRepository",
    "Rule repository initialized successfully"
  );

  return instance;
};

/**
 * Get the initialized RuleRepository singleton instance.
 *
 * This function provides access to the repository after it has been initialized.
 * It will throw an error if called before initializeRuleRepository().
 *
 * @returns The RuleRepository singleton instance
 * @throws {Error} if repository has not been initialized
 *
 * @example
 * ```typescript
 * import { getRuleRepository } from '@/core/rewards/RuleRepository';
 *
 * const repository = getRuleRepository();
 * const rules = await repository.getRulesForCardType(cardTypeId);
 * ```
 */
export const getRuleRepository = (): RuleRepository => {
  logger.debug("getRuleRepository", "Getting rule repository instance");
  return RuleRepository.getInstance();
};
