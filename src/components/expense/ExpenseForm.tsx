
import { useState, useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { Transaction, Merchant, PaymentMethod, Currency, MerchantCategoryCode } from '@/types';
import { MCC_CODES, addOrUpdateMerchant, getMerchantByName } from '@/utils/storageUtils';
import { simulateRewardPoints } from '@/utils/rewardPoints';
import { useToast } from '@/hooks/use-toast';

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
  }>(0);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      merchantName: defaultValues?.merchantName || '',
      merchantAddress: defaultValues?.merchantAddress || '',
      isOnline: defaultValues?.isOnline ?? false,
      isContactless: defaultValues?.isContactless ?? false,
      amount: defaultValues?.amount || '',
      currency: defaultValues?.currency || 'USD',
      paymentMethodId: defaultValues?.paymentMethodId || (paymentMethods[0]?.id || ''),
      paymentAmount: defaultValues?.paymentAmount || '',
      date: defaultValues?.date || new Date(),
      notes: defaultValues?.notes || '',
    },
  });
  
  // When merchant name changes, check for existing merchant data
  const merchantName = form.watch('merchantName');
  useEffect(() => {
    if (merchantName.trim().length >= 3) {
      const existingMerchant = getMerchantByName(merchantName);
      if (existingMerchant?.mcc) {
        setSelectedMCC(existingMerchant.mcc);
        form.setValue('mcc', existingMerchant.mcc);
      }
    }
  }, [merchantName, form]);
  
  // When currency or payment method changes, check if we need to override payment amount
  const currency = form.watch('currency') as Currency;
  const paymentMethodId = form.watch('paymentMethodId');
  const amount = Number(form.watch('amount')) || 0;
  const isOnline = form.watch('isOnline');
  const isContactless = form.watch('isContactless');
  
  useEffect(() => {
    const method = paymentMethods.find(pm => pm.id === paymentMethodId);
    setSelectedPaymentMethod(method);
    
    if (method && currency !== method.currency) {
      setShouldOverridePayment(true);
    } else {
      setShouldOverridePayment(false);
      form.setValue('paymentAmount', form.watch('amount'));
    }
    
    // Set contactless to true by default for credit cards when not online
    if (!isOnline && method?.type === 'credit_card') {
      form.setValue('isContactless', true);
    }
  }, [currency, paymentMethodId, form, paymentMethods, amount, isOnline]);
  
  // Calculate estimated reward points
  useEffect(() => {
    if (!selectedPaymentMethod || amount <= 0) {
      setEstimatedPoints(0);
      return;
    }
    
    const points = simulateRewardPoints(
      amount,
      currency,
      selectedPaymentMethod,
      selectedMCC?.code,
      merchantName,
      isOnline,
      isContactless
    );
    
    setEstimatedPoints(points);
  }, [amount, currency, selectedPaymentMethod, selectedMCC, merchantName, isOnline, isContactless]);
  
  const handleFormSubmit = (values: FormValues) => {
    try {
      // Create or update merchant
      const merchant: Merchant = {
        id: '', // Will be set by addOrUpdateMerchant
        name: values.merchantName,
        address: values.merchantAddress,
        isOnline: values.isOnline,
        mcc: selectedMCC,
      };
      
      const savedMerchant = addOrUpdateMerchant(merchant);
      
      // Get selected payment method
      const paymentMethod = paymentMethods.find(pm => pm.id === values.paymentMethodId);
      if (!paymentMethod) {
        throw new Error('Payment method not found');
      }
      
      // Prepare transaction
      const transaction: Omit<Transaction, 'id'> = {
        date: format(values.date, 'yyyy-MM-dd'),
        merchant: savedMerchant,
        amount: Number(values.amount),
        currency: values.currency as Currency,
        paymentMethod,
        paymentAmount: shouldOverridePayment && values.paymentAmount 
          ? Number(values.paymentAmount) 
          : Number(values.amount),
        paymentCurrency: paymentMethod.currency,
        rewardPoints: typeof estimatedPoints === 'object' 
          ? estimatedPoints.totalPoints 
          : estimatedPoints,
        notes: values.notes,
        isContactless: !values.isOnline ? values.isContactless : false,
      };
      
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
