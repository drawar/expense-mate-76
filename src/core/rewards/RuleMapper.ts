import { RewardRule, DbRewardRule, RuleCondition, BonusTier } from "./types";

/**
 * RuleMapper handles bidirectional mapping between database and application reward rule formats.
 *
 * The mapper ensures type safety and data integrity when converting between:
 * - Database format (snake_case, JSON strings, nullable fields)
 * - Application format (camelCase, typed objects, optional fields)
 *
 * @example
 * ```typescript
 * const mapper = new RuleMapper();
 *
 * // Map from database to application
 * const appRule = mapper.mapDbRuleToRewardRule(dbRule);
 *
 * // Map from application to database
 * const dbRule = mapper.mapRewardRuleToDbRule(appRule);
 * ```
 */
export class RuleMapper {
  /**
   * Maps a database reward rule to an application reward rule.
   *
   * Handles:
   * - JSON parsing for conditions and bonus_tiers
   * - Null to undefined conversion
   * - Default values for missing fields
   * - Type coercion for numeric fields
   * - Date parsing for timestamps
   *
   * @param dbRule - The database reward rule to map
   * @returns The mapped application reward rule
   *
   * @example
   * ```typescript
   * const dbRule = {
   *   id: '123',
   *   card_type_id: 'amex-gold',
   *   name: 'Grocery Bonus',
   *   conditions: '[{"type":"mcc","operation":"include","values":["5411"]}]',
   *   // ... other fields
   * };
   *
   * const appRule = mapper.mapDbRuleToRewardRule(dbRule);
   * // appRule.conditions is now a typed array
   * ```
   */
  mapDbRuleToRewardRule(dbRule: DbRewardRule): RewardRule {
    // Parse conditions - handle both string and object formats
    let conditions: RuleCondition[] = [];
    if (dbRule.conditions) {
      if (typeof dbRule.conditions === "string") {
        try {
          conditions = JSON.parse(dbRule.conditions);
        } catch (e) {
          console.error("Failed to parse conditions:", e);
          conditions = [];
        }
      } else {
        conditions = dbRule.conditions as RuleCondition[];
      }
    }

    // Parse bonus_tiers - handle both string and object formats
    let bonusTiers: BonusTier[] = [];
    if (dbRule.bonus_tiers) {
      if (typeof dbRule.bonus_tiers === "string") {
        try {
          bonusTiers = JSON.parse(dbRule.bonus_tiers);
        } catch (e) {
          console.error("Failed to parse bonus_tiers:", e);
          bonusTiers = [];
        }
      } else {
        bonusTiers = dbRule.bonus_tiers as BonusTier[];
      }
    }

    // Parse numeric fields safely
    const parseNumeric = (value: unknown, defaultValue: number): number => {
      if (value === null || value === undefined) return defaultValue;
      const parsed = parseFloat(String(value));
      return isNaN(parsed) ? defaultValue : parsed;
    };

    return {
      id: dbRule.id,
      cardTypeId: dbRule.card_type_id,
      name: dbRule.name,
      description: dbRule.description || "",
      enabled: dbRule.enabled ?? true,
      priority: dbRule.priority ?? 0,
      conditions,
      reward: {
        calculationMethod: (dbRule.calculation_method || "standard") as
          | "standard"
          | "tiered"
          | "flat_rate"
          | "direct",
        baseMultiplier: parseNumeric(dbRule.base_multiplier, 1),
        bonusMultiplier: parseNumeric(dbRule.bonus_multiplier, 0),
        pointsRoundingStrategy: (dbRule.points_rounding_strategy ||
          "nearest") as "floor" | "ceiling" | "nearest",
        amountRoundingStrategy: (dbRule.amount_rounding_strategy || "floor") as
          | "floor"
          | "ceiling"
          | "nearest"
          | "floor5"
          | "none",
        blockSize: parseNumeric(dbRule.block_size, 1),
        bonusTiers,
        monthlyCap:
          dbRule.monthly_cap !== null && dbRule.monthly_cap !== undefined
            ? parseNumeric(dbRule.monthly_cap, 0)
            : undefined,
        monthlyCapType:
          dbRule.monthly_cap_type !== null &&
          dbRule.monthly_cap_type !== undefined
            ? (dbRule.monthly_cap_type as "bonus_points" | "spend_amount")
            : undefined,
        monthlyMinSpend:
          dbRule.monthly_min_spend !== null &&
          dbRule.monthly_min_spend !== undefined
            ? parseNumeric(dbRule.monthly_min_spend, 0)
            : undefined,
        monthlySpendPeriodType:
          dbRule.monthly_spend_period_type !== null &&
          dbRule.monthly_spend_period_type !== undefined
            ? (dbRule.monthly_spend_period_type as
                | "calendar"
                | "statement"
                | "statement_month")
            : undefined,
        pointsCurrency: dbRule.points_currency || "points",
        capGroupId: dbRule.cap_group_id || undefined,
      },
      validFrom: dbRule.valid_from ? new Date(dbRule.valid_from) : undefined,
      validUntil: dbRule.valid_until ? new Date(dbRule.valid_until) : undefined,
      createdAt: new Date(dbRule.created_at),
      updatedAt: new Date(dbRule.updated_at || dbRule.created_at),
    };
  }

