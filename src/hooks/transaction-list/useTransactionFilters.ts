
import { useState, useCallback, useMemo } from 'react';
import { Transaction } from '@/types';
import { FilterOptions, SortOption } from './types';

export const useTransactionFilters = (transactions: Transaction[], isLoading: boolean) => {
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [sortOption, setSortOption] = useState<SortOption>('date-desc');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    merchantName: '',
    paymentMethodId: '',
    currency: '',
    startDate: '',
    endDate: '',
  });
  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  // Apply filters and compute derived state
  const applyFilters = useMemo(() => {
    // Skip filtering if no transactions or still loading
    if (transactions.length === 0 || isLoading) {
      setFilteredTransactions([]);
      return;
    }
    
    const lowerSearchQuery = searchQuery.toLowerCase();
    const lowerMerchantName = filterOptions.merchantName.toLowerCase();
    const startDate = filterOptions.startDate ? new Date(filterOptions.startDate) : null;
    const endDate = filterOptions.endDate ? new Date(filterOptions.endDate) : null;
    
    // Performance optimization: Only create a new array if filters/sort are applied
    let filtered = transactions;
    let shouldFilter = false;
    
    // Check if any filters are actually active
    if (searchQuery || filterOptions.merchantName || filterOptions.paymentMethodId || 
        filterOptions.currency || startDate || endDate) {
      shouldFilter = true;
    }
    
    if (shouldFilter) {
      filtered = transactions.filter(tx => {
        // Search query
        if (searchQuery && 
            !(tx.merchant.name.toLowerCase().includes(lowerSearchQuery) || 
              tx.notes?.toLowerCase().includes(lowerSearchQuery))) {
          return false;
        }
        
        // Merchant name
        if (filterOptions.merchantName && 
            !tx.merchant.name.toLowerCase().includes(lowerMerchantName)) {
          return false;
        }
        
        // Payment method
        if (filterOptions.paymentMethodId && 
            tx.paymentMethod.id !== filterOptions.paymentMethodId) {
          return false;
        }
        
        // Currency
        if (filterOptions.currency && 
            tx.currency !== filterOptions.currency) {
          return false;
        }
        
        // Date range
        const txDate = new Date(tx.date);
        if (startDate && txDate < startDate) {
          return false;
        }
        
        if (endDate && txDate > endDate) {
          return false;
        }
        
        return true;
      });
    }
    
    // Only sort if needed
    const sorted = [...filtered]; // Create a new array for sorting
    
    switch (sortOption) {
      case 'date-desc':
        sorted.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        break;
      case 'date-asc':
        sorted.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        break;
      case 'amount-desc':
        sorted.sort((a, b) => b.amount - a.amount);
        break;
      case 'amount-asc':
        sorted.sort((a, b) => a.amount - b.amount);
        break;
    }
    
    setFilteredTransactions(sorted);
    
    // Compute active filters
    const newActiveFilters: string[] = [];
    if (filterOptions.merchantName) newActiveFilters.push('Merchant');
    if (filterOptions.paymentMethodId) newActiveFilters.push('Payment Method');
    if (filterOptions.currency) newActiveFilters.push('Currency');
    if (filterOptions.startDate || filterOptions.endDate) newActiveFilters.push('Date Range');
    
    setActiveFilters(newActiveFilters);
  }, [transactions, searchQuery, filterOptions, sortOption, isLoading]);

  // Auto-apply filters when dependencies change
  useMemo(() => {
    applyFilters;
  }, [applyFilters]);

  const handleFilterChange = useCallback((key: keyof FilterOptions, value: string) => {
    setFilterOptions(prev => ({
      ...prev,
      [key]: value,
    }));
  }, []);
  
  const resetFilters = useCallback(() => {
    setFilterOptions({
      merchantName: '',
      paymentMethodId: '',
      currency: '',
      startDate: '',
      endDate: '',
    });
  }, []);

  return {
    filteredTransactions,
    sortOption,
    setSortOption,
    searchQuery,
    setSearchQuery,
    filterOptions,
    handleFilterChange,
    activeFilters,
    resetFilters
  };
};
