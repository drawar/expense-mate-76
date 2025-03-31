// src/hooks/expense-form/useRewardPoints.ts
import { useState } from 'react';
import { PaymentMethod } from '@/types';
import { rewardCalculationService } from '@/services/RewardCalculationService';
import { bonusPointsTrackingService } from '@/services/BonusPointsTrackingService';
import { simulateRewardPoints } from '@/utils/rewards/rewardCalculationAdapter';

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
      // Use the adapter function which handles both calculation and error handling
      const result = await simulateRewardPoints(
        amount,
        currency,
        paymentMethod,
        mcc,
        merchantName,
        isOnline,
        isContactless,
        new Date() // Use current date
      );
      
      return {
        ...result,
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
        pointsCurrency: rewardCalculationService.getPointsCurrency(paymentMethod)
      };
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Synchronous version for immediate UI feedback
   * Less accurate (doesn't account for used bonus points) but faster
   */
  const estimatePointsSync = (
    amount: number,
    currency: string,
    paymentMethod: PaymentMethod,
    mcc?: string,
    merchantName?: string,
    isOnline?: boolean,
    isContactless?: boolean
  ): PointsSimulationResult => {
    if (paymentMethod.type === 'cash') {
      return { totalPoints: 0 };
    }
    
    try {
      // Use synchronous calculation (doesn't account for used bonus points)
      const result = rewardCalculationService.simulatePoints(
        amount,
        currency,
        paymentMethod,
        mcc,
        merchantName,
        isOnline,
        isContactless,
        0 // Assume 0 used bonus points for synchronous calculation
      );
      
      return {
        ...result,
        pointsCurrency: rewardCalculationService.getPointsCurrency(paymentMethod)
      };
    } catch (err) {
      // Return fallback result for sync calculation - using Math.round for proper rounding
      return {
        totalPoints: Math.round(amount),
        basePoints: Math.round(amount),
        bonusPoints: 0,
        pointsCurrency: rewardCalculationService.getPointsCurrency(paymentMethod)
      };
    }
  };

  return { 
    simulatePoints,
    estimatePointsSync,
    isLoading,
    error
  };
};
