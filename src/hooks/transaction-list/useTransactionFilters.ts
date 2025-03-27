
import { useState, useEffect, useMemo } from 'react';
import { Transaction, Currency } from '@/types';
import { SortOption } from '@/components/transaction/TransactionSortAndView';
import { FilterOptions } from '@/components/transaction/TransactionFilters';
import { getStatementPeriod } from '@/utils/dateUtils';

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
  const [useStatementMonth, setUseStatementMonth] = useState(false);
  const [statementCycleDay, setStatementCycleDay] = useState(15); // Default to 15th

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
    setUseStatementMonth(false);
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

    if (useStatementMonth) {
      filters.push(`Statement Cycle: Day ${statementCycleDay}`);
    }

    return filters;
  }, [filterOptions, searchQuery, transactions, useStatementMonth, statementCycleDay]);

  // Calculate statement period dates
  const statementPeriod = useMemo(() => {
    if (!useStatementMonth) return null;
    
    // Create a pseudo payment method with statement settings
    const pseudoMethod = {
      statementStartDay: statementCycleDay,
      isMonthlyStatement: true
    };
    
    return getStatementPeriod(pseudoMethod as any);
  }, [useStatementMonth, statementCycleDay]);

  // Apply filters and sort
  const filteredTransactions = useMemo(() => {
    if (isLoading) return [];

    // Debug log to check currencies
    console.log('Available currencies in transactions:', 
      [...new Set(transactions.map(tx => tx.currency))]);

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
    
    // Apply statement cycle filter
    if (useStatementMonth && statementPeriod) {
      filtered = filtered.filter(tx => {
        const txDate = new Date(tx.date);
        return txDate >= statementPeriod.start && txDate <= statementPeriod.end;
      });
      
      console.log(`Statement period: ${statementPeriod.start.toISOString()} to ${statementPeriod.end.toISOString()}`);
      console.log(`Filtered to ${filtered.length} transactions in statement period`);
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
  }, [isLoading, transactions, searchQuery, filterOptions, sortOption, useStatementMonth, statementPeriod]);

  return {
    filteredTransactions,
    sortOption,
    setSortOption,
    searchQuery,
    setSearchQuery,
    filterOptions,
    handleFilterChange,
    activeFilters,
    resetFilters,
    useStatementMonth,
    setUseStatementMonth,
    statementCycleDay,
    setStatementCycleDay
  };
};
