
import { Transaction } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { addOrUpdateMerchant } from '../merchants';
import { getCategoryFromMCC } from '../../categoryMapping';
import { getTransactionsFromLocalStorage, saveTransactionsToLocalStorage } from './local-storage';

export const editTransaction = async (id: string, updatedTransaction: Omit<Transaction, 'id'>): Promise<Transaction | null> => {
  const existingTransactions = getTransactionsFromLocalStorage();
  const transaction = existingTransactions.find(t => t.id === id);
  
  if (transaction) {
    try {
      const updatedTransactions = existingTransactions.map(t => {
        if (t.id === id) {
          return {
            id,
            ...updatedTransaction,
          };
        }
        return t;
      });
      
      saveTransactionsToLocalStorage(updatedTransactions);
      
      const updated = updatedTransactions.find(t => t.id === id);
      return updated || null;
    } catch (error) {
      console.error('Error updating transaction in local storage:', error);
      return null;
    }
  }
  
  try {
    const savedMerchant = await addOrUpdateMerchant(updatedTransaction.merchant);
    
    // Handle reimbursement amount with safe access, default to 0
    const reimbursementAmount = updatedTransaction.reimbursementAmount ?? 0;
    console.log('Updating transaction with reimbursement amount:', reimbursementAmount);
    
    const { data, error } = await supabase
      .from('transactions')
      .update({
        date: updatedTransaction.date,
        merchant_id: savedMerchant.id,
        amount: updatedTransaction.amount,
        currency: updatedTransaction.currency,
        payment_method_id: updatedTransaction.paymentMethod.id,
        payment_amount: updatedTransaction.paymentAmount,
        payment_currency: updatedTransaction.paymentCurrency,
        reward_points: updatedTransaction.rewardPoints,
        notes: updatedTransaction.notes,
        category: updatedTransaction.category || getCategoryFromMCC(updatedTransaction.merchant.mcc?.code),
        is_contactless: updatedTransaction.isContactless,
        reimbursement_amount: reimbursementAmount,
      })
      .eq('id', id)
      .select()
      .single();
      
    if (error) {
      console.error('Error updating transaction:', error);
      return null;
    }
    
    // Construct the return object with proper types
    const returnTransaction: Transaction = {
      id: data.id,
      date: data.date,
      merchant: savedMerchant,
      amount: Number(data.amount),
      currency: data.currency as any,
      paymentMethod: updatedTransaction.paymentMethod,
      paymentAmount: Number(data.payment_amount),
      paymentCurrency: data.payment_currency as any,
      rewardPoints: data.reward_points,
      notes: data.notes,
      category: data.category,
      isContactless: data.is_contactless,
      reimbursementAmount: Number(data.reimbursement_amount) || 0,
      is_deleted: data.is_deleted || false
    };
    
    return returnTransaction;
  } catch (error) {
    console.error('Error in editTransaction:', error);
    return null;
  }
};
