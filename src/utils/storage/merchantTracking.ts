import { MerchantCategoryCode } from '@/types';
import { supabase } from '@/integrations/supabase/client';

// Interface for merchant occurrence tracking
interface MerchantCategoryMapping {
  merchantName: string;
  occurrenceCount: number;
  mostCommonMCC?: MerchantCategoryCode;
  isDeleted: boolean;
}

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
    
    if (error) {
      // Only log actual errors, not "not found" cases
      console.warn('Error fetching merchant mapping by name:', error);
      return null;
    }
    
    // If no data found, return null without an error message
    if (!data) {
      console.log(`No merchant mapping found for: ${merchantName}`);
      return null;
    }
    
    return {
      merchantName: data.merchant_name,
      occurrenceCount: data.occurrence_count,
      mostCommonMCC: data.most_common_mcc ? data.most_common_mcc as MerchantCategoryCode : undefined,
      isDeleted: data.is_deleted
    };
  } catch (error) {
    // Log exceptions but still return null gracefully
    console.warn('Exception fetching merchant mapping by name:', error);
    return null;
  }
};

// Increment the merchant occurrence count and update most common MCC
export const incrementMerchantOccurrence = async (
  merchantName: string, 
  mcc: MerchantCategoryCode
): Promise<void> => {
  try {
    // Check if mapping exists
    const mapping = await getMerchantCategoryMappingByName(merchantName);
    
    if (mapping) {
      const updateData: any = {
        occurrence_count: mapping.occurrenceCount + 1,
        most_common_mcc: mcc,
        updated_at: new Date().toISOString(),
        is_deleted: false // Ensure the entry is marked as not deleted
      };
      
      // Update existing mapping
      const { error } = await supabase
        .from('merchant_category_mappings')
        .update(updateData)
        .eq('merchant_name', merchantName);
        
      if (error) {
        console.error('Error updating merchant mapping:', error);
      }
    } else {
      // Create new mapping
      const { error } = await supabase
        .from('merchant_category_mappings')
        .insert({
          merchant_name: merchantName,
          occurrence_count: 1,
          most_common_mcc: mcc,
          is_deleted: false // New entries are not deleted
        });
        
      if (error) {
        console.error('Error creating merchant mapping:', error);
      }
    }
  } catch (error) {
    console.error('Exception in incrementMerchantOccurrence:', error);
  }
};

// Decrement merchant occurrence count when a transaction is deleted
export const decrementMerchantOccurrence = async (merchantName: string): Promise<void> => {
  try {
    const mapping = await getMerchantCategoryMappingByName(merchantName);
    
    if (!mapping) {
      console.warn(`No mapping found for merchant: ${merchantName}`);
      return;
    }
    
    if (mapping.occurrenceCount <= 1) {
      // If count will become zero, mark the mapping as deleted
      const { error } = await supabase
        .from('merchant_category_mappings')
        .update({
          occurrence_count: 0,
          is_deleted: true,
          updated_at: new Date().toISOString()
        })
        .eq('merchant_name', merchantName);
        
      if (error) {
        console.error('Error marking merchant mapping as deleted:', error);
      }
    } else {
      // Decrement the count
      const { error } = await supabase
        .from('merchant_category_mappings')
        .update({
          occurrence_count: mapping.occurrenceCount - 1,
          updated_at: new Date().toISOString()
        })
        .eq('merchant_name', merchantName);
        
      if (error) {
        console.error('Error decrementing merchant count:', error);
      }
    }
  } catch (error) {
    console.error('Exception in decrementMerchantOccurrence:', error);
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
