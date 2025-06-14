
import React, { useState, useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import { MerchantCategoryCode } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { storageService } from '@/core/storage/StorageService';
import { Input } from '@/components/ui/input';
import { StoreIcon } from 'lucide-react';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

// Import sub-components
import OnlineMerchantToggle from '../elements/OnlineMerchantToggle';
import MerchantCategorySelect from '../elements/MerchantCategorySelect';

interface MerchantDetailsSectionProps {
  onSelectMCC: (mcc: MerchantCategoryCode) => void;
  selectedMCC?: MerchantCategoryCode | null;
}

export const MerchantDetailsSection: React.FC<MerchantDetailsSectionProps> = ({ 
  onSelectMCC, 
  selectedMCC 
}) => {
  const form = useFormContext();
  const { toast } = useToast();
  const [suggestionsChecked, setSuggestionsChecked] = useState(false);
  
  // Get merchant name from form and debounce to reduce API calls
  const merchantName = form.watch('merchantName');
  const isOnline = form.watch('isOnline');
  
  // Use a timeout for debouncing
  const [debouncedName, setDebouncedName] = useState(merchantName);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedName(merchantName);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [merchantName]);
  
  // Only check for suggestions once per merchant name and when no MCC is selected
  useEffect(() => {
    const checkMerchantSuggestions = async () => {
      if (debouncedName.trim().length >= 3 && !suggestionsChecked && !selectedMCC) {
        try {
          // Mark that we've checked suggestions for this merchant name
          setSuggestionsChecked(true);
          
          // Check if we have a suggestion for this merchant name
          const hasSuggestions = await storageService.hasMerchantCategorySuggestions(debouncedName);
          
          if (hasSuggestions) {
            const suggestedMCCResult = await storageService.getSuggestedMerchantCategory(debouncedName);
            
            if (suggestedMCCResult && typeof suggestedMCCResult === 'object') {
              const suggestedMCC = suggestedMCCResult as MerchantCategoryCode;
              // Set the MCC in the form and update the parent
              onSelectMCC(suggestedMCC);
              form.setValue('mcc', suggestedMCC);
              
              // Show toast to inform user about the suggested category
              toast({
                title: "Merchant category suggested",
                description: `Using ${suggestedMCC.description} (${suggestedMCC.code}) based on previous entries`,
              });
            }
          }
        } catch (error) {
          console.error('Error checking merchant suggestions:', error);
        }
      }
    };
    
    checkMerchantSuggestions();
  }, [debouncedName, form, toast, onSelectMCC, selectedMCC, suggestionsChecked]);

  // Reset suggestion check when merchant name changes significantly
  useEffect(() => {
    if (merchantName.trim().length < 3) {
      setSuggestionsChecked(false);
    }
  }, [merchantName]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <StoreIcon className="h-5 w-5" />
          Merchant Details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormField
          control={form.control}
          name="merchantName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Merchant Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter merchant name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <OnlineMerchantToggle />
        
        {!isOnline && (
          <FormField
            control={form.control}
            name="merchantAddress"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Merchant Address</FormLabel>
                <FormControl>
                  <Input placeholder="Enter merchant address (optional)" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        
        <MerchantCategorySelect 
          selectedMCC={selectedMCC}
          onSelectMCC={(mcc) => {
            onSelectMCC(mcc);
            setSuggestionsChecked(true); // Mark as checked when user manually selects
          }}
        />
      </CardContent>
    </Card>
  );
};
