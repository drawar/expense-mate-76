// services/rewards/RewardCalculatorService.ts

import { Transaction, PaymentMethod } from '@/types';
import { 
  CalculationInput, 
  CalculationResult, 
  RewardRule,
  TransactionType
} from './types';
import { v4 as uuidv4 } from 'uuid';
import { RuleEngine } from './RuleEngine';
import { BaseService } from '../core/BaseService';
import { ruleRepository } from './RuleRepository';
import { cardRegistryService } from './CardRegistryService';
import { monthlySpendingTracker } from './MonthlySpendingTracker';

/**
 * Central service for all reward calculations
 */
export class RewardCalculatorService extends BaseService {
  private static _instance: RewardCalculatorService;
  private ruleEngine: RuleEngine;
  private initialized = false;
  
  private constructor() {
    super();
    this.ruleEngine = new RuleEngine();
  }
  
  /**
   * Get singleton instance
   */
  public static getInstance(): RewardCalculatorService {
    if (!this._instance) {
      this._instance = new RewardCalculatorService();
    }
    return this._instance;
  }
  
  /**
   * Initialize service by loading all rules
   */
  public async initialize(): Promise<void> {
    if (!this.initialized) {
      await ruleRepository.loadRules();
      this.initialized = true;
      console.log('RewardCalculatorService initialized');
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
    const monthlySpend = await monthlySpendingTracker.getMonthlySpending(
      paymentMethod.id,
      'calendar_month',
      new Date(),
      paymentMethod.statementStartDay || 1
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
      statementDay: paymentMethod.statementStartDay || 1
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
    const cardType = cardRegistryService.getCardTypeByIssuerAndName(
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
    const monthlySpend = await monthlySpendingTracker.getMonthlySpending(
      transaction.paymentMethod.id,
      'calendar_month',
      new Date(transaction.date),
      transaction.paymentMethod.statementStartDay || 1
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
      statementDay: transaction.paymentMethod.statementStartDay || 1
    };
  }
  
  /**
   * Get rules for a payment method
   */
  private async getRulesForPaymentMethod(paymentMethod: PaymentMethod): Promise<RewardRule[]> {
    // Try to get card type ID
    let cardTypeId: string | undefined;
    
    if (paymentMethod.issuer && paymentMethod.name) {
      const cardType = cardRegistryService.getCardTypeByIssuerAndName(
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
    
    // Get rules for this card type from database
    let rules = await ruleRepository.getRulesForCardType(cardTypeId);
    
    // If no rules found, get default rules from card registry as fallback
    if (rules.length === 0) {
      const cardType = cardRegistryService.getCardTypeByIssuerAndName(
        paymentMethod.issuer || '',
        paymentMethod.name || ''
      );
      
      if (cardType && cardType.defaultRules) {
        rules = cardType.defaultRules;
        
        // Save default rules to database if they don't exist yet
        for (const rule of cardType.defaultRules) {
          await ruleRepository.saveRule({ 
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
export const rewardCalculatorService = RewardCalculatorService.getInstance();
