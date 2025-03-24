
import { useCallback, useEffect, useState } from 'react';
import { MerchantCategoryCode } from '@/types';
import { UseFormReturn } from 'react-hook-form';
import { FormValues } from './formSchema';
import { getMerchantByName } from '@/utils/storageUtils';

export const useMerchantData = (
  form: UseFormReturn<FormValues>,
  merchantName: string
) => {
  const [selectedMCC, setSelectedMCC] = useState<MerchantCategoryCode | undefined>();

  // Memoize merchant fetch to prevent excessive rerenders
  const fetchMerchant = useCallback(async (name: string) => {
    if (name && name.trim().length >= 3) {
      try {
        const existingMerchant = await getMerchantByName(name);
        if (existingMerchant?.mcc) {
          setSelectedMCC(existingMerchant.mcc);
          form.setValue('mcc', existingMerchant.mcc);
        }
      } catch (error) {
        console.error('Error fetching merchant:', error);
      }
    }
  }, [form]);

  // Debounce merchant fetch to avoid excessive API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchMerchant(merchantName);
    }, 300); // 300ms debounce
    
    return () => clearTimeout(timer);
  }, [merchantName, fetchMerchant]);

  return { selectedMCC, setSelectedMCC };
};
