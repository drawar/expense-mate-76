import { RewardRule, BonusTier, CalculationMethod, RoundingStrategy, SpendingPeriodType } from './types';
import { DateTime } from 'luxon';
import { DbRewardRule } from './types';


function isCalculationMethod(value: string | undefined | null): value is CalculationMethod {
  return value === 'standard' || value === 'direct';
}

function isRoundingStrategy(value: string | undefined | null): value is RoundingStrategy {
  return value === 'floor5' || value === 'nearest' || value === 'ceiling' || value === 'floor' || value === 'none';
}

function isSpendingPeriodType(value: string | undefined | null): value is SpendingPeriodType {
  return value === 'statement_month' || value === 'calendar_month';
}

/**
 * Converts a raw database rule into an app-level RewardRule object.
 * @param dbRule The raw rule from Supabase.
 * @returns A parsed and structured RewardRule.
 */
export function mapDbRuleToRewardRule(dbRule: DbRewardRule): RewardRule {
	// Ensures the conditions field is parsed into a usable JS object (from stringified JSON)
  const conditions = typeof dbRule.conditions === 'string'
    ? JSON.parse(dbRule.conditions)
    : dbRule.conditions || [];

  let bonusTiers: BonusTier[] | undefined;

  if (dbRule.bonus_tiers) {
    try {
      bonusTiers = typeof dbRule.bonus_tiers === 'string'
        ? JSON.parse(dbRule.bonus_tiers)
        : dbRule.bonus_tiers;

      if (bonusTiers) {
        bonusTiers = bonusTiers.map((tier: any) => {
          if (
						tier.condition?.type === 'compound' && 
						typeof tier.condition.subConditions === 'string'
					) {
            tier.condition.subConditions = JSON.parse(tier.condition.subConditions);
          }
          return tier;
        });
      }
    } catch (e) {
      console.error('Error parsing bonus tiers:', e);
    }
  }

  return {
    id: dbRule.id,
    cardTypeId: dbRule.card_type_id,
    name: dbRule.name,
    description: dbRule.description || '',
    enabled: dbRule.enabled,
    priority: dbRule.priority || 0,
    conditions,
    reward: {
      calculationMethod: isCalculationMethod(dbRule.calculation_method) ? dbRule.calculation_method : 'standard',
      baseMultiplier: dbRule.base_multiplier || 0,
      bonusMultiplier: dbRule.bonus_multiplier || 0,
      pointsRoundingStrategy: isRoundingStrategy(dbRule.points_rounding_strategy) ? dbRule.points_rounding_strategy : 'floor',
      amountRoundingStrategy: isRoundingStrategy(dbRule.amount_rounding_strategy) ? dbRule.amount_rounding_strategy : 'floor',
      blockSize: dbRule.block_size || 1,
      bonusTiers,
      monthlyCap: dbRule.monthly_cap,
      monthlyMinSpend: dbRule.monthly_min_spend,
      monthlySpendPeriodType: isSpendingPeriodType(dbRule.monthly_spend_period_type) ? dbRule.monthly_spend_period_type : 'calendar_month',
      pointsCurrency: dbRule.points_currency || 'Points'
    },
    createdAt: DateTime.fromISO(dbRule.created_at),
    updatedAt: DateTime.fromISO(dbRule.updated_at ?? dbRule.created_at),
  };
}


/**
 * Converts an app-level RewardRule into a database-ready DbRewardRule.
 * @param rule The structured RewardRule object.
 * @returns A raw DbRewardRule formatted for Supabase.
 */
export function mapRewardRuleToDbRule(rule: RewardRule): any {
  return {
    id: rule.id,
    card_type_id: rule.cardTypeId,
    name: rule.name,
    description: rule.description,
    enabled: rule.enabled,
    priority: rule.priority,
    conditions: JSON.stringify(rule.conditions),
    calculation_method: rule.reward.calculationMethod,
    base_multiplier: rule.reward.baseMultiplier,
    bonus_multiplier: rule.reward.bonusMultiplier,
    points_rounding_strategy: rule.reward.pointsRoundingStrategy,
    amount_rounding_strategy: rule.reward.amountRoundingStrategy,
    block_size: rule.reward.blockSize,
    bonus_tiers: rule.reward.bonusTiers ? JSON.stringify(rule.reward.bonusTiers) : null,
    monthly_cap: rule.reward.monthlyCap,
    monthly_min_spend: rule.reward.monthlyMinSpend,
    monthly_spend_period_type: rule.reward.monthlySpendPeriodType,
    points_currency: rule.reward.pointsCurrency,
    created_at: rule.createdAt.toISO(),
    updated_at: rule.updatedAt.toISO(),
  };
}


