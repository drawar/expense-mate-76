import { useState } from "react";
import { useFormContext } from "react-hook-form";
import { MapPinIcon } from "lucide-react";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { MossInput } from "@/components/ui/moss-input";
import { useMerchantSuggestions } from "@/hooks/useMerchantSuggestions";

interface MerchantAddressAutocompleteProps {
  onSelectAddress?: (address: string) => void;
}

const MerchantAddressAutocomplete: React.FC<
  MerchantAddressAutocompleteProps
> = ({ onSelectAddress }) => {
  const form = useFormContext();
  const [open, setOpen] = useState(false);
  const { getAddressSuggestions } = useMerchantSuggestions();

  const merchantName = form.watch("merchantName") || "";
  const currentValue = form.watch("merchantAddress") || "";
  const suggestions = getAddressSuggestions(currentValue, merchantName);
  const showDropdown = open && suggestions.length > 0;

  const handleSelect = (address: string) => {
    form.setValue("merchantAddress", address);
    setOpen(false);
    onSelectAddress?.(address);
  };

  return (
    <FormField
      control={form.control}
      name="merchantAddress"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Merchant Address</FormLabel>
          <div className="relative">
            <FormControl>
              <MossInput
                placeholder="Enter merchant address (optional)"
                {...field}
                value={field.value || ""}
                onChange={(e) => {
                  field.onChange(e);
                  if (e.target.value.length >= 2) {
                    setOpen(true);
                  } else {
                    setOpen(false);
                  }
                }}
                onFocus={() => {
                  if (currentValue.length >= 2 && suggestions.length > 0) {
                    setOpen(true);
                  }
                }}
                onBlur={() => {
                  // Delay closing to allow click on suggestion
                  setTimeout(() => setOpen(false), 150);
                }}
              />
            </FormControl>
            {showDropdown && (
              <div className="absolute top-full left-0 z-50 mt-1 w-full rounded-md border bg-popover shadow-md">
                <Command>
                  <CommandList>
                    <CommandEmpty>No suggestions found</CommandEmpty>
                    <CommandGroup heading="Previous Addresses">
                      {suggestions.map((address, index) => (
                        <CommandItem
                          key={`${address}-${index}`}
                          onSelect={() => handleSelect(address)}
                          className="cursor-pointer"
                        >
                          <MapPinIcon className="mr-2 h-4 w-4 flex-shrink-0 opacity-70" />
                          <span className="truncate">{address}</span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </div>
            )}
          </div>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export default MerchantAddressAutocomplete;
