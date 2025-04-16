import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState, useEffect, useMemo } from 'react';
import { PaymentMethod, MerchantCategoryCode } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { rewardService } from '@/core/rewards/RewardService';

// Form schema definition
export const formSchema = z.object({
  merchantName: z.string().min(1, 'Merchant name is required'),
  merchantAddress: z.string().optional(),
  isOnline: z.boolean().default(false),
  isContactless: z.boolean().default(false),
  amount: z.string().min(1, 'Amount is required'),
  currency: z.string().min(1, 'Currency is required'),
  paymentMethodId: z.string().min(1, 'Payment method is required'),
  paymentAmount: z.string().optional(),
  reimbursementAmount: z.string().default('0'),
  date: z.date(),
  notes: z.string().optional(),
  mcc: z.any().optional().nullable()
});

export type FormValues = z.infer<typeof formSchema>;

export interface PointsCalculationResult {
  totalPoints: number;
  basePoints?: number;
  bonusPoints?: number;
  remainingMonthlyBonusPoints?: number;
  pointsCurrency?: string;
  messageText?: string;
}

interface UseExpenseFormProps {
  paymentMethods: PaymentMethod[];
  defaultValues?: Partial<FormValues>;
}

export const useExpenseForm = ({ paymentMethods, defaultValues }: UseExpenseFormProps) => {
  const { toast } = useToast();
  
  // Initialize form with defaults
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
      reimbursementAmount: defaultValues?.reimbursementAmount || '0',
      date: defaultValues?.date || new Date(),
      notes: defaultValues?.notes || '',
      mcc: defaultValues?.mcc || null,
    },
  });
  
  // Form field values
  const merchantName = form.watch('merchantName');
  const currency = form.watch('currency') as any;
  const amount = Number(form.watch('amount')) || 0;
  const paymentAmount = Number(form.watch('paymentAmount')) || 0;
  const isOnline = form.watch('isOnline');
  const isContactless = form.watch('isContactless');
  const paymentMethodId = form.watch('paymentMethodId');
  
  // Selected MCC state
  const [selectedMCC, setSelectedMCC] = useState<MerchantCategoryCode | null>(null);
  
  // Initialize selectedMCC from form default values if available
  useEffect(() => {
    if (defaultValues?.mcc) {
      setSelectedMCC(defaultValues.mcc);
    }
  }, [defaultValues?.mcc]);
  
  // Get selected payment method
  const selectedPaymentMethod = paymentMethods.find(pm => pm.id === paymentMethodId);
  
  // Determine if payment currency override is needed
  const shouldOverridePayment = useMemo(() => {
    if (!selectedPaymentMethod || !currency) return false;
    return selectedPaymentMethod.currency !== currency;
  }, [selectedPaymentMethod, currency]);
  
  // Calculate reward points
  const [pointsCalculation, setPointsCalculation] = useState<PointsCalculationResult>({
    totalPoints: 0,
    basePoints: 0,
    bonusPoints: 0
  });
  
  // Simulate points calculation
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
        const calculationResults = await rewardService.simulatePoints(
          amount,
          currency,
          selectedPaymentMethod,
          selectedMCC?.code,
          merchantName,
          isOnline,
          isContactless
        );
        
        // Format message text
        let messageText;
        if (calculationResults.bonusPoints === 0 && calculationResults.remainingMonthlyBonusPoints === 0) {
          messageText = "Monthly bonus points cap reached";
        } else if (calculationResults.bonusPoints === 0) {
          messageText = "Not eligible for bonus points";
        } else if (calculationResults.bonusPoints > 0) {
          messageText = `Earning ${calculationResults.bonusPoints} bonus points`;
        } else if (calculationResults.remainingMonthlyBonusPoints !== undefined) {
          messageText = `${calculationResults.remainingMonthlyBonusPoints.toLocaleString()} bonus points remaining this month`;
        }
        
        setPointsCalculation({
          totalPoints: calculationResults.totalPoints,
          basePoints: calculationResults.basePoints,
          bonusPoints: calculationResults.bonusPoints,
          remainingMonthlyBonusPoints: calculationResults.remainingMonthlyBonusPoints,
          pointsCurrency: calculationResults.pointsCurrency,
          messageText
        });
      } catch (error) {
        console.error('Error simulating points:', error);
        // Keep last calculation result on error
      }
    };
    
    calculatePoints();
  }, [amount, currency, selectedPaymentMethod, selectedMCC?.code, merchantName, isOnline, isContactless]);
  
  return {
    form,
    selectedMCC,
    setSelectedMCC,
    selectedPaymentMethod,
    shouldOverridePayment,
    pointsCalculation,
  };
};
