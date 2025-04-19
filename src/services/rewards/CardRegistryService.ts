// services/rewards/CardRegistryService.ts

import { CardType, RewardRule, TransactionType } from './types';
import { v4 as uuidv4 } from 'uuid';
import { BaseService } from '../core/BaseService';

/**
 * Registry for all card types and their default rules
 */
export class CardRegistryService extends BaseService {
  private static _instance: CardRegistryService;
  
  // Cache with 1-hour expiration 
  private cardTypesCache = this.createCache<CardType>(60 * 60 * 1000);
  private cardTypesByIssuerCache = this.createCache<CardType[]>(60 * 60 * 1000);
  
  private constructor() {
    super();
    this.initializeDefaultCards();
  }
  
  /**
   * Get singleton instance
   */
  public static getInstance(): CardRegistryService {
    if (!this._instance) {
      this._instance = new CardRegistryService();
    }
    return this._instance;
  }
  
  /**
   * Register a card type
   */
  public registerCardType(cardType: CardType): void {
    this.cardTypesCache.set(cardType.id, cardType);
    
    // Update issuer cache
    const issuer = cardType.issuer.toLowerCase();
    const issuerCards = this.cardTypesByIssuerCache.get(issuer) || [];
    this.cardTypesByIssuerCache.set(issuer, [...issuerCards, cardType]);
  }
  
  /**
   * Get a card type by ID
   */
  public getCardType(id: string): CardType | undefined {
    return this.cardTypesCache.get(id);
  }
  
  /**
   * Get a card type by issuer and name
   */
  public getCardTypeByIssuerAndName(issuer: string, name: string): CardType | undefined {
    const normalizedIssuer = issuer.toLowerCase();
    const normalizedName = name.toLowerCase();
    
    const issuerCards = this.cardTypesByIssuerCache.get(normalizedIssuer);
    
    if (issuerCards) {
      return issuerCards.find(
        cardType => cardType.name.toLowerCase() === normalizedName
      );
    }
    
    // Fallback to search through all cards if issuer cache doesn't exist
    for (const key of Object.keys(this.cardTypesCache)) {
      const cardType = this.cardTypesCache.get(key);
      if (cardType && 
          cardType.issuer.toLowerCase() === normalizedIssuer && 
          cardType.name.toLowerCase() === normalizedName) {
        return cardType;
      }
    }
    
    return undefined;
  }
  
  /**
   * Get all card types
   */
  public getAllCardTypes(): CardType[] {
    const result: CardType[] = [];
    
    for (const key of Object.keys(this.cardTypesCache)) {
      const cardType = this.cardTypesCache.get(key);
      if (cardType) {
        result.push(cardType);
      }
    }
    
    return result;
  }
  
  /**
   * Get card types by issuer
   */
  public getCardTypesByIssuer(issuer: string): CardType[] {
    const normalizedIssuer = issuer.toLowerCase();
    
    // Check cache first
    const cached = this.cardTypesByIssuerCache.get(normalizedIssuer);
    if (cached) {
      return cached;
    }
    
    // If not in cache, find them and update cache
    const result = this.getAllCardTypes()
      .filter(cardType => cardType.issuer.toLowerCase() === normalizedIssuer);
      
    if (result.length > 0) {
      this.cardTypesByIssuerCache.set(normalizedIssuer, result);
    }
    
    return result;
  }
  
  /**
   * Clear all caches
   */
  public clearCache(): void {
    this.cardTypesCache.clear();
    this.cardTypesByIssuerCache.clear();
  }
  
  /**
   * Initialize default card types
   * This will load card configurations for popular cards with their rules
   */
  private initializeDefaultCards(): void {
    // 1. DBS Woman's World Card
    this.registerCardType({
      id: 'dbs-womans-world-mastercard',
      issuer: 'DBS',
      name: 'Woman\'s World MasterCard',
      pointsCurrency: 'DBS Points',
      defaultRules: [
        this.createDBSWomansWorldCardRule()
      ]
    });
    
    // 2. Citibank Rewards Card
    this.registerCardType({
      id: 'citibank-rewards-visa-signature',
      issuer: 'Citibank',
      name: 'Rewards Visa Signature',
      pointsCurrency: 'ThankYou Points',
      defaultRules: [
        this.createCitibankRewardsCardRule()
      ]
    });
    
    // 3. UOB Preferred Platinum Card
    this.registerCardType({
      id: 'uob-preferred-visa-platinum',
      issuer: 'UOB',
      name: 'Preferred Visa Platinum',
      pointsCurrency: 'UNI$',
      defaultRules: [
        this.createUOBPlatinumCardRule()
      ]
    });
    
    // 4. UOB Lady's Solitaire Card
    this.registerCardType({
      id: 'uob-ladys-solitaire-world-mastercard',
      issuer: 'UOB',
      name: 'Lady\'s Solitaire',
      pointsCurrency: 'UNI$',
      hasCategories: true,
      availableCategories: [
        'Beauty & Wellness',
        'Dining',
        'Entertainment',
        'Family',
        'Fashion',
        'Transport',
        'Travel'
      ],
      maxCategoriesSelectable: 2,
      defaultRules: [
        this.createUOBLadysSolitaireCardRule()
      ]
    });
    
    // Additional cards can be registered here or loaded from a database
    // ...
  }
  
  /**
   * Rule factory methods for common cards
   */
  
