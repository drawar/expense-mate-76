import { DateTime } from "luxon";
import { PaymentMethod } from "@/types";
import {
  CalculationInput,
  CalculationResult,
  RewardRule,
  RuleCondition,
  BonusTier,
} from "./types";
import { RuleRepository } from "./RuleRepository";
import { cardTypeIdService } from "./CardTypeIdService";
import { bonusPointsTracker } from "./BonusPointsTracker";
import { logger } from "./logger";

export class RewardService {
  private ruleRepository: RuleRepository;

  constructor(ruleRepository: RuleRepository) {
    this.ruleRepository = ruleRepository;
  }

  /**
   * Get the amount to use for calculations
   * Uses converted amount if provided, otherwise falls back to transaction amount
   */
  private getCalculationAmount(input: CalculationInput): number {
    return input.convertedAmount ?? input.amount;
  }

  async calculateRewards(input: CalculationInput): Promise<CalculationResult> {
    let totalPoints = 0;
    let basePoints = 0;
    let bonusPoints = 0;
    let minSpendMet = true;
    const messages: string[] = [];
    let appliedRule: RewardRule | undefined;
    let appliedTier: BonusTier | undefined;

    try {
      // Determine which amount to use for calculations
      const calculationAmount = this.getCalculationAmount(input);

      // 1. Generate card type ID for the payment method
      const cardTypeId = cardTypeIdService.generateCardTypeIdFromPaymentMethod({
        issuer: input.paymentMethod.issuer,
        name: input.paymentMethod.name,
      });

      // Log card type ID generation (Requirement 4.1)
      logger.info("calculateRewards", "Generated card type ID", {
        cardTypeId,
        issuer: input.paymentMethod.issuer,
        name: input.paymentMethod.name,
        amount: input.amount,
        currency: input.currency,
        convertedAmount: input.convertedAmount,
        convertedCurrency: input.convertedCurrency,
        calculationAmount,
        mcc: input.mcc,
        merchantName: input.merchantName,
        isOnline: input.isOnline,
        isContactless: input.isContactless,
      });

      // 2. Find rules for this card type
      const allRules =
        await this.ruleRepository.getRulesForCardType(cardTypeId);

      // Log number of rules retrieved (Requirement 4.2)
      logger.info("calculateRewards", "Retrieved rules from repository", {
        cardTypeId,
        totalRules: allRules?.length || 0,
        enabledRules: allRules?.filter((r) => r.enabled).length || 0,
      });

      if (!allRules || allRules.length === 0) {
        logger.warn("calculateRewards", "No reward rules found", {
          cardTypeId,
        });
        return {
          totalPoints: 0,
          basePoints: 0,
          bonusPoints: 0,
          pointsCurrency: input.paymentMethod.pointsCurrency || "points",
          minSpendMet: true,
          messages: ["No reward rules found for this payment method"],
        };
      }

      // 3. Filter rules by enabled status and evaluate conditions
      const applicableRules = allRules
        .filter((rule) => rule.enabled)
        .filter((rule) => this.evaluateConditions(rule.conditions, input));

      logger.info("calculateRewards", "Filtered applicable rules", {
        totalRules: allRules.length,
        enabledRules: allRules.filter((r) => r.enabled).length,
        applicableRules: applicableRules.length,
      });

      if (applicableRules.length === 0) {
        logger.warn("calculateRewards", "No applicable rules found", {
          cardTypeId,
          totalRules: allRules.length,
          enabledRules: allRules.filter((r) => r.enabled).length,
        });
        return {
          totalPoints: 0,
          basePoints: 0,
          bonusPoints: 0,
          pointsCurrency: input.paymentMethod.pointsCurrency || "points",
          minSpendMet: true,
          messages: ["No applicable reward rules found for this transaction"],
        };
      }

      // 4. Sort rules by priority (higher priority number = higher precedence)
      const sortedRules = applicableRules.sort(
        (a, b) => b.priority - a.priority
      );

      // 5. Apply the first matching rule (highest priority)
      for (const rule of sortedRules) {
        appliedRule = rule;

        logger.debug("calculateRewards", "Attempting to apply rule", {
          ruleId: rule.id,
          ruleName: rule.name,
          priority: rule.priority,
          calculationMethod: rule.reward.calculationMethod,
        });

        // Check monthly minimum spend
        if (
          rule.reward.monthlyMinSpend &&
          input.monthlySpend &&
          input.monthlySpend < rule.reward.monthlyMinSpend
        ) {
          minSpendMet = false;
          messages.push(
            `Monthly minimum spend of ${rule.reward.monthlyMinSpend} not met`
          );
          logger.debug(
            "calculateRewards",
            "Rule skipped - minimum spend not met",
            {
              ruleId: rule.id,
              ruleName: rule.name,
              requiredSpend: rule.reward.monthlyMinSpend,
              actualSpend: input.monthlySpend,
            }
          );
          continue; // Skip to the next rule
        }

        // 3. Calculate base points
        switch (rule.reward.calculationMethod) {
          case "standard": {
            basePoints = this.calculateStandardPoints(
              calculationAmount,
              rule.reward.baseMultiplier,
              rule.reward.pointsRoundingStrategy,
              rule.reward.blockSize,
              rule.reward.amountRoundingStrategy
            );
            break;
          }
          case "tiered": {
            const { points: tieredPoints, tier } = this.calculateTieredPoints(
              calculationAmount,
              rule.reward.bonusTiers,
              input.monthlySpend
            );
            bonusPoints = tieredPoints;
            appliedTier = tier;
            break;
          }
          case "flat_rate": {
            basePoints = rule.reward.baseMultiplier;
            break;
          }
          case "direct": {
            basePoints = calculationAmount;
            break;
          }
          default: {
            console.warn(
              `Unknown calculation method: ${rule.reward.calculationMethod}`
            );
            break;
          }
        }

        // 4. Calculate bonus points
        if (rule.reward.bonusMultiplier > 0) {
          const calculatedBonusPoints = this.calculateBonusPoints(
            calculationAmount,
            rule.reward.bonusMultiplier,
            rule.reward.pointsRoundingStrategy,
            rule.reward.blockSize,
            rule.reward.amountRoundingStrategy
          );
          bonusPoints += calculatedBonusPoints;

          logger.debug("calculateRewards", "Bonus points calculated", {
            calculationAmount,
            bonusMultiplier: rule.reward.bonusMultiplier,
            calculatedBonusPoints,
            totalBonusPoints: bonusPoints,
          });
        }

        // 5. Apply monthly cap
        let remainingMonthlyBonusPoints: number | undefined;
        if (rule.reward.monthlyCap !== undefined) {
          const cap = rule.reward.monthlyCap;

          // Get used bonus points from input or tracker
          let usedBonusPoints = 0;

          // If usedBonusPoints is provided in input, use that (for testing or when caller knows the value)
          if (input.usedBonusPoints !== undefined) {
            usedBonusPoints = input.usedBonusPoints;
          } else if (rule.id && input.paymentMethod.id) {
            // Otherwise, try to get actual usage from tracker
            try {
              const periodType =
                rule.reward.monthlySpendPeriodType || "calendar";
              const date = input.date
                ? input.date instanceof Date
                  ? input.date
                  : input.date.toJSDate()
                : new Date();

              usedBonusPoints = await bonusPointsTracker.getUsedBonusPoints(
                rule.id,
                input.paymentMethod.id,
                periodType,
                date,
                1 // Default statement day - could be made configurable
              );
            } catch (error) {
              console.warn(
                "Failed to get bonus points usage from tracker",
                error
              );
            }
          }

          const availableBonusPoints = Math.max(0, cap - usedBonusPoints);

          // Calculate what the bonus would be without the monthly cap
          // Apply the same amount rounding as used in the actual calculation
          let roundedAmountForComparison = calculationAmount;
          switch (rule.reward.amountRoundingStrategy) {
            case "floor":
              roundedAmountForComparison = Math.floor(calculationAmount);
              break;
            case "ceiling":
              roundedAmountForComparison = Math.ceil(calculationAmount);
              break;
            case "nearest":
              roundedAmountForComparison = Math.round(calculationAmount);
              break;
            case "floor5":
              roundedAmountForComparison =
                Math.floor(calculationAmount / 5) * 5;
              break;
          }
          const uncappedBonusPoints = Math.floor(
            roundedAmountForComparison * rule.reward.bonusMultiplier
          );

          bonusPoints = Math.min(bonusPoints, availableBonusPoints);
          remainingMonthlyBonusPoints = availableBonusPoints - bonusPoints;

          if (availableBonusPoints <= 0) {
            messages.push("Monthly bonus points cap reached");
          } else if (bonusPoints < uncappedBonusPoints) {
            messages.push(
              `Bonus points capped at ${bonusPoints} due to monthly limit`
            );
          }
        }

        totalPoints = basePoints + bonusPoints;

        // Log applied rule and calculated points (Requirement 4.4)
        logger.info("calculateRewards", "Rule applied successfully", {
          ruleId: rule.id,
          ruleName: rule.name,
          priority: rule.priority,
          calculationMethod: rule.reward.calculationMethod,
          calculationAmount,
          baseMultiplier: rule.reward.baseMultiplier,
          bonusMultiplier: rule.reward.bonusMultiplier,
          basePoints,
          bonusPoints,
          totalPoints,
          pointsCurrency: rule.reward.pointsCurrency,
          appliedTier: appliedTier?.name,
          monthlyCap: rule.reward.monthlyCap,
          remainingMonthlyBonusPoints,
        });

        return {
          totalPoints,
          basePoints,
          bonusPoints,
          pointsCurrency: rule.reward.pointsCurrency,
          remainingMonthlyBonusPoints,
          minSpendMet,
          appliedRule,
          appliedTier,
          messages,
        };
      }

      // If no rule was successfully applied
      logger.warn("calculateRewards", "No rule successfully applied", {
        cardTypeId,
        applicableRulesCount: applicableRules.length,
      });
      return {
        totalPoints: 0,
        basePoints: 0,
        bonusPoints: 0,
        pointsCurrency: input.paymentMethod.pointsCurrency || "points",
        minSpendMet: true,
        messages: ["No applicable reward rules applied"],
      };
    } catch (error) {
      // Log errors with full transaction context (Requirement 4.5)
      logger.error(
        "calculateRewards",
        "Error calculating rewards",
        {
          paymentMethod: {
            id: input.paymentMethod.id,
            issuer: input.paymentMethod.issuer,
            name: input.paymentMethod.name,
          },
          transaction: {
            amount: input.amount,
            currency: input.currency,
            mcc: input.mcc,
            merchantName: input.merchantName,
            transactionType: input.transactionType,
            isOnline: input.isOnline,
            isContactless: input.isContactless,
            date: input.date,
          },
        },
        error instanceof Error ? error : new Error(String(error))
      );
      throw error;
    }
  }

