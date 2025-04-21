import { useState, useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import { MerchantCategoryCode } from '@/types';
import { getMerchantByName } from '@/utils/storageUtils';
import { Input } from '@/components/ui/input';
import { StoreIcon } from 'lucide-react';
import { useDebounce } from '@/hooks/use-debounce';
import { supabase } from '@/integrations/supabase/client';
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
import MerchantCategorySelect from './merchant/MerchantCategorySelect';
import MerchantAddressSelect from './merchant/MerchantAddressSelect';
import OnlineMerchantToggle from './merchant/OnlineMerchantToggle';
import { getSuggestedMerchantCategory, hasMerchantCategorySuggestions } from '@/utils/storage/merchantTracking';

interface Place {
  name: string;
  address: string;
  location: {
    lat: number;
    lng: number;
  };
}

interface MerchantDetailsFormProps {
  onSelectMCC: (mcc: MerchantCategoryCode) => void;
  selectedMCC?: MerchantCategoryCode;
}

const MerchantDetailsForm = ({ onSelectMCC, selectedMCC }: MerchantDetailsFormProps) => {
  const form = useFormContext();
  const [isAddressLoading, setIsAddressLoading] = useState(false);
  const [places, setPlaces] = useState<Place[]>([]);
  const [showPlacesDialog, setShowPlacesDialog] = useState(false);
  const { toast } = useToast();
  const [suggestionsChecked, setSuggestionsChecked] = useState(false);
  
  // When merchant name changes, check for existing merchant data
  const merchantName = form.watch('merchantName');
  const debouncedMerchantName = useDebounce(merchantName, 500);
  const isOnline = form.watch('isOnline');
  
  // Only check for suggestions once per merchant name and when no MCC is selected
  useEffect(() => {
    const checkMerchantSuggestions = async () => {
      if (!debouncedMerchantName || debouncedMerchantName.trim().length < 3) {
        return;
      }
      
      // Don't check again if we've already checked or if an MCC is already selected
      if (suggestionsChecked || selectedMCC) {
        return;
      }
      
      try {
        console.log(`Checking merchant suggestions for: ${debouncedMerchantName}`);
        
        // Mark that we've checked suggestions for this merchant name
        setSuggestionsChecked(true);
        
        // Check if we have a suggestion for this merchant name that isn't deleted
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
    };
    
    checkMerchantSuggestions();
  }, [debouncedMerchantName, form, toast, onSelectMCC, selectedMCC, suggestionsChecked]);

  // Reset suggestion check when merchant name changes significantly
  useEffect(() => {
    if (merchantName.trim().length < 3) {
      setSuggestionsChecked(false);
    }
  }, [merchantName]);

  // Fetch address suggestions when merchant name changes and it's not an online purchase
  useEffect(() => {
    const fetchAddressSuggestions = async () => {
      if (debouncedMerchantName.trim().length < 3 || isOnline) {
        setPlaces([]);
        return;
      }

      try {
        setIsAddressLoading(true);
        const { data, error } = await supabase.functions.invoke('search-places', {
          body: { query: debouncedMerchantName }
        });

        if (error) {
          console.error('Error fetching places:', error);
          return;
        }

        if (data.places && data.places.length > 0) {
          setPlaces(data.places);
          setShowPlacesDialog(true);
        } else {
          setPlaces([]);
        }
      } catch (error) {
        console.error('Error fetching places:', error);
      } finally {
        setIsAddressLoading(false);
      }
    };

    if (!isOnline) {
      fetchAddressSuggestions();
    }
  }, [debouncedMerchantName, isOnline]);

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
        
        {!form.watch('isOnline') && (
          <MerchantAddressSelect 
            places={places}
            isLoading={isAddressLoading}
            showDialog={showPlacesDialog}
            setShowDialog={setShowPlacesDialog}
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
