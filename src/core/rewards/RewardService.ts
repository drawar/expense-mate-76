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
import { bonusPointsTracker } from "./BonusPointsTracker";
import { logger } from "./logger";

export class RewardService {
  private ruleRepository: RuleRepository;

  constructor(ruleRepository: RuleRepository) {
    this.ruleRepository = ruleRepository;
  }

  /**
   * Get reward rules for a payment method.
   *
   * PREFERRED: Uses card_catalog_id (UUID) for direct rule lookup.
   * FALLBACK: Uses card_type_id (TEXT) for backward compatibility.
   *
   * @param paymentMethod The payment method to get rules for
   * @returns Promise resolving to array of applicable reward rules
   */
  private async getRulesForPaymentMethod(
    paymentMethod: PaymentMethod
  ): Promise<RewardRule[]> {
    // Require card_catalog_id for rule lookup
    if (!paymentMethod.cardCatalogId) {
      logger.warn(
        "getRulesForPaymentMethod",
        "Payment method has no cardCatalogId - cannot fetch rules",
        {
          paymentMethodId: paymentMethod.id,
          issuer: paymentMethod.issuer,
          name: paymentMethod.name,
        }
      );
      return [];
    }

    try {
      const rules = await this.ruleRepository.getRulesForCardCatalogId(
        paymentMethod.cardCatalogId
      );
      logger.info(
        "getRulesForPaymentMethod",
        "Fetched rules via cardCatalogId",
        {
          paymentMethodId: paymentMethod.id,
          cardCatalogId: paymentMethod.cardCatalogId,
          rulesCount: rules?.length ?? 0,
        }
      );
      return rules ?? [];
    } catch (error) {
      logger.error(
        "getRulesForPaymentMethod",
        "Failed to fetch rules by cardCatalogId",
        {
          paymentMethodId: paymentMethod.id,
          cardCatalogId: paymentMethod.cardCatalogId,
          error: error instanceof Error ? error.message : String(error),
        }
      );
      return [];
    }
  }

