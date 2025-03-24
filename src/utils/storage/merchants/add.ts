
import { Merchant } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { processMerchantData } from './utils';

// Add a new merchant
export const addMerchant = async (merchant: Omit<Merchant, 'id'>): Promise<Merchant> => {
  // Add new merchant
  const { data, error } = await supabase
    .from('merchants')
    .insert({
      name: merchant.name,
      address: merchant.address,
      coordinates: merchant.coordinates,
      mcc: merchant.mcc,
      is_online: merchant.isOnline,
    })
    .select()
    .single();
    
  if (error) {
    console.error('Error adding merchant:', error);
    throw error;
  }
  
  return processMerchantData(data);
};
