
import { supabase } from '@/integrations/supabase/client';
import { MerchantCategoryCode } from '@/types';
import { storageService } from '@/services/storage';

export const getMerchantByName = async (name: string) => {
  if (!name || name.trim().length < 3) return null;
  
  const normalizedName = name.trim().toLowerCase();
  
  try {
    const useLocalStorage = storageService.isLocalStorageMode();
    
    if (useLocalStorage) {
      // For local storage implementation
      const storedMerchants = localStorage.getItem('merchants');
      if (storedMerchants) {
        const merchants = JSON.parse(storedMerchants);
        return merchants.find((m: any) => 
          m.name.toLowerCase().includes(normalizedName) ||
          normalizedName.includes(m.name.toLowerCase())
        );
      }
      return null;
    } else {
      // For Supabase implementation
      const { data, error } = await supabase
        .from('merchants')
        .select('*')
        .ilike('name', `%${normalizedName}%`)
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (error || !data || data.length === 0) {
        return null;
      }
      
      return data[0];
    }
  } catch (error) {
    console.error('Error getting merchant by name:', error);
    return null;
  }
};

export const hasMerchantCategorySuggestions = async (name: string) => {
  if (!name || name.trim().length < 3) return false;
  
  const normalizedName = name.trim().toLowerCase();
  
  try {
    const useLocalStorage = storageService.isLocalStorageMode();
    
    if (useLocalStorage) {
      // For local storage implementation
      const storedMappings = localStorage.getItem('merchantCategoryMappings');
      if (storedMappings) {
        const mappings = JSON.parse(storedMappings);
        return mappings.some((m: any) => 
          m.merchant_name.toLowerCase().includes(normalizedName) ||
          normalizedName.includes(m.merchant_name.toLowerCase())
        );
      }
      return false;
    } else {
      // For Supabase implementation
      const { data, error } = await supabase
        .from('merchant_category_mappings')
        .select('id')
        .ilike('merchant_name', `%${normalizedName}%`)
        .not('most_common_mcc', 'is', null) // Fix: Use not is null instead of not.null
        .limit(1);
      
      if (error) {
        console.error('Error checking merchant category suggestions:', error);
        return false;
      }
      
      return data && data.length > 0;
    }
  } catch (error) {
    console.error('Error checking merchant category suggestions:', error);
    return false;
  }
};

export const getSuggestedMerchantCategory = async (name: string): Promise<MerchantCategoryCode | null> => {
  if (!name || name.trim().length < 3) return null;
  
  const normalizedName = name.trim().toLowerCase();
  
  try {
    const useLocalStorage = storageService.isLocalStorageMode();
    
    if (useLocalStorage) {
      // For local storage implementation
      const storedMappings = localStorage.getItem('merchantCategoryMappings');
      if (storedMappings) {
        const mappings = JSON.parse(storedMappings);
        const match = mappings.find((m: any) => 
          m.merchant_name.toLowerCase().includes(normalizedName) ||
          normalizedName.includes(m.merchant_name.toLowerCase())
        );
        
        return match?.most_common_mcc || null;
      }
      return null;
    } else {
      // For Supabase implementation
      const { data, error } = await supabase
        .from('merchant_category_mappings')
        .select('most_common_mcc')
        .ilike('merchant_name', `%${normalizedName}%`)
        .order('occurrence_count', { ascending: false })
        .limit(1);
      
      if (error || !data || data.length === 0) {
        return null;
      }
      
      // Fix: Type casting the most_common_mcc Json value to MerchantCategoryCode
      const mcc = data[0].most_common_mcc as unknown as MerchantCategoryCode;
      return mcc;
    }
  } catch (error) {
    console.error('Error getting suggested merchant category:', error);
    return null;
  }
};
