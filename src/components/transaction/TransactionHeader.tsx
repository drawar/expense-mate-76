
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { PlusCircleIcon } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

const TransactionHeader = () => {
  const isMobile = useIsMobile();
  
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-10 mt-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gradient">Transactions</h1>
        <p className="text-muted-foreground mt-1.5 text-sm">
          View and filter your expense history
        </p>
      </div>
      
      <Link to="/add-expense">
        <Button className="w-full sm:w-auto mt-4 sm:mt-0 gap-2">
          <PlusCircleIcon className="h-4 w-4" />
          Add Expense
        </Button>
      </Link>
    </div>
  );
};

export default TransactionHeader;
