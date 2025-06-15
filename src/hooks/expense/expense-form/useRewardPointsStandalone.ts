
import { useState, useEffect } from 'react';
import { PaymentMethod } from '@/types';
import { simulateRewardPoints } from '@/core/rewards';

export const useRewardPointsStandalone = (
  amount: number,
  paymentMethodId: string,
  paymentMethods: PaymentMethod[],
  mcc?: string,
  merchantName?: string,
  isOnline?: boolean,
  isContactless?: boolean
) => {
  const [estimatedPoints, setEstimatedPoints] = useState<number | {
    totalPoints: number;
    basePoints?: number;
    bonusPoints?: number;
    remainingMonthlyBonusPoints?: number;
    pointsCurrency?: string;
    messageText?: string;
  }>(0);

  useEffect(() => {
    const calculatePoints = async () => {
      if (amount > 0 && paymentMethodId) {
        const paymentMethod = paymentMethods.find(pm => pm.id === paymentMethodId);
        if (paymentMethod) {
          try {
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
              pointsCurrency: result.pointsCurrency,
              messageText: result.messages.join(', ')
            });
          } catch (error) {
            console.error('Error calculating reward points:', error);
            setEstimatedPoints(0);
          }
        }
      } else {
        setEstimatedPoints(0);
      }
    };

    calculatePoints();
  }, [amount, paymentMethodId, paymentMethods, mcc, merchantName, isOnline, isContactless]);

  return { estimatedPoints };
};
