
import { supabase } from '@/integrations/supabase/client';
import { MerchantCategoryCode } from '@/types';
import { MerchantCategoryMapping } from './types';

// Get current merchant category mapping
export const getMerchantCategoryMappings = async (): Promise<MerchantCategoryMapping[]> => {
  try {
    const { data, error } = await supabase
      .from('merchant_category_mappings')
      .select('*')
      .eq('is_deleted', false);
      
    if (error) {
      console.error('Error fetching merchant category mappings:', error);
      return [];
    }
    
    return data.map(item => ({
      merchantName: item.merchant_name,
      occurrenceCount: item.occurrence_count,
      mostCommonMCC: item.most_common_mcc ? item.most_common_mcc as MerchantCategoryCode : undefined,
      isDeleted: item.is_deleted
    }));
  } catch (error) {
    console.error('Exception fetching merchant category mappings:', error);
    return [];
  }
};

// Get merchant mapping by name
export const getMerchantCategoryMappingByName = async (merchantName: string): Promise<MerchantCategoryMapping | null> => {
  try {
    const { data, error } = await supabase
      .from('merchant_category_mappings')
      .select('*')
      .ilike('merchant_name', merchantName)
      .maybeSingle();
    
    if (error || !data) {
      console.error('Error fetching merchant mapping by name:', error);
      return null;
    }
    
    return {
      merchantName: data.merchant_name,
      occurrenceCount: data.occurrence_count,
      mostCommonMCC: data.most_common_mcc ? data.most_common_mcc as MerchantCategoryCode : undefined,
      isDeleted: data.is_deleted
    };
  } catch (error) {
    console.error('Exception fetching merchant mapping by name:', error);
    return null;
  }
};

// Check if a merchant has suggestions enabled
export const hasMerchantCategorySuggestions = async (merchantName: string): Promise<boolean> => {
  try {
    const mapping = await getMerchantCategoryMappingByName(merchantName);
    return !!mapping && mapping.occurrenceCount > 0 && !!mapping.mostCommonMCC && !mapping.isDeleted;
  } catch (error) {
    console.error('Error checking merchant suggestions:', error);
    return false;
  }
};

// Get suggested MCC for a merchant
export const getSuggestedMerchantCategory = async (merchantName: string): Promise<MerchantCategoryCode | null> => {
  try {
    const mapping = await getMerchantCategoryMappingByName(merchantName);
    
    if (mapping && mapping.occurrenceCount > 0 && mapping.mostCommonMCC && !mapping.isDeleted) {
      return mapping.mostCommonMCC;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting suggested merchant category:', error);
    return null;
  }
};
