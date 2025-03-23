
import { useState, useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import { MapPinIcon, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import {
  CommandDialog,
  CommandGroup,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';

interface Place {
  name: string;
  address: string;
  location?: {
    lat: number;
    lng: number;
  };
}

interface MerchantAddressSelectProps {
  places: Place[];
  isLoading: boolean;
  showDialog: boolean;
  setShowDialog: (show: boolean) => void;
}

const MerchantAddressSelect = ({ 
  places = [], 
  isLoading, 
  showDialog, 
  setShowDialog 
}: MerchantAddressSelectProps) => {
  const form = useFormContext();
  const { toast } = useToast();
  const [safePlaces, setSafePlaces] = useState<Place[]>([]);
  const [isDialogReady, setIsDialogReady] = useState(false);

  // Process places into safe state
  useEffect(() => {
    setSafePlaces(Array.isArray(places) ? places : []);
  }, [places]);

  // Make sure dialog is only shown after places are processed
  useEffect(() => {
    setIsDialogReady(true);
  }, []);

  const handleSelectPlace = (place: Place) => {
    form.setValue('merchantAddress', place.address, { shouldValidate: true });
    setShowDialog(false);
    
    toast({
      title: "Address selected",
      description: `Selected address: ${place.address}`,
    });
  };

  return (
    <>
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
                    if (safePlaces.length > 0) {
                      setShowDialog(true);
                    }
                  }}
                />
                {isLoading ? (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 animate-spin">
                    <Loader2 className="h-4 w-4 text-gray-400" />
                  </div>
                ) : (
                  <MapPinIcon 
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 cursor-pointer" 
                    onClick={() => {
                      if (safePlaces.length > 0) {
                        setShowDialog(true);
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

      {isDialogReady && showDialog && (
        <CommandDialog open={showDialog} onOpenChange={setShowDialog}>
          <CommandInput placeholder="Search places..." />
          <CommandList>
            <CommandEmpty>No places found.</CommandEmpty>
            {safePlaces.length > 0 && (
              <CommandGroup heading="Suggested Places">
                {safePlaces.map((place, index) => (
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
            )}
          </CommandList>
        </CommandDialog>
      )}
    </>
  );
};

export default MerchantAddressSelect;
