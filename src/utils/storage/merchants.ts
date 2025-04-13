import { Merchant, MerchantCategoryCode } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';

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
  console.log('Looking for merchant by name:', name);
  
  const { data, error } = await supabase
    .from('merchants')
    .select('*')
    .ilike('name', name)
    .maybeSingle();
    
  if (error) {
    console.error('Error fetching merchant by name:', error);
    return undefined;
  }
  
  if (!data) {
    console.log('No merchant found with name:', name);
    return undefined;
  }
  
  console.log('Merchant found:', data);
  
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
  try {
    // Check if merchant already exists
    const existingMerchant = await getMerchantByName(merchant.name);
    
    if (existingMerchant) {
      // Update existing merchant
      console.log(`Updating existing merchant: ${merchant.name}`);
      
      // Prepare data for update, including proper JSON conversions
      const data = {
        address: merchant.address,
        coordinates: merchant.coordinates ? JSON.stringify(merchant.coordinates) : null,
        mcc: merchant.mcc ? JSON.stringify(merchant.mcc) : null,
        is_online: merchant.isOnline
      };
      
      const { data: updatedData, error } = await supabase
        .from('merchants')
        .update(data)
        .eq('id', existingMerchant.id)
        .select()
        .single();
      
      if (error) {
        console.error('Error updating merchant:', error);
        throw error;
      }
      
      return {
        id: updatedData.id,
        name: existingMerchant.name,
        address: updatedData.address,
        coordinates: updatedData.coordinates ? JSON.parse(updatedData.coordinates) : undefined,
        mcc: updatedData.mcc ? JSON.parse(updatedData.mcc) : undefined,
        isOnline: updatedData.is_online
      };
    } else {
      // Create new merchant
      console.log(`Creating new merchant: ${merchant.name}`);
      
      // Prepare data for insert, with proper JSON conversions
      const { data, error } = await supabase
        .from('merchants')
        .insert({
          name: merchant.name,
          address: merchant.address,
          coordinates: merchant.coordinates ? JSON.stringify(merchant.coordinates) : null,
          mcc: merchant.mcc ? JSON.stringify(merchant.mcc) : null,
          is_online: merchant.isOnline,
          is_deleted: false
        })
        .select()
        .single();
      
      if (error) {
        console.error('Error creating merchant:', error);
        throw error;
      }
      
      return {
        id: data.id,
        name: data.name,
        address: data.address,
        coordinates: data.coordinates ? JSON.parse(data.coordinates) : undefined,
        mcc: data.mcc ? JSON.parse(data.mcc) : undefined,
        isOnline: data.is_online
      };
    }
  } catch (error) {
    console.error('Error in addOrUpdateMerchant:', error);
    // Return a placeholder merchant with provided data if database operations fail
    return {
      id: merchant.id || uuidv4(),
      name: merchant.name,
      address: merchant.address,
      coordinates: merchant.coordinates,
      mcc: merchant.mcc,
      isOnline: merchant.isOnline
    };
  }
};
