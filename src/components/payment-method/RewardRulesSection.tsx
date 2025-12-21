import React, { useState, useCallback } from "react";
import { PaymentMethod } from "@/types";
import { RewardRule } from "@/core/rewards/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  CoinsIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  Settings2,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { RuleRepository } from "@/core/rewards/RuleRepository";
import { RewardRuleEditor } from "@/components/rewards/RewardRuleEditor";
import { cardTypeIdService } from "@/core/rewards/CardTypeIdService";
import { supabase } from "@/integrations/supabase/client";
import {
  initializeRuleRepository,
  getRuleRepository,
} from "@/core/rewards/RuleRepository";
import { toast } from "sonner";

interface RewardRulesSectionProps {
  paymentMethod: PaymentMethod;
  rewardRules: RewardRule[];
  onRulesChanged?: () => void;
}

type QuickSetupType =
  | "amex-cobalt"
  | "amex-platinum"
  | "amex-aeroplan-reserve"
  | "neo-cathay"
  | "hsbc-revolution"
  | "brim-afklm";

interface QuickSetupConfig {
  type: QuickSetupType;
  name: string;
  description: string;
}

/**
 * Determines if a payment method has a quick setup available
 */
function getQuickSetupConfig(
  paymentMethod: PaymentMethod
): QuickSetupConfig | null {
  const issuer = paymentMethod.issuer?.toLowerCase() || "";
  const name = paymentMethod.name?.toLowerCase() || "";

  if (
    (issuer.includes("american express") || issuer.includes("amex")) &&
    name.includes("cobalt")
  ) {
    return {
      type: "amex-cobalt",
      name: "Amex Cobalt",
      description:
        "5x food ($2.5K cap), 3x streaming, 2x gas/transit, 1x other",
    };
  }

  if (
    (issuer.includes("american express") || issuer.includes("amex")) &&
    name.includes("platinum")
  ) {
    return {
      type: "amex-platinum",
      name: "Amex Platinum",
      description: "2x dining (CAD), 2x travel (worldwide), 1x other",
    };
  }

  if (
    (issuer.includes("american express") || issuer.includes("amex")) &&
    name.includes("aeroplan") &&
    name.includes("reserve")
  ) {
    return {
      type: "amex-aeroplan-reserve",
      name: "Amex Aeroplan Reserve",
      description: "3x Air Canada, 2x dining/food delivery (CAD), 1.25x other",
    };
  }

  if (issuer.includes("neo") && name.includes("cathay")) {
    return {
      type: "neo-cathay",
      name: "Neo Cathay World Elite",
      description: "4x Cathay Pacific, 2x foreign currency, 1x other",
    };
  }

  if (issuer.includes("hsbc") && name.includes("revolution")) {
    return {
      type: "hsbc-revolution",
      name: "HSBC Revolution",
      description:
        "10x online travel & contactless (promo until Feb 2026), 1x other",
    };
  }

  if (issuer.includes("brim") && name.includes("air france")) {
    return {
      type: "brim-afklm",
      name: "Brim Air France KLM",
      description:
        "6x AF/KLM (EUR), ~4.09x AF/KLM (CAD), 2x restaurants, 1x other",
    };
  }

  return null;
}

