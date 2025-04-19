// src/services/rewards/RewardUtilityService.ts

import { Transaction, PaymentMethod } from '@/types';
import { RewardRule, TransactionType } from './types';
import { BaseService } from '../core/BaseService';
import { rewardCalculatorService } from './RewardCalculatorService';
import { bonusPointsTrackingService } from '../BonusPointsTrackingService';
import { currencyService } from '../CurrencyService';

/**
 * Utility service for reward-related operations
 */
export class RewardUtilityService extends BaseService {
  private static _instance: RewardUtilityService;
  
  private constructor() {
    super();
  }
  
  /**
   * Get singleton instance
   */
  public static getInstance(): RewardUtilityService {
    if (!this._instance) {
      this._instance = new RewardUtilityService();
    }
    return this._instance;
  }
  
  /**
   * Analyze reward opportunities for a payment method, like what spend types give bonus points
   */
  public async analyzeRewardOpportunities(paymentMethod: PaymentMethod): Promise<{
    onlineSpend: { multiplier: number; cap: number | null };
    contactlessSpend: { multiplier: number; cap: number | null };
    foreignCurrencySpend: { multiplier: number; cap: number | null };
    selectedCategories: { name: string; multiplier: number; cap: number | null }[];
    specialMerchants: { name: string; multiplier: number; cap: number | null }[];
    otherSpend: { multiplier: number; cap: number | null };
  }> {
    // Ensure reward calculator is initialized
    if (!rewardCalculatorService.isInitialized()) {
      await rewardCalculatorService.initialize();
    }
    
    // Create a standardized analysis result
    const defaultResult = {
      multiplier: 1,
      cap: null as number | null
    };
    
    // Initialize with default values
    const result = {
      onlineSpend: { ...defaultResult },
      contactlessSpend: { ...defaultResult },
      foreignCurrencySpend: { ...defaultResult },
      selectedCategories: [] as { name: string; multiplier: number; cap: number | null }[],
      specialMerchants: [] as { name: string; multiplier: number; cap: number | null }[],
      otherSpend: { ...defaultResult }
    };
    
    // Common test amount
    const testAmount = 1000;
    
    // Simulate online spend
    const onlineResult = await rewardCalculatorService.simulatePoints(
      testAmount,
      'SGD',
      paymentMethod,
      undefined,
      undefined,
      true,
      false
    );
    
    // Simulate contactless spend
    const contactlessResult = await rewardCalculatorService.simulatePoints(
      testAmount,
      'SGD',
      paymentMethod,
      undefined,
      undefined,
      false,
      true
    );
    
    // Simulate foreign currency spend
    const foreignResult = await rewardCalculatorService.simulatePoints(
      testAmount,
      'USD', // Use USD as test foreign currency
      paymentMethod,
      undefined,
      undefined,
      false,
      false
    );
    
    // Simulate regular spend
    const regularResult = await rewardCalculatorService.simulatePoints(
      testAmount,
      'SGD',
      paymentMethod,
      undefined,
      undefined,
      false,
      false
    );
    
    // Update result based on simulations
    if (onlineResult.basePoints > 0) {
      result.onlineSpend = {
        multiplier: onlineResult.totalPoints / onlineResult.basePoints,
        cap: onlineResult.appliedRule?.reward.monthlyCap || null
      };
    }
    
    if (contactlessResult.basePoints > 0) {
      result.contactlessSpend = {
        multiplier: contactlessResult.totalPoints / contactlessResult.basePoints,
        cap: contactlessResult.appliedRule?.reward.monthlyCap || null
      };
    }
    
    if (foreignResult.basePoints > 0) {
      result.foreignCurrencySpend = {
        multiplier: foreignResult.totalPoints / foreignResult.basePoints,
        cap: foreignResult.appliedRule?.reward.monthlyCap || null
      };
    }
    
    if (regularResult.basePoints > 0) {
      result.otherSpend = {
        multiplier: regularResult.totalPoints / regularResult.basePoints,
        cap: regularResult.appliedRule?.reward.monthlyCap || null
      };
    }
    
    // Handle selected categories if any
    if (paymentMethod.selectedCategories && paymentMethod.selectedCategories.length > 0) {
      for (const category of paymentMethod.selectedCategories) {
        const categoryResult = await rewardCalculatorService.simulatePoints(
          testAmount,
          'SGD',
          paymentMethod,
          undefined,
          undefined,
          false,
          false
        );
        
        if (categoryResult.basePoints > 0) {
          result.selectedCategories.push({
            name: category,
            multiplier: categoryResult.totalPoints / categoryResult.basePoints,
            cap: categoryResult.appliedRule?.reward.monthlyCap || null
          });
        }
      }
    }
    
    return result;
  }
  
