
import { useState, useEffect } from 'react';
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

  useEffect(() => {
    const loadData = async () => {
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
    };
    
    loadData();
    
    // Only set up the Supabase channel if we're not defaulting to local storage
    if (!USE_LOCAL_STORAGE_DEFAULT) {
      const channel = supabase
        .channel('public:transactions')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'transactions'
        }, async () => {
          const updatedTransactions = await getTransactions();
          setTransactions(updatedTransactions);
        })
        .subscribe();
      
      return () => {
        supabase.removeChannel(channel);
      };
    } else {
      // For local storage, we need to check for changes periodically
      const checkInterval = setInterval(async () => {
        const updatedTransactions = await getTransactions(true);
        setTransactions(updatedTransactions);
      }, 5000); // Check every 5 seconds
      
      return () => {
        clearInterval(checkInterval);
      };
    }
  }, [toast]);
  
  useEffect(() => {
    let filtered = [...transactions];
    
    if (searchQuery) {
      filtered = filtered.filter(tx => 
        tx.merchant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.notes?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    if (filterOptions.merchantName) {
      filtered = filtered.filter(tx => 
        tx.merchant.name.toLowerCase().includes(filterOptions.merchantName.toLowerCase())
      );
    }
    
    if (filterOptions.paymentMethodId) {
      filtered = filtered.filter(tx => 
        tx.paymentMethod.id === filterOptions.paymentMethodId
      );
    }
    
    if (filterOptions.currency) {
      filtered = filtered.filter(tx => 
        tx.currency === filterOptions.currency
      );
    }
    
    if (filterOptions.startDate) {
      filtered = filtered.filter(tx => 
        new Date(tx.date) >= new Date(filterOptions.startDate)
      );
    }
    
    if (filterOptions.endDate) {
      filtered = filtered.filter(tx => 
        new Date(tx.date) <= new Date(filterOptions.endDate)
      );
    }
    
    switch (sortOption) {
      case 'date-desc':
        filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        break;
      case 'date-asc':
        filtered.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        break;
      case 'amount-desc':
        filtered.sort((a, b) => b.amount - a.amount);
        break;
      case 'amount-asc':
        filtered.sort((a, b) => a.amount - b.amount);
        break;
    }
    
    setFilteredTransactions(filtered);
    
    const newActiveFilters: string[] = [];
    if (filterOptions.merchantName) newActiveFilters.push('Merchant');
    if (filterOptions.paymentMethodId) newActiveFilters.push('Payment Method');
    if (filterOptions.currency) newActiveFilters.push('Currency');
    if (filterOptions.startDate || filterOptions.endDate) newActiveFilters.push('Date Range');
    
    setActiveFilters(newActiveFilters);
  }, [transactions, searchQuery, filterOptions, sortOption]);

  const handleFilterChange = (key: keyof FilterOptions, value: string) => {
    setFilterOptions(prev => ({
      ...prev,
      [key]: value,
    }));
  };
  
  const resetFilters = () => {
    setFilterOptions({
      merchantName: '',
      paymentMethodId: '',
      currency: '',
      startDate: '',
      endDate: '',
    });
  };

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
    isLoading
  };
};
