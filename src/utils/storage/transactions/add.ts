
// src/utils/storage/transactions/add.ts
import { v4 as uuidv4 } from 'uuid';
import { Transaction } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { saveTransactionToLocalStorage } from './local-storage';
import { saveLocalTransaction } from '@/services/LocalDatabaseService';
import { getTransactions } from './get';
import { addOrUpdateMerchant } from '../merchants';
import { incrementMerchantOccurrence } from '../merchantTracking';
import { rewardCalculationService } from '@/services/RewardCalculationService';
import { bonusPointsTrackingService } from '@/services/BonusPointsTrackingService';

export const addTransaction = async (
  transaction: Omit<Transaction, 'id'>, 
  forceLocalStorage: boolean = false
): Promise<Transaction | null> => {
  try {
    // Validate transaction data
    if (!transaction.merchant || !transaction.paymentMethod) {
      console.error('Invalid transaction data: missing merchant or payment method');
      return null;
    }
    
    // Get used bonus points for this month for the payment method
    const paymentMethod = transaction.paymentMethod;
    const usedBonusPoints = await bonusPointsTrackingService.getUsedBonusPoints(
      paymentMethod.id
    );
    
    // Calculate reward points using our centralized service
    const pointsBreakdown = rewardCalculationService.calculatePoints(
      transaction as Transaction, 
      usedBonusPoints
    );
    
    console.log('Points breakdown calculated:', JSON.stringify(pointsBreakdown, null, 2));
    
    // Prepare complete transaction data with points
    const completeTransaction: Transaction = {
      id: uuidv4(),
      ...transaction,
      rewardPoints: pointsBreakdown.totalPoints
    };
    
    console.log('Using local storage flag:', forceLocalStorage);
    
    const isOffline = !navigator.onLine;
    
    // First, save to the local IndexedDB for immediate access
    const savedLocally = await saveLocalTransaction(completeTransaction);
    
    if (!savedLocally) {
      console.error('Failed to save transaction to local database');
    }
    
    // If we're online and not forced to use local storage, also send to Supabase
    if (!isOffline && !forceLocalStorage) {
      try {
        // First save or update the merchant
        if (transaction.merchant) {
          await addOrUpdateMerchant(transaction.merchant);
        }
        
        // Then save the transaction to Supabase
        const { data, error } = await supabase
          .from('transactions')
          .insert({
            id: completeTransaction.id,
            amount: completeTransaction.amount,
            currency: completeTransaction.currency,
            category: completeTransaction.category || '',
            date: completeTransaction.date,
            merchant_id: completeTransaction.merchant?.id,
            payment_method_id: completeTransaction.paymentMethod?.id,
            is_contactless: completeTransaction.isContactless || false,
            payment_amount: completeTransaction.paymentAmount,
            payment_currency: completeTransaction.paymentCurrency,
            notes: completeTransaction.notes || '',
            reward_points: completeTransaction.rewardPoints,
            base_points: pointsBreakdown.basePoints,
            bonus_points: pointsBreakdown.bonusPoints
          })
          .select()
          .single();
        
        if (error) {
          console.error('Error saving transaction to Supabase:', error);
          // Continue with local data only - the sync process will handle this later
        } else {
          console.log('Transaction saved to Supabase with ID:', data.id);
          
          // Record bonus points movement if any
          if (pointsBreakdown.bonusPoints > 0) {
            await bonusPointsTrackingService.recordBonusPointsMovement(
              completeTransaction.id,
              completeTransaction.paymentMethod.id,
              pointsBreakdown.bonusPoints
            );
          }
          
          // Update merchant category mapping for improved suggestions
          if (transaction.merchant && transaction.merchant.mcc) {
            await incrementMerchantOccurrence(transaction.merchant.name, transaction.merchant.mcc);
            console.log('Updated merchant category mapping for', transaction.merchant.name);
          }
        }
      } catch (err) {
        console.error('Failed to save to Supabase, will rely on sync process later:', err);
        // The scheduled sync will handle this error case
      }
    } else {
      // Save to localStorage as additional fallback
      const transactions = await getTransactions(true); // Force local storage
      const localId = completeTransaction.id || (transactions.length + 1).toString();
      
      const localTransaction: Transaction = {
        ...completeTransaction,
        id: localId
      };
      
      const saved = await saveTransactionToLocalStorage(localTransaction);
      if (!saved) {
        console.error('Failed to save transaction to localStorage');
        // Still return the transaction as it was saved to IndexedDB
      }
      
      console.log('Transaction saved to local storage with data:', JSON.stringify(localTransaction, null, 2));
    }
    
    return completeTransaction;
  } catch (error) {
    console.error('Error in addTransaction:', error);
    return null;
  }
};
