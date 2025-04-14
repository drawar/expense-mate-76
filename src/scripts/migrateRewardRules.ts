
// scripts/migrateRewardRules.ts

import { supabase } from '@/integrations/supabase/client';
import { CardRuleService } from '@/components/expense/cards/CardRuleService';
import { 
  TransactionType, 
  RewardRule, 
  RuleCondition,
  CalculationMethod
} from '@/core/rewards/types';
import { v4 as uuidv4 } from 'uuid';

/**
 * Migrates existing card rules to the new reward rules system
 */
async function migrateRewardRules() {
  console.log('Starting migration of reward rules...');
  
  try {
    // Step 1: Load existing rules
    const cardRuleService = CardRuleService;
    await cardRuleService.migrateRules();
    const oldRules = await cardRuleService.getDefaultRules();
    
    console.log(`Found ${oldRules.length} old rules to migrate`);
    
    // Step 2: Convert old rules to new format
    const newRules: RewardRule[] = [];
    
    for (const oldRule of oldRules) {
      const cardTypeId = oldRule.cardType.toLowerCase();
      
      // Skip already migrated rules
      const { data: existingRule } = await supabase
        .from('reward_rules')
        .select('id')
        .eq('name', oldRule.name)
        .eq('card_type_id', cardTypeId)
        .maybeSingle();
        
      if (existingRule) {
        console.log(`Rule "${oldRule.name}" already migrated, skipping`);
        continue;
      }
      
      console.log(`Migrating rule: ${oldRule.name} for card type: ${cardTypeId}`);
      
      // Convert old rule to new format
      const newRule = convertOldRuleToNew(oldRule, cardTypeId);
      newRules.push(newRule);
    }
    
    // Step 3: Save new rules to database
    if (newRules.length > 0) {
      const dbRules = newRules.map(mapRewardRuleToDbRule);
      
      const { error } = await supabase
        .from('reward_rules')
        .insert(dbRules);
        
      if (error) {
        console.error('Error inserting new rules:', error);
        return;
      }
      
      console.log(`Successfully migrated ${newRules.length} rules`);
    } else {
      console.log('No rules to migrate');
    }
  } catch (error) {
    console.error('Error during migration:', error);
  }
}

/**
 * Convert old rule format to new format
 */
function convertOldRuleToNew(oldRule: any, cardTypeId: string): RewardRule {
  // Extract key information from old rule
  const calculationMethod = determineCalculationMethod(oldRule);
  const blockSize = oldRule.rounding === 'floor5' ? 5 : 1;
  
  // Create conditions
  const conditions: RuleCondition[] = [];
  
  // Check for online transactions
  if (oldRule.is_online_only) {
    conditions.push({
      type: 'transaction_type',
      operation: 'equals',
      values: [TransactionType.ONLINE]
    });
  }
  
  // Check for contactless transactions
  if (oldRule.is_contactless_only) {
    conditions.push({
      type: 'transaction_type',
      operation: 'equals',
      values: [TransactionType.CONTACTLESS]
    });
  }
  
  // Check for included MCCs
  if (oldRule.included_mccs && oldRule.included_mccs.length > 0) {
    conditions.push({
      type: 'mcc',
      operation: 'include',
      values: oldRule.included_mccs
    });
  }
  
  // Check for excluded MCCs
  if (oldRule.excluded_mccs && oldRule.excluded_mccs.length > 0) {
    conditions.push({
      type: 'mcc',
      operation: 'exclude',
      values: oldRule.excluded_mccs
    });
  }
  
  // Check for currency restrictions
  if (oldRule.currency_restrictions && oldRule.currency_restrictions.length > 0) {
    const excludedCurrencies = oldRule.currency_restrictions
      .filter((curr: string) => curr.startsWith('!'))
      .map((curr: string) => curr.substring(1));
    
    const includedCurrencies = oldRule.currency_restrictions
      .filter((curr: string) => !curr.startsWith('!'));
    
    if (excludedCurrencies.length > 0) {
      conditions.push({
        type: 'currency',
        operation: 'exclude',
        values: excludedCurrencies
      });
    }
    
    if (includedCurrencies.length > 0) {
      conditions.push({
        type: 'currency',
        operation: 'include',
        values: includedCurrencies
      });
    }
  }
  
  // Extract pointsCurrency from custom_params
  let pointsCurrency = 'Points';
  if (oldRule.custom_params) {
    try {
      const customParams = typeof oldRule.custom_params === 'string' 
        ? JSON.parse(oldRule.custom_params) 
        : oldRule.custom_params;
      
      if (customParams && typeof customParams === 'object' && customParams.pointsCurrency) {
        pointsCurrency = customParams.pointsCurrency;
      }
    } catch (e) {
      console.error('Error parsing custom_params:', e);
    }
  }
  
  // Create new rule
  return {
    id: uuidv4(),
    cardTypeId,
    name: oldRule.name,
    description: oldRule.description || '',
    enabled: oldRule.enabled,
    priority: 10, // Default priority
    conditions,
    reward: {
      calculationMethod,
      baseMultiplier: oldRule.base_point_rate,
      bonusMultiplier: oldRule.bonus_point_rate,
      pointsRoundingStrategy: 'floor',
      amountRoundingStrategy: oldRule.rounding || 'floor',
      blockSize,
      monthlyCap: oldRule.monthly_cap,
      pointsCurrency
    },
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

/**
 * Determine calculation method based on old rule
 */
function determineCalculationMethod(oldRule: any): CalculationMethod {
  // UOB cards typically use standard method with floor5 rounding
  if (oldRule.cardType.toLowerCase().includes('uob')) {
    return 'standard';
  }
  
  // Citibank cards typically use direct method
  if (oldRule.cardType.toLowerCase().includes('citibank')) {
    return 'direct';
  }
  
  // Default to standard
  return 'standard';
}

/**
 * Map RewardRule to database format
 */
function mapRewardRuleToDbRule(rule: RewardRule): any {
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
    created_at: rule.createdAt.toISOString(),
    updated_at: rule.updatedAt.toISOString()
  };
}

// Run migration
migrateRewardRules()
  .then(() => {
    console.log('Migration completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
