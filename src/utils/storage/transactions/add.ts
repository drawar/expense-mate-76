
// src/utils/storage/transactions/add.ts
import { v4 as uuidv4 } from 'uuid';
import { Transaction } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { incrementMerchantOccurrence } from '../merchantTracking';
import { updateBonusPointsForTransaction } from './bonus-points';
import { rewardCalculatorService } from '@/services/rewards/RewardCalculatorService';

/**
 * Add a new transaction to the database
 */
export const addTransaction = async (
  transactionData: Omit<Transaction, 'id'>,
  useLocalStorage: boolean = false
): Promise<Transaction | null> => {
  try {
    // Add an ID to the transaction and creation date
    const transaction: Transaction = {
      ...transactionData,
      id: uuidv4()
    };
    
    console.log(`Adding transaction with ID ${transaction.id}`);
    
    // Calculate used bonus points - to know if we've hit cap
    const usedBonusPoints = 0; // In a real app we'd get this from our tracking service
    
    // Calculate reward points using our centralized service
    let pointsResult;
    try {
      pointsResult = await rewardCalculatorService.calculatePoints(
        transaction as Transaction, 
        usedBonusPoints
      );
    } catch (error) {
      console.error('Error calculating reward points:', error);
      pointsResult = {
        totalPoints: Math.round(transaction.amount),
        basePoints: Math.round(transaction.amount),
        bonusPoints: 0
      };
    }
    
    // Set points on the transaction
    transaction.rewardPoints = pointsResult.totalPoints;
    transaction.basePoints = pointsResult.basePoints;
    transaction.bonusPoints = pointsResult.bonusPoints;
    
    console.log('Transaction to be inserted:', transaction);
    
    if (useLocalStorage) {
      // Save to localStorage (implementation not shown)
      console.log('Saving to localStorage not implemented');
      return transaction;
    }
    
    // Insert the transaction into the database
    const { data, error } = await supabase
      .from('transactions')
      .insert({
        id: transaction.id,
        amount: transaction.amount,
        currency: transaction.currency,
        merchant_id: transaction.merchant.id,
        payment_method_id: transaction.paymentMethod.id,
        payment_amount: transaction.paymentAmount,
        payment_currency: transaction.currency,
        date: transaction.date,
        category: transaction.category,
        notes: transaction.notes,
        is_contactless: transaction.isContactless,
        reward_points: transaction.rewardPoints,
        base_points: transaction.basePoints || 0,
        bonus_points: transaction.bonusPoints || 0
      })
      .select('*')
      .single();
      
    if (error) {
      console.error('Error inserting transaction:', error);
      return null;
    }
    
    console.log('Transaction inserted successfully:', data);
    
    // Track merchant name for future auto-completion
    await incrementMerchantOccurrence(transaction.merchant.name, transaction.merchant.mcc);
    
    // Track bonus points if applicable
    if (pointsResult.bonusPoints > 0) {
      await updateBonusPointsForTransaction(
        transaction.id,
        transaction.paymentMethod.id,
        pointsResult.bonusPoints
      );
    }
    
    return transaction;
  } catch (error) {
    console.error('Exception in addTransaction:', error);
    return null;
  }
};