  /**
   * Get the expected points and an explanation for a transaction
   */
  public async getExpectedPoints(transaction: Transaction): Promise<{
    basePoints: number;
    bonusPoints: number;
    totalPoints: number;
    pointsCurrency: string;
    explanation: string;
  }> {
    // Get used bonus points for this payment method in the current month
    const date = new Date(transaction.date);
    const usedBonusPoints = await bonusPointsTrackingService.getUsedBonusPoints(
      transaction.paymentMethod.id,
      date.getFullYear(),
      date.getMonth()
    );
    
    // Calculate points
    const result = await rewardCalculatorService.calculatePoints(
      transaction,
      usedBonusPoints
    );
    
    // Create explanation
    let explanation = '';
    
    if (result.appliedRule) {
      const baseRate = result.appliedRule.reward.baseMultiplier;
      const multiplier = result.appliedTier?.multiplier || result.appliedRule.reward.bonusMultiplier;
      const totalRate = baseRate + (result.minSpendMet ? multiplier : 0);
      
      // Format amount with currency
      const formattedAmount = currencyService.format(transaction.amount, transaction.currency);
      
      // Build explanation
      if (result.appliedTier) {
        explanation = `${formattedAmount} × ${totalRate}× rate (${result.appliedTier.name}) = ${result.totalPoints} ${result.pointsCurrency}`;
      } else if (multiplier > 0 && result.minSpendMet) {
        explanation = `${formattedAmount} × ${totalRate}× rate (${result.appliedRule.name}) = ${result.totalPoints} ${result.pointsCurrency}`;
      } else {
        explanation = `${formattedAmount} × ${baseRate}× base rate = ${result.basePoints} ${result.pointsCurrency}`;
      }
      
      // Add messages from calculation if any
      if (result.messages.length > 0) {
        explanation += '. ' + result.messages.join('. ');
      }
    } else {
      explanation = `Base points: ${transaction.amount} × 1× = ${result.basePoints} points`;
    }
    
    return {
      basePoints: result.basePoints,
      bonusPoints: result.bonusPoints,
      totalPoints: result.totalPoints,
      pointsCurrency: result.pointsCurrency,
      explanation
    };
  }
  
  /**
   * Get a summary of earned points for a payment method in a given month
   */
  public async getMonthlyPointsSummary(
    paymentMethod: PaymentMethod,
    year: number = new Date().getFullYear(),
    month: number = new Date().getMonth()
  ): Promise<{
    totalPoints: number;
    basePoints: number;
    bonusPoints: number;
    pointsCurrency: string;
    remainingBonusPoints: number;
    byCategory: Record<string, number>;
    byTransactionType: Record<TransactionType, number>;
  }> {
    // Get transactions for the payment method in the given month from database
    const { data, error } = await this.supabase
      .from('transactions')
      .select('*, merchant:merchants(*)')
      .eq('payment_method_id', paymentMethod.id)
      .gte('date', new Date(year, month, 1).toISOString())
      .lt('date', new Date(year, month + 1, 1).toISOString())
      .eq('is_deleted', false);
      
    if (error) {
      console.error('Error fetching transactions for points summary:', error);
      return {
        totalPoints: 0,
        basePoints: 0,
        bonusPoints: 0,
        pointsCurrency: rewardCalculatorService.getPointsCurrency(paymentMethod),
        remainingBonusPoints: 0,
        byCategory: {},
        byTransactionType: {
          [TransactionType.ONLINE]: 0,
          [TransactionType.CONTACTLESS]: 0,
          [TransactionType.IN_STORE]: 0
        }
      };
    }
    
    // Prepare summary
    let totalPoints = 0;
    let basePoints = 0;
    let bonusPoints = 0;
    const byCategory: Record<string, number> = {};
    const byTransactionType: Record<TransactionType, number> = {
      [TransactionType.ONLINE]: 0,
      [TransactionType.CONTACTLESS]: 0,
      [TransactionType.IN_STORE]: 0
    };
    
    // Process each transaction
    for (const tx of data) {
      totalPoints += tx.total_points || 0;
      basePoints += (tx.total_points || 0) - (tx.bonus_points || 0);
      bonusPoints += tx.bonus_points || 0;
      
      // Categorize by merchant category
      const category = tx.merchant?.category || 'Uncategorized';
      byCategory[category] = (byCategory[category] || 0) + (tx.total_points || 0);
      
      // Categorize by transaction type
      let txType: TransactionType;
      
      if (tx.merchant?.is_online) {
        txType = TransactionType.ONLINE;
      } else if (tx.is_contactless) {
        txType = TransactionType.CONTACTLESS;
      } else {
        txType = TransactionType.IN_STORE;
      }
      
      byTransactionType[txType] = (byTransactionType[txType] || 0) + (tx.total_points || 0);
    }
    
    // Get remaining bonus points
    const usedBonusPoints = await bonusPointsTrackingService.getUsedBonusPoints(
      paymentMethod.id,
      year,
      month
    );
    
    const remainingBonusPoints = await bonusPointsTrackingService.getRemainingBonusPoints(
      paymentMethod,
      usedBonusPoints
    );
    
    return {
      totalPoints,
      basePoints,
      bonusPoints,
      pointsCurrency: rewardCalculatorService.getPointsCurrency(paymentMethod),
      remainingBonusPoints,
      byCategory,
      byTransactionType
    };
  }
}

// Export a singleton instance
export const rewardUtilityService = RewardUtilityService.getInstance();