  private calculateStandardPoints(
    amount: number,
    multiplier: number,
    roundingStrategy: string = "floor",
    blockSize: number = 1,
    amountRoundingStrategy: string = "none"
  ): number {
    let roundedAmount = amount;

    switch (amountRoundingStrategy) {
      case "floor":
        roundedAmount = Math.floor(amount);
        break;
      case "ceiling":
        roundedAmount = Math.ceil(amount);
        break;
      case "nearest":
        roundedAmount = Math.round(amount);
        break;
      case "floor5":
        roundedAmount = Math.floor(amount / 5) * 5;
        break;
      case "none":
      default:
        break;
    }

    const points = (roundedAmount / blockSize) * multiplier;

    switch (roundingStrategy) {
      case "floor":
        return Math.floor(points);
      case "ceiling":
        return Math.ceil(points);
      case "nearest":
        return Math.round(points);
      default:
        return Math.floor(points);
    }
  }

  private calculateBonusPoints(
    amount: number,
    multiplier: number,
    roundingStrategy: string = "floor",
    blockSize: number = 1,
    amountRoundingStrategy: string = "none"
  ): number {
    return this.calculateStandardPoints(
      amount,
      multiplier,
      roundingStrategy,
      blockSize,
      amountRoundingStrategy
    );
  }

