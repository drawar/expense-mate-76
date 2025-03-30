// src/utils/rewards/rewardCalculationAdapters.ts
import { Transaction, PaymentMethod } from '@/types';
import { rewardCalculationService } from '@/services/RewardCalculationService';

/**
 * Adapter for the calculatePoints function in storage/transactions/calculations.ts
 * Replaces the existing switch statement with a call to the centralized service
 */
export function calculatePoints(transaction: Transaction): {
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
  
  // Get used bonus points for this month for the payment method
  // Note: This would ideally be fetched from a central bonus points tracking service
  // For now, we'll assume 0 used points
  const usedBonusPoints = 0; // This should be replaced with actual tracking
  
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
  
  // This would be replaced with a call to a bonus points tracking service
  // The service would get used bonus points for the current month
  // For now, we'll use 0 as a placeholder
  const usedBonusPoints = 0; // This should be replaced with actual tracking
  
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
    
    // Format a message text (this could be enhanced with card-specific messages)
    let messageText;
    if (result.bonusPoints === 0 && result.remainingMonthlyBonusPoints === 0) {
      messageText = "Monthly bonus points cap reached";
    }
    
    return {
      ...result,
      messageText
    };
  } catch (error) {
    console.error('Error simulating reward points:', error);
    // Provide a fallback response in case of errors
    return { 
      totalPoints: Math.floor(amount), 
      basePoints: Math.floor(amount),
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
  // Calculate used bonus points from previous transactions in the same month
  const paymentMethodId = transaction.paymentMethod.id;
  const txDate = new Date(transaction.date);
  const txMonth = txDate.getMonth();
  const txYear = txDate.getFullYear();
  
  // Find transactions from the same payment method in the current month
  const monthTransactions = allTransactions.filter(tx => {
    const date = new Date(tx.date);
    return tx.paymentMethod.id === paymentMethodId &&
           date.getMonth() === txMonth &&
           date.getFullYear() === txYear &&
           tx.id !== transaction.id; // Exclude current transaction
  });
  
  // Calculate used bonus points
  let usedBonusPoints = 0;
  monthTransactions.forEach(tx => {
    if (tx.rewardPoints > 0) {
      // This is simplified and should be replaced with the actual base/bonus calculation
      // Ideally, we would store the base/bonus breakdown in the transaction record
      const calculatedPoints = rewardCalculationService.calculatePoints(tx);
      usedBonusPoints += calculatedPoints.bonusPoints;
    }
  });
  
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
