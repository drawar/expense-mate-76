
import { useState, useEffect } from 'react';
import { PaymentMethod } from '@/types';
import { rewardCalculationService } from '@/services/RewardCalculationService';

// Define the result interface to include all possible fields
interface PointsResult {
  totalPoints: number;
  basePoints?: number;
  bonusPoints?: number;
  remainingMonthlyBonusPoints?: number;
  pointsCurrency?: string;
  messageText?: string;
}

/**
 * Hook for calculating reward points outside of the Dashboard context
 * This is a standalone version that doesn't require DashboardContext
 */
export function useRewardPointsStandalone(
  amount: number | null,
  paymentMethodId: string | null,
  paymentMethods: PaymentMethod[],
  mcc?: string,
  merchantName?: string,
  isOnline?: boolean,
  isContactless?: boolean
) {
  // State for estimated points
  const [estimatedPoints, setEstimatedPoints] = useState<PointsResult>({
    totalPoints: 0,
    basePoints: 0,
    bonusPoints: 0
  });
  
  // Find selected payment method
  const selectedPaymentMethod = paymentMethods.find(pm => pm.id === paymentMethodId) || null;
  
  // Calculate estimated points when inputs change
  useEffect(() => {
    // Reset points if no amount or payment method
    if (!amount || amount <= 0 || !selectedPaymentMethod) {
      setEstimatedPoints({
        totalPoints: 0,
        basePoints: 0,
        bonusPoints: 0
      });
      return;
    }
    
    // Skip for cash payment methods
    if (selectedPaymentMethod.type === 'cash') {
      setEstimatedPoints({
        totalPoints: 0,
        basePoints: 0,
        bonusPoints: 0
      });
      return;
    }
    
    // Use rewardCalculationService to calculate points
    const currency = selectedPaymentMethod.currency || 'SGD';
    
    try {
      // Calculate points using the service
      const result = rewardCalculationService.simulatePoints(
        amount,
        currency,
        selectedPaymentMethod,
        mcc,
        merchantName,
        isOnline,
        isContactless
      );
      
      console.log('Reward calculation result:', result);
      
      // Format message text based on calculation results
      let messageText;
      if (result.bonusPoints === 0 && result.remainingMonthlyBonusPoints === 0) {
        messageText = "Monthly bonus points cap reached";
      } else if (result.bonusPoints === 0 && result.remainingMonthlyBonusPoints !== undefined && result.remainingMonthlyBonusPoints > 0) {
        messageText = "Not eligible for bonus points";
      } else if (result.remainingMonthlyBonusPoints !== undefined) {
        messageText = `${result.remainingMonthlyBonusPoints.toLocaleString()} bonus points remaining this month`;
      }
      
      // Ensure we have proper values
      setEstimatedPoints({
        totalPoints: result.totalPoints || 0,
        basePoints: result.basePoints || 0,
        bonusPoints: result.bonusPoints || 0,
        remainingMonthlyBonusPoints: result.remainingMonthlyBonusPoints,
        pointsCurrency: result.pointsCurrency || selectedPaymentMethod.issuer ? `${selectedPaymentMethod.issuer} Points` : 'Points',
        messageText: messageText
      });
    } catch (error) {
      console.error('Error calculating reward points:', error);
      // Provide fallback calculation
      const fallbackPoints = Math.round(amount);
      setEstimatedPoints({
        totalPoints: fallbackPoints,
        basePoints: fallbackPoints,
        bonusPoints: 0,
        messageText: 'Error calculating points'
      });
    }
  }, [amount, paymentMethodId, selectedPaymentMethod, mcc, merchantName, isOnline, isContactless, paymentMethods]);
  
  return {
    estimatedPoints,
    selectedPaymentMethod
  };
}
