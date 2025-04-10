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
      await this.ruleRepository.loadRules();
      this.initialized = true;
      console.log('RewardCalculatorService initialized');
    }
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
    
    // Get rules for this payment method
    const rules = await this.getRulesForPaymentMethod(transaction.paymentMethod);
    
    // Calculate rewards using the rule engine
    return this.ruleEngine.calculateRewards(input, rules);
  }
  
  /**
   * Simulate reward points for a hypothetical transaction
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
    
    // Get rules for this payment method
    const rules = await this.getRulesForPaymentMethod(paymentMethod);
    
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
   * Get rules for a payment method
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
    
    // Get rules for this card type
    let rules = await this.ruleRepository.getRulesForCardType(cardTypeId);
    
    // If no rules found, check if this paymentMethod has custom rules
    if (rules.length === 0 && paymentMethod.rewardRules && paymentMethod.rewardRules.length > 0) {
      // Convert payment method reward rules to our format
      rules = paymentMethod.rewardRules.map(customRule => this.convertCustomRule(customRule, cardTypeId!));
    }
    
    // If still no rules, get default rules from card registry
    if (rules.length === 0) {
      const cardType = this.cardRegistry.getCardTypeByIssuerAndName(
        paymentMethod.issuer || '',
        paymentMethod.name || ''
      );
      
      if (cardType) {
        rules = cardType.defaultRules;
      }
    }
    
    // Handle category selection for cards with selectable categories
    if (paymentMethod.selectedCategories && paymentMethod.selectedCategories.length > 0) {
      rules = this.applySelectedCategories(rules, paymentMethod.selectedCategories);
    }
    
    return rules;
  }
  
  /**
   * Convert a custom reward rule to our standard format
   */
  private convertCustomRule(customRule: any, cardTypeId: string): RewardRule {
    // Implementation depends on your custom rule format
    // This is a simplified example
    return {
      id: customRule.id || uuidv4(),
      cardTypeId,
      name: customRule.name || 'Custom Rule',
      description: customRule.description || '',
      enabled: true,
      priority: customRule.priority || 10,
      conditions: this.convertCustomConditions(customRule),
      reward: {
        calculationMethod: 'standard',
        baseMultiplier: 1,
        bonusMultiplier: customRule.pointsMultiplier ? customRule.pointsMultiplier - 1 : 0,
        pointsRoundingStrategy: 'floor',
        amountRoundingStrategy: 'floor',
        blockSize: 1,
        monthlyCap: customRule.maxSpend,
        pointsCurrency: customRule.pointsCurrency || 'Points'
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }
  
  /**
   * Convert custom conditions to our format
   */
  private convertCustomConditions(customRule: any): RuleCondition[] {
    const conditions: RuleCondition[] = [];
    
    // Check rule type and create appropriate condition
    switch (customRule.type) {
      case 'online':
        conditions.push({
          type: 'transaction_type',
          operation: 'equals',
          values: [TransactionType.ONLINE]
        });
        break;
        
      case 'contactless':
        conditions.push({
          type: 'transaction_type',
          operation: 'equals',
          values: [TransactionType.CONTACTLESS]
        });
        break;
        
      case 'mcc':
        if (Array.isArray(customRule.condition)) {
          conditions.push({
            type: 'mcc',
            operation: 'include',
            values: customRule.condition
          });
        }
        break;
        
      case 'merchant':
        if (typeof customRule.condition === 'string' || Array.isArray(customRule.condition)) {
          conditions.push({
            type: 'merchant',
            operation: 'include',
            values: Array.isArray(customRule.condition) ? 
              customRule.condition : [customRule.condition]
          });
        }
        break;
        
      case 'currency':
        if (Array.isArray(customRule.condition)) {
          const excludedCurrencies = customRule.condition
            .filter((curr: string) => curr.startsWith('!'))
            .map((curr: string) => curr.substring(1));
          
          const includedCurrencies = customRule.condition
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
        break;
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
export const rewardCalculatorService = RewardCalculatorService.getInstance();
