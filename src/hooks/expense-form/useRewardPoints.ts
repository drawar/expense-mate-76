// src/hooks/expense-form/useRewardPoints.ts
import { PaymentMethod } from '@/types';
import { rewardCalculationService } from '@/services/RewardCalculationService';
import { bonusPointsTrackingService } from '@/services/BonusPointsTrackingService';

export const useRewardPoints = () => {
  const simulatePoints = async (
    amount: number,
    currency: string,
    paymentMethod: PaymentMethod,
    mcc?: string,
    merchantName?: string,
    isOnline?: boolean,
    isContactless?: boolean
  ) => {
    // Get used bonus points for the current month
    const usedBonusPoints = await bonusPointsTrackingService.getUsedBonusPoints(
      paymentMethod.id
    );
    
    // Use the centralized service to simulate points calculation
    const result = rewardCalculationService.simulatePoints(
      amount,
      currency,
      paymentMethod,
      mcc,
      merchantName,
      isOnline,
      isContactless,
      usedBonusPoints
    );
    
    // Get the points currency
    const pointsCurrency = rewardCalculationService.getPointsCurrency(paymentMethod);
    
    return {
      ...result,
      pointsCurrency
    };
  };

  return { simulatePoints };
};
