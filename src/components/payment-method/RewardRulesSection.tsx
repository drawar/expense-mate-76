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
  RotateCcw,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Chevron } from "@/components/ui/chevron";
import { SwipeableRow } from "@/components/ui/swipeable-row";
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
    name.includes("green")
  ) {
    return {
      type: "amex-green",
      name: "Amex Green (US)",
      description: "3x restaurants, 3x flights, 3x transit, 1x other",
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
        "6x AF/KLM (EUR), ~4.09x AF/KLM (CAD), 2x restaurants, 1x other + 144 merchant bonuses",
    };
  }

  if (issuer.includes("mbna") && name.includes("amazon")) {
    return {
      type: "mbna-amazon",
      name: "MBNA Amazon.ca Rewards",
      description:
        "2.5x promo (groceries/dining/Amazon, $3K cap until Apr 2026), 1.5x Amazon, 1x other",
    };
  }

  return null;
}

const SWIPE_HINT_STORAGE_KEY = "reward-rules-swipe-hint-shown";

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
  const [expandedRules, setExpandedRules] = useState<Set<string>>(new Set());
  const [showSwipeHint, setShowSwipeHint] = useState(() => {
    // Only show hint if not previously shown
    return !localStorage.getItem(SWIPE_HINT_STORAGE_KEY);
  });

  const handleSwipeHintComplete = useCallback(() => {
    localStorage.setItem(SWIPE_HINT_STORAGE_KEY, "true");
    setShowSwipeHint(false);
  }, []);

  const toggleRuleExpanded = (ruleId: string) => {
    setExpandedRules((prev) => {
      const next = new Set(prev);
      if (next.has(ruleId)) {
        next.delete(ruleId);
      } else {
        next.add(ruleId);
      }
      return next;
    });
  };

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
          // Stable capGroupId survives rule resets - tracking persists
          capGroupId: "amex-cobalt-5x-food-groceries",
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
          "Earn 2 points per $1 at gas stations and local transit (no cap, any currency)",
        enabled: true,
        priority: 2,
        conditions: [
          { type: "mcc", operation: "include", values: twoXMCCs },
          // No currency condition - 2x applies to all currencies including USD
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
        // Only set reward_currency_id - display name comes from join
        const { error: updateError } = await supabase
          .from("payment_methods")
          .update({
            reward_currency_id: aeroplanCurrency.id,
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
        // Only set reward_currency_id - display name comes from join
        const { error: updateError } = await supabase
          .from("payment_methods")
          .update({
            reward_currency_id: asiaMilesCurrency.id,
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

      // ===== MERCHANT-SPECIFIC BONUS RULES =====
      // These are online merchant bonuses with varying earn rates
      addSetupLog("");
      addSetupLog("Creating merchant-specific bonus rules...");

      interface MerchantRule {
        merchants: string[];
        totalMultiplier: number;
        category: string;
      }

      // Source: Official Brim Financial Air France KLM merchant rewards table
      const merchantRules: MerchantRule[] = [
        // Disney+ - 150 flat points per transaction (special case - handled separately)
        // Note: Disney+ uses flat rate rule, created separately below

        // 12x merchants
        {
          merchants: ["Martinic Audio", "MARTINIC"],
          totalMultiplier: 12,
          category: "Entertainment",
        },

        // 8x merchants
        {
          merchants: ["Blinkist", "BLINKIST"],
          totalMultiplier: 8,
          category: "Education",
        },

        // 7x merchants
        {
          merchants: ["Charlotte Tilbury", "CHARLOTTE TILBURY"],
          totalMultiplier: 7,
          category: "Beauty",
        },
        {
          merchants: ["zChocolat", "ZCHOCOLAT"],
          totalMultiplier: 7,
          category: "Food & Gifts",
        },

        // 6x merchants
        {
          merchants: ["jAlbum", "JALBUM"],
          totalMultiplier: 6,
          category: "Software",
        },

        // 4.5x merchants
        {
          merchants: ["GoDaddy", "GODADDY"],
          totalMultiplier: 4.5,
          category: "Software & Services",
        },
        {
          merchants: ["Mideer Toys", "MIDEER"],
          totalMultiplier: 4.5,
          category: "Shopping & Retail",
        },
        {
          merchants: ["Nobis", "NOBIS"],
          totalMultiplier: 4.5,
          category: "Shopping & Retail",
        },
        {
          merchants: ["Petsnowy", "PETSNOWY"],
          totalMultiplier: 4.5,
          category: "Pet",
        },

        // 4x merchants
        {
          merchants: ["Big Bat Box", "BIG BAT BOX"],
          totalMultiplier: 4,
          category: "Shopping & Retail",
        },
        {
          merchants: ["Columbia", "COLUMBIA"],
          totalMultiplier: 4,
          category: "Shopping & Retail",
        },
        {
          merchants: ["Endoca", "ENDOCA"],
          totalMultiplier: 4,
          category: "Health",
        },
        {
          merchants: ["Gigi New York", "GIGI NEW YORK"],
          totalMultiplier: 4,
          category: "Shopping & Retail",
        },
        {
          merchants: ["Hover", "HOVER"],
          totalMultiplier: 4,
          category: "Software & Services",
        },
        {
          merchants: ["Love & Pebble", "LOVE & PEBBLE", "LOVE AND PEBBLE"],
          totalMultiplier: 4,
          category: "Beauty",
        },
        {
          merchants: ["The Outnet", "THE OUTNET", "OUTNET"],
          totalMultiplier: 4,
          category: "Shopping & Retail",
        },
        {
          merchants: ["TurboTax", "TURBOTAX"],
          totalMultiplier: 4,
          category: "Software & Services",
        },
        {
          merchants: ["UPERFECT", "UPERFECT"],
          totalMultiplier: 4,
          category: "Electronics",
        },

        // 3.5x merchants
        {
          merchants: ["Angles90", "ANGLES90"],
          totalMultiplier: 3.5,
          category: "Fitness",
        },
        {
          merchants: ["Backroad Maps", "BACKROAD MAPS"],
          totalMultiplier: 3.5,
          category: "Travel",
        },
        {
          merchants: ["Fanatics", "FANATICS"],
          totalMultiplier: 3.5,
          category: "Shopping & Retail",
        },
        {
          merchants: ["FunnyFuzzy", "FUNNYFUZZY"],
          totalMultiplier: 3.5,
          category: "Pet",
        },
        {
          merchants: ["Stanley", "STANLEY"],
          totalMultiplier: 3.5,
          category: "Shopping & Retail",
        },
        {
          merchants: ["Stutterheim", "STUTTERHEIM"],
          totalMultiplier: 3.5,
          category: "Shopping & Retail",
        },
        {
          merchants: ["lululemon", "LULULEMON"],
          totalMultiplier: 3.5,
          category: "Shopping & Retail",
        },

        // 3x merchants
        {
          merchants: ["ACEBEAM Flashlight", "ACEBEAM"],
          totalMultiplier: 3,
          category: "Electronics",
        },
        {
          merchants: ["Amiro Beauty", "AMIRO"],
          totalMultiplier: 3,
          category: "Beauty",
        },
        {
          merchants: ["Asebbo", "ASEBBO"],
          totalMultiplier: 3,
          category: "Shopping & Retail",
        },
        {
          merchants: ["Bang & Olufsen", "BANG & OLUFSEN", "B&O"],
          totalMultiplier: 3,
          category: "Electronics",
        },
        {
          merchants: ["Cloudfield", "CLOUDFIELD"],
          totalMultiplier: 3,
          category: "Shopping & Retail",
        },
        {
          merchants: ["Crocs", "CROCS"],
          totalMultiplier: 3,
          category: "Shopping & Retail",
        },
        {
          merchants: ["Earthlove", "EARTHLOVE"],
          totalMultiplier: 3,
          category: "Shopping & Retail",
        },
        {
          merchants: ["Europcar", "EUROPCAR"],
          totalMultiplier: 3,
          category: "Travel",
        },
        {
          merchants: ["Farfetch", "FARFETCH"],
          totalMultiplier: 3,
          category: "Shopping & Retail",
        },
        {
          merchants: ["Fofana", "FOFANA"],
          totalMultiplier: 3,
          category: "Shopping & Retail",
        },
        {
          merchants: ["GAFLY", "GAFLY"],
          totalMultiplier: 3,
          category: "Shopping & Retail",
        },
        {
          merchants: ["Hana Emi", "HANA EMI"],
          totalMultiplier: 3,
          category: "Shopping & Retail",
        },
        {
          merchants: ["Happy Sinks", "HAPPY SINKS"],
          totalMultiplier: 3,
          category: "Home",
        },
        {
          merchants: ["Hieno", "HIENO"],
          totalMultiplier: 3,
          category: "Shopping & Retail",
        },
        {
          merchants: ["INDO Trick Scooter", "INDO"],
          totalMultiplier: 3,
          category: "Sports",
        },
        {
          merchants: ["IPRoyal", "IPROYAL"],
          totalMultiplier: 3,
          category: "Software & Services",
        },
        {
          merchants: ["Joseph A Bank", "JOSEPH A BANK", "JOS A BANK"],
          totalMultiplier: 3,
          category: "Shopping & Retail",
        },
        {
          merchants: ["Jukebox", "JUKEBOX"],
          totalMultiplier: 3,
          category: "Entertainment",
        },
        {
          merchants: ["Kailo", "KAILO"],
          totalMultiplier: 3,
          category: "Health",
        },
        {
          merchants: ["LARQ", "LARQ"],
          totalMultiplier: 3,
          category: "Shopping & Retail",
        },
        {
          merchants: ["MLBshop.com", "MLBSHOP", "MLB SHOP"],
          totalMultiplier: 3,
          category: "Shopping & Retail",
        },
        {
          merchants: ["MLS Shop", "MLS SHOP", "MLSSHOP"],
          totalMultiplier: 3,
          category: "Shopping & Retail",
        },
        {
          merchants: ["Mejuri", "MEJURI"],
          totalMultiplier: 3,
          category: "Jewelry",
        },
        {
          merchants: ["Mioeco", "MIOECO"],
          totalMultiplier: 3,
          category: "Home",
        },
        {
          merchants: ["Onemile", "ONEMILE"],
          totalMultiplier: 3,
          category: "Shopping & Retail",
        },
        {
          merchants: ["Ontaki", "ONTAKI"],
          totalMultiplier: 3,
          category: "Shopping & Retail",
        },
        {
          merchants: ["Pure Scentum", "PURE SCENTUM"],
          totalMultiplier: 3,
          category: "Beauty",
        },
        {
          merchants: ["Puzzle Ready", "PUZZLE READY"],
          totalMultiplier: 3,
          category: "Shopping & Retail",
        },
        {
          merchants: ["Reibii", "REIBII"],
          totalMultiplier: 3,
          category: "Home",
        },
        {
          merchants: ["Retro Stage", "RETRO STAGE"],
          totalMultiplier: 3,
          category: "Shopping & Retail",
        },
        {
          merchants: ["Silginnes", "SILGINNES"],
          totalMultiplier: 3,
          category: "Shopping & Retail",
        },
        {
          merchants: ["Speraxsports", "SPERAXSPORTS", "SPERAX"],
          totalMultiplier: 3,
          category: "Sports",
        },
        {
          merchants: ["Steve Madden", "STEVE MADDEN"],
          totalMultiplier: 3,
          category: "Shopping & Retail",
        },
        {
          merchants: ["Striking Viking", "STRIKING VIKING"],
          totalMultiplier: 3,
          category: "Shopping & Retail",
        },
        {
          merchants: ["Throwback Traits", "THROWBACK TRAITS"],
          totalMultiplier: 3,
          category: "Shopping & Retail",
        },
        {
          merchants: ["Tobe Outerwear", "TOBE OUTERWEAR", "TOBE"],
          totalMultiplier: 3,
          category: "Shopping & Retail",
        },
        {
          merchants: ["Torras", "TORRAS"],
          totalMultiplier: 3,
          category: "Electronics",
        },
        {
          merchants: ["Unicoeye", "UNICOEYE"],
          totalMultiplier: 3,
          category: "Beauty",
        },
        {
          merchants: ["Vanpowers", "VANPOWERS"],
          totalMultiplier: 3,
          category: "Electronics",
        },
        {
          merchants: ["VersaDesk", "VERSADESK"],
          totalMultiplier: 3,
          category: "Office",
        },
        {
          merchants: ["Victory Range Hoods", "VICTORY RANGE HOODS"],
          totalMultiplier: 3,
          category: "Home",
        },
        {
          merchants: ["Waterdrop (US)", "WATERDROP"],
          totalMultiplier: 3,
          category: "Shopping & Retail",
        },

        // 2.5x merchants
        {
          merchants: ["AKU Footwear", "AKU"],
          totalMultiplier: 2.5,
          category: "Shopping & Retail",
        },
        {
          merchants: ["Blenders Eyewear", "BLENDERS"],
          totalMultiplier: 2.5,
          category: "Shopping & Retail",
        },
        {
          merchants: ["Camper", "CAMPER"],
          totalMultiplier: 2.5,
          category: "Shopping & Retail",
        },
        {
          merchants: ["Decathlon", "DECATHLON"],
          totalMultiplier: 2.5,
          category: "Sports",
        },
        {
          merchants: ["Fossil", "FOSSIL"],
          totalMultiplier: 2.5,
          category: "Shopping & Retail",
        },
        {
          merchants: ["Keetsa Mattress", "KEETSA"],
          totalMultiplier: 2.5,
          category: "Home",
        },
        {
          merchants: ["Lightailing", "LIGHTAILING"],
          totalMultiplier: 2.5,
          category: "Shopping & Retail",
        },
        {
          merchants: ["NBA Store", "NBA STORE", "NBASTORE"],
          totalMultiplier: 2.5,
          category: "Shopping & Retail",
        },
        {
          merchants: ["NFL Shop", "NFL SHOP", "NFLSHOP"],
          totalMultiplier: 2.5,
          category: "Shopping & Retail",
        },
        {
          merchants: ["Rossignol", "ROSSIGNOL"],
          totalMultiplier: 2.5,
          category: "Sports",
        },
        {
          merchants: ["SOREL", "SOREL"],
          totalMultiplier: 2.5,
          category: "Shopping & Retail",
        },
        {
          merchants: ["Salomon", "SALOMON"],
          totalMultiplier: 2.5,
          category: "Sports",
        },
        {
          merchants: ["Stubhub", "STUBHUB"],
          totalMultiplier: 2.5,
          category: "Entertainment",
        },
        {
          merchants: ["Tilley", "TILLEY"],
          totalMultiplier: 2.5,
          category: "Shopping & Retail",
        },

        // 2x merchants
        {
          merchants: ["AOSEED", "AOSEED"],
          totalMultiplier: 2,
          category: "Shopping & Retail",
        },
        {
          merchants: ["AW Bridal", "AW BRIDAL"],
          totalMultiplier: 2,
          category: "Shopping & Retail",
        },
        {
          merchants: ["Acer", "ACER"],
          totalMultiplier: 2,
          category: "Electronics",
        },
        { merchants: ["Aiper", "AIPER"], totalMultiplier: 2, category: "Home" },
        {
          merchants: ["Allies of Skin", "ALLIES OF SKIN"],
          totalMultiplier: 2,
          category: "Beauty",
        },
        {
          merchants: ["Aquabatics", "AQUABATICS"],
          totalMultiplier: 2,
          category: "Sports",
        },
        {
          merchants: ["Babor", "BABOR"],
          totalMultiplier: 2,
          category: "Beauty",
        },
        {
          merchants: ["Bass Pro Shops", "BASS PRO SHOPS", "BASS PRO"],
          totalMultiplier: 2,
          category: "Shopping & Retail",
        },
        {
          merchants: ["BloomChic", "BLOOMCHIC"],
          totalMultiplier: 2,
          category: "Shopping & Retail",
        },
        {
          merchants: ["Bluetti CA", "BLUETTI"],
          totalMultiplier: 2,
          category: "Electronics",
        },
        {
          merchants: ["Brochu Walker", "BROCHU WALKER"],
          totalMultiplier: 2,
          category: "Shopping & Retail",
        },
        {
          merchants: ["Canadian Coin & Currency", "CANADIAN COIN"],
          totalMultiplier: 2,
          category: "Collectibles",
        },
        {
          merchants: ["DAVIDsTEA", "DAVIDSTEA", "DAVIDS TEA"],
          totalMultiplier: 2,
          category: "Food & Drink",
        },
        {
          merchants: ["GOLF Partner", "GOLF PARTNER"],
          totalMultiplier: 2,
          category: "Sports",
        },
        {
          merchants: ["Herschel", "HERSCHEL"],
          totalMultiplier: 2,
          category: "Shopping & Retail",
        },
        {
          merchants: ["Hockey Supremacy", "HOCKEY SUPREMACY"],
          totalMultiplier: 2,
          category: "Sports",
        },
        {
          merchants: ["Icebreaker", "ICEBREAKER"],
          totalMultiplier: 2,
          category: "Shopping & Retail",
        },
        {
          merchants: ["LUVME HAIR", "LUVME"],
          totalMultiplier: 2,
          category: "Beauty",
        },
        {
          merchants: ["Mackage", "MACKAGE"],
          totalMultiplier: 2,
          category: "Shopping & Retail",
        },
        {
          merchants: ["Muc Off", "MUC OFF", "MUCOFF"],
          totalMultiplier: 2,
          category: "Sports",
        },
        {
          merchants: ["Mustang Survival", "MUSTANG SURVIVAL"],
          totalMultiplier: 2,
          category: "Sports",
        },
        {
          merchants: ["Perfectlens.ca", "PERFECTLENS"],
          totalMultiplier: 2,
          category: "Health",
        },
        {
          merchants: ["Sandals", "SANDALS"],
          totalMultiplier: 2,
          category: "Travel",
        },
        {
          merchants: ["Swanwick", "SWANWICK"],
          totalMultiplier: 2,
          category: "Shopping & Retail",
        },
        {
          merchants: ["Under Armour", "UNDER ARMOUR", "UNDERARMOUR"],
          totalMultiplier: 2,
          category: "Shopping & Retail",
        },
        { merchants: ["Zray", "ZRAY"], totalMultiplier: 2, category: "Sports" },
        {
          merchants: ["iRobot", "IROBOT"],
          totalMultiplier: 2,
          category: "Home",
        },
        {
          merchants: ["illy", "ILLY"],
          totalMultiplier: 2,
          category: "Food & Drink",
        },

        // 1.5x merchants
        { merchants: ["AOR", "AOR"], totalMultiplier: 1.5, category: "Health" },
        {
          merchants: ["AbeBooks", "ABEBOOKS"],
          totalMultiplier: 1.5,
          category: "Shopping & Retail",
        },
        {
          merchants: ["Adagio Teas", "ADAGIO TEAS", "ADAGIO"],
          totalMultiplier: 1.5,
          category: "Food & Drink",
        },
        {
          merchants: ["Alamo", "ALAMO"],
          totalMultiplier: 1.5,
          category: "Travel",
        },
        {
          merchants: ["Ancheer", "ANCHEER"],
          totalMultiplier: 1.5,
          category: "Sports",
        },
        {
          merchants: ["Apple.com", "APPLE.COM", "Apple Store", "APPLE STORE"],
          totalMultiplier: 1.5,
          category: "Electronics",
        },
        {
          merchants: ["Bala", "BALA"],
          totalMultiplier: 1.5,
          category: "Fitness",
        },
        {
          merchants: ["Banbe Eyewear", "BANBE"],
          totalMultiplier: 1.5,
          category: "Shopping & Retail",
        },
        {
          merchants: ["Baron Collection", "BARON COLLECTION"],
          totalMultiplier: 1.5,
          category: "Shopping & Retail",
        },
        {
          merchants: ["Best Western Hotels", "BEST WESTERN"],
          totalMultiplier: 1.5,
          category: "Travel",
        },
        {
          merchants: ["Bose", "BOSE"],
          totalMultiplier: 1.5,
          category: "Electronics",
        },
        {
          merchants: ["Bostanten", "BOSTANTEN"],
          totalMultiplier: 1.5,
          category: "Shopping & Retail",
        },
        {
          merchants: ["Brave Leather", "BRAVE LEATHER"],
          totalMultiplier: 1.5,
          category: "Shopping & Retail",
        },
        {
          merchants: ["Brilliant Earth", "BRILLIANT EARTH"],
          totalMultiplier: 1.5,
          category: "Jewelry",
        },
        {
          merchants: ["Clarins", "CLARINS"],
          totalMultiplier: 1.5,
          category: "Beauty",
        },
        {
          merchants: ["Coast Appliances", "COAST APPLIANCES"],
          totalMultiplier: 1.5,
          category: "Home",
        },
        {
          merchants: ["Coco&Eve", "COCO&EVE", "COCO AND EVE"],
          totalMultiplier: 1.5,
          category: "Beauty",
        },
        {
          merchants: ["DH Gate", "DHGATE", "DH GATE"],
          totalMultiplier: 1.5,
          category: "Shopping & Retail",
        },
        {
          merchants: ["Erno Laszlo", "ERNO LASZLO"],
          totalMultiplier: 1.5,
          category: "Beauty",
        },
        {
          merchants: ["Etihad Airways", "ETIHAD"],
          totalMultiplier: 1.5,
          category: "Travel",
        },
        {
          merchants: ["Gap", "GAP"],
          totalMultiplier: 1.5,
          category: "Shopping & Retail",
        },
        {
          merchants: ["Harry Rosen", "HARRY ROSEN"],
          totalMultiplier: 1.5,
          category: "Shopping & Retail",
        },
        {
          merchants: ["Haven", "HAVEN"],
          totalMultiplier: 1.5,
          category: "Shopping & Retail",
        },
        {
          merchants: ["Hertz", "HERTZ"],
          totalMultiplier: 1.5,
          category: "Travel",
        },
        {
          merchants: ["Logitech", "LOGITECH"],
          totalMultiplier: 1.5,
          category: "Electronics",
        },
        {
          merchants: ["Red Paddle Co", "RED PADDLE"],
          totalMultiplier: 1.5,
          category: "Sports",
        },
        {
          merchants: ["Reolink", "REOLINK"],
          totalMultiplier: 1.5,
          category: "Electronics",
        },
        {
          merchants: ["SFERRA Fine Linens", "SFERRA"],
          totalMultiplier: 1.5,
          category: "Home",
        },
        {
          merchants: ["Sonos", "SONOS"],
          totalMultiplier: 1.5,
          category: "Electronics",
        },
        {
          merchants: ["TFal", "T-FAL", "TFAL"],
          totalMultiplier: 1.5,
          category: "Home",
        },
        {
          merchants: ["Toms", "TOMS"],
          totalMultiplier: 1.5,
          category: "Shopping & Retail",
        },
        {
          merchants: ["TruBar", "TRUBAR"],
          totalMultiplier: 1.5,
          category: "Food & Drink",
        },
        {
          merchants: ["WOWANGEL", "WOWANGEL"],
          totalMultiplier: 1.5,
          category: "Beauty",
        },
        {
          merchants: ["Warby Parker", "WARBY PARKER"],
          totalMultiplier: 1.5,
          category: "Shopping & Retail",
        },
      ];

      // Group by multiplier for logging
      const groupedByMultiplier = new Map<number, MerchantRule[]>();
      for (const rule of merchantRules) {
        const mult = rule.totalMultiplier;
        if (!groupedByMultiplier.has(mult)) {
          groupedByMultiplier.set(mult, []);
        }
        groupedByMultiplier.get(mult)!.push(rule);
      }

      // Sort by multiplier descending (higher earn rates = higher priority)
      const sortedMultipliers = Array.from(groupedByMultiplier.keys()).sort(
        (a, b) => b - a
      );
      let currentPriority = 7; // Start after base rules (which end at priority 6)
      let merchantRulesCreated = 0;

      // Create Disney+ flat rate rule first (150 points per transaction)
      addSetupLog(
        "Creating Disney+ flat rate rule (150 points per transaction)..."
      );
      await repository.createRule({
        cardTypeId: setupCardTypeId,
        name: "150 Flying Blue Miles at Disney+ (Flat)",
        description:
          "Earn 150 Flying Blue Miles per transaction at Disney+ - online purchases only",
        enabled: true,
        priority: currentPriority++,
        conditions: [
          {
            type: "merchant",
            operation: "include",
            values: ["Disney+", "DISNEY+", "Disney Plus", "DISNEYPLUS"],
          },
          {
            type: "transaction_type",
            operation: "include",
            values: ["online"],
          },
        ],
        reward: {
          calculationMethod: "flat_rate",
          baseMultiplier: 150,
          bonusMultiplier: 0,
          pointsCurrency: "Flying Blue Miles",
          pointsRoundingStrategy: "floor",
          amountRoundingStrategy: "none",
          blockSize: 1,
          monthlyCap: null,
          bonusTiers: [],
        },
      });
      merchantRulesCreated++;
      addSetupLog("✅ Disney+ flat rate rule created (150 points/transaction)");

      for (const multiplier of sortedMultipliers) {
        const rules = groupedByMultiplier.get(multiplier)!;
        addSetupLog(`Creating ${rules.length} rules for ${multiplier}x...`);

        for (const merchantRule of rules) {
          const bonusMultiplier = merchantRule.totalMultiplier - 1;

          await repository.createRule({
            cardTypeId: setupCardTypeId,
            name: `${merchantRule.totalMultiplier}x Flying Blue Miles at ${merchantRule.merchants[0]} (Online)`,
            description: `Earn ${merchantRule.totalMultiplier} Flying Blue Miles per $1 at ${merchantRule.merchants[0]} - online purchases only (${merchantRule.category})`,
            enabled: true,
            priority: currentPriority++,
            conditions: [
              {
                type: "merchant",
                operation: "include",
                values: merchantRule.merchants,
              },
              {
                type: "transaction_type",
                operation: "include",
                values: ["online"],
              },
            ],
            reward: {
              calculationMethod: "standard",
              baseMultiplier: 1,
              bonusMultiplier: bonusMultiplier,
              pointsRoundingStrategy: "floor",
              amountRoundingStrategy: "none",
              blockSize: 1,
              monthlyCap: null,
              bonusTiers: [],
            },
          });
          merchantRulesCreated++;
        }
        addSetupLog(`✅ ${rules.length} ${multiplier}x rules created`);
      }
      addSetupLog(`✅ Total: ${merchantRulesCreated} merchant rules created`);

      // Update payment method's reward currency to Flying Blue Miles
      addSetupLog("Setting reward currency to Flying Blue Miles...");
      const { data: flyingBlueCurrency } = await supabase
        .from("reward_currencies")
        .select("id, display_name")
        .eq("code", "flying_blue")
        .single();

      if (flyingBlueCurrency) {
        // Only set reward_currency_id - display name comes from join
        const { error: updateError } = await supabase
          .from("payment_methods")
          .update({
            reward_currency_id: flyingBlueCurrency.id,
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

  const runMBNAAmazonSetup = async () => {
    setIsRunningSetup(true);
    setSetupLog([]);
    setShowSetupLog(true);

    try {
      addSetupLog("Initializing...");
      initializeRuleRepository(supabase);
      const repository = getRuleRepository();

      const setupCardTypeId = cardTypeIdService.generateCardTypeId(
        "MBNA",
        "Amazon.ca Rewards World MasterCard"
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

      // Amazon ecosystem merchants
      const amazonMerchants = [
        "Amazon",
        "AMAZON",
        "AMZN",
        "Amazon.ca",
        "Amazon.com",
        "Prime",
        "PRIME",
        "Amazon Prime",
        "Audible",
        "AUDIBLE",
        "Whole Foods",
        "WHOLE FOODS",
        "Whole Foods Market",
      ];

      // Promotional cap group ID (shared between promo rules)
      const promoCapGroupId = "mbna-amazon-promo-2025";
      const promoStartDate = new Date("2025-10-25");
      const promoEndDate = new Date("2026-04-25");

      // Rule 4: 2.5x Promo on Groceries & Dining (MCCs)
      addSetupLog("Creating 2.5x Promo rule (Groceries & Dining MCCs)...");
      await repository.createRule({
        cardTypeId: setupCardTypeId,
        name: "2.5x Promo (Groceries & Dining)",
        description:
          "Earn 2.5 Amazon Rewards per $1 at grocery stores and restaurants. Valid until Apr 25, 2026 or $3,000 total spend.",
        enabled: true,
        priority: 4,
        conditions: [
          {
            type: "mcc",
            operation: "include",
            values: ["5411", "5812", "5814"], // Grocery, Restaurant, Fast Food
          },
        ],
        reward: {
          calculationMethod: "standard",
          baseMultiplier: 1,
          bonusMultiplier: 1.5, // Total 2.5x
          pointsRoundingStrategy: "nearest",
          amountRoundingStrategy: "none",
          blockSize: 1,
          monthlyCap: 3000,
          monthlyCapType: "spend_amount",
          monthlySpendPeriodType: "promotional",
          capGroupId: promoCapGroupId,
          promoStartDate: promoStartDate,
          bonusTiers: [],
        },
        validFrom: promoStartDate,
        validUntil: promoEndDate,
      });
      addSetupLog("✅ 2.5x Promo rule created (MCCs 5411, 5812, 5814)");

      // Rule 3: 2.5x Promo on Amazon Ecosystem
      addSetupLog("Creating 2.5x Promo rule (Amazon Ecosystem)...");
      await repository.createRule({
        cardTypeId: setupCardTypeId,
        name: "2.5x Promo (Amazon & Affiliates)",
        description:
          "Earn 2.5 Amazon Rewards per $1 at Amazon, Prime, Audible, and Whole Foods. Valid until Apr 25, 2026 or $3,000 total spend.",
        enabled: true,
        priority: 3,
        conditions: [
          {
            type: "merchant",
            operation: "include",
            values: amazonMerchants,
          },
        ],
        reward: {
          calculationMethod: "standard",
          baseMultiplier: 1,
          bonusMultiplier: 1.5, // Total 2.5x
          pointsRoundingStrategy: "nearest",
          amountRoundingStrategy: "none",
          blockSize: 1,
          monthlyCap: 3000,
          monthlyCapType: "spend_amount",
          monthlySpendPeriodType: "promotional",
          capGroupId: promoCapGroupId,
          promoStartDate: promoStartDate,
          bonusTiers: [],
        },
        validFrom: promoStartDate,
        validUntil: promoEndDate,
      });
      addSetupLog("✅ 2.5x Promo rule created (Amazon ecosystem)");

      // Rule 2: 1.5x Permanent on Amazon Ecosystem
      addSetupLog("Creating 1.5x Permanent rule (Amazon Ecosystem)...");
      await repository.createRule({
        cardTypeId: setupCardTypeId,
        name: "1.5x Amazon & Affiliates",
        description:
          "Earn 1.5 Amazon Rewards per $1 at Amazon, Prime, Audible, and Whole Foods Market stores",
        enabled: true,
        priority: 2,
        conditions: [
          {
            type: "merchant",
            operation: "include",
            values: amazonMerchants,
          },
        ],
        reward: {
          calculationMethod: "standard",
          baseMultiplier: 1,
          bonusMultiplier: 0.5, // Total 1.5x
          pointsRoundingStrategy: "nearest",
          amountRoundingStrategy: "none",
          blockSize: 1,
          monthlyCap: null,
          bonusTiers: [],
        },
      });
      addSetupLog("✅ 1.5x Permanent rule created (Amazon ecosystem)");

      // Rule 1: 1x Base on Everything Else
      addSetupLog("Creating 1x Base rule...");
      await repository.createRule({
        cardTypeId: setupCardTypeId,
        name: "1x Base Rewards",
        description: "Earn 1 Amazon Reward point per $1 on all other purchases",
        enabled: true,
        priority: 1,
        conditions: [],
        reward: {
          calculationMethod: "standard",
          baseMultiplier: 1,
          bonusMultiplier: 0,
          pointsRoundingStrategy: "nearest",
          amountRoundingStrategy: "nearest", // Base rule rounds amount
          blockSize: 1,
          monthlyCap: null,
          bonusTiers: [],
        },
      });
      addSetupLog("✅ 1x Base rule created");

      // Update payment method's reward currency to Amazon Rewards
      addSetupLog("Setting reward currency to Amazon Rewards...");
      const { data: amazonCurrency } = await supabase
        .from("reward_currencies")
        .select("id, display_name")
        .eq("code", "amazon_rewards_ca")
        .maybeSingle();

      if (amazonCurrency) {
        // Only set reward_currency_id - display name comes from join
        const { error: updateError } = await supabase
          .from("payment_methods")
          .update({
            reward_currency_id: amazonCurrency.id,
          })
          .eq("id", paymentMethod.id);

        if (updateError) {
          addSetupLog(
            `⚠️ Warning: Could not set reward currency: ${updateError.message}`
          );
        } else {
          addSetupLog(
            `✅ Reward currency set to ${amazonCurrency.display_name}`
          );
        }
      } else {
        addSetupLog(
          "⚠️ Warning: Amazon Rewards currency not found in database. Please create amazon_rewards_ca currency."
        );
      }

      addSetupLog("");
      addSetupLog("✅ Setup complete!");
      addSetupLog(
        "📝 Note: Promotional rules share a $3,000 total spend cap until Apr 25, 2026."
      );
      toast.success("MBNA Amazon.ca Rewards rules configured successfully!");
      onRulesChanged?.();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      addSetupLog(`❌ Error: ${message}`);
      toast.error("Setup failed", { description: message });
    } finally {
      setIsRunningSetup(false);
    }
  };

  const runAmexGreenSetup = async () => {
    setIsRunningSetup(true);
    setSetupLog([]);
    setShowSetupLog(true);

    try {
      addSetupLog("Initializing...");
      initializeRuleRepository(supabase);
      const repository = getRuleRepository();

      const setupCardTypeId = cardTypeIdService.generateCardTypeId(
        "American Express",
        "Green"
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

      // MCCs for restaurants (excludes bars 5813 and convenience stores 5499)
      const restaurantMCCs = ["5811", "5812", "5814"];

      // MCCs for airlines (direct bookings) - 3000-3299 range + 4511
      const airlineMCCs = [
        ...Array.from({ length: 300 }, (_, i) => String(3000 + i)),
        "4511",
      ];

      // Amex Travel merchants
      const amexTravelMerchants = [
        "AMEX TRAVEL",
        "AMEXTRAVEL",
        "AMERICAN EXPRESS TRAVEL",
        "AMEX VACATIONS",
      ];

      // MCCs for transit (trains, taxicabs, rideshare, ferries, tolls, parking, buses, subways)
      const transitMCCs = [
        "4011",
        "4111",
        "4112",
        "4121",
        "4131",
        "4468",
        "4784",
        "4789",
        "7523",
      ];

      // Rule 1: 3x on Restaurants Worldwide
      addSetupLog("Creating 3x Restaurants rule...");
      await repository.createRule({
        cardTypeId: setupCardTypeId,
        name: "3x Points on Restaurants",
        description:
          "Earn 3 points per $1 at restaurants worldwide (excludes bars, nightclubs, convenience stores)",
        enabled: true,
        priority: 5,
        conditions: [
          { type: "mcc", operation: "include", values: restaurantMCCs },
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
      addSetupLog("✅ 3x Restaurants rule created (worldwide, no cap)");

      // Rule 2: 3x on Flights (airlines MCC)
      addSetupLog("Creating 3x Flights rule...");
      await repository.createRule({
        cardTypeId: setupCardTypeId,
        name: "3x Points on Flights",
        description:
          "Earn 3 points per $1 on flights booked directly with airlines",
        enabled: true,
        priority: 4,
        conditions: [
          { type: "mcc", operation: "include", values: airlineMCCs },
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
      addSetupLog("✅ 3x Flights rule created (no cap)");

      // Rule 2b: 3x on Amex Travel (merchant match)
      addSetupLog("Creating 3x Amex Travel rule...");
      await repository.createRule({
        cardTypeId: setupCardTypeId,
        name: "3x Points on Amex Travel",
        description:
          "Earn 3 points per $1 on purchases through amextravel.com or Amex Travel App",
        enabled: true,
        priority: 4,
        conditions: [
          {
            type: "merchant",
            operation: "include",
            values: amexTravelMerchants,
          },
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
      addSetupLog("✅ 3x Amex Travel rule created (no cap)");

      // Rule 3: 3x on Transit
      addSetupLog("Creating 3x Transit rule...");
      await repository.createRule({
        cardTypeId: setupCardTypeId,
        name: "3x Points on Transit",
        description:
          "Earn 3 points per $1 on transit including trains, buses, taxis, rideshares, ferries, tolls, and parking",
        enabled: true,
        priority: 3,
        conditions: [
          { type: "mcc", operation: "include", values: transitMCCs },
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
      addSetupLog("✅ 3x Transit rule created (no cap)");

      // Rule 4: 1x on Everything Else
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
      toast.success("Amex Green (US) rules configured successfully!");
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
      case "amex-green":
        runAmexGreenSetup();
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
      case "mbna-amazon":
        runMBNAAmazonSetup();
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
            style={{
              color: "var(--color-text-primary)",
              letterSpacing: "0.2px",
            }}
          >
            <CoinsIcon
              className="h-5 w-5 mr-2"
              style={{ color: "var(--color-warning)" }}
            />
            Reward Rules
            {rewardRules.length > 0 && (
              <span
                className="ml-2 text-[13px] font-medium"
                style={{
                  backgroundColor: "rgba(124, 152, 133, 0.15)",
                  color: "#A8C4AF",
                  padding: "2px 8px",
                  borderRadius: "10px",
                }}
              >
                {rewardRules.length}
              </span>
            )}
          </h3>
          <div className="flex gap-1">
            <TooltipProvider delayDuration={300}>
              {/* Show Quick Setup prominently when no rules exist */}
              {quickSetupConfig && rewardRules.length === 0 ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={handleQuickSetup}
                      disabled={isRunningSetup}
                      className="flex items-center text-sm font-medium transition-all duration-300 ease-out hover:brightness-95 active:scale-[0.98] disabled:opacity-50"
                      style={{
                        backgroundColor: "#7C9885",
                        color: "#1A1D1F",
                        borderRadius: "10px",
                        padding: "16px 24px",
                        letterSpacing: "0.3px",
                        fontWeight: 500,
                      }}
                      aria-label="Quick setup - auto-configure common reward rules"
                    >
                      {isRunningSetup ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Settings2 className="h-4 w-4 mr-2" />
                      )}
                      Quick Setup
                    </button>
                  </TooltipTrigger>
                  <TooltipContent
                    side="bottom"
                    className="bg-[var(--color-card-bg)] border-[var(--color-border)] text-[var(--color-text-primary)]"
                  >
                    <p className="font-medium">Auto-configure rules</p>
                    <p className="text-xs text-[var(--color-text-tertiary)]">
                      {quickSetupConfig.description}
                    </p>
                  </TooltipContent>
                </Tooltip>
              ) : (
                <>
                  {/* Icon-only Reset Rules button */}
                  {quickSetupConfig && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={handleQuickSetup}
                          disabled={isRunningSetup}
                          className="flex items-center justify-center transition-all duration-300 ease-out active:scale-[0.98] disabled:opacity-50 hover:bg-[var(--color-surface)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                          style={{
                            backgroundColor: "transparent",
                            border: "none",
                            borderRadius: "8px",
                            width: "44px",
                            height: "44px",
                            outlineColor: "var(--color-accent)",
                          }}
                          aria-label="Reset rules to defaults"
                        >
                          {isRunningSetup ? (
                            <Loader2
                              className="h-[22px] w-[22px] animate-spin"
                              style={{ color: "#7C9885" }}
                            />
                          ) : (
                            <RotateCcw
                              className="h-[22px] w-[22px]"
                              style={{ color: "#A8A5A0" }}
                            />
                          )}
                        </button>
                      </TooltipTrigger>
                      <TooltipContent
                        side="bottom"
                        className="bg-[var(--color-card-bg)] border-[var(--color-border)] text-[var(--color-text-primary)]"
                      >
                        <p className="font-medium">Reset Rules</p>
                        <p className="text-xs text-[var(--color-text-tertiary)]">
                          Restore default {quickSetupConfig.name} rules
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                  {/* Icon-only Add Rule button */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={handleAddRule}
                        className="flex items-center justify-center transition-all duration-300 ease-out hover:brightness-95 active:scale-[0.98]"
                        style={{
                          backgroundColor: "#7C9885",
                          borderRadius: "8px",
                          width: "44px",
                          height: "44px",
                        }}
                        aria-label="Add new reward rule"
                      >
                        <PlusIcon
                          className="h-[22px] w-[22px]"
                          style={{ color: "#1A1D1F" }}
                        />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent
                      side="bottom"
                      className="bg-[var(--color-card-bg)] border-[var(--color-border)] text-[var(--color-text-primary)]"
                    >
                      <p className="font-medium">Add Rule</p>
                      <p className="text-xs text-[var(--color-text-tertiary)]">
                        Create a custom reward rule
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </>
              )}
            </TooltipProvider>
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
          <div className="space-y-0">
            {rewardRules
              .sort((a, b) => b.priority - a.priority)
              .map((rule, index, sortedRules) => (
                <div key={rule.id}>
                  <SwipeableRow
                    actions={[
                      {
                        key: "edit",
                        label: "Edit",
                        icon: <PencilIcon className="h-5 w-5" />,
                        backgroundColor: "#7C9885",
                        color: "#1A1D1F",
                        onClick: () => handleEditRule(rule),
                        width: 80,
                      },
                      {
                        key: "delete",
                        label: "Delete",
                        icon: <TrashIcon className="h-5 w-5" />,
                        backgroundColor: "#A86F64",
                        color: "#E8E6E3",
                        onClick: () => setDeleteConfirmRule(rule),
                        width: 80,
                      },
                    ]}
                    style={{ borderRadius: "8px" }}
                    showHint={index === 0 && showSwipeHint}
                    onHintComplete={handleSwipeHintComplete}
                  >
                    <div
                      className="p-3 cursor-pointer"
                      style={{
                        backgroundColor: "var(--color-surface)",
                        borderRadius: "8px",
                        minHeight: "72px",
                      }}
                      onClick={() => toggleRuleExpanded(rule.id)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          toggleRuleExpanded(rule.id);
                        }
                      }}
                      aria-expanded={expandedRules.has(rule.id)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className="font-medium text-sm"
                              style={{ color: "var(--color-text-primary)" }}
                            >
                              {rule.name}
                            </span>
                            {rule.reward.monthlyCap && (
                              <span
                                className="text-sm px-2 py-0.5"
                                style={{
                                  color: "var(--color-text-tertiary)",
                                  border: "1px solid var(--color-border)",
                                  borderRadius: "4px",
                                }}
                              >
                                Monthly cap:{" "}
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
                            className={`text-sm mt-1 ${
                              expandedRules.has(rule.id) ? "" : "line-clamp-2"
                            }`}
                            style={{ color: "var(--color-text-secondary)" }}
                          >
                            {rule.description}
                          </p>
                          {/* Additional info when expanded */}
                          {expandedRules.has(rule.id) && (
                            <div
                              className="mt-3 pt-3 space-y-1"
                              style={{
                                borderTop: "1px solid rgba(58, 61, 63, 0.4)",
                              }}
                            >
                              {rule.conditions.some(
                                (c) => c.type === "currency"
                              ) && (
                                <p
                                  className="text-xs"
                                  style={{
                                    color: "var(--color-text-tertiary)",
                                  }}
                                >
                                  Currency:{" "}
                                  {rule.conditions
                                    .filter((c) => c.type === "currency")
                                    .flatMap((c) => c.values)
                                    .join(", ")}
                                </p>
                              )}
                              <p
                                className="text-xs"
                                style={{ color: "var(--color-text-tertiary)" }}
                              >
                                Priority: {rule.priority}
                              </p>
                              <p
                                className="text-xs"
                                style={{ color: "var(--color-text-tertiary)" }}
                              >
                                Matched by:{" "}
                                {rule.conditions.length > 0
                                  ? rule.conditions
                                      .map((c) => c.type)
                                      .join(", ")
                                  : "All purchases"}
                              </p>
                            </div>
                          )}
                        </div>
                        {/* Chevron indicator */}
                        <Chevron
                          direction={expandedRules.has(rule.id) ? "up" : "down"}
                          size="medium"
                          className="mt-0.5 transition-transform duration-200"
                        />
                      </div>
                    </div>
                  </SwipeableRow>
                  {/* Divider between rules */}
                  {index < sortedRules.length - 1 && (
                    <div
                      style={{
                        borderTop: "1px solid rgba(58, 61, 63, 0.4)",
                        margin: "16px 0",
                      }}
                    />
                  )}
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Rule Editor Dialog */}
      <Dialog open={isEditorOpen} onOpenChange={setIsEditorOpen}>
        <DialogContent
          className="max-w-2xl max-h-[85vh] flex flex-col overflow-hidden"
          hideCloseButton
        >
          <DialogHeader showCloseButton>
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
            <AlertDialogTitle>Delete Reward Rule</AlertDialogTitle>
            <AlertDialogDescription>
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
