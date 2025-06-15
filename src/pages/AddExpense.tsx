// pages/AddExpense.tsx - UPDATED FILE
import { useSupabaseConnectionCheck } from '@/hooks/useSupabaseConnectionCheck';
import { usePaymentMethods } from '@/hooks/usePaymentMethods';
import { useTransactionSubmit } from '@/hooks/useTransactionSubmit';
import { ExpenseForm } from '@/components/expense/form/ExpenseForm';
import StorageModeAlert from '@/components/expense/StorageModeAlert';
import ErrorAlert from '@/components/expense/ErrorAlert';
import { useState, useEffect } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
// Import the initialization function from rewards service
import { initializeRewardSystem } from '@/core/rewards';

const AddExpense = () => {
  const { useLocalStorage } = useSupabaseConnectionCheck();
  const { paymentMethods, isLoading } = usePaymentMethods();
  const { handleSubmit, isLoading: isSaving, saveError } = useTransactionSubmit(useLocalStorage);
  const isMobile = useIsMobile();
  const [initializationStatus, setInitializationStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  
  // Initialize the reward calculation system when the page loads - READ ONLY
  useEffect(() => {
    const initializeRewardSystemWithReadOnly = async () => {
      console.log('AddExpense: Initializing reward system in READ-ONLY mode...');
      setInitializationStatus('loading');
      
      try {
        // Initialize the reward calculation service with READ-ONLY mode
        await initializeRewardSystem(true);
        
        // Update status
        setInitializationStatus('success');
        console.log('Reward calculation system ready in READ-ONLY mode');
      } catch (error) {
        console.error('Failed to initialize reward system:', error);
        setInitializationStatus('error');
      }
    };
    
    initializeRewardSystemWithReadOnly();
    
    // Clean up - disable read-only mode when component unmounts
    return () => {
      initializeRewardSystem(false).catch(err => {
        console.error('Error disabling read-only mode:', err);
      });
    };
  }, []);

  useEffect(() => {
    console.log('Payment methods in AddExpense:', paymentMethods);
  }, [paymentMethods]);
  
  return (
    <div className="min-h-screen">
      <div className="container max-w-7xl mx-auto pb-16">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-10 mt-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gradient">Add Expense</h1>
            <p className="text-muted-foreground mt-1.5 text-sm">
              Record a new expense transaction
            </p>
          </div>
        </div>
        
        <StorageModeAlert useLocalStorage={useLocalStorage} />
        <ErrorAlert error={saveError} />
        
        {(isLoading && paymentMethods.length === 0) || initializationStatus === 'loading' ? (
          <div className="animate-pulse text-center py-10">Loading...</div>
        ) : initializationStatus === 'error' ? (
          <div className="text-center py-10 text-red-500">
            Error initializing reward system. Please try refreshing the page.
          </div>
        ) : (
          <ExpenseForm
            paymentMethods={paymentMethods}
            onSubmit={handleSubmit}
            useLocalStorage={useLocalStorage}
            isSaving={isSaving}
          />
        )}
      </div>
    </div>
  );
};

export default AddExpense;
