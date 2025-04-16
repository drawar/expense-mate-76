// components/expense/form/ExpenseForm.tsx - UPDATED FILE
import React from 'react';
import { FormProvider } from 'react-hook-form';
import { Transaction, PaymentMethod } from '@/types';
import { useExpenseForm } from '@/hooks/expense/useExpenseForm';
import { useTransactionActions } from '@/hooks/expense/useTransactionActions';
import { useToast } from '@/hooks/use-toast';

// Import section components
import { MerchantDetailsSection } from './sections/MerchantDetailsSection';
import { TransactionDetailsSection } from './sections/TransactionDetailsSection';
import { PaymentDetailsSection } from './sections/PaymentDetailsSection';

interface ExpenseFormProps {
  paymentMethods: PaymentMethod[];
  onSubmit: (transaction: Transaction) => void;
  defaultValues?: Partial<any>;
  useLocalStorage?: boolean;
}

export const ExpenseForm: React.FC<ExpenseFormProps> = ({ 
  paymentMethods, 
  onSubmit, 
  defaultValues,
  useLocalStorage = false
}) => {
  const { toast } = useToast();
  const {
    form,
    selectedMCC,
    setSelectedMCC,
    selectedPaymentMethod,
    shouldOverridePayment,
    pointsCalculation,
  } = useExpenseForm({ 
    paymentMethods, 
    defaultValues
  });
  
  const {
    handleAdd,
    isLoading
  } = useTransactionActions({
    redirectPath: '/transactions', // Adjust this path based on your app's routing
    onAddSuccess: () => {
      // Alternatively, use a custom navigation logic if needed
      // history.push('/transactions'); 
      // or other navigation method your app uses
    }
  });
  
  const handleFormSubmit = async (values: any) => {
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
      
      // Get payment method
      const paymentMethod = paymentMethods.find(pm => pm.id === values.paymentMethodId);
      if (!paymentMethod) {
        toast({
          title: 'Error',
          description: 'Invalid payment method',
          variant: 'destructive',
        });
        return;
      }
      
      // Prepare merchant data
      const merchantData = {
        id: '', // Will be assigned by storage service
        name: values.merchantName.trim(),
        address: values.merchantAddress?.trim(),
        isOnline: values.isOnline,
        mcc: selectedMCC,
      };
      
      // Determine amount to use for payment
      const paymentAmount = shouldOverridePayment && values.paymentAmount
        ? Number(values.paymentAmount)
        : Number(values.amount);
      
      // Reimbursement amount
      const reimbursementAmount = values.reimbursementAmount 
        ? Number(values.reimbursementAmount) 
        : 0;
      
      // Prepare transaction data
      const transactionData: Omit<Transaction, 'id'> = {
        date: values.date.toISOString().split('T')[0], // YYYY-MM-DD format
        merchant: merchantData,
        amount: Number(values.amount),
        currency: values.currency,
        paymentMethod: paymentMethod,
        paymentAmount: paymentAmount,
        paymentCurrency: paymentMethod.currency,
        rewardPoints: pointsCalculation.totalPoints,
        basePoints: pointsCalculation.basePoints,
        bonusPoints: pointsCalculation.bonusPoints,
        notes: values.notes,
        isContactless: !values.isOnline && values.isContactless,
        reimbursementAmount: reimbursementAmount,
      };
      
      // Use onSubmit directly instead of handleAdd to maintain the parent component's workflow
      // Submit using handleAdd
      const savedTransaction = await handleAdd(transactionData);
      
      // If success callback is needed
      if (savedTransaction) {
        onSubmit(savedTransaction);
      }
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
          isSubmitting={isLoading}
        />
      </form>
    </FormProvider>
  );
};
