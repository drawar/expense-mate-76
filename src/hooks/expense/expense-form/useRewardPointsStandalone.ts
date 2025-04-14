
import { useState, useEffect } from 'react';
import { PaymentMethod } from '@/types';
import { simulateRewardPoints } from '@/services/rewards';

export const useRewardPointsStandalone = (
  amount: number,
  paymentMethodId: string,
  paymentMethods: PaymentMethod[],
  mccCode?: string,
  merchantName?: string,
  isOnline?: boolean,
  isContactless?: boolean
) => {
  const [estimatedPoints, setEstimatedPoints] = useState({
    totalPoints: 0,
    basePoints: 0,
    bonusPoints: 0
  });
  
  useEffect(() => {
    const calculatePoints = async () => {
      // Skip calculation if required fields are missing
      if (!amount || amount <= 0 || !paymentMethodId) {
        setEstimatedPoints({
          totalPoints: 0,
          basePoints: 0,
          bonusPoints: 0
        });
        return;
      }
      
      const paymentMethod = paymentMethods.find(pm => pm.id === paymentMethodId);
      if (!paymentMethod) {
        setEstimatedPoints({
          totalPoints: 0,
          basePoints: 0,
          bonusPoints: 0
        });
        return;
      }
      
      // Skip for cash payment methods
      if (paymentMethod.type === 'cash') {
        setEstimatedPoints({
          totalPoints: 0,
          basePoints: 0,
          bonusPoints: 0
        });
        return;
      }
      
      try {
        // Use the centralized reward calculation service
        const result = await simulateRewardPoints(
          amount,
          paymentMethod.currency,
          paymentMethod,
          mccCode,
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
    
    // Call the points calculation
    calculatePoints();
  }, [
    amount, 
    paymentMethodId, 
    paymentMethods,
    mccCode,
    merchantName,
    isOnline,
    isContactless
  ]);
  
  return { estimatedPoints };
};
