
import { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { MapPinIcon, LucideLoader } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import {
  CommandDialog,
  CommandGroup as CommandDialogGroup,
  CommandEmpty as CommandDialogEmpty,
  CommandInput as CommandDialogInput,
  CommandItem as CommandDialogItem,
  CommandList as CommandDialogList,
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
  places, 
  isLoading, 
  showDialog, 
  setShowDialog 
}: MerchantAddressSelectProps) => {
  const form = useFormContext();
  const { toast } = useToast();

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
                    if (places.length > 0) {
                      setShowDialog(true);
                    }
                  }}
                />
                {isLoading ? (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 animate-spin">
                    <LucideLoader className="h-4 w-4 text-gray-400" />
                  </div>
                ) : (
                  <MapPinIcon 
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 cursor-pointer" 
                    onClick={() => {
                      if (places.length > 0) {
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

      {/* Places Selection Dialog */}
      <CommandDialog open={showDialog} onOpenChange={setShowDialog}>
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
    </>
  );
};

export default MerchantAddressSelect;
