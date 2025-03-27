import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  PlusCircleIcon, 
  ArrowUpRightIcon
} from 'lucide-react';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { Transaction, PaymentMethod } from '@/types';
import { getTransactions, getPaymentMethods } from '@/utils/storageUtils';
import TransactionCard from '@/components/expense/TransactionCard';
import Summary from '@/components/dashboard/Summary';
import { supabase, USE_LOCAL_STORAGE_DEFAULT } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

// Type for Supabase real-time payload
interface RealtimePayload {
  new?: { date?: string; [key: string]: any };
  old?: { date?: string; [key: string]: any };
}

const Index = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const isMobile = useIsMobile();
  
  // Use ref to prevent unnecessary reloads
  const initialized = useRef(false);
  
  // Define loadData outside useEffect for reuse
  const loadData = useCallback(async () => {
    try {
      if (!initialized.current) {
        setLoading(true);
        initialized.current = true;
      }
      
      // Get only recent transactions for homepage (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      // Get payment methods - these are typically few in number
      const loadedPaymentMethods = await getPaymentMethods();
      
      // Get transactions and filter to recent ones client-side
      const allTransactions = await getTransactions(USE_LOCAL_STORAGE_DEFAULT);
      
      // Filter to only recent transactions (last 30 days) to improve performance
      const loadedTransactions = allTransactions.filter(tx => {
        const txDate = new Date(tx.date);
        return txDate >= thirtyDaysAgo;
      }).slice(0, 50); // Limit to 50 most recent transactions for homepage performance
      
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
  }, [toast]);
  
  useEffect(() => {
    // Load data on component mount
    loadData();
    
    // Set up real-time subscription for transactions, but only reload recent data
    const channel = supabase
      .channel('public:transactions')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'transactions'
      }, (payload: RealtimePayload) => {
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
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadData]);
  
  // Get most recent 5 transactions for display - memoize this calculation
  const recentTransactions = useMemo(() => {
    return transactions
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }, [transactions]);
    
  return (
    <div className="min-h-screen">  
      <div className="container max-w-7xl mx-auto pb-16">
            {/* Title and Add Expense Button */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-10 mt-4">
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-gradient">
                  Expense Tracker
                </h1>
                <p className="text-muted-foreground mt-1.5 text-sm">
                  Track and manage your expenses
                </p>
              </div>
              
              <div className="flex items-center gap-3 mt-4 sm:mt-0">
                <ThemeToggle />
                <Link to="/add-expense">
                  <Button className={`btn-hover-effect bg-gradient-to-r from-[#6366f1] to-[#a855f7] ${!isMobile ? 'gap-2' : 'w-10 h-10 p-0'}`}>
                    <PlusCircleIcon className="h-4 w-4" />
                    {!isMobile && <span>Add Expense</span>}
                  </Button>
                </Link>
              </div>
            </div>
            
            {loading ? (
              <div className="flex items-center justify-center py-10">
                <div className="animate-pulse-slow text-gray-500">Loading...</div>
              </div>
            ) : (
              <>
                {/* Summary Section */}
                <div className="mb-12 animate-enter">
                  <Summary 
                    transactions={transactions} 
                    paymentMethods={paymentMethods}
                  />
                </div>
                
                {/* Recent Transactions */}
                <div className="mt-12 animate-enter" style={{ animationDelay: '100ms' }}>
                  <div className="flex items-center justify-between mb-5">
                    <h2 className="text-xl font-medium">Recent Transactions</h2>
                    <Link to="/transactions" className="interactive-link text-primary flex items-center text-sm font-medium">
                      View All <ArrowUpRightIcon className="ml-1 h-4 w-4" />
                    </Link>
                  </div>
                  
                  {recentTransactions.length === 0 ? (
                    <div className="glass-card p-8 text-center">
                      <p className="text-muted-foreground mb-4">No transactions recorded yet.</p>
                      <Link to="/add-expense">
                        <Button className={`btn-hover-effect bg-gradient-to-r from-[#6366f1] to-[#a855f7] ${!isMobile ? 'gap-2' : 'w-10 h-10 p-0'}`}>
                          <PlusCircleIcon className={isMobile ? "h-4 w-4" : "mr-2 h-4 w-4"} />
                          {!isMobile && <span>Record Your First Expense</span>}
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                      {recentTransactions.map((transaction, index) => (
                        <TransactionCard
                          key={transaction.id}
                          transaction={transaction}
                          className="glass-card-elevated animate-enter"
                          style={{ animationDelay: `${(index + 1) * 75}ms` }}
                          onClick={() => {
                            // You could navigate to a transaction detail page here
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
      </div>
    </div>
  );
};

export default Index;