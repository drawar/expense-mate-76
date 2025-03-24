
import { Merchant, MerchantCategoryCode } from '@/types';
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
  return data.map(merchant => {
    // Process coordinates to ensure correct type
    let coordinates = undefined;
    if (merchant.coordinates) {
      try {
        if (typeof merchant.coordinates === 'object') {
          coordinates = merchant.coordinates as { latitude: number; longitude: number };
        }
      } catch (e) {
        console.error('Error parsing coordinates:', e);
      }
    }
    
    // Process MCC code to ensure correct type
    let mcc = undefined;
    if (merchant.mcc) {
      try {
        if (typeof merchant.mcc === 'object') {
          mcc = merchant.mcc as MerchantCategoryCode;
        }
      } catch (e) {
        console.error('Error parsing MCC:', e);
      }
    }
    
    return {
      id: merchant.id,
      name: merchant.name,
      address: merchant.address || undefined,
      coordinates,
      mcc,
      isOnline: merchant.is_online,
    };
  });
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
  
  // Process coordinates to ensure correct type
  let coordinates = undefined;
  if (data.coordinates) {
    try {
      if (typeof data.coordinates === 'object') {
        coordinates = data.coordinates as { latitude: number; longitude: number };
      }
    } catch (e) {
      console.error('Error parsing coordinates:', e);
    }
  }
  
  // Process MCC code to ensure correct type
  let mcc = undefined;
  if (data.mcc) {
    try {
      if (typeof data.mcc === 'object') {
        mcc = data.mcc as MerchantCategoryCode;
      }
    } catch (e) {
      console.error('Error parsing MCC:', e);
    }
  }
  
  // Transform data to match our Merchant type
  return {
    id: data.id,
    name: data.name,
    address: data.address || undefined,
    coordinates,
    mcc,
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
    
    // Process coordinates to ensure correct type
    let coordinates = undefined;
    if (data.coordinates) {
      try {
        if (typeof data.coordinates === 'object') {
          coordinates = data.coordinates as { latitude: number; longitude: number };
        }
      } catch (e) {
        console.error('Error parsing coordinates:', e);
      }
    }
    
    // Process MCC code to ensure correct type
    let mcc = undefined;
    if (data.mcc) {
      try {
        if (typeof data.mcc === 'object') {
          mcc = data.mcc as MerchantCategoryCode;
        }
      } catch (e) {
        console.error('Error parsing MCC:', e);
      }
    }
    
    return {
      id: data.id,
      name: data.name,
      address: data.address || undefined,
      coordinates,
      mcc,
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
    
    // Process coordinates to ensure correct type
    let coordinates = undefined;
    if (data.coordinates) {
      try {
        if (typeof data.coordinates === 'object') {
          coordinates = data.coordinates as { latitude: number; longitude: number };
        }
      } catch (e) {
        console.error('Error parsing coordinates:', e);
      }
    }
    
    // Process MCC code to ensure correct type
    let mcc = undefined;
    if (data.mcc) {
      try {
        if (typeof data.mcc === 'object') {
          mcc = data.mcc as MerchantCategoryCode;
        }
      } catch (e) {
        console.error('Error parsing MCC:', e);
      }
    }
    
    return {
      id: data.id,
      name: data.name,
      address: data.address || undefined,
      coordinates,
      mcc,
      isOnline: data.is_online,
    };
  }
};
