
import { Merchant } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { getMerchantByName } from './get';
import { addMerchant } from './add';
import { processMerchantData } from './utils';

// Update an existing merchant
export const updateMerchant = async (merchant: Merchant): Promise<Merchant> => {
  // Update existing merchant
  const { data, error } = await supabase
    .from('merchants')
    .update({
      name: merchant.name,
      address: merchant.address,
      coordinates: merchant.coordinates,
      mcc: merchant.mcc,
      is_online: merchant.isOnline,
    })
    .eq('id', merchant.id)
    .select()
    .single();
    
  if (error) {
    console.error('Error updating merchant:', error);
    throw error;
  }
  
  return processMerchantData(data);
};

// Add a new merchant or update if already exists
export const addOrUpdateMerchant = async (merchant: Merchant): Promise<Merchant> => {
  // Check if merchant with same name exists
  const existingMerchant = await getMerchantByName(merchant.name);
  
  if (existingMerchant) {
    // Update with existing ID
    return updateMerchant({
      ...merchant,
      id: existingMerchant.id
    });
  } else {
    // Add new merchant
    return addMerchant(merchant);
  }
};
