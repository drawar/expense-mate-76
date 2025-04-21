import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Transaction } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { dataService } from '@/services/core/DataService';
import { rewardCalculatorService } from '@/services/rewards/RewardCalculatorService';
import { pointsTrackingService } from '@/services/PointsTrackingService';
import { getTransactions } from '@/utils/storageUtils'; // Import for forced refresh

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
      const usedBonusPoints = await pointsTrackingService.getUsedBonusPoints(
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
        basePoints: calculationResult.basePoints,
        bonusPoints: calculationResult.bonusPoints,
        totalPoints: calculationResult.totalPoints
      };
      
      // Save the transaction using our data service
      const { success, error } = await dataService.saveTransaction(transactionWithPoints);
      
      if (!success) {
        throw error || new Error('Failed to save transaction');
      }
      
      // Record both base and bonus points movement for transaction creation
      try {
        await pointsTrackingService.recordPointsMovementForAdd(
          transactionWithPoints.id,
          transactionWithPoints.paymentMethod.id,
          calculationResult.basePoints,
          calculationResult.bonusPoints
        );
      } catch (pointsError) {
        console.warn('Non-critical error recording points:', pointsError);
        // Continue with navigation flow even if points recording fails
      }
      
      console.log('Transaction saved successfully:', transactionWithPoints);
      
      toast({
        title: 'Success',
        description: 'Transaction saved successfully' + (useLocalStorage ? ' to local storage' : ''),
      });
      
      // Force a refresh of the transaction data before navigating
      try {
        console.log('Forcing transaction data refresh');
        await getTransactions(useLocalStorage, true); // Pass true as second param for force refresh
      } catch (refreshError) {
        console.warn('Non-critical error refreshing transactions:', refreshError);
        // Continue even if refresh fails
      }
      
      // Navigate back to the transactions list
      navigate('/transactions');
    } catch (error) {
      console.error('Error saving transaction:', error);
      
      setSaveError(
        error instanceof Error
          ? error.message
          : 'An unexpected error occurred while saving the transaction'
      );
      
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save transaction',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    handleSubmit,
    isLoading,
    saveError
  };
};
