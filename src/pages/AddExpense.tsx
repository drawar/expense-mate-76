
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Transaction, PaymentMethod } from '@/types';
import { getPaymentMethods, addTransaction } from '@/utils/storageUtils';
import ExpenseForm from '@/components/expense/ExpenseForm';
import Navbar from '@/components/layout/Navbar';
import { useToast } from '@/hooks/use-toast';
import { AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const AddExpense = () => {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [supabaseConnected, setSupabaseConnected] = useState<boolean | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Check Supabase connection
  useEffect(() => {
    const checkSupabaseConnection = async () => {
      try {
        console.log('Checking Supabase connection...');
        const { data, error } = await supabase.from('payment_methods').select('id').limit(1);
        
        if (error) {
          console.error('Supabase connection error:', error);
          setSupabaseConnected(false);
          toast({
            title: 'Warning',
            description: 'Supabase connection failed. Using local storage fallback.',
            variant: 'destructive',
          });
        } else {
          console.log('Supabase connection successful');
          setSupabaseConnected(true);
        }
      } catch (error) {
        console.error('Error checking Supabase connection:', error);
        setSupabaseConnected(false);
        toast({
          title: 'Warning',
          description: 'Supabase connection failed. Using local storage fallback.',
          variant: 'destructive',
        });
      }
    };
    
    checkSupabaseConnection();
  }, [toast]);
  
  useEffect(() => {
    // Load payment methods
    const loadData = async () => {
      try {
        console.log('Loading payment methods...');
        const methods = await getPaymentMethods();
        console.log('Payment methods loaded:', methods);
        
        if (!methods || methods.length === 0) {
          console.error('No payment methods found');
          toast({
            title: 'Warning',
            description: 'No payment methods found. Please add some payment methods first.',
            variant: 'destructive',
          });
        } else {
          console.log('Payment methods loaded:', methods.length);
        }
        
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
      console.log('Starting transaction save process...');
      setSaveError(null);
      setIsLoading(true);
      
      console.log('Transaction data before validation:', transactionData);
      
      // Validate merchant information
      if (!transactionData.merchant || !transactionData.merchant.name) {
        throw new Error('Merchant information is missing');
      }
      
      // Validate payment method
      if (!transactionData.paymentMethod || !transactionData.paymentMethod.id) {
        console.error('Payment method validation failed:', transactionData.paymentMethod);
        throw new Error('Payment method is missing or invalid');
      }
      
      // Validate payment amount
      if (isNaN(transactionData.paymentAmount) || transactionData.paymentAmount <= 0) {
        throw new Error('Invalid payment amount');
      }
      
      console.log('Validated transaction data:', {
        merchant: transactionData.merchant.name,
        merchantId: transactionData.merchant.id,
        amount: transactionData.amount,
        currency: transactionData.currency,
        paymentMethod: transactionData.paymentMethod.name,
        paymentMethodId: transactionData.paymentMethod.id,
        date: transactionData.date
      });
      
      const result = await addTransaction(transactionData);
      
      console.log('Transaction saved successfully:', result);
      
      toast({
        title: 'Success',
        description: supabaseConnected 
          ? 'Transaction saved successfully to Supabase' 
          : 'Transaction saved successfully to local storage',
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
        } else if (error.message.includes('network error')) {
          setSaveError('Network error: Please check your internet connection');
        } else if (error.message.includes('timeout')) {
          setSaveError('Request timeout: Server took too long to respond');
        }
      } else {
        setSaveError('Unknown error occurred');
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
        
        {supabaseConnected === false && (
          <div className="mb-4 p-3 bg-amber-50 text-amber-700 border border-amber-200 rounded-md flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Supabase connection unavailable</p>
              <p>Transactions will be saved to local storage instead. Your data will only be available on this device.</p>
            </div>
          </div>
        )}
        
        {saveError && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 border border-red-200 rounded-md">
            <p className="font-semibold">Error saving transaction:</p>
            <p>{saveError}</p>
          </div>
        )}
        
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
