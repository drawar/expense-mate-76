// hooks/expense-form/useRewardPoints.ts
import { useState } from 'react';
import { PaymentMethod } from '@/types';
import { simulateRewardPoints } from '@/services/rewards/rewardCalculationAdapter';

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
      // Use the shared adapter function
      const result = await simulateRewardPoints(
        amount,
        currency,
        paymentMethod,
        mcc,
        merchantName,
        isOnline,
        isContactless
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
      
      // Return fallback result with error
      return {
        totalPoints: Math.round(amount),
        basePoints: Math.round(amount),
        bonusPoints: 0,
        error: errorMessage,
        isLoading: false,
        pointsCurrency: 'Points'
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
