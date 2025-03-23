import { Transaction } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { getCategoryFromMCC } from '../categoryMapping';
import { getMerchantByName, addOrUpdateMerchant } from './merchants';
import { getPaymentMethods } from './paymentMethods';

// LocalStorage key for fallback
const TRANSACTIONS_KEY = 'expenseTracker_transactions';

// Save transactions to Supabase
export const saveTransactions = async (transactions: Transaction[]): Promise<void> => {
  // This is not very efficient, but it ensures data integrity
  // In a real-world application, you would use batch operations
  for (const transaction of transactions) {
    await addTransaction({
      date: transaction.date,
      merchant: transaction.merchant,
      amount: transaction.amount,
      currency: transaction.currency,
      paymentMethod: transaction.paymentMethod,
      paymentAmount: transaction.paymentAmount,
      paymentCurrency: transaction.paymentCurrency,
      rewardPoints: transaction.rewardPoints,
      notes: transaction.notes,
      category: transaction.category,
      isContactless: transaction.isContactless,
    });
  }
};

// Get transactions from Supabase
export const getTransactions = async (): Promise<Transaction[]> => {
  const { data, error } = await supabase
    .from('transactions')
    .select(`
      *,
      merchant:merchant_id(*),
      payment_method:payment_method_id(*)
    `);
    
  if (error) {
    console.error('Error fetching transactions:', error);
    // Fallback to localStorage
    const stored = localStorage.getItem(TRANSACTIONS_KEY);
    return stored ? JSON.parse(stored) : [];
  }
  
  // Transform payment methods
  const paymentMethods = await getPaymentMethods();
  
  // Transform data to match our Transaction type
  return data.map(tx => {
    const merchant = tx.merchant as any;
    const paymentMethod = tx.payment_method as any;
    
    // Find the matching payment method from our local cache
    const matchedPaymentMethod = paymentMethods.find(pm => pm.id === paymentMethod.id) || {
      id: paymentMethod.id,
      name: paymentMethod.name,
      type: paymentMethod.type,
      currency: paymentMethod.currency,
      rewardRules: paymentMethod.reward_rules || [],
      active: paymentMethod.active,
      lastFourDigits: paymentMethod.last_four_digits,
      issuer: paymentMethod.issuer,
      statementStartDay: paymentMethod.statement_start_day,
      isMonthlyStatement: paymentMethod.is_monthly_statement,
      icon: paymentMethod.icon,
      color: paymentMethod.color,
    };
    
    return {
      id: tx.id,
      date: tx.date,
      merchant: {
        id: merchant.id,
        name: merchant.name,
        address: merchant.address,
        mcc: merchant.mcc,
        isOnline: merchant.is_online,
      },
      amount: Number(tx.amount),
      currency: tx.currency,
      paymentMethod: matchedPaymentMethod,
      paymentAmount: Number(tx.payment_amount),
      paymentCurrency: tx.payment_currency,
      rewardPoints: tx.reward_points,
      notes: tx.notes,
      category: tx.category,
      isContactless: tx.is_contactless,
    };
  });
};

// Add a new transaction
export const addTransaction = async (transaction: Omit<Transaction, 'id'>): Promise<Transaction> => {
  // First ensure the merchant exists
  const savedMerchant = await addOrUpdateMerchant(transaction.merchant);
  
  // Then add the transaction
  const { data, error } = await supabase
    .from('transactions')
    .insert({
      date: transaction.date,
      merchant_id: savedMerchant.id,
      amount: transaction.amount,
      currency: transaction.currency,
      payment_method_id: transaction.paymentMethod.id,
      payment_amount: transaction.paymentAmount,
      payment_currency: transaction.paymentCurrency,
      reward_points: transaction.rewardPoints,
      notes: transaction.notes,
      // Add category based on MCC code or use provided category
      category: transaction.category || getCategoryFromMCC(transaction.merchant.mcc?.code),
      is_contactless: transaction.isContactless,
    })
    .select()
    .single();
    
  if (error) {
    console.error('Error adding transaction:', error);
    throw error;
  }
  
  // Return the newly created transaction
  return {
    id: data.id,
    date: data.date,
    merchant: savedMerchant,
    amount: Number(data.amount),
    currency: data.currency,
    paymentMethod: transaction.paymentMethod,
    paymentAmount: Number(data.payment_amount),
    paymentCurrency: data.payment_currency,
    rewardPoints: data.reward_points,
    notes: data.notes,
    category: data.category,
    isContactless: data.is_contactless,
  };
};

// Edit an existing transaction
export const editTransaction = async (id: string, updatedTransaction: Omit<Transaction, 'id'>): Promise<Transaction | null> => {
  // First ensure the merchant exists
  const savedMerchant = await addOrUpdateMerchant(updatedTransaction.merchant);
  
  // Then update the transaction
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
      // Add category based on MCC code or use provided category
      category: updatedTransaction.category || getCategoryFromMCC(updatedTransaction.merchant.mcc?.code),
      is_contactless: updatedTransaction.isContactless,
    })
    .eq('id', id)
    .select()
    .single();
    
  if (error) {
    console.error('Error updating transaction:', error);
    return null;
  }
  
  // Return the updated transaction
  return {
    id: data.id,
    date: data.date,
    merchant: savedMerchant,
    amount: Number(data.amount),
    currency: data.currency,
    paymentMethod: updatedTransaction.paymentMethod,
    paymentAmount: Number(data.payment_amount),
    paymentCurrency: data.payment_currency,
    rewardPoints: data.reward_points,
    notes: data.notes,
    category: data.category,
    isContactless: data.is_contactless,
  };
};

// Delete a transaction
export const deleteTransaction = async (id: string): Promise<boolean> => {
  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', id);
    
  if (error) {
    console.error('Error deleting transaction:', error);
    return false;
  }
  
  return true;
};

// Export a transactions list as CSV
export const exportTransactionsToCSV = (transactions: Transaction[]): string => {
  if (transactions.length === 0) {
    return '';
  }
  
  // CSV header
  const headers = [
    'ID',
    'Date',
    'Merchant',
    'Category',
    'Amount',
    'Currency',
    'Payment Method',
    'Payment Amount',
    'Payment Currency',
    'Reward Points',
    'Notes',
    'Contactless',
  ].join(',');
  
  // CSV rows
  const rows = transactions.map(tx => [
    tx.id,
    tx.date,
    tx.merchant.name,
    tx.category || tx.merchant.mcc?.description || 'Uncategorized',
    tx.amount,
    tx.currency,
    tx.paymentMethod.name,
    tx.paymentAmount,
    tx.paymentCurrency,
    tx.rewardPoints,
    tx.notes ? `"${tx.notes.replace(/"/g, '""')}"` : '',
    tx.isContactless ? 'Yes' : 'No',
  ].join(','));
  
  return [headers, ...rows].join('\n');
};
