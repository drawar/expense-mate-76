// hooks/useExpenseForm.ts
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState, useEffect, useCallback } from 'react';
import { z } from 'zod';
import { PaymentMethod, MerchantCategoryCode, Currency } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { simulateRewardPoints } from '@/services/rewards';
import { getMerchantByName, hasMerchantCategorySuggestions, getSuggestedMerchantCategory } from '@/services/storage';
import { useDebounce } from '@/hooks/use-debounce';

// Form validation schema
const expenseFormSchema = z.object({
  merchantName: z.string().min(1, 'Merchant name is required'),
  merchantAddress: z.string().optional(),
  isOnline: z.boolean().default(false),
  isContactless: z.boolean().default(false),
  amount: z.string().min(1, 'Amount is required').refine(value => !isNaN(Number(value)) && Number(value) > 0, {
    message: 'Amount must be a positive number',
  }),
  currency: z.string().min(1, 'Currency is required'),
  paymentMethodId: z.string().min(1, 'Payment method is required'),
  paymentAmount: z.string().refine(value => !isNaN(Number(value)) && Number(value) >= 0, {
    message: 'Payment amount must be a non-negative number',
  }).optional(),
  reimbursementAmount: z.string().refine(value => value === '' || (!isNaN(Number(value)) && Number(value) >= 0), {
    message: 'Reimbursement amount must be a non-negative number',
  }).default('0'),
  date: z.date({
    required_error: 'Date is required',
  }),
  notes: z.string().optional(),
  mcc: z.any().optional(),
});

// Export our form values type definition
export type ExpenseFormValues = z.infer<typeof expenseFormSchema>;

interface UseExpenseFormProps {
  paymentMethods: PaymentMethod[];
  defaultValues?: Partial<ExpenseFormValues>;
}

// Return type for points calculation
export interface PointsCalculationResult {
  totalPoints: number;
  basePoints?: number;
  bonusPoints?: number;
  remainingMonthlyBonusPoints?: number;
  messageText?: string;
  pointsCurrency?: string;
}

/**
 * Unified hook for handling expense form functionality
 */
export function useExpenseForm({ paymentMethods, defaultValues }: UseExpenseFormProps) {
  const { toast } = useToast();
  const [selectedMCC, setSelectedMCC] = useState<MerchantCategoryCode | undefined>();
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | undefined>();
  const [shouldOverridePayment, setShouldOverridePayment] = useState(false);
  const [pointsCalculation, setPointsCalculation] = useState<PointsCalculationResult>({
    totalPoints: 0,
    basePoints: 0,
    bonusPoints: 0
  });
  const [suggestionChecked, setSuggestionChecked] = useState(false);

  // Initialize form with validation
  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseFormSchema),
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
      reimbursementAmount: defaultValues?.reimbursementAmount || '0',
    },
  });

  // Watch form values needed for calculations and UI updates
  const merchantName = form.watch('merchantName');
  const debouncedMerchantName = useDebounce(merchantName, 500);
  const currency = form.watch('currency') as Currency;
  const amount = Number(form.watch('amount')) || 0;
  const paymentAmount = Number(form.watch('paymentAmount')) || 0;
  const isOnline = form.watch('isOnline');
  const isContactless = form.watch('isContactless');
  const paymentMethodId = form.watch('paymentMethodId');

  // Fetch merchant data when name changes
  useEffect(() => {
    const checkMerchantData = async () => {
      if (debouncedMerchantName.trim().length < 3) {
        return;
      }

      if (!suggestionChecked) {
        try {
          setSuggestionChecked(true);
          
          // Check if the merchant exists in the database
          const existingMerchant = await getMerchantByName(debouncedMerchantName);
          if (existingMerchant?.mcc) {
            setSelectedMCC(existingMerchant.mcc);
            form.setValue('mcc', existingMerchant.mcc);
            return;
          }
          
          // Check for suggested category
          const hasSuggestions = await hasMerchantCategorySuggestions(debouncedMerchantName);
          if (hasSuggestions) {
            const suggestedMCC = await getSuggestedMerchantCategory(debouncedMerchantName);
            if (suggestedMCC) {
              setSelectedMCC(suggestedMCC);
              form.setValue('mcc', suggestedMCC);
              
              toast({
                title: "Merchant category suggested",
                description: `Using ${suggestedMCC.description} (${suggestedMCC.code}) based on previous entries`,
              });
            }
          }
        } catch (error) {
          console.error('Error checking merchant data:', error);
        }
      }
    };
    
    checkMerchantData();
  }, [debouncedMerchantName, form, toast, suggestionChecked]);

  // Reset suggestion check when merchant name changes significantly
  useEffect(() => {
    if (merchantName.trim().length < 3) {
      setSuggestionChecked(false);
    }
  }, [merchantName]);

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

  // Initialize payment method if none selected
  useEffect(() => {
    if (paymentMethods.length > 0 && !paymentMethodId) {
      // Find default cash payment method for the selected currency
      const cashMethod = paymentMethods.find(pm => pm.type === 'cash' && pm.currency === currency);
      if (cashMethod) {
        form.setValue('paymentMethodId', cashMethod.id);
        form.trigger('paymentMethodId');
      } else if (paymentMethods.length > 0) {
        // Use the first payment method as fallback
        form.setValue('paymentMethodId', paymentMethods[0].id);
        form.trigger('paymentMethodId');
      }
    }
  }, [paymentMethods, form, paymentMethodId, currency]);

  // Calculate reward points when relevant inputs change
  useEffect(() => {
    const calculatePoints = async () => {
      // Skip calculation if required fields are missing
      if (!amount || amount <= 0 || !selectedPaymentMethod) {
        setPointsCalculation({
          totalPoints: 0,
          basePoints: 0,
          bonusPoints: 0
        });
        return;
      }
      
      // Skip for cash payment methods
      if (selectedPaymentMethod.type === 'cash') {
        setPointsCalculation({
          totalPoints: 0,
          basePoints: 0,
          bonusPoints: 0
        });
        return;
      }
      
      try {
        const actualAmount = shouldOverridePayment ? paymentAmount : amount;
        const actualCurrency = shouldOverridePayment ? selectedPaymentMethod.currency : currency;
        
        // Use the centralized reward calculation service
        const result = await simulateRewardPoints(
          actualAmount,
          actualCurrency,
          selectedPaymentMethod,
          selectedMCC?.code,
          merchantName,
          isOnline,
          isContactless
        );
        
        setPointsCalculation({
          totalPoints: result.totalPoints,
          basePoints: result.basePoints,
          bonusPoints: result.bonusPoints,
          remainingMonthlyBonusPoints: result.remainingMonthlyBonusPoints,
          messageText: result.messages?.[0],
          pointsCurrency: result.pointsCurrency
        });
      } catch (error) {
        console.error('Error calculating reward points:', error);
        // Provide fallback calculation
        const fallbackPoints = Math.round(amount);
        setPointsCalculation({
          totalPoints: fallbackPoints,
          basePoints: fallbackPoints,
          bonusPoints: 0,
          messageText: 'Error calculating points'
        });
      }
    };
    
    // Call the points calculation
    calculatePoints();
  }, [
    amount, 
    paymentAmount,
    shouldOverridePayment,
    selectedPaymentMethod, 
    currency, 
    selectedMCC, 
    merchantName, 
    isOnline, 
    isContactless
  ]);

  return {
    form,
    selectedMCC,
    setSelectedMCC,
    selectedPaymentMethod,
    shouldOverridePayment,
    pointsCalculation
  };
}