  private calculateTieredPoints(
    amount: number,
    tiers: BonusTier[],
    monthlySpend?: number
  ): { points: number; tier: BonusTier | null } {
    let appliedTier: BonusTier | null = null;

    if (!tiers || tiers.length === 0) {
      return { points: 0, tier: null };
    }

    // Sort tiers by priority
    tiers.sort((a, b) => (a.priority || 0) - (b.priority || 0));

    for (const tier of tiers) {
      if (tier.minAmount !== undefined && amount < tier.minAmount) {
        continue;
      }
      if (tier.maxAmount !== undefined && amount > tier.maxAmount) {
        continue;
      }
      if (
        tier.minSpend !== undefined &&
        monthlySpend !== undefined &&
        monthlySpend < tier.minSpend
      ) {
        continue;
      }
      if (
        tier.maxSpend !== undefined &&
        monthlySpend !== undefined &&
        monthlySpend > tier.maxSpend
      ) {
        continue;
      }

      const points = this.calculateStandardPoints(amount, tier.multiplier);
      appliedTier = tier;
      return { points, tier: appliedTier };
    }

    return { points: 0, tier: appliedTier };
  }

  /**
   * Normalize a condition to handle backward compatibility
   * Converts legacy "online" condition type to "transaction_type"
   */
  private normalizeCondition(condition: RuleCondition): RuleCondition {
    // Handle legacy "online" type that may exist in database
    // Cast type to string to allow checking for legacy "online" value that isn't in the type definition
    const conditionType = condition.type as string;

    // If condition type is "online" (legacy), convert to transaction_type
    if (conditionType === "online") {
      // Handle equals operation with boolean values
      if (condition.operation === "equals") {
        const value = condition.values[0];
        const valueStr = String(value);
        if (valueStr === "true") {
          // online = true → transaction_type include "online"
          return {
            ...condition,
            type: "transaction_type",
            operation: "include",
            values: ["online"],
          };
        } else if (valueStr === "false") {
          // online = false → transaction_type exclude "online"
          return {
            ...condition,
            type: "transaction_type",
            operation: "exclude",
            values: ["online"],
          };
        }
      }

      // For other operations, convert type but keep operation and values
      return {
        ...condition,
        type: "transaction_type",
      };
    }

    return condition;
  }

