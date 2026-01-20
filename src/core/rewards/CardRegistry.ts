// services/rewards/CardRegistry.ts

import { CardType, RewardRule, TransactionTypeValues } from "./types";
import { v4 as uuidv4 } from "uuid";
import { cardTypeIdService } from "./CardTypeIdService";

/**
 * Registry for all card types and their default rules
 */
export class CardRegistry {
  private static instance: CardRegistry;
  private cardTypes: Map<string, CardType> = new Map();

  private constructor() {
    this.initializeDefaultCards();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): CardRegistry {
    if (!CardRegistry.instance) {
      CardRegistry.instance = new CardRegistry();
    }
    return CardRegistry.instance;
  }

  /**
   * Register a card type
   */
  public registerCardType(cardType: CardType): void {
    this.cardTypes.set(cardType.id, cardType);
  }

  /**
   * Get a card type by ID
   */
  public getCardType(id: string): CardType | undefined {
    return this.cardTypes.get(id);
  }

  /**
   * Get a card type by issuer and name
   */
  public getCardTypeByIssuerAndName(
    issuer: string,
    name: string
  ): CardType | undefined {
    const normalizedIssuer = issuer.toLowerCase();
    const normalizedName = name.toLowerCase();

    for (const cardType of this.cardTypes.values()) {
      if (
        cardType.issuer.toLowerCase() === normalizedIssuer &&
        cardType.name.toLowerCase() === normalizedName
      ) {
        return cardType;
      }
    }

    return undefined;
  }

  /**
   * Get all card types
   */
  public getAllCardTypes(): CardType[] {
    return Array.from(this.cardTypes.values());
  }

  /**
   * Get card types by issuer
   */
  public getCardTypesByIssuer(issuer: string): CardType[] {
    const normalizedIssuer = issuer.toLowerCase();

    return Array.from(this.cardTypes.values()).filter(
      (cardType) => cardType.issuer.toLowerCase() === normalizedIssuer
    );
  }