  /**
   * Get the amount to use for points calculations.
   *
   * CRITICAL RULE: When transaction currency != payment currency,
   * ALWAYS use convertedAmount (the payment/statement currency amount).
   *
   * Points are calculated on what appears on the card statement,
   * NOT the original transaction amount in foreign currency.
   *
   * Example: $100 USD transaction → $135 SGD on statement → calculate points on $135
   *
   * @returns convertedAmount if available, otherwise falls back to transaction amount
   */
  private getCalculationAmount(input: CalculationInput): number {
    // ALWAYS use convertedAmount when available - this is the amount in card currency
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

      // Log calculation start (Requirement 4.1)
      logger.info("calculateRewards", "Starting reward calculation", {
        paymentMethodId: input.paymentMethod.id,
        cardCatalogId: input.paymentMethod.cardCatalogId,
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

      // 1. Find rules for this payment method (prefers card_catalog_id, falls back to card_type_id)
      const allRules = await this.getRulesForPaymentMethod(input.paymentMethod);

      // Log number of rules retrieved (Requirement 4.2)
      logger.info("calculateRewards", "Retrieved rules from repository", {
        paymentMethodId: input.paymentMethod.id,
        cardCatalogId: input.paymentMethod.cardCatalogId,
        totalRules: allRules?.length || 0,
        enabledRules: allRules?.filter((r) => r.enabled).length || 0,
      });

      if (!allRules || allRules.length === 0) {
        logger.warn("calculateRewards", "No reward rules found", {
          paymentMethodId: input.paymentMethod.id,
          cardCatalogId: input.paymentMethod.cardCatalogId,
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

      // Get transaction date for validity check
      const transactionDate = input.date
        ? input.date instanceof Date
          ? input.date
          : input.date.toJSDate()
        : new Date();

      // 3. Filter rules by enabled status, date validity, and evaluate conditions
      const applicableRules = allRules
        .filter((rule) => rule.enabled)
        .filter((rule) => this.isRuleValidForDate(rule, transactionDate))
        .filter((rule) => this.evaluateConditions(rule.conditions, input));

      logger.info("calculateRewards", "Filtered applicable rules", {
        totalRules: allRules.length,
        enabledRules: allRules.filter((r) => r.enabled).length,
        applicableRules: applicableRules.length,
      });

      if (applicableRules.length === 0) {
        logger.warn("calculateRewards", "No applicable rules found", {
          paymentMethodId: input.paymentMethod.id,
          cardCatalogId: input.paymentMethod.cardCatalogId,
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
        // Track whether we used total_first method (bonus already calculated)
        let totalFirstUsed = false;

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
          case "total_first": {
            // Amex Canada formula: calculate total first, then derive bonus
            // total_points = round(amount * totalMultiplier)
            // base_points = round(amount * baseMultiplier)
            // bonus_points = total_points - base_points
            const totalMultiplier =
              rule.reward.baseMultiplier + rule.reward.bonusMultiplier;

            const calculatedTotalPoints = this.calculateStandardPoints(
              calculationAmount,
              totalMultiplier,
              rule.reward.pointsRoundingStrategy,
              rule.reward.blockSize,
              rule.reward.amountRoundingStrategy
            );

            basePoints = this.calculateStandardPoints(
              calculationAmount,
              rule.reward.baseMultiplier,
              rule.reward.pointsRoundingStrategy,
              rule.reward.blockSize,
              rule.reward.amountRoundingStrategy
            );

            bonusPoints = calculatedTotalPoints - basePoints;
            totalFirstUsed = true;

            logger.debug("calculateRewards", "Total-first calculation (Amex)", {
              calculationAmount,
              totalMultiplier,
              baseMultiplier: rule.reward.baseMultiplier,
              calculatedTotalPoints,
              basePoints,
              bonusPoints,
            });
            break;
          }
          case "tiered": {
            const { points: tieredPoints, tier } = this.calculateTieredPoints(
              calculationAmount,
              rule.reward.bonusTiers,
              input.monthlySpend,
              rule.reward.pointsRoundingStrategy,
              rule.reward.blockSize,
              rule.reward.amountRoundingStrategy
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

        // 4. Calculate bonus points (skip for total_first as bonus is already derived)
        // Check for compound bonus multipliers first (each multiplier rounded separately, then summed)
        if (
          !totalFirstUsed &&
          rule.reward.compoundBonusMultipliers &&
          rule.reward.compoundBonusMultipliers.length > 0
        ) {
          // Compound bonus: each multiplier is calculated and rounded separately, then summed
          // Example: [1.5, 2.5] for $25 = round(25*1.5) + round(25*2.5) = 38 + 63 = 101
          let compoundBonusTotal = 0;
          for (const multiplier of rule.reward.compoundBonusMultipliers) {
            const componentBonus = this.calculateBonusPoints(
              calculationAmount,
              multiplier,
              rule.reward.pointsRoundingStrategy,
              rule.reward.blockSize,
              rule.reward.amountRoundingStrategy
            );
            compoundBonusTotal += componentBonus;
          }
          bonusPoints += compoundBonusTotal;

          logger.debug("calculateRewards", "Compound bonus points calculated", {
            calculationAmount,
            compoundBonusMultipliers: rule.reward.compoundBonusMultipliers,
            compoundBonusTotal,
            totalBonusPoints: bonusPoints,
          });
        } else if (!totalFirstUsed && rule.reward.bonusMultiplier > 0) {
          // Standard bonus: single multiplier
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

        // 5. Apply monthly cap (supports both bonus_points and spend_amount cap types)
        let remainingMonthlyBonusPoints: number | undefined;
        if (rule.reward.monthlyCap !== undefined) {
          const cap = rule.reward.monthlyCap;
          const capType = rule.reward.monthlyCapType || "bonus_points";
          const capGroupId = rule.reward.capGroupId;

          const periodType = rule.reward.capDuration || "calendar_month";
          const date = input.date
            ? input.date instanceof Date
              ? input.date
              : input.date.toJSDate()
            : new Date();

          // For promotional periods, use validFrom as the period start date
          const promoStartDate =
            periodType === "promotional_period" ? rule.validFrom : undefined;

          if (capType === "spend_amount") {
            // Cap is on spend amount - track how much has been spent
            let usedSpendAmount = 0;

            if (rule.id && input.paymentMethod.id) {
              try {
                usedSpendAmount = await bonusPointsTracker.getUsedBonusPoints(
                  rule.id,
                  input.paymentMethod.id,
                  periodType,
                  date,
                  1,
                  capGroupId,
                  "spend_amount",
                  promoStartDate
                );
              } catch (error) {
                console.warn(
                  "Failed to get spend amount usage from tracker",
                  error
                );
              }
            }

            const availableSpendAmount = Math.max(0, cap - usedSpendAmount);

            if (availableSpendAmount <= 0) {
              // No more eligible spend - no bonus points
              bonusPoints = 0;
              messages.push("Monthly spend cap reached for bonus category");
            } else if (calculationAmount > availableSpendAmount) {
              // Partial eligibility - recalculate bonus for eligible portion only
              const eligibleAmount = availableSpendAmount;
              bonusPoints = this.calculateBonusPoints(
                eligibleAmount,
                rule.reward.bonusMultiplier,
                rule.reward.pointsRoundingStrategy,
                rule.reward.blockSize,
                rule.reward.amountRoundingStrategy
              );
              messages.push(
                `Only $${eligibleAmount.toFixed(2)} of $${calculationAmount.toFixed(2)} eligible for bonus (monthly spend cap)`
              );
            }
            // For spend_amount cap, remainingMonthlyBonusPoints represents remaining eligible spend
            remainingMonthlyBonusPoints = Math.max(
              0,
              availableSpendAmount -
                Math.min(calculationAmount, availableSpendAmount)
            );
          } else {
            // Cap is on bonus points (default behavior)
            let usedBonusPoints = 0;

            // If usedBonusPoints is provided in input, use that (for testing or when caller knows the value)
            if (input.usedBonusPoints !== undefined) {
              usedBonusPoints = input.usedBonusPoints;
            } else if (rule.id && input.paymentMethod.id) {
              try {
                usedBonusPoints = await bonusPointsTracker.getUsedBonusPoints(
                  rule.id,
                  input.paymentMethod.id,
                  periodType,
                  date,
                  1,
                  capGroupId,
                  "bonus_points",
                  promoStartDate
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
            let uncappedBonusPoints: number;
            if (totalFirstUsed) {
              // For total_first: uncapped bonus = total - base (same formula used above)
              const totalMultiplier =
                rule.reward.baseMultiplier + rule.reward.bonusMultiplier;
              const uncappedTotal = this.calculateStandardPoints(
                calculationAmount,
                totalMultiplier,
                rule.reward.pointsRoundingStrategy,
                rule.reward.blockSize,
                rule.reward.amountRoundingStrategy
              );
              const uncappedBase = this.calculateStandardPoints(
                calculationAmount,
                rule.reward.baseMultiplier,
                rule.reward.pointsRoundingStrategy,
                rule.reward.blockSize,
                rule.reward.amountRoundingStrategy
              );
              uncappedBonusPoints = uncappedTotal - uncappedBase;
            } else {
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
              uncappedBonusPoints = Math.floor(
                roundedAmountForComparison * rule.reward.bonusMultiplier
              );
            }

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
        }

        totalPoints = basePoints + bonusPoints;

        // Points currency comes from the payment method, not the rule
        const resolvedPointsCurrency =
          input.paymentMethod.pointsCurrency || "points";

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
          pointsCurrency: resolvedPointsCurrency,
          appliedTier: appliedTier?.name,
          monthlyCap: rule.reward.monthlyCap,
          remainingMonthlyBonusPoints,
        });

        return {
          totalPoints,
          basePoints,
          bonusPoints,
          pointsCurrency: resolvedPointsCurrency,
          remainingMonthlyBonusPoints,
          minSpendMet,
          appliedRule,
          appliedRuleId: rule.id,
          appliedTier,
          monthlyCap: rule.reward.monthlyCap,
          periodType: rule.reward.monthlySpendPeriodType,
          messages,
        };
      }

      // If no rule was successfully applied
      logger.warn("calculateRewards", "No rule successfully applied", {
        paymentMethodId: input.paymentMethod.id,
        cardCatalogId: input.paymentMethod.cardCatalogId,
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
    monthlySpend?: number,
    roundingStrategy: string = "floor",
    blockSize: number = 1,
    amountRoundingStrategy: string = "none"
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

      const points = this.calculateStandardPoints(
        amount,
        tier.multiplier,
        roundingStrategy,
        blockSize,
        amountRoundingStrategy
      );
      appliedTier = tier;
      return { points, tier: appliedTier };
    }

    return { points: 0, tier: appliedTier };
  }

  /**
   * Check if a rule is valid for a given transaction date
   * Returns true if the date falls within the rule's validFrom/validUntil range
   */
  private isRuleValidForDate(rule: RewardRule, transactionDate: Date): boolean {
    // If no date restrictions, rule is always valid
    if (!rule.validFrom && !rule.validUntil) {
      return true;
    }

    // Check validFrom - transaction must be on or after this date
    if (rule.validFrom && transactionDate < rule.validFrom) {
      logger.debug("isRuleValidForDate", "Rule not yet valid", {
        ruleId: rule.id,
        ruleName: rule.name,
        validFrom: rule.validFrom.toISOString(),
        transactionDate: transactionDate.toISOString(),
      });
      return false;
    }

    // Check validUntil - transaction must be on or before this date
    // We compare with end of day to include the entire last day
    if (rule.validUntil) {
      const endOfValidDay = new Date(rule.validUntil);
      endOfValidDay.setHours(23, 59, 59, 999);
      if (transactionDate > endOfValidDay) {
        logger.debug("isRuleValidForDate", "Rule has expired", {
          ruleId: rule.id,
          ruleName: rule.name,
          validUntil: rule.validUntil.toISOString(),
          transactionDate: transactionDate.toISOString(),
        });
        return false;
      }
    }

    return true;
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
      case "not_equals":
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
    // Get monthly spending for accurate bonus point calculations
    let monthlySpend = 0;
    try {
      const { MonthlySpendingTracker } = await import(
        "./MonthlySpendingTracker"
      );
      const tracker = MonthlySpendingTracker.getInstance();
      monthlySpend = await tracker.getMonthlySpending(
        paymentMethod.id,
        "calendar_month",
        new Date(),
        1
      );
    } catch (error) {
      console.warn("Failed to get monthly spending for simulation:", error);
      // Continue with monthlySpend = 0
    }

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
      monthlySpend,
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
  // If we have a properly initialized instance, return it
  if (rewardServiceInstance) {
    return rewardServiceInstance;
  }

  // Try to initialize with the real repository
  try {
    const ruleRepository = getRuleRepository();
    rewardServiceInstance = new RewardService(ruleRepository);
    console.log("✅ RewardService initialized with real RuleRepository");
    return rewardServiceInstance;
  } catch (error) {
    console.warn(
      "⚠️ RuleRepository not initialized, creating temporary mock RewardService (will retry on next call)"
    );
    // Create a mock repository for fallback - but DON'T cache it!
    // This allows subsequent calls to use the real repository once initialized
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
    // Return a temporary service WITHOUT caching it
    return new RewardService(mockRepository);
  }
}

// Export as a getter property to ensure lazy initialization
export const rewardService = new Proxy({} as RewardService, {
  get(_target, prop) {
    const service = getRewardService();
    const value = service[prop as keyof RewardService];
    return typeof value === "function" ? value.bind(service) : value;
  },
});
