
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { PlusCircleIcon, ArrowUpRightIcon } from 'lucide-react';
import { Transaction, PaymentMethod } from '@/types';
import { getTransactions, getPaymentMethods, initializeStorage } from '@/utils/storageUtils';
import { getCurrentDateString } from '@/utils/dateUtils';
import TransactionCard from '@/components/expense/TransactionCard';
import Summary from '@/components/dashboard/Summary';
import Navbar from '@/components/layout/Navbar';

const Index = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Initialize storage with defaults if needed
    initializeStorage();
    
    // Load transactions and payment methods
    const loadData = () => {
      const loadedTransactions = getTransactions();
      const loadedPaymentMethods = getPaymentMethods();
      
      setTransactions(loadedTransactions);
      setPaymentMethods(loadedPaymentMethods);
      setLoading(false);
    };
    
    loadData();
    
    // Add event listener for storage changes
    window.addEventListener('storage', loadData);
    
    return () => {
      window.removeEventListener('storage', loadData);
    };
  }, []);
  
  // Get recent transactions (last 7 days)
  const recentTransactions = transactions
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);
    
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container max-w-7xl mx-auto pt-24 pb-20 px-4 sm:px-6">
        {/* Title and Add Expense Button */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Expense Tracker</h1>
            <p className="text-muted-foreground mt-1">
              Track and manage your expenses
            </p>
          </div>
          
          <Link to="/add-expense">
            <Button className="mt-4 sm:mt-0 gap-2">
              <PlusCircleIcon className="h-4 w-4" />
              Add Expense
            </Button>
          </Link>
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <div className="animate-pulse-slow">Loading...</div>
          </div>
        ) : (
          <>
            {/* Summary Section */}
            <div className="mb-10">
              <Summary 
                transactions={transactions} 
                paymentMethods={paymentMethods}
              />
            </div>
            
            {/* Recent Transactions */}
            <div className="mt-10">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Recent Transactions</h2>
                <Link to="/transactions" className="text-primary flex items-center text-sm font-medium">
                  View All <ArrowUpRightIcon className="ml-1 h-4 w-4" />
                </Link>
              </div>
              
              {recentTransactions.length === 0 ? (
                <div className="glass-card rounded-xl p-8 text-center">
                  <p className="text-muted-foreground mb-4">No transactions recorded yet.</p>
                  <Link to="/add-expense">
                    <Button>
                      <PlusCircleIcon className="mr-2 h-4 w-4" />
                      Record Your First Expense
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {recentTransactions.map((transaction) => (
                    <TransactionCard
                      key={transaction.id}
                      transaction={transaction}
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
      </main>
    </div>
  );
};

export default Index;
