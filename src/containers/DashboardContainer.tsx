// src/containers/DashboardContainer.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { Transaction, PaymentMethod, Currency } from '@/types';
import { getTransactions, getPaymentMethods } from '@/utils/storageUtils';
import { useToast } from '@/hooks/use-toast';
import { supabase, USE_LOCAL_STORAGE_DEFAULT } from '@/integrations/supabase/client';
import Dashboard from '@/components/dashboard/Dashboard';

/**
 * Container component responsible for data fetching and state management
 * for the Dashboard page. Implements the container pattern by separating
 * data management from presentation logic.
 */
const DashboardContainer: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [initialized, setInitialized] = useState<boolean>(false);
  const { toast } = useToast();
  
  // Load data function
  const loadData = useCallback(async () => {
    try {
      if (!initialized) {
        setLoading(true);
        setInitialized(true);
      }
      
      // Get only recent transactions for homepage (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      // Get payment methods - these are typically few in number
      const loadedPaymentMethods = await getPaymentMethods();
      
      // Get transactions and filter to recent ones client-side
      const allTransactions = await getTransactions(USE_LOCAL_STORAGE_DEFAULT);
      
      // Filter to only recent transactions (last 30 days) to improve performance
      const loadedTransactions = allTransactions
        .filter(tx => {
          const txDate = new Date(tx.date);
          return !tx.is_deleted && txDate >= thirtyDaysAgo;
        })
        .slice(0, 50); // Limit to 50 most recent transactions for homepage performance
      
      setTransactions(loadedTransactions);
      setPaymentMethods(loadedPaymentMethods);
      setLoading(false);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: 'Error loading data',
        description: 'There was a problem loading your expense data',
        variant: 'destructive'
      });
      setLoading(false);
    }
  }, [initialized, toast]);
  
  // Set up Supabase realtime subscription
  useEffect(() => {
    loadData();
    
    // Set up real-time subscriptions
    const channel = supabase
      .channel('public:transactions')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'transactions'
      }, (payload: any) => {
        // Check if this is a recent transaction before triggering reload
        const payloadDate = payload.new?.date || payload.old?.date;
        if (payloadDate) {
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          const txDate = new Date(payloadDate);
          
          // Only reload if this is a recent transaction
          if (txDate >= thirtyDaysAgo) {
            loadData();
          }
        }
      })
      .subscribe();
    
    // Cleanup: unsubscribe on component unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadData]);
  
  return (
    <Dashboard
      transactions={transactions}
      paymentMethods={paymentMethods}
      loading={loading}
      defaultCurrency="SGD"
    />
  );
};

export default DashboardContainer;
