
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Transaction, PaymentMethod } from '@/types';
import { getTransactions, getPaymentMethods } from '@/utils/storageUtils';
import { useToast } from '@/hooks/use-toast';
import { supabase, USE_LOCAL_STORAGE_DEFAULT } from '@/integrations/supabase/client';

export type FilterOptions = {
  merchantName: string;
  paymentMethodId: string;
  currency: string;
  startDate: string;
  endDate: string;
};

export type SortOption = 'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc';

export const useTransactionList = () => {
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
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
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(Date.now());

  // Function to load transactions
  const loadTransactions = useCallback(async () => {
    try {
      setIsLoading(true);
      console.log('Loading transactions with forceLocalStorage:', USE_LOCAL_STORAGE_DEFAULT);
      
      // Force using local storage if it's the default
      const loadedTransactions = await getTransactions(USE_LOCAL_STORAGE_DEFAULT);
      const loadedPaymentMethods = await getPaymentMethods();
      
      console.log('Loaded transactions:', loadedTransactions.length);
      setTransactions(loadedTransactions);
      setPaymentMethods(loadedPaymentMethods);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load transaction data',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);
  
  // Modified to prevent state updates that trigger re-renders
  const refreshTransactions = useCallback(() => {
    // Only trigger a refresh if we're not currently loading
    if (!isLoading) {
      setLastRefresh(Date.now());
    }
  }, [isLoading]);
  
  // Set up Supabase listener and polling only once on mount
  useEffect(() => {
    // Initial load
    loadTransactions();
    
    // Only set up the Supabase channel if we're not defaulting to local storage
    const channel = !USE_LOCAL_STORAGE_DEFAULT ? supabase
      .channel('public:transactions')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'transactions'
      }, refreshTransactions)
      .subscribe() : null;
    
    // For all storage types, set up a polling mechanism, but with a longer interval
    const checkInterval = setInterval(refreshTransactions, 10000); // Check every 10 seconds instead of 3
    
    return () => {
      if (channel) supabase.removeChannel(channel);
      clearInterval(checkInterval);
    };
  }, []); // Empty dependency array to ensure this only runs once
  
  // Reload data when refresh signal is received, but avoid the dependency on loadTransactions
  useEffect(() => {
    if (lastRefresh > 0) {
      loadTransactions();
    }
  }, [lastRefresh]);
  
  // Apply filters and sort (memoized with dependencies)
  useEffect(() => {
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
    refreshTransactions: loadTransactions
  };
};
