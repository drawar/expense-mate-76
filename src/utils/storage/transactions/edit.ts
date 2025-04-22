import { Transaction } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { addOrUpdateMerchant } from '../merchants';
import { getCategoryFromMCC } from '../../categoryMapping';
import { getTransactionsFromLocalStorage, saveTransactionsToLocalStorage } from './local-storage';
import { pointsTrackingService } from '@/services/PointsTrackingService';
import { rewardCalculatorService } from '@/services/rewards/RewardCalculatorService';

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
    // First get the original transaction to compare points
    const { data: originalTransaction, error: fetchError } = await supabase
      .from('transactions')
      .select('*, merchant:merchants(*)')
      .eq('id', id)
      .single();
      
    if (fetchError) {
      console.error('Error fetching original transaction:', fetchError);
      return null;
    }

    const previousBasePoints = originalTransaction.base_points || 0;
    const previousBonusPoints = originalTransaction.bonus_points || 0;
    
    // Save the updated merchant
    const savedMerchant = await addOrUpdateMerchant(updatedTransaction.merchant);
    
    // Recalculate reward points for the updated transaction
    // Get used bonus points for this payment method in the current month
    const date = new Date(updatedTransaction.date);
    const usedBonusPoints = await pointsTrackingService.getUsedBonusPoints(
      updatedTransaction.paymentMethod.id,
      date.getFullYear(),
      date.getMonth()
    );
    
    // Calculate points using our reward calculator service
    const calculationResult = await rewardCalculatorService.calculatePoints(
      updatedTransaction as Transaction,
      usedBonusPoints
    );
    
    // Log the reimbursement amount to debug
    console.log('Updating transaction with reimbursement amount:', updatedTransaction.reimbursementAmount);
    console.log('Points calculation result:', calculationResult);
    
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
        total_points: calculationResult.totalPoints, // Changed from reward_points to total_points
        base_points: calculationResult.basePoints,
        bonus_points: calculationResult.bonusPoints,
        notes: updatedTransaction.notes,
        category: updatedTransaction.category || getCategoryFromMCC(updatedTransaction.merchant.mcc?.code),
        is_contactless: updatedTransaction.isContactless,
        reimbursement_amount: updatedTransaction.reimbursementAmount || 0,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
      
    if (error) {
      console.error('Error updating transaction:', error);
      return null;
    }

    // Record both base and bonus points movement with the proper triggering action
    // Only do this if points values have changed
    if (previousBasePoints !== calculationResult.basePoints || 
        previousBonusPoints !== calculationResult.bonusPoints) {
      try {
        await pointsTrackingService.recordPointsMovementForEdit(
          id,
          updatedTransaction.paymentMethod.id,
          previousBasePoints,
          calculationResult.basePoints,
          previousBonusPoints,
          calculationResult.bonusPoints
        );
      } catch (pointsError) {
        console.warn('Non-critical error recording points for edit:', pointsError);
        // Continue despite error in points recording
      }
    }
    
    return {
      id: data.id,
      date: data.date,
      merchant: savedMerchant,
      amount: Number(data.amount),
      currency: data.currency as any,
      paymentMethod: updatedTransaction.paymentMethod,
      paymentAmount: Number(data.payment_amount),
      paymentCurrency: data.payment_currency as any,
      totalPoints: data.total_points, // Changed from rewardPoints: data.reward_points
      basePoints: data.base_points,
      bonusPoints: data.bonus_points,
      notes: data.notes,
      category: data.category,
      isContactless: data.is_contactless,
      reimbursementAmount: Number(data.reimbursement_amount) || 0,
    };
  } catch (error) {
    console.error('Error in editTransaction:', error);
    return null;
  }
};
