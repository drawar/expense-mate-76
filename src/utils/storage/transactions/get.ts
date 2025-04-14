
import { Transaction } from '@/types';
import { storageService } from '@/services/storage';
import { supabase } from '@/integrations/supabase/client';

export async function getTransactions(useLocalStorage?: boolean): Promise<Transaction[]> {
  // If useLocalStorage parameter is provided, use it. Otherwise use the global setting
  const shouldUseLocalStorage = useLocalStorage !== undefined 
    ? useLocalStorage 
    : storageService.isLocalStorageMode();
  
  console.log(`Getting transactions with localStorage mode: ${shouldUseLocalStorage}`);
  
  if (shouldUseLocalStorage) {
    // Get transactions from local storage
    const storedTransactions = localStorage.getItem('transactions');
    if (storedTransactions) {
      return JSON.parse(storedTransactions) as Transaction[];
    }
    return [];
  } else {
    try {
      // Get transactions from Supabase
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          id,
          date,
          amount,
          currency,
          payment_amount,
          payment_currency,
          reward_points,
          base_points,
          bonus_points,
          is_contactless,
          is_deleted,
          notes,
          reimbursement_amount,
          category,
          merchant_id,
          payment_method_id
        `)
        .eq('is_deleted', false);

      if (error) {
        console.error('Error fetching transactions:', error);
        return [];
      }

      // Now fetch payment methods and merchants to enrich transaction data
      const { data: paymentMethods } = await supabase.from('payment_methods').select('*');
      const { data: merchants } = await supabase.from('merchants').select('*');

      // Map data to Transaction type
      const transactions: Transaction[] = data.map(item => {
        const paymentMethod = paymentMethods?.find(pm => pm.id === item.payment_method_id) || {
          id: item.payment_method_id,
          name: 'Unknown',
          type: 'credit_card',
          currency: item.payment_currency || 'SGD'
        };

        const merchant = merchants?.find(m => m.id === item.merchant_id) || {
          id: item.merchant_id,
          name: 'Unknown Merchant'
        };

        return {
          id: item.id,
          date: item.date,
          merchant: merchant,
          amount: Number(item.amount),
          currency: item.currency,
          paymentMethod: paymentMethod,
          paymentAmount: Number(item.payment_amount || item.amount),
          paymentCurrency: item.payment_currency || item.currency,
          rewardPoints: item.reward_points || 0,
          basePoints: item.base_points || 0,
          bonusPoints: item.bonus_points || 0,
          isContactless: item.is_contactless || false,
          notes: item.notes || '',
          reimbursementAmount: item.reimbursement_amount ? Number(item.reimbursement_amount) : 0,
          category: item.category
        };
      });

      console.log(`Retrieved ${transactions.length} transactions from Supabase`);
      return transactions;
    } catch (error) {
      console.error('Error getting transactions:', error);
      return [];
    }
  }
}
