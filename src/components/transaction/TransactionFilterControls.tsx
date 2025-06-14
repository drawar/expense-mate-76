
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, FilterIcon, XIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { PaymentMethod } from '@/types';

interface FilterOptions {
  searchTerm: string;
  paymentMethodId: string;
  category: string;
  merchantName: string;
  startDate: Date | null;
  endDate: Date | null;
  minAmount: string;
  maxAmount: string;
}

interface TransactionFilterControlsProps {
  filters: FilterOptions | null;
  onFiltersChange: (filters: FilterOptions) => void;
  paymentMethods: PaymentMethod[];
  categories: string[];
  onClearFilters: () => void;
}

export const TransactionFilterControls: React.FC<TransactionFilterControlsProps> = ({
  filters,
  onFiltersChange,
  paymentMethods,
  categories,
  onClearFilters
}) => {
  // Provide default filters if null/undefined
  const safeFilters = filters || {
    searchTerm: '',
    paymentMethodId: '',
    category: '',
    merchantName: '',
    startDate: null,
    endDate: null,
    minAmount: '',
    maxAmount: ''
  };

  const hasActiveFilters = Object.values(safeFilters).some(value => 
    typeof value === 'string' ? value.trim() !== '' : value !== null
  );

  const updateFilter = (key: keyof FilterOptions, value: any) => {
    onFiltersChange({
      ...safeFilters,
      [key]: value
    });
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
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Search</label>
            <Input
              placeholder="Search transactions..."
              value={safeFilters.searchTerm}
              onChange={(e) => updateFilter('searchTerm', e.target.value)}
            />
          </div>
          
          <div>
            <label className="text-sm font-medium mb-1 block">Payment Method</label>
            <Select
              value={safeFilters.paymentMethodId}
              onValueChange={(value) => updateFilter('paymentMethodId', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All methods" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All methods</SelectItem>
                {paymentMethods.map((method) => (
                  <SelectItem key={method.id} value={method.id}>
                    {method.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="text-sm font-medium mb-1 block">Category</label>
            <Select
              value={safeFilters.category}
              onValueChange={(value) => updateFilter('category', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="text-sm font-medium mb-1 block">Merchant</label>
            <Input
              placeholder="Merchant name..."
              value={safeFilters.merchantName}
              onChange={(e) => updateFilter('merchantName', e.target.value)}
            />
          </div>
          
          <div>
            <label className="text-sm font-medium mb-1 block">Start Date</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {safeFilters.startDate ? format(safeFilters.startDate, 'PPP') : 'Pick a date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={safeFilters.startDate}
                  onSelect={(date) => updateFilter('startDate', date)}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>
          
          <div>
            <label className="text-sm font-medium mb-1 block">End Date</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {safeFilters.endDate ? format(safeFilters.endDate, 'PPP') : 'Pick a date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={safeFilters.endDate}
                  onSelect={(date) => updateFilter('endDate', date)}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>
          
          <div>
            <label className="text-sm font-medium mb-1 block">Min Amount</label>
            <Input
              type="number"
              placeholder="0.00"
              value={safeFilters.minAmount}
              onChange={(e) => updateFilter('minAmount', e.target.value)}
            />
          </div>
          
          <div>
            <label className="text-sm font-medium mb-1 block">Max Amount</label>
            <Input
              type="number"
              placeholder="1000.00"
              value={safeFilters.maxAmount}
              onChange={(e) => updateFilter('maxAmount', e.target.value)}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TransactionFilterControls;
