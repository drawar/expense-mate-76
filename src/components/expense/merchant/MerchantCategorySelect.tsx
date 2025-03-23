
import { useState } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { MCC_CODES } from '@/utils/constants/mcc';
import { MerchantCategoryCode } from '@/types';

interface MerchantCategorySelectProps {
  selected?: MerchantCategoryCode | null;
  onSelect: (category: MerchantCategoryCode) => void;
  // For backward compatibility with MerchantDetailsForm.tsx
  selectedMCC?: MerchantCategoryCode;
  onSelectMCC?: (mcc: MerchantCategoryCode) => void;
}

const MerchantCategorySelect = ({ 
  selected, 
  onSelect,
  selectedMCC,
  onSelectMCC
}: MerchantCategorySelectProps) => {
  const [open, setOpen] = useState(false);
  
  // Use either the new or old prop naming based on what's provided
  const effectiveSelected = selected || selectedMCC || null;
  const effectiveOnSelect = onSelect || onSelectMCC || (() => {});
  
  // Always ensure we have an array of MCC codes
  const mccCodes = Array.isArray(MCC_CODES) ? MCC_CODES : [];
  
  // Sort MCC codes by the numeric code (only if we have mccCodes)
  const sortedMccCodes = mccCodes.length > 0 
    ? [...mccCodes].sort((a, b) => a.code.localeCompare(b.code))
    : [];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {effectiveSelected
            ? `${effectiveSelected.code} - ${effectiveSelected.description}`
            : "Select category code"}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        {open && sortedMccCodes.length > 0 && (
          <Command>
            <CommandInput placeholder="Search category code..." />
            <CommandEmpty>No category code found.</CommandEmpty>
            <CommandGroup className="max-h-64 overflow-y-auto">
              {sortedMccCodes.map((mccItem) => (
                <CommandItem
                  key={mccItem.code}
                  value={`${mccItem.code} ${mccItem.description}`}
                  onSelect={() => {
                    effectiveOnSelect(mccItem);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      effectiveSelected?.code === mccItem.code ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <span className="font-mono">{mccItem.code}</span> - {mccItem.description}
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        )}
        {open && sortedMccCodes.length === 0 && (
          <div className="py-6 text-center text-sm">No category codes available.</div>
        )}
      </PopoverContent>
    </Popover>
  );
};

export default MerchantCategorySelect;
