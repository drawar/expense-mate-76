
import { Transaction, Currency } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { getCategoryFromMCC, getCategoryFromMerchantName } from '../../categoryMapping';
import { getMerchantByName, addOrUpdateMerchant } from '../merchants';
import { saveTransactionToLocalStorage } from './local-storage';
import { calculatePoints } from './calculations';

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
  
  let rewardPoints = transaction.rewardPoints;
  if (!rewardPoints || rewardPoints <= 0) {
    const transactionWithCategory = {
      ...transaction,
      category,
    };
    rewardPoints = calculatePoints(transactionWithCategory);
  }
  
  if (forceLocalStorage) {
    console.log('Directly using local storage for transaction');
    try {
      const existingMerchant = await getMerchantByName(transaction.merchant.name);
      const merchant = existingMerchant || transaction.merchant;
      
      const transactionWithUpdates = {
        ...transaction,
        category,
        rewardPoints,
        merchant
      };
      
      if (merchant.mcc) {
        try {
          const { incrementMerchantOccurrence } = await import('../merchantTracking');
          await incrementMerchantOccurrence(merchant.name, merchant.mcc);
        } catch (error) {
          console.error('Error updating merchant mapping:', error);
        }
      }
      
      return saveTransactionToLocalStorage(transactionWithUpdates, merchant);
    } catch (error) {
      console.error('Error saving to local storage:', error);
      throw new Error('Failed to save transaction to local storage');
    }
  }
  
  try {
    const savedMerchant = await addOrUpdateMerchant(transaction.merchant);
    console.log('Merchant saved:', savedMerchant);
    
    if (savedMerchant.mcc) {
      try {
        const { incrementMerchantOccurrence } = await import('../merchantTracking');
        await incrementMerchantOccurrence(savedMerchant.name, savedMerchant.mcc);
      } catch (error) {
        console.error('Error updating merchant mapping:', error);
      }
    }
    
    const transactionData = {
      date: transaction.date,
      merchant_id: savedMerchant.id,
      amount: transaction.amount,
      currency: transaction.currency,
      payment_method_id: transaction.paymentMethod.id,
      payment_amount: transaction.paymentAmount,
      payment_currency: transaction.paymentCurrency,
      reward_points: rewardPoints,
      notes: transaction.notes,
      category: category,
      is_contactless: transaction.isContactless,
    };
    
    console.log('Sending to Supabase:', transactionData);
    
    const { data, error } = await supabase
      .from('transactions')
      .insert(transactionData)
      .select()
      .single();
      
    if (error) {
      console.error('Error adding transaction to Supabase, using local storage fallback:', error);
      
      const transactionWithUpdates = {
        ...transaction,
        category,
        rewardPoints,
        merchant: savedMerchant
      };
      
      return saveTransactionToLocalStorage(transactionWithUpdates, savedMerchant);
    }
    
    console.log('Transaction saved successfully to Supabase:', data);
    
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
      notes: data.notes,
      category: data.category,
      isContactless: data.is_contactless,
    };
  } catch (error) {
    console.error('Exception in addTransaction, using local storage fallback:', error);
    
    try {
      const existingMerchant = await getMerchantByName(transaction.merchant.name);
      
      const transactionWithUpdates = {
        ...transaction,
        category,
        rewardPoints,
        merchant: existingMerchant || transaction.merchant
      };
      
      return saveTransactionToLocalStorage(transactionWithUpdates, existingMerchant);
    } catch (innerError) {
      console.error('Error in local storage fallback:', innerError);
      throw new Error('Failed to save transaction');
    }
  }
};
