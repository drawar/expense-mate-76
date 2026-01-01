import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, FilterIcon, XIcon } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
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
}

export const TransactionFilterControls: React.FC<
  TransactionFilterControlsProps
> = ({
  filters,
  onFiltersChange,
  paymentMethods,
  categories,
  onClearFilters,
}) => {
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
      return Object.values(safeFilters).some((value) => {
        if (Array.isArray(value)) return value.length > 0;
        if (value && typeof value === "object" && "from" in value) {
          return value.from !== null || value.to !== null;
        }
        return typeof value === "string" ? value.trim() !== "" : value !== null;
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
          {/* Payment Method and Category - side by side */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">
                Payment Method
              </label>
              <Select
                value={safeFilters.paymentMethods?.[0] || "all"}
                onValueChange={(value) =>
                  updateFilter("paymentMethods", value === "all" ? [] : [value])
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All methods" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All methods</SelectItem>
                  {paymentMethods.map((method) => (
                    <SelectItem key={method.id} value={method.id}>
                      <PaymentMethodItemContent method={method} size="sm" />
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Category</label>
              <Select
                value={
                  safeFilters.categories?.length === 1
                    ? safeFilters.categories[0]
                    : "all"
                }
                onValueChange={(value) =>
                  updateFilter("categories", value === "all" ? [] : [value])
                }
              >
                <SelectTrigger>
                  {safeFilters.categories?.length > 1 ? (
                    <span className="truncate">
                      {safeFilters.categories.length} categories
                    </span>
                  ) : (
                    <SelectValue placeholder="All categories" />
                  )}
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Date Range - side by side */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">
                Start Date
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left text-base md:text-sm font-normal overflow-hidden"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                    <span className="truncate">
                      {safeFilters.dateRange?.from
                        ? format(safeFilters.dateRange.from, "MMM d, yyyy")
                        : "Pick a date"}
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={safeFilters.dateRange?.from || undefined}
                    onSelect={(date) =>
                      updateFilter("dateRange", {
                        ...safeFilters.dateRange,
                        from: date,
                      })
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">End Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left text-base md:text-sm font-normal overflow-hidden"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                    <span className="truncate">
                      {safeFilters.dateRange?.to
                        ? format(safeFilters.dateRange.to, "MMM d, yyyy")
                        : "Pick a date"}
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={safeFilters.dateRange?.to || undefined}
                    onSelect={(date) =>
                      updateFilter("dateRange", {
                        ...safeFilters.dateRange,
                        to: date,
                      })
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TransactionFilterControls;
