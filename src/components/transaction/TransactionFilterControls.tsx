import React, { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Calendar } from "@/components/ui/calendar";
import {
  CalendarIcon,
  FilterIcon,
  XIcon,
  SearchIcon,
  Check,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format, startOfDay, endOfDay } from "date-fns";
import { DateRange } from "react-day-picker";
import { PaymentMethod } from "@/types";
import { FilterOptions } from "@/hooks/expense/useTransactionList";
import { PaymentMethodItemContent } from "@/components/ui/payment-method-select-item";

interface TransactionFilterControlsProps {
  filters: FilterOptions;
  onFiltersChange: (
    name: keyof FilterOptions,
    value: FilterOptions[keyof FilterOptions]
  ) => void;
  paymentMethods: PaymentMethod[];
  categories: string[];
  onClearFilters: () => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
}

export const TransactionFilterControls: React.FC<
  TransactionFilterControlsProps
> = ({
  filters,
  onFiltersChange,
  paymentMethods,
  categories,
  onClearFilters,
  searchQuery = "",
  onSearchChange,
}) => {
  // Category search state
  const [categorySearchOpen, setCategorySearchOpen] = useState(false);
  const [categorySearchQuery, setCategorySearchQuery] = useState("");

  // Payment method search state
  const [paymentMethodSearchOpen, setPaymentMethodSearchOpen] = useState(false);
  const [paymentMethodSearchQuery, setPaymentMethodSearchQuery] = useState("");

  // Filter categories based on search query
  const filteredCategories = useMemo(() => {
    const sorted = [...categories].sort((a, b) => a.localeCompare(b));
    if (!categorySearchQuery.trim()) return sorted;
    const query = categorySearchQuery.toLowerCase();
    return sorted.filter((cat) => cat.toLowerCase().includes(query));
  }, [categories, categorySearchQuery]);

  // Filter payment methods based on search query
  const filteredPaymentMethods = useMemo(() => {
    const sorted = [...paymentMethods].sort((a, b) =>
      a.name.localeCompare(b.name)
    );
    if (!paymentMethodSearchQuery.trim()) return sorted;
    const query = paymentMethodSearchQuery.toLowerCase();
    return sorted.filter(
      (pm) =>
        pm.name.toLowerCase().includes(query) ||
        pm.issuer?.toLowerCase().includes(query) ||
        pm.lastFourDigits?.includes(query)
    );
  }, [paymentMethods, paymentMethodSearchQuery]);

  // Ensure filters is never null/undefined
  const safeFilters = filters || {
    paymentMethods: [],
    dateRange: { from: null, to: null },
    merchants: [],
    categories: [],
    currencies: [],
  };

  // Safe check for active filters
  const hasActiveFilters = (() => {
    try {
      // Check searchQuery first
      if (searchQuery.trim() !== "") return true;

      return Object.values(safeFilters).some((value) => {
        if (Array.isArray(value)) return value.length > 0;
        if (value && typeof value === "object" && "from" in value) {
          return value.from !== null || value.to !== null;
        }
        if (typeof value === "boolean") return value === true;
        if (typeof value === "string") return value.trim() !== "";
        return value !== null && value !== undefined;
      });
    } catch (error) {
      console.warn("Error checking active filters:", error);
      return false;
    }
  })();

  const updateFilter = (
    key: keyof FilterOptions,
    value: FilterOptions[keyof FilterOptions]
  ) => {
    onFiltersChange(key, value);
  };

  // Toggle payment method selection
  const togglePaymentMethod = (methodId: string) => {
    const current = safeFilters.paymentMethods || [];
    const newSelection = current.includes(methodId)
      ? current.filter((id) => id !== methodId)
      : [...current, methodId];
    updateFilter("paymentMethods", newSelection);
  };

  // Toggle category selection
  const toggleCategory = (category: string) => {
    const current = safeFilters.categories || [];
    const newSelection = current.includes(category)
      ? current.filter((c) => c !== category)
      : [...current, category];
    updateFilter("categories", newSelection);
  };

  return (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <FilterIcon className="h-4 w-4" />
            <span className="font-medium">Filters</span>
          </div>
          {hasActiveFilters && (
            <Button variant="outline" size="sm" onClick={onClearFilters}>
              <XIcon className="h-4 w-4 mr-1" />
              Clear All
            </Button>
          )}
        </div>

        <div className="space-y-4">
          {/* Merchant Search */}
          {onSearchChange && (
            <div>
              <label className="text-sm font-medium mb-1 block">
                Search Merchant
              </label>
              <Input
                type="text"
                placeholder="Search by merchant name..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full"
              />
            </div>
          )}

          {/* Payment Method and Category - stacked */}
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">
                Payment Method
              </label>
              <Popover
                open={paymentMethodSearchOpen}
                onOpenChange={setPaymentMethodSearchOpen}
              >
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={paymentMethodSearchOpen}
                    className="w-full justify-between h-10 px-3 text-base md:text-sm font-normal"
                  >
                    <span
                      className={`truncate ${
                        !safeFilters.paymentMethods?.length
                          ? "text-muted-foreground"
                          : ""
                      }`}
                    >
                      {safeFilters.paymentMethods?.length === 1
                        ? paymentMethods.find(
                            (pm) => pm.id === safeFilters.paymentMethods[0]
                          )?.name || "All methods"
                        : safeFilters.paymentMethods?.length > 1
                          ? `${safeFilters.paymentMethods.length} methods`
                          : "All methods"}
                    </span>
                    <SearchIcon
                      className="ml-2 h-4 w-4 shrink-0 opacity-50"
                      style={{ strokeWidth: 2.5 }}
                    />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                  <Command shouldFilter={false}>
                    <CommandInput
                      placeholder="Search payment methods..."
                      value={paymentMethodSearchQuery}
                      onValueChange={setPaymentMethodSearchQuery}
                    />
                    <CommandList>
                      <CommandEmpty>No payment methods found.</CommandEmpty>
                      <CommandGroup>
                        {safeFilters.paymentMethods?.length > 0 && (
                          <CommandItem
                            value="__clear_methods__"
                            onSelect={() => {
                              updateFilter("paymentMethods", []);
                            }}
                            className="cursor-pointer text-muted-foreground"
                          >
                            <XIcon className="mr-2 h-4 w-4" />
                            Clear selection
                          </CommandItem>
                        )}
                        {filteredPaymentMethods.map((method) => {
                          const isSelected =
                            safeFilters.paymentMethods?.includes(method.id);
                          return (
                            <CommandItem
                              key={method.id}
                              value={method.id}
                              onSelect={() => togglePaymentMethod(method.id)}
                              className="cursor-pointer"
                            >
                              <div className="flex items-center gap-2 w-full">
                                <div
                                  className={`flex h-4 w-4 shrink-0 items-center justify-center border ${isSelected ? "bg-primary border-primary" : "border-muted-foreground/50"}`}
                                >
                                  {isSelected && (
                                    <Check className="h-3 w-3 text-primary-foreground" />
                                  )}
                                </div>
                                <PaymentMethodItemContent
                                  method={method}
                                  size="sm"
                                />
                              </div>
                            </CommandItem>
                          );
                        })}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Category</label>
              <Popover
                open={categorySearchOpen}
                onOpenChange={setCategorySearchOpen}
              >
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={categorySearchOpen}
                    className="w-full justify-between h-10 px-3 text-base md:text-sm font-normal"
                  >
                    <span
                      className={`truncate ${
                        !safeFilters.categories?.length
                          ? "text-muted-foreground"
                          : ""
                      }`}
                    >
                      {safeFilters.categories?.length === 1
                        ? safeFilters.categories[0]
                        : safeFilters.categories?.length > 1
                          ? `${safeFilters.categories.length} categories`
                          : "All categories"}
                    </span>
                    <SearchIcon
                      className="ml-2 h-4 w-4 shrink-0 opacity-50"
                      style={{ strokeWidth: 2.5 }}
                    />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                  <Command shouldFilter={false}>
                    <CommandInput
                      placeholder="Search categories..."
                      value={categorySearchQuery}
                      onValueChange={setCategorySearchQuery}
                    />
                    <CommandList>
                      <CommandEmpty>No categories found.</CommandEmpty>
                      <CommandGroup>
                        {safeFilters.categories?.length > 0 && (
                          <CommandItem
                            value="__clear_categories__"
                            onSelect={() => {
                              updateFilter("categories", []);
                            }}
                            className="cursor-pointer text-muted-foreground"
                          >
                            <XIcon className="mr-2 h-4 w-4" />
                            Clear selection
                          </CommandItem>
                        )}
                        {filteredCategories.map((category) => {
                          const isSelected =
                            safeFilters.categories?.includes(category);
                          return (
                            <CommandItem
                              key={category}
                              value={category}
                              onSelect={() => toggleCategory(category)}
                              className="cursor-pointer"
                            >
                              <div className="flex items-center gap-2 w-full">
                                <div
                                  className={`flex h-4 w-4 shrink-0 items-center justify-center border ${isSelected ? "bg-primary border-primary" : "border-muted-foreground/50"}`}
                                >
                                  {isSelected && (
                                    <Check className="h-3 w-3 text-primary-foreground" />
                                  )}
                                </div>
                                <span>{category}</span>
                              </div>
                            </CommandItem>
                          );
                        })}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Date Range */}
          <div>
            <label className="text-sm font-medium mb-1 block">Date Range</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left text-base md:text-sm font-normal overflow-hidden"
                >
                  <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                  <span className="truncate">
                    {safeFilters.dateRange?.from ? (
                      safeFilters.dateRange?.to ? (
                        <>
                          {format(safeFilters.dateRange.from, "MMM d, yyyy")} -{" "}
                          {format(safeFilters.dateRange.to, "MMM d, yyyy")}
                        </>
                      ) : (
                        format(safeFilters.dateRange.from, "MMM d, yyyy")
                      )
                    ) : (
                      <span className="text-muted-foreground">
                        Pick a date range
                      </span>
                    )}
                  </span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="range"
                  defaultMonth={safeFilters.dateRange?.from || undefined}
                  selected={{
                    from: safeFilters.dateRange?.from || undefined,
                    to: safeFilters.dateRange?.to || undefined,
                  }}
                  onSelect={(range: DateRange | undefined) => {
                    updateFilter("dateRange", {
                      from: range?.from ? startOfDay(range.from) : null,
                      to: range?.to ? endOfDay(range.to) : null,
                    });
                  }}
                  numberOfMonths={2}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Additional Filters */}
          <div className="flex items-center space-x-2 pt-2">
            <Checkbox
              id="hasReimbursement"
              checked={safeFilters.hasReimbursement || false}
              onCheckedChange={(checked) =>
                updateFilter("hasReimbursement", checked ? true : undefined)
              }
            />
            <label
              htmlFor="hasReimbursement"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              Has reimbursement
            </label>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TransactionFilterControls;
