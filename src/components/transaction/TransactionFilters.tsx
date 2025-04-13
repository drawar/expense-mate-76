import { FilterIcon, XIcon, CheckIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { PaymentMethod, Currency } from "@/types";
import { CurrencyService } from "@/services/currency";

export type FilterOptions = {
  merchantName: string;
  paymentMethodId: string;
  currency: string;
  startDate: string;
  endDate: string;
};

interface TransactionFiltersProps {
  filterOptions: FilterOptions;
  activeFilters: string[];
  paymentMethods: PaymentMethod[];
  onFilterChange: (key: keyof FilterOptions, value: string) => void;
  onResetFilters: () => void;
}

const currencyOptions = CurrencyService.getCurrencyOptions();

const TransactionFilters = ({
  filterOptions,
  activeFilters,
  paymentMethods,
  onFilterChange,
  onResetFilters,
}: TransactionFiltersProps) => {
  return (
    <>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <FilterIcon className="h-4 w-4" />
            Filter
            {activeFilters.length > 0 && (
              <Badge variant="secondary" className="ml-1 px-1 min-w-[20px]">
                {activeFilters.length}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80">
          <div className="space-y-4">
            <h4 className="font-medium">Filter Transactions</h4>

            <div className="space-y-2">
              <Label htmlFor="merchant-filter">Merchant</Label>
              <Input
                id="merchant-filter"
                placeholder="Enter merchant name"
                value={filterOptions.merchantName}
                onChange={(e) => onFilterChange("merchantName", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment-method-filter">Payment Method</Label>
              <Select
                value={filterOptions.paymentMethodId}
                onValueChange={(value) =>
                  onFilterChange("paymentMethodId", value)
                }
              >
                <SelectTrigger id="payment-method-filter">
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Payment Methods</SelectItem>
                  {paymentMethods.map((method) => (
                    <SelectItem key={method.id} value={method.id}>
                      {method.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency-filter">Currency</Label>
              <Select
                value={filterOptions.currency}
                onValueChange={(value) => onFilterChange("currency", value)}
              >
                <SelectTrigger id="currency-filter">
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Currencies</SelectItem>
                  {currencyOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start-date">Start Date</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={filterOptions.startDate}
                  onChange={(e) => onFilterChange("startDate", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="end-date">End Date</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={filterOptions.endDate}
                  onChange={(e) => onFilterChange("endDate", e.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-between">
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={onResetFilters}
              >
                <XIcon className="h-4 w-4" />
                Reset
              </Button>

              <Button
                size="sm"
                className="gap-2"
                onClick={() => document.body.click()} // Close popover
              >
                <CheckIcon className="h-4 w-4" />
                Apply
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Active Filters */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {activeFilters.map((filter) => (
            <Badge key={filter} variant="secondary" className="gap-1">
              {filter}
            </Badge>
          ))}

          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs"
            onClick={onResetFilters}
          >
            Clear All
          </Button>
        </div>
      )}
    </>
  );
};

export default TransactionFilters;
