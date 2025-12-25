// components/expense/form/MerchantCategorySelect.tsx
import { useState, useEffect } from "react";
import { MerchantCategoryCode } from "@/types";
import { MCC_CODES } from "@/utils/constants/mcc";
import { Label } from "@/components/ui/label";
import { SearchIcon, InfoIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface MerchantCategorySelectProps {
  selectedMCC?: MerchantCategoryCode | null | undefined;
  onSelectMCC: (mcc: MerchantCategoryCode) => void;
}

const MerchantCategorySelect: React.FC<MerchantCategorySelectProps> = ({
  selectedMCC,
  onSelectMCC,
}) => {
  const [showMCCDialog, setShowMCCDialog] = useState(false);
  const [mccSearchQuery, setMccSearchQuery] = useState("");
  const [filteredMCC, setFilteredMCC] = useState<MerchantCategoryCode[]>([]);

  // Sort MCC_CODES in ascending order by code and set as initial state
  useEffect(() => {
    const sortedMccCodes = [...MCC_CODES].sort((a, b) => {
      return a.code.localeCompare(b.code);
    });
    setFilteredMCC(sortedMccCodes);
  }, []);

  // Filter MCC codes based on search query
  useEffect(() => {
    const sortedMccCodes = [...MCC_CODES].sort((a, b) =>
      a.code.localeCompare(b.code)
    );

    if (mccSearchQuery.trim() === "") {
      setFilteredMCC(sortedMccCodes);
    } else {
      const query = mccSearchQuery.toLowerCase();
      const filtered = sortedMccCodes.filter(
        (mcc) =>
          mcc.description.toLowerCase().includes(query) ||
          mcc.code.includes(query)
      );
      setFilteredMCC(filtered);
    }
  }, [mccSearchQuery]);

  // Determine if the selectedMCC is a valid MerchantCategoryCode object
  const isValidMCC =
    selectedMCC &&
    typeof selectedMCC === "object" &&
    "code" in selectedMCC &&
    "description" in selectedMCC;

  const handleSelectMCC = (mcc: MerchantCategoryCode) => {
    console.log("Selected MCC:", mcc);
    onSelectMCC(mcc);
    setShowMCCDialog(false);
  };

  return (
    <div className="flex flex-col gap-2">
      <Label className="inline-flex items-center gap-1.5">
        Merchant Category
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <InfoIcon className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent>
              <p>Optional - Used for reward calculations</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </Label>
      <Popover open={showMCCDialog} onOpenChange={setShowMCCDialog}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={showMCCDialog}
            className="w-full justify-between h-10 px-3 text-base md:text-sm font-normal"
          >
            <span
              className={`truncate ${!isValidMCC ? "text-muted-foreground" : ""}`}
            >
              {isValidMCC
                ? `${selectedMCC.description} (${selectedMCC.code})`
                : "Select category"}
            </span>
            <SearchIcon
              className="ml-2 h-4 w-4 shrink-0 opacity-50"
              style={{ strokeWidth: 2.5 }}
            />
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
                    <span className="text-xs font-mono text-muted-foreground mr-2">
                      {mcc.code}
                    </span>
                    <span>{mcc.description}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default MerchantCategorySelect;
