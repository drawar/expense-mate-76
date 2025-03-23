
import { PlusCircleIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

interface TransactionEmptyStateProps {
  hasTransactions: boolean;
  onResetFilters: () => void;
}

const TransactionEmptyState = ({
  hasTransactions,
  onResetFilters,
}: TransactionEmptyStateProps) => {
  return (
    <div className="glass-card rounded-xl p-8 text-center">
      <p className="text-muted-foreground mb-4">
        {hasTransactions
          ? 'No transactions match your filters.'
          : 'No transactions recorded yet.'}
      </p>
      
      {hasTransactions ? (
        <Button variant="outline" onClick={onResetFilters}>
          Reset Filters
        </Button>
      ) : (
        <Link to="/add-expense">
          <Button>
            <PlusCircleIcon className="mr-2 h-4 w-4" />
            Record Your First Expense
          </Button>
        </Link>
      )}
    </div>
  );
};

export default TransactionEmptyState;
