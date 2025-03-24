
import { supabase } from '@/integrations/supabase/client';
import { addBonusPointsMovement } from './bonus-points';
import { getTransactionsFromLocalStorage, saveTransactionsToLocalStorage } from './local-storage';

export const deleteTransaction = async (id: string): Promise<boolean> => {
  try {
    // First, check if we need to handle local storage
    const localStorageTransactions = await getTransactionsFromLocalStorage();
    const isInLocalStorage = localStorageTransactions.some(t => t.id === id);
    
    // Check if transaction exists in Supabase
    const { data: transaction, error: fetchError } = await supabase
      .from('transactions')
      .select(`
        *,
        merchant:merchant_id(*)
      `)
      .eq('id', id)
      .single();
      
    if (fetchError) {
      console.log('Transaction not found in Supabase, checking local storage');
      
      // If it's in local storage, handle locally
      if (isInLocalStorage) {
        console.log('Deleting transaction from local storage');
        const updatedTransactions = localStorageTransactions.filter(t => t.id !== id);
        await saveTransactionsToLocalStorage(updatedTransactions);
        return true;
      }
      
      console.error('Transaction not found in Supabase or local storage');
      return false;
    }
    
    // If we reached here, transaction exists in Supabase
    // Soft delete the transaction
    const { error: updateError } = await supabase
      .from('transactions')
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString()
      })
      .eq('id', id);
      
    if (updateError) {
      console.error('Error soft deleting transaction:', updateError);
      
      // If it's in local storage as fallback, handle locally
      if (isInLocalStorage) {
        console.log('Falling back to local storage deletion');
        const updatedTransactions = localStorageTransactions.filter(t => t.id !== id);
        await saveTransactionsToLocalStorage(updatedTransactions);
        return true;
      }
      
      return false;
    }
    
    // Record negative bonus points movement if needed
    if (transaction.reward_points > transaction.base_points) {
      const bonusPoints = transaction.reward_points - transaction.base_points;
      await addBonusPointsMovement({
        transactionId: transaction.id,
        paymentMethodId: transaction.payment_method_id,
        bonusPoints: -bonusPoints // Negative to offset the original bonus points
      });
    }
    
    // Update merchant occurrence count
    if (transaction.merchant) {
      try {
        const { decrementMerchantOccurrence } = await import('../merchantTracking');
        await decrementMerchantOccurrence(transaction.merchant.name);
      } catch (error) {
        console.error('Error updating merchant mapping after delete:', error);
      }
    }
    
    // Also remove from local storage if it exists there
    if (isInLocalStorage) {
      const updatedTransactions = localStorageTransactions.filter(t => t.id !== id);
      await saveTransactionsToLocalStorage(updatedTransactions);
    }
    
    return true;
  } catch (error) {
    console.error('Error in deleteTransaction:', error);
    return false;
  }
};
