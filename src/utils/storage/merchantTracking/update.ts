
import { MerchantCategoryCode } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { getMerchantCategoryMappingByName } from './get';

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
