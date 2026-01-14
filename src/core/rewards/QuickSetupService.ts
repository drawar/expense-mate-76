/**
 * QuickSetupService - Automated reward rule initialization for known card types
 *
 * This service provides automatic setup of reward rules when a card is added
 * from the catalog. It encapsulates the logic previously scattered across
 * individual setup scripts and UI components.
 */

import { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import {
  RuleRepository,
  getRuleRepository,
  initializeRuleRepository,
} from "./RuleRepository";
import { PaymentMethod } from "@/types";

export type QuickSetupType =
  | "amex-cobalt"
  | "amex-platinum"
  | "amex-green"
  | "amex-aeroplan-reserve"
  | "neo-cathay"
  | "hsbc-revolution"
  | "brim-afklm"
  | "mbna-amazon";

export interface QuickSetupConfig {
  type: QuickSetupType;
  name: string;
  description: string;
}

export interface QuickSetupResult {
  success: boolean;
  rulesCreated: number;
  error?: string;
}

/**
 * Determines if a payment method has a quick setup available
 */
export function getQuickSetupConfig(
  paymentMethod: Pick<PaymentMethod, "issuer" | "name">
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

/**
 * QuickSetupService class for automated reward rule initialization
 */
export class QuickSetupService {
  private supabase: SupabaseClient;
  private repository: RuleRepository;

  constructor() {
    this.supabase = supabase;
    initializeRuleRepository(this.supabase);
    this.repository = getRuleRepository();
  }

  /**
   * Run quick setup for a payment method if one is available
   * @param paymentMethod The payment method to set up rules for
   * @param cardTypeId The card type ID to use for the rules
   * @returns Result of the setup operation
   */
  async runSetupIfAvailable(
    paymentMethod: Pick<PaymentMethod, "id" | "issuer" | "name">,
    cardTypeId: string
  ): Promise<QuickSetupResult> {
    const config = getQuickSetupConfig(paymentMethod);
    if (!config) {
      return { success: true, rulesCreated: 0 };
    }

    return this.runSetup(config.type, cardTypeId, paymentMethod.id);
  }

  /**
   * Run a specific setup type
   */
  async runSetup(
    setupType: QuickSetupType,
    cardTypeId: string,
    paymentMethodId?: string
  ): Promise<QuickSetupResult> {
    try {
      // Delete existing rules first
      await this.deleteExistingRules(cardTypeId);

      // Run the appropriate setup
      switch (setupType) {
        case "amex-cobalt":
          return await this.setupAmexCobalt(cardTypeId);
        case "amex-platinum":
          return await this.setupAmexPlatinum(cardTypeId);
        case "amex-green":
          return await this.setupAmexGreen(cardTypeId);
        case "amex-aeroplan-reserve":
          return await this.setupAmexAeroplanReserve(
            cardTypeId,
            paymentMethodId
          );
        case "neo-cathay":
          return await this.setupNeoCathay(cardTypeId, paymentMethodId);
        case "hsbc-revolution":
          return await this.setupHSBCRevolution(cardTypeId);
        case "brim-afklm":
          return await this.setupBrimAFKLM(cardTypeId);
        case "mbna-amazon":
          return await this.setupMBNAAmazon(cardTypeId);
        default:
          return {
            success: false,
            rulesCreated: 0,
            error: `Unknown setup type: ${setupType}`,
          };
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return { success: false, rulesCreated: 0, error: message };
    }
  }

  private async deleteExistingRules(cardTypeId: string): Promise<void> {
    const { data: existingRules } = await this.supabase
      .from("reward_rules")
      .select("id")
      .eq("card_type_id", cardTypeId);

    if (existingRules && existingRules.length > 0) {
      for (const rule of existingRules) {
        await this.repository.deleteRule(rule.id);
      }
    }
  }

  private async setupAmexCobalt(cardTypeId: string): Promise<QuickSetupResult> {
    const fiveXMCCs = [
      "5811",
      "5812",
      "5813",
      "5814", // Dining
      "5411",
      "5422",
      "5441",
      "5451", // Groceries
      "5499", // Food delivery
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
    const twoXMCCs = [
      "5541",
      "5542", // Gas
      "4111",
      "4121",
      "4131",
      "4789",
      "4011", // Transit
    ];

    // 5x on Food & Groceries (CAD only, $2,500 monthly spend cap)
    await this.repository.createRule({
      cardTypeId,
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
        capGroupId: "amex-cobalt-5x-food-groceries",
        bonusTiers: [],
      },
    });

    // 3x on Streaming (CAD only)
    await this.repository.createRule({
      cardTypeId,
      name: "3x Points on Streaming",
      description:
        "Earn 3 points per $1 CAD on eligible streaming subscriptions (no cap)",
      enabled: true,
      priority: 3,
      conditions: [
        { type: "merchant", operation: "include", values: streamingMerchants },
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

    // 2x on Gas & Transit (any currency)
    await this.repository.createRule({
      cardTypeId,
      name: "2x Points on Gas & Transit",
      description:
        "Earn 2 points per $1 at gas stations and local transit (no cap, any currency)",
      enabled: true,
      priority: 2,
      conditions: [{ type: "mcc", operation: "include", values: twoXMCCs }],
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

    // 1x on Everything Else
    await this.repository.createRule({
      cardTypeId,
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
        bonusTiers: [],
      },
    });

    return { success: true, rulesCreated: 4 };
  }

  private async setupAmexPlatinum(
    cardTypeId: string
  ): Promise<QuickSetupResult> {
    const diningMCCs = ["5811", "5812", "5813", "5814", "5499"];
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
      // Rail and Water Transport
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

    // 2x on Dining in Canada (CAD only)
    await this.repository.createRule({
      cardTypeId,
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
        bonusTiers: [],
      },
    });

    // 2x on Travel Worldwide
    await this.repository.createRule({
      cardTypeId,
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
        bonusTiers: [],
      },
    });

    // 1x on Everything Else
    await this.repository.createRule({
      cardTypeId,
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
        bonusTiers: [],
      },
    });

    return { success: true, rulesCreated: 3 };
  }

  private async setupAmexGreen(cardTypeId: string): Promise<QuickSetupResult> {
    const restaurantMCCs = ["5811", "5812", "5813", "5814"];
    const airlineMCCs = [
      ...Array.from({ length: 300 }, (_, i) => String(3000 + i)),
      "4511",
    ];
    const transitMCCs = ["4111", "4121", "4131", "4789", "4011"];

    // 3x on Restaurants
    await this.repository.createRule({
      cardTypeId,
      name: "3x Points on Restaurants",
      description: "Earn 3 points per $1 at restaurants worldwide",
      enabled: true,
      priority: 4,
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

    // 3x on Flights
    await this.repository.createRule({
      cardTypeId,
      name: "3x Points on Flights",
      description:
        "Earn 3 points per $1 on flights booked directly with airlines or amextravel.com",
      enabled: true,
      priority: 3,
      conditions: [{ type: "mcc", operation: "include", values: airlineMCCs }],
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

    // 3x on Transit
    await this.repository.createRule({
      cardTypeId,
      name: "3x Points on Transit",
      description: "Earn 3 points per $1 on transit including rideshare",
      enabled: true,
      priority: 2,
      conditions: [{ type: "mcc", operation: "include", values: transitMCCs }],
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

    // 1x on Everything Else
    await this.repository.createRule({
      cardTypeId,
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
        bonusTiers: [],
      },
    });

    return { success: true, rulesCreated: 4 };
  }

  private async setupAmexAeroplanReserve(
    cardTypeId: string,
    paymentMethodId?: string
  ): Promise<QuickSetupResult> {
    const diningMCCs = ["5811", "5812", "5813", "5814", "5499"];

    // 3x on Air Canada Direct Purchases
    await this.repository.createRule({
      cardTypeId,
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
        bonusTiers: [],
      },
    });

    // 2x on Dining & Food Delivery (CAD only)
    await this.repository.createRule({
      cardTypeId,
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
        bonusTiers: [],
      },
    });

    // 1.25x on Everything Else
    await this.repository.createRule({
      cardTypeId,
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
        bonusTiers: [],
      },
    });

    // Update payment method's reward currency to Aeroplan Points
    if (paymentMethodId) {
      const { data: aeroplanCurrency } = await this.supabase
        .from("reward_currencies")
        .select("id")
        .eq("code", "aeroplan")
        .single();

      if (aeroplanCurrency) {
        await this.supabase
          .from("payment_methods")
          .update({ reward_currency_id: aeroplanCurrency.id })
          .eq("id", paymentMethodId);
      }
    }

    return { success: true, rulesCreated: 3 };
  }

  private async setupNeoCathay(
    cardTypeId: string,
    paymentMethodId?: string
  ): Promise<QuickSetupResult> {
    const cathayPacificMCC = "3099";
    const cathayPacificMerchants = [
      "Cathay Pacific",
      "CATHAY PACIFIC",
      "CATHAYPACIFIC",
      "CATHAYPACAIR",
    ];

    // 4x on Cathay Pacific (MCC match)
    await this.repository.createRule({
      cardTypeId,
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
        bonusTiers: [],
      },
    });

    // 4x on Cathay Pacific (Merchant match)
    await this.repository.createRule({
      cardTypeId,
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
        bonusTiers: [],
      },
    });

    // 2x on Foreign Currency
    await this.repository.createRule({
      cardTypeId,
      name: "2x Asia Miles on Foreign Currency",
      description: "Earn 2 Asia Miles per $1 on foreign currency transactions",
      enabled: true,
      priority: 2,
      conditions: [
        { type: "currency", operation: "not_equals", values: ["CAD"] },
      ],
      reward: {
        calculationMethod: "standard",
        baseMultiplier: 1,
        bonusMultiplier: 1,
        pointsRoundingStrategy: "floor",
        amountRoundingStrategy: "ceiling",
        blockSize: 1,
        bonusTiers: [],
      },
    });

    // 1x on Everything Else
    await this.repository.createRule({
      cardTypeId,
      name: "1x Asia Miles on All Other Purchases",
      description: "Earn 1 Asia Mile per $1 on all other purchases",
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
        bonusTiers: [],
      },
    });

    // Update payment method's reward currency to Asia Miles
    if (paymentMethodId) {
      const { data: asiaMilesCurrency } = await this.supabase
        .from("reward_currencies")
        .select("id")
        .eq("code", "asia-miles")
        .single();

      if (asiaMilesCurrency) {
        await this.supabase
          .from("payment_methods")
          .update({ reward_currency_id: asiaMilesCurrency.id })
          .eq("id", paymentMethodId);
      }
    }

    return { success: true, rulesCreated: 4 };
  }

  private async setupHSBCRevolution(
    cardTypeId: string
  ): Promise<QuickSetupResult> {
    const onlineContactlessMCCs = [
      // Online shopping
      "5815",
      "5816",
      "5817",
      "5818",
      // Travel
      ...Array.from({ length: 300 }, (_, i) => String(3000 + i)),
      "4511",
      // Hotels
      ...Array.from({ length: 299 }, (_, i) => String(3501 + i)),
      "7011",
    ];

    // 10x on Online Travel & Contactless (promotional until Feb 2026)
    await this.repository.createRule({
      cardTypeId,
      name: "10x Points on Online Travel & Contactless",
      description:
        "Earn 10 points per $1 on online travel bookings and contactless payments (promotional until Feb 2026)",
      enabled: true,
      priority: 2,
      conditions: [
        { type: "mcc", operation: "include", values: onlineContactlessMCCs },
      ],
      reward: {
        calculationMethod: "standard",
        baseMultiplier: 1,
        bonusMultiplier: 9,
        pointsRoundingStrategy: "nearest",
        amountRoundingStrategy: "none",
        blockSize: 1,
        bonusTiers: [],
      },
    });

    // 1x on Everything Else
    await this.repository.createRule({
      cardTypeId,
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
        bonusTiers: [],
      },
    });

    return { success: true, rulesCreated: 2 };
  }

  private async setupBrimAFKLM(cardTypeId: string): Promise<QuickSetupResult> {
    const afklmMerchants = [
      "Air France",
      "AIR FRANCE",
      "AIRFRANCE",
      "KLM",
      "KLM ROYAL DUTCH",
    ];
    const restaurantMCCs = ["5811", "5812", "5813", "5814"];

    // 6x on Air France/KLM (EUR)
    await this.repository.createRule({
      cardTypeId,
      name: "6x Flying Blue Miles on AF/KLM (EUR)",
      description:
        "Earn 6 Flying Blue miles per €1 on Air France and KLM purchases in EUR",
      enabled: true,
      priority: 4,
      conditions: [
        { type: "merchant", operation: "include", values: afklmMerchants },
        { type: "currency", operation: "equals", values: ["EUR"] },
      ],
      reward: {
        calculationMethod: "standard",
        baseMultiplier: 1,
        bonusMultiplier: 5,
        pointsRoundingStrategy: "nearest",
        amountRoundingStrategy: "none",
        blockSize: 1,
        bonusTiers: [],
      },
    });

    // ~4.09x on Air France/KLM (CAD) - 6 miles per €1.47 CAD (1 EUR = 1.47 CAD approx)
    await this.repository.createRule({
      cardTypeId,
      name: "4x Flying Blue Miles on AF/KLM (CAD)",
      description:
        "Earn ~4 Flying Blue miles per $1 CAD on Air France and KLM purchases",
      enabled: true,
      priority: 3,
      conditions: [
        { type: "merchant", operation: "include", values: afklmMerchants },
        { type: "currency", operation: "equals", values: ["CAD"] },
      ],
      reward: {
        calculationMethod: "standard",
        baseMultiplier: 1,
        bonusMultiplier: 3,
        pointsRoundingStrategy: "nearest",
        amountRoundingStrategy: "none",
        blockSize: 1,
        bonusTiers: [],
      },
    });

    // 2x on Restaurants
    await this.repository.createRule({
      cardTypeId,
      name: "2x Flying Blue Miles on Restaurants",
      description: "Earn 2 Flying Blue miles per $1 at restaurants",
      enabled: true,
      priority: 2,
      conditions: [
        { type: "mcc", operation: "include", values: restaurantMCCs },
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

    // 1x on Everything Else
    await this.repository.createRule({
      cardTypeId,
      name: "1x Flying Blue Miles on All Other Purchases",
      description: "Earn 1 Flying Blue mile per $1 on all other purchases",
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
        bonusTiers: [],
      },
    });

    return { success: true, rulesCreated: 4 };
  }

  private async setupMBNAAmazon(cardTypeId: string): Promise<QuickSetupResult> {
    const promoMCCs = [
      "5411",
      "5422",
      "5441",
      "5451", // Groceries
      "5811",
      "5812",
      "5813",
      "5814", // Dining
    ];
    const amazonMerchants = ["Amazon", "AMAZON", "AMAZON.CA", "Amazon.ca"];

    // 2.5x on Groceries, Dining, and Amazon (promotional until Apr 2026, $3K cap)
    await this.repository.createRule({
      cardTypeId,
      name: "2.5x Points on Groceries, Dining & Amazon (Promo)",
      description:
        "Earn 2.5 points per $1 on groceries, dining, and Amazon.ca (up to $3,000/month, until Apr 2026)",
      enabled: true,
      priority: 3,
      conditions: [{ type: "mcc", operation: "include", values: promoMCCs }],
      reward: {
        calculationMethod: "standard",
        baseMultiplier: 1,
        bonusMultiplier: 1.5,
        pointsRoundingStrategy: "nearest",
        amountRoundingStrategy: "none",
        blockSize: 1,
        monthlyCap: 3000,
        monthlyCapType: "spend_amount",
        monthlySpendPeriodType: "calendar",
        capGroupId: "mbna-amazon-promo-2.5x",
        bonusTiers: [],
      },
    });

    // 2.5x on Amazon (promotional - separate rule for merchant match)
    await this.repository.createRule({
      cardTypeId,
      name: "2.5x Points on Amazon.ca (Promo)",
      description:
        "Earn 2.5 points per $1 on Amazon.ca purchases (up to $3,000/month, until Apr 2026)",
      enabled: true,
      priority: 4,
      conditions: [
        { type: "merchant", operation: "include", values: amazonMerchants },
      ],
      reward: {
        calculationMethod: "standard",
        baseMultiplier: 1,
        bonusMultiplier: 1.5,
        pointsRoundingStrategy: "nearest",
        amountRoundingStrategy: "none",
        blockSize: 1,
        monthlyCap: 3000,
        monthlyCapType: "spend_amount",
        monthlySpendPeriodType: "calendar",
        capGroupId: "mbna-amazon-promo-2.5x",
        bonusTiers: [],
      },
    });

    // 1.5x on Amazon (permanent rate after promo ends)
    await this.repository.createRule({
      cardTypeId,
      name: "1.5x Points on Amazon.ca",
      description:
        "Earn 1.5 points per $1 on Amazon.ca purchases (permanent rate)",
      enabled: false, // Disabled until promo ends
      priority: 2,
      conditions: [
        { type: "merchant", operation: "include", values: amazonMerchants },
      ],
      reward: {
        calculationMethod: "standard",
        baseMultiplier: 1,
        bonusMultiplier: 0.5,
        pointsRoundingStrategy: "nearest",
        amountRoundingStrategy: "none",
        blockSize: 1,
        bonusTiers: [],
      },
    });

    // 1x on Everything Else
    await this.repository.createRule({
      cardTypeId,
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
        bonusTiers: [],
      },
    });

    return { success: true, rulesCreated: 4 };
  }
}

// Export singleton instance
let quickSetupServiceInstance: QuickSetupService | null = null;

export function getQuickSetupService(): QuickSetupService {
  if (!quickSetupServiceInstance) {
    quickSetupServiceInstance = new QuickSetupService();
  }
  return quickSetupServiceInstance;
}
