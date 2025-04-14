
// services/rewards/RewardCalculatorService.ts

import { Transaction, PaymentMethod } from '@/types';
import { 
  CalculationInput, 
  CalculationResult, 
  RewardRule,
  RuleCondition,
  TransactionType
} from './types';
import { v4 as uuidv4 } from 'uuid';
import { RuleEngine } from './RuleEngine';
import { RuleRepository } from './RuleRepository';
import { CardRegistry } from './CardRegistry';
import { MonthlySpendingTracker } from './MonthlySpendingTracker';

/**
 * Central service for all reward calculations
 */
export class RewardCalculatorService {
  private static instance: RewardCalculatorService;
  private ruleEngine: RuleEngine;
  private ruleRepository: RuleRepository;
  private cardRegistry: CardRegistry;
  private monthlySpendingTracker: MonthlySpendingTracker;
  private initialized = false;
  
  private constructor() {
    this.ruleEngine = new RuleEngine();
    this.ruleRepository = RuleRepository.getInstance();
    this.cardRegistry = CardRegistry.getInstance();
    this.monthlySpendingTracker = MonthlySpendingTracker.getInstance();
  }
  
  /**
   * Get singleton instance
   */
  public static getInstance(): RewardCalculatorService {
    if (!RewardCalculatorService.instance) {
      RewardCalculatorService.instance = new RewardCalculatorService();
    }
    return RewardCalculatorService.instance;
  }
  
  /**
   * Initialize service by loading all rules
   */
  public async initialize(): Promise<void> {
    if (!this.initialized) {
      console.log('RewardCalculatorService: Initializing...');
      await this.ruleRepository.loadRules();
      this.initialized = true;
      console.log('RewardCalculatorService: Initialized successfully');
    }
  }

  /**
   * Check if the service is initialized
   */
  public isInitialized(): boolean {
    return this.initialized;
  }
  
  /**
   * Calculate reward points for a transaction
   */
  public async calculatePoints(
    transaction: Transaction,
    usedBonusPoints: number = 0
  ): Promise<CalculationResult> {
    // Ensure the service is initialized
    if (!this.initialized) {
      await this.initialize();
    }
    
    // Create calculation input from transaction
    const input = await this.createCalculationInput(
      transaction,
      usedBonusPoints
    );
    
    // Get rules for this payment method - READ ONLY OPERATION
    const rules = await this.getRulesForPaymentMethod(transaction.paymentMethod);
    
    // Calculate rewards using the rule engine
    return this.ruleEngine.calculateRewards(input, rules);
  }
  
  /**
   * Simulate reward points for a hypothetical transaction
   * This is READ-ONLY and should never modify rules
   */
  public async simulatePoints(
    amount: number,
    currency: string,
    paymentMethod: PaymentMethod,
    mcc?: string,
    merchantName?: string,
    isOnline?: boolean,
    isContactless?: boolean,
    usedBonusPoints: number = 0
  ): Promise<CalculationResult> {
    // Ensure the service is initialized
    if (!this.initialized) {
      console.log('RewardCalculatorService: Initializing for simulation...');
      await this.initialize();
    }
    
    // Determine transaction type from isOnline and isContactless
    let transactionType: TransactionType;
    if (isOnline) {
      transactionType = TransactionType.ONLINE;
    } else if (isContactless) {
      transactionType = TransactionType.CONTACTLESS;
    } else {
      transactionType = TransactionType.IN_STORE;
    }
    
    // Get monthly spending for minimum spend threshold
    const monthlySpend = await this.monthlySpendingTracker.getMonthlySpending(
      paymentMethod.id,
      'calendar_month',
      new Date(),
      paymentMethod.statementStartDay
    );
    
    // Create calculation input
    const input: CalculationInput = {
      amount,
      currency,
      mcc,
      merchantName,
      transactionType,
      usedBonusPoints,
      monthlySpend,
      paymentMethod,
      date: new Date(),
      statementDay: paymentMethod.statementStartDay
    };
    
    console.log('RewardCalculatorService: Simulation input:', {
      amount,
      currency,
      mcc,
      merchantName,
      transactionType,
      paymentMethod: paymentMethod.id
    });
    
    // Get rules for this payment method - READ ONLY OPERATION
    const rules = await this.getRulesForPaymentMethod(paymentMethod);
    console.log(`RewardCalculatorService: Loaded ${rules.length} rules for simulation`);
    
    // Calculate rewards using the rule engine
    return this.ruleEngine.calculateRewards(input, rules);
  }
  
  /**
   * Get point currency for a payment method
   */
  public getPointsCurrency(paymentMethod: PaymentMethod): string {
    // Try to get from card registry first
    const cardType = this.cardRegistry.getCardTypeByIssuerAndName(
      paymentMethod.issuer || '',
      paymentMethod.name || ''
    );
    
    if (cardType) {
      return cardType.pointsCurrency;
    }
    
    // Fallback to payment method properties
    if (paymentMethod.issuer) {
      return `${paymentMethod.issuer} Points`;
    }
    
    return 'Points';
  }
  
