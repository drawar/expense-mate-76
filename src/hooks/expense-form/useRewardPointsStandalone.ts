// hooks/expense-form/useRewardPointsStandalone.ts
import { useState, useEffect, useRef } from 'react';
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
  isContactless?: boolean,
  debounceMs: number = 500 // Add debounce delay parameter with default 500ms
) {
  // State for estimated points
  const [estimatedPoints, setEstimatedPoints] = useState<PointsResult>({
    totalPoints: 0,
    basePoints: 0,
    bonusPoints: 0
  });
  
  // Timer reference for debouncing
  const timerRef = useRef<number | null>(null);
  
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
    
    // Clear any existing timer
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
    }
    
    // Set a new timer to debounce the calculation
    timerRef.current = window.setTimeout(() => {
      calculatePoints();
    }, debounceMs);
    
    // Cleanup function to clear the timer if the component unmounts
    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
      }
    };
  }, [amount, paymentMethodId, selectedPaymentMethod, mcc, merchantName, isOnline, isContactless, paymentMethods, debounceMs]);
  
  return {
    estimatedPoints,
    selectedPaymentMethod
  };
}
