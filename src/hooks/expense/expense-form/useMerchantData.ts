
import { useState, useEffect } from 'react';
import { MerchantCategoryCode } from '@/types';

export const useMerchantData = (merchantName: string) => {
  const [suggestedMCC, setSuggestedMCC] = useState<MerchantCategoryCode | null>(null);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

  useEffect(() => {
    if (merchantName.trim().length > 2) {
      setIsLoadingSuggestions(true);
      // Mock implementation - in real app this would call an API
      setTimeout(() => {
        setSuggestedMCC(null);
        setIsLoadingSuggestions(false);
      }, 300);
    }
  }, [merchantName]);

  return {
    suggestedMCC,
    isLoadingSuggestions,
  };
};