  /**
   * Create calculation input from transaction
   */
  private async createCalculationInput(
    transaction: Transaction,
    usedBonusPoints: number
  ): Promise<CalculationInput> {
    // Determine transaction type
    let transactionType: TransactionType;
    if (transaction.merchant?.isOnline) {
      transactionType = TransactionType.ONLINE;
    } else if (transaction.isContactless) {
      transactionType = TransactionType.CONTACTLESS;
    } else {
      transactionType = TransactionType.IN_STORE;
    }
    
    // Get monthly spending for minimum spend threshold
    const monthlySpend = await this.monthlySpendingTracker.getMonthlySpending(
      transaction.paymentMethod.id,
      'calendar_month',
      new Date(transaction.date),
      transaction.paymentMethod.statementStartDay
    );
    
    // Create input object
    return {
      amount: transaction.amount,
      currency: transaction.currency,
      mcc: transaction.merchant?.mcc?.code,
      merchantName: transaction.merchant?.name,
      transactionType,
      usedBonusPoints,
      monthlySpend,
      paymentMethod: transaction.paymentMethod,
      date: new Date(transaction.date),
      statementDay: transaction.paymentMethod.statementStartDay
    };
  }
  
  /**
   * Get rules for a payment method - READ ONLY OPERATION
   * This should never modify any rules
   */
  private async getRulesForPaymentMethod(paymentMethod: PaymentMethod): Promise<RewardRule[]> {
    // Try to get card type ID
    let cardTypeId: string | undefined;
    
    if (paymentMethod.issuer && paymentMethod.name) {
      const cardType = this.cardRegistry.getCardTypeByIssuerAndName(
        paymentMethod.issuer,
        paymentMethod.name
      );
      
      if (cardType) {
        cardTypeId = cardType.id;
      } else {
        // Fallback to a normalized ID
        cardTypeId = `${paymentMethod.issuer.toLowerCase()}-${paymentMethod.name.toLowerCase().replace(/\s+/g, '-')}`;
      }
    } else {
      // Use payment method ID as fallback
      cardTypeId = paymentMethod.id;
    }
    
    console.log(`RewardCalculatorService: Getting rules for card type ${cardTypeId}`);
    
    // Get rules for this card type from reward_rules table - READ ONLY
    const rules = await this.ruleRepository.getRulesForCardType(cardTypeId);
    console.log(`RewardCalculatorService: Found ${rules.length} rules in database for ${cardTypeId}`);
    
    // If no rules found, but we have legacy rules, do NOT save them to database from here
    // This is a READ-ONLY operation
    if (rules.length === 0 && paymentMethod.rewardRules && paymentMethod.rewardRules.length > 0) {
      console.log(`RewardCalculatorService: Using ${paymentMethod.rewardRules.length} legacy rules from payment method`);
      return paymentMethod.rewardRules.map(legacyRule => 
        this.convertLegacyRule(legacyRule, cardTypeId || 'unknown')
      );
    }
    
    // If no rules found, use default rules from card registry as fallback
    if (rules.length === 0) {
      console.log(`RewardCalculatorService: No rules found in database, trying card registry`);
      const cardType = this.cardRegistry.getCardTypeByIssuerAndName(
        paymentMethod.issuer || '',
        paymentMethod.name || ''
      );
      
      if (cardType && cardType.defaultRules && cardType.defaultRules.length > 0) {
        console.log(`RewardCalculatorService: Using ${cardType.defaultRules.length} default rules from card registry`);
        return cardType.defaultRules;
      } else {
        console.log('RewardCalculatorService: No default rules found in card registry');
      }
    }
    
    // Handle category selection for cards with selectable categories
    if (paymentMethod.selectedCategories && paymentMethod.selectedCategories.length > 0) {
      return this.applySelectedCategories(rules, paymentMethod.selectedCategories);
    }
    
    return rules;
  }
  
  /**
   * Convert a legacy rule to the new format
   * This is used when no rules are found in the database but legacy rules exist
   */
  private convertLegacyRule(legacyRule: any, cardTypeId: string): RewardRule {
    const now = new Date();
    return {
      id: legacyRule.id || crypto.randomUUID(),
      cardTypeId,
      name: legacyRule.name || 'Legacy Rule',
      description: legacyRule.description || '',
      enabled: true,
      priority: legacyRule.priority || 10,
      conditions: this.convertLegacyConditions(legacyRule),
      reward: {
        calculationMethod: 'standard',
        baseMultiplier: legacyRule.baseMultiplier || 1,
        bonusMultiplier: legacyRule.bonusMultiplier || 0,
        pointsRoundingStrategy: 'floor',
        amountRoundingStrategy: 'floor',
        blockSize: legacyRule.blockSize || 1,
        monthlyCap: legacyRule.monthlyCap,
        pointsCurrency: legacyRule.pointsCurrency || 'Points'
      },
      createdAt: now,
      updatedAt: now
    };
  }
  
  /**
   * Convert legacy conditions to the new format
   */
  private convertLegacyConditions(legacyRule: any): any[] {
    const conditions: any[] = [];
    
    if (legacyRule.conditionType === 'online') {
      conditions.push({
        type: 'transaction_type',
        operation: 'equals',
        values: [TransactionType.ONLINE]
      });
    } else if (legacyRule.conditionType === 'mcc') {
      conditions.push({
        type: 'mcc',
        operation: 'include',
        values: Array.isArray(legacyRule.mccCodes) ? legacyRule.mccCodes : []
      });
    }
    
    return conditions;
  }
  
  /**
   * Apply selected categories to rules
   */
  private applySelectedCategories(rules: RewardRule[], selectedCategories: string[]): RewardRule[] {
    return rules.map(rule => {
      // Create a deep copy of the rule
      const updatedRule = JSON.parse(JSON.stringify(rule));
      
      // Update conditions that have a category type
      updatedRule.conditions = rule.conditions.map((condition: RuleCondition) => {
        if (condition.type === 'category') {
          return {
            ...condition,
            values: selectedCategories
          };
        }
        return condition;
      });
      
      return updatedRule;
    });
  }
}

// Export a singleton instance
export const rewardService = RewardCalculatorService.getInstance();
