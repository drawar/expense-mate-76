
import { Transaction, PaymentMethod } from '@/types';
import { SortOption, ViewMode } from '@/components/transaction/TransactionSortAndView';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import TransactionGroupView from '@/components/transaction/TransactionGroupView';
import TransactionTable from '@/components/expense/TransactionTable';
import TransactionEmptyState from '@/components/transaction/TransactionEmptyState';
import { useIsMobile } from '@/hooks/use-mobile';

interface TransactionContentProps {
  isLoading: boolean;
  transactions: Transaction[];
  filteredTransactions: Transaction[];
  paymentMethods: PaymentMethod[];
  viewMode: ViewMode;
  sortOption: SortOption;
  onViewChange: (value: ViewMode) => void;
  onResetFilters: () => void;
  onViewTransaction: (transaction: Transaction) => void;
  onEditTransaction: (transaction: Transaction) => void;
  onDeleteTransaction: (transaction: Transaction) => void;
}

const TransactionContent = ({
  isLoading,
  transactions,
  filteredTransactions,
  paymentMethods,
  viewMode,
  sortOption,
  onViewChange,
  onResetFilters,
  onViewTransaction,
  onEditTransaction,
  onDeleteTransaction
}: TransactionContentProps) => {
  const isMobile = useIsMobile();
  
  if (isLoading) {
    return (
      <div className="animate-pulse-slow flex items-center justify-center py-12">
        Loading transactions...
      </div>
    );
  }
  
  if (filteredTransactions.length === 0) {
    return (
      <TransactionEmptyState 
        hasTransactions={transactions.length > 0}
        onResetFilters={onResetFilters}
      />
    );
  }
  
  // For mobile view, use tabs
  if (isMobile) {
    return (
      <div className="space-y-8 animate-enter">
        <Tabs 
          defaultValue={viewMode} 
          value={viewMode}
          onValueChange={(value) => onViewChange(value as ViewMode)} 
          className="w-full"
        >
          <TabsList className="w-full grid grid-cols-2 mb-4">
            <TabsTrigger value="grid">Card View</TabsTrigger>
            <TabsTrigger value="table">Table View</TabsTrigger>
          </TabsList>
          
          <TabsContent value="grid" className="animate-enter">
            <TransactionGroupView
              transactions={filteredTransactions}
              sortOption={sortOption}
              onViewTransaction={onViewTransaction}
            />
          </TabsContent>
          
          <TabsContent value="table" className="animate-enter">
            <TransactionTable
              transactions={filteredTransactions}
              paymentMethods={paymentMethods}
              onEdit={onEditTransaction}
              onDelete={onDeleteTransaction}
              onView={onViewTransaction}
            />
          </TabsContent>
        </Tabs>
        
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Showing {filteredTransactions.length} of {transactions.length} transactions
        </div>
      </div>
    );
  }
  
  // For desktop view, use the selected mode directly
  return (
    <div className="space-y-8 animate-enter">
      <div className="animate-enter">
        {viewMode === 'grid' ? (
          <TransactionGroupView
            transactions={filteredTransactions}
            sortOption={sortOption}
            onViewTransaction={onViewTransaction}
          />
        ) : (
          <TransactionTable
            transactions={filteredTransactions}
            paymentMethods={paymentMethods}
            onEdit={onEditTransaction}
            onDelete={onDeleteTransaction}
            onView={onViewTransaction}
          />
        )}
      </div>
      
      <div className="text-sm text-gray-500 dark:text-gray-400">
        Showing {filteredTransactions.length} of {transactions.length} transactions
      </div>
    </div>
  );
};

export default TransactionContent;