  /**
   * Maps an application reward rule to a database reward rule.
   *
   * Handles:
   * - JSON serialization for conditions and bonus_tiers
   * - Undefined to null conversion
   * - Field name conversion (camelCase to snake_case)
   * - Type coercion for database compatibility
   *
   * Note: created_at and updated_at are omitted and should be added by the caller.
   *
   * @param rule - The application reward rule to map
   * @returns The mapped database reward rule (without timestamps)
   *
   * @example
   * ```typescript
   * const appRule = {
   *   id: '123',
   *   cardTypeId: 'amex-gold',
   *   name: 'Grocery Bonus',
   *   conditions: [{ type: 'mcc', operation: 'include', values: ['5411'] }],
   *   // ... other fields
   * };
   *
   * const dbRule = mapper.mapRewardRuleToDbRule(appRule);
   * // dbRule.conditions is now a JSON string
   * // Add timestamps before inserting to database
   * ```
   */
  mapRewardRuleToDbRule(
    rule: RewardRule
  ): Omit<DbRewardRule, "created_at" | "updated_at"> {
    return {
      id: rule.id,
      card_type_id: rule.cardTypeId,
      name: rule.name,
      description: rule.description || null,
      enabled: rule.enabled ?? true,
      priority: rule.priority ?? 0,
      conditions: JSON.stringify(rule.conditions || []),
      bonus_tiers: JSON.stringify(rule.reward.bonusTiers || []),
      calculation_method: rule.reward.calculationMethod || "standard",
      base_multiplier: rule.reward.baseMultiplier ?? 1,
      bonus_multiplier: rule.reward.bonusMultiplier ?? 0,
      points_rounding_strategy: rule.reward.pointsRoundingStrategy || "nearest",
      amount_rounding_strategy: rule.reward.amountRoundingStrategy || "floor",
      block_size: rule.reward.blockSize ?? 1,
      monthly_cap: rule.reward.monthlyCap ?? null,
      monthly_cap_type: rule.reward.monthlyCapType ?? null,
      monthly_min_spend: rule.reward.monthlyMinSpend ?? null,
      monthly_spend_period_type: rule.reward.monthlySpendPeriodType ?? null,
      points_currency: rule.reward.pointsCurrency || "points",
      cap_group_id: rule.reward.capGroupId ?? null,
      valid_from: rule.validFrom ? rule.validFrom.toISOString() : null,
      valid_until: rule.validUntil ? rule.validUntil.toISOString() : null,
    };
  }
}
