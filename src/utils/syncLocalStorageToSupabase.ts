import { supabase } from '@/integrations/supabase/client';
import { PaymentMethod } from '@/types';
import { toast } from 'sonner';

const PAYMENT_METHODS_KEY = 'paymentMethods';
const SYNC_INTERVAL_MS = 5 * 60 * 1000; // Sync every 5 minutes

let syncIntervalId: NodeJS.Timeout | null = null;

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

/**
 * Starts periodic sync of localStorage to Supabase
 */
export function startPeriodicSync(userId: string): void {
  // Clear any existing interval
  stopPeriodicSync();
  
  console.log('🔄 Starting periodic sync (every 5 minutes)...');
  
  // Run sync immediately
  syncPaymentMethodsToSupabase(userId);
  
  // Then set up interval
  syncIntervalId = setInterval(() => {
    console.log('⏰ Running scheduled sync...');
    syncPaymentMethodsToSupabase(userId);
  }, SYNC_INTERVAL_MS);
}

/**
 * Stops periodic sync
 */
export function stopPeriodicSync(): void {
  if (syncIntervalId) {
    console.log('⏹️ Stopping periodic sync');
    clearInterval(syncIntervalId);
    syncIntervalId = null;
  }
}
