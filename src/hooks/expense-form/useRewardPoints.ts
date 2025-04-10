// hooks/expense-form/useRewardPoints.ts
import { useState } from 'react';
import { PaymentMethod } from '@/types';
import { rewardCalculatorService } from '@/services/rewards/RewardCalculatorService';
import { bonusPointsTrackingService } from '@/services/BonusPointsTrackingService';
import { TransactionType } from '@/services/rewards/types';

// Define return type for clearer API
export interface PointsSimulationResult {
  totalPoints: number;
  basePoints?: number;
  bonusPoints?: number;
  remainingMonthlyBonusPoints?: number;
  messageText?: string;
  pointsCurrency?: string;
  isLoading?: boolean;
  error?: string;
}

export const useRewardPoints = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);

  /**
   * Simulate points for a transaction based on the given parameters
   */
  const simulatePoints = async (
    amount: number,
    currency: string,
    paymentMethod: PaymentMethod,
    mcc?: string,
    merchantName?: string,
    isOnline?: boolean,
    isContactless?: boolean
  ): Promise<PointsSimulationResult> => {
    // Reset state
    setIsLoading(true);
    setError(undefined);
    
    try {
      // Determine transaction type from isOnline and isContactless
      let transactionType: TransactionType;
      if (isOnline) {
        transactionType = TransactionType.ONLINE;
      } else if (isContactless) {
        transactionType = TransactionType.CONTACTLESS;
      } else {
        transactionType = TransactionType.IN_STORE;
      }
      
      // Get monthly used bonus points from service
      const usedBonusPoints = await bonusPointsTrackingService.getUsedBonusPoints(
        paymentMethod.id
      );
      
      // Use the reward calculation service for simulation
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
      
      // Format a message based on calculation results
      let messageText;
      if (result.bonusPoints === 0 && result.remainingMonthlyBonusPoints === 0) {
        messageText = "Monthly bonus points cap reached";
      } else if (result.bonusPoints === 0 && result.remainingMonthlyBonusPoints !== undefined && result.remainingMonthlyBonusPoints > 0) {
        messageText = "Not eligible for bonus points";
      } else if (result.bonusPoints > 0) {
        messageText = `Earning ${result.bonusPoints} bonus points`;
      } else if (result.remainingMonthlyBonusPoints !== undefined) {
        messageText = `${result.remainingMonthlyBonusPoints.toLocaleString()} bonus points remaining this month`;
      }
      
      return {
        ...result,
        messageText,
        isLoading: false
      };
    } catch (err) {
      // Handle any unexpected errors
      const errorMessage = err instanceof Error ? err.message : 'Error calculating reward points';
      setError(errorMessage);
      console.error('Error in simulatePoints hook:', err);
      
      // Return fallback result with error - using Math.round for proper rounding
      return {
        totalPoints: Math.round(amount),
        basePoints: Math.round(amount),
        bonusPoints: 0,
        error: errorMessage,
        isLoading: false,
        pointsCurrency: rewardCalculatorService.getPointsCurrency(paymentMethod)
      };
    } finally {
      setIsLoading(false);
    }
  };

  return { 
    simulatePoints,
    isLoading,
    error
  };
};
