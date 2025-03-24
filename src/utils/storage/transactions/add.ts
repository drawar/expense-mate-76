
import { Transaction, Currency } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { getCategoryFromMCC, getCategoryFromMerchantName } from '../../categoryMapping';
import { getMerchantByName, addOrUpdateMerchant } from '../merchants';
import { saveTransactionToLocalStorage } from './local-storage';
import { calculatePoints } from './calculations';
import { addBonusPointsMovement } from './bonus-points';

export const addTransaction = async (transaction: Omit<Transaction, 'id'>, forceLocalStorage = false): Promise<Transaction> => {
  console.log('Adding transaction, force local storage:', forceLocalStorage);
  
  if (!transaction.merchant || !transaction.merchant.name) {
    throw new Error('Merchant information is missing');
  }
  
  if (!transaction.paymentMethod || !transaction.paymentMethod.id) {
    throw new Error('Payment method information is missing');
  }
  
  let category = transaction.category;
  if (!category || category === 'Uncategorized') {
    if (transaction.merchant.mcc?.code) {
      category = getCategoryFromMCC(transaction.merchant.mcc.code);
    } else if (transaction.merchant.name) {
      category = getCategoryFromMerchantName(transaction.merchant.name) || 'Uncategorized';
    }
  }
  
  // Calculate points breakdown
  const pointsBreakdown = calculatePoints(transaction);
  
  if (forceLocalStorage) {
    console.log('Directly using local storage for transaction');
    try {
      const existingMerchant = await getMerchantByName(transaction.merchant.name);
      const merchant = existingMerchant || transaction.merchant;
      
      const transactionWithUpdates = {
        ...transaction,
        category,
        rewardPoints: pointsBreakdown.totalPoints,
        merchant,
        basePoints: pointsBreakdown.basePoints,
        isDeleted: false
      };
      
      const savedTransaction = await saveTransactionToLocalStorage(transactionWithUpdates, merchant);
      
      // Record bonus points movement
      if (pointsBreakdown.bonusPoints > 0) {
        await addBonusPointsMovement({
          transactionId: savedTransaction.id,
          paymentMethodId: savedTransaction.paymentMethod.id,
          bonusPoints: pointsBreakdown.bonusPoints
        });
      }
      
      return savedTransaction;
    } catch (error) {
      console.error('Error saving to local storage:', error);
      throw new Error('Failed to save transaction to local storage');
    }
  }
  
  try {
    const savedMerchant = await addOrUpdateMerchant(transaction.merchant);
    console.log('Merchant saved:', savedMerchant);
    
    const transactionData = {
      date: transaction.date,
      merchant_id: savedMerchant.id,
      amount: transaction.amount,
      currency: transaction.currency,
      payment_method_id: transaction.paymentMethod.id,
      payment_amount: transaction.paymentAmount,
      payment_currency: transaction.paymentCurrency,
      reward_points: pointsBreakdown.totalPoints,
      base_points: pointsBreakdown.basePoints,
      notes: transaction.notes,
      category: category,
      is_contactless: transaction.isContactless,
      is_deleted: false
    };
    
    console.log('Sending to Supabase:', transactionData);
    
    const { data, error } = await supabase
      .from('transactions')
      .insert(transactionData)
      .select()
      .single();
      
    if (error) {
      console.error('Error adding transaction to Supabase:', error);
      throw error;
    }
    
    console.log('Transaction saved successfully to Supabase:', data);
    
    // Record bonus points movement
    if (pointsBreakdown.bonusPoints > 0) {
      await addBonusPointsMovement({
        transactionId: data.id,
        paymentMethodId: data.payment_method_id,
        bonusPoints: pointsBreakdown.bonusPoints
      });
    }
    
    return {
      id: data.id,
      date: data.date,
      merchant: savedMerchant,
      amount: Number(data.amount),
      currency: data.currency as Currency,
      paymentMethod: transaction.paymentMethod,
      paymentAmount: Number(data.payment_amount),
      paymentCurrency: data.payment_currency as Currency,
      rewardPoints: data.reward_points,
      basePoints: data.base_points,
      notes: data.notes,
      category: data.category,
      isContactless: data.is_contactless,
    };
  } catch (error) {
    console.error('Exception in addTransaction:', error);
    throw error;
  }
};
