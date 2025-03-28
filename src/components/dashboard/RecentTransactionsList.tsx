// src/components/dashboard/RecentTransactionsList.tsx
import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { Transaction } from '@/types';
import { Button } from '@/components/ui/button';
import { PlusCircleIcon, ArrowUpRightIcon } from 'lucide-react';
import TransactionCard from '@/components/expense/TransactionCard';
import { useIsMobile } from '@/hooks/use-mobile';

interface RecentTransactionsListProps {
  recentTransactions: Transaction[];
  isMobile: boolean;
}

/**
 * Component that displays a list of recent transactions
 * Implements the responsibility of showing transaction history
 */
class RecentTransactionsListComponent extends Component<RecentTransactionsListProps> {
  /**
   * Render the empty state when no transactions are available
   */
  private renderEmptyState() {
    const { isMobile } = this.props;
    
    return (
      <div className="glass-card p-8 text-center rounded-xl border border-border/50 bg-card hover:shadow-md transition-all">
        <p className="text-muted-foreground mb-4">No transactions recorded yet.</p>
        <Link to="/add-expense">
          <Button className={`btn-hover-effect bg-gradient-to-r from-[#6366f1] to-[#a855f7] ${!isMobile ? 'gap-2' : 'w-10 h-10 p-0'}`}>
            <PlusCircleIcon className={isMobile ? "h-4 w-4" : "mr-2 h-4 w-4"} />
            {!isMobile && <span>Record Your First Expense</span>}
          </Button>
        </Link>
      </div>
    );
  }
  
  /**
   * Render the transaction cards grid
   */
  private renderTransactionCards() {
    const { recentTransactions } = this.props;
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {recentTransactions.map((transaction) => (
          <TransactionCard 
            key={transaction.id} 
            transaction={transaction}
            className="glass-card-elevated rounded-xl border border-border/50 bg-card hover:shadow-md hover:scale-[1.01] transition-all"
            onClick={() => {
              // You could navigate to a transaction detail page here
            }}
          />
        ))}
      </div>
    );
  }
  
  render() {
    const { recentTransactions } = this.props;
    
    return (
      <div className="mt-4">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-medium tracking-tight">Recent Transactions</h2>
          <Link to="/transactions" className="interactive-link text-primary flex items-center text-sm font-medium">
            View All <ArrowUpRightIcon className="ml-1 h-4 w-4" />
          </Link>
        </div>
        
        {recentTransactions.length === 0 
          ? this.renderEmptyState() 
          : this.renderTransactionCards()
        }
      </div>
    );
  }
}

/**
 * Higher-order component to provide isMobile to the class component
 */
const RecentTransactionsList = ({ recentTransactions }: { recentTransactions: Transaction[] }) => {
  const isMobile = useIsMobile();
  
  return <RecentTransactionsListComponent 
    recentTransactions={recentTransactions} 
    isMobile={isMobile} 
  />;
};

export default RecentTransactionsList;
