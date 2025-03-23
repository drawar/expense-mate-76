
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Transaction, PaymentMethod } from '@/types';
import { getPaymentMethods, addTransaction } from '@/utils/storageUtils';
import ExpenseForm from '@/components/expense/ExpenseForm';
import Navbar from '@/components/layout/Navbar';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const AddExpense = () => {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [saveError, setSaveError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  useEffect(() => {
    // Load payment methods
    const loadData = async () => {
      try {
        const methods = await getPaymentMethods();
        setPaymentMethods(methods);
      } catch (error) {
        console.error('Error loading payment methods:', error);
        toast({
          title: 'Error',
          description: 'Failed to load payment methods',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [toast]);
  
  const handleSubmit = async (transactionData: Omit<Transaction, 'id'>) => {
    try {
      setSaveError(null);
      setIsLoading(true);
      
      console.log('Saving transaction data:', transactionData);
      
      // Ensure all required fields are present
      if (!transactionData.merchant || !transactionData.merchant.name) {
        throw new Error('Merchant information is missing');
      }
      
      if (!transactionData.paymentMethod || !transactionData.paymentMethod.id) {
        throw new Error('Payment method is missing');
      }
      
      const result = await addTransaction(transactionData);
      
      toast({
        title: 'Success',
        description: 'Transaction saved successfully',
      });
      
      // Navigate back to the dashboard
      navigate('/');
    } catch (error) {
      console.error('Error saving transaction:', error);
      
      // Detailed error information for debugging
      if (error instanceof Error) {
        setSaveError(error.message);
        
        // Check for Supabase specific errors
        if (error.message.includes('violates foreign key constraint')) {
          setSaveError('Database error: Referenced payment method or merchant not found');
        }
      }
      
      toast({
        title: 'Error',
        description: 'Failed to save transaction. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
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
        
        {saveError && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 border border-red-200 rounded-md">
            {saveError}
          </div>
        )}
        
        {isLoading && paymentMethods.length === 0 ? (
          <div className="animate-pulse-slow text-center py-10">Loading...</div>
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
