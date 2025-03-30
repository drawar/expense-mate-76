
// src/containers/DashboardContainer.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Transaction, PaymentMethod, Currency } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { supabase, USE_LOCAL_STORAGE_DEFAULT } from '@/integrations/supabase/client';
import Dashboard from '@/components/dashboard/Dashboard';
import { tryCatchWrapper, ErrorType } from '@/utils/errorHandling';
import { useOptimizedTransactionData } from '@/hooks/useOptimizedTransactionData';
import StorageSyncStatus from '@/components/expense/StorageSyncStatus';
import { scheduleSync } from '@/services/LocalDatabaseService';

/**
 * Container component responsible for data fetching and state management
 * for the Dashboard page. Implements the container pattern by separating
 * data management from presentation logic.
 * Optimized to prevent unnecessary re-renders of child components.
 */
const DashboardContainer: React.FC = () => {
  // State for dashboard configuration
  const [initialized, setInitialized] = useState<boolean>(false);
  const [lastUpdateTimestamp, setLastUpdateTimestamp] = useState<number>(Date.now());
  
  const { toast } = useToast();
  
  // Use our optimized data hook instead of direct API calls
  const {
    transactions,
    paymentMethods,
    isLoading,
    isOnline,
    forceSync
  } = useOptimizedTransactionData();

  // Schedule nightly sync
  useEffect(() => {
    // Schedule sync at midnight
    scheduleSync();
  }, []);
  
  // Create stable props object for Dashboard component to prevent unnecessary re-renders
  const dashboardProps = useMemo(() => ({
    transactions,
    paymentMethods,
    loading: isLoading,
    defaultCurrency: "SGD" as Currency
  }), [transactions, paymentMethods, isLoading]);
  
  // Generate dynamic elements based on sync status
  const syncStatus = useMemo(() => (
    <StorageSyncStatus 
      isOnline={isOnline} 
      onForceSync={forceSync} 
      className="mt-4"
    />
  ), [isOnline, forceSync]);
  
  return (
    <div className="space-y-4">
      {syncStatus}
      <Dashboard {...dashboardProps} />
    </div>
  );
};

export default DashboardContainer;
