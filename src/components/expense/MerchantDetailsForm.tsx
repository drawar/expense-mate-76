
import { useState, useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import { MerchantCategoryCode } from '@/types';
import { MCC_CODES, getMerchantByName } from '@/utils/storageUtils';
import { Input } from '@/components/ui/input';
import { MapPinIcon, StoreIcon, TagIcon, LucideLoader } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { useDebounce } from '@/hooks/use-debounce';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { useToast } from '@/hooks/use-toast';

const MerchantDetailsForm = () => {
  const form = useFormContext();
  const [selectedMCC, setSelectedMCC] = useState<MerchantCategoryCode | undefined>();
  const [isAddressLoading, setIsAddressLoading] = useState(false);
  const [places, setPlaces] = useState<Array<{name: string, address: string, location: {lat: number, lng: number}}>>([]);
  const [showPlacesDialog, setShowPlacesDialog] = useState(false);
  const { toast } = useToast();
  
  // When merchant name changes, check for existing merchant data
  const merchantName = form.watch('merchantName');
  const debouncedMerchantName = useDebounce(merchantName, 500);
  const isOnline = form.watch('isOnline');
  
  useEffect(() => {
    if (merchantName.trim().length >= 3) {
      const existingMerchant = getMerchantByName(merchantName);
      if (existingMerchant?.mcc) {
        setSelectedMCC(existingMerchant.mcc);
      }
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

  const handleSelectPlace = (place: {name: string, address: string}) => {
    form.setValue('merchantAddress', place.address, { shouldValidate: true });
    setShowPlacesDialog(false);
    
    toast({
      title: "Address selected",
      description: `Selected address: ${place.address}`,
    });
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
        
        <div className="flex items-center space-x-2">
          <FormField
            control={form.control}
            name="isOnline"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                <div className="space-y-0.5">
                  <FormLabel>Online Merchant</FormLabel>
                  <FormDescription>
                    Toggle if this is an online merchant
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>
        
        {!form.watch('isOnline') && (
          <FormField
            control={form.control}
            name="merchantAddress"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Merchant Address</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input 
                      placeholder="Enter merchant address" 
                      {...field}
                      onClick={() => {
                        if (places.length > 0) {
                          setShowPlacesDialog(true);
                        }
                      }}
                    />
                    {isAddressLoading ? (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 animate-spin">
                        <LucideLoader className="h-4 w-4 text-gray-400" />
                      </div>
                    ) : (
                      <MapPinIcon 
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 cursor-pointer" 
                        onClick={() => {
                          if (places.length > 0) {
                            setShowPlacesDialog(true);
                          }
                        }}
                      />
                    )}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        
        <div>
          <Label>Merchant Category</Label>
          <Select 
            value={selectedMCC?.code} 
            onValueChange={(value) => {
              const mcc = MCC_CODES.find(m => m.code === value);
              setSelectedMCC(mcc);
            }}
          >
            <SelectTrigger className="w-full mt-1">
              <SelectValue placeholder="Select merchant category" />
            </SelectTrigger>
            <SelectContent>
              {MCC_CODES.map((mcc) => (
                <SelectItem key={mcc.code} value={mcc.code}>
                  {mcc.description} ({mcc.code})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground mt-1">
            {selectedMCC ? (
              <span className="flex items-center">
                <TagIcon className="h-3.5 w-3.5 mr-1.5" />
                {selectedMCC.description} ({selectedMCC.code})
              </span>
            ) : (
              "Optional - Select a merchant category code"
            )}
          </p>
        </div>

        {/* Places Selection Dialog */}
        <CommandDialog open={showPlacesDialog} onOpenChange={setShowPlacesDialog}>
          <CommandInput placeholder="Search places..." />
          <CommandList>
            <CommandEmpty>No places found.</CommandEmpty>
            <CommandGroup heading="Suggested Places">
              {places.map((place, index) => (
                <CommandItem
                  key={index}
                  onSelect={() => handleSelectPlace(place)}
                  className="cursor-pointer"
                >
                  <div className="flex flex-col">
                    <span className="font-medium">{place.name}</span>
                    <span className="text-sm text-muted-foreground">{place.address}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </CommandDialog>
      </CardContent>
    </Card>
  );
};

export default MerchantDetailsForm;
