
import { useState, useEffect, useCallback } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { Transaction, Merchant, PaymentMethod, Currency, MerchantCategoryCode } from '@/types';
import { addOrUpdateMerchant, getMerchantByName } from '@/utils/storageUtils';
import { simulateRewardPoints } from '@/utils/rewardPoints';
import { useToast } from '@/hooks/use-toast';
import { findCashPaymentMethodForCurrency } from '@/utils/defaults/paymentMethods';
import { getCategoryFromMCC, getCategoryFromMerchantName } from '@/utils/categoryMapping';

// Import component sections
import MerchantDetailsForm from './MerchantDetailsForm';
import TransactionDetailsForm from './TransactionDetailsForm';
import PaymentDetailsForm from './PaymentDetailsForm';

const formSchema = z.object({
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
  date: z.date({
    required_error: 'Date is required',
  }),
  notes: z.string().optional(),
  mcc: z.any().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface ExpenseFormProps {
  paymentMethods: PaymentMethod[];
  onSubmit: (transaction: Omit<Transaction, 'id'>) => void;
  defaultValues?: Partial<FormValues>;
}

const ExpenseForm = ({ paymentMethods, onSubmit, defaultValues }: ExpenseFormProps) => {
  const { toast } = useToast();
  const [selectedMCC, setSelectedMCC] = useState<MerchantCategoryCode | undefined>();
  const [shouldOverridePayment, setShouldOverridePayment] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | undefined>();
  const [estimatedPoints, setEstimatedPoints] = useState<number | {
    totalPoints: number;
    basePoints?: number;
    bonusPoints?: number;
    remainingMonthlyBonusPoints?: number;
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
      currency: defaultValues?.currency || 'SGD',
      paymentMethodId: defaultValues?.paymentMethodId || '',
      paymentAmount: defaultValues?.paymentAmount || '',
      date: defaultValues?.date || new Date(),
      notes: defaultValues?.notes || '',
    },
  });
  
  const merchantName = form.watch('merchantName');
  const currency = form.watch('currency') as Currency;
  const paymentMethodId = form.watch('paymentMethodId');
  const amount = Number(form.watch('amount')) || 0;
  const isOnline = form.watch('isOnline');
  const isContactless = form.watch('isContactless');
  
  // Memoize merchant fetch to prevent excessive rerenders
  const fetchMerchant = useCallback(async (name: string) => {
    if (name && name.trim().length >= 3) {
      try {
        const existingMerchant = await getMerchantByName(name);
        if (existingMerchant?.mcc) {
          setSelectedMCC(existingMerchant.mcc);
          form.setValue('mcc', existingMerchant.mcc);
        }
      } catch (error) {
        console.error('Error fetching merchant:', error);
      }
    }
  }, [form]);

  // Debounce merchant fetch to avoid excessive API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchMerchant(merchantName);
    }, 300); // 300ms debounce
    
    return () => clearTimeout(timer);
  }, [merchantName, fetchMerchant]);
  
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
  
  // Calculate reward points with debounce to prevent excessive calculations
  useEffect(() => {
    if (!selectedPaymentMethod || amount <= 0) {
      setEstimatedPoints(0);
      return;
    }
    
    const timer = setTimeout(async () => {
      try {
        const mccCode = selectedMCC?.code;
        
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
    }, 300); // 300ms debounce
    
    return () => clearTimeout(timer);
  }, [amount, currency, selectedPaymentMethod, selectedMCC, merchantName, isOnline, isContactless]);
  
  const handleFormSubmit = async (values: FormValues) => {
    try {
      if (!values.merchantName || values.merchantName.trim() === '') {
        toast({
          title: 'Error',
          description: 'Merchant name is required',
          variant: 'destructive',
        });
        return;
      }
      
      if (!values.paymentMethodId) {
        toast({
          title: 'Error',
          description: 'Payment method is required',
          variant: 'destructive',
        });
        return;
      }
      
      const paymentMethod = paymentMethods.find(pm => pm.id === values.paymentMethodId);
      if (!paymentMethod) {
        console.error('Selected payment method not found:', values.paymentMethodId);
        toast({
          title: 'Error',
          description: 'Selected payment method not found',
          variant: 'destructive',
        });
        return;
      }
      
      const merchant: Merchant = {
        id: '',
        name: values.merchantName.trim(),
        address: values.merchantAddress?.trim(),
        isOnline: values.isOnline,
        mcc: selectedMCC,
      };
      
      console.log('Adding/updating merchant:', merchant);
      const savedMerchant = await addOrUpdateMerchant(merchant);
      console.log('Merchant saved:', savedMerchant);
      
      // Determine category
      let category = 'Uncategorized';
      if (selectedMCC?.code) {
        category = getCategoryFromMCC(selectedMCC.code);
      } else {
        category = getCategoryFromMerchantName(values.merchantName) || 'Uncategorized';
      }
      
      const transaction: Omit<Transaction, 'id'> = {
        date: format(values.date, 'yyyy-MM-dd'),
        merchant: savedMerchant,
        amount: Number(values.amount),
        currency: values.currency as Currency,
        paymentMethod: paymentMethod,
        paymentAmount: shouldOverridePayment && values.paymentAmount 
          ? Number(values.paymentAmount) 
          : Number(values.amount),
        paymentCurrency: paymentMethod.currency,
        rewardPoints: typeof estimatedPoints === 'object' 
          ? estimatedPoints.totalPoints 
          : (typeof estimatedPoints === 'number' ? estimatedPoints : 0),
        notes: values.notes,
        isContactless: !values.isOnline ? values.isContactless : false,
        // Set category based on MCC code or merchant name
        category,
      };
      
      console.log('Submitting final transaction:', transaction);
      onSubmit(transaction);
    } catch (error) {
      console.error('Error submitting form:', error);
      toast({
        title: 'Error',
        description: 'Failed to save transaction',
        variant: 'destructive',
      });
    }
  };
  
  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-8">
        <MerchantDetailsForm />
        <TransactionDetailsForm />
        <PaymentDetailsForm 
          paymentMethods={paymentMethods}
          selectedPaymentMethod={selectedPaymentMethod}
          shouldOverridePayment={shouldOverridePayment}
          estimatedPoints={estimatedPoints}
        />
      </form>
    </FormProvider>
  );
};

export default ExpenseForm;
