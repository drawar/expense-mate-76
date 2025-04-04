// src/services/RewardCalculationService.ts
import { Transaction, PaymentMethod } from '@/types';
import { CardRegistry } from '@/components/expense/cards/CardRegistry';
import { calculatorRegistry } from './calculators/CalculatorRegistry';
import { BaseCalculator, CalculationInput, CalculationResult } from './calculators/BaseCalculator';
import { registerCustomCalculators } from './calculators/CalculatorRegistryExtensions';

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
  private calculatorsInitialized = false;
  
  private constructor() {
    // Initialize custom calculators on first instantiation
    this.initializeCalculators();
  }
  
  /**
   * Initialize custom calculators
   */
  private initializeCalculators() {
    if (!this.calculatorsInitialized) {
      console.log('RewardCalculationService: Initializing custom calculators');
      registerCustomCalculators();
      this.calculatorsInitialized = true;
      console.log('RewardCalculationService: Custom calculators initialized');
    }
  }

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
    console.log(`RewardCalculationService: Getting calculator for ${paymentMethod.name}`);
    return calculatorRegistry.getCalculatorForPaymentMethod(paymentMethod);
  }
  
  /**
   * Convert a transaction to a calculator input
   */
  private transactionToCalculationInput(
    transaction: Transaction | SimulatedTransaction, 
    usedBonusPoints: number = 0
  ): CalculationInput {
    // Determine if we should use paymentAmount (for currency conversion scenarios)
    const amountToUse = transaction.currency !== transaction.paymentCurrency 
      ? transaction.paymentAmount 
      : transaction.amount;
      
    return {
      amount: amountToUse,
      currency: transaction.paymentCurrency, // Use payment currency for calculation
      mcc: transaction.merchant?.mcc?.code,
      merchantName: transaction.merchant?.name,
      isOnline: transaction.merchant?.isOnline ?? false,
      isContactless: transaction.isContactless ?? false,
      usedBonusPoints,
      paymentMethod: transaction.paymentMethod, // Include full paymentMethod for selectedCategories
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
      console.log('RewardCalculationService.calculatePoints: Starting calculation for', {
        paymentMethod: paymentMethod.name,
        isOnline: transactionInput.merchant?.isOnline,
        mcc: transactionInput.merchant?.mcc?.code,
      });
      
      // Get the appropriate calculator for this payment method
      const calculator = this.getCalculator(paymentMethod);
      console.log(`RewardCalculationService: Using calculator: ${calculator.constructor.name}`);
      
      // Convert transaction to calculator input
      const input = this.transactionToCalculationInput(transactionInput, usedBonusPoints);
      console.log('RewardCalculationService: Calculator input:', input);
      
      // Use the calculator to calculate rewards
      const result = calculator.calculateRewards(input);
      console.log('RewardCalculationService: Raw calculation result:', result);
      
      // Ensure we always have valid values for basePoints and bonusPoints
      const basePoints = result.basePoints ?? 0;
      const bonusPoints = result.bonusPoints ?? 0;
      
      const finalResult = {
        totalPoints: result.totalPoints ?? basePoints + bonusPoints,
        basePoints: basePoints,
        bonusPoints: bonusPoints,
        pointsCurrency: result.pointsCurrency,
        remainingMonthlyBonusPoints: result.remainingMonthlyBonusPoints
      };
      
      console.log('RewardCalculationService: Final result:', finalResult);
      return finalResult;
    } catch (error) {
      console.error('Error calculating rewards:', error);
      // Fallback to basic calculation - using Math.round for proper rounding
      const basePoints = Math.round(transactionInput.amount);
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
      console.log('RewardCalculationService.simulatePoints: Starting point simulation', {
        paymentMethod: paymentMethod.name,
        amount,
        currency,
        mcc,
        merchantName,
        isOnline,
        isContactless
      });
      
      // Determine if currency conversion is needed
      const isCurrencyDifferent = currency !== paymentMethod.currency;
      
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
        amount: amount, // Original amount
        currency: currency, // Original currency
        paymentMethod,
        paymentAmount: amount, // For consistency, this is the amount in payment currency
        paymentCurrency: isCurrencyDifferent ? paymentMethod.currency : currency, // Payment currency
        isContactless: !!isContactless
      };
      
      console.log('RewardCalculationService: Created simulated transaction', simulatedTransaction);
      
      // Use the main calculation method with the simulated transaction
      const calculationResult = this.calculatePoints(simulatedTransaction, usedBonusPoints);
      
      console.log('RewardCalculationService: Calculation result', calculationResult);
      
      // Ensure we have proper values for base and bonus points
      if (calculationResult.bonusPoints === undefined && calculationResult.basePoints !== undefined) {
        calculationResult.bonusPoints = calculationResult.totalPoints - calculationResult.basePoints;
      }
      
      if (calculationResult.basePoints === undefined) {
        calculationResult.basePoints = calculationResult.totalPoints - (calculationResult.bonusPoints || 0);
      }
      
      return calculationResult;
    } catch (error) {
      console.error('Error in simulatePoints:', error);
      // Fallback to basic calculation - using Math.round for proper rounding
      return {
        totalPoints: Math.round(amount),
        basePoints: Math.round(amount),
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
      // Map specific issuers and card types to their points currencies
      if (paymentMethod.issuer === 'UOB') {
        return 'UNI$';
      } 
      else if (paymentMethod.issuer === 'Citibank') {
        return 'ThankYou Points';
      }
      else if (paymentMethod.issuer === 'OCBC') {
        return 'OCBC$';
      }
      else if (paymentMethod.issuer === 'DBS') {
        return 'DBS Points';
      }
      else if (paymentMethod.issuer === 'American Express') {
        if (paymentMethod.name === 'Platinum Singapore' || paymentMethod.name === 'Platinum Credit') {
          return 'SG MR Points';
        }
        else if (paymentMethod.name === 'Cobalt' || paymentMethod.name === 'Platinum Canada') {
          return 'CA MR Points';
        }
        // Default for other Amex cards
        return 'Membership Rewards';
      }
      else if (paymentMethod.issuer === 'TD' && paymentMethod.name === 'Aeroplan Visa Infinite') {
        return 'Aeroplan Points';
      }
      
      // Try to get from calculator as a fallback
      try {
        const calculator = this.getCalculator(paymentMethod);
        // Create a minimal input with just the payment method
        const input: CalculationInput = { 
          amount: 0, 
          currency: paymentMethod.currency, 
          paymentMethod 
        };
        return calculator.getPointsCurrency(input);
      } catch (error) {
        // Ignore and continue to further fallback options
      }
      
      // Fallback to CardRegistry if calculator is unavailable
      const cardInfo = CardRegistry.findCard(
        paymentMethod.issuer || '',
        paymentMethod.name || ''
      );
      
      return cardInfo?.pointsCurrency || 
        (paymentMethod.issuer ? `${paymentMethod.issuer} Points` : 'Points');
    } catch (error) {
      console.error('Error getting points currency:', error);
      return paymentMethod.issuer ? `${paymentMethod.issuer} Points` : 'Points';
    }
  }
}

// Export a singleton instance for easy access
export const rewardCalculationService = RewardCalculationService.getInstance();
