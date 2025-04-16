import { FilterOptions } from '@/hooks/expense/useTransactionList';
import { SortOption, ViewMode } from '@/components/transaction/TransactionSortAndView';
import TransactionSearchBar from '@/components/transaction/TransactionSearchBar';
import TransactionFilters from '@/components/transaction/TransactionFilters';
import TransactionSortAndView from '@/components/transaction/TransactionSortAndView';
import { PaymentMethod } from '@/types';

// Create a local type that matches what TransactionFilters expects
type TransactionFilterOptionsType = {
  merchantName?: string;
  paymentMethodId?: string;
  currency?: string;
  startDate?: Date | null;
  endDate?: Date | null;
};

interface TransactionFilterControlsProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  filterOptions: FilterOptions;
  activeFilters: string[];
  paymentMethods: PaymentMethod[];
  onFilterChange: (key: keyof FilterOptions, value: string) => void;
  onResetFilters: () => void;
  sortOption: SortOption;
  viewMode: ViewMode;
  onSortChange: (value: SortOption) => void;
  onViewChange: (value: ViewMode) => void;
}

const TransactionFilterControls = ({
  searchQuery,
  onSearchChange,
  filterOptions,
  activeFilters,
  paymentMethods,
  onFilterChange,
  onResetFilters,
  sortOption,
  viewMode,
  onSortChange,
  onViewChange
}: TransactionFilterControlsProps) => {
  // Create a handler that can adapt between the different filter option types
  const handleFilterChange = (key: keyof TransactionFilterOptionsType, value: string) => {
    // Map the TransactionFilters keys to useTransactionList keys if needed
    let mappedKey: keyof FilterOptions;
    
    if (key === 'startDate') {
      mappedKey = 'dateRange' as keyof FilterOptions;
      // For date range, you'd need to update the object differently
      // This is just an example - you'd need to handle this based on your actual implementation
      onFilterChange(mappedKey, value);
      return;
    } else if (key === 'endDate') {
      mappedKey = 'dateRange' as keyof FilterOptions;
      // Similar to startDate
      onFilterChange(mappedKey, value);
      return;
    } else if (key === 'paymentMethodId') {
      mappedKey = 'paymentMethods' as keyof FilterOptions;
    } else if (key === 'merchantName') {
      mappedKey = 'merchants' as keyof FilterOptions;
    } else if (key === 'currency') {
      mappedKey = 'currencies' as keyof FilterOptions;
    } else {
      mappedKey = key as keyof FilterOptions;
    }
    
    onFilterChange(mappedKey, value);
  };
  
  // Create a filtered options object that matches what TransactionFilters expects
  const adaptedFilterOptions: TransactionFilterOptionsType = {
    merchantName: filterOptions.merchants?.[0] || '',
    paymentMethodId: filterOptions.paymentMethods?.[0] || '',
    currency: filterOptions.currencies?.[0] || '',
    startDate: filterOptions.dateRange?.from || null,
    endDate: filterOptions.dateRange?.to || null,
  };
  
  return (
    <div className="bg-background py-4 mb-6 border-b">
      <div className="flex flex-col md:flex-row gap-4">
        <TransactionSearchBar 
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
        />
        
        <div className="flex items-center gap-2">
          <TransactionFilters
            filterOptions={adaptedFilterOptions}
            activeFilters={activeFilters}
            paymentMethods={paymentMethods}
            onFilterChange={handleFilterChange}
            onResetFilters={onResetFilters}
          />
          
          <TransactionSortAndView
            sortOption={sortOption}
            viewMode={viewMode}
            onSortChange={onSortChange}
            onViewChange={onViewChange}
          />
        </div>
      </div>
    </div>
  );
};

export default TransactionFilterControls;
