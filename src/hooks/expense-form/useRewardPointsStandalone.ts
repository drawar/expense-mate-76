
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
      // Use the rewardCalculationService directly
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
      
      // Log the points calculation for debugging
      console.log('Points calculation result:', {
        amount,
        currency,
        selectedPaymentMethod: selectedPaymentMethod.name,
        mcc,
        merchantName,
        isOnline,
        isContactless,
        result: points
      });
      
      // Ensure the points calculation includes proper bonusPoints
      if (typeof points === 'object') {
        // If bonusPoints is undefined but we have basePoints and totalPoints,
        // calculate bonusPoints as the difference
        if (points.bonusPoints === undefined && points.basePoints !== undefined) {
          points.bonusPoints = points.totalPoints - points.basePoints;
        }
        
        // If basePoints is undefined but we have bonusPoints and totalPoints,
        // calculate basePoints as the difference
        if (points.basePoints === undefined && points.bonusPoints !== undefined) {
          points.basePoints = points.totalPoints - points.bonusPoints;
        }
        
        // Generate a message based on the results
        let messageText;
        if (points.bonusPoints === 0 && points.remainingMonthlyBonusPoints === 0) {
          messageText = "Monthly bonus points cap reached";
        } else if (points.bonusPoints === 0 && isOnline) {
          messageText = "Not eligible for online bonus points";
        } else if (points.remainingMonthlyBonusPoints !== undefined) {
          messageText = `${points.remainingMonthlyBonusPoints.toLocaleString()} bonus points remaining this month`;
        }
        
        // Update the points object with the message
        if (messageText) {
          points.messageText = messageText;
        }
      }
      
      setEstimatedPoints(points);
    } catch (error) {
      console.error('Error calculating reward points:', error);
      setEstimatedPoints(0);
    }
  }, [selectedPaymentMethod, amount, currency, mcc, merchantName, isOnline, isContactless]);
  
  return { estimatedPoints };
}
