
import React, { useState } from 'react';
import { useTransactionList } from '@/hooks/useTransactionList';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CoinsIcon } from 'lucide-react';
import PointsCurrencyAggregator from '@/components/expense/PointsCurrencyAggregator';
import { Transaction } from '@/types';
import StatementCycleFilter from '@/components/dashboard/filters/StatementCycleFilter';
import { rewardCalculatorService } from '@/services/rewards';

// Helper component for displaying points by payment method
const PointsByPaymentMethod = ({ transactions }: { transactions: Transaction[] }) => {
  const pointsByMethod = transactions.reduce<Record<string, { points: number, currency: string }>>((acc, transaction) => {
    if (!transaction.paymentMethod || !transaction.rewardPoints) return acc;
    
    const methodName = transaction.paymentMethod.name;
    // Get the correct points currency for this payment method
    const pointsCurrency =  rewardService.getPointsCurrency(transaction.paymentMethod);
    
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

const RewardPoints = () => {
  const { 
    transactions, 
    filteredTransactions,
  } = useTransactionList();

  // Local state for statement cycle filtering
  const [useStatementMonth, setUseStatementMonth] = useState(false);
  const [statementCycleDay, setStatementCycleDay] = useState(1);
  
  return (
    <div className="min-h-screen">
      <div className="container max-w-7xl mx-auto pb-16">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-10 mt-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gradient">
              Reward Points Analytics
            </h1>
            <p className="text-muted-foreground mt-1.5 text-sm">
              Track and analyze your reward points
            </p>
          </div>
          
          <div className="flex items-center gap-3 mt-4 sm:mt-0">
            {/* Empty div to ensure consistent layout with other pages */}
          </div>
        </div>
        
        <div className="mb-6">
          <StatementCycleFilter 
            useStatementMonth={useStatementMonth}
            setUseStatementMonth={setUseStatementMonth}
            statementCycleDay={statementCycleDay}
            setStatementCycleDay={setStatementCycleDay}
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
    </div>
  );
};

export default RewardPoints;
