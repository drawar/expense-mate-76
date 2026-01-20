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
  | "hsbc-travelone"
  | "brim-afklm"
  | "mbna-amazon"
  | "dbs-wwmc";

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

  if (
    issuer.includes("hsbc") &&
    (name.includes("travelone") || name.includes("travel one"))
  ) {
    return {
      type: "hsbc-travelone",
      name: "HSBC TravelOne",
      description: "6x foreign currency, 3x local spend (HSBC Rewards Points)",
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

  if (issuer.includes("dbs") && name.includes("woman")) {
    return {
      type: "dbs-wwmc",
      name: "DBS Woman's World",
      description: "10x online ($1K cap/month = 4 mpd), 1x other (0.4 mpd)",
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
   * @param cardCatalogId The card catalog UUID to use for the rules
   * @returns Result of the setup operation
   */
  async runSetupIfAvailable(
    paymentMethod: Pick<PaymentMethod, "id" | "issuer" | "name">,
    cardCatalogId: string
  ): Promise<QuickSetupResult> {
    const config = getQuickSetupConfig(paymentMethod);
    if (!config) {
      return { success: true, rulesCreated: 0 };
    }

    return this.runSetup(config.type, cardCatalogId, paymentMethod.id);
  }

  /**
   * Run a specific setup type
   */
  async runSetup(
    setupType: QuickSetupType,
    cardCatalogId: string,
    paymentMethodId?: string
  ): Promise<QuickSetupResult> {
    try {
      // Delete existing rules first
      await this.deleteExistingRules(cardCatalogId);

      // Run the appropriate setup
      switch (setupType) {
        case "amex-cobalt":
          return await this.setupAmexCobalt(cardCatalogId);
        case "amex-platinum":
          return await this.setupAmexPlatinum(cardCatalogId);
        case "amex-green":
          return await this.setupAmexGreen(cardCatalogId);
        case "amex-aeroplan-reserve":
          return await this.setupAmexAeroplanReserve(
            cardCatalogId,
            paymentMethodId
          );
        case "neo-cathay":
          return await this.setupNeoCathay(cardCatalogId, paymentMethodId);
        case "hsbc-revolution":
          return await this.setupHSBCRevolution(cardCatalogId);
        case "hsbc-travelone":
          return await this.setupHSBCTravelOne(cardCatalogId);
        case "brim-afklm":
          return await this.setupBrimAFKLM(cardCatalogId);
        case "mbna-amazon":
          return await this.setupMBNAAmazon(cardCatalogId);
        case "dbs-wwmc":
          return await this.setupDBSWWMC(cardCatalogId);
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

  private async deleteExistingRules(cardCatalogId: string): Promise<void> {
    const { data: existingRules } = await this.supabase
      .from("reward_rules")
      .select("id")
      .eq("card_catalog_id", cardCatalogId);

    if (existingRules && existingRules.length > 0) {
      for (const rule of existingRules) {
        await this.repository.deleteRule(rule.id);
      }
    }
  }

  private async setupAmexCobalt(
    cardCatalogId: string
  ): Promise<QuickSetupResult> {
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
      cardCatalogId,
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
        capPeriodicity: "calendar_month",
        capGroupId: "amex-cobalt-5x-food-groceries",
        bonusTiers: [],
      },
    });

    // 3x on Streaming (CAD only)
    await this.repository.createRule({
      cardCatalogId,
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
      cardCatalogId,
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
      cardCatalogId,
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
    cardCatalogId: string
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
      cardCatalogId,
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
      cardCatalogId,
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
      cardCatalogId,
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

  private async setupAmexGreen(
    cardCatalogId: string
  ): Promise<QuickSetupResult> {
    const restaurantMCCs = ["5811", "5812", "5813", "5814"];
    const airlineMCCs = [
      ...Array.from({ length: 300 }, (_, i) => String(3000 + i)),
      "4511",
    ];
    const transitMCCs = ["4111", "4121", "4131", "4789", "4011"];

    // 3x on Restaurants
    await this.repository.createRule({
      cardCatalogId,
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
      cardCatalogId,
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
      cardCatalogId,
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
      cardCatalogId,
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
    cardCatalogId: string,
    paymentMethodId?: string
  ): Promise<QuickSetupResult> {
    const diningMCCs = ["5811", "5812", "5813", "5814", "5499"];

    // 3x on Air Canada Direct Purchases
    await this.repository.createRule({
      cardCatalogId,
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
      cardCatalogId,
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
      cardCatalogId,
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
    cardCatalogId: string,
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
      cardCatalogId,
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
      cardCatalogId,
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
      cardCatalogId,
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
      cardCatalogId,
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
    cardCatalogId: string
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
      cardCatalogId,
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
      cardCatalogId,
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

  private async setupHSBCTravelOne(
    cardCatalogId: string
  ): Promise<QuickSetupResult> {
    // 6x on Foreign Currency spend
    await this.repository.createRule({
      cardCatalogId,
      name: "6x Points on Foreign Currency",
      description:
        "Earn 6 HSBC Rewards Points per S$1 on foreign currency transactions (= 2.4 mpd at best transfer ratio)",
      enabled: true,
      priority: 2,
      conditions: [
        { type: "currency", operation: "not_equals", values: ["SGD"] },
      ],
      reward: {
        calculationMethod: "standard",
        baseMultiplier: 1,
        bonusMultiplier: 5,
        pointsRoundingStrategy: "floor",
        amountRoundingStrategy: "none",
        blockSize: 1,
        bonusTiers: [],
      },
    });

    // 3x on Local (SGD) spend
    await this.repository.createRule({
      cardCatalogId,
      name: "3x Points on Local Spend",
      description:
        "Earn 3 HSBC Rewards Points per S$1 on local SGD transactions (= 1.2 mpd at best transfer ratio)",
      enabled: true,
      priority: 1,
      conditions: [],
      reward: {
        calculationMethod: "standard",
        baseMultiplier: 1,
        bonusMultiplier: 2,
        pointsRoundingStrategy: "floor",
        amountRoundingStrategy: "none",
        blockSize: 1,
        bonusTiers: [],
      },
    });

    return { success: true, rulesCreated: 2 };
  }

  private async setupBrimAFKLM(
    cardCatalogId: string
  ): Promise<QuickSetupResult> {
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
      cardCatalogId,
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
      cardCatalogId,
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
      cardCatalogId,
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
      cardCatalogId,
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

  private async setupMBNAAmazon(
    cardCatalogId: string
  ): Promise<QuickSetupResult> {
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
      cardCatalogId,
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
        capPeriodicity: "calendar_month",
        capGroupId: "mbna-amazon-promo-2.5x",
        bonusTiers: [],
      },
    });

    // 2.5x on Amazon (promotional - separate rule for merchant match)
    await this.repository.createRule({
      cardCatalogId,
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
        capPeriodicity: "calendar_month",
        capGroupId: "mbna-amazon-promo-2.5x",
        bonusTiers: [],
      },
    });

    // 1.5x on Amazon (permanent rate after promo ends)
    await this.repository.createRule({
      cardCatalogId,
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
      cardCatalogId,
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

  private async setupDBSWWMC(cardCatalogId: string): Promise<QuickSetupResult> {
    // DBS Woman's World Mastercard (Singapore)
    // 10x online (4 mpd) capped at S$1,000/month, 1x other (0.4 mpd)
    // Points expire 1 year after earning

    // 10x on Online Spend (capped at S$1,000/month)
    // Uses transaction isOnline flag instead of MCC detection
    await this.repository.createRule({
      cardCatalogId,
      name: "10x DBS Points on Online Spend",
      description:
        "Earn 10 DBS Points per S$1 on online purchases (= 4 mpd). Capped at S$1,000 online spend per calendar month.",
      enabled: true,
      priority: 2,
      conditions: [
        { type: "transaction_type", operation: "include", values: ["online"] },
      ],
      reward: {
        calculationMethod: "standard",
        baseMultiplier: 1,
        bonusMultiplier: 9,
        pointsRoundingStrategy: "floor",
        amountRoundingStrategy: "none",
        blockSize: 1,
        monthlyCap: 1000,
        monthlyCapType: "spend_amount",
        capPeriodicity: "calendar_month",
        bonusTiers: [],
      },
    });

    // 1x on All Other Purchases
    await this.repository.createRule({
      cardCatalogId,
      name: "1x DBS Points on All Other Purchases",
      description:
        "Earn 1 DBS Point per S$1 on all other purchases (= 0.4 mpd)",
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
        bonusTiers: [],
      },
    });

    return { success: true, rulesCreated: 2 };
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
