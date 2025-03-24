
import { useState, useEffect, useCallback } from 'react';
import { Transaction, PaymentMethod } from '@/types';
import { getTransactions, getPaymentMethods } from '@/utils/storageUtils';
import { useToast } from '@/hooks/use-toast';
import { supabase, USE_LOCAL_STORAGE_DEFAULT } from '@/integrations/supabase/client';

export const useTransactionData = () => {
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Function to load transactions
  const loadTransactions = useCallback(async () => {
    try {
      setIsLoading(true);
      console.log('Loading transactions with forceLocalStorage:', USE_LOCAL_STORAGE_DEFAULT);
      
      // Use the global setting for storage preference
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
  
  // Set up Supabase listener only once on mount
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
      }, () => {
        // When any transaction changes, reload the transactions
        loadTransactions();
      })
      .subscribe() : null;
    
    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [loadTransactions]);

  return {
    transactions,
    setTransactions,
    paymentMethods,
    isLoading,
    refreshTransactions: loadTransactions
  };
};
