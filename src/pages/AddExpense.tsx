
import { useSupabaseConnectionCheck } from '@/hooks/useSupabaseConnectionCheck';
import { usePaymentMethods } from '@/hooks/usePaymentMethods';
import { useTransactionSubmit } from '@/hooks/useTransactionSubmit';
import ExpenseForm from '@/components/expense/ExpenseForm';
import Navbar from '@/components/layout/Navbar';
import StorageModeAlert from '@/components/expense/StorageModeAlert';
import ErrorAlert from '@/components/expense/ErrorAlert';

const AddExpense = () => {
  const { useLocalStorage } = useSupabaseConnectionCheck();
  const { paymentMethods, isLoading } = usePaymentMethods();
  const { handleSubmit, isLoading: isSaving, saveError } = useTransactionSubmit(useLocalStorage);
  
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container max-w-3xl mx-auto pt-24 pb-20 px-4 sm:px-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Add Expense</h1>
          <p className="text-muted-foreground mt-1">
            Record a new expense transaction
          </p>
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
      </main>
    </div>
  );
};

export default AddExpense;
