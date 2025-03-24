
import { useState, useEffect, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatCurrency } from '@/utils/currencyFormatter';
import { Transaction, PaymentMethod } from '@/types';
import { calculateTotalRewardPoints } from '@/utils/rewards/rewardPoints';
import SummaryCardGrid from './SummaryCardGrid';
import SummaryCharts from './SummaryCharts';
import { getCategoryFromMCC, getCategoryFromMerchantName } from '@/utils/categoryMapping';

interface SummaryProps {
  transactions: Transaction[];
  paymentMethods: PaymentMethod[];
}

// Color palette for charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A259FF', '#4BC0C0', '#FF6B6B', '#6B8E23'];

const Summary = ({ transactions, paymentMethods }: SummaryProps) => {
  const [activeTab, setActiveTab] = useState('thisMonth');
  
  // Process transactions only once to avoid infinite loop
  const processedTransactions = useMemo(() => {
    return transactions.map(tx => {
      // Make sure category is set
      if (!tx.category || tx.category === 'Uncategorized') {
        let category = 'Uncategorized';
        
        if (tx.merchant.mcc?.code) {
          category = getCategoryFromMCC(tx.merchant.mcc.code);
        } else if (tx.merchant.name) {
          category = getCategoryFromMerchantName(tx.merchant.name) || 'Uncategorized';
        }
        
        return {...tx, category};
      }
      
      return tx;
    });
  }, [transactions]);
  
  // Filter transactions based on active tab
  const filteredTransactions = useMemo(() => {
    const now = new Date();
    
    return processedTransactions.filter(tx => {
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
  }, [activeTab, processedTransactions]);
  
  // Calculate summary data
  const summaryData = useMemo(() => {
    const totalExpenses = filteredTransactions.reduce(
      (sum, tx) => sum + (tx.currency === 'USD' ? tx.amount : tx.paymentAmount), 
      0
    );
    
    const totalRewardPoints = calculateTotalRewardPoints(filteredTransactions);
    
    const transactionCount = filteredTransactions.length;
    
    const averageAmount = transactionCount ? totalExpenses / transactionCount : 0;
    
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
    
    const expensesByCategory = filteredTransactions.reduce<Record<string, number>>(
      (acc, tx) => {
        // Get category name, preferring the stored category but falling back to MCC or merchant name
        let category = tx.category;
        if (!category || category === 'Uncategorized') {
          if (tx.merchant.mcc?.code) {
            category = getCategoryFromMCC(tx.merchant.mcc.code);
          } else {
            category = getCategoryFromMerchantName(tx.merchant.name) || 'Uncategorized';
          }
        }
        
        if (!acc[category]) {
          acc[category] = 0;
        }
        acc[category] += tx.currency === 'USD' ? tx.amount : tx.paymentAmount;
        return acc;
      }, {}
    );
    
    const paymentMethodChartData = Object.entries(expensesByPaymentMethod)
      .map(([name, amount], index) => ({
        name,
        value: amount,
        color: COLORS[index % COLORS.length]
      }))
      .sort((a, b) => b.value - a.value);
    
    const categoryChartData = Object.entries(expensesByCategory)
      .map(([name, amount], index) => ({
        name,
        value: amount,
        color: COLORS[index % COLORS.length]
      }))
      .sort((a, b) => b.value - a.value);
    
    const topPaymentMethod = paymentMethodChartData.length > 0 
      ? { name: paymentMethodChartData[0].name, value: paymentMethodChartData[0].value } 
      : undefined;
      
    return {
      totalExpenses,
      totalRewardPoints,
      transactionCount,
      averageAmount,
      paymentMethodChartData,
      categoryChartData,
      topPaymentMethod
    };
  }, [filteredTransactions]);
  
  return (
    <div className="space-y-6 w-full">
      <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight">Expense Summary</h2>
          <TabsList>
            <TabsTrigger value="thisMonth">This Month</TabsTrigger>
            <TabsTrigger value="lastMonth">Last Month</TabsTrigger>
            <TabsTrigger value="lastThreeMonths">Last 3 Months</TabsTrigger>
            <TabsTrigger value="thisYear">This Year</TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="thisMonth" className="mt-4 space-y-6">
          <SummaryCardGrid
            filteredTransactions={filteredTransactions}
            totalExpenses={summaryData.totalExpenses}
            transactionCount={summaryData.transactionCount}
            averageAmount={summaryData.averageAmount}
            topPaymentMethod={summaryData.topPaymentMethod}
            totalRewardPoints={summaryData.totalRewardPoints}
          />
          
          <SummaryCharts
            paymentMethodChartData={summaryData.paymentMethodChartData}
            categoryChartData={summaryData.categoryChartData}
          />
        </TabsContent>
        
        <TabsContent value="lastMonth" className="mt-4 space-y-6">
          <SummaryCardGrid
            filteredTransactions={filteredTransactions}
            totalExpenses={summaryData.totalExpenses}
            transactionCount={summaryData.transactionCount}
            averageAmount={summaryData.averageAmount}
            topPaymentMethod={summaryData.topPaymentMethod}
            totalRewardPoints={summaryData.totalRewardPoints}
          />
          
          <SummaryCharts
            paymentMethodChartData={summaryData.paymentMethodChartData}
            categoryChartData={summaryData.categoryChartData}
          />
        </TabsContent>
        
        <TabsContent value="lastThreeMonths" className="mt-4 space-y-6">
          <SummaryCardGrid
            filteredTransactions={filteredTransactions}
            totalExpenses={summaryData.totalExpenses}
            transactionCount={summaryData.transactionCount}
            averageAmount={summaryData.averageAmount}
            topPaymentMethod={summaryData.topPaymentMethod}
            totalRewardPoints={summaryData.totalRewardPoints}
          />
          
          <SummaryCharts
            paymentMethodChartData={summaryData.paymentMethodChartData}
            categoryChartData={summaryData.categoryChartData}
          />
        </TabsContent>
        
        <TabsContent value="thisYear" className="mt-4 space-y-6">
          <SummaryCardGrid
            filteredTransactions={filteredTransactions}
            totalExpenses={summaryData.totalExpenses}
            transactionCount={summaryData.transactionCount}
            averageAmount={summaryData.averageAmount}
            topPaymentMethod={summaryData.topPaymentMethod}
            totalRewardPoints={summaryData.totalRewardPoints}
          />
          
          <SummaryCharts
            paymentMethodChartData={summaryData.paymentMethodChartData}
            categoryChartData={summaryData.categoryChartData}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Summary;