  /**
   * 1. DBS Woman's World Card Rule
   * 10X DBS Points (20 miles) on online spend, capped at 2,000 bonus points monthly
   */
  private createDBSWomansWorldCardRule(): RewardRule {
    return {
      id: uuidv4(),
      cardTypeId: 'dbs-womans-world-mastercard',
      name: 'Online Shopping 10X',
      description: '10X DBS Points (20 miles) on online spend',
      enabled: true,
      priority: 10,
      conditions: [
        {
          type: 'transaction_type',
          operation: 'equals',
          values: [TransactionType.ONLINE]
        }
      ],
      reward: {
        calculationMethod: 'standard',
        baseMultiplier: 1,
        bonusMultiplier: 9, // 9 additional points per $5
        pointsRoundingStrategy: 'floor',
        amountRoundingStrategy: 'floor5',
        blockSize: 5,
        monthlyCap: 2700, // Cap at 2,700 bonus points per month
        pointsCurrency: 'DBS Points'
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }
  
  /**
   * 2. Citibank Rewards Card Rule
   * 10X points on online or department store spend, capped at 4,000 bonus points monthly
   */
  private createCitibankRewardsCardRule(): RewardRule {
    return {
      id: uuidv4(),
      cardTypeId: 'citibank-rewards-visa-signature',
      name: 'Citibank Rewards 10X',
      description: '10X ThankYou Points on online & department store shopping',
      enabled: true,
      priority: 10,
      conditions: [
        {
          type: 'compound',
          operation: 'any', // OR logic
          subConditions: [
            // Online transactions excluding airlines and travel
            {
              type: 'compound',
              operation: 'all', // AND logic
              subConditions: [
                {
                  type: 'transaction_type',
                  operation: 'equals',
                  values: [TransactionType.ONLINE]
                },
                {
                  type: 'mcc',
                  operation: 'exclude',
                  values: [
                    // Airlines (3000-3999)
                    ...[...Array(1000)].map((_, i) => `${3000 + i}`),
                    // Other excluded travel categories
                    '4511', '7512', '7011', '4111', '4112', '4789', 
                    '4411', '4722', '4723', '5962', '7012'
                  ]
                }
              ]
            },
            // Department store transactions
            {
              type: 'mcc',
              operation: 'include',
              values: [
                '5311', '5611', '5621', '5631', '5641', '5651', 
                '5655', '5661', '5691', '5699', '5948'
              ]
            }
          ]
        }
      ],
      reward: {
        calculationMethod: 'standard',
        baseMultiplier: 1,
        bonusMultiplier: 9, // 9x bonus points
        pointsRoundingStrategy: 'floor',
        amountRoundingStrategy: 'floor',
        blockSize: 1,
        monthlyCap: 9000, // Cap at 9,000 bonus points per month
        pointsCurrency: 'ThankYou Points'
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }
  
  /**
   * 3. UOB Preferred Platinum Card Rule
   * 10X UNI$ on online or contactless spending (with eligible MCCs), capped at 4,000 bonus points monthly
   */
  private createUOBPlatinumCardRule(): RewardRule {
    return {
      id: uuidv4(),
      cardTypeId: 'uob-preferred-visa-platinum',
      name: 'UOB Platinum 10X',
      description: '10X UNI$ (4 miles) on online or contactless spending',
      enabled: true,
      priority: 10,
      conditions: [],
      reward: {
        calculationMethod: 'standard',
        baseMultiplier: 1,
        bonusMultiplier: 0, // No default bonus
        pointsRoundingStrategy: 'floor',
        amountRoundingStrategy: 'floor5',
        blockSize: 5,
        monthlyCap: 2000, // Shared cap: 2,000 bonus points per month
        pointsCurrency: 'UNI$',
        bonusTiers: [
          {
            name: 'Contactless Payments',
            priority: 1,
            multiplier: 9, // 9 additional points per $5
            condition: {
              type: 'transaction_type',
              operation: 'equals',
              values: [TransactionType.CONTACTLESS]
            }
          },
          {
            name: 'Online with Eligible MCCs',
            priority: 1,
            multiplier: 9, // 9 additional points per $5
            condition: {
              type: 'compound',
              operation: 'all', // AND logic
              subConditions: [
                {
                  type: 'transaction_type',
                  operation: 'equals',
                  values: [TransactionType.ONLINE]
                },
                {
                  type: 'mcc',
                  operation: 'include',
                  values: [
                    '4816', '5262', '5306', '5309', '5310', '5311', '5331', '5399', 
                    '5611', '5621', '5631', '5641', '5651', '5661', '5691', '5699',
                    '5732', '5733', '5734', '5735', '5912', '5942', '5944', '5945',
                    '5946', '5947', '5948', '5949', '5964', '5965', '5966', '5967',
                    '5968', '5969', '5970', '5992', '5999', '5811', '5812', '5814',
                    '5333', '5411', '5441', '5462', '5499', '8012', '9751', '7278',
                    '7832', '7841', '7922', '7991', '7996', '7998', '7999'
                  ]
                }
              ]
            }
          }
        ]
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }
  
  /**
   * 4. UOB Lady's Solitaire Card Rule
   * 10X UNI$ on spending in selected categories, capped at 3,600 bonus points monthly
   */
  private createUOBLadysSolitaireCardRule(): RewardRule {
    return {
      id: uuidv4(),
      cardTypeId: 'uob-ladys-solitaire-world-mastercard',
      name: 'Selected Categories 10X',
      description: '10X UNI$ (4 miles) on spending in selected categories',
      enabled: true,
      priority: 10,
      conditions: [
        {
          type: 'category',
          operation: 'include',
          values: [] // This will be populated based on user selection
        }
      ],
      reward: {
        calculationMethod: 'standard',
        baseMultiplier: 1,
        bonusMultiplier: 9, // 9 additional points per $5
        pointsRoundingStrategy: 'floor',
        amountRoundingStrategy: 'floor5',
        blockSize: 5,
        monthlyCap: 3600, // Cap at 3,600 bonus points per month
        pointsCurrency: 'UNI$'
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }
}

// Export a singleton instance
export const cardRegistryService = CardRegistryService.getInstance();