export const RewardRulesSection: React.FC<RewardRulesSectionProps> = ({
  paymentMethod,
  rewardRules,
  onRulesChanged,
}) => {
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<RewardRule | null>(null);
  const [deleteConfirmRule, setDeleteConfirmRule] = useState<RewardRule | null>(
    null
  );
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRunningSetup, setIsRunningSetup] = useState(false);
  const [setupLog, setSetupLog] = useState<string[]>([]);
  const [showSetupLog, setShowSetupLog] = useState(false);

  const cardTypeId =
    paymentMethod.issuer && paymentMethod.name
      ? cardTypeIdService.generateCardTypeId(
          paymentMethod.issuer,
          paymentMethod.name
        )
      : paymentMethod.id;

  const quickSetupConfig = getQuickSetupConfig(paymentMethod);

  const handleAddRule = () => {
    setEditingRule(null);
    setIsEditorOpen(true);
  };

  const handleEditRule = (rule: RewardRule) => {
    setEditingRule(rule);
    setIsEditorOpen(true);
  };

  const handleSaveRule = async (rule: RewardRule) => {
    try {
      const repository = RuleRepository.getInstance();

      if (editingRule) {
        await repository.updateRule(rule.id, rule);
        toast.success("Rule updated successfully");
      } else {
        await repository.createRule({
          ...rule,
          cardTypeId,
        });
        toast.success("Rule created successfully");
      }

      setIsEditorOpen(false);
      setEditingRule(null);
      onRulesChanged?.();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      toast.error("Failed to save rule", { description: message });
    }
  };

  const handleDeleteRule = async () => {
    if (!deleteConfirmRule) return;

    setIsDeleting(true);
    try {
      const repository = RuleRepository.getInstance();
      await repository.deleteRule(deleteConfirmRule.id);
      toast.success("Rule deleted successfully");
      setDeleteConfirmRule(null);
      onRulesChanged?.();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      toast.error("Failed to delete rule", { description: message });
    } finally {
      setIsDeleting(false);
    }
  };

  const addSetupLog = useCallback((message: string) => {
    setSetupLog((prev) => [...prev, message]);
  }, []);

  const runAmexCobaltSetup = async () => {
    setIsRunningSetup(true);
    setSetupLog([]);
    setShowSetupLog(true);

    try {
      addSetupLog("Initializing...");
      initializeRuleRepository(supabase);
      const repository = getRuleRepository();

      const setupCardTypeId = cardTypeIdService.generateCardTypeId(
        "American Express",
        "Cobalt"
      );
      addSetupLog(`Card Type ID: ${setupCardTypeId}`);

      // Delete existing rules
      addSetupLog("Removing existing rules...");
      const { data: existingRules } = await supabase
        .from("reward_rules")
        .select("id")
        .eq("card_type_id", setupCardTypeId);

      if (existingRules && existingRules.length > 0) {
        for (const rule of existingRules) {
          await repository.deleteRule(rule.id);
        }
        addSetupLog(`✅ Removed ${existingRules.length} existing rule(s)`);
      }

      // MCCs and merchants
      const fiveXMCCs = [
        "5811",
        "5812",
        "5813",
        "5814",
        "5411",
        "5422",
        "5441",
        "5451",
        "5499",
      ];
      const streamingMerchants = [
        "Netflix",
        "Spotify",
        "Apple Music",
        "Disney+",
        "Disney Plus",
        "Amazon Prime Video",
        "Prime Video",
        "Crave",
        "HBO Max",
        "Paramount+",
        "Paramount Plus",
        "YouTube Premium",
        "Apple TV+",
        "Apple TV Plus",
        "Deezer",
        "Tidal",
        "SiriusXM Canada",
        "Audible",
      ];
      const twoXMCCs = ["5541", "5542", "4111", "4121", "4131", "4789", "4011"];

      // Create rules
      addSetupLog("Creating 5x Food & Groceries rule...");
      await repository.createRule({
        cardTypeId: setupCardTypeId,
        name: "5x Points on Food & Groceries",
        description:
          "Earn 5 points per $1 CAD at restaurants, groceries, and food delivery (up to $2,500/month spend)",
        enabled: true,
        priority: 4,
        conditions: [
          { type: "mcc", operation: "include", values: fiveXMCCs },
          { type: "currency", operation: "equals", values: ["CAD"] },
        ],
        reward: {
          calculationMethod: "standard",
          baseMultiplier: 1,
          bonusMultiplier: 4,
          pointsRoundingStrategy: "nearest",
          amountRoundingStrategy: "none",
          blockSize: 1,
          monthlyCap: 2500,
          monthlyCapType: "spend_amount",
          monthlySpendPeriodType: "calendar",
          bonusTiers: [],
        },
      });
      addSetupLog("✅ 5x rule created ($2,500 monthly spend cap)");

      addSetupLog("Creating 3x Streaming rule...");
      await repository.createRule({
        cardTypeId: setupCardTypeId,
        name: "3x Points on Streaming",
        description:
          "Earn 3 points per $1 CAD on eligible streaming subscriptions (no cap)",
        enabled: true,
        priority: 3,
        conditions: [
          {
            type: "merchant",
            operation: "include",
            values: streamingMerchants,
          },
          { type: "currency", operation: "equals", values: ["CAD"] },
        ],
        reward: {
          calculationMethod: "standard",
          baseMultiplier: 1,
          bonusMultiplier: 2,
          pointsRoundingStrategy: "nearest",
          amountRoundingStrategy: "none",
          blockSize: 1,
          bonusTiers: [],
        },
      });
      addSetupLog("✅ 3x rule created (no cap)");

      addSetupLog("Creating 2x Gas & Transit rule...");
      await repository.createRule({
        cardTypeId: setupCardTypeId,
        name: "2x Points on Gas & Transit",
        description:
          "Earn 2 points per $1 CAD at gas stations and local transit (no cap)",
        enabled: true,
        priority: 2,
        conditions: [
          { type: "mcc", operation: "include", values: twoXMCCs },
          { type: "currency", operation: "equals", values: ["CAD"] },
        ],
        reward: {
          calculationMethod: "standard",
          baseMultiplier: 1,
          bonusMultiplier: 1,
          pointsRoundingStrategy: "nearest",
          amountRoundingStrategy: "none",
          blockSize: 1,
          bonusTiers: [],
        },
      });
      addSetupLog("✅ 2x rule created (no cap)");

      addSetupLog("Creating 1x Base rule...");
      await repository.createRule({
        cardTypeId: setupCardTypeId,
        name: "1x Points on All Other Purchases",
        description: "Earn 1 point per $1 on all other purchases",
        enabled: true,
        priority: 1,
        conditions: [],
        reward: {
          calculationMethod: "standard",
          baseMultiplier: 1,
          bonusMultiplier: 0,
          pointsRoundingStrategy: "nearest",
          amountRoundingStrategy: "none",
          blockSize: 1,
          monthlyCap: null,
          bonusTiers: [],
        },
      });
      addSetupLog("✅ 1x rule created");

      addSetupLog("");
      addSetupLog("✅ Setup complete!");
      toast.success("Amex Cobalt rules configured successfully!");
      onRulesChanged?.();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      addSetupLog(`❌ Error: ${message}`);
      toast.error("Setup failed", { description: message });
    } finally {
      setIsRunningSetup(false);
    }
  };

  const runAmexPlatinumSetup = async () => {
    setIsRunningSetup(true);
    setSetupLog([]);
    setShowSetupLog(true);

    try {
      addSetupLog("Initializing...");
      initializeRuleRepository(supabase);
      const repository = getRuleRepository();

      const setupCardTypeId = cardTypeIdService.generateCardTypeId(
        "American Express",
        "Platinum"
      );
      addSetupLog(`Card Type ID: ${setupCardTypeId}`);

      // Delete existing rules
      addSetupLog("Removing existing rules...");
      const { data: existingRules } = await supabase
        .from("reward_rules")
        .select("id")
        .eq("card_type_id", setupCardTypeId);

      if (existingRules && existingRules.length > 0) {
        for (const rule of existingRules) {
          await repository.deleteRule(rule.id);
        }
        addSetupLog(`✅ Removed ${existingRules.length} existing rule(s)`);
      }

      // MCCs for dining (restaurants, coffee shops, bars, food delivery - NOT groceries)
      const diningMCCs = ["5811", "5812", "5813", "5814", "5499"];

      // MCCs for travel (airlines, hotels, rail, car rental, tours - NOT local transit)
      const travelMCCs = [
        // Airlines (3000-3299 range + 4511)
        ...Array.from({ length: 300 }, (_, i) => String(3000 + i)),
        "4511",
        // Hotels (3501-3799 range + 7011)
        ...Array.from({ length: 299 }, (_, i) => String(3501 + i)),
        "7011",
        // Car Rentals (3351-3441 range + 7512)
        ...Array.from({ length: 91 }, (_, i) => String(3351 + i)),
        "7512",
        // Rail and Water Transport (long-distance, not local)
        "4011",
        "4112",
        "4411",
        "4457",
        // Travel Agencies and Tour Operators
        "4722",
        "4723",
        // Other Travel
        "7032",
        "7033",
        "7513",
        "7519",
      ];

      // Rule 1: 2x on Dining in Canada (CAD only)
      addSetupLog("Creating 2x Dining in Canada rule...");
      await repository.createRule({
        cardTypeId: setupCardTypeId,
        name: "2x Points on Dining in Canada",
        description:
          "Earn 2 points per $1 CAD at restaurants, coffee shops, bars, and food delivery (excludes groceries)",
        enabled: true,
        priority: 3,
        conditions: [
          { type: "mcc", operation: "include", values: diningMCCs },
          { type: "currency", operation: "equals", values: ["CAD"] },
        ],
        reward: {
          calculationMethod: "standard",
          baseMultiplier: 1,
          bonusMultiplier: 1,
          pointsRoundingStrategy: "nearest",
          amountRoundingStrategy: "none",
          blockSize: 1,
          monthlyCap: null,
          bonusTiers: [],
        },
      });
      addSetupLog("✅ 2x Dining rule created (CAD only, no cap)");

      // Rule 2: 2x on Travel Worldwide (all currencies)
      addSetupLog("Creating 2x Travel Worldwide rule...");
      await repository.createRule({
        cardTypeId: setupCardTypeId,
        name: "2x Points on Travel",
        description:
          "Earn 2 points per $1 on travel services including airlines, hotels, rail, car rental, and tour operators (worldwide)",
        enabled: true,
        priority: 2,
        conditions: [{ type: "mcc", operation: "include", values: travelMCCs }],
        reward: {
          calculationMethod: "standard",
          baseMultiplier: 1,
          bonusMultiplier: 1,
          pointsRoundingStrategy: "nearest",
          amountRoundingStrategy: "none",
          blockSize: 1,
          monthlyCap: null,
          bonusTiers: [],
        },
      });
      addSetupLog("✅ 2x Travel rule created (worldwide, no cap)");

      // Rule 3: 1x on Everything Else
      addSetupLog("Creating 1x Base rule...");
      await repository.createRule({
        cardTypeId: setupCardTypeId,
        name: "1x Points on All Other Purchases",
        description: "Earn 1 point per $1 on all other eligible purchases",
        enabled: true,
        priority: 1,
        conditions: [],
        reward: {
          calculationMethod: "standard",
          baseMultiplier: 1,
          bonusMultiplier: 0,
          pointsRoundingStrategy: "nearest",
          amountRoundingStrategy: "none",
          blockSize: 1,
          monthlyCap: null,
          bonusTiers: [],
        },
      });
      addSetupLog("✅ 1x rule created");

      addSetupLog("");
      addSetupLog("✅ Setup complete!");
      toast.success("Amex Platinum rules configured successfully!");
      onRulesChanged?.();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      addSetupLog(`❌ Error: ${message}`);
      toast.error("Setup failed", { description: message });
    } finally {
      setIsRunningSetup(false);
    }
  };

  const runAmexAeroplanReserveSetup = async () => {
    setIsRunningSetup(true);
    setSetupLog([]);
    setShowSetupLog(true);

    try {
      addSetupLog("Initializing...");
      initializeRuleRepository(supabase);
      const repository = getRuleRepository();

      const setupCardTypeId = cardTypeIdService.generateCardTypeId(
        "American Express",
        "Aeroplan Reserve"
      );
      addSetupLog(`Card Type ID: ${setupCardTypeId}`);

      // Delete existing rules
      addSetupLog("Removing existing rules...");
      const { data: existingRules } = await supabase
        .from("reward_rules")
        .select("id")
        .eq("card_type_id", setupCardTypeId);

      if (existingRules && existingRules.length > 0) {
        for (const rule of existingRules) {
          await repository.deleteRule(rule.id);
        }
        addSetupLog(`✅ Removed ${existingRules.length} existing rule(s)`);
      }

      // MCCs for dining (restaurants, coffee shops, bars, food delivery - NOT groceries)
      const diningMCCs = ["5811", "5812", "5813", "5814", "5499"];

      // Rule 1: 3x on Air Canada Direct Purchases (merchant match)
      addSetupLog("Creating 3x Air Canada rule...");
      await repository.createRule({
        cardTypeId: setupCardTypeId,
        name: "3x Points on Air Canada",
        description:
          "Earn 3 points per $1 on purchases made directly with Air Canada",
        enabled: true,
        priority: 3,
        conditions: [
          {
            type: "merchant",
            operation: "include",
            values: ["Air Canada", "AIR CANADA", "AIRCANADA", "AC VACATIONS"],
          },
        ],
        reward: {
          calculationMethod: "standard",
          baseMultiplier: 1,
          bonusMultiplier: 2,
          pointsRoundingStrategy: "nearest",
          amountRoundingStrategy: "none",
          blockSize: 1,
          monthlyCap: null,
          bonusTiers: [],
        },
      });
      addSetupLog("✅ 3x Air Canada rule created (merchant match)");

      // Rule 2: 2x on Dining & Food Delivery (CAD only)
      addSetupLog("Creating 2x Dining & Food Delivery rule...");
      await repository.createRule({
        cardTypeId: setupCardTypeId,
        name: "2x Points on Dining & Food Delivery",
        description:
          "Earn 2 points per $1 CAD at restaurants, coffee shops, bars, and food delivery (excludes groceries)",
        enabled: true,
        priority: 2,
        conditions: [
          { type: "mcc", operation: "include", values: diningMCCs },
          { type: "currency", operation: "equals", values: ["CAD"] },
        ],
        reward: {
          calculationMethod: "standard",
          baseMultiplier: 1,
          bonusMultiplier: 1,
          pointsRoundingStrategy: "nearest",
          amountRoundingStrategy: "none",
          blockSize: 1,
          monthlyCap: null,
          bonusTiers: [],
        },
      });
      addSetupLog("✅ 2x Dining rule created (CAD only, no cap)");

      // Rule 3: 1.25x on Everything Else
      addSetupLog("Creating 1.25x Base rule...");
      await repository.createRule({
        cardTypeId: setupCardTypeId,
        name: "1.25x Points on All Other Purchases",
        description: "Earn 1.25 points per $1 on all other eligible purchases",
        enabled: true,
        priority: 1,
        conditions: [],
        reward: {
          calculationMethod: "standard",
          baseMultiplier: 1.25,
          bonusMultiplier: 0,
          pointsRoundingStrategy: "nearest",
          amountRoundingStrategy: "none",
          blockSize: 1,
          monthlyCap: null,
          bonusTiers: [],
        },
      });
      addSetupLog("✅ 1.25x rule created");

      // Update payment method's reward currency to Aeroplan Points
      addSetupLog("Setting reward currency to Aeroplan Points...");
      const { data: aeroplanCurrency } = await supabase
        .from("reward_currencies")
        .select("id, display_name")
        .eq("code", "aeroplan")
        .single();

      if (aeroplanCurrency) {
        const { error: updateError } = await supabase
          .from("payment_methods")
          .update({
            reward_currency_id: aeroplanCurrency.id,
            points_currency: aeroplanCurrency.display_name,
          })
          .eq("id", paymentMethod.id);

        if (updateError) {
          addSetupLog(
            `⚠️ Warning: Could not set reward currency: ${updateError.message}`
          );
        } else {
          addSetupLog(
            `✅ Reward currency set to ${aeroplanCurrency.display_name}`
          );
        }
      } else {
        addSetupLog("⚠️ Warning: Aeroplan currency not found in database");
      }

      addSetupLog("");
      addSetupLog("✅ Setup complete!");
      toast.success("Amex Aeroplan Reserve rules configured successfully!");
      onRulesChanged?.();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      addSetupLog(`❌ Error: ${message}`);
      toast.error("Setup failed", { description: message });
    } finally {
      setIsRunningSetup(false);
    }
  };

  const runNeoCathaySetup = async () => {
    setIsRunningSetup(true);
    setSetupLog([]);
    setShowSetupLog(true);

    try {
      addSetupLog("Initializing...");
      initializeRuleRepository(supabase);
      const repository = getRuleRepository();

      const setupCardTypeId = cardTypeIdService.generateCardTypeId(
        "Neo Financial",
        "Cathay World Elite"
      );
      addSetupLog(`Card Type ID: ${setupCardTypeId}`);

      // Delete existing rules
      addSetupLog("Removing existing rules...");
      const { data: existingRules } = await supabase
        .from("reward_rules")
        .select("id")
        .eq("card_type_id", setupCardTypeId);

      if (existingRules && existingRules.length > 0) {
        for (const rule of existingRules) {
          await repository.deleteRule(rule.id);
        }
        addSetupLog(`✅ Removed ${existingRules.length} existing rule(s)`);
      }

      // Cathay Pacific MCC code and merchant names
      const cathayPacificMCC = "3099";
      const cathayPacificMerchants = [
        "Cathay Pacific",
        "CATHAY PACIFIC",
        "CATHAYPACIFIC",
        "CATHAYPACAIR",
      ];

      // Rule 1a: 4x on Cathay Pacific (MCC match)
      addSetupLog("Creating 4x Cathay Pacific rule (MCC)...");
      await repository.createRule({
        cardTypeId: setupCardTypeId,
        name: "4x Asia Miles on Cathay Pacific (MCC)",
        description:
          "Earn 4 Asia Miles per $1 on Cathay Pacific flights (matched by MCC 3099)",
        enabled: true,
        priority: 4,
        conditions: [
          { type: "mcc", operation: "include", values: [cathayPacificMCC] },
        ],
        reward: {
          calculationMethod: "standard",
          baseMultiplier: 1,
          bonusMultiplier: 3,
          pointsRoundingStrategy: "floor",
          amountRoundingStrategy: "ceiling",
          blockSize: 1,
          monthlyCap: null,
          bonusTiers: [],
        },
      });
      addSetupLog("✅ 4x rule created (MCC 3099)");

      // Rule 1b: 4x on Cathay Pacific (Merchant match)
      addSetupLog("Creating 4x Cathay Pacific rule (Merchant)...");
      await repository.createRule({
        cardTypeId: setupCardTypeId,
        name: "4x Asia Miles on Cathay Pacific (Merchant)",
        description:
          "Earn 4 Asia Miles per $1 on Cathay Pacific flights (matched by merchant name)",
        enabled: true,
        priority: 3,
        conditions: [
          {
            type: "merchant",
            operation: "include",
            values: cathayPacificMerchants,
          },
        ],
        reward: {
          calculationMethod: "standard",
          baseMultiplier: 1,
          bonusMultiplier: 3,
          pointsRoundingStrategy: "floor",
          amountRoundingStrategy: "ceiling",
          blockSize: 1,
          monthlyCap: null,
          bonusTiers: [],
        },
      });
      addSetupLog("✅ 4x rule created (merchant match)");

      // Rule 2: 2x on Foreign Currency
      addSetupLog("Creating 2x Foreign Currency rule...");
      await repository.createRule({
        cardTypeId: setupCardTypeId,
        name: "2x Asia Miles on Foreign Currency",
        description:
          "Earn 2 Asia Miles per $1 on transactions in foreign currencies (non-CAD)",
        enabled: true,
        priority: 2,
        conditions: [
          { type: "currency", operation: "exclude", values: ["CAD"] },
        ],
        reward: {
          calculationMethod: "standard",
          baseMultiplier: 1,
          bonusMultiplier: 1,
          pointsRoundingStrategy: "floor",
          amountRoundingStrategy: "ceiling",
          blockSize: 1,
          monthlyCap: null,
          bonusTiers: [],
        },
      });
      addSetupLog("✅ 2x rule created (foreign currency)");

      // Rule 3: 1x on Everything Else
      addSetupLog("Creating 1x Base rule...");
      await repository.createRule({
        cardTypeId: setupCardTypeId,
        name: "1x Asia Miles on All Other Purchases",
        description: "Earn 1 Asia Mile per $1 on all other eligible purchases",
        enabled: true,
        priority: 1,
        conditions: [],
        reward: {
          calculationMethod: "standard",
          baseMultiplier: 1,
          bonusMultiplier: 0,
          pointsRoundingStrategy: "floor",
          amountRoundingStrategy: "ceiling",
          blockSize: 1,
          monthlyCap: null,
          bonusTiers: [],
        },
      });
      addSetupLog("✅ 1x rule created");

      // Update payment method's reward currency to Asia Miles
      addSetupLog("Setting reward currency to Asia Miles...");
      const { data: asiaMilesCurrency } = await supabase
        .from("reward_currencies")
        .select("id, display_name")
        .eq("code", "asia_miles")
        .single();

      if (asiaMilesCurrency) {
        const { error: updateError } = await supabase
          .from("payment_methods")
          .update({
            reward_currency_id: asiaMilesCurrency.id,
            points_currency: asiaMilesCurrency.display_name,
          })
          .eq("id", paymentMethod.id);

        if (updateError) {
          addSetupLog(
            `⚠️ Warning: Could not set reward currency: ${updateError.message}`
          );
        } else {
          addSetupLog(
            `✅ Reward currency set to ${asiaMilesCurrency.display_name}`
          );
        }
      } else {
        addSetupLog("⚠️ Warning: Asia Miles currency not found in database");
      }

      addSetupLog("");
      addSetupLog("✅ Setup complete!");
      toast.success("Neo Cathay World Elite rules configured successfully!");
      onRulesChanged?.();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      addSetupLog(`❌ Error: ${message}`);
      toast.error("Setup failed", { description: message });
    } finally {
      setIsRunningSetup(false);
    }
  };

  const runHSBCRevolutionSetup = async () => {
    setIsRunningSetup(true);
    setSetupLog([]);
    setShowSetupLog(true);

    try {
      addSetupLog("Initializing...");
      initializeRuleRepository(supabase);
      const repository = getRuleRepository();

      const setupCardTypeId = cardTypeIdService.generateCardTypeId(
        "HSBC",
        "Revolution Visa Platinum"
      );
      addSetupLog(`Card Type ID: ${setupCardTypeId}`);

      // Delete existing rules
      addSetupLog("Removing existing rules...");
      const { data: existingRules } = await supabase
        .from("reward_rules")
        .select("id")
        .eq("card_type_id", setupCardTypeId);

      if (existingRules && existingRules.length > 0) {
        for (const rule of existingRules) {
          await repository.deleteRule(rule.id);
        }
        addSetupLog(`✅ Removed ${existingRules.length} existing rule(s)`);
      }

      // Promotional period end date: February 28, 2026
      const promoEndDate = new Date("2026-02-28T23:59:59+08:00");

      // Shared cap group ID for the 13,500 bonus points monthly cap
      const sharedCapGroupId = "hsbc-revolution-10x-bonus-cap";

      // Travel MCCs (for both Online and Contactless)
      const airlineMCCs = [
        ...Array.from({ length: 351 }, (_, i) => String(3000 + i)), // 3000-3350
        "4511",
      ];
      const carRentalMCCs = Array.from({ length: 150 }, (_, i) =>
        String(3351 + i)
      ); // 3351-3500
      const lodgingMCCs = [
        ...Array.from({ length: 499 }, (_, i) => String(3501 + i)), // 3501-3999
        "7011",
      ];
      const cruiseMCCs = ["4411"];
      const travelMCCs = [
        ...airlineMCCs,
        ...carRentalMCCs,
        ...lodgingMCCs,
        ...cruiseMCCs,
      ];

      // Contactless-only MCCs (in addition to travel)
      const retailMCCs = [
        "4816",
        "5045",
        "5262",
        "5309",
        "5310",
        "5311",
        "5331",
        "5399",
        "5611",
        "5621",
        "5631",
        "5641",
        "5651",
        "5655",
        "5661",
        "5691",
        "5699",
        "5732",
        "5733",
        "5734",
        "5735",
        "5912",
        "5942",
        "5944",
        "5945",
        "5946",
        "5947",
        "5948",
        "5949",
        "5964",
        "5965",
        "5966",
        "5967",
        "5968",
        "5969",
        "5970",
        "5992",
        "5999",
      ];
      const diningMCCs = ["5441", "5462", "5811", "5812", "5813"];
      const otherMCCs = ["4121", "7997"];
      const contactlessMCCs = [
        ...travelMCCs,
        ...retailMCCs,
        ...diningMCCs,
        ...otherMCCs,
      ];

      // Rule 1: 10x on Online Travel (Promotional)
      addSetupLog("Creating 10x Online Travel rule (promo)...");
      await repository.createRule({
        cardTypeId: setupCardTypeId,
        name: "10x Points on Online Travel (Promo)",
        description:
          "Earn 10 points per SGD1 on online travel transactions. Valid until Feb 28, 2026.",
        enabled: true,
        priority: 3,
        validUntil: promoEndDate,
        conditions: [
          {
            type: "transaction_type",
            operation: "include",
            values: ["online"],
          },
          { type: "mcc", operation: "include", values: travelMCCs },
        ],
        reward: {
          calculationMethod: "standard",
          baseMultiplier: 1,
          bonusMultiplier: 9,
          pointsRoundingStrategy: "floor",
          amountRoundingStrategy: "floor",
          blockSize: 1,
          monthlyCap: 13500,
          monthlyCapType: "bonus_points",
          monthlySpendPeriodType: "calendar",
          capGroupId: sharedCapGroupId,
          bonusTiers: [],
        },
      });
      addSetupLog("✅ 10x Online Travel rule created (13,500 bonus pts cap)");

      // Rule 2: 10x on Contactless (Promotional)
      addSetupLog("Creating 10x Contactless rule (promo)...");
      await repository.createRule({
        cardTypeId: setupCardTypeId,
        name: "10x Points on Contactless (Promo)",
        description:
          "Earn 10 points per SGD1 on contactless transactions. Valid until Feb 28, 2026.",
        enabled: true,
        priority: 2,
        validUntil: promoEndDate,
        conditions: [
          {
            type: "transaction_type",
            operation: "include",
            values: ["contactless"],
          },
          { type: "mcc", operation: "include", values: contactlessMCCs },
        ],
        reward: {
          calculationMethod: "standard",
          baseMultiplier: 1,
          bonusMultiplier: 9,
          pointsRoundingStrategy: "floor",
          amountRoundingStrategy: "floor",
          blockSize: 1,
          monthlyCap: 13500,
          monthlyCapType: "bonus_points",
          monthlySpendPeriodType: "calendar",
          capGroupId: sharedCapGroupId,
          bonusTiers: [],
        },
      });
      addSetupLog(
        "✅ 10x Contactless rule created (shared 13,500 bonus pts cap)"
      );

      // Rule 3: 1x on Everything Else (Base Rate)
      addSetupLog("Creating 1x Base rule...");
      await repository.createRule({
        cardTypeId: setupCardTypeId,
        name: "1x Points on All Other Purchases",
        description:
          "Earn 1 point per SGD1 on all other eligible purchases (base rate)",
        enabled: true,
        priority: 1,
        conditions: [],
        reward: {
          calculationMethod: "standard",
          baseMultiplier: 1,
          bonusMultiplier: 0,
          pointsRoundingStrategy: "nearest",
          amountRoundingStrategy: "nearest",
          blockSize: 1,
          bonusTiers: [],
        },
      });
      addSetupLog("✅ 1x rule created");

      addSetupLog("");
      addSetupLog("✅ Setup complete!");
      addSetupLog("⚠️ Promo ends Feb 28, 2026");
      toast.success("HSBC Revolution rules configured successfully!");
      onRulesChanged?.();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      addSetupLog(`❌ Error: ${message}`);
      toast.error("Setup failed", { description: message });
    } finally {
      setIsRunningSetup(false);
    }
  };

  const runBrimAFKLMSetup = async () => {
    setIsRunningSetup(true);
    setSetupLog([]);
    setShowSetupLog(true);

    try {
      addSetupLog("Initializing...");
      initializeRuleRepository(supabase);
      const repository = getRuleRepository();

      // Use the cardTypeId from the actual payment method (defined at component level)
      const setupCardTypeId = cardTypeId;
      addSetupLog(`Card Type ID: ${setupCardTypeId}`);

      // Delete existing rules
      addSetupLog("Removing existing rules...");
      const { data: existingRules } = await supabase
        .from("reward_rules")
        .select("id")
        .eq("card_type_id", setupCardTypeId);

      if (existingRules && existingRules.length > 0) {
        for (const rule of existingRules) {
          await repository.deleteRule(rule.id);
        }
        addSetupLog(`✅ Removed ${existingRules.length} existing rule(s)`);
      }

      // Air France (MCC 3007) and KLM (MCC 3010)
      const afklmMCCs = ["3007", "3010"];
      const afklmMerchants = [
        "Air France",
        "AIR FRANCE",
        "AIRFRANCE",
        "KLM",
        "KLM AIRLINE",
        "KLM ROYAL DUTCH",
        "FLYING BLUE",
      ];

      // Restaurant MCCs (5812 = Eating Places/Restaurants, 5814 = Fast Food)
      const restaurantMCCs = ["5812", "5814"];

      // EUR/CAD conversion rate for bonus calculation
      // Bonus is 5 miles per EUR, so for CAD: 5 / 1.62 = 3.086 bonus per CAD
      const eurCadRate = 1.62;
      const cadBonusMultiplier = 5 / eurCadRate; // ~3.086

      // Rule 1a: 6x on Air France/KLM EUR transactions (MCC match)
      addSetupLog("Creating 6x Air France/KLM rule (EUR, MCC)...");
      await repository.createRule({
        cardTypeId: setupCardTypeId,
        name: "6x Flying Blue Miles on Air France/KLM (EUR)",
        description:
          "Earn 6 Flying Blue Miles per €1 on Air France and KLM flights in EUR (5 bonus + 1 base)",
        enabled: true,
        priority: 6,
        conditions: [
          { type: "mcc", operation: "include", values: afklmMCCs },
          { type: "currency", operation: "equals", values: ["EUR"] },
        ],
        reward: {
          calculationMethod: "standard",
          baseMultiplier: 1,
          bonusMultiplier: 5,
          pointsRoundingStrategy: "floor",
          amountRoundingStrategy: "none",
          blockSize: 1,
          monthlyCap: null,
          bonusTiers: [],
        },
      });
      addSetupLog("✅ 6x rule created (EUR, MCC 3007/3010)");

      // Rule 1b: 6x on Air France/KLM EUR transactions (Merchant match)
      addSetupLog("Creating 6x Air France/KLM rule (EUR, Merchant)...");
      await repository.createRule({
        cardTypeId: setupCardTypeId,
        name: "6x Flying Blue Miles on Air France/KLM (EUR, Merchant)",
        description:
          "Earn 6 Flying Blue Miles per €1 on Air France and KLM flights in EUR (matched by merchant)",
        enabled: true,
        priority: 5,
        conditions: [
          { type: "merchant", operation: "include", values: afklmMerchants },
          { type: "currency", operation: "equals", values: ["EUR"] },
        ],
        reward: {
          calculationMethod: "standard",
          baseMultiplier: 1,
          bonusMultiplier: 5,
          pointsRoundingStrategy: "floor",
          amountRoundingStrategy: "none",
          blockSize: 1,
          monthlyCap: null,
          bonusTiers: [],
        },
      });
      addSetupLog("✅ 6x rule created (EUR, merchant match)");

      // Rule 1c: ~4.09x on Air France/KLM CAD transactions (MCC match)
      // 5 bonus per EUR = 3.086 bonus per CAD (at 1.62 EUR/CAD) + 1 base
      addSetupLog("Creating ~4.09x Air France/KLM rule (CAD, MCC)...");
      await repository.createRule({
        cardTypeId: setupCardTypeId,
        name: "~4.09x Flying Blue Miles on Air France/KLM (CAD)",
        description: `Earn ~4.09 Flying Blue Miles per $1 CAD on Air France and KLM flights (5 bonus/€ ÷ ${eurCadRate} + 1 base)`,
        enabled: true,
        priority: 4,
        conditions: [
          { type: "mcc", operation: "include", values: afklmMCCs },
          { type: "currency", operation: "equals", values: ["CAD"] },
        ],
        reward: {
          calculationMethod: "standard",
          baseMultiplier: 1,
          bonusMultiplier: cadBonusMultiplier, // ~3.086
          pointsRoundingStrategy: "floor",
          amountRoundingStrategy: "none",
          blockSize: 1,
          monthlyCap: null,
          bonusTiers: [],
        },
      });
      addSetupLog(
        `✅ ~4.09x rule created (CAD, MCC) - bonus: ${cadBonusMultiplier.toFixed(3)}/CAD`
      );

      // Rule 1d: ~4.09x on Air France/KLM CAD transactions (Merchant match)
      addSetupLog("Creating ~4.09x Air France/KLM rule (CAD, Merchant)...");
      await repository.createRule({
        cardTypeId: setupCardTypeId,
        name: "~4.09x Flying Blue Miles on Air France/KLM (CAD, Merchant)",
        description: `Earn ~4.09 Flying Blue Miles per $1 CAD on Air France and KLM flights (matched by merchant)`,
        enabled: true,
        priority: 3,
        conditions: [
          { type: "merchant", operation: "include", values: afklmMerchants },
          { type: "currency", operation: "equals", values: ["CAD"] },
        ],
        reward: {
          calculationMethod: "standard",
          baseMultiplier: 1,
          bonusMultiplier: cadBonusMultiplier, // ~3.086
          pointsRoundingStrategy: "floor",
          amountRoundingStrategy: "none",
          blockSize: 1,
          monthlyCap: null,
          bonusTiers: [],
        },
      });
      addSetupLog("✅ ~4.09x rule created (CAD, merchant match)");

      // Rule 2: 2x on Restaurants
      addSetupLog("Creating 2x Restaurants rule...");
      await repository.createRule({
        cardTypeId: setupCardTypeId,
        name: "2x Flying Blue Miles on Restaurants",
        description:
          "Earn 2 Flying Blue Miles per $1 at eating places, restaurants, and fast food (MCC 5812/5814)",
        enabled: true,
        priority: 2,
        conditions: [
          { type: "mcc", operation: "include", values: restaurantMCCs },
        ],
        reward: {
          calculationMethod: "standard",
          baseMultiplier: 1,
          bonusMultiplier: 1,
          pointsRoundingStrategy: "floor",
          amountRoundingStrategy: "none",
          blockSize: 1,
          monthlyCap: null,
          bonusTiers: [],
        },
      });
      addSetupLog("✅ 2x rule created (restaurants)");

      // Rule 3: 1x on Everything Else
      addSetupLog("Creating 1x Base rule...");
      await repository.createRule({
        cardTypeId: setupCardTypeId,
        name: "1x Flying Blue Miles on All Other Purchases",
        description:
          "Earn 1 Flying Blue Mile per $1 on all other eligible purchases",
        enabled: true,
        priority: 1,
        conditions: [],
        reward: {
          calculationMethod: "standard",
          baseMultiplier: 1,
          bonusMultiplier: 0,
          pointsRoundingStrategy: "floor",
          amountRoundingStrategy: "none",
          blockSize: 1,
          monthlyCap: null,
          bonusTiers: [],
        },
      });
      addSetupLog("✅ 1x rule created");

      // Update payment method's reward currency to Flying Blue Points
      addSetupLog("Setting reward currency to Flying Blue Points...");
      const { data: flyingBlueCurrency } = await supabase
        .from("reward_currencies")
        .select("id, display_name")
        .eq("code", "flying_blue")
        .single();

      if (flyingBlueCurrency) {
        const { error: updateError } = await supabase
          .from("payment_methods")
          .update({
            reward_currency_id: flyingBlueCurrency.id,
            points_currency: flyingBlueCurrency.display_name,
          })
          .eq("id", paymentMethod.id);

        if (updateError) {
          addSetupLog(
            `⚠️ Warning: Could not set reward currency: ${updateError.message}`
          );
        } else {
          addSetupLog(
            `✅ Reward currency set to ${flyingBlueCurrency.display_name}`
          );
        }
      } else {
        addSetupLog("⚠️ Warning: Flying Blue currency not found in database");
      }

      addSetupLog("");
      addSetupLog("✅ Setup complete!");
      toast.success("Brim Air France KLM rules configured successfully!");
      onRulesChanged?.();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      addSetupLog(`❌ Error: ${message}`);
      toast.error("Setup failed", { description: message });
    } finally {
      setIsRunningSetup(false);
    }
  };

  const handleQuickSetup = () => {
    if (!quickSetupConfig) return;

    switch (quickSetupConfig.type) {
      case "amex-cobalt":
        runAmexCobaltSetup();
        break;
      case "amex-platinum":
        runAmexPlatinumSetup();
        break;
      case "amex-aeroplan-reserve":
        runAmexAeroplanReserveSetup();
        break;
      case "neo-cathay":
        runNeoCathaySetup();
        break;
      case "hsbc-revolution":
        runHSBCRevolutionSetup();
        break;
      case "brim-afklm":
        runBrimAFKLMSetup();
        break;
    }
  };

  return (
    <div
      style={{
        backgroundColor: "var(--color-card-bg)",
        border: "1px solid var(--color-border)",
        borderRadius: "12px",
        boxShadow: "var(--shadow-card)",
      }}
    >
      <div className="p-4 pb-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h3
            className="flex items-center text-base font-medium"
            style={{ color: "var(--color-text-primary)" }}
          >
            <CoinsIcon
              className="h-5 w-5 mr-2"
              style={{ color: "var(--color-warning)" }}
            />
            Reward Rules
            {rewardRules.length > 0 && (
              <span
                className="ml-2 text-xs px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: "var(--color-accent-subtle)",
                  color: "var(--color-accent-text)",
                }}
              >
                {rewardRules.length}
              </span>
            )}
          </h3>
          <div className="flex gap-2">
            {/* Show Quick Setup prominently when no rules exist */}
            {quickSetupConfig && rewardRules.length === 0 ? (
              <button
                onClick={handleQuickSetup}
                disabled={isRunningSetup}
                className="flex items-center px-4 py-2 text-sm font-medium transition-all duration-300 ease-out active:scale-[0.98] disabled:opacity-50"
                style={{
                  backgroundColor: "var(--color-accent)",
                  color: "var(--color-bg)",
                  borderRadius: "10px",
                }}
              >
                {isRunningSetup ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Settings2 className="h-4 w-4 mr-2" />
                )}
                Quick Setup
              </button>
            ) : (
              <>
                {/* Show both buttons when rules exist */}
                {quickSetupConfig && (
                  <button
                    onClick={handleQuickSetup}
                    disabled={isRunningSetup}
                    className="flex items-center px-3 py-1.5 text-sm font-medium transition-all duration-300 ease-out active:scale-[0.98] disabled:opacity-50"
                    style={{
                      backgroundColor: "transparent",
                      color: "var(--color-text-secondary)",
                      border: "1px solid var(--color-border)",
                      borderRadius: "8px",
                    }}
                  >
                    {isRunningSetup ? (
                      <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                    ) : (
                      <Settings2 className="h-4 w-4 mr-1.5" />
                    )}
                    Reset Rules
                  </button>
                )}
                <button
                  onClick={handleAddRule}
                  className="flex items-center px-3 py-1.5 text-sm font-medium transition-all duration-300 ease-out active:scale-[0.98]"
                  style={{
                    backgroundColor: "var(--color-accent)",
                    color: "var(--color-bg)",
                    borderRadius: "8px",
                  }}
                >
                  <PlusIcon className="h-4 w-4 mr-1.5" />
                  Add Rule
                </button>
              </>
            )}
          </div>
        </div>
        {/* Onboarding hint when no rules */}
        {rewardRules.length === 0 && quickSetupConfig && (
          <p
            className="mt-2 text-xs"
            style={{ color: "var(--color-text-tertiary)" }}
          >
            Quick Setup adds common reward categories for{" "}
            {quickSetupConfig.name} automatically
          </p>
        )}
      </div>
      <div className="px-4 pb-4 space-y-3">
        {/* Setup log - Japandi style */}
        {showSetupLog && setupLog.length > 0 && (
          <div
            className="p-3 font-mono text-xs space-y-1 max-h-32 overflow-y-auto"
            style={{
              backgroundColor: "var(--color-surface)",
              borderRadius: "8px",
            }}
          >
            {setupLog.map((line, i) => (
              <div
                key={i}
                style={{
                  color: line.startsWith("✅")
                    ? "var(--color-success)"
                    : line.startsWith("❌")
                      ? "var(--color-error)"
                      : "var(--color-text-secondary)",
                }}
              >
                {line}
              </div>
            ))}
            {!isRunningSetup && (
              <button
                className="mt-2 text-xs font-medium transition-colors"
                style={{ color: "var(--color-text-tertiary)" }}
                onClick={() => setShowSetupLog(false)}
              >
                Dismiss
              </button>
            )}
          </div>
        )}

        {/* Rules list - Japandi style */}
        {rewardRules.length === 0 ? (
          <div
            className="text-center py-8"
            style={{ color: "var(--color-text-tertiary)" }}
          >
            <AlertCircle
              className="h-10 w-10 mx-auto mb-3"
              style={{ color: "var(--color-accent)", opacity: 0.3 }}
            />
            <p
              className="text-sm font-medium"
              style={{ color: "var(--color-text-secondary)" }}
            >
              No reward rules configured
            </p>
            <p
              className="text-xs mt-1.5"
              style={{ color: "var(--color-text-tertiary)" }}
            >
              {quickSetupConfig
                ? `Use "Quick Setup" for ${quickSetupConfig.name} defaults, or add rules manually.`
                : "Add rules to track reward points for this card."}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {rewardRules
              .sort((a, b) => b.priority - a.priority)
              .map((rule) => (
                <div
                  key={rule.id}
                  className="flex items-start justify-between p-3 transition-colors duration-300"
                  style={{
                    backgroundColor: "var(--color-surface)",
                    borderRadius: "8px",
                  }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className="font-medium text-sm"
                        style={{ color: "var(--color-text-primary)" }}
                      >
                        {rule.name}
                      </span>
                      {/* Japandi Multiplier Badge */}
                      <span
                        className="text-sm font-medium px-2.5 py-0.5"
                        style={{
                          backgroundColor: "var(--color-badge-bg)",
                          color: "var(--color-badge-text)",
                          border: "1px solid var(--color-badge-border)",
                          borderRadius: "6px",
                        }}
                      >
                        {(() => {
                          const total =
                            rule.reward.bonusMultiplier +
                            rule.reward.baseMultiplier;
                          return Number.isInteger(total)
                            ? total
                            : Math.round(total * 100) / 100;
                        })()}
                        x
                      </span>
                      {rule.reward.monthlyCap && (
                        <span
                          className="text-xs px-2 py-0.5"
                          style={{
                            color: "var(--color-text-tertiary)",
                            border: "1px solid var(--color-border)",
                            borderRadius: "4px",
                          }}
                        >
                          Cap:{" "}
                          {rule.reward.monthlyCapType === "spend_amount"
                            ? `$${rule.reward.monthlyCap.toLocaleString()}`
                            : `${rule.reward.monthlyCap.toLocaleString()} pts`}
                        </span>
                      )}
                      {!rule.enabled && (
                        <span
                          className="text-xs px-2 py-0.5"
                          style={{
                            backgroundColor: "rgba(196, 165, 123, 0.15)",
                            color: "var(--color-warning)",
                            borderRadius: "4px",
                          }}
                        >
                          Disabled
                        </span>
                      )}
                    </div>
                    <p
                      className="text-xs mt-1 truncate"
                      style={{ color: "var(--color-text-tertiary)" }}
                    >
                      {rule.description}
                    </p>
                  </div>
                  <div className="flex gap-1 ml-2">
                    <button
                      className="h-9 w-9 flex items-center justify-center rounded-md transition-colors duration-300"
                      style={{ color: "var(--color-icon-secondary)" }}
                      onClick={() => handleEditRule(rule)}
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      className="h-9 w-9 flex items-center justify-center rounded-md transition-colors duration-300"
                      style={{ color: "var(--color-error)" }}
                      onClick={() => setDeleteConfirmRule(rule)}
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Rule Editor Dialog */}
      <Dialog open={isEditorOpen} onOpenChange={setIsEditorOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingRule ? "Edit Reward Rule" : "Create Reward Rule"}
            </DialogTitle>
          </DialogHeader>
          <RewardRuleEditor
            rule={editingRule || undefined}
            ruleCount={rewardRules.length}
            onSave={handleSaveRule}
            onCancel={() => {
              setIsEditorOpen(false);
              setEditingRule(null);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog - Japandi style */}
      <AlertDialog
        open={!!deleteConfirmRule}
        onOpenChange={() => setDeleteConfirmRule(null)}
      >
        <AlertDialogContent
          style={{
            backgroundColor: "var(--color-modal-bg)",
            border: "1px solid var(--color-border)",
            borderRadius: "16px",
          }}
        >
          <AlertDialogHeader>
            <AlertDialogTitle style={{ color: "var(--color-text-primary)" }}>
              Delete Reward Rule
            </AlertDialogTitle>
            <AlertDialogDescription
              style={{ color: "var(--color-text-secondary)" }}
            >
              Are you sure you want to delete "{deleteConfirmRule?.name}"? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={isDeleting}
              style={{
                backgroundColor: "transparent",
                border: "1px solid var(--color-border)",
                color: "var(--color-text-secondary)",
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteRule}
              disabled={isDeleting}
              style={{
                backgroundColor: "var(--color-error)",
                color: "var(--color-bg)",
              }}
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default RewardRulesSection;
