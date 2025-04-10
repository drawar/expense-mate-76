import { useCallback, useEffect, useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { PaymentMethod, Currency } from '@/types';
import { FormValues } from './formSchema';
import { findCashPaymentMethodForCurrency } from '@/utils/defaults/paymentMethods';
import { rewardCalculatorService } from '@/services/rewards/RewardCalculatorService';

// Initialize the reward calculator service
rewardCalculatorService.initialize().catch(error => {
  console.error('Failed to initialize reward calculator service:', error);
});

export const usePaymentMethodLogic = (
  form: UseFormReturn<FormValues>,
  paymentMethods: PaymentMethod[],
  currency: Currency,
  amount: number,
  isOnline: boolean
) => {
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | undefined>();
  const [shouldOverridePayment, setShouldOverridePayment] = useState(false);
  
  const paymentMethodId = form.watch('paymentMethodId');

  // Initialize selected payment method based on stored payment methods
  useEffect(() => {
    if (paymentMethods.length > 0 && !paymentMethodId) {
      // Find default cash payment method for the selected currency
      const cashMethod = findCashPaymentMethodForCurrency(currency);
      if (cashMethod) {
        form.setValue('paymentMethodId', cashMethod.id);
        form.trigger('paymentMethodId');
      } else {
        // Use the first payment method as fallback
        form.setValue('paymentMethodId', paymentMethods[0].id);
        form.trigger('paymentMethodId');
      }
    }
  }, [paymentMethods, form, paymentMethodId, currency]);

  // Update payment method when currency changes
  useEffect(() => {
    if (currency && !paymentMethodId) {
      const cashMethod = findCashPaymentMethodForCurrency(currency);
      if (cashMethod) {
        form.setValue('paymentMethodId', cashMethod.id);
        form.trigger('paymentMethodId');
      }
    }
  }, [currency, form, paymentMethodId]);

  // Handle payment method selection changes - memoized to prevent excessive rerenders
  const updateSelectedPaymentMethod = useCallback(() => {
    if (paymentMethodId) {
      const method = paymentMethods.find(pm => pm.id === paymentMethodId);
      
      if (method) {
        setSelectedPaymentMethod(method);
        
        // Check if we need to handle currency conversion
        if (currency !== method.currency) {
          setShouldOverridePayment(true);
          
          // Set initial payment amount only if amount has changed
          if (amount > 0) {
            const conversionRates: Record<string, Record<string, number>> = {
              USD: { SGD: 1.35, EUR: 0.92, GBP: 0.78 },
              SGD: { USD: 0.74, EUR: 0.68, GBP: 0.58 },
              EUR: { USD: 1.09, SGD: 1.47, GBP: 0.85 },
              GBP: { USD: 1.28, SGD: 1.73, EUR: 1.17 }
            };
            
            const rate = conversionRates[currency]?.[method.currency] || 1;
            const convertedAmount = (amount * rate).toFixed(2);
            form.setValue('paymentAmount', convertedAmount);
          }
        } else {
          setShouldOverridePayment(false);
          form.setValue('paymentAmount', form.watch('amount'));
        }
        
        // Set contactless for credit cards when not online
        if (!isOnline && method.type === 'credit_card') {
          form.setValue('isContactless', true);
        }
      } else {
        setSelectedPaymentMethod(undefined);
        setShouldOverridePayment(false);
      }
    } else {
      setSelectedPaymentMethod(undefined);
      setShouldOverridePayment(false);
    }
  }, [currency, paymentMethodId, form, paymentMethods, amount, isOnline]);

  // Call the memoized update function when dependencies change
  useEffect(() => {
    updateSelectedPaymentMethod();
  }, [updateSelectedPaymentMethod]);

  return {
    selectedPaymentMethod,
    shouldOverridePayment,
  };
};
