
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface BonusPointsMovement {
  transactionId: string;
  paymentMethodId: string;
  bonusPoints: number;
}

export const addBonusPointsMovement = async (movement: BonusPointsMovement) => {
  try {
    const { data, error } = await supabase
      .from('bonus_points_movements')
      .insert({
        transaction_id: movement.transactionId,
        payment_method_id: movement.paymentMethodId,
        bonus_points: movement.bonusPoints
      })
      .select()
      .single();
      
    if (error) {
      console.error('Error recording bonus points movement:', error);
      // Don't throw here, we'll still consider the transaction a success
      // even if bonus points recording fails
      return null;
    }
    
    // Trigger background task to update monthly totals
    // Using setTimeout as a background task since we're in browser context
    setTimeout(() => {
      updateMonthlyBonusPointsTotals(movement.paymentMethodId)
        .catch(err => console.error('Error in background task:', err));
    }, 0);
    
    return data;
  } catch (error) {
    console.error('Exception in addBonusPointsMovement:', error);
    // Don't throw here, we'll still consider the transaction a success
    // even if bonus points recording fails
    return null;
  }
};

const updateMonthlyBonusPointsTotals = async (paymentMethodId: string) => {
  try {
    const currentDate = new Date();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    
    const { data: movements, error } = await supabase
      .from('bonus_points_movements')
      .select('bonus_points')
      .eq('payment_method_id', paymentMethodId)
      .gte('created_at', firstDayOfMonth.toISOString());
      
    if (error) {
      console.error('Error fetching bonus points movements:', error);
      return;
    }
    
    const totalBonusPoints = movements.reduce((sum, movement) => sum + movement.bonus_points, 0);
    const remainingPoints = Math.max(0, 4000 - totalBonusPoints);
    
    // We can't use the hook directly here, so we'll use the imported toast function
    const { toast } = require('@/hooks/use-toast');
    
    toast({
      title: "Bonus Points Update",
      description: `Remaining bonus points available this month: ${remainingPoints}`,
    });
  } catch (error) {
    console.error('Error in background task:', error);
  }
};
