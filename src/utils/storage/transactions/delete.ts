
import { supabase } from '@/integrations/supabase/client';
import { addBonusPointsMovement } from './bonus-points';

export const deleteTransaction = async (id: string): Promise<boolean> => {
  try {
    // Get transaction details before deletion
    const { data: transaction } = await supabase
      .from('transactions')
      .select(`
        *,
        merchant:merchant_id(*)
      `)
      .eq('id', id)
      .single();
      
    if (!transaction) {
      console.error('Transaction not found');
      return false;
    }
    
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
      return false;
    }
    
    // Record negative bonus points movement
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
    
    return true;
  } catch (error) {
    console.error('Error in deleteTransaction:', error);
    return false;
  }
};
