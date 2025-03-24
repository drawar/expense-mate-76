
import { useEffect, useState } from 'react';
import { PaymentMethod, MerchantCategoryCode, Currency } from '@/types';
import { simulateRewardPoints } from '@/utils/rewards/rewardPoints';

export const useRewardPoints = (
  selectedPaymentMethod: PaymentMethod | undefined,
  amount: number,
  currency: Currency,
  selectedMCC: MerchantCategoryCode | undefined,
  merchantName: string,
  isOnline: boolean,
  isContactless: boolean
) => {
  const [estimatedPoints, setEstimatedPoints] = useState<number | {
    totalPoints: number;
    basePoints?: number;
    bonusPoints?: number;
    remainingMonthlyBonusPoints?: number;
    messageText?: string;
  }>(0);

  // Calculate reward points with debounce to prevent excessive calculations
  useEffect(() => {
    if (!selectedPaymentMethod || amount <= 0) {
      setEstimatedPoints(0);
      return;
    }
    
    const timer = setTimeout(async () => {
      try {
        const mccCode = selectedMCC?.code;
        
        const points = await simulateRewardPoints(
          amount,
          currency,
          selectedPaymentMethod,
          mccCode,
          merchantName,
          isOnline,
          isContactless
        );
        
        setEstimatedPoints(points);
      } catch (error) {
        console.error('Error simulating points:', error);
        setEstimatedPoints(0);
      }
    }, 300); // 300ms debounce
    
    return () => clearTimeout(timer);
  }, [amount, currency, selectedPaymentMethod, selectedMCC, merchantName, isOnline, isContactless]);

  return { estimatedPoints };
};
