import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Transaction } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { dataService } from '@/services/core/DataService';
import { rewardCalculatorService } from '@/services/rewards/RewardCalculatorService';
import { bonusPointsTrackingService } from '@/services/BonusPointsTrackingService';

export const useTransactionSubmit = (useLocalStorage: boolean) => {
  const [isLoading, setIsLoading] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (transactionData: Omit<Transaction, 'id'>) => {
    try {
      console.log('Starting transaction save process...');
      console.log('Initial transaction data:', JSON.stringify(transactionData, null, 2));
      console.log('Using local storage flag:', useLocalStorage);
      
      setSaveError(null);
      setIsLoading(true);
      
      // Validate merchant information
      if (!transactionData.merchant || !transactionData.merchant.name) {
        console.error('Merchant validation failed:', transactionData.merchant);
        throw new Error('Merchant information is missing');
      }
      
      // Validate payment method
      if (!transactionData.paymentMethod || !transactionData.paymentMethod.id) {
        console.error('Payment method validation failed:', transactionData.paymentMethod);
        throw new Error('Payment method is missing or invalid');
      }
      
      // Validate payment amount
      if (isNaN(transactionData.paymentAmount) || transactionData.paymentAmount <= 0) {
        console.error('Payment amount validation failed:', transactionData.paymentAmount);
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
      
      // First, calculate reward points for the transaction
      // Get used bonus points for this payment method in the current month
      const date = new Date(transactionData.date);
      const usedBonusPoints = await bonusPointsTrackingService.getUsedBonusPoints(
        transactionData.paymentMethod.id,
        date.getFullYear(),
        date.getMonth()
      );
      
      // Calculate points using our reward calculator service
      const calculationResult = await rewardCalculatorService.calculatePoints(
        transactionData as Transaction,
        usedBonusPoints
      );
      
      // Update transaction with points information
      const transactionWithPoints: Transaction = {
        ...transactionData as Transaction,
        bonusPoints: calculationResult.bonusPoints,
        totalPoints: calculationResult.totalPoints
      };
      
      // Save the transaction using our data service
      const { success, error } = await dataService.saveTransaction(transactionWithPoints);
      
      if (!success) {
        throw error || new Error('Failed to save transaction');
      }
      
      // Record bonus points movement
      if (calculationResult.bonusPoints > 0) {
        await bonusPointsTrackingService.recordBonusPointsMovement(
          transactionWithPoints.id,
          transactionWithPoints.paymentMethod.id,
          calculationResult.bonusPoints
        );
      }
      
      console.log('Transaction saved successfully:', transactionWithPoints);
      
      toast({
        title: 'Success',
        description: 'Transaction saved successfully' + (useLocalStorage ? ' to local storage' : ''),
      });
      
      // Navigate back to the dashboard to see updated metrics
      navigate('/');
      return transactionWithPoints;
    } catch (error) {
      console.error('Error saving transaction:', error);
      
      let errorMessage = 'Failed to save transaction';
      
      // Detailed error information for debugging
      if (error instanceof Error) {
        errorMessage = error.message;
        console.error('Error instance details:', {
          message: error.message,
          stack: error.stack
        });
        
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
      
      // Don't navigate when there's an error, let user fix and try again
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return { handleSubmit, isLoading, saveError };
};
