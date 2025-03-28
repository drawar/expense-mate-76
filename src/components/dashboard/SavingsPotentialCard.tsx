import React from 'react';
import { TrendingUpIcon } from 'lucide-react';
import { Transaction } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface SavingsPotentialCardProps {
  transactions: Transaction[];
}

const SavingsPotentialCard: React.FC<SavingsPotentialCardProps> = ({ transactions }) => {
  // Simple calculation for savings potential based on transaction data
  // In a real implementation, this would use more sophisticated logic
  const calculateSavingsPotential = (): number => {
    if (transactions.length === 0) return 0;
    
    // Calculate total spend
    const totalSpend = transactions.reduce((sum, tx) => sum + tx.amount, 0);
    
    // For demo purposes, estimate savings as 5-15% of total spend
    const savingsRate = 0.05 + Math.random() * 0.1; // Between 5% and 15%
    return totalSpend * savingsRate;
  };

  const savingsPotential = calculateSavingsPotential();
  
  return (
    <Card className="rounded-xl border border-border/50 bg-card hover:shadow-md transition-all">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <TrendingUpIcon className="h-5 w-5 text-emerald-500" />
          <CardTitle className="text-xl font-medium tracking-tight">Savings Potential</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="mt-2">
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              ${savingsPotential.toFixed(2)}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Estimated monthly savings by optimizing expenses
            </p>
          </div>
          
          <div className="text-sm text-muted-foreground space-y-2">
            <p className="flex items-center">
              <span className="w-3 h-3 rounded-full bg-emerald-400 mr-2 inline-block"></span>
              Optimize recurring subscriptions
            </p>
            <p className="flex items-center">
              <span className="w-3 h-3 rounded-full bg-emerald-400 mr-2 inline-block"></span>
              Use cards with better rewards
            </p>
            <p className="flex items-center">
              <span className="w-3 h-3 rounded-full bg-emerald-400 mr-2 inline-block"></span>
              Identify unnecessary expenses
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SavingsPotentialCard;