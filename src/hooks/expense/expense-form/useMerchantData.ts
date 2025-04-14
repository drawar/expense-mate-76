
import { useState, useEffect } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { MerchantCategoryCode } from '@/types';

export const useMerchantData = (
  form: UseFormReturn<any>, 
  merchantName: string
) => {
  const [selectedMCC, setSelectedMCC] = useState<MerchantCategoryCode | undefined>();
  
  // This is a simplified version - the full implementation would have database lookups
  useEffect(() => {
    // Reset MCC when merchant name changes significantly
    if (merchantName.trim().length < 3) {
      setSelectedMCC(undefined);
    }
  }, [merchantName]);
  
  return {
    selectedMCC,
    setSelectedMCC
  };
};
