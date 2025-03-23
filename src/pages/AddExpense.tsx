
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Transaction, PaymentMethod } from '@/types';
import { getPaymentMethods, addTransaction } from '@/utils/storageUtils';
import ExpenseForm from '@/components/expense/ExpenseForm';
import Navbar from '@/components/layout/Navbar';
import { useToast } from '@/hooks/use-toast';

const AddExpense = () => {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  useEffect(() => {
    // Load payment methods
    const methods = getPaymentMethods();
    setPaymentMethods(methods);
    setIsLoading(false);
  }, []);
  
  const handleSubmit = (transactionData: Omit<Transaction, 'id'>) => {
    try {
      const newTransaction = addTransaction(transactionData);
      
      toast({
        title: 'Success',
        description: 'Transaction saved successfully',
      });
      
      // Navigate back to the dashboard
      navigate('/');
    } catch (error) {
      console.error('Error saving transaction:', error);
      toast({
        title: 'Error',
        description: 'Failed to save transaction',
        variant: 'destructive',
      });
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
        
        {isLoading ? (
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
