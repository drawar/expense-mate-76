
import { useState, useEffect, useCallback } from 'react';
import { Transaction, PaymentMethod } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { 
  getLocalTransactions, 
  getLocalPaymentMethods, 
  syncTransactionsWithSupabase,
  initDatabase
} from '@/services/LocalDatabaseService';
import { supabase, USE_LOCAL_STORAGE_DEFAULT } from '@/integrations/supabase/client';
import { getTransactions, getPaymentMethods } from '@/utils/storageUtils';

export const useOptimizedTransactionData = (forceOnline = false) => {
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Track online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Initialize database
  useEffect(() => {
    const initialize = async () => {
      // Only initialize once
      if (isInitialized) return;
      
      try {
        const dbInitialized = await initDatabase();
        if (dbInitialized) {
          console.log('Database initialized successfully');
          setIsInitialized(true);
        }
      } catch (error) {
        console.error('Error initializing database:', error);
        toast({
          title: 'Error',
          description: 'Failed to initialize local database',
          variant: 'destructive'
        });
      }
    };
    
    initialize();
  }, [isInitialized, toast]);

  // Load transactions - either from local DB or from Supabase
  const loadTransactions = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Force online mode or not initialized yet
      if (forceOnline || !isInitialized) {
        console.log('Using online data source');
        // Use regular online data fetching
        const loadedTransactions = await getTransactions(USE_LOCAL_STORAGE_DEFAULT);
        const loadedPaymentMethods = await getPaymentMethods();
        
        setTransactions(loadedTransactions);
        setPaymentMethods(loadedPaymentMethods);
      } else {
        console.log('Using local data source');
        // Use local database
        const localTransactions = await getLocalTransactions();
        const localPaymentMethods = await getLocalPaymentMethods();
        
        setTransactions(localTransactions);
        setPaymentMethods(localPaymentMethods);
        
        // If online, trigger a background sync
        if (isOnline) {
          console.log('Triggering background sync');
          syncTransactionsWithSupabase().then(success => {
            if (success) {
              // Refresh data after sync
              getLocalTransactions().then(setTransactions);
              getLocalPaymentMethods().then(setPaymentMethods);
            }
          });
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: 'Error',
        description: 'There was a problem loading your expense data',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  }, [forceOnline, isInitialized, isOnline, toast]);

  // Refresh data and trigger sync
  const refreshData = useCallback(async () => {
    if (!isOnline) {
      toast({
        title: 'Offline mode',
        description: 'Cannot sync data while offline',
        variant: 'warning'
      });
      return;
    }
    
    setIsLoading(true);
    const success = await syncTransactionsWithSupabase(true);
    
    if (success) {
      toast({
        title: 'Sync Complete',
        description: 'Your data has been synchronized with the server',
      });
      
      // Reload local data
      const localTransactions = await getLocalTransactions();
      const localPaymentMethods = await getLocalPaymentMethods();
      
      setTransactions(localTransactions);
      setPaymentMethods(localPaymentMethods);
    }
    
    setIsLoading(false);
  }, [isOnline, toast]);

  // Initial data load
  useEffect(() => {
    if (isInitialized || forceOnline) {
      loadTransactions();
    }
  }, [loadTransactions, isInitialized, forceOnline]);

  // Set up Supabase realtime subscription for data updates
  useEffect(() => {
    // Only set up subscription if we're online
    if (!isOnline) return;
    
    const channel = supabase
      .channel('public:transactions')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'transactions'
      }, () => {
        // When data changes in Supabase, trigger a sync
        if (isInitialized && !forceOnline) {
          syncTransactionsWithSupabase().then(success => {
            if (success) {
              // Refresh data after sync
              getLocalTransactions().then(setTransactions);
            }
          });
        } else {
          // When in online mode, just reload data
          loadTransactions();
        }
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [isOnline, loadTransactions, isInitialized, forceOnline]);

  return {
    transactions,
    paymentMethods,
    isLoading,
    isOnline,
    forceSync: refreshData,
    refreshTransactions: loadTransactions
  };
};
