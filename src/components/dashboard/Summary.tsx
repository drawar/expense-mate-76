
import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatCurrency } from '@/utils/currencyFormatter';
import { Transaction, PaymentMethod } from '@/types';
import { getTotalRewardPoints } from '@/utils/rewardPoints';
import SummaryCardGrid from './SummaryCardGrid';
import SummaryCharts from './SummaryCharts';

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
      // Get the merchant category from MCC, fallback to 'Uncategorized' if not available
      const category = tx.merchant.mcc?.description || 'Uncategorized';
      if (!acc[category]) {
        acc[category] = 0;
      }
      acc[category] += tx.currency === 'USD' ? tx.amount : tx.paymentAmount;
      return acc;
    }, {}
  );
  
  // Prepare data for payment method chart
  const paymentMethodChartData = Object.entries(expensesByPaymentMethod)
    .map(([name, amount], index) => ({
      name,
      value: amount,
      color: COLORS[index % COLORS.length]
    }))
    .sort((a, b) => b.value - a.value); // Sort by value in descending order
  
  // Prepare data for category chart
  const categoryChartData = Object.entries(expensesByCategory)
    .map(([name, amount], index) => ({
      name,
      value: amount,
      color: COLORS[index % COLORS.length]
    }))
    .sort((a, b) => b.value - a.value); // Sort by value in descending order
  
  // Get the top payment method for display in the summary card
  const topPaymentMethod = paymentMethodChartData.length > 0 
    ? { name: paymentMethodChartData[0].name, value: paymentMethodChartData[0].value } 
    : undefined;
  
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
        
        <TabsContent value="thisMonth" className="mt-4 space-y-6">
          {/* Summary Cards */}
          <SummaryCardGrid
            filteredTransactions={filteredTransactions}
            totalExpenses={totalExpenses}
            transactionCount={transactionCount}
            averageAmount={averageAmount}
            topPaymentMethod={topPaymentMethod}
            totalRewardPoints={totalRewardPoints}
          />
          
          {/* Charts Section */}
          <SummaryCharts
            paymentMethodChartData={paymentMethodChartData}
            categoryChartData={categoryChartData}
          />
        </TabsContent>
        
        <TabsContent value="lastMonth" className="mt-4 space-y-6">
          {/* Summary Cards */}
          <SummaryCardGrid
            filteredTransactions={filteredTransactions}
            totalExpenses={totalExpenses}
            transactionCount={transactionCount}
            averageAmount={averageAmount}
            topPaymentMethod={topPaymentMethod}
            totalRewardPoints={totalRewardPoints}
          />
          
          {/* Charts Section */}
          <SummaryCharts
            paymentMethodChartData={paymentMethodChartData}
            categoryChartData={categoryChartData}
          />
        </TabsContent>
        
        <TabsContent value="lastThreeMonths" className="mt-4 space-y-6">
          {/* Summary Cards */}
          <SummaryCardGrid
            filteredTransactions={filteredTransactions}
            totalExpenses={totalExpenses}
            transactionCount={transactionCount}
            averageAmount={averageAmount}
            topPaymentMethod={topPaymentMethod}
            totalRewardPoints={totalRewardPoints}
          />
          
          {/* Charts Section */}
          <SummaryCharts
            paymentMethodChartData={paymentMethodChartData}
            categoryChartData={categoryChartData}
          />
        </TabsContent>
        
        <TabsContent value="thisYear" className="mt-4 space-y-6">
          {/* Summary Cards */}
          <SummaryCardGrid
            filteredTransactions={filteredTransactions}
            totalExpenses={totalExpenses}
            transactionCount={transactionCount}
            averageAmount={averageAmount}
            topPaymentMethod={topPaymentMethod}
            totalRewardPoints={totalRewardPoints}
          />
          
          {/* Charts Section */}
          <SummaryCharts
            paymentMethodChartData={paymentMethodChartData}
            categoryChartData={categoryChartData}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Summary;
