import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { PaymentMethod, MerchantCategoryCode } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { FormValues, formSchema } from '@/hooks/expense/expense-form/formSchema';
import { useMerchantData } from '@/hooks/expense/expense-form/useMerchantData';
import { usePaymentMethodLogic } from '@/hooks/expense/expense-form/usePaymentMethodLogic';
import { useState, useEffect } from 'react';
import { rewardService } from '@/core/rewards/RewardService';

interface UseExpenseFormProps {
  paymentMethods: PaymentMethod[];
  defaultValues?: Partial<FormValues>;
}

// Change regular export to type export
export type { FormValues } from '@/hooks/expense/expense-form/formSchema';

export interface PointsCalculationResult {
  totalPoints: number;
  basePoints?: number;
  bonusPoints?: number;
  remainingMonthlyBonusPoints?: number;
  pointsCurrency?: string;
  messageText?: string;
}

export const useExpenseForm = ({ paymentMethods, defaultValues }: UseExpenseFormProps) => {
  const { toast } = useToast();
  const [pointsCalculation, setPointsCalculation] = useState<PointsCalculationResult>({
    totalPoints: 0,
    basePoints: 0,
    bonusPoints: 0
  });
  
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
  
  // Calculate reward points using the reward service
  useEffect(() => {
    const calculatePoints = async () => {
      if (!selectedPaymentMethod || amount <= 0) {
        setPointsCalculation({
          totalPoints: 0,
          basePoints: 0,
          bonusPoints: 0
        });
        return;
      }
      
      try {
        const effectiveAmount = shouldOverridePayment ? paymentAmount : amount;
        const result = await rewardService.simulateRewards(
          effectiveAmount,
          currency,
          selectedPaymentMethod,
          selectedMCC?.code,
          merchantName,
          isOnline,
          isContactless
        );
        
        // Format message text
        let messageText;
        if (result.bonusPoints === 0 && result.remainingMonthlyBonusPoints === 0) {
          messageText = "Monthly bonus points cap reached";
        } else if (result.bonusPoints === 0) {
          messageText = "Not eligible for bonus points";
        } else if (result.bonusPoints > 0) {
          messageText = `Earning ${result.bonusPoints} bonus points`;
        } else if (result.remainingMonthlyBonusPoints !== undefined) {
          messageText = `${result.remainingMonthlyBonusPoints.toLocaleString()} bonus points remaining this month`;
        }
        
        setPointsCalculation({
          totalPoints: result.totalPoints,
          basePoints: result.basePoints,
          bonusPoints: result.bonusPoints,
          remainingMonthlyBonusPoints: result.remainingMonthlyBonusPoints,
          pointsCurrency: result.pointsCurrency,
          messageText
        });
      } catch (error) {
        console.error('Error calculating reward points:', error);
        // Keep last calculation result on error
      }
    };
    
    calculatePoints();
  }, [amount, currency, selectedPaymentMethod, selectedMCC?.code, merchantName, isOnline, isContactless, shouldOverridePayment, paymentAmount]);

  return {
    form,
    selectedMCC,
    setSelectedMCC,
    selectedPaymentMethod,
    shouldOverridePayment,
    pointsCalculation,
  };
};
