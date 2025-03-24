
import { ViewMode } from '@/components/transaction/TransactionSortAndView';
import { PaymentMethod } from '@/types';
import TransactionFilterControls from '@/components/transaction/TransactionFilterControls';
import { FilterOption } from '@/hooks/transaction-list/types';

interface TransactionFiltersContainerProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filterOptions: FilterOption[];
  activeFilters: Record<string, string[]>;
  paymentMethods: PaymentMethod[];
  onFilterChange: (category: string, value: string) => void;
  onResetFilters: () => void;
  sortOption: string;
  viewMode: ViewMode;
  onSortChange: (sort: string) => void;
  onViewChange: (view: ViewMode) => void;
}

const TransactionFiltersContainer = ({
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
  onViewChange,
}: TransactionFiltersContainerProps) => {
  return (
    <TransactionFilterControls
      searchQuery={searchQuery}
      onSearchChange={onSearchChange}
      filterOptions={filterOptions}
      activeFilters={activeFilters}
      paymentMethods={paymentMethods}
      onFilterChange={onFilterChange}
      onResetFilters={onResetFilters}
      sortOption={sortOption}
      viewMode={viewMode}
      onSortChange={onSortChange}
      onViewChange={onViewChange}
    />
  );
};

export default TransactionFiltersContainer;
