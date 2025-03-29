// src/components/dashboard/cards/SpendingTrendsCard.tsx
import React, { useState, useMemo } from 'react';
import { TrendingUpIcon, TrendingDownIcon, InfoIcon } from 'lucide-react';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Transaction, Currency } from '@/types';
import { formatCurrency } from '@/utils/formatting';
import SpendingTrendChart from '@/components/dashboard/charts/SpendingTrendChart';

interface SpendingTrendsCardProps {
  title: string;
  transactions: Transaction[];
  period?: 'week' | 'month' | 'quarter' | 'year';
  showAverage?: boolean;
  showInsights?: boolean;
  currency?: Currency;
  className?: string;
}

const DEFAULT_CURRENCY: Currency = 'SGD'; 

/**
 * Card component for displaying spending trends over time
 */
const SpendingTrendsCard: React.FC<SpendingTrendsCardProps> = ({
  title,
  transactions,
  period: initialPeriod = 'month',
  showAverage = true,
  showInsights = true,
  currency = DEFAULT_CURRENCY,
  className = ''
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState(initialPeriod);
  
  // Process transactions to calculate trend data
  const { trendData, trend, average } = useMemo(() => {
    if (transactions.length === 0) {
      return { trendData: [], trend: 0, average: 0 };
    }
    
    // Determine the grouping period based on selected time frame
    const periodMapping = {
      week: 'day',
      month: 'week',
      quarter: 'month',
      year: 'month'
    };
    
    // Group transactions by date
    const dateMap = new Map<string, number>();
    
    transactions.forEach(tx => {
      const txDate = new Date(tx.date);
      let key: string;
      
      switch (periodMapping[selectedPeriod as keyof typeof periodMapping]) {
        case 'day':
          key = txDate.toISOString().split('T')[0]; // YYYY-MM-DD
          break;
        case 'week':
          // Get the start of the week (Sunday)
          const startOfWeek = new Date(txDate);
          startOfWeek.setDate(txDate.getDate() - txDate.getDay());
          key = startOfWeek.toISOString().split('T')[0];
          break;
        case 'month':
          key = `${txDate.getFullYear()}-${String(txDate.getMonth() + 1).padStart(2, '0')}`;
          break;
        default:
          key = txDate.toISOString().split('T')[0];
      }
      
      const existingAmount = dateMap.get(key) || 0;
      dateMap.set(key, existingAmount + tx.amount);
    });
    
    // Convert to array for analysis and sort by date
    const sortedKeys = Array.from(dateMap.keys()).sort();
    const data = sortedKeys.map(key => {
      return {
        period: key,
        amount: dateMap.get(key) || 0
      };
    });
    
    // Calculate trend
    let calculatedTrend = 0;
    if (data.length >= 2) {
      const currentAmount = data[data.length - 1].amount;
      const previousAmount = data[data.length - 2].amount;
      
      if (previousAmount === 0) {
        calculatedTrend = 100; // If previous period was 0, show 100% increase
      } else {
        calculatedTrend = ((currentAmount - previousAmount) / previousAmount) * 100;
      }
    }
    
    // Calculate average
    const calculatedAverage = data.length > 0
      ? data.reduce((sum, item) => sum + item.amount, 0) / data.length
      : 0;
    
    return { 
      trendData: data, 
      trend: calculatedTrend, 
      average: calculatedAverage 
    };
  }, [transactions, selectedPeriod]);
  
  // Handle period change
  const handlePeriodChange = (value: string) => {
    setSelectedPeriod(value as 'week' | 'month' | 'quarter' | 'year');
  };
  
  return (
    <Card className={`rounded-xl border border-border/50 bg-card hover:shadow-md transition-all overflow-hidden ${className}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl flex items-center gap-2">
            <TrendingUpIcon className="h-5 w-5 text-primary" />
            {title}
          </CardTitle>
          
          <Select 
            value={selectedPeriod} 
            onValueChange={handlePeriodChange}
          >
            <SelectTrigger className="w-32 h-8">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Weekly</SelectItem>
              <SelectItem value="month">Monthly</SelectItem>
              <SelectItem value="quarter">Quarterly</SelectItem>
              <SelectItem value="year">Yearly</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      
      <CardContent>
        {trendData.length < 2 ? (
          <div className="space-y-4">
            <div className="flex items-center justify-center h-48 text-muted-foreground">
              <div className="text-center">
                <InfoIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Not enough data to display spending trends</p>
                <p className="text-sm text-muted-foreground mt-1">Try adjusting the time period or add more transactions</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Trend</p>
                <div className="flex items-center gap-1 mt-1">
                  {trend >= 0 ? (
                    <TrendingUpIcon className="h-4 w-4 text-red-600 dark:text-red-400" />
                  ) : (
                    <TrendingDownIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
                  )}
                  <span className={trend >= 0 
                    ? "font-medium text-red-600 dark:text-red-400"
                    : "font-medium text-green-600 dark:text-green-400"
                  }>
                    {Math.abs(trend).toFixed(1)}%
                  </span>
                </div>
              </div>
              
              {showAverage && (
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Average</p>
                  <p className="font-medium mt-1">
                    {formatCurrency(average, currency)}
                  </p>
                </div>
              )}
            </div>
            
            {/* Embed the optimized SpendingTrendChart component */}
            <SpendingTrendChart 
              transactions={transactions}
              period={selectedPeriod}
              currency={currency}
              showInsights={showInsights}
              colorScheme={{
                barColor: "#8884d8",
                hoverColor: "#7676d6"
              }}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default React.memo(SpendingTrendsCard);
