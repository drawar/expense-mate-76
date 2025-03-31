
// src/containers/DashboardContainer.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Transaction, PaymentMethod, Currency } from '@/types';
import { getTransactions, getPaymentMethods } from '@/utils/storageUtils';
import { useToast } from '@/hooks/use-toast';
import { supabase, USE_LOCAL_STORAGE_DEFAULT } from '@/integrations/supabase/client';
import Dashboard from '@/components/dashboard/Dashboard';
import { tryCatchWrapper, ErrorType } from '@/utils/errorHandling';

/**
 * Container component responsible for data fetching and state management
 * for the Dashboard page. Implements the container pattern by separating
 * data management from presentation logic.
 * Optimized to prevent unnecessary re-renders of child components.
 */
const DashboardContainer: React.FC = () => {
  // State for holding dashboard data
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState<boolean>(false);
  const [lastUpdateTimestamp, setLastUpdateTimestamp] = useState<number>(Date.now());
  
  const { toast } = useToast();
  
  // Load dashboard data with proper error handling
  const loadData = useCallback(async () => {
    console.log('Loading dashboard data');
    try {
      // Always set loading when starting to load data
      setLoading(true);
      
      if (!initialized) {
        setInitialized(true);
      }
      
      // Get only recent transactions for homepage (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      // Get payment methods - using error handling wrapper
      const loadedPaymentMethods = await tryCatchWrapper(
        async () => getPaymentMethods(),
        ErrorType.DATA_FETCH,
        { source: 'getPaymentMethods' },
        [] as PaymentMethod[]
      );
      
      // Get transactions - using error handling wrapper
      const allTransactions = await tryCatchWrapper(
        async () => getTransactions(USE_LOCAL_STORAGE_DEFAULT),
        ErrorType.DATA_FETCH,
        { source: 'getTransactions' },
        [] as Transaction[]
      );
      
      // Filter to only recent transactions (last 30 days) to improve performance
      const loadedTransactions = allTransactions
        .filter(tx => {
          if (tx.is_deleted) return false;
          
          // Create date objects for comparison (removing time components)
          const txDate = new Date(tx.date);
          const txDateOnly = new Date(txDate.getFullYear(), txDate.getMonth(), txDate.getDate());
          const comparisonDate = new Date(thirtyDaysAgo.getFullYear(), thirtyDaysAgo.getMonth(), thirtyDaysAgo.getDate());
          
          // Include the transaction if it's on or after the comparison date
          return txDateOnly >= comparisonDate;
        })
        .slice(0, 50); // Limit to 50 most recent transactions for homepage performance
      
      setTransactions(loadedTransactions);
      setPaymentMethods(loadedPaymentMethods);
      setLoading(false);
      setError(null);
      setLastUpdateTimestamp(Date.now());
      
      console.log(`Dashboard data loaded with ${loadedTransactions.length} transactions`);
    } catch (error) {
      console.error('Error loading data:', error);
      setError('Failed to load dashboard data');
      setLoading(false);
      
      toast({
        title: 'Error loading data',
        description: 'There was a problem loading your expense data',
        variant: 'destructive'
      });
    }
  }, [initialized, toast]);
  
  // Set up Supabase realtime subscription for data updates and force reload when component mounts
  useEffect(() => {
    // Load data immediately when component mounts
    loadData();
    
    // Set up real-time subscriptions
    const channel = supabase
      .channel('dashboard_transactions')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'transactions'
      }, (payload: any) => {
        console.log('Received transaction update:', payload.eventType);
        // Force reload on any transaction changes without filtering
        loadData();
      })
      .subscribe();
    
    // Cleanup: unsubscribe on component unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadData]);

  // Create stable props object for Dashboard component to prevent unnecessary re-renders
  // Include lastUpdateTimestamp to force re-rendering when data changes
  const dashboardProps = useMemo(() => ({
    transactions,
    paymentMethods,
    loading,
    defaultCurrency: "SGD" as Currency,
    lastUpdate: lastUpdateTimestamp
  }), [transactions, paymentMethods, loading, lastUpdateTimestamp]);
  
  return <Dashboard {...dashboardProps} />;
};

export default DashboardContainer;
