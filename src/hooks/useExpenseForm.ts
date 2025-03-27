
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { PaymentMethod } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { FormValues, formSchema } from './expense-form/formSchema';
import { useMerchantData } from './expense-form/useMerchantData';
import { usePaymentMethodLogic } from './expense-form/usePaymentMethodLogic';
import { useRewardPoints } from './expense-form/useRewardPoints';
import { useState, useEffect } from 'react';

interface UseExpenseFormProps {
  paymentMethods: PaymentMethod[];
  defaultValues?: Partial<FormValues>;
}

// Change regular export to type export
export type { FormValues } from './expense-form/formSchema';

export const useExpenseForm = ({ paymentMethods, defaultValues }: UseExpenseFormProps) => {
  const { toast } = useToast();
  const [estimatedPoints, setEstimatedPoints] = useState<number | {
    totalPoints: number;
    basePoints?: number;
    bonusPoints?: number;
    remainingMonthlyBonusPoints?: number;
    pointsCurrency?: string;
  }>(0);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      merchantName: defaultValues?.merchantName || '',
      merchantAddress: defaultValues?.merchantAddress || '',
      isOnline: defaultValues?.isOnline ?? false,
      isContactless: defaultValues?.isContactless ?? false,
      amount: defaultValues?.amount || '',
      currency: defaultValues?.currency || 'SGD',
      paymentMethodId: defaultValues?.paymentMethodId || '',
      paymentAmount: defaultValues?.paymentAmount || '',
      date: defaultValues?.date || new Date(),
      notes: defaultValues?.notes || '',
    },
  });
  
  const merchantName = form.watch('merchantName');
  const currency = form.watch('currency') as any;
  const amount = Number(form.watch('amount')) || 0;
  const isOnline = form.watch('isOnline');
  const isContactless = form.watch('isContactless');
  
  const { selectedMCC, setSelectedMCC } = useMerchantData(form, merchantName);
  
  const { selectedPaymentMethod, shouldOverridePayment } = usePaymentMethodLogic(
    form,
    paymentMethods,
    currency,
    amount,
    isOnline
  );
  
  const { simulatePoints } = useRewardPoints();
  
  // Calculate estimated points when relevant fields change
  const calculateEstimatedPoints = async () => {
    if (selectedPaymentMethod && amount > 0) {
      try {
        const points = await simulatePoints(
          amount,
          currency,
          selectedPaymentMethod,
          selectedMCC?.code,
          merchantName,
          isOnline,
          isContactless
        );
        setEstimatedPoints(points);
      } catch (error) {
        console.error('Error calculating reward points:', error);
        setEstimatedPoints(0);
      }
    } else {
      setEstimatedPoints(0);
    }
  };
  
  // Call the calculation function when dependencies change
  useEffect(() => {
    calculateEstimatedPoints();
  }, [selectedPaymentMethod, amount, currency, selectedMCC, merchantName, isOnline, isContactless]);

  return {
    form,
    selectedMCC,
    setSelectedMCC,
    selectedPaymentMethod,
    shouldOverridePayment,
    estimatedPoints,
  };
};
