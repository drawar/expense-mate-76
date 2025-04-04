
import { useSupabaseConnectionCheck } from '@/hooks/useSupabaseConnectionCheck';
import { usePaymentMethods } from '@/hooks/usePaymentMethods';
import { useTransactionSubmit } from '@/hooks/useTransactionSubmit';
import ExpenseForm from '@/components/expense/ExpenseForm';
import StorageModeAlert from '@/components/expense/StorageModeAlert';
import ErrorAlert from '@/components/expense/ErrorAlert';
import { useState, useEffect } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { registerCustomCalculators } from '@/services/calculators/CalculatorRegistryExtensions';
import { rewardCalculationService } from '@/services/RewardCalculationService';

const AddExpense = () => {
  const { useLocalStorage } = useSupabaseConnectionCheck();
  const { paymentMethods, isLoading } = usePaymentMethods();
  const { handleSubmit, isLoading: isSaving, saveError } = useTransactionSubmit(useLocalStorage);
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState("expense");
  
  // Initialize custom calculators when the page loads
  useEffect(() => {
    console.log('AddExpense: Initializing calculators');
    // Register custom calculators directly to ensure they're available
    registerCustomCalculators();
    
    // Force initialize the reward calculation service
    rewardCalculationService.getPointsCurrency({ id: '', name: '', type: 'credit_card', currency: 'SGD', rewardRules: [], active: true });
    
    console.log('Custom calculators registered in AddExpense');
  }, []);
  
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
        
        {isLoading && paymentMethods.length === 0 ? (
          <div className="animate-pulse text-center py-10">Loading...</div>
        ) : (
          <ExpenseForm
            paymentMethods={paymentMethods}
            onSubmit={handleSubmit}
          />
        )}
      </div>
    </div>
  );
};

export default AddExpense;
