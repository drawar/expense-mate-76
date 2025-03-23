
import { useState, useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { Transaction, Merchant, PaymentMethod, Currency, MerchantCategoryCode } from '@/types';
import { addOrUpdateMerchant, getMerchantByName } from '@/utils/storageUtils';
import { simulateRewardPoints } from '@/utils/rewardPoints';
import { useToast } from '@/hooks/use-toast';
import { findCashPaymentMethodForCurrency } from '@/utils/defaults/paymentMethods';
import { getCategoryFromMCC } from '@/utils/categoryMapping';

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
  
  console.log('ExpenseForm rendered with payment methods:', paymentMethods.length);
  
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
  useEffect(() => {
    if (merchantName && merchantName.trim().length >= 3) {
      const fetchMerchant = async () => {
        try {
          const existingMerchant = await getMerchantByName(merchantName);
          if (existingMerchant?.mcc) {
            setSelectedMCC(existingMerchant.mcc);
            form.setValue('mcc', existingMerchant.mcc);
          }
        } catch (error) {
          console.error('Error fetching merchant:', error);
        }
      };
      
      fetchMerchant();
    }
  }, [merchantName, form]);
  
  const currency = form.watch('currency') as Currency;
  const paymentMethodId = form.watch('paymentMethodId');
  const amount = Number(form.watch('amount')) || 0;
  const isOnline = form.watch('isOnline');
  const isContactless = form.watch('isContactless');
  
  console.log('Current payment method ID:', paymentMethodId);
  
  // Initialize selected payment method based on stored payment methods
  useEffect(() => {
    if (paymentMethods.length > 0 && !paymentMethodId) {
      // Find default cash payment method for the selected currency
      const cashMethod = findCashPaymentMethodForCurrency(currency);
      if (cashMethod) {
        console.log('Setting initial cash payment method:', cashMethod.name);
        form.setValue('paymentMethodId', cashMethod.id);
        form.trigger('paymentMethodId');
      } else {
        // Use the first payment method as fallback
        console.log('Setting first payment method as default:', paymentMethods[0].name);
        form.setValue('paymentMethodId', paymentMethods[0].id);
        form.trigger('paymentMethodId');
      }
    }
  }, [paymentMethods, form, paymentMethodId, currency]);

  // When currency changes, try to find a matching cash payment method
  useEffect(() => {
    if (currency && !paymentMethodId) {
      const cashMethod = findCashPaymentMethodForCurrency(currency);
      if (cashMethod) {
        console.log('Auto-selecting cash method for currency:', currency);
        form.setValue('paymentMethodId', cashMethod.id);
        form.trigger('paymentMethodId');
      }
    }
  }, [currency, form, paymentMethodId]);

  // Handle payment method selection changes
  useEffect(() => {
    if (paymentMethodId) {
      const method = paymentMethods.find(pm => pm.id === paymentMethodId);
      
      if (method) {
        console.log('Payment method selected:', method.name);
        setSelectedPaymentMethod(method);
        
        // Check if we need to handle currency conversion
        if (currency !== method.currency) {
          setShouldOverridePayment(true);
          
          // Set initial payment amount
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
        console.log('No payment method found for ID:', paymentMethodId);
        setSelectedPaymentMethod(undefined);
        setShouldOverridePayment(false);
      }
    } else {
      console.log('No payment method ID provided');
      setSelectedPaymentMethod(undefined);
      setShouldOverridePayment(false);
    }
  }, [currency, paymentMethodId, form, paymentMethods, amount, isOnline]);
  
  // Calculate reward points when relevant data changes
  useEffect(() => {
    if (!selectedPaymentMethod || amount <= 0) {
      setEstimatedPoints(0);
      return;
    }
    
    const simulatePoints = async () => {
      try {
        const mccCode = selectedMCC?.code;
        console.log('Simulating points with MCC:', mccCode);
        
        const points = await simulateRewardPoints(
          amount,
          currency,
          selectedPaymentMethod,
          mccCode,
          merchantName,
          isOnline,
          isContactless
        );
        
        console.log('Estimated points:', points);
        setEstimatedPoints(points);
      } catch (error) {
        console.error('Error simulating points:', error);
        setEstimatedPoints(0);
      }
    };
    
    simulatePoints();
  }, [amount, currency, selectedPaymentMethod, selectedMCC, merchantName, isOnline, isContactless]);
  
  const handleFormSubmit = async (values: FormValues) => {
    try {
      console.log('Form submitted with values:', values);
      
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
        // Add category based on MCC code
        category: getCategoryFromMCC(selectedMCC?.code),
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
