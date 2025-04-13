// services/rewards/index.ts
import { Transaction, PaymentMethod, Currency } from '@/types';
import {
  CalculationInput,
  CalculationResult,
  RewardRule,
  TransactionType
} from './types';
import { RuleEngine } from './RuleEngine';
import { RuleRepository } from './RuleRepository';
import { CardRegistry } from './CardRegistry';
import { MonthlySpendingTracker } from './MonthlySpendingTracker';

/**
 * Central service for all reward calculations.
 * This is a singleton that handles all reward point calculations
 * and serves as the single source of truth for point calculations.
 */
class RewardService {
  private static instance: RewardService;
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
  public static getInstance(): RewardService {
    if (!RewardService.instance) {
      RewardService.instance = new RewardService();
    }
    return RewardService.instance;
  }
  
  /**
   * Initialize service by loading all rules
   */
  public async initialize(): Promise<void> {
    if (this.initialized) return;
    
    try {
      await this.ruleRepository.loadRules();
      this.initialized = true;
      console.log('RewardService initialized successfully');
    } catch (error) {
      console.error('Failed to initialize RewardService:', error);
      throw error;
    }
  }

  /**
   * Ensures the service is initialized before performing operations
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }
  }
  
  /**
   * Calculate reward points for a transaction
   */
  public async calculatePoints(
    transaction: Transaction,
    usedBonusPoints: number = 0
  ): Promise<CalculationResult> {
    await this.ensureInitialized();
    
    // Create calculation input from transaction
    const input = await this.createCalculationInput(
      transaction,
      usedBonusPoints
    );
    
    // Get rules for this payment method
    const rules = await this.getRulesForPaymentMethod(transaction.paymentMethod);
    
    // Calculate rewards using the rule engine
    return this.ruleEngine.calculateRewards(input, rules);
  }
  
  /**
   * Simulate reward points for a hypothetical transaction
   * Used by the expense form to preview points
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
    await this.ensureInitialized();
    
    // Determine transaction type from flags
    const transactionType = this.determineTransactionType(isOnline, isContactless);
    
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
    
    // Get rules for this payment method
    const rules = await this.getRulesForPaymentMethod(paymentMethod);
    
    // Calculate rewards using the rule engine
    return this.ruleEngine.calculateRewards(input, rules);
  }
  
  /**
   * Format the points result into a user-friendly message
   */
  public formatPointsMessage(
    bonusPoints: number = 0,
    remainingMonthlyBonusPoints?: number
  ): string | undefined {
    if (bonusPoints === 0 && remainingMonthlyBonusPoints === 0) {
      return "Monthly bonus points cap reached";
    } else if (bonusPoints === 0) {
      return "Not eligible for bonus points";
    } else if (bonusPoints > 0) {
      return `Earning ${bonusPoints} bonus points`;
    } else if (remainingMonthlyBonusPoints !== undefined) {
      return `${remainingMonthlyBonusPoints.toLocaleString()} bonus points remaining this month`;
    }
    return undefined;
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
   * Helper method to determine transaction type from flags
   */
  private determineTransactionType(
    isOnline?: boolean,
    isContactless?: boolean
  ): TransactionType {
    if (isOnline) {
      return TransactionType.ONLINE;
    } else if (isContactless) {
      return TransactionType.CONTACTLESS;
    } else {
      return TransactionType.IN_STORE;
    }
  }
  
  /**
   * Create calculation input from transaction
   */
  private async createCalculationInput(
    transaction: Transaction,
    usedBonusPoints: number
  ): Promise<CalculationInput> {
    // Determine transaction type
    const transactionType = this.determineTransactionType(
      transaction.merchant?.isOnline,
      transaction.isContactless
    );
    
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
   * Get rules for a payment method - this is the critical function
   * that resolves the discrepancy between the old and new reward calculation systems
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
    
    // First, try to get rules from the new reward_rules table
    let rules = await this.ruleRepository.getRulesForCardType(cardTypeId);
    
    // If no rules found in the new system, fall back to the legacy system
    if (rules.length === 0 && paymentMethod.rewardRules && paymentMethod.rewardRules.length > 0) {
      console.log(`No rules found in reward_rules table for card ${cardTypeId}, using legacy rules from payment_method`);
      // Convert legacy rules to the new format
      rules = paymentMethod.rewardRules.map(legacyRule => this.convertLegacyRule(legacyRule, cardTypeId));
      
      // Save the converted rules to the new system for future use
      for (const rule of rules) {
        await this.ruleRepository.saveRule(rule);
      }
    }
    
    // If still no rules, try to get default rules from card registry
    if (rules.length === 0) {
      const cardType = this.cardRegistry.getCardTypeByIssuerAndName(
        paymentMethod.issuer || '',
        paymentMethod.name || ''
      );
      
      if (cardType) {
        rules = cardType.defaultRules;
        
        // Save default rules to repository if they don't exist yet
        for (const rule of cardType.defaultRules) {
          await this.ruleRepository.saveRule({ 
            ...rule,
            cardTypeId: cardTypeId 
          });
        }
      }
    }
    
    // Handle category selection for cards with selectable categories
    if (paymentMethod.selectedCategories && paymentMethod.selectedCategories.length > 0) {
      rules = this.applySelectedCategories(rules, paymentMethod.selectedCategories);
    }
    
    return rules;
  }
  
  /**
   * Convert a legacy reward rule to the new format
   */
  private convertLegacyRule(legacyRule: any, cardTypeId: string): RewardRule {
    // Implementation depends on the structure of your legacy rules
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
    // Implementation depends on your legacy condition structure
    const conditions: any[] = [];
    
    // Example conversion logic
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
      updatedRule.conditions = rule.conditions.map((condition: any) => {
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
export const rewardService = RewardService.getInstance();

// Export a wrapper function for easier testing & mocking
export async function calculateRewardPoints(transaction: Transaction): Promise<CalculationResult> {
  return rewardService.calculatePoints(transaction, 0);
}

// Export a wrapper function for simulating points in the expense form
export async function simulateRewardPoints(
  amount: number,
  currency: string,
  paymentMethod: PaymentMethod,
  mcc?: string,
  merchantName?: string,
  isOnline?: boolean,
  isContactless?: boolean
): Promise<CalculationResult> {
  return rewardService.simulatePoints(
    amount,
    currency,
    paymentMethod,
    mcc,
    merchantName,
    isOnline,
    isContactless
  );
}

// Re-export the types for easier access
export * from './types';
