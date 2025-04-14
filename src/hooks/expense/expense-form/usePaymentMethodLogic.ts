
import { useEffect, useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { PaymentMethod, Currency } from '@/types';

export const usePaymentMethodLogic = (
  form: UseFormReturn<any>,
  paymentMethods: PaymentMethod[],
  currency: Currency,
  amount: number,
  isOnline: boolean
) => {
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | undefined>();
  const [shouldOverridePayment, setShouldOverridePayment] = useState(false);
  
  const paymentMethodId = form.watch('paymentMethodId');
  
  // Update selected payment method when paymentMethodId changes
  useEffect(() => {
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
      } else {
        setSelectedPaymentMethod(undefined);
        setShouldOverridePayment(false);
      }
    } else {
      setSelectedPaymentMethod(undefined);
      setShouldOverridePayment(false);
    }
  }, [currency, paymentMethodId, form, paymentMethods, amount]);
  
  return {
    selectedPaymentMethod,
    shouldOverridePayment
  };
};
