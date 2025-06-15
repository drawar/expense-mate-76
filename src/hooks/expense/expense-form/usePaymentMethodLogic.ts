
import { useEffect } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { PaymentMethod, Currency } from '@/types';
import { FormValues } from './formSchema';

export const usePaymentMethodLogic = (
  form: UseFormReturn<FormValues>,
  paymentMethods: PaymentMethod[],
  currency: Currency,
  amount: number,
  isOnline: boolean
) => {
  const paymentMethodId = form.watch('paymentMethodId');
  const selectedPaymentMethod = paymentMethods.find(pm => pm.id === paymentMethodId);
  
  // Check if we should override payment amount
  const shouldOverridePayment = selectedPaymentMethod?.currency !== currency;

  useEffect(() => {
    if (shouldOverridePayment && selectedPaymentMethod?.conversionRate) {
      const rate = selectedPaymentMethod.conversionRate[currency];
      if (rate && amount > 0) {
        const convertedAmount = (amount * rate).toFixed(2);
        form.setValue('paymentAmount', convertedAmount);
      }
    }
  }, [shouldOverridePayment, selectedPaymentMethod, currency, amount, form]);

  return {
    selectedPaymentMethod,
    shouldOverridePayment,
  };
};
