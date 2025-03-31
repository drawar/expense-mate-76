// src/utils/rewards/rewardCalculationAdapter.ts
import { Transaction, PaymentMethod } from '@/types';
import { rewardCalculationService } from '@/services/RewardCalculationService';
import { bonusPointsTrackingService } from '@/services/BonusPointsTrackingService';

/**
 * Adapter for the calculatePoints function in storage/transactions/calculations.ts
 * Replaces the existing switch statement with a call to the centralized service
 */
export async function calculatePoints(transaction: Transaction): Promise<{
  basePoints: number;
  bonusPoints: number;
  totalPoints: number;
}> {
  // Skip calculation for cash payments
  if (transaction.paymentMethod.type === 'cash') {
    return {
      basePoints: 0,
      bonusPoints: 0,
      totalPoints: 0
    };
  }
  
  // Get transaction date components
  const txDate = new Date(transaction.date);
  const year = txDate.getFullYear();
  const month = txDate.getMonth();
  
  // Get used bonus points for this month for the payment method
  const usedBonusPoints = await bonusPointsTrackingService.getUsedBonusPoints(
    transaction.paymentMethod.id,
    year,
    month
  );
  
  // Use the centralized service to calculate points
  return rewardCalculationService.calculatePoints(transaction, usedBonusPoints);
}

/**
 * Synchronous version for immediate calculations
 * Uses a default of 0 for usedBonusPoints when tracking service can't be used synchronously
 */
export function calculatePointsSync(transaction: Transaction): {
  basePoints: number;
  bonusPoints: number;
  totalPoints: number;
} {
  // Skip calculation for cash payments
  if (transaction.paymentMethod.type === 'cash') {
    return {
      basePoints: 0,
      bonusPoints: 0,
      totalPoints: 0
    };
  }
  
  // Use 0 as default for usedBonusPoints in synchronous context
  // This is a simplified approach for when we need immediate results
  const usedBonusPoints = 0;
  
  // Use the centralized service to calculate points
  return rewardCalculationService.calculatePoints(transaction, usedBonusPoints);
}

/**
 * Adapter for simulateRewardPoints in utils/rewards/rewardPoints.ts
 * Replaces all the separate simulation functions with a call to the centralized service
 */
export async function simulateRewardPoints(
  amount: number,
  currency: string,
  paymentMethod: PaymentMethod,
  mcc?: string,
  merchantName?: string,
  isOnline?: boolean,
  isContactless?: boolean,
  currentDate: Date = new Date()
): Promise<{
  totalPoints: number;
  basePoints?: number;
  bonusPoints?: number;
  remainingMonthlyBonusPoints?: number;
  messageText?: string;
  pointsCurrency?: string;
}> {
  if (paymentMethod.type === 'cash') {
    return { totalPoints: 0 };
  }
  
  // Extract year and month from date
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  // Get used bonus points for the current month from the tracking service
  const usedBonusPoints = await bonusPointsTrackingService.getUsedBonusPoints(
    paymentMethod.id,
    year,
    month
  );
  
  try {
    // Use the centralized service to simulate points
    const result = rewardCalculationService.simulatePoints(
      amount,
      currency,
      paymentMethod,
      mcc,
      merchantName,
      isOnline,
      isContactless,
      usedBonusPoints
    );
    
    // Format a message text based on calculation results
    let messageText;
    if (result.bonusPoints === 0 && result.remainingMonthlyBonusPoints === 0) {
      messageText = "Monthly bonus points cap reached";
    } else if (result.bonusPoints === 0 && result.remainingMonthlyBonusPoints > 0) {
      messageText = "Not eligible for bonus points";
    } else if (result.remainingMonthlyBonusPoints !== undefined) {
      messageText = `${result.remainingMonthlyBonusPoints.toLocaleString()} bonus points remaining this month`;
    }
    
    return {
      ...result,
      messageText
    };
  } catch (error) {
    console.error('Error simulating reward points:', error);
    // Provide a fallback response in case of errors - using Math.round for proper rounding
    return { 
      totalPoints: Math.round(amount), 
      basePoints: Math.round(amount),
      bonusPoints: 0,
      messageText: 'Error calculating points' 
    };
  }
}

/**
 * Adapter for calculateTransactionPoints in utils/rewards/rewardPoints.ts
 * Replaces all the separate transaction calculation functions
 */
export async function calculateTransactionPoints(
  transaction: Transaction,
  allTransactions: Transaction[]
): Promise<number> {
  // Extract date components
  const txDate = new Date(transaction.date);
  const year = txDate.getFullYear();
  const month = txDate.getMonth();
  
  // Get used bonus points from previous transactions in the same month
  // using the BonusPointsTrackingService
  const relevantTransactions = allTransactions.filter(tx => tx.id !== transaction.id); // Exclude current transaction
  const usedBonusPoints = bonusPointsTrackingService.calculateUsedBonusPointsFromTransactions(
    relevantTransactions,
    transaction.paymentMethod.id,
    year,
    month
  );
  
  // Use the centralized service to calculate points
  const calculatedPoints = rewardCalculationService.calculatePoints(
    transaction,
    usedBonusPoints
  );
  
  return calculatedPoints.totalPoints;
}

/**
 * Adapter for calculateTotalRewardPoints in utils/rewards/rewardPoints.ts
 */
export function calculateTotalRewardPoints(transactions: Transaction[]): number {
  return transactions.reduce((total, transaction) => {
    // Ensure reward points is a number
    const points = typeof transaction.rewardPoints === 'number' 
      ? transaction.rewardPoints 
      : 0;
    return total + points;
  }, 0);
}
