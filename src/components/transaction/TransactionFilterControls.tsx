
import { FilterOptions } from '@/hooks/transaction-list/types';
import { SortOption, ViewMode } from '@/components/transaction/TransactionSortAndView';
import TransactionSearchBar from '@/components/transaction/TransactionSearchBar';
import TransactionFilters from '@/components/transaction/TransactionFilters';
import TransactionSortAndView from '@/components/transaction/TransactionSortAndView';
import { PaymentMethod } from '@/types';

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
  return (
    <div className="sticky top-[72px] z-20 bg-background py-4 mb-6 border-b">
      <div className="flex flex-col md:flex-row gap-4">
        <TransactionSearchBar 
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
        />
        
        <div className="flex items-center gap-2">
          <TransactionFilters
            filterOptions={filterOptions}
            activeFilters={activeFilters}
            paymentMethods={paymentMethods}
            onFilterChange={onFilterChange}
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
