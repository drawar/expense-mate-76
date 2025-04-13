
import { Transaction } from '@/types';
import { rewardCalculatorService } from '@/services/rewards/RewardCalculatorService';

/**
 * Calculate points for a transaction 
 * This is a wrapper function for the central reward calculation service
 */
export async function calculateRewardPoints(transaction: Transaction) {
  // Use the service to calculate points
  const result = await rewardCalculatorService.calculatePoints(transaction, 0);
  
  return {
    totalPoints: result.totalPoints,
    basePoints: result.basePoints,
    bonusPoints: result.bonusPoints
  };
}

/**
 * Simulate points for a transaction
 * This is a wrapper function for the central reward calculation service
 */
export async function simulateRewardPoints(
  amount: number,
  currency: string,
  paymentMethodId: string,
  paymentMethods: any[],
  mcc?: string,
  merchantName?: string,
  isOnline?: boolean,
  isContactless?: boolean
) {
  // Find the payment method
  const paymentMethod = paymentMethods.find(pm => pm.id === paymentMethodId);
  if (!paymentMethod) {
    return { totalPoints: 0 };
  }
  
  // Use the service to simulate points
  return rewardCalculatorService.simulatePoints(
    amount,
    currency,
    paymentMethod,
    mcc,
    merchantName,
    isOnline,
    isContactless
  );
}
