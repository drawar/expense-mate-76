// services/rewards/rewardCalculationAdapter.ts

import { Transaction, PaymentMethod } from '@/types';
import { rewardCalculatorService } from '@/services/rewards/RewardCalculatorService';
import { TransactionType } from '@/services/rewards/types';
import { bonusPointsTrackingService } from '@/services/BonusPointsTrackingService';

/**
 * Adapter function for calculating points
 * This replaces the old calculator logic and reconnects it to the new system
 */
export async function calculateRewardPoints(transaction: Transaction): Promise<{
  basePoints: number;
  bonusPoints: number;
  totalPoints: number;
  pointsCurrency?: string;
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
    
    // Use the new reward calculator service
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
    
    return {
      basePoints: result.basePoints,
      bonusPoints: result.bonusPoints,
      totalPoints: result.totalPoints,
      pointsCurrency: result.pointsCurrency
    };
  } catch (error) {
    console.error('Error calculating reward points:', error);
    
    // Fallback to simple calculation
    return {
      basePoints: Math.round(transaction.amount),
      bonusPoints: 0,
      totalPoints: Math.round(transaction.amount)
    };
  }
}

/**
 * Adapter function for simulating points
 * This replaces the old simulator logic
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
    let transactionType: TransactionType;
    if (isOnline) {
      transactionType = TransactionType.ONLINE;
    } else if (isContactless) {
      transactionType = TransactionType.CONTACTLESS;
    } else {
      transactionType = TransactionType.IN_STORE;
    }
    
    // Get monthly used bonus points
    const usedBonusPoints = await bonusPointsTrackingService.getUsedBonusPoints(
      paymentMethod.id
    );
    
    // Use the new reward calculator service
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
    
    // Format message text based on calculation results
    let messageText;
    if (result.messages.length > 0) {
      messageText = result.messages.join('. ');
    } else if (result.bonusPoints === 0 && result.remainingMonthlyBonusPoints === 0) {
      messageText = "Monthly bonus points cap reached";
    } else if (result.bonusPoints === 0 && result.remainingMonthlyBonusPoints !== undefined && result.remainingMonthlyBonusPoints > 0) {
      messageText = "Not eligible for bonus points";
    } else if (result.bonusPoints > 0) {
      messageText = `Earning ${result.bonusPoints} bonus points`;
    } else if (result.remainingMonthlyBonusPoints !== undefined) {
      messageText = `${result.remainingMonthlyBonusPoints.toLocaleString()} bonus points remaining this month`;
    }
    
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