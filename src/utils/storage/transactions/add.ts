
import { Transaction, Currency } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { getCategoryFromMCC, getCategoryFromMerchantName } from '../../categoryMapping';
import { getMerchantByName, addOrUpdateMerchant } from '../merchants';
import { saveTransactionToLocalStorage } from './local-storage';
import { calculatePoints } from './calculations';
import { addBonusPointsMovement } from './bonus-points';

export const addTransaction = async (transaction: Omit<Transaction, 'id'>, forceLocalStorage = false): Promise<Transaction> => {
  console.log('Adding transaction, force local storage:', forceLocalStorage);
  console.log('Transaction data received:', JSON.stringify(transaction, null, 2));
  
  if (!transaction.merchant || !transaction.merchant.name) {
    console.error('Validation Error: Merchant information is missing');
    throw new Error('Merchant information is missing');
  }
  
  if (!transaction.paymentMethod || !transaction.paymentMethod.id) {
    console.error('Validation Error: Payment method information is missing');
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
  console.log('Points breakdown calculated:', pointsBreakdown);
  
  if (forceLocalStorage) {
    console.log('Directly using local storage for transaction');
    try {
      const existingMerchant = await getMerchantByName(transaction.merchant.name);
      console.log('Existing merchant found:', existingMerchant || 'None');
      const merchant = existingMerchant || transaction.merchant;
      
      const transactionWithUpdates = {
        ...transaction,
        category,
        rewardPoints: pointsBreakdown.totalPoints,
        merchant,
        basePoints: pointsBreakdown.basePoints,
        isDeleted: false
      };
      
      console.log('Saving transaction to local storage with data:', JSON.stringify(transactionWithUpdates, null, 2));
      const savedTransaction = await saveTransactionToLocalStorage(transactionWithUpdates, merchant);
      console.log('Transaction saved to local storage with ID:', savedTransaction.id);
      
      // Record bonus points movement
      if (pointsBreakdown.bonusPoints > 0) {
        console.log('Recording bonus points movement for local storage transaction:', pointsBreakdown.bonusPoints);
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
    // Try Supabase first
    console.log('Attempting to save merchant to Supabase...');
    const savedMerchant = await addOrUpdateMerchant(transaction.merchant);
    console.log('Merchant saved to Supabase:', savedMerchant);
    
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
    
    console.log('Sending transaction data to Supabase:', JSON.stringify(transactionData, null, 2));
    console.log('Transaction data types:', {
      date: typeof transaction.date,
      merchant_id: typeof savedMerchant.id,
      amount: typeof transaction.amount,
      currency: typeof transaction.currency,
      payment_method_id: typeof transaction.paymentMethod.id,
      payment_amount: typeof transaction.paymentAmount,
      payment_currency: typeof transaction.paymentCurrency,
      reward_points: typeof pointsBreakdown.totalPoints,
      base_points: typeof pointsBreakdown.basePoints
    });
    
    // Try inserting with maybeSingle instead of single to avoid errors
    const { data, error } = await supabase
      .from('transactions')
      .insert(transactionData)
      .select();
      
    if (error) {
      console.error('Error adding transaction to Supabase:', error);
      console.error('Error details:', error.message, error.details, error.hint);
      
      // If there's a Supabase error and we're not already using local storage,
      // fall back to local storage
      if (!forceLocalStorage) {
        console.log('Supabase error detected, falling back to local storage...');
        return addTransaction(transaction, true);
      }
      
      throw error;
    }
    
    if (!data || data.length === 0) {
      console.error('No data returned from Supabase insert');
      
      if (!forceLocalStorage) {
        console.log('No data returned, falling back to local storage...');
        return addTransaction(transaction, true);
      }
      
      throw new Error('No data returned from Supabase insert');
    }
    
    console.log('Transaction saved successfully to Supabase:', data[0]);
    
    // Record bonus points movement
    if (pointsBreakdown.bonusPoints > 0) {
      console.log('Recording bonus points movement:', pointsBreakdown.bonusPoints);
      
      try {
        const bonusPointsResult = await addBonusPointsMovement({
          transactionId: data[0].id,
          paymentMethodId: data[0].payment_method_id,
          bonusPoints: pointsBreakdown.bonusPoints
        });
        
        console.log('Bonus points movement recorded:', bonusPointsResult);
      } catch (bonusError) {
        console.error('Error recording bonus points movement:', bonusError);
        // Continue even if bonus points recording fails
      }
    }
    
    return {
      id: data[0].id,
      date: data[0].date,
      merchant: savedMerchant,
      amount: Number(data[0].amount),
      currency: data[0].currency as Currency,
      paymentMethod: transaction.paymentMethod,
      paymentAmount: Number(data[0].payment_amount),
      paymentCurrency: data[0].payment_currency as Currency,
      rewardPoints: data[0].reward_points,
      basePoints: data[0].base_points,
      notes: data[0].notes,
      category: data[0].category,
      isContactless: data[0].is_contactless,
    };
  } catch (error) {
    console.error('Exception in addTransaction:', error);
    
    // If there's an error and we're not already using local storage,
    // fall back to local storage as a last resort
    if (!forceLocalStorage) {
      console.log('Exception detected, falling back to local storage as last resort...');
      return addTransaction(transaction, true);
    }
    
    throw error;
  }
};
