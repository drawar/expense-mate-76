import React, { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Search, Check } from "lucide-react";

export interface SelectionOption {
  value: string;
  label: string;
  description?: string;
}

interface SelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (value: string) => void;
  onCloseAll: () => void;
  title: string;
  options: SelectionOption[];
  selectedValue?: string;
  searchable?: boolean;
  searchPlaceholder?: string;
}

const SelectionDialog: React.FC<SelectionDialogProps> = ({
  open,
  onOpenChange,
  onSelect,
  onCloseAll,
  title,
  options,
  selectedValue,
  searchable = false,
  searchPlaceholder = "Search...",
}) => {
  const [searchQuery, setSearchQuery] = useState("");

  // Filter options based on search query
  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return options;

    const query = searchQuery.toLowerCase();
    return options.filter(
      (option) =>
        option.label.toLowerCase().includes(query) ||
        option.description?.toLowerCase().includes(query)
    );
  }, [options, searchQuery]);

  const handleSelect = (value: string) => {
    onSelect(value);
    onOpenChange(false);
  };

  const handleBack = () => {
    setSearchQuery("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleBack}>
      <DialogContent
        className="sm:max-w-lg gap-0 p-0"
        hideCloseButton
        hideOverlay
      >
        <DialogHeader
          className="border-b"
          showBackButton
          onBack={handleBack}
          showCloseButton
          onClose={onCloseAll}
        >
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div>
          {/* Search Input */}
          {searchable && (
            <div className="px-4 pt-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={searchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  autoFocus
                />
              </div>
            </div>
          )}

          {/* Options List */}
          <div
            className="max-h-[60vh] overflow-y-auto px-4 py-4 overscroll-contain"
            onWheel={(e) => e.stopPropagation()}
          >
            <div className="space-y-1">
              {filteredOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  className="w-full px-4 py-3 rounded-xl text-left transition-colors flex items-center justify-between hover:bg-accent"
                  style={{
                    backgroundColor:
                      selectedValue === option.value
                        ? "var(--color-bg-secondary)"
                        : undefined,
                  }}
                >
                  <div>
                    <div
                      className="font-medium"
                      style={{ color: "var(--color-text-primary)" }}
                    >
                      {option.label}
                    </div>
                    {option.description && (
                      <div
                        className="text-xs mt-0.5"
                        style={{ color: "var(--color-text-tertiary)" }}
                      >
                        {option.description}
                      </div>
                    )}
                  </div>
                  {selectedValue === option.value && (
                    <Check
                      className="h-5 w-5 shrink-0"
                      style={{ color: "var(--color-accent)" }}
                    />
                  )}
                </button>
              ))}

              {filteredOptions.length === 0 && (
                <div
                  className="text-center py-8"
                  style={{ color: "var(--color-text-tertiary)" }}
                >
                  No options found
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SelectionDialog;
