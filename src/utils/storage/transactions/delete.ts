
import { supabase } from '@/integrations/supabase/client';
import { getTransactionsFromLocalStorage, saveTransactionsToLocalStorage } from './local-storage';

export const deleteTransaction = async (id: string): Promise<boolean> => {
  let deletedTransactionMerchant = null;
  
  const existingTransactions = getTransactionsFromLocalStorage();
  const transaction = existingTransactions.find(t => t.id === id);
  
  if (transaction) {
    deletedTransactionMerchant = transaction.merchant;
  } else {
    try {
      const { data } = await supabase
        .from('transactions')
        .select(`
          *,
          merchant:merchant_id(*)
        `)
        .eq('id', id)
        .maybeSingle();
        
      if (data) {
        deletedTransactionMerchant = data.merchant;
      }
    } catch (error) {
      console.error('Error getting transaction before delete:', error);
    }
  }
  
  if (transaction) {
    try {
      const updatedTransactions = existingTransactions.filter(t => t.id !== id);
      saveTransactionsToLocalStorage(updatedTransactions);
      
      if (deletedTransactionMerchant && deletedTransactionMerchant.mcc) {
        try {
          const { decrementMerchantOccurrence } = await import('../merchantTracking');
          await decrementMerchantOccurrence(deletedTransactionMerchant.name);
        } catch (error) {
          console.error('Error updating merchant mapping after delete:', error);
        }
      }
      
      return true;
    } catch (error) {
      console.error('Error deleting transaction from local storage:', error);
      return false;
    }
  }
  
  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', id);
    
  if (error) {
    console.error('Error deleting transaction:', error);
    return false;
  }
  
  if (deletedTransactionMerchant && deletedTransactionMerchant.mcc) {
    try {
      const { decrementMerchantOccurrence } = await import('../merchantTracking');
      await decrementMerchantOccurrence(deletedTransactionMerchant.name);
    } catch (error) {
      console.error('Error updating merchant mapping after delete:', error);
    }
  }
  
  return true;
};
