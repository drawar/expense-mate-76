
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
      mostCommonMCC: item.most_common_mcc ? JSON.parse(item.most_common_mcc as string) as MerchantCategoryCode : undefined,
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
      mostCommonMCC: data.most_common_mcc ? JSON.parse(data.most_common_mcc as string) as MerchantCategoryCode : undefined,
      isDeleted: data.is_deleted
    };
  } catch (error) {
    console.error('Exception fetching merchant mapping by name:', error);
    return null;
  }
};

// Fix the incrementMerchantOccurrence function to handle JSON conversion
export const incrementMerchantOccurrence = async (
  merchantName: string, 
  mcc?: MerchantCategoryCode
): Promise<boolean> => {
  try {
    if (!merchantName) return false;
    
    // Normalize merchant name
    const normalizedName = merchantName.trim().toLowerCase();
    if (!normalizedName) return false;
    
    // Check if we already have a mapping for this merchant
    const { data: existingMapping, error: fetchError } = await supabase
      .from('merchant_category_mappings')
      .select('*')
      .eq('merchant_name', normalizedName)
      .single();
    
    if (fetchError) {
      // No existing mapping, create a new one
      console.log('Creating new merchant mapping for:', normalizedName);
      const { error: insertError } = await supabase
        .from('merchant_category_mappings')
        .insert({
          merchant_name: normalizedName,
          occurrence_count: 1,
          most_common_mcc: mcc ? JSON.stringify(mcc) : null
        });
      
      if (insertError) {
        console.error('Error creating merchant mapping:', insertError);
        return false;
      }
      
      return true;
    } else {
      // Update existing mapping
      console.log('Updating existing mapping for:', normalizedName);
      const newCount = (existingMapping.occurrence_count || 0) + 1;
      
      // Update MCC if provided
      let mccToUpdate = existingMapping.most_common_mcc;
      if (mcc) {
        mccToUpdate = JSON.stringify(mcc);
      }
      
      const { error: updateError } = await supabase
        .from('merchant_category_mappings')
        .update({
          occurrence_count: newCount,
          most_common_mcc: mccToUpdate,
          modified_at: new Date().toISOString()
        })
        .eq('merchant_name', normalizedName);
      
      if (updateError) {
        console.error('Error updating merchant mapping:', updateError);
        return false;
      }
      
      return true;
    }
  } catch (error) {
    console.error('Error in incrementMerchantOccurrence:', error);
    return false;
  }
};

// Implement decrementMerchantOccurrence to fix missing export
export const decrementMerchantOccurrence = async (merchantName: string): Promise<boolean> => {
  try {
    if (!merchantName) return false;
    
    // Normalize merchant name
    const normalizedName = merchantName.trim().toLowerCase();
    if (!normalizedName) return false;
    
    // Check if we have a mapping for this merchant
    const { data: existingMapping, error: fetchError } = await supabase
      .from('merchant_category_mappings')
      .select('*')
      .eq('merchant_name', normalizedName)
      .single();
    
    if (fetchError) {
      console.log('No merchant mapping found for:', normalizedName);
      return false;
    }
    
    // Decrement occurrence count, but never below 0
    const newCount = Math.max(0, (existingMapping.occurrence_count || 1) - 1);
    
    const { error: updateError } = await supabase
      .from('merchant_category_mappings')
      .update({
        occurrence_count: newCount,
        modified_at: new Date().toISOString()
      })
      .eq('merchant_name', normalizedName);
    
    if (updateError) {
      console.error('Error updating merchant mapping:', updateError);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error in decrementMerchantOccurrence:', error);
    return false;
  }
};

// Add missing function to check if there are suggestions for a merchant
export const hasMerchantCategorySuggestions = async (merchantName: string): Promise<boolean> => {
  try {
    if (!merchantName) return false;
    
    const normalizedName = merchantName.trim().toLowerCase();
    if (!normalizedName) return false;
    
    const { data, error } = await supabase
      .from('merchant_category_mappings')
      .select('most_common_mcc')
      .eq('merchant_name', normalizedName)
      .single();
    
    if (error || !data || !data.most_common_mcc) return false;
    
    return true;
  } catch (error) {
    console.error('Error checking for merchant category suggestions:', error);
    return false;
  }
};

// Add missing function to get suggested category for a merchant
export const getSuggestedMerchantCategory = async (merchantName: string): Promise<MerchantCategoryCode | null> => {
  try {
    if (!merchantName) return null;
    
    const normalizedName = merchantName.trim().toLowerCase();
    if (!normalizedName) return null;
    
    const { data, error } = await supabase
      .from('merchant_category_mappings')
      .select('most_common_mcc')
      .eq('merchant_name', normalizedName)
      .single();
    
    if (error || !data || !data.most_common_mcc) return null;
    
    return JSON.parse(data.most_common_mcc as string) as MerchantCategoryCode;
  } catch (error) {
    console.error('Error getting suggested merchant category:', error);
    return null;
  }
};
