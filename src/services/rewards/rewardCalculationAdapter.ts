// services/rewards/rewardCalculationAdapter.ts
import { Transaction, PaymentMethod } from '@/types';
import { rewardCalculatorService } from '@/services/rewards/RewardCalculatorService';
import { TransactionType } from '@/services/rewards/types';
import { bonusPointsTrackingService } from '@/services/BonusPointsTrackingService';

/**
 * Determine transaction type from transaction properties
 */
/**
 * Determine transaction type from transaction properties
 * 
 * Note: When merchant is online, TransactionType is ONLINE regardless of contactless status
 */
export function determineTransactionType(
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
 * Format message text based on calculation results
 */
export function formatPointsMessage(
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
 * Calculate points for a transaction
 */
export async function calculateRewardPoints(transaction: Transaction): Promise<{
  basePoints: number;
  bonusPoints: number;
  totalPoints: number;
  pointsCurrency?: string;
  messageText?: string;
}> {
  // Skip calculation for cash payments
  if (transaction.paymentMethod.type === 'cash') {
    return {
      basePoints: 0,
      bonusPoints: 0,
      totalPoints: 0
    };
  }
  
  try {
    // Get monthly used bonus points
    const usedBonusPoints = await bonusPointsTrackingService.getUsedBonusPoints(
      transaction.paymentMethod.id
    );
    
    // Use the reward calculator service
    const result = await rewardCalculatorService.calculatePoints(
      transaction,
      usedBonusPoints
    );
    
    // If we successfully calculated the rewards, record the bonus points movement
    if (result.bonusPoints > 0) {
      await bonusPointsTrackingService.recordBonusPointsMovement(
        transaction.id,
        transaction.paymentMethod.id,
        result.bonusPoints
      );
    }
    
    // Format message
    const messageText = formatPointsMessage(result.bonusPoints, result.remainingMonthlyBonusPoints);
    
    return {
      basePoints: result.basePoints,
      bonusPoints: result.bonusPoints,
      totalPoints: result.totalPoints,
      pointsCurrency: result.pointsCurrency,
      messageText
    };
  } catch (error) {
    console.error('Error calculating reward points:', error);
    
    // Fallback to simple calculation
    return {
      basePoints: Math.round(transaction.amount),
      bonusPoints: 0,
      totalPoints: Math.round(transaction.amount),
      messageText: 'Error calculating points'
    };
  }
}

/**
 * Simulate points for a hypothetical transaction
 */
export async function simulateRewardPoints(
  amount: number,
  currency: string,
  paymentMethod: PaymentMethod,
  mcc?: string,
  merchantName?: string,
  isOnline?: boolean,
  isContactless?: boolean
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
  
  try {
    // Determine transaction type
    const transactionType = determineTransactionType(isOnline, isContactless);
    
    // Get monthly used bonus points
    const usedBonusPoints = await bonusPointsTrackingService.getUsedBonusPoints(
      paymentMethod.id
    );
    
    // Use the reward calculator service
    const result = await rewardCalculatorService.simulatePoints(
      amount,
      currency,
      paymentMethod,
      mcc,
      merchantName,
      isOnline,
      isContactless,
      usedBonusPoints
    );
    
    // Format message
    const messageText = formatPointsMessage(result.bonusPoints, result.remainingMonthlyBonusPoints);
    
    return {
      totalPoints: result.totalPoints,
      basePoints: result.basePoints,
      bonusPoints: result.bonusPoints,
      remainingMonthlyBonusPoints: result.remainingMonthlyBonusPoints,
      messageText,
      pointsCurrency: result.pointsCurrency
    };
  } catch (error) {
    console.error('Error simulating reward points:', error);
    
    // Provide a fallback response
    return { 
      totalPoints: Math.round(amount), 
      basePoints: Math.round(amount),
      bonusPoints: 0,
      messageText: 'Error calculating points' 
    };
  }
}
