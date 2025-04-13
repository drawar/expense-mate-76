
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

// Make mcc parameter optional for backwards compatibility
export const incrementMerchantOccurrence = async (
  merchantName: string, 
  mcc?: MerchantCategoryCode
): Promise<void> => {
  try {
    // Check if mapping exists
    const mapping = await getMerchantCategoryMappingByName(merchantName);
    
    if (mapping) {
      const updateData: any = {
        occurrence_count: mapping.occurrenceCount + 1,
        updated_at: new Date().toISOString(),
        is_deleted: false // Ensure the entry is marked as not deleted
      };
      
      // Only update MCC if provided
      if (mcc) {
        updateData.most_common_mcc = mcc;
      }
      
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
          most_common_mcc: mcc || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          is_deleted: false
        });
        
      if (error) {
        console.error('Error creating merchant mapping:', error);
      }
    }
  } catch (error) {
    console.error('Exception in incrementMerchantOccurrence:', error);
  }
};
