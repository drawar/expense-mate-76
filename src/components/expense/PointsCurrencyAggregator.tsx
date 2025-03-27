
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
      const pointsCurrency = transaction.paymentMethod.rewardRules[0]?.pointsCurrency || 'Points';
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
        {Object.entries(pointsByCurrency).map(([currency, points]) => (
          <div key={currency} className="flex justify-between items-center mb-2">
            <span>{currency}</span>
            <span className="font-bold">{points.toLocaleString()}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default PointsCurrencyAggregator;
