import { useEffect, useState } from 'react';
import { MerchantCategoryCode } from '@/types';
import { UseFormReturn } from 'react-hook-form';
import { FormValues } from './formSchema';
import { getMerchantByName } from '@/utils/storageUtils';

/**
 * Simplified hook to fetch merchant data and MCC code
 */
export const useMerchantData = (
  form: UseFormReturn<FormValues>,
  merchantName: string
) => {
  const [selectedMCC, setSelectedMCC] = useState<MerchantCategoryCode | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  
  // Simple debounced merchant lookup
  useEffect(() => {
    // Skip lookup for short names
    if (!merchantName || merchantName.trim().length < 3) {
      return;
    }
    
    let isActive = true; // Prevents state updates if component unmounts
    
    const lookupMerchant = async () => {
      setIsLoading(true);
      
      try {
        // Simple lookup with no extra processing or dependencies
        const merchant = await getMerchantByName(merchantName);
        
        // Only update state if component still mounted and the merchant has an MCC
        if (isActive && merchant?.mcc) {
          setSelectedMCC(merchant.mcc);
          form.setValue('mcc', merchant.mcc);
        }
      } catch (error) {
        // Silently fail - no need to show errors for lookups
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };
    
    // Debounce the lookup
    const timer = setTimeout(lookupMerchant, 300);
    
    return () => {
      isActive = false;
      clearTimeout(timer);
    };
  }, [merchantName, form]);
  
  return { 
    selectedMCC,
    setSelectedMCC,
    isLoading
  };
};
