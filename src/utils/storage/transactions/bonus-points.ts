
import { supabase } from '@/integrations/supabase/client';

interface BonusPointsMovement {
  transactionId: string;
  paymentMethodId: string;
  bonusPoints: number;
}

export const addBonusPointsMovement = async (movement: BonusPointsMovement) => {
  try {
    console.log('Recording bonus points movement:', JSON.stringify(movement, null, 2));
    
    const bonusData = {
      transaction_id: movement.transactionId,
      payment_method_id: movement.paymentMethodId,
      bonus_points: movement.bonusPoints
    };
    
    // Only try to save to Supabase if we have a valid transaction ID format
    // (local storage transactions might use a different ID format than Supabase UUIDs)
    const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(movement.transactionId);
    
    if (!isValidUUID) {
      console.log('Skipping bonus points recording for local storage transaction (non-UUID format)');
      return null;
    }
    
    console.log('Sending bonus points data to Supabase:', JSON.stringify(bonusData, null, 2));
    
    const { data, error } = await supabase
      .from('bonus_points_movements')
      .insert(bonusData)
      .select();
      
    if (error) {
      console.error('Error recording bonus points movement:', error);
      console.error('Error details:', error.message, error.details, error.hint);
      // Don't throw here, we'll still consider the transaction a success
      // even if bonus points recording fails
      return null;
    }
    
    console.log('Bonus points movement recorded successfully:', data);
    
    // Trigger background task to update monthly totals
    // Using setTimeout as a background task since we're in browser context
    setTimeout(() => {
      updateMonthlyBonusPointsTotals(movement.paymentMethodId)
        .catch(err => console.error('Error in background task:', err));
    }, 0);
    
    return data ? data[0] : null;
  } catch (error) {
    console.error('Exception in addBonusPointsMovement:', error);
    // Don't throw here, we'll still consider the transaction a success
    // even if bonus points recording fails
    return null;
  }
};

const updateMonthlyBonusPointsTotals = async (paymentMethodId: string) => {
  try {
    console.log('Updating monthly bonus points totals for payment method:', paymentMethodId);
    
    const currentDate = new Date();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    
    console.log('Fetching bonus points movements since:', firstDayOfMonth.toISOString());
    
    const { data: movements, error } = await supabase
      .from('bonus_points_movements')
      .select('bonus_points')
      .eq('payment_method_id', paymentMethodId)
      .gte('created_at', firstDayOfMonth.toISOString());
      
    if (error) {
      console.error('Error fetching bonus points movements:', error);
      console.error('Error details:', error.message, error.details, error.hint);
      return;
    }
    
    console.log('Fetched bonus points movements:', movements);
    
    const totalBonusPoints = movements.reduce((sum, movement) => sum + movement.bonus_points, 0);
    const remainingPoints = Math.max(0, 4000 - totalBonusPoints);
    
    console.log('Total bonus points used this month:', totalBonusPoints);
    console.log('Remaining bonus points available:', remainingPoints);
    
    // We don't use the toast hook here as it's a non-component context
    // Information about remaining points will be logged for debugging
  } catch (error) {
    console.error('Error in background task:', error);
  }
};
