
import { useMemo } from 'react';
import { Transaction } from '@/types';
import { formatDate } from '@/utils/dateUtils';
import TransactionCard from '@/components/expense/TransactionCard';

interface TransactionGroupViewProps {
  transactions: Transaction[];
  sortOption: string;
  onViewTransaction: (transaction: Transaction) => void;
}

const TransactionGroupView = ({
  transactions,
  sortOption,
  onViewTransaction,
}: TransactionGroupViewProps) => {
  // Memoize grouped transactions to prevent unnecessary recalculations
  const { groupedTransactions, sortedDates } = useMemo(() => {
    // Group transactions by date
    const groups: Record<string, Transaction[]> = {};
    
    // Single pass through transactions to create groups
    for (const transaction of transactions) {
      const date = transaction.date;
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(transaction);
    }

    // Sort the grouped transactions by date
    const dates = Object.keys(groups).sort((dateA, dateB) => {
      return sortOption.includes('desc')
        ? new Date(dateB).getTime() - new Date(dateA).getTime()
        : new Date(dateA).getTime() - new Date(dateB).getTime();
    });
    
    return { groupedTransactions: groups, sortedDates: dates };
  }, [transactions, sortOption]);

  return (
    <div className="space-y-6">
      {sortedDates.map((date, dateIndex) => (
        <div key={date}>
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 bg-background py-2">
            {formatDate(date)}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
            {groupedTransactions[date].map((transaction, txIndex) => (
              <TransactionCard
                key={transaction.id}
                transaction={transaction}
                className=""
                onClick={() => onViewTransaction(transaction)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default TransactionGroupView;
