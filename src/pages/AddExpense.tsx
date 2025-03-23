
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Transaction, PaymentMethod } from '@/types';
import { getPaymentMethods, addTransaction } from '@/utils/storageUtils';
import ExpenseForm from '@/components/expense/ExpenseForm';
import Navbar from '@/components/layout/Navbar';
import { useToast } from '@/hooks/use-toast';
import { AlertTriangle } from 'lucide-react';
import { supabase, USE_LOCAL_STORAGE_DEFAULT } from '@/integrations/supabase/client';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

const AddExpense = () => {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [supabaseConnected, setSupabaseConnected] = useState<boolean | null>(null);
  const [useLocalStorage, setUseLocalStorage] = useState<boolean>(USE_LOCAL_STORAGE_DEFAULT);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Check Supabase connection only if not defaulting to local storage
  useEffect(() => {
    if (!USE_LOCAL_STORAGE_DEFAULT) {
      const checkSupabaseConnection = async () => {
        try {
          console.log('Checking Supabase connection...');
          const { data, error } = await supabase.from('payment_methods').select('id').limit(1);
          
          if (error) {
            console.error('Supabase connection error:', error);
            setSupabaseConnected(false);
            setUseLocalStorage(true);
            toast({
              title: 'Warning',
              description: 'Supabase connection failed. Using local storage fallback.',
              variant: 'destructive',
            });
          } else {
            console.log('Supabase connection successful');
            setSupabaseConnected(true);
            setUseLocalStorage(false);
          }
        } catch (error) {
          console.error('Error checking Supabase connection:', error);
          setSupabaseConnected(false);
          setUseLocalStorage(true);
          toast({
            title: 'Warning',
            description: 'Supabase connection failed. Using local storage fallback.',
            variant: 'destructive',
          });
        }
      };
      
      checkSupabaseConnection();
    } else {
      // Default to local storage without checking Supabase
      setSupabaseConnected(false);
      setUseLocalStorage(true);
      console.log('Using local storage by default.');
    }
  }, [toast]);
  
  useEffect(() => {
    // Load payment methods
    const loadData = async () => {
      try {
        console.log('Loading payment methods with forceLocalStorage:', USE_LOCAL_STORAGE_DEFAULT);
        const methods = await getPaymentMethods(USE_LOCAL_STORAGE_DEFAULT);
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
      
      // Make sure we're using local storage if set to default
      const result = await addTransaction(transactionData, useLocalStorage);
      
      console.log('Transaction saved successfully:', result);
      
      toast({
        title: 'Success',
        description: 'Transaction saved successfully to ' + (useLocalStorage ? 'local storage' : 'Supabase'),
      });
      
      // Navigate back to the dashboard
      navigate('/transactions');
    } catch (error) {
      console.error('Error saving transaction:', error);
      
      let errorMessage = 'Failed to save transaction';
      
      // Detailed error information for debugging
      if (error instanceof Error) {
        errorMessage = error.message;
        
        // Check for specific errors
        if (error.message.includes('duplicate key') || error.message.includes('constraint')) {
          errorMessage = 'A merchant with this name already exists';
        } else if (error.message.includes('network')) {
          errorMessage = 'Network error - please check your connection';
        }
      }
      
      setSaveError(errorMessage);
      
      toast({
        title: 'Error',
        description: errorMessage,
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
        
        {useLocalStorage && (
          <Alert className="mb-4 bg-amber-50 text-amber-700 border-amber-200">
            <AlertTriangle className="h-5 w-5" />
            <AlertTitle>Using local storage</AlertTitle>
            <AlertDescription>
              Transactions will be saved to local storage. Your data will only be available on this device.
            </AlertDescription>
          </Alert>
        )}
        
        {saveError && (
          <Alert className="mb-4 bg-red-50 text-red-700 border-red-200">
            <AlertTriangle className="h-5 w-5" />
            <AlertTitle>Error saving transaction</AlertTitle>
            <AlertDescription>{saveError}</AlertDescription>
          </Alert>
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
