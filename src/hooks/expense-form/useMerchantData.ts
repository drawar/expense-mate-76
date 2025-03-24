
import { useCallback, useEffect, useState } from 'react';
import { MerchantCategoryCode } from '@/types';
import { UseFormReturn } from 'react-hook-form';
import { FormValues } from './formSchema';
import { getMerchantByName } from '@/utils/storageUtils';
import { getSuggestedMerchantCategory, hasMerchantCategorySuggestions } from '@/utils/storage/merchantTracking';

export const useMerchantData = (
  form: UseFormReturn<FormValues>,
  merchantName: string
) => {
  const [selectedMCC, setSelectedMCC] = useState<MerchantCategoryCode | undefined>();
  const [suggestionChecked, setSuggestionChecked] = useState(false);

  // Memoize merchant fetch to prevent excessive rerenders
  const fetchMerchant = useCallback(async (name: string) => {
    if (name && name.trim().length >= 3) {
      try {
        // First check if we have a merchant in database
        const existingMerchant = await getMerchantByName(name);
        if (existingMerchant?.mcc) {
          setSelectedMCC(existingMerchant.mcc);
          form.setValue('mcc', existingMerchant.mcc);
          return; // Exit if we found merchant with MCC
        }
        
        // If no merchant with MCC is found, check our mappings
        if (!suggestionChecked) {
          setSuggestionChecked(true);
          
          // Check if this merchant name has suggestions enabled and is not deleted
          const hasSuggestions = await hasMerchantCategorySuggestions(name);
          if (hasSuggestions) {
            const suggestedMCC = await getSuggestedMerchantCategory(name);
            if (suggestedMCC && (!selectedMCC || suggestedMCC.code !== selectedMCC.code)) {
              setSelectedMCC(suggestedMCC);
              form.setValue('mcc', suggestedMCC);
              return true; // Return true to indicate we found a suggestion
            }
          }
        }
        
        return false; // Return false to indicate no suggestion found
      } catch (error) {
        console.error('Error fetching merchant:', error);
        return false;
      }
    }
    return false;
  }, [form, selectedMCC, suggestionChecked]);

  // Debounce merchant fetch to avoid excessive API calls
  useEffect(() => {
    if (merchantName.trim().length < 3) {
      setSuggestionChecked(false); // Reset when merchant name changes significantly
      return;
    }
    
    const timer = setTimeout(() => {
      fetchMerchant(merchantName);
    }, 300); // 300ms debounce
    
    return () => clearTimeout(timer);
  }, [merchantName, fetchMerchant]);

  return { 
    selectedMCC, 
    setSelectedMCC,
    hasSuggestion: suggestionChecked
  };
};
