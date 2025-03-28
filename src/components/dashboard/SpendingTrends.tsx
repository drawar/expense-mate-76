import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUpIcon, TrendingDownIcon } from 'lucide-react';
import { Transaction } from '@/types';
import { formatCurrency } from '@/utils/currencyFormatter';

interface SpendingTrendsProps {
  transactions: Transaction[];
}

const SpendingTrends: React.FC<SpendingTrendsProps> = ({ transactions }) => {
  // Calculate data for spending trend chart - group by week
  const trendData = useMemo(() => {
    if (!transactions.length) return [];

    // Create a map of day -> total spending
    const dateMap = new Map<string, number>();
    
    // Group transactions by date (YYYY-MM-DD)
    transactions.forEach(tx => {
      const txDate = new Date(tx.date);
      const dateKey = txDate.toISOString().split('T')[0];
      
      const existingAmount = dateMap.get(dateKey) || 0;
      dateMap.set(dateKey, existingAmount + tx.amount);
    });
    
    // Convert to array sorted by date
    const sortedEntries = Array.from(dateMap.entries())
      .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime());
    
    // Create chart data with formatted dates
    return sortedEntries.map(([date, amount]) => {
      const dateObj = new Date(date);
      return {
        date: `${dateObj.getMonth() + 1}/${dateObj.getDate()}`,
        amount: amount,
        fullDate: date // Keep the full date for tooltips
      };
    });
  }, [transactions]);

  // Calculate month-over-month change
  const monthOverMonthChange = useMemo(() => {
    if (trendData.length < 14) return 0;
    
    // Get data for last 7 days and previous 7 days
    const lastWeekTotal = trendData.slice(-7).reduce((sum, day) => sum + day.amount, 0);
    const previousWeekTotal = trendData.slice(-14, -7).reduce((sum, day) => sum + day.amount, 0);
    
    if (previousWeekTotal === 0) return 100; // If previous week was 0, show 100% increase
    
    return ((lastWeekTotal - previousWeekTotal) / previousWeekTotal) * 100;
  }, [trendData]);

  // Custom tooltip for the chart
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border p-2 rounded-md shadow-md">
          <p className="font-medium">{new Date(payload[0].payload.fullDate).toLocaleDateString()}</p>
          <p className="text-primary">{formatCurrency(payload[0].value, 'USD')}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="rounded-xl border border-border/50 bg-card hover:shadow-md transition-all overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl flex items-center gap-2">
            <TrendingUpIcon className="h-5 w-5 text-primary" />
            Spending Trends
          </CardTitle>
          <div className={`flex items-center gap-1 text-sm font-medium rounded-full px-2 py-0.5 ${monthOverMonthChange > 0 ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'}`}>
            {monthOverMonthChange > 0 ? (
              <>
                <TrendingUpIcon className="h-3.5 w-3.5" />
                <span>{monthOverMonthChange.toFixed(1)}%</span>
              </>
            ) : (
              <>
                <TrendingDownIcon className="h-3.5 w-3.5" />
                <span>{Math.abs(monthOverMonthChange).toFixed(1)}%</span>
              </>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {trendData.length > 0 ? (
          <div className="w-full h-48 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={trendData}
                margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.3} />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  stroke="var(--muted-foreground)"
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  stroke="var(--muted-foreground)"
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `$${value}`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="amount"
                  stroke="var(--primary)"
                  strokeWidth={2}
                  dot={{ fill: 'var(--primary)', r: 4 }}
                  activeDot={{ r: 6, fill: 'var(--primary)', stroke: 'var(--background)' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex items-center justify-center h-48 text-muted-foreground">
            <p>Not enough data to show spending trends</p>
          </div>
        )}
        
        <div className="mt-4 text-sm text-muted-foreground">
          <p>
            {monthOverMonthChange > 0 
              ? 'Your spending has increased compared to last week. Consider reviewing your budget.' 
              : 'Your spending has decreased compared to last week. Great job!'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default SpendingTrends;
