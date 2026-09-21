import { useState, useRef, useCallback, useEffect } from "react";
import { useFormContext } from "react-hook-form";
import { StoreIcon, MapPinIcon, ClockIcon } from "lucide-react";
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
import { useRecurringMerchantReminders } from "@/hooks/useRecurringMerchantReminders";
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
  const {
    getNameSuggestions,
    getMerchantByName,
    isLoading: isMerchantsLoading,
  } = useMerchantSuggestions();
  const { data: reminders } = useRecurringMerchantReminders();

  const currentValue = form.watch("merchantName") || "";
  const suggestions = getNameSuggestions(currentValue);

  // Reminders are shown when input is empty OR the reminder's merchant
  // name matches the current query (so they don't clutter searches).
  const query = currentValue.trim().toLowerCase();
  const filteredReminders = reminders.filter((r) => {
    if (query.length === 0) return true;
    return r.merchantName.toLowerCase().includes(query);
  });

  const showDropdown =
    open && (suggestions.length > 0 || filteredReminders.length > 0);

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

    // Wait for historical merchants to load
    if (isMerchantsLoading) return;

    // Mark that we've done the initial lookup
    hasInitialLookupRef.current = true;

    // Check if MCC is already set
    const existingMCC = form.getValues("mcc");
    if (existingMCC) {
      hasAutoAppliedMCCRef.current = true;
      return;
    }

    // Try to lookup MCC from airline/hotel mapping first
    let mcc = getMCCFromMerchantName(currentValue);

    // If no match in static mapping, try historical merchant data
    if (!mcc) {
      const historicalMerchant = getMerchantByName(currentValue);
      if (historicalMerchant?.mcc) {
        mcc = historicalMerchant.mcc;
        console.log("[MerchantNameAutocomplete] Found historical MCC:", {
          currentValue,
          mcc,
        });
      }
    }

    if (mcc) {
      form.setValue("mcc", mcc);
      onSelectMCC?.(mcc);
      hasAutoAppliedMCCRef.current = true;
    }
  }, [
    currentValue,
    isFocused,
    isMerchantsLoading,
    form,
    onSelectMCC,
    getMerchantByName,
  ]);

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

  /**
   * Handle picking a reminder — reuses handleSelect by materializing
   * a MerchantSuggestion. Prefers the merchant's historical address /
   * MCC / online flag via getMerchantByName so the picked reminder
   * auto-fills the form the same way a Previous Merchants pick does.
   */
  const handleReminderSelect = (merchantName: string) => {
    const merchant = getMerchantByName(merchantName);
    handleSelect({
      name: merchantName,
      address: merchant?.address,
      isOnline: merchant?.isOnline ?? false,
      mcc: merchant?.mcc,
      count: 0,
    });
  };

  const reminderRightLabel = (daysUntilExpected: number): string => {
    if (daysUntilExpected === 0) return "due today";
    if (daysUntilExpected > 0) return `in ${daysUntilExpected}d`;
    return `${Math.abs(daysUntilExpected)}d ago`;
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
                  // Open the popover on focus when EITHER previous
                  // merchant suggestions apply to the current query OR
                  // recurring reminders are available (so a fresh
                  // form-open on a due-date day surfaces them without
                  // requiring the user to type first).
                  if (
                    (currentValue.length >= 2 && suggestions.length > 0) ||
                    filteredReminders.length > 0
                  ) {
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

                    {filteredReminders.length > 0 && (
                      <CommandGroup heading="Recurring today">
                        {filteredReminders.map((reminder) => (
                          <CommandItem
                            key={`reminder-${reminder.merchantName}`}
                            onSelect={() =>
                              handleReminderSelect(reminder.merchantName)
                            }
                            className="cursor-pointer"
                          >
                            <ClockIcon className="mr-2 h-4 w-4 flex-shrink-0 opacity-70" />
                            <div className="flex flex-col overflow-hidden">
                              <span className="truncate font-medium">
                                {reminder.merchantName}
                              </span>
                              <span className="text-xs text-muted-foreground truncate">
                                ~${reminder.expectedAmount.toFixed(2)} ·{" "}
                                {reminderRightLabel(reminder.daysUntilExpected)}
                              </span>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    )}

                    {suggestions.length > 0 && (
                      <CommandGroup heading="Previous Merchants">
                        {suggestions.map((suggestion, index) => (
                          <CommandItem
                            key={`${suggestion.name}-${index}`}
                            onSelect={() => handleSelect(suggestion)}
                            className="cursor-pointer"
                          >
                            <StoreIcon className="mr-2 h-4 w-4 flex-shrink-0 opacity-70" />
                            <div className="flex flex-col overflow-hidden">
                              <span className="truncate">
                                {suggestion.name}
                              </span>
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
                    )}
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
