
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
  // Group transactions by date
  const groupedTransactions = transactions.reduce<Record<string, Transaction[]>>(
    (groups, transaction) => {
      const date = transaction.date;
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(transaction);
      return groups;
    },
    {}
  );

  // Sort the grouped transactions by date
  const sortedDates = Object.keys(groupedTransactions).sort((dateA, dateB) => {
    return sortOption.includes('desc')
      ? new Date(dateB).getTime() - new Date(dateA).getTime()
      : new Date(dateA).getTime() - new Date(dateB).getTime();
  });

  return (
    <div className="space-y-6">
      {sortedDates.map((date) => (
        <div key={date}>
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 sticky top-[146px] bg-background py-2 z-10">
            {formatDate(date)}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
            {groupedTransactions[date].map((transaction) => (
              <TransactionCard
                key={transaction.id}
                transaction={transaction}
                className="cursor-pointer animate-fade-in"
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
