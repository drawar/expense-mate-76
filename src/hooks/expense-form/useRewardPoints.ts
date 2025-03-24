
import { useEffect, useState, useCallback, useRef } from 'react';
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
  
  // Use refs to track previous values and avoid unnecessary calculations
  const previousValues = useRef({
    methodId: '',
    amount: 0,
    currency: '' as Currency,
    mccCode: '',
    merchantName: '',
    isOnline: false,
    isContactless: false
  });

  // Memoized calculate function
  const calculatePoints = useCallback(async () => {
    if (!selectedPaymentMethod || amount <= 0) {
      setEstimatedPoints(0);
      return;
    }
    
    const mccCode = selectedMCC?.code;
    
    // Skip calculation if inputs haven't changed
    const current = {
      methodId: selectedPaymentMethod.id,
      amount,
      currency,
      mccCode: mccCode || '',
      merchantName,
      isOnline,
      isContactless
    };
    
    const prev = previousValues.current;
    
    if (
      prev.methodId === current.methodId &&
      prev.amount === current.amount &&
      prev.currency === current.currency &&
      prev.mccCode === current.mccCode &&
      prev.merchantName === current.merchantName &&
      prev.isOnline === current.isOnline &&
      prev.isContactless === current.isContactless
    ) {
      return; // No change, skip calculation
    }
    
    // Update previous values
    previousValues.current = current;
    
    try {
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
  }, [amount, currency, selectedPaymentMethod, selectedMCC, merchantName, isOnline, isContactless]);

  // Calculate reward points with debounce to prevent excessive calculations
  useEffect(() => {
    const timer = setTimeout(calculatePoints, 300); // 300ms debounce
    return () => clearTimeout(timer);
  }, [calculatePoints]);

  return { estimatedPoints };
};
