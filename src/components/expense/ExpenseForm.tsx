// components/expense/ExpenseForm.tsx
import React from 'react';
import { Transaction, PaymentMethod } from '@/types';
import { useExpenseForm } from '@/hooks/expense/useExpenseForm';
import { addTransaction } from '@/services/storage';
import { useToast } from '@/hooks/use-toast';

// Import form sections correctly
import MerchantDetailsForm from './form/MerchantDetailsForm';
import TransactionDetailsForm from './form/TransactionDetailsForm';
import PaymentDetailsForm from './form/PaymentDetailsForm';
import { FormProvider } from 'react-hook-form';

interface ExpenseFormProps {
  paymentMethods: PaymentMethod[];
  onSubmit: (transaction: Transaction) => void;
  defaultValues?: Partial<any>;
  useLocalStorage?: boolean;
}

/**
 * Consolidated expense form component
 */
const ExpenseForm: React.FC<ExpenseFormProps> = ({ 
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
      
      // Save the transaction
      const savedTransaction = await addTransaction(transactionData);
      
      if (savedTransaction) {
        toast({
          title: 'Success',
          description: 'Transaction saved successfully',
        });
        
        onSubmit(savedTransaction);
      } else {
        toast({
          title: 'Error',
          description: 'Failed to save transaction',
          variant: 'destructive',
        });
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
        <MerchantDetailsForm 
          onSelectMCC={setSelectedMCC} 
          selectedMCC={selectedMCC} 
        />
        
        <TransactionDetailsForm />
        
        <PaymentDetailsForm 
          paymentMethods={paymentMethods}
          selectedPaymentMethod={selectedPaymentMethod}
          shouldOverridePayment={shouldOverridePayment}
          pointsCalculation={pointsCalculation}
        />
      </form>
    </FormProvider>
  );
};

export default ExpenseForm;
