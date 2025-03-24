
import { useTransactionData } from './transaction-list/useTransactionData';
import { useTransactionFilters } from './transaction-list/useTransactionFilters';
import { FilterOptions, SortOption } from './transaction-list/types';

export type { FilterOptions, SortOption };

export const useTransactionList = () => {
  // Get transaction data
  const { 
    transactions, 
    setTransactions, 
    paymentMethods, 
    isLoading,
    refreshTransactions
  } = useTransactionData();

  // Apply filters and sorting
  const {
    filteredTransactions,
    sortOption,
    setSortOption,
    searchQuery,
    setSearchQuery,
    filterOptions,
    handleFilterChange,
    activeFilters,
    resetFilters
  } = useTransactionFilters(transactions, isLoading);

  return {
    transactions,
    setTransactions,
    paymentMethods,
    filteredTransactions,
    sortOption,
    setSortOption,
    searchQuery,
    setSearchQuery,
    filterOptions,
    handleFilterChange,
    activeFilters,
    resetFilters,
    isLoading,
    refreshTransactions
  };
};
