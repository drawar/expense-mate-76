
import { RewardRule, DbRewardRule, RuleCondition, BonusTier } from './types';

export class RuleMapper {
  mapDbRuleToRewardRule(dbRule: DbRewardRule): RewardRule {
    const conditions = typeof dbRule.conditions === 'string' 
      ? JSON.parse(dbRule.conditions) 
      : dbRule.conditions || [];
    
    const bonusTiers = typeof dbRule.bonus_tiers === 'string'
      ? JSON.parse(dbRule.bonus_tiers)
      : dbRule.bonus_tiers || [];

    return {
      id: dbRule.id,
      cardTypeId: dbRule.card_type_id,
      name: dbRule.name,
      description: dbRule.description || '',
      enabled: dbRule.enabled,
      priority: dbRule.priority || 0,
      conditions: conditions as RuleCondition[],
      reward: {
        calculationMethod: (dbRule.calculation_method || 'standard') as any,
        baseMultiplier: parseFloat(dbRule.base_multiplier?.toString() || '1'),
        bonusMultiplier: parseFloat(dbRule.bonus_multiplier?.toString() || '0'),
        pointsRoundingStrategy: (dbRule.points_rounding_strategy || 'nearest') as any,
        amountRoundingStrategy: (dbRule.amount_rounding_strategy || 'floor') as any,
        blockSize: parseFloat(dbRule.block_size?.toString() || '1'),
        bonusTiers: bonusTiers as BonusTier[],
        monthlyCap: dbRule.monthly_cap,
        monthlyMinSpend: dbRule.monthly_min_spend,
        monthlySpendPeriodType: dbRule.monthly_spend_period_type as any,
        pointsCurrency: dbRule.points_currency || 'points'
      },
      createdAt: new Date(dbRule.created_at),
      updatedAt: new Date(dbRule.updated_at || dbRule.created_at)
    };
  }

  mapRewardRuleToDbRule(rule: RewardRule): Omit<DbRewardRule, 'created_at' | 'updated_at'> {
    return {
      id: rule.id,
      card_type_id: rule.cardTypeId,
      name: rule.name,
      description: rule.description,
      enabled: rule.enabled,
      priority: rule.priority,
      conditions: JSON.stringify(rule.conditions),
      bonus_tiers: JSON.stringify(rule.reward.bonusTiers || []),
      calculation_method: rule.reward.calculationMethod,
      base_multiplier: rule.reward.baseMultiplier,
      bonus_multiplier: rule.reward.bonusMultiplier,
      points_rounding_strategy: rule.reward.pointsRoundingStrategy,
      amount_rounding_strategy: rule.reward.amountRoundingStrategy,
      block_size: rule.reward.blockSize,
      monthly_cap: rule.reward.monthlyCap,
      monthly_min_spend: rule.reward.monthlyMinSpend,
      monthly_spend_period_type: rule.reward.monthlySpendPeriodType,
      points_currency: rule.reward.pointsCurrency
    };
  }
}