  /**
   * Evaluate all conditions for a rule
   * All conditions must be true for the rule to apply
   */
  private evaluateConditions(
    conditions: RuleCondition[],
    input: CalculationInput
  ): boolean {
    // If no conditions, rule applies to all transactions
    if (!conditions || conditions.length === 0) {
      logger.debug("evaluateConditions", "No conditions to evaluate", {});
      return true;
    }

    // Normalize and evaluate all conditions
    const results = conditions.map((condition) => {
      const normalizedCondition = this.normalizeCondition(condition);
      const result = this.evaluateCondition(normalizedCondition, input);

      // Log condition evaluation result (Requirement 4.3)
      logger.debug(
        "evaluateConditions",
        `Condition ${result ? "PASSED" : "FAILED"}`,
        {
          conditionType: normalizedCondition.type,
          operation: normalizedCondition.operation,
          values: normalizedCondition.values,
          result,
          wasNormalized: condition.type !== normalizedCondition.type,
        }
      );

      return result;
    });

    const allPassed = results.every((r) => r);
    logger.debug("evaluateConditions", "All conditions evaluated", {
      totalConditions: conditions.length,
      passed: results.filter((r) => r).length,
      failed: results.filter((r) => !r).length,
      allPassed,
    });

    return allPassed;
  }

  /**
   * Evaluate a single condition
   */
  private evaluateCondition(
    condition: RuleCondition,
    input: CalculationInput
  ): boolean {
    switch (condition.type) {
      case "mcc":
        return this.evaluateMccCondition(condition, input.mcc);

      case "merchant":
        return this.evaluateMerchantCondition(condition, input.merchantName);

      case "transaction_type":
        return this.evaluateTransactionTypeCondition(
          condition,
          input.transactionType,
          input
        );

      case "currency":
        return this.evaluateCurrencyCondition(condition, input.currency);

      case "amount":
        return this.evaluateAmountCondition(condition, input.amount);

      case "compound":
        return this.evaluateCompoundCondition(condition, input);

      case "category":
        // Category conditions would need additional data in CalculationInput
        // For now, return true (no filtering)
        return true;

      default:
        console.warn(`Unknown condition type: ${condition.type}`);
        return true;
    }
  }

