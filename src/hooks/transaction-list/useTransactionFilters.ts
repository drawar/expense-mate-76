
import { useState, useEffect, useMemo } from 'react';
import { Transaction } from '@/types';
import { SortOption } from '@/components/transaction/TransactionSortAndView';
import { FilterOptions } from '@/components/transaction/TransactionFilters';

const initialFilterOptions: FilterOptions = {
  merchantName: '',
  paymentMethodId: 'all', // Changed from empty string to 'all'
  currency: 'all', // Changed from empty string to 'all'
  startDate: '',
  endDate: '',
};

export const useTransactionFilters = (transactions: Transaction[], isLoading: boolean) => {
  const [sortOption, setSortOption] = useState<SortOption>('date-desc');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterOptions, setFilterOptions] = useState<FilterOptions>(initialFilterOptions);

  // Reset filters when transactions load
  useEffect(() => {
    if (!isLoading && transactions.length > 0) {
      setFilterOptions(initialFilterOptions);
    }
  }, [isLoading, transactions.length]);

  const handleFilterChange = (key: keyof FilterOptions, value: string) => {
    setFilterOptions(prev => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => {
    setFilterOptions(initialFilterOptions);
    setSearchQuery('');
  };

  // Get active filters for displaying in UI
  const activeFilters = useMemo(() => {
    const filters: string[] = [];

    if (searchQuery) {
      filters.push(`Search: ${searchQuery}`);
    }

    if (filterOptions.merchantName) {
      filters.push(`Merchant: ${filterOptions.merchantName}`);
    }

    if (filterOptions.paymentMethodId && filterOptions.paymentMethodId !== 'all') {
      const method = transactions.find(t => t.paymentMethod.id === filterOptions.paymentMethodId)?.paymentMethod.name;
      if (method) filters.push(`Payment Method: ${method}`);
    }

    if (filterOptions.currency && filterOptions.currency !== 'all') {
      filters.push(`Currency: ${filterOptions.currency}`);
    }

    if (filterOptions.startDate) {
      filters.push(`From: ${filterOptions.startDate}`);
    }

    if (filterOptions.endDate) {
      filters.push(`To: ${filterOptions.endDate}`);
    }

    return filters;
  }, [filterOptions, searchQuery, transactions]);

  // Apply filters and sort
  const filteredTransactions = useMemo(() => {
    if (isLoading) return [];

    // Filter by search query
    let filtered = transactions;
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(tx => 
        tx.merchant.name.toLowerCase().includes(query) ||
        (tx.notes && tx.notes.toLowerCase().includes(query))
      );
    }
    
    // Apply filters
    if (filterOptions.merchantName) {
      const merchantQuery = filterOptions.merchantName.toLowerCase();
      filtered = filtered.filter(tx => 
        tx.merchant.name.toLowerCase().includes(merchantQuery)
      );
    }
    
    if (filterOptions.paymentMethodId && filterOptions.paymentMethodId !== 'all') {
      filtered = filtered.filter(tx => 
        tx.paymentMethod.id === filterOptions.paymentMethodId
      );
    }
    
    if (filterOptions.currency && filterOptions.currency !== 'all') {
      filtered = filtered.filter(tx => 
        tx.currency === filterOptions.currency
      );
    }
    
    if (filterOptions.startDate) {
      const startDate = new Date(filterOptions.startDate);
      startDate.setHours(0, 0, 0, 0);
      filtered = filtered.filter(tx => {
        const txDate = new Date(tx.date);
        return txDate >= startDate;
      });
    }
    
    if (filterOptions.endDate) {
      const endDate = new Date(filterOptions.endDate);
      endDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(tx => {
        const txDate = new Date(tx.date);
        return txDate <= endDate;
      });
    }
    
    // Apply sorting
    return [...filtered].sort((a, b) => {
      if (sortOption === 'date-desc') {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      } else if (sortOption === 'date-asc') {
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      } else if (sortOption === 'amount-desc') {
        return b.amount - a.amount;
      } else {
        return a.amount - b.amount;
      }
    });
  }, [isLoading, transactions, searchQuery, filterOptions, sortOption]);

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
