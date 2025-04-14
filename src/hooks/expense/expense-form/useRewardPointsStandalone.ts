
import { useState, useEffect } from 'react';
import { PaymentMethod } from '@/types';
import { simulateRewardPoints } from '@/services/rewards';

// Define our return type to match the structure used
export interface PointsCalculationResult {
  totalPoints: number;
  basePoints?: number;
  bonusPoints?: number;
  remainingMonthlyBonusPoints?: number;
  messageText?: string;
  pointsCurrency?: string;
}

export function useRewardPointsStandalone(
  amount: number,
  paymentMethodId: string,
  paymentMethods: PaymentMethod[],
  mcc?: string,
  merchantName?: string,
  isOnline?: boolean,
  isContactless?: boolean
) {
  // Update the type to match the PointsCalculationResult interface
  const [estimatedPoints, setEstimatedPoints] = useState<PointsCalculationResult>({
    totalPoints: 0,
    basePoints: 0,
    bonusPoints: 0
  });
  
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Skip calculation if required fields are missing
    if (!amount || !paymentMethodId || paymentMethods.length === 0) {
      return;
    }

    // Find the payment method
    const paymentMethod = paymentMethods.find(pm => pm.id === paymentMethodId);
    if (!paymentMethod) {
      console.log('Payment method not found:', paymentMethodId);
      return;
    }
    
    // Skip for cash payment methods (they don't earn points)
    if (paymentMethod.type === 'cash') {
      setEstimatedPoints({
        totalPoints: 0,
        basePoints: 0,
        bonusPoints: 0
      });
      return;
    }

    // Calculate reward points
    const calculatePoints = async () => {
      try {
        setIsCalculating(true);
        setError(null);
        
        const result = await simulateRewardPoints(
          amount,
          paymentMethod.currency,
          paymentMethod,
          mcc,
          merchantName,
          isOnline,
          isContactless
        );
        
        setEstimatedPoints({
          totalPoints: result.totalPoints,
          basePoints: result.basePoints,
          bonusPoints: result.bonusPoints,
          remainingMonthlyBonusPoints: result.remainingMonthlyBonusPoints,
          messageText: result.messages?.[0],
          pointsCurrency: result.pointsCurrency
        });
      } catch (err) {
        console.error('Error calculating points:', err);
        setError(err instanceof Error ? err : new Error('Failed to calculate points'));
        setEstimatedPoints({
          totalPoints: Math.floor(amount), // Fallback to base earning
          basePoints: Math.floor(amount),
          bonusPoints: 0,
          messageText: 'Error calculating points'
        });
      } finally {
        setIsCalculating(false);
      }
    };

    // Execute calculation
    calculatePoints();
  }, [amount, paymentMethodId, paymentMethods, mcc, merchantName, isOnline, isContactless]);

  return {
    estimatedPoints,
    isCalculating,
    error
  };
}
