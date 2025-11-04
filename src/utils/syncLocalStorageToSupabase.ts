import { supabase } from '@/integrations/supabase/client';
import { PaymentMethod } from '@/types';
import { toast } from 'sonner';

const PAYMENT_METHODS_KEY = 'expense-tracker-payment-methods';

/**
 * Syncs payment methods from localStorage to Supabase after login
 */
export async function syncPaymentMethodsToSupabase(userId: string): Promise<void> {
  try {
    console.log('🔄 Starting sync of localStorage payment methods to Supabase...');
    
    // Get payment methods from localStorage
    const localStorageData = localStorage.getItem(PAYMENT_METHODS_KEY);
    if (!localStorageData) {
      console.log('✅ No localStorage payment methods to sync');
      return;
    }

    const localPaymentMethods: PaymentMethod[] = JSON.parse(localStorageData);
    if (localPaymentMethods.length === 0) {
      console.log('✅ No payment methods in localStorage to sync');
      return;
    }

    console.log(`📦 Found ${localPaymentMethods.length} payment methods in localStorage`);

    // Prepare payment methods for Supabase (ensure user_id is set)
    const paymentMethodsToSync = localPaymentMethods.map(pm => ({
      ...pm,
      user_id: userId,
      updated_at: new Date().toISOString()
    }));

    // Upsert to Supabase
    const { error } = await supabase
      .from('payment_methods')
      .upsert(paymentMethodsToSync, { 
        onConflict: 'id',
        ignoreDuplicates: false 
      });

    if (error) {
      console.error('❌ Error syncing payment methods to Supabase:', error);
      throw error;
    }

    console.log('✅ Successfully synced payment methods to Supabase');
    
    // Clear localStorage after successful sync
    localStorage.removeItem(PAYMENT_METHODS_KEY);
    console.log('🗑️ Cleared payment methods from localStorage');
    
    toast.success('Payment methods synced to cloud');
  } catch (error) {
    console.error('Error in syncPaymentMethodsToSupabase:', error);
    toast.error('Failed to sync payment methods');
  }
}
