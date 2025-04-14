
// components/expense/form/MerchantDetailsForm.tsx
import { useState, useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import { MerchantCategoryCode } from '@/types';
import { Input } from '@/components/ui/input';
import { StoreIcon } from 'lucide-react';
import { useDebounce } from '@/hooks/use-debounce';
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
import { useToast } from '@/hooks/use-toast';
import { 
  hasMerchantCategorySuggestions, 
  getSuggestedMerchantCategory 
} from '@/utils/storage/merchants';
import MerchantCategorySelect from './MerchantCategorySelect';
import OnlineMerchantToggle from './OnlineMerchantToggle';

interface MerchantDetailsFormProps {
  onSelectMCC: (mcc: MerchantCategoryCode) => void;
  selectedMCC?: MerchantCategoryCode | null;
}

const MerchantDetailsForm: React.FC<MerchantDetailsFormProps> = ({ 
  onSelectMCC, 
  selectedMCC 
}) => {
  const form = useFormContext();
  const { toast } = useToast();
  const [suggestionsChecked, setSuggestionsChecked] = useState(false);
  
  // Get merchant name from form and debounce to reduce API calls
  const merchantName = form.watch('merchantName');
  const debouncedMerchantName = useDebounce(merchantName, 500);
  const isOnline = form.watch('isOnline');
  
  // Only check for suggestions once per merchant name and when no MCC is selected
  useEffect(() => {
    const checkMerchantSuggestions = async () => {
      if (debouncedMerchantName.trim().length >= 3 && !suggestionsChecked && !selectedMCC) {
        try {
          // Mark that we've checked suggestions for this merchant name
          setSuggestionsChecked(true);
          
          // Check if we have a suggestion for this merchant name
          const hasSuggestions = await hasMerchantCategorySuggestions(debouncedMerchantName);
          
          if (hasSuggestions) {
            const suggestedMCC = await getSuggestedMerchantCategory(debouncedMerchantName);
            
            if (suggestedMCC) {
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
  }, [debouncedMerchantName, form, toast, onSelectMCC, selectedMCC, suggestionsChecked]);

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

export default MerchantDetailsForm;
