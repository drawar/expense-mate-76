
import React, { useMemo } from 'react';
import { Transaction } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CoinsIcon } from 'lucide-react';

interface PointsCurrencyAggregatorProps {
  transactions: Transaction[];
}

interface PointsAggregate {
  [currency: string]: number;
}

const PointsCurrencyAggregator: React.FC<PointsCurrencyAggregatorProps> = ({ transactions }) => {
  const pointsByCurrency = useMemo(() => {
    return transactions.reduce<PointsAggregate>((acc, transaction) => {
      // Get points currency from payment method or fall back to generic "Points"
      const pointsCurrency = 
        transaction.paymentMethod.rewardRules?.[0]?.pointsCurrency || 
        transaction.paymentMethod.name + ' Points';
      
      acc[pointsCurrency] = (acc[pointsCurrency] || 0) + (transaction.rewardPoints || 0);
      return acc;
    }, {});
  }, [transactions]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <CoinsIcon className="mr-2" />
          Points by Currency
        </CardTitle>
      </CardHeader>
      <CardContent>
        {Object.keys(pointsByCurrency).length > 0 ? (
          Object.entries(pointsByCurrency).map(([currency, points]) => (
            <div key={currency} className="flex justify-between items-center mb-2 p-2 border-b">
              <span>{currency}</span>
              <span className="font-bold">{points.toLocaleString()}</span>
            </div>
          ))
        ) : (
          <div className="text-center py-6 text-gray-500">
            No reward points in this period
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PointsCurrencyAggregator;
