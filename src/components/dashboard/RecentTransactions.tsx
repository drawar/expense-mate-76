// src/components/dashboard/RecentTransactions.tsx
import React, { useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Transaction } from '@/types';
import { Button } from '@/components/ui/button';
import { PlusCircleIcon, ArrowUpRightIcon } from 'lucide-react';
import TransactionCard from '@/components/expense/TransactionCard';
import { useMediaQuery } from '@/hooks/useMediaQuery';

interface RecentTransactionsProps {
  transactions: Transaction[];
  maxItems?: number;
}

/**
 * Displays the most recent transactions in a grid layout
 * Optimized with memoization and stable callbacks to prevent unnecessary re-renders
 */
const RecentTransactions: React.FC<RecentTransactionsProps> = ({
  transactions,
  maxItems = 5
}) => {
  // Use the media query hook for responsive design
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  // Memoize the limited transactions to prevent unnecessary processing
  const recentTransactions = useMemo(() => {
    console.log('Processing recent transactions');
    return transactions
      .slice(0, maxItems)
      .map(transaction => ({
        ...transaction,
        // Pre-process any data needed by children to avoid passing the entire transaction
        id: transaction.id,
        // Only include necessary fields to minimize unnecessary re-renders
      }));
  }, [transactions, maxItems]);
  
  // Render the empty state when no transactions are available
  const renderEmptyState = useCallback(() => {
    return (
      <div className="glass-card p-6 sm:p-8 text-center rounded-xl border border-border/50 bg-card hover:shadow-md transition-all">
        <p className="text-muted-foreground mb-4">No transactions recorded yet.</p>
        <Link to="/add-expense">
          <Button className={`btn-hover-effect bg-gradient-to-r from-[#6366f1] to-[#a855f7] ${!isMobile ? 'gap-2' : 'w-10 h-10 p-0'}`}>
            <PlusCircleIcon className={isMobile ? "h-4 w-4" : "mr-2 h-4 w-4"} />
            {!isMobile && <span>Record Your First Expense</span>}
          </Button>
        </Link>
      </div>
    );
  }, [isMobile]);
  
  console.log(`RecentTransactions rendering with ${recentTransactions.length} transactions`);
  
  // Create a stable reference for the transaction cards
  const transactionCards = useMemo(() => {
    if (recentTransactions.length === 0) {
      return renderEmptyState();
    }
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {recentTransactions.map((transaction) => (
          <TransactionCard 
            key={transaction.id} 
            transaction={transaction}
            className="glass-card-elevated rounded-xl border border-border/50 bg-card hover:shadow-md hover:scale-[1.01] transition-all"
          />
        ))}
      </div>
    );
  }, [recentTransactions, renderEmptyState]);
  
  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-[#6366f1] to-[#a855f7]">
          Recent Transactions
        </h2>
        <Link to="/transactions" className="interactive-link text-primary flex items-center text-sm font-medium">
          View All <ArrowUpRightIcon className="ml-1 h-4 w-4" />
        </Link>
      </div>
      
      {transactionCards}
    </div>
  );
};

// Use memo to prevent unnecessary re-renders
export default React.memo(RecentTransactions);
