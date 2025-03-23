
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatCurrency } from '@/utils/currencyFormatter';
import { Transaction, Currency, PaymentMethod } from '@/types';
import { getTotalRewardPoints } from '@/utils/rewardPoints';
import { CreditCardIcon, TrendingUpIcon, CoinsIcon, CalendarIcon } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface SummaryProps {
  transactions: Transaction[];
  paymentMethods: PaymentMethod[];
}

// Color palette for charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A259FF', '#4BC0C0', '#FF6B6B', '#6B8E23'];

const Summary = ({ transactions, paymentMethods }: SummaryProps) => {
  const [activeTab, setActiveTab] = useState('thisMonth');
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  
  // Filter transactions based on selected time period
  useEffect(() => {
    const now = new Date();
    const filteredTxs = transactions.filter(tx => {
      const txDate = new Date(tx.date);
      
      switch (activeTab) {
        case 'thisMonth': 
          return txDate.getMonth() === now.getMonth() && txDate.getFullYear() === now.getFullYear();
        case 'lastMonth':
          const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1);
          return txDate.getMonth() === lastMonth.getMonth() && txDate.getFullYear() === lastMonth.getFullYear();
        case 'lastThreeMonths':
          const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3);
          return txDate >= threeMonthsAgo;
        case 'thisYear':
          return txDate.getFullYear() === now.getFullYear();
        default:
          return true;
      }
    });
    
    setFilteredTransactions(filteredTxs);
  }, [activeTab, transactions]);
  
  // Calculate total expenses in default currency (USD)
  const totalExpenses = filteredTransactions.reduce(
    (sum, tx) => sum + (tx.currency === 'USD' ? tx.amount : tx.paymentAmount), 
    0
  );
  
  // Calculate total reward points
  const totalRewardPoints = getTotalRewardPoints(filteredTransactions);
  
  // Transaction count
  const transactionCount = filteredTransactions.length;
  
  // Average transaction amount (in USD)
  const averageAmount = transactionCount ? totalExpenses / transactionCount : 0;
  
  // Group expenses by payment method
  const expensesByPaymentMethod = filteredTransactions.reduce<Record<string, number>>(
    (acc, tx) => {
      const methodName = tx.paymentMethod.name;
      if (!acc[methodName]) {
        acc[methodName] = 0;
      }
      acc[methodName] += tx.currency === 'USD' ? tx.amount : tx.paymentAmount;
      return acc;
    }, {}
  );
  
  // Group expenses by merchant category
  const expensesByCategory = filteredTransactions.reduce<Record<string, number>>(
    (acc, tx) => {
      const category = tx.merchant.mcc?.description || 'Uncategorized';
      if (!acc[category]) {
        acc[category] = 0;
      }
      acc[category] += tx.currency === 'USD' ? tx.amount : tx.paymentAmount;
      return acc;
    }, {}
  );
  
  // Prepare data for payment method chart
  const paymentMethodChartData = Object.entries(expensesByPaymentMethod).map(
    ([name, amount], index) => ({
      name,
      value: amount,
      color: COLORS[index % COLORS.length]
    })
  );
  
  // Prepare data for category chart
  const categoryChartData = Object.entries(expensesByCategory).map(
    ([name, amount], index) => ({
      name,
      value: amount,
      color: COLORS[index % COLORS.length]
    })
  );
  
  return (
    <div className="space-y-6 w-full">
      <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Expense Summary</h2>
          <TabsList>
            <TabsTrigger value="thisMonth">This Month</TabsTrigger>
            <TabsTrigger value="lastMonth">Last Month</TabsTrigger>
            <TabsTrigger value="lastThreeMonths">Last 3 Months</TabsTrigger>
            <TabsTrigger value="thisYear">This Year</TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value={activeTab} className="mt-4 space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Expenses</CardDescription>
                <CardTitle className="text-2xl">{formatCurrency(totalExpenses, 'USD')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xs text-muted-foreground">
                  {transactionCount} transactions
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Average Transaction</CardDescription>
                <CardTitle className="text-2xl">{formatCurrency(averageAmount, 'USD')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xs text-muted-foreground flex items-center">
                  <TrendingUpIcon className="w-3.5 h-3.5 mr-1" /> 
                  Per transaction
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Most Used Payment</CardDescription>
                <CardTitle className="text-xl line-clamp-1">
                  {paymentMethodChartData[0]?.name || 'None'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xs text-muted-foreground flex items-center">
                  <CreditCardIcon className="w-3.5 h-3.5 mr-1" />
                  {paymentMethodChartData[0] 
                    ? formatCurrency(paymentMethodChartData[0].value, 'USD')
                    : 'No data'}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Reward Points</CardDescription>
                <CardTitle className="text-2xl">{totalRewardPoints.toLocaleString()}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xs text-muted-foreground flex items-center">
                  <CoinsIcon className="w-3.5 h-3.5 mr-1" /> 
                  Points earned
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Charts Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Payment Methods Chart */}
            <Card className="p-4">
              <CardHeader className="pb-0 pt-0">
                <CardTitle className="text-lg">Expenses by Payment Method</CardTitle>
              </CardHeader>
              <CardContent className="h-64">
                {paymentMethodChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={paymentMethodChartData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        innerRadius={40}
                        paddingAngle={2}
                        dataKey="value"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {paymentMethodChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: number) => formatCurrency(value, 'USD')}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground">
                    No data available
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Categories Chart */}
            <Card className="p-4">
              <CardHeader className="pb-0 pt-0">
                <CardTitle className="text-lg">Expenses by Category</CardTitle>
              </CardHeader>
              <CardContent className="h-64">
                {categoryChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryChartData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        innerRadius={40}
                        paddingAngle={2}
                        dataKey="value"
                        labelLine={false}
                        label={({ name, percent }) => {
                          const shortName = name.length > 15 ? `${name.substring(0, 12)}...` : name;
                          return `${shortName} ${(percent * 100).toFixed(0)}%`;
                        }}
                      >
                        {categoryChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: number) => formatCurrency(value, 'USD')}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground">
                    No data available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Summary;