  /**
   * Initialize default card types
   */
  private initializeDefaultCards(): void {
    // 1. DBS Woman's World Card
    const dbsWomansWorldIssuer = "DBS";
    const dbsWomansWorldName = "Woman's World MasterCard";
    this.registerCardType({
      id: cardTypeIdService.generateCardTypeId(
        dbsWomansWorldIssuer,
        dbsWomansWorldName
      ),
      issuer: dbsWomansWorldIssuer,
      name: dbsWomansWorldName,
      pointsCurrency: "DBS Points",
      rewardRules: [],
      defaultRules: [this.createDBSWomansWorldCardRule()],
    });

    // 2. Citibank Rewards Card
    const citibankRewardsIssuer = "Citibank";
    const citibankRewardsName = "Rewards Visa Signature";
    this.registerCardType({
      id: cardTypeIdService.generateCardTypeId(
        citibankRewardsIssuer,
        citibankRewardsName
      ),
      issuer: citibankRewardsIssuer,
      name: citibankRewardsName,
      pointsCurrency: "Citi ThankYou Points",
      rewardRules: [],
      defaultRules: [this.createCitibankRewardsCardRule()],
    });

    // 3. UOB Preferred Platinum Card
    const uobPlatinumIssuer = "UOB";
    const uobPlatinumName = "Preferred Visa Platinum";
    this.registerCardType({
      id: cardTypeIdService.generateCardTypeId(
        uobPlatinumIssuer,
        uobPlatinumName
      ),
      issuer: uobPlatinumIssuer,
      name: uobPlatinumName,
      pointsCurrency: "UNI$",
      rewardRules: [],
      defaultRules: [this.createUOBPlatinumCardRule()],
    });

    // 4. UOB Lady's Solitaire Card
    const uobLadysSolitaireIssuer = "UOB";
    const uobLadysSolitaireName = "Lady's Solitaire";
    this.registerCardType({
      id: cardTypeIdService.generateCardTypeId(
        uobLadysSolitaireIssuer,
        uobLadysSolitaireName
      ),
      issuer: uobLadysSolitaireIssuer,
      name: uobLadysSolitaireName,
      pointsCurrency: "UNI$",
      hasCategories: true,
      availableCategories: [
        "Beauty & Wellness",
        "Dining",
        "Entertainment",
        "Family",
        "Fashion",
        "Transport",
        "Travel",
      ],
      maxCategoriesSelectable: 2,
      rewardRules: [],
      defaultRules: [this.createUOBLadysSolitaireCardRule()],
    });

    // 5. UOB Visa Signature Card
    const uobVisaSignatureIssuer = "UOB";
    const uobVisaSignatureName = "Visa Signature";
    this.registerCardType({
      id: cardTypeIdService.generateCardTypeId(
        uobVisaSignatureIssuer,
        uobVisaSignatureName
      ),
      issuer: uobVisaSignatureIssuer,
      name: uobVisaSignatureName,
      pointsCurrency: "UNI$",
      rewardRules: [],
      defaultRules: [this.createUOBVisaSignatureCardRule()],
    });

    // 6. OCBC Rewards World Card
    const ocbcRewardsWorldIssuer = "OCBC";
    const ocbcRewardsWorldName = "Rewards World Mastercard";
    this.registerCardType({
      id: cardTypeIdService.generateCardTypeId(
        ocbcRewardsWorldIssuer,
        ocbcRewardsWorldName
      ),
      issuer: ocbcRewardsWorldIssuer,
      name: ocbcRewardsWorldName,
      pointsCurrency: "OCBC$",
      rewardRules: [],
      defaultRules: [this.createOCBCRewardsWorldCardRule()],
    });

    // 7. Amex Platinum Credit
    const amexPlatinumCreditIssuer = "American Express";
    const amexPlatinumCreditName = "Platinum Credit";
    this.registerCardType({
      id: cardTypeIdService.generateCardTypeId(
        amexPlatinumCreditIssuer,
        amexPlatinumCreditName
      ),
      issuer: amexPlatinumCreditIssuer,
      name: amexPlatinumCreditName,
      pointsCurrency: "Membership Rewards Points (CA)",
      rewardRules: [],
      defaultRules: [this.createAmexPlatinumCreditCardRule()],
    });

    // 8. Amex Platinum Singapore
    const amexPlatinumSingaporeIssuer = "American Express";
    const amexPlatinumSingaporeName = "Platinum Singapore";
    this.registerCardType({
      id: cardTypeIdService.generateCardTypeId(
        amexPlatinumSingaporeIssuer,
        amexPlatinumSingaporeName
      ),
      issuer: amexPlatinumSingaporeIssuer,
      name: amexPlatinumSingaporeName,
      pointsCurrency: "Membership Rewards Points (CA)",
      rewardRules: [],
      defaultRules: [this.createAmexPlatinumSingaporeCardRule()],
    });

    // 9. Amex Platinum Canada
    const amexPlatinumCanadaIssuer = "American Express";
    const amexPlatinumCanadaName = "Platinum Canada";
    this.registerCardType({
      id: cardTypeIdService.generateCardTypeId(
        amexPlatinumCanadaIssuer,
        amexPlatinumCanadaName
      ),
      issuer: amexPlatinumCanadaIssuer,
      name: amexPlatinumCanadaName,
      pointsCurrency: "Membership Rewards Points (CA)",
      rewardRules: [],
      defaultRules: [this.createAmexPlatinumCanadaCardRule()],
    });

    // 10. Amex Cobalt
    const amexCobaltIssuer = "American Express";
    const amexCobaltName = "Cobalt";
    this.registerCardType({
      id: cardTypeIdService.generateCardTypeId(
        amexCobaltIssuer,
        amexCobaltName
      ),
      issuer: amexCobaltIssuer,
      name: amexCobaltName,
      pointsCurrency: "Membership Rewards Points (CA)",
      rewardRules: [],
      defaultRules: [this.createAmexCobaltCardRule()],
    });

    // 11. TD Aeroplan Visa Infinite
    const tdAeroplanIssuer = "TD";
    const tdAeroplanName = "Aeroplan Visa Infinite";
    this.registerCardType({
      id: cardTypeIdService.generateCardTypeId(
        tdAeroplanIssuer,
        tdAeroplanName
      ),
      issuer: tdAeroplanIssuer,
      name: tdAeroplanName,
      pointsCurrency: "Aeroplan Points",
      rewardRules: [],
      defaultRules: [this.createTDAeroplanVisaInfiniteCardRule()],
    });
  }

