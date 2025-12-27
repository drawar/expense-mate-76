import { useState, useRef, useCallback, useEffect } from "react";
import { useFormContext } from "react-hook-form";
import { StoreIcon, MapPinIcon } from "lucide-react";
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
import {
  useMerchantSuggestions,
  MerchantSuggestion,
} from "@/hooks/useMerchantSuggestions";
import { MerchantCategoryCode } from "@/types";
import { getMCCFromMerchantName } from "@/utils/constants/merchantMccMapping";

interface MerchantNameAutocompleteProps {
  onSelectMerchant?: (suggestion: MerchantSuggestion) => void;
  onSelectMCC?: (mcc: MerchantCategoryCode) => void;
}

const MerchantNameAutocomplete: React.FC<MerchantNameAutocompleteProps> = ({
  onSelectMerchant,
  onSelectMCC,
}) => {
  const form = useFormContext();
  const [open, setOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const hasAutoAppliedMCCRef = useRef(false);
  const { getNameSuggestions } = useMerchantSuggestions();

  const currentValue = form.watch("merchantName") || "";
  const suggestions = getNameSuggestions(currentValue);
  const showDropdown = open && suggestions.length > 0;

  // Track if we've done the initial MCC lookup for pre-filled values
  const hasInitialLookupRef = useRef(false);

  // Auto-lookup MCC when merchant name is pre-filled (runs once when value becomes available)
  useEffect(() => {
    // Skip if we've already done the initial lookup
    if (hasInitialLookupRef.current) return;

    // Skip if no merchant name or too short
    if (!currentValue || currentValue.length < 3) return;

    // Skip if user is actively typing (focused)
    if (isFocused) return;

    // Mark that we've done the initial lookup
    hasInitialLookupRef.current = true;

    // Check if MCC is already set
    const existingMCC = form.getValues("mcc");
    if (existingMCC) {
      hasAutoAppliedMCCRef.current = true;
      return;
    }

    // Try to lookup MCC from pre-filled merchant name
    const mcc = getMCCFromMerchantName(currentValue);
    console.log("[MerchantNameAutocomplete] Initial MCC lookup:", {
      currentValue,
      mcc,
    });
    if (mcc) {
      form.setValue("mcc", mcc);
      onSelectMCC?.(mcc);
      hasAutoAppliedMCCRef.current = true;
    }
  }, [currentValue, isFocused, form, onSelectMCC]);

  // Auto-lookup MCC when merchant name changes while focused
  useEffect(() => {
    if (!isFocused) return;

    const mcc = getMCCFromMerchantName(currentValue);
    if (mcc) {
      // Match found - show it
      form.setValue("mcc", mcc);
      onSelectMCC?.(mcc);
      hasAutoAppliedMCCRef.current = true;
    } else if (hasAutoAppliedMCCRef.current) {
      // No match - clear to "Select category"
      form.setValue("mcc", null);
      hasAutoAppliedMCCRef.current = false;
    }
  }, [currentValue, isFocused, form, onSelectMCC]);

  const handleSelect = (suggestion: MerchantSuggestion) => {
    form.setValue("merchantName", suggestion.name);

    // Auto-fill address if available and merchant is not online
    if (suggestion.address && !suggestion.isOnline) {
      form.setValue("merchantAddress", suggestion.address);
    }

    // Auto-fill isOnline toggle
    form.setValue("isOnline", suggestion.isOnline);

    // Auto-fill MCC if available from suggestion (past data)
    if (suggestion.mcc) {
      form.setValue("mcc", suggestion.mcc);
      onSelectMCC?.(suggestion.mcc);
      hasAutoAppliedMCCRef.current = true;
    } else {
      // Try to lookup MCC from merchant name (airlines/hotels)
      const mcc = getMCCFromMerchantName(suggestion.name);
      if (mcc) {
        form.setValue("mcc", mcc);
        onSelectMCC?.(mcc);
        hasAutoAppliedMCCRef.current = true;
      }
    }

    setOpen(false);
    onSelectMerchant?.(suggestion);
  };

  return (
    <FormField
      control={form.control}
      name="merchantName"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Merchant Name</FormLabel>
          <div className="relative" ref={containerRef}>
            <FormControl>
              <MossInput
                placeholder="Enter merchant name"
                {...field}
                value={field.value || ""}
                onChange={(e) => {
                  field.onChange(e);
                  const value = e.target.value;
                  if (value.length >= 2) {
                    setOpen(true);
                  } else {
                    setOpen(false);
                  }
                  // MCC lookup handled by useEffect watching currentValue
                }}
                onFocus={() => {
                  setIsFocused(true);
                  if (currentValue.length >= 2 && suggestions.length > 0) {
                    setOpen(true);
                  }
                  // MCC lookup handled by useEffect watching isFocused
                }}
                onBlur={() => {
                  setIsFocused(false);
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
                    <CommandGroup heading="Previous Merchants">
                      {suggestions.map((suggestion, index) => (
                        <CommandItem
                          key={`${suggestion.name}-${index}`}
                          onSelect={() => handleSelect(suggestion)}
                          className="cursor-pointer"
                        >
                          <StoreIcon className="mr-2 h-4 w-4 flex-shrink-0 opacity-70" />
                          <div className="flex flex-col overflow-hidden">
                            <span className="truncate">{suggestion.name}</span>
                            {suggestion.address && (
                              <span className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                                <MapPinIcon className="h-3 w-3 flex-shrink-0" />
                                {suggestion.address}
                              </span>
                            )}
                          </div>
                          <span className="ml-auto text-xs text-muted-foreground">
                            {suggestion.count}x
                          </span>
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

export default MerchantNameAutocomplete;
