
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
        const parsedCoordinates = typeof merchant.coordinates === 'string' 
          ? JSON.parse(merchant.coordinates)
          : merchant.coordinates;
        
        if (typeof parsedCoordinates === 'object') {
          coordinates = parsedCoordinates;
        }
      } catch (e) {
        console.error('Error parsing coordinates:', e);
      }
    }
    
    // Process MCC code to ensure correct type
    let mcc = undefined;
    if (merchant.mcc) {
      try {
        const parsedMcc = typeof merchant.mcc === 'string'
          ? JSON.parse(merchant.mcc)
          : merchant.mcc;
          
        if (typeof parsedMcc === 'object') {
          mcc = parsedMcc as MerchantCategoryCode;
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
      const parsedCoordinates = typeof data.coordinates === 'string'
        ? JSON.parse(data.coordinates)
        : data.coordinates;
        
      if (typeof parsedCoordinates === 'object') {
        coordinates = parsedCoordinates;
      }
    } catch (e) {
      console.error('Error parsing coordinates:', e);
    }
  }
  
  // Process MCC code to ensure correct type
  let mcc = undefined;
  if (data.mcc) {
    try {
      const parsedMcc = typeof data.mcc === 'string'
        ? JSON.parse(data.mcc)
        : data.mcc;
        
      if (typeof parsedMcc === 'object') {
        mcc = parsedMcc as MerchantCategoryCode;
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
      
      // Parse JSON data from response
      let coordinatesObj;
      let mccObj;
      
      try {
        coordinatesObj = updatedData.coordinates ? 
          (typeof updatedData.coordinates === 'string' ? 
            JSON.parse(updatedData.coordinates) : updatedData.coordinates) 
          : undefined;
      } catch (e) {
        console.error('Error parsing coordinates after update:', e);
      }
      
      try {
        mccObj = updatedData.mcc ? 
          (typeof updatedData.mcc === 'string' ? 
            JSON.parse(updatedData.mcc) : updatedData.mcc) 
          : undefined;
      } catch (e) {
        console.error('Error parsing MCC after update:', e);
      }
      
      return {
        id: updatedData.id,
        name: existingMerchant.name,
        address: updatedData.address,
        coordinates: coordinatesObj,
        mcc: mccObj as MerchantCategoryCode | undefined,
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
      
      // Parse JSON data from response
      let coordinatesObj;
      let mccObj;
      
      try {
        coordinatesObj = data.coordinates ? 
          (typeof data.coordinates === 'string' ? 
            JSON.parse(data.coordinates) : data.coordinates) 
          : undefined;
      } catch (e) {
        console.error('Error parsing coordinates after insert:', e);
      }
      
      try {
        mccObj = data.mcc ? 
          (typeof data.mcc === 'string' ? 
            JSON.parse(data.mcc) : data.mcc) 
          : undefined;
      } catch (e) {
        console.error('Error parsing MCC after insert:', e);
      }
      
      return {
        id: data.id,
        name: data.name,
        address: data.address,
        coordinates: coordinatesObj,
        mcc: mccObj as MerchantCategoryCode | undefined,
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
