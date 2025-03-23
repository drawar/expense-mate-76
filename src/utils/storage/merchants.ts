
import { Merchant } from '@/types';
import { supabase } from '@/integrations/supabase/client';

// Get merchants from Supabase
export const getMerchants = async (): Promise<Merchant[]> => {
  const { data, error } = await supabase
    .from('merchants')
    .select('*');
    
  if (error) {
    console.error('Error fetching merchants:', error);
    return [];
  }
  
  // Transform data to match our Merchant type
  return data.map(merchant => ({
    id: merchant.id,
    name: merchant.name,
    address: merchant.address || undefined,
    coordinates: merchant.coordinates || undefined,
    mcc: merchant.mcc || undefined,
    isOnline: merchant.is_online,
  }));
};

// Get merchant by name (case insensitive) or return undefined
export const getMerchantByName = async (name: string): Promise<Merchant | undefined> => {
  const { data, error } = await supabase
    .from('merchants')
    .select('*')
    .ilike('name', name)
    .maybeSingle();
    
  if (error || !data) {
    console.error('Error fetching merchant by name:', error);
    return undefined;
  }
  
  // Transform data to match our Merchant type
  return {
    id: data.id,
    name: data.name,
    address: data.address || undefined,
    coordinates: data.coordinates || undefined,
    mcc: data.mcc || undefined,
    isOnline: data.is_online,
  };
};

// Add a new merchant or update if already exists
export const addOrUpdateMerchant = async (merchant: Merchant): Promise<Merchant> => {
  // Check if merchant with same name exists
  const existingMerchant = await getMerchantByName(merchant.name);
  
  if (existingMerchant) {
    // Update existing merchant
    const { data, error } = await supabase
      .from('merchants')
      .update({
        address: merchant.address,
        coordinates: merchant.coordinates,
        mcc: merchant.mcc,
        is_online: merchant.isOnline,
      })
      .eq('id', existingMerchant.id)
      .select()
      .single();
      
    if (error) {
      console.error('Error updating merchant:', error);
      throw error;
    }
    
    return {
      id: data.id,
      name: data.name,
      address: data.address || undefined,
      coordinates: data.coordinates || undefined,
      mcc: data.mcc || undefined,
      isOnline: data.is_online,
    };
  } else {
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
    
    return {
      id: data.id,
      name: data.name,
      address: data.address || undefined,
      coordinates: data.coordinates || undefined,
      mcc: data.mcc || undefined,
      isOnline: data.is_online,
    };
  }
};
