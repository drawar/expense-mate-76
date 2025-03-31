// src/services/RewardCalculationService.ts
import { Transaction, PaymentMethod } from '@/types';
import { CardRegistry } from '@/components/expense/cards/CardRegistry';
import { calculatorRegistry } from './calculators/CalculatorRegistry';
import { BaseCalculator, CalculationInput, CalculationResult } from './calculators/BaseCalculator';

// Define a transaction type that has more relaxed requirements for simulation
interface SimulatedTransaction {
  id: string;
  date: string;
  merchant: {
    id: string;
    name: string;
    mcc?: { code: string; description: string };
    isOnline?: boolean;
  };
  amount: number;
  currency: any; // Using any to avoid Currency type issues
  paymentMethod: PaymentMethod;
  paymentAmount: number;
  paymentCurrency: any; // Using any to avoid Currency type issues
  isContactless?: boolean;
  rewardPoints?: number;
}

// Define fixed return type for calculations (same as previous interface for API compatibility)
interface PointsCalculation {
  totalPoints: number;
  basePoints: number;
  bonusPoints: number;
  pointsCurrency?: string;
  remainingMonthlyBonusPoints?: number;
}

/**
 * Centralized service that handles all reward point calculations
 * using the calculator architecture as the single source of truth.
 */
export class RewardCalculationService {
  private static instance: RewardCalculationService;
  
  private constructor() {}
  
  /**
   * Get the singleton instance of the RewardCalculationService
   */
  public static getInstance(): RewardCalculationService {
    if (!RewardCalculationService.instance) {
      RewardCalculationService.instance = new RewardCalculationService();
    }
    return RewardCalculationService.instance;
  }

  /**
   * Get the appropriate calculator for a payment method
   */
  private getCalculator(paymentMethod: PaymentMethod): BaseCalculator {
    return calculatorRegistry.getCalculatorForPaymentMethod(paymentMethod);
  }
  
  /**
   * Convert a transaction to a calculator input
   */
  private transactionToCalculationInput(
    transaction: Transaction | SimulatedTransaction, 
    usedBonusPoints: number = 0
  ): CalculationInput {
    return {
      amount: transaction.amount,
      currency: transaction.currency,
      mcc: transaction.merchant?.mcc?.code,
      merchantName: transaction.merchant?.name,
      isOnline: transaction.merchant?.isOnline,
      isContactless: transaction.isContactless,
      usedBonusPoints,
      // Additional fields could be added here for specialized card calculators
    };
  }
  
  /**
   * Calculate reward points for a transaction
   */
  public calculatePoints(transactionInput: Transaction | SimulatedTransaction, usedBonusPoints: number = 0): PointsCalculation {
    const { paymentMethod } = transactionInput;
    
    // Skip calculation for cash payments
    if (!paymentMethod || paymentMethod.type === 'cash') {
      return {
        totalPoints: 0,
        basePoints: 0,
        bonusPoints: 0
      };
    }
    
    try {
      // Get the appropriate calculator for this payment method
      const calculator = this.getCalculator(paymentMethod);
      
      // Convert transaction to calculator input
      const input = this.transactionToCalculationInput(transactionInput, usedBonusPoints);
      
      // Use the calculator to calculate rewards
      const result = calculator.calculateRewards(input);
      
      return {
        totalPoints: result.totalPoints,
        basePoints: result.basePoints,
        bonusPoints: result.bonusPoints,
        pointsCurrency: result.pointsCurrency,
        remainingMonthlyBonusPoints: result.remainingMonthlyBonusPoints
      };
    } catch (error) {
      console.error('Error calculating rewards:', error);
      // Fallback to basic calculation
      const basePoints = Math.floor(transactionInput.amount);
      return {
        totalPoints: basePoints,
        basePoints,
        bonusPoints: 0
      };
    }
  }
  
  /**
   * Simulate reward points for a hypothetical transaction
   */
  public simulatePoints(
    amount: number,
    currency: string,
    paymentMethod: PaymentMethod,
    mcc?: string,
    merchantName?: string,
    isOnline?: boolean,
    isContactless?: boolean,
    usedBonusPoints: number = 0
  ): PointsCalculation {
    try {
      // Create a simulated transaction
      const simulatedTransaction: SimulatedTransaction = {
        id: 'simulated',
        date: new Date().toISOString(),
        merchant: {
          id: 'simulated',
          name: merchantName || 'Simulated Merchant',
          mcc: mcc ? { code: mcc, description: '' } : undefined,
          isOnline: !!isOnline
        },
        amount,
        currency,
        paymentMethod,
        paymentAmount: amount,
        paymentCurrency: currency,
        isContactless: !!isContactless
      };
      
      // Use the main calculation method with the simulated transaction
      return this.calculatePoints(simulatedTransaction, usedBonusPoints);
    } catch (error) {
      console.error('Error in simulatePoints:', error);
      // Fallback to basic calculation
      return {
        totalPoints: Math.floor(amount),
        basePoints: Math.floor(amount),
        bonusPoints: 0
      };
    }
  }
  
  /**
   * Get the points currency for a payment method
   */
  public getPointsCurrency(paymentMethod: PaymentMethod): string {
    if (!paymentMethod) return 'Points';
    
    try {
      // Get the calculator and ask for its points currency
      const calculator = this.getCalculator(paymentMethod);
      return calculator.getPointsCurrencyPublic();
    } catch (error) {
      // Fallback to CardRegistry if calculator is unavailable
      const cardInfo = CardRegistry.findCard(
        paymentMethod.issuer || '',
        paymentMethod.name || ''
      );
      
      return cardInfo?.pointsCurrency || 
        (paymentMethod.issuer ? `${paymentMethod.issuer} Points` : 'Points');
    }
  }
}

// Export a singleton instance for easy access
export const rewardCalculationService = RewardCalculationService.getInstance();
