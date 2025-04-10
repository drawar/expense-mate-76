// hooks/expense-form/useRewardPointsStandalone.ts
import { useState, useEffect } from 'react';
import { PaymentMethod } from '@/types';
import { simulateRewardPoints } from '@/services/rewards/rewardCalculationAdapter';

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
 */
export function useRewardPointsStandalone(
  amount: number | null,
  paymentMethodId: string | null,
  paymentMethods: PaymentMethod[] | undefined,
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
  
  // Find selected payment method, with null check for paymentMethods
  const selectedPaymentMethod = paymentMethods && paymentMethodId ? 
    paymentMethods.find(pm => pm.id === paymentMethodId) || null : null;
  
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
    
    // Define an async function to get the points
    const calculatePoints = async () => {
      const currency = selectedPaymentMethod.currency || 'SGD';
      
      try {
        console.log('useRewardPointsStandalone: Calculating points with parameters:', {
          amount,
          currency, 
          selectedPaymentMethod: selectedPaymentMethod.name,
          mcc,
          merchantName,
          isOnline,
          isContactless
        });
        
        // Use the shared adapter function
        const result = await simulateRewardPoints(
          amount,
          currency,
          selectedPaymentMethod,
          mcc,
          merchantName,
          isOnline,
          isContactless
        );
        
        setEstimatedPoints(result);
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
    };
    
    // Call the async function
    calculatePoints();
  }, [amount, paymentMethodId, selectedPaymentMethod, mcc, merchantName, isOnline, isContactless, paymentMethods]);
  
  return {
    estimatedPoints,
    selectedPaymentMethod
  };
}
