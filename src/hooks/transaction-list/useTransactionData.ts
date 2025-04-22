import { useState, useEffect, useCallback, useRef } from 'react';
import { Transaction, PaymentMethod } from '@/types';
import { getTransactions, getPaymentMethods } from '@/utils/storageUtils';
import { useToast } from '@/hooks/use-toast';
import { supabase, USE_LOCAL_STORAGE_DEFAULT } from '@/integrations/supabase/client';

export const useTransactionData = () => {
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const initialLoadDone = useRef(false);
  const loadInProgress = useRef(false);

  // Function to load transactions
  const loadTransactions = useCallback(async () => {
    // Prevent multiple concurrent loads
    if (loadInProgress.current) {
      console.log('Skipping transaction load - already in progress');
      return;
    }
    
    try {
      loadInProgress.current = true;
      setIsLoading(true);
      console.log('Loading transactions with forceLocalStorage:', USE_LOCAL_STORAGE_DEFAULT);
      
      // Use the global setting for storage preference
      const loadedTransactions = await getTransactions(USE_LOCAL_STORAGE_DEFAULT);
      const loadedPaymentMethods = await getPaymentMethods();
      
      console.log('Loaded transactions:', loadedTransactions.length);
      setTransactions(loadedTransactions);
      setPaymentMethods(loadedPaymentMethods);
      initialLoadDone.current = true;
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load transaction data',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
      loadInProgress.current = false;
    }
  }, [toast]);
  
  // Set up Supabase listener only once on mount
  useEffect(() => {
    // Initial load only if not already done
    if (!initialLoadDone.current) {
      loadTransactions();
    }
    
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