  /**
   * 1. DBS Woman's World Card Rule
   * 10X DBS Points (20 miles) on online spend, capped at 2,000 bonus points monthly
   */
  private createDBSWomansWorldCardRule(): RewardRule {
    return {
      id: uuidv4(),
      cardTypeId: cardTypeIdService.generateCardTypeId(
        "DBS",
        "Woman's World MasterCard"
      ),
      name: "Online Shopping 10X",
      description: "10X DBS Points (20 miles) on online spend",
      enabled: true,
      priority: 10,
      conditions: [
        {
          type: "transaction_type",
          operation: "equals",
          values: [TransactionTypeValues.online],
        },
      ],
      reward: {
        calculationMethod: "standard",
        baseMultiplier: 1,
        bonusMultiplier: 9, // 9 additional points per $5
        pointsRoundingStrategy: "floor",
        amountRoundingStrategy: "floor5",
        blockSize: 5,
        bonusTiers: [],
        monthlyCap: 2700, // Cap at 2,700 bonus points per month
        pointsCurrency: "DBS Points",
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  /**
   * 2. Citibank Rewards Card Rule
   * 10X points on online or department store spend, capped at 4,000 bonus points monthly
   */
  private createCitibankRewardsCardRule(): RewardRule {
    return {
      id: uuidv4(),
      cardTypeId: cardTypeIdService.generateCardTypeId(
        "Citibank",
        "Rewards Visa Signature"
      ),
      name: "Citibank Rewards 10X",
      description: "10X ThankYou Points on online & department store shopping",
      enabled: true,
      priority: 10,
      conditions: [
        {
          type: "compound",
          operation: "any", // OR logic
          values: [], // Required for RuleCondition but not used for compound
          subConditions: [
            // Online transactions excluding airlines and travel
            {
              type: "compound",
              operation: "all", // AND logic
              values: [], // Required for RuleCondition but not used for compound
              subConditions: [
                {
                  type: "transaction_type",
                  operation: "equals",
                  values: [TransactionTypeValues.online],
                },
                {
                  type: "mcc",
                  operation: "exclude",
                  values: [
                    // Airlines (3000-3999)
                    ...[...Array(1000)].map((_, i) => `${3000 + i}`),
                    // Other excluded travel categories
                    "4511",
                    "7512",
                    "7011",
                    "4111",
                    "4112",
                    "4789",
                    "4411",
                    "4722",
                    "4723",
                    "5962",
                    "7012",
                  ],
                },
                {
                  type: "merchant",
                  operation: "exclude",
                  values: [
                    // Airlines
                    "singapore airlines",
                    "sq",
                    "sia",
                    "united airlines",
                    "american airlines",
                    "delta",
                    "british airways",
                    "emirates",
                    "etihad",
                    "qatar airways",
                    "cathay pacific",
                    "cathay",
                    "qantas",
                    "air france",
                    "lufthansa",
                    "klm",
                    "japan airlines",
                    "jal",
                    "ana",
                    "all nippon",
                    "korean air",
                    "thai airways",
                    "turkish airlines",
                    "scoot",
                    "jetstar",
                    "airasia",
                    "tiger airways",
                    // Hotels
                    "marriott",
                    "hilton",
                    "hyatt",
                    "sheraton",
                    "westin",
                    "intercontinental",
                    "holiday inn",
                    "shangri-la",
                    "mandarin oriental",
                    "four seasons",
                    "ritz-carlton",
                    "st regis",
                    "fairmont",
                    "raffles",
                    // Travel agencies
                    "expedia",
                    "booking.com",
                    "agoda",
                    "hotels.com",
                    "airbnb",
                  ],
                },
              ],
            },
            // Department store transactions
            {
              type: "mcc",
              operation: "include",
              values: [
                "5311",
                "5611",
                "5621",
                "5631",
                "5641",
                "5651",
                "5655",
                "5661",
                "5691",
                "5699",
                "5948",
              ],
            },
          ],
        },
      ],
      reward: {
        calculationMethod: "standard",
        baseMultiplier: 1,
        bonusMultiplier: 9, // 9x bonus points
        pointsRoundingStrategy: "floor",
        amountRoundingStrategy: "floor",
        blockSize: 1,
        bonusTiers: [],
        monthlyCap: 9000, // Cap at 9,000 bonus points per month
        pointsCurrency: "Citi ThankYou Points",
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  /**
   * 3. UOB Preferred Platinum Card Rule
   * 10X UNI$ on online or contactless spending (with eligible MCCs), capped at 4,000 bonus points monthly
   */
  private createUOBPlatinumCardRule(): RewardRule {
    return {
      id: uuidv4(),
      cardTypeId: cardTypeIdService.generateCardTypeId(
        "UOB",
        "Preferred Visa Platinum"
      ),
      name: "UOB Platinum 10X",
      description: "10X UNI$ (4 miles) on online or contactless spending",
      enabled: true,
      priority: 10,
      conditions: [],
      reward: {
        calculationMethod: "standard",
        baseMultiplier: 1,
        bonusMultiplier: 0, // No default bonus
        pointsRoundingStrategy: "floor",
        amountRoundingStrategy: "floor5",
        blockSize: 5,
        monthlyCap: 2000, // Shared cap: 2,000 bonus points per month
        pointsCurrency: "UNI$",
        bonusTiers: [
          {
            name: "Contactless Payments",
            priority: 1,
            multiplier: 9, // 9 additional points per $5
            condition: {
              type: "transaction_type",
              operation: "equals",
              values: [TransactionTypeValues.contactless],
            },
          },
          {
            name: "Online with Eligible MCCs",
            priority: 1,
            multiplier: 9, // 9 additional points per $5
            condition: {
              type: "compound",
              operation: "all", // AND logic
              values: [], // Required for RuleCondition but not used for compound
              subConditions: [
                {
                  type: "transaction_type",
                  operation: "equals",
                  values: [TransactionTypeValues.online],
                },
                {
                  type: "mcc",
                  operation: "include",
                  values: [
                    "4816",
                    "5262",
                    "5306",
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
                    "5811",
                    "5812",
                    "5814",
                    "5333",
                    "5411",
                    "5441",
                    "5462",
                    "5499",
                    "8012",
                    "9751",
                    "7278",
                    "7832",
                    "7841",
                    "7922",
                    "7991",
                    "7996",
                    "7998",
                    "7999",
                  ],
                },
              ],
            },
          },
        ],
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  /**
   * 4. UOB Lady's Solitaire Card Rule
   * 10X UNI$ on spending in selected categories, capped at 3,600 bonus points monthly
   */
  private createUOBLadysSolitaireCardRule(): RewardRule {
    return {
      id: uuidv4(),
      cardTypeId: cardTypeIdService.generateCardTypeId(
        "UOB",
        "Lady's Solitaire"
      ),
      name: "Selected Categories 10X",
      description: "10X UNI$ (4 miles) on spending in selected categories",
      enabled: true,
      priority: 10,
      conditions: [
        {
          type: "category",
          operation: "include",
          values: [], // This will be populated based on user selection
        },
      ],
      reward: {
        calculationMethod: "standard",
        baseMultiplier: 1,
        bonusMultiplier: 9, // 9 additional points per $5
        pointsRoundingStrategy: "floor",
        amountRoundingStrategy: "floor5",
        blockSize: 5,
        bonusTiers: [],
        monthlyCap: 3600, // Cap at 3,600 bonus points per month
        pointsCurrency: "UNI$",
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  /**
   * 5. UOB Visa Signature Card Rule
   * 10X UNI$ on all foreign currency spending, capped at 8,000 points monthly
   * Minimum spend $1,000 in foreign currency per statement month to activate
   */
  private createUOBVisaSignatureCardRule(): RewardRule {
    return {
      id: uuidv4(),
      cardTypeId: cardTypeIdService.generateCardTypeId("UOB", "Visa Signature"),
      name: "Foreign Currency 10X",
      description: "10X UNI$ (4 miles) on all foreign currency spend",
      enabled: true,
      priority: 10,
      conditions: [
        {
          type: "currency",
          operation: "exclude",
          values: ["SGD"], // Any currency except SGD
        },
      ],
      reward: {
        calculationMethod: "standard",
        baseMultiplier: 1,
        bonusMultiplier: 9, // 9 additional points per $5
        pointsRoundingStrategy: "floor",
        amountRoundingStrategy: "floor5",
        blockSize: 5,
        bonusTiers: [],
        monthlyCap: 3600, // Cap at 3,600 bonus points per month
        monthlyMinSpend: 1000, // Min $1,000 foreign currency spend to qualify
        capDuration: "statement_month",
        pointsCurrency: "UNI$",
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  /**
   * 6. OCBC Rewards World Card Rule
   * Tiered earning rates with shared monthly cap of 10,000 bonus points:
   * - Tier 1: 15X points on selected department stores/Watsons (5 base + 70 bonus per $5)
   * - Tier 2: 10X points on other retail/dining (5 base + 45 bonus per $5)
   */
  private createOCBCRewardsWorldCardRule(): RewardRule {
    return {
      id: uuidv4(),
      cardTypeId: cardTypeIdService.generateCardTypeId(
        "OCBC",
        "Rewards World Mastercard"
      ),
      name: "OCBC Rewards World Tiered Bonus",
      description: "Tiered bonus points on shopping, dining, and e-commerce",
      enabled: true,
      priority: 10,
      conditions: [], // Base rule applies to all transactions
      reward: {
        calculationMethod: "standard",
        baseMultiplier: 5,
        bonusMultiplier: 0, // Base rule has 0 bonus by default
        pointsRoundingStrategy: "floor",
        amountRoundingStrategy: "floor5",
        blockSize: 5,
        monthlyCap: 10000, // Shared cap across all tiers: 10,000 bonus points
        pointsCurrency: "OCBC$",
        // Define multiple bonus tiers with different rates
        bonusTiers: [
          {
            name: "Tier 1 - Selected Retail",
            priority: 1,
            multiplier: 70, // 15X total per $5 (5 base + 70 bonus = 75 per $5)
            condition: {
              type: "compound",
              operation: "any", // OR logic
              values: [], // Required for RuleCondition but not used for compound
              subConditions: [
                {
                  // Department store MCC
                  type: "mcc",
                  operation: "include",
                  values: ["5311"],
                },
                {
                  // Watsons merchant name
                  type: "merchant",
                  operation: "include",
                  values: ["Watsons"],
                },
              ],
            },
          },
          {
            name: "Tier 2 - Shopping & Dining",
            priority: 2,
            multiplier: 45, // 10X total per $5 (5 base + 45 bonus = 50 per $5)
            condition: {
              type: "mcc",
              operation: "include",
              values: [
                "5309",
                "5611",
                "5621",
                "5641",
                "5651",
                "5655",
                "5661",
                "5691",
                "5699",
                "5941",
                "5948",
              ],
            },
          },
        ],
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  /**
   * 7. Amex Platinum Credit Card Rule
   * Fixed rate: 2 MR points for every $1.60 spent
   */
  private createAmexPlatinumCreditCardRule(): RewardRule {
    return {
      id: uuidv4(),
      cardTypeId: cardTypeIdService.generateCardTypeId(
        "American Express",
        "Platinum Credit"
      ),
      name: "Amex Platinum Credit Base Earning",
      description: "2 Membership Rewards points for every $1.60 spent",
      enabled: true,
      priority: 10,
      conditions: [], // Applies to all transactions
      reward: {
        calculationMethod: "direct",
        baseMultiplier: 2,
        bonusMultiplier: 0, // No bonus multiplier
        pointsRoundingStrategy: "nearest",
        amountRoundingStrategy: "none",
        blockSize: 1.6, // 2 points per $1.6
        bonusTiers: [],
        pointsCurrency: "Membership Rewards Points (CA)",
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  /**
   * 8. Amex Platinum Singapore Card Rule
   * Fixed rate: 2 MR points for every $1.60 spent
   */
  private createAmexPlatinumSingaporeCardRule(): RewardRule {
    return {
      id: uuidv4(),
      cardTypeId: cardTypeIdService.generateCardTypeId(
        "American Express",
        "Platinum Singapore"
      ),
      name: "Amex Platinum Singapore Base Earning",
      description: "2 Membership Rewards points for every $1.60 spent",
      enabled: true,
      priority: 10,
      conditions: [], // Applies to all transactions
      reward: {
        calculationMethod: "direct",
        baseMultiplier: 1,
        bonusMultiplier: 0, // No bonus multiplier
        pointsRoundingStrategy: "nearest",
        amountRoundingStrategy: "none",
        blockSize: 1.6, // $1.60 per 2 points
        bonusTiers: [],
        pointsCurrency: "Membership Rewards Points (CA)",
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  /**
   * 9. Amex Platinum Canada Card Rule
   * - Base: 1 point per dollar for all transactions
   * - Bonus tiers with different multipliers for different categories
   */
  private createAmexPlatinumCanadaCardRule(): RewardRule {
    return {
      id: uuidv4(),
      cardTypeId: cardTypeIdService.generateCardTypeId(
        "American Express",
        "Platinum Canada"
      ),
      name: "Amex Platinum Canada Tiered Earning",
      description: "Up to 3X MR points on travel and dining",
      enabled: true,
      priority: 10,
      conditions: [], // Base rule applies to all transactions
      reward: {
        calculationMethod: "direct",
        baseMultiplier: 1,
        bonusMultiplier: 0, // Base rate is 1x, set in the calculation
        pointsRoundingStrategy: "nearest",
        amountRoundingStrategy: "none",
        blockSize: 1,
        pointsCurrency: "Membership Rewards Points (CA)",
        // Multiple tiers with different rates
        bonusTiers: [
          {
            name: "Amex Travel",
            priority: 1,
            multiplier: 2, // 3x total (1x base + 2x bonus)
            condition: {
              type: "merchant",
              operation: "include",
              values: ["Amex Travel"],
            },
          },
          {
            name: "Dining & Food Delivery in Canada",
            priority: 2,
            multiplier: 1, // 2x total (1x base + 1x bonus)
            condition: {
              type: "compound",
              operation: "all", // AND logic
              values: [], // Required for RuleCondition but not used for compound
              subConditions: [
                {
                  type: "mcc",
                  operation: "include",
                  values: [
                    "5811",
                    "5812",
                    "5813",
                    "5814", // Restaurants and dining
                    "5499", // Food delivery
                  ],
                },
                {
                  type: "currency",
                  operation: "equals",
                  values: ["CAD"],
                },
              ],
            },
          },
          {
            name: "Travel",
            priority: 3,
            multiplier: 1, // 2x total (1x base + 1x bonus)
            condition: {
              type: "mcc",
              operation: "include",
              values: [
                // Airlines
                ...[...Array(200)].map((_, i) => `${3000 + i}`),
                // Hotels
                "7011",
                // Car rentals
                "7512",
                // Travel agencies
                "4722",
                // Transportation services
                "4111",
                "4112",
                "4121",
                "4131",
                "4411",
                "4457",
                "4468",
                "4789",
              ],
            },
          },
        ],
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  /**
   * 10. Amex Cobalt Card Rule
   * Multiple tiers with monthly spending caps per category
   */
  private createAmexCobaltCardRule(): RewardRule {
    return {
      id: uuidv4(),
      cardTypeId: cardTypeIdService.generateCardTypeId(
        "American Express",
        "Cobalt"
      ),
      name: "Amex Cobalt Tiered Earning",
      description:
        "Up to 5X MR points on eats & drinks, 2-3X on other categories",
      enabled: true,
      priority: 10,
      conditions: [], // Base rule applies to all transactions
      reward: {
        calculationMethod: "direct",
        baseMultiplier: 1,
        bonusMultiplier: 0, // Base rate is 1x, set in the calculation
        pointsRoundingStrategy: "nearest",
        amountRoundingStrategy: "none",
        blockSize: 1,
        pointsCurrency: "Membership Rewards Points (CA)",
        // Multiple tiers with different rates
        bonusTiers: [
          {
            name: "Dining & Grocery",
            priority: 1,
            multiplier: 4, // 5x total (1x base + 4x bonus)
            condition: {
              type: "mcc",
              operation: "include",
              values: [
                "5811",
                "5812",
                "5814", // Restaurants
                "5411", // Grocery stores
              ],
            },
          },
          {
            name: "Food Delivery",
            priority: 1,
            multiplier: 4, // 5x total (1x base + 4x bonus)
            condition: {
              type: "mcc",
              operation: "include",
              values: ["5499"], // Food delivery
            },
          },
          {
            name: "Streaming Services",
            priority: 2,
            multiplier: 2, // 3x total (1x base + 2x bonus)
            condition: {
              type: "merchant",
              operation: "include",
              values: [
                "Apple TV+",
                "Apple Music",
                "Crave",
                "Disney+",
                "fuboTV",
                "hayu",
                "Netflix",
                "RDS",
                "SiriusXM Canada",
                "Spotify",
                "TSN",
              ],
            },
          },
          {
            name: "Travel & Transit",
            priority: 3,
            multiplier: 1, // 2x total (1x base + 1x bonus)
            condition: {
              type: "compound",
              operation: "any", // OR logic
              values: [], // Required for RuleCondition but not used for compound
              subConditions: [
                {
                  type: "mcc",
                  operation: "include",
                  values: [
                    // Airlines (first 300 codes for brevity)
                    ...[...Array(300)].map((_, i) => `${3000 + i}`),
                    // Hotels
                    "7011",
                    // Car rentals
                    "7512",
                    // Travel agencies
                    "4722",
                  ],
                },
                {
                  type: "mcc",
                  operation: "include",
                  values: [
                    "4111",
                    "4121",
                    "4789", // Local transit, taxis, transportation
                    "7299",
                    "5734",
                    "4214", // Other services (ride-sharing apps)
                  ],
                },
                {
                  type: "mcc",
                  operation: "include",
                  values: [
                    "5541",
                    "5542", // Gas stations
                  ],
                },
              ],
            },
          },
        ],
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  /**
   * 11. TD Aeroplan Visa Infinite Card Rule
   * 1.5X Aeroplan points on gas, grocery, and Air Canada purchases
   */
  private createTDAeroplanVisaInfiniteCardRule(): RewardRule {
    return {
      id: uuidv4(),
      cardTypeId: cardTypeIdService.generateCardTypeId(
        "TD",
        "Aeroplan Visa Infinite"
      ),
      name: "TD Aeroplan Visa Infinite 1.5X",
      description:
        "1.5X Aeroplan points on gas, grocery, and Air Canada purchases",
      enabled: true,
      priority: 10,
      conditions: [
        {
          type: "compound",
          operation: "any", // OR logic
          values: [], // Required for RuleCondition but not used for compound
          subConditions: [
            // Gas stations
            {
              type: "mcc",
              operation: "include",
              values: ["5541", "5542"], // Gas stations
            },
            // Grocery stores
            {
              type: "mcc",
              operation: "include",
              values: ["5411", "5422", "5441", "5451", "5462"], // Grocery stores
            },
            // Air Canada purchases
            {
              type: "merchant",
              operation: "include",
              values: ["Air Canada"],
            },
          ],
        },
      ],
      reward: {
        calculationMethod: "direct",
        baseMultiplier: 1,
        bonusMultiplier: 0.5, // 0.5x bonus points (1x base + 0.5x bonus = 1.5x total)
        pointsRoundingStrategy: "nearest",
        amountRoundingStrategy: "nearest",
        blockSize: 1,
        bonusTiers: [],
        pointsCurrency: "Aeroplan Points",
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }
}

// Export a singleton instance
export const cardRegistry = CardRegistry.getInstance();
