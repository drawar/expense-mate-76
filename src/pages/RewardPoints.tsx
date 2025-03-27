
import React from 'react';
import { useTransactionList } from '@/hooks/useTransactionList';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CoinsIcon } from 'lucide-react';
import PointsCurrencyAggregator from '@/components/expense/PointsCurrencyAggregator';
import { Transaction } from '@/types';
import StatementCycleFilter from '@/components/dashboard/StatementCycleFilter';

const RewardPoints = () => {
  const { 
    transactions, 
    filteredTransactions,
    setStatementPeriod, 
    statementPeriod 
  } = useTransactionList();

  return (
    <div className="container p-4 mx-auto">
      <h1 className="text-2xl font-bold mb-6 flex items-center">
        <CoinsIcon className="mr-2" /> Reward Points Analytics
      </h1>
      
      <div className="mb-6">
        <StatementCycleFilter 
          statementPeriod={statementPeriod} 
          setStatementPeriod={setStatementPeriod}
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <PointsCurrencyAggregator transactions={filteredTransactions} />
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CoinsIcon className="mr-2" />
              Points by Payment Method
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredTransactions.length > 0 ? (
              <PointsByPaymentMethod transactions={filteredTransactions} />
            ) : (
              <div className="text-center py-6 text-gray-500">
                No transactions in this period
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Helper component for displaying points by payment method
const PointsByPaymentMethod = ({ transactions }: { transactions: Transaction[] }) => {
  const pointsByMethod = transactions.reduce<Record<string, { points: number, currency: string }>>((acc, transaction) => {
    const methodName = transaction.paymentMethod.name;
    const pointsCurrency = transaction.paymentMethod.rewardRules?.[0]?.pointsCurrency || 'Points';
    
    if (!acc[methodName]) {
      acc[methodName] = { points: 0, currency: pointsCurrency };
    }
    
    acc[methodName].points += (transaction.rewardPoints || 0);
    return acc;
  }, {});

  return (
    <div className="space-y-2">
      {Object.entries(pointsByMethod).map(([method, { points, currency }]) => (
        <div key={method} className="flex justify-between items-center p-2 border-b">
          <span>{method}</span>
          <span className="font-semibold">{points.toLocaleString()} {currency}</span>
        </div>
      ))}
    </div>
  );
};

export default RewardPoints;
