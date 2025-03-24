
import { Merchant, MerchantCategoryCode } from '@/types';

// Process merchant data from Supabase to our Merchant type
export const processMerchantData = (data: any): Merchant => {
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
};
