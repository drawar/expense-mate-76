
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { PlusCircleIcon } from 'lucide-react';

const TransactionHeader = () => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Transactions</h1>
        <p className="text-muted-foreground mt-1">
          View and filter your expense history
        </p>
      </div>
      
      <Link to="/add-expense">
        <Button className="mt-4 sm:mt-0 gap-2">
          <PlusCircleIcon className="h-4 w-4" />
          Add Expense
        </Button>
      </Link>
    </div>
  );
};

export default TransactionHeader;