  private evaluateMccCondition(
    condition: RuleCondition,
    mcc?: string
  ): boolean {
    if (!mcc) {
      const result = condition.operation === "exclude";
      console.log("🔍 [evaluateMccCondition] No MCC provided", {
        operation: condition.operation,
        result,
      });
      return result;
    }

    const values = condition.values.map((v) => String(v));

    let result: boolean;
    switch (condition.operation) {
      case "include":
        result = values.includes(mcc);
        break;
      case "exclude":
        result = !values.includes(mcc);
        break;
      case "equals":
        result = values.length > 0 && values[0] === mcc;
        break;
      default:
        result = true;
    }

    console.log("🔍 [evaluateMccCondition]", {
      mcc,
      operation: condition.operation,
      valuesCount: values.length,
      isInList: values.includes(mcc),
      result,
    });

    return result;
  }

  private evaluateMerchantCondition(
    condition: RuleCondition,
    merchantName?: string
  ): boolean {
    if (!merchantName) {
      return condition.operation === "exclude";
    }

    const merchantLower = merchantName.toLowerCase();
    const values = condition.values.map((v) => String(v).toLowerCase());

    switch (condition.operation) {
      case "include":
        return values.some((v) => merchantLower.includes(v));
      case "exclude":
        return !values.some((v) => merchantLower.includes(v));
      case "equals":
        return values.length > 0 && merchantLower === values[0];
      default:
        return true;
    }
  }

  private evaluateTransactionTypeCondition(
    condition: RuleCondition,
    transactionType: string,
    input?: CalculationInput
  ): boolean {
    const values = condition.values.map((v) => String(v));

    // Helper function to check if a transaction matches a specific type
    const matchesType = (type: string): boolean => {
      switch (type) {
        case "online":
          return input?.isOnline === true;
        case "contactless":
          return input?.isContactless === true;
        case "in_store":
          return input?.isOnline === false;
        default:
          // For other transaction types (purchase, refund, adjustment),
          // check against the transactionType string
          return transactionType === type;
      }
    };

    let result: boolean;
    switch (condition.operation) {
      case "include":
        // Transaction matches if it matches ANY of the specified types
        result = values.some((type) => matchesType(type));
        break;
      case "exclude":
        // Transaction matches if it matches NONE of the specified types
        result = !values.some((type) => matchesType(type));
        break;
      case "equals":
        // Transaction matches if it matches the single specified type
        result = values.length > 0 && matchesType(values[0]);
        break;
      default:
        result = true;
    }

    console.log("🔍 [evaluateTransactionTypeCondition]", {
      values,
      operation: condition.operation,
      transactionType,
      isOnline: input?.isOnline,
      isContactless: input?.isContactless,
      result,
    });

    return result;
  }

  private evaluateAmountCondition(
    condition: RuleCondition,
    amount: number
  ): boolean {
    const result = true; // Placeholder
    return result;
  }

  private evaluateCompoundCondition(
    condition: RuleCondition,
    input: CalculationInput
  ): boolean {
    if (!condition.subConditions || condition.subConditions.length === 0) {
      return true;
    }

    switch (condition.operation) {
      case "all":
        return condition.subConditions.every((subCondition) =>
          this.evaluateCondition(subCondition, input)
        );
      case "any":
        return condition.subConditions.some((subCondition) =>
          this.evaluateCondition(subCondition, input)
        );
      default:
        return true;
    }
  }

  private evaluateCurrencyCondition(
    condition: RuleCondition,
    currency: string
  ): boolean {
    const values = condition.values.map((v) => String(v).toUpperCase());
    const currencyUpper = currency.toUpperCase();

    switch (condition.operation) {
      case "include":
        return values.includes(currencyUpper);
      case "exclude":
        return !values.includes(currencyUpper);
      case "equals":
        return values.length > 0 && values[0] === currencyUpper;
      default:
        return true;
    }
  }

