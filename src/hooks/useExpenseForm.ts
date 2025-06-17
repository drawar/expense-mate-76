import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { PaymentMethod, MerchantCategoryCode } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { FormValues, formSchema } from '@/hooks/expense/expense-form/formSchema';
import { useMerchantData } from '@/hooks/expense/expense-form/useMerchantData';
import { usePaymentMethodLogic } from '@/hooks/expense/expense-form/usePaymentMethodLogic';
import { useRewardPointsStandalone } from '@/hooks/expense/expense-form/useRewardPointsStandalone';
import { useState, useEffect } from 'react';

interface UseExpenseFormProps {
  paymentMethods: PaymentMethod[];
  defaultValues?: Partial<FormValues>;
}

// Change regular export to type export
export type { FormValues } from '@/hooks/expense/expense-form/formSchema';

export const useExpenseForm = ({ paymentMethods, defaultValues }: UseExpenseFormProps) => {
  const { toast } = useToast();
  const [estimatedPoints, setEstimatedPoints] = useState<number | {
    totalPoints: number;
    basePoints?: number;
    bonusPoints?: number;
    remainingMonthlyBonusPoints?: number;
    pointsCurrency?: string;
    messageText?: string;
  }>(0);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      merchantName: defaultValues?.merchantName || '',
      merchantAddress: defaultValues?.merchantAddress || '',
      isOnline: defaultValues?.isOnline ?? false,
      isContactless: defaultValues?.isContactless ?? false,
      amount: defaultValues?.amount || '',
      currency: defaultValues?.currency || 'CAD',
      paymentMethodId: defaultValues?.paymentMethodId || '',
      paymentAmount: defaultValues?.paymentAmount || '',
      date: defaultValues?.date || new Date(),
      notes: defaultValues?.notes || '',
      mcc: defaultValues?.mcc || null,
    },
  });
  
  const merchantName = form.watch('merchantName');
  const currency = form.watch('currency') as any;
  const amount = Number(form.watch('amount')) || 0;
  const paymentAmount = Number(form.watch('paymentAmount')) || 0;
  const isOnline = form.watch('isOnline');
  const isContactless = form.watch('isContactless');
  const paymentMethodId = form.watch('paymentMethodId');
  
  // Updated to properly handle null MCC
  const [selectedMCC, setSelectedMCC] = useState<MerchantCategoryCode | null>(null);
  
  // Initialize selectedMCC from form default values if available
  useEffect(() => {
    if (defaultValues?.mcc) {
      setSelectedMCC(defaultValues.mcc);
    }
  }, [defaultValues?.mcc]);
  
  const { selectedPaymentMethod, shouldOverridePayment } = usePaymentMethodLogic(
    form,
    paymentMethods,
    currency,
    amount,
    isOnline
  );
  
  // Use the standalone simulatePoints from our hook - passing the full array of paymentMethods
  const { estimatedPoints: calculatedPoints } = useRewardPointsStandalone(
    shouldOverridePayment ? paymentAmount : amount,
    paymentMethodId,
    paymentMethods,
    selectedMCC?.code,
    merchantName,
    isOnline,
    isContactless
  );
  
  // Update the local state when the calculated points change
  useEffect(() => {
    setEstimatedPoints(calculatedPoints);
  }, [calculatedPoints]);

  return {
    form,
    selectedMCC,
    setSelectedMCC,
    selectedPaymentMethod,
    shouldOverridePayment,
    estimatedPoints,
  };
};
