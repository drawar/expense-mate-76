
import { useMemo } from 'react';
import { PaymentMethod } from '@/types';
import { useDashboardContext } from '@/contexts/DashboardContext';

/**
 * Hook for calculating reward points based on transaction details.
 * This hook provides a unified interface to the reward calculation system.
 * 
 * @param amount - Transaction amount
 * @param currency - Transaction currency code
 * @param selectedPaymentMethod - Selected payment method
 * @param mcc - Merchant Category Code
 * @param merchantName - Name of the merchant
 * @param isOnline - Whether the transaction is online
 * @param isContactless - Whether the transaction is contactless
 * @returns Object containing estimated points
 */
export function useRewardPoints(
  amount: number,
  currency: string,
  selectedPaymentMethod: PaymentMethod | undefined,
  mcc?: string,
  merchantName?: string,
  isOnline = false,
  isContactless = false
) {
  const { rewardCalculationService } = useDashboardContext();
  
  // Calculate monthly used bonus points (would come from transaction history in a real app)
  // This is a simplified implementation - in a real app, we would calculate this based on
  // the transaction history for the current statement period
  const usedBonusPoints = 0;
  
  // Compute rewards based on inputs
  const estimatedPoints = useMemo(() => {
    if (!selectedPaymentMethod || selectedPaymentMethod.type === 'cash') {
      return 0;
    }
    
    return rewardCalculationService.simulatePoints(
      amount,
      currency,
      selectedPaymentMethod,
      mcc,
      merchantName,
      isOnline,
      isContactless,
      usedBonusPoints
    );
  }, [amount, currency, selectedPaymentMethod, mcc, merchantName, isOnline, isContactless, rewardCalculationService]);
  
  return { estimatedPoints };
}