  private evaluateAmountCondition(
    condition: RuleCondition,
    amount: number
  ): boolean {
    const values = condition.values.map((v) => Number(v));

    switch (condition.operation) {
      case "greater_than":
        return values.length > 0 && amount > values[0];
      case "less_than":
        return values.length > 0 && amount < values[0];
      case "equals":
        return values.length > 0 && amount === values[0];
      case "range":
        return values.length >= 2 && amount >= values[0] && amount <= values[1];
      default:
        return true;
    }
  }

  private evaluateCompoundCondition(
    condition: RuleCondition,
    input: CalculationInput
  ): boolean {
    if (!condition.subConditions || condition.subConditions.length === 0) {
      return true;
    }

    switch (condition.operation) {
      case "all":
        return condition.subConditions.every((subCondition) =>
          this.evaluateCondition(subCondition, input)
        );
      case "any":
        return condition.subConditions.some((subCondition) =>
          this.evaluateCondition(subCondition, input)
        );
      default:
        return true;
    }
  }

  async simulateRewards(
    amount: number,
    currency: string,
    paymentMethod: PaymentMethod,
    mcc?: string,
    merchantName?: string,
    isOnline?: boolean,
    isContactless?: boolean,
    convertedAmount?: number,
    convertedCurrency?: string
  ): Promise<CalculationResult> {
    const input: CalculationInput = {
      amount,
      currency,
      convertedAmount,
      convertedCurrency,
      paymentMethod,
      mcc,
      merchantName,
      transactionType: "purchase",
      isOnline,
      isContactless,
      date: DateTime.now(),
    };

    return this.calculateRewards(input);
  }

  async simulatePoints(
    amount: number,
    currency: string,
    paymentMethod: PaymentMethod,
    mcc?: string,
    merchantName?: string,
    isOnline?: boolean,
    isContactless?: boolean,
    convertedAmount?: number,
    convertedCurrency?: string
  ): Promise<CalculationResult> {
    return this.simulateRewards(
      amount,
      currency,
      paymentMethod,
      mcc,
      merchantName,
      isOnline,
      isContactless,
      convertedAmount,
      convertedCurrency
    );
  }

  getPointsCurrency(paymentMethod: PaymentMethod): string {
    return paymentMethod.pointsCurrency || "points";
  }
}

// Create singleton instance using the singleton RuleRepository
import { getRuleRepository } from "./RuleRepository";

let rewardServiceInstance: RewardService | null = null;

/**
 * Get the RewardService singleton instance.
 * Lazily initializes with the RuleRepository on first access.
 *
 * @returns The RewardService singleton instance
 */
function getRewardService(): RewardService {
  if (!rewardServiceInstance) {
    try {
      const ruleRepository = getRuleRepository();
      rewardServiceInstance = new RewardService(ruleRepository);
      console.log("✅ RewardService initialized with real RuleRepository");
    } catch (error) {
      console.warn(
        "⚠️ RuleRepository not initialized, creating mock RewardService"
      );
      // Create a mock repository for fallback
      const mockRepository = {
        findApplicableRules: async () => [],
        getRulesForCardType: async () => [],
        updateRule: async () => {},
        createRule: async () => ({
          id: "mock",
          cardTypeId: "mock",
          name: "mock",
          description: "",
          enabled: true,
          priority: 1,
          conditions: [],
          reward: {
            calculationMethod: "standard" as const,
            baseMultiplier: 1,
            bonusMultiplier: 0,
            pointsRoundingStrategy: "floor" as const,
            amountRoundingStrategy: "none" as const,
            blockSize: 1,
            bonusTiers: [],
            pointsCurrency: "points",
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
        deleteRule: async () => {},
        verifyConnection: async () => ({ isConnected: false, latencyMs: 0 }),
        verifyAuthentication: async () => ({ isAuthenticated: false }),
      } as unknown as RuleRepository;
      rewardServiceInstance = new RewardService(mockRepository);
    }
  }
  return rewardServiceInstance;
}

// Export as a getter property to ensure lazy initialization
export const rewardService = new Proxy({} as RewardService, {
  get(_target, prop) {
    const service = getRewardService();
    const value = service[prop as keyof RewardService];
    return typeof value === "function" ? value.bind(service) : value;
  },
});
