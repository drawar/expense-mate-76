
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

interface Place {
  name: string;
  address: string;
  location: {
    lat: number;
    lng: number;
  };
}

const MerchantDetailsForm = () => {
  const form = useFormContext();
  const [selectedMCC, setSelectedMCC] = useState<MerchantCategoryCode | undefined>();
  const [isAddressLoading, setIsAddressLoading] = useState(false);
  const [places, setPlaces] = useState<Place[]>([]);
  const [showPlacesDialog, setShowPlacesDialog] = useState(false);
  const { toast } = useToast();
  
  // When merchant name changes, check for existing merchant data
  const merchantName = form.watch('merchantName');
  const debouncedMerchantName = useDebounce(merchantName, 500);
  const isOnline = form.watch('isOnline');
  
  useEffect(() => {
    const fetchMerchantData = async () => {
      if (merchantName.trim().length >= 3) {
        try {
          const existingMerchant = await getMerchantByName(merchantName);
          if (existingMerchant?.mcc) {
            setSelectedMCC(existingMerchant.mcc);
            form.setValue('mcc', existingMerchant.mcc);
            // Show toast to inform user about the suggested category
            toast({
              title: "Merchant category suggested",
              description: `Using ${existingMerchant.mcc.description} (${existingMerchant.mcc.code}) based on previous entries`,
            });
          }
        } catch (error) {
          console.error('Error fetching merchant data:', error);
        }
      }
    };
    
    fetchMerchantData();
  }, [merchantName, form, toast]);

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

  const handleSelectMCC = (mcc: MerchantCategoryCode) => {
    setSelectedMCC(mcc);
    form.setValue('mcc', mcc);
  };

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
          onSelectMCC={handleSelectMCC}
        />
      </CardContent>
    </Card>
  );
};

export default MerchantDetailsForm;
