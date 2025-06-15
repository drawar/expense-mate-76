
import React from 'react';
import { FormProvider } from 'react-hook-form';
import { Transaction, PaymentMethod } from '@/types';
import { useExpenseForm } from '@/hooks/expense/useExpenseForm';
import { useToast } from '@/hooks/use-toast';

// Import section components
import { MerchantDetailsSection } from './sections/MerchantDetailsSection';
import { TransactionDetailsSection } from './sections/TransactionDetailsSection';
import { PaymentDetailsSection } from './sections/PaymentDetailsSection';

interface ExpenseFormProps {
  paymentMethods: PaymentMethod[];
  onSubmit: (transaction: Omit<Transaction, 'id'>) => void;
  defaultValues?: Partial<any>;
  useLocalStorage?: boolean;
  isSaving?: boolean;
}

export const ExpenseForm: React.FC<ExpenseFormProps> = ({ 
  paymentMethods, 
  onSubmit, 
  defaultValues,
  useLocalStorage = false,
  isSaving = false
}) => {
  const { toast } = useToast();
  const {
    form,
    selectedMCC,
    setSelectedMCC,
    selectedPaymentMethod,
    shouldOverridePayment,
    estimatedPoints: pointsCalculation,
  } = useExpenseForm({ 
    paymentMethods, 
    defaultValues
  });
  
  const handleFormSubmit = (values: any) => {
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
        toast({
          title: 'Error',
          description: 'Invalid payment method',
          variant: 'destructive',
        });
        return;
      }
      
      const merchantData = {
        id: '', // Will be assigned by storage service
        name: values.merchantName.trim(),
        address: values.merchantAddress?.trim(),
        isOnline: values.isOnline,
        mcc: selectedMCC,
      };
      
      const paymentAmount = shouldOverridePayment && values.paymentAmount
        ? Number(values.paymentAmount)
        : Number(values.amount);
      
      const reimbursementAmount = values.reimbursementAmount 
        ? Number(values.reimbursementAmount) 
        : 0;
      
      const transactionData: Omit<Transaction, 'id'> = {
        date: values.date.toISOString().split('T')[0], // YYYY-MM-DD format
        merchant: merchantData,
        amount: Number(values.amount),
        currency: values.currency,
        paymentMethod: paymentMethod,
        paymentAmount: paymentAmount,
        paymentCurrency: paymentMethod.currency,
        rewardPoints: pointsCalculation?.totalPoints || 0,
        basePoints: pointsCalculation?.basePoints || 0,
        bonusPoints: pointsCalculation?.bonusPoints || 0,
        notes: values.notes,
        isContactless: !values.isOnline && values.isContactless,
        reimbursementAmount: reimbursementAmount,
      };
      
      onSubmit(transactionData);
    } catch (error) {
      console.error('Error submitting form:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    }
  };
  
  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-8">
        <MerchantDetailsSection 
          onSelectMCC={setSelectedMCC} 
          selectedMCC={selectedMCC} 
        />
        
        <TransactionDetailsSection />
        
        <PaymentDetailsSection 
          paymentMethods={paymentMethods}
          selectedPaymentMethod={selectedPaymentMethod}
          shouldOverridePayment={shouldOverridePayment}
          pointsCalculation={pointsCalculation}
          isSubmitting={isSaving}
        />
      </form>
    </FormProvider>
  );
};
