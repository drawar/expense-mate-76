
import { useState, useEffect } from 'react';
import { PaymentMethod } from '@/types';
import { rewardCalculationService } from '@/services/RewardCalculationService';

/**
 * Standalone version of useRewardPoints that doesn't depend on DashboardContext
 * Used specifically for the expense form
 */
export function useRewardPointsStandalone(
  amount: number,
  currency: string,
  selectedPaymentMethod: PaymentMethod | undefined,
  mcc?: string,
  merchantName?: string,
  isOnline = false,
  isContactless = false
) {
  const [estimatedPoints, setEstimatedPoints] = useState<number | {
    totalPoints: number;
    basePoints?: number;
    bonusPoints?: number;
    remainingMonthlyBonusPoints?: number;
    messageText?: string;
    pointsCurrency?: string;
  }>(0);
  
  // Calculate estimated points when relevant fields change
  useEffect(() => {
    if (!selectedPaymentMethod || amount <= 0) {
      setEstimatedPoints(0);
      return;
    }
    
    try {
      // Use the rewardCalculationService directly rather than through the context
      const points = rewardCalculationService.simulatePoints(
        amount,
        currency,
        selectedPaymentMethod,
        mcc,
        merchantName,
        isOnline,
        isContactless,
        0 // No used bonus points in this standalone implementation
      );
      
      // Ensure the points calculation includes proper bonusPoints
      if (typeof points === 'object' && points.bonusPoints === undefined && points.basePoints !== undefined) {
        points.bonusPoints = points.totalPoints - points.basePoints;
      }
      
      setEstimatedPoints(points);
    } catch (error) {
      console.error('Error calculating reward points:', error);
      setEstimatedPoints(0);
    }
  }, [selectedPaymentMethod, amount, currency, mcc, merchantName, isOnline, isContactless]);
  
  return { estimatedPoints };
}
