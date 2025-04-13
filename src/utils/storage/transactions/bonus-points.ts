
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';

/**
 * Gets all bonus points movements for a transaction
 */
export async function getBonusPointsMovements(transactionId: string) {
  try {
    // Query from bonus_points_movements table
    const { data, error } = await supabase
      .from('bonus_points_movements')
      .select('*')
      .eq('transaction_id', transactionId);
      
    if (error) {
      console.error('Error fetching bonus points movements:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Error fetching bonus points movements:', error);
    return [];
  }
}

/**
 * Adds a bonus points movement for a transaction
 */
export async function addBonusPointsMovement(
  transactionId: string,
  paymentMethodId: string,
  bonusPoints: number
) {
  try {
    if (!transactionId || !bonusPoints) {
      console.error('Invalid parameters for addBonusPointsMovement');
      return false;
    }
    
    // Check if transaction exists
    const { data: transaction, error: txError } = await supabase
      .from('transactions')
      .select('id')
      .eq('id', transactionId)
      .single();
      
    if (txError || !transaction) {
      console.error('Transaction not found:', txError);
      return false;
    }
    
    // Create bonus points movement
    const { error } = await supabase
      .from('bonus_points_movements')
      .insert({
        id: uuidv4(),
        transaction_id: transactionId,
        payment_method_id: paymentMethodId,
        bonus_points: bonusPoints,
        created_at: new Date().toISOString()
      });
      
    if (error) {
      console.error('Error adding bonus points movement:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error adding bonus points movement:', error);
    return false;
  }
}

/**
 * Deletes bonus points movements for a transaction
 */
export async function deleteBonusPointsMovements(transactionId: string) {
  try {
    const { error } = await supabase
      .from('bonus_points_movements')
      .delete()
      .eq('transaction_id', transactionId);
      
    if (error) {
      console.error('Error deleting bonus points movements:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error deleting bonus points movements:', error);
    return false;
  }
}

/**
 * Updates the storage/export utility to include the function
 */
export async function updateBonusPointsForTransaction(
  transactionId: string, 
  paymentMethodId: string,
  bonusPoints: number
) {
  // Delete existing bonus points movements for this transaction
  await deleteBonusPointsMovements(transactionId);
  
  // Add new bonus points movement
  if (bonusPoints > 0) {
    return await addBonusPointsMovement(transactionId, paymentMethodId, bonusPoints);
  }
  
  return true;
}
