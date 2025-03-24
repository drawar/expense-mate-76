
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Transaction } from '@/types';
import { addTransaction } from '@/utils/storageUtils';
import { useToast } from '@/hooks/use-toast';

export const useTransactionSubmit = (useLocalStorage: boolean) => {
  const [isLoading, setIsLoading] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (transactionData: Omit<Transaction, 'id'>) => {
    try {
      console.log('Starting transaction save process...');
      setSaveError(null);
      setIsLoading(true);
      
      console.log('Transaction data before validation:', transactionData);
      
      // Validate merchant information
      if (!transactionData.merchant || !transactionData.merchant.name) {
        throw new Error('Merchant information is missing');
      }
      
      // Validate payment method
      if (!transactionData.paymentMethod || !transactionData.paymentMethod.id) {
        console.error('Payment method validation failed:', transactionData.paymentMethod);
        throw new Error('Payment method is missing or invalid');
      }
      
      // Validate payment amount
      if (isNaN(transactionData.paymentAmount) || transactionData.paymentAmount <= 0) {
        throw new Error('Invalid payment amount');
      }
      
      console.log('Validated transaction data:', {
        merchant: transactionData.merchant.name,
        merchantId: transactionData.merchant.id,
        amount: transactionData.amount,
        currency: transactionData.currency,
        paymentMethod: transactionData.paymentMethod.name,
        paymentMethodId: transactionData.paymentMethod.id,
        date: transactionData.date
      });
      
      // Save the transaction
      const result = await addTransaction(transactionData, useLocalStorage);
      
      console.log('Transaction saved successfully:', result);
      
      toast({
        title: 'Success',
        description: 'Transaction saved successfully to ' + (useLocalStorage ? 'local storage' : 'Supabase'),
      });
      
      // Navigate back to the dashboard
      navigate('/transactions');
    } catch (error) {
      console.error('Error saving transaction:', error);
      
      let errorMessage = 'Failed to save transaction';
      
      // Detailed error information for debugging
      if (error instanceof Error) {
        errorMessage = error.message;
        
        // Check for specific errors
        if (error.message.includes('duplicate key') || error.message.includes('constraint')) {
          errorMessage = 'A merchant with this name already exists';
        } else if (error.message.includes('network')) {
          errorMessage = 'Network error - please check your connection';
        }
      }
      
      setSaveError(errorMessage);
      
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return { handleSubmit, isLoading, saveError };
};
