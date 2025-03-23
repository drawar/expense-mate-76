
import { useState, useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import { MerchantCategoryCode } from '@/types';
import { MCC_CODES, getMerchantByName } from '@/utils/storageUtils';
import { Input } from '@/components/ui/input';
import { MapPinIcon, StoreIcon, TagIcon, LucideLoader, SearchIcon } from 'lucide-react';
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
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  CommandDialog,
  CommandGroup as CommandDialogGroup,
  CommandEmpty as CommandDialogEmpty,
  CommandInput as CommandDialogInput,
  CommandItem as CommandDialogItem,
  CommandList as CommandDialogList,
} from '@/components/ui/command';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const MerchantDetailsForm = () => {
  const form = useFormContext();
  const [selectedMCC, setSelectedMCC] = useState<MerchantCategoryCode | undefined>();
  const [isAddressLoading, setIsAddressLoading] = useState(false);
  const [places, setPlaces] = useState<Array<{name: string, address: string, location: {lat: number, lng: number}}>>([]);
  const [showPlacesDialog, setShowPlacesDialog] = useState(false);
  const [showMCCDialog, setShowMCCDialog] = useState(false);
  const [mccSearchQuery, setMccSearchQuery] = useState('');
  const [filteredMCC, setFilteredMCC] = useState(MCC_CODES);
  const { toast } = useToast();
  
  // When merchant name changes, check for existing merchant data
  const merchantName = form.watch('merchantName');
  const debouncedMerchantName = useDebounce(merchantName, 500);
  const isOnline = form.watch('isOnline');
  
  // Filter MCC codes based on search query
  useEffect(() => {
    if (mccSearchQuery.trim() === '') {
      setFilteredMCC(MCC_CODES);
    } else {
      const query = mccSearchQuery.toLowerCase();
      const filtered = MCC_CODES.filter(
        mcc => 
          mcc.description.toLowerCase().includes(query) || 
          mcc.code.includes(query)
      );
      setFilteredMCC(filtered);
    }
  }, [mccSearchQuery]);
  
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

  const handleSelectPlace = (place: {name: string, address: string}) => {
    form.setValue('merchantAddress', place.address, { shouldValidate: true });
    setShowPlacesDialog(false);
    
    toast({
      title: "Address selected",
      description: `Selected address: ${place.address}`,
    });
  };

  const handleSelectMCC = (mcc: MerchantCategoryCode) => {
    setSelectedMCC(mcc);
    form.setValue('mcc', mcc);
    setShowMCCDialog(false);

    toast({
      title: "Category selected",
      description: `Selected category: ${mcc.description} (${mcc.code})`,
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
          <Popover open={showMCCDialog} onOpenChange={setShowMCCDialog}>
            <PopoverTrigger asChild>
              <Button 
                variant="outline" 
                role="combobox" 
                aria-expanded={showMCCDialog}
                className="w-full justify-between mt-1"
              >
                {selectedMCC ? `${selectedMCC.description} (${selectedMCC.code})` : "Select merchant category"}
                <SearchIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0">
              <Command>
                <CommandInput 
                  placeholder="Search categories..." 
                  value={mccSearchQuery}
                  onValueChange={setMccSearchQuery}
                />
                <CommandList>
                  <CommandEmpty>No categories found.</CommandEmpty>
                  <CommandGroup>
                    {filteredMCC.map((mcc) => (
                      <CommandItem
                        key={mcc.code}
                        onSelect={() => handleSelectMCC(mcc)}
                        className="cursor-pointer"
                      >
                        <span>{mcc.description}</span>
                        <span className="ml-2 text-xs text-muted-foreground">({mcc.code})</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          <p className="text-sm text-muted-foreground mt-1">
            {selectedMCC ? (
              <span className="flex items-center">
                <TagIcon className="h-3.5 w-3.5 mr-1.5" />
                {selectedMCC.description} ({selectedMCC.code})
              </span>
            ) : (
              "Optional - Search and select a merchant category code"
            )}
          </p>
        </div>

        {/* Places Selection Dialog */}
        <CommandDialog open={showPlacesDialog} onOpenChange={setShowPlacesDialog}>
          <CommandDialogInput placeholder="Search places..." />
          <CommandDialogList>
            <CommandDialogEmpty>No places found.</CommandDialogEmpty>
            <CommandDialogGroup heading="Suggested Places">
              {places.map((place, index) => (
                <CommandDialogItem
                  key={index}
                  onSelect={() => handleSelectPlace(place)}
                  className="cursor-pointer"
                >
                  <div className="flex flex-col">
                    <span className="font-medium">{place.name}</span>
                    <span className="text-sm text-muted-foreground">{place.address}</span>
                  </div>
                </CommandDialogItem>
              ))}
            </CommandDialogGroup>
          </CommandDialogList>
        </CommandDialog>
      </CardContent>
    </Card>
  );
};

export default MerchantDetailsForm;
