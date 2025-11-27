// scripts/migrateRewardRules.ts

import { supabase } from "@/integrations/supabase/client";
import { CardRuleService } from "@/components/expense/cards/CardRuleService";
import {
  TransactionTypeValues,
  RewardRule,
  RuleCondition,
  CalculationMethod,
} from "@/core/rewards/types";
import { RuleMapper } from "@/core/rewards/RuleMapper";
import { v4 as uuidv4 } from "uuid";

/**
 * Migrates existing card rules to the new reward rules system
 */
async function migrateRewardRules() {
  console.log("Starting migration of reward rules...");

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
        .from("reward_rules")
        .select("id")
        .eq("name", oldRule.name)
        .eq("card_type_id", cardTypeId)
        .maybeSingle();

      if (existingRule) {
        console.log(`Rule "${oldRule.name}" already migrated, skipping`);
        continue;
      }

      console.log(
        `Migrating rule: ${oldRule.name} for card type: ${cardTypeId}`
      );

      // Convert old rule to new format
      const newRule = convertOldRuleToNew(oldRule, cardTypeId);
      newRules.push(newRule);
    }

    // Step 3: Save new rules to database
    if (newRules.length > 0) {
      const ruleMapper = new RuleMapper();
      const dbRules = newRules.map((rule) => {
        const dbRule = ruleMapper.mapRewardRuleToDbRule(rule);
        return {
          ...dbRule,
          created_at: rule.createdAt.toISOString(),
          updated_at: rule.updatedAt.toISOString(),
        };
      });

      const { error } = await supabase.from("reward_rules").insert(dbRules as any);

      if (error) {
        console.error("Error inserting new rules:", error);
        return;
      }

      console.log(`Successfully migrated ${newRules.length} rules`);
    } else {
      console.log("No rules to migrate");
    }
  } catch (error) {
    console.error("Error during migration:", error);
  }
}

/**
 * Convert old rule format to new format
 */
function convertOldRuleToNew(
  oldRule: Record<string, unknown>,
  cardTypeId: string
): RewardRule {
  // Extract key information from old rule
  const calculationMethod = determineCalculationMethod(oldRule);
  const blockSize = oldRule.rounding === "floor5" ? 5 : 1;

  // Create conditions
  const conditions: RuleCondition[] = [];

  // Check for online transactions
  if (oldRule.is_online_only) {
    conditions.push({
      type: "transaction_type",
      operation: "equals",
      values: [TransactionTypeValues.online],
    });
  }

  // Check for contactless transactions
  if (oldRule.is_contactless_only) {
    conditions.push({
      type: "transaction_type",
      operation: "equals",
      values: [TransactionTypeValues.contactless],
    });
  }

  // Check for included MCCs
  if (oldRule.included_mccs && Array.isArray(oldRule.included_mccs) && oldRule.included_mccs.length > 0) {
    conditions.push({
      type: "mcc",
      operation: "include",
      values: oldRule.included_mccs as (string | number)[],
    });
  }

  // Check for excluded MCCs
  if (oldRule.excluded_mccs && Array.isArray(oldRule.excluded_mccs) && oldRule.excluded_mccs.length > 0) {
    conditions.push({
      type: "mcc",
      operation: "exclude",
      values: oldRule.excluded_mccs as (string | number)[],
    });
  }

  // Check for currency restrictions
  if (
    oldRule.currency_restrictions &&
    Array.isArray(oldRule.currency_restrictions) &&
    oldRule.currency_restrictions.length > 0
  ) {
    const excludedCurrencies = oldRule.currency_restrictions
      .filter((curr: any) => typeof curr === 'string' && curr.startsWith("!"))
      .map((curr: any) => curr.substring(1));

    const includedCurrencies = oldRule.currency_restrictions.filter(
      (curr: any) => typeof curr === 'string' && !curr.startsWith("!")
    );

    if (excludedCurrencies.length > 0) {
      conditions.push({
        type: "currency",
        operation: "exclude",
        values: excludedCurrencies as (string | number)[],
      });
    }

    if (includedCurrencies.length > 0) {
      conditions.push({
        type: "currency",
        operation: "include",
        values: includedCurrencies as (string | number)[],
      });
    }
  }

  // Extract pointsCurrency from custom_params
  let pointsCurrency = "Points";
  if (oldRule.custom_params) {
    try {
      const customParams =
        typeof oldRule.custom_params === "string"
          ? JSON.parse(oldRule.custom_params)
          : oldRule.custom_params;

      if (
        customParams &&
        typeof customParams === "object" &&
        customParams.pointsCurrency
      ) {
        pointsCurrency = customParams.pointsCurrency;
      }
    } catch (e) {
      console.error("Error parsing custom_params:", e);
    }
  }

  // Create new rule
  return {
    id: uuidv4(),
    cardTypeId,
    name: oldRule.name as string,
    description: (oldRule.description as string) || "",
    enabled: oldRule.enabled as boolean,
    priority: 10, // Default priority
    conditions,
    reward: {
      calculationMethod,
      baseMultiplier: oldRule.base_point_rate as number,
      bonusMultiplier: oldRule.bonus_point_rate as number,
      pointsRoundingStrategy: "floor" as const,
      amountRoundingStrategy: ((oldRule.rounding as string) || "floor") as any,
      blockSize,
      bonusTiers: [], // Add required bonusTiers property
      monthlyCap: oldRule.monthly_cap as number,
      pointsCurrency,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

/**
 * Determine calculation method based on old rule
 */
function determineCalculationMethod(
  oldRule: Record<string, unknown>
): CalculationMethod {
  // UOB cards typically use standard method with floor5 rounding
  if ((oldRule.cardType as string).toLowerCase().includes("uob")) {
    return "standard";
  }

  // Citibank cards typically use direct method
  if ((oldRule.cardType as string).toLowerCase().includes("citibank")) {
    return "direct";
  }

  // Default to standard
  return "standard";
}

// Run migration
migrateRewardRules()
  .then(() => {
    console.log("Migration completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Migration failed:", error);
    process.exit(1);
  });
