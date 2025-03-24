
import { useMemo, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatCurrency } from '@/utils/currencyFormatter';
import { Transaction, PaymentMethod, Currency } from '@/types';
import { calculateTotalRewardPoints } from '@/utils/rewards/rewardPoints';
import SummaryCardGrid from './SummaryCardGrid';
import SummaryCharts from './SummaryCharts';
import DisplayCurrencySelect from './DisplayCurrencySelect';
import { getCategoryFromMCC, getCategoryFromMerchantName } from '@/utils/categoryMapping';

interface SummaryProps {
  transactions: Transaction[];
  paymentMethods: PaymentMethod[];
}

// Color palette for charts - defining outside component prevents recreation
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A259FF', '#4BC0C0', '#FF6B6B', '#6B8E23'];

// Default exchange rates - in a real app, these would come from an API
const DEFAULT_EXCHANGE_RATES: Record<Currency, Record<Currency, number>> = {
  USD: { USD: 1, EUR: 0.93, GBP: 0.79, JPY: 151.77, AUD: 1.53, CAD: 1.37, CNY: 7.26, INR: 83.42, NTD: 32.27, SGD: 1.35, VND: 25305, IDR: 16158, THB: 36.17, MYR: 4.72 },
  EUR: { USD: 1.08, EUR: 1, GBP: 0.85, JPY: 163.59, AUD: 1.65, CAD: 1.47, CNY: 7.83, INR: 89.93, NTD: 34.78, SGD: 1.45, VND: 27276, IDR: 17416, THB: 38.99, MYR: 5.09 },
  GBP: { USD: 1.27, EUR: 1.18, GBP: 1, JPY: 192.96, AUD: 1.94, CAD: 1.74, CNY: 9.24, INR: 106.06, NTD: 41.04, SGD: 1.71, VND: 32179, IDR: 20548, THB: 46.00, MYR: 6.00 },
  JPY: { USD: 0.0066, EUR: 0.0061, GBP: 0.0052, JPY: 1, AUD: 0.01, CAD: 0.009, CNY: 0.048, INR: 0.55, NTD: 0.21, SGD: 0.0089, VND: 166.73, IDR: 106.43, THB: 0.24, MYR: 0.031 },
  AUD: { USD: 0.65, EUR: 0.61, GBP: 0.52, JPY: 99.06, AUD: 1, CAD: 0.89, CNY: 4.74, INR: 54.47, NTD: 21.08, SGD: 0.88, VND: 16524, IDR: 10551, THB: 23.61, MYR: 3.08 },
  CAD: { USD: 0.73, EUR: 0.68, GBP: 0.58, JPY: 111.31, AUD: 1.12, CAD: 1, CNY: 5.32, INR: 61.20, NTD: 23.68, SGD: 0.99, VND: 18564, IDR: 11854, THB: 26.53, MYR: 3.46 },
  CNY: { USD: 0.14, EUR: 0.13, GBP: 0.11, JPY: 20.90, AUD: 0.21, CAD: 0.19, CNY: 1, INR: 11.49, NTD: 4.45, SGD: 0.19, VND: 3486, IDR: 2225, THB: 4.98, MYR: 0.65 },
  INR: { USD: 0.012, EUR: 0.011, GBP: 0.0094, JPY: 1.82, AUD: 0.018, CAD: 0.016, CNY: 0.087, INR: 1, NTD: 0.39, SGD: 0.016, VND: 303.33, IDR: 193.69, THB: 0.43, MYR: 0.057 },
  NTD: { USD: 0.031, EUR: 0.029, GBP: 0.024, JPY: 4.71, AUD: 0.047, CAD: 0.042, CNY: 0.22, INR: 2.59, NTD: 1, SGD: 0.042, VND: 784.16, IDR: 500.71, THB: 1.12, MYR: 0.15 },
  SGD: { USD: 0.74, EUR: 0.69, GBP: 0.58, JPY: 112.80, AUD: 1.14, CAD: 1.01, CNY: 5.39, INR: 61.97, NTD: 23.98, SGD: 1, VND: 18796, IDR: 12005, THB: 26.88, MYR: 3.51 },
  VND: { USD: 0.000040, EUR: 0.000037, GBP: 0.000031, JPY: 0.0060, AUD: 0.000061, CAD: 0.000054, CNY: 0.00029, INR: 0.0033, NTD: 0.0013, SGD: 0.000053, VND: 1, IDR: 0.64, THB: 0.0014, MYR: 0.00019 },
  IDR: { USD: 0.000062, EUR: 0.000057, GBP: 0.000049, JPY: 0.0094, AUD: 0.000095, CAD: 0.000084, CNY: 0.00045, INR: 0.0052, NTD: 0.0020, SGD: 0.000083, VND: 1.57, IDR: 1, THB: 0.0022, MYR: 0.00029 },
  THB: { USD: 0.028, EUR: 0.026, GBP: 0.022, JPY: 4.20, AUD: 0.042, CAD: 0.038, CNY: 0.20, INR: 2.31, NTD: 0.89, SGD: 0.037, VND: 699.81, IDR: 446.86, THB: 1, MYR: 0.13 },
  MYR: { USD: 0.21, EUR: 0.20, GBP: 0.17, JPY: 32.15, AUD: 0.32, CAD: 0.29, CNY: 1.54, INR: 17.67, NTD: 6.84, SGD: 0.29, VND: 5360, IDR: 3423, THB: 7.66, MYR: 1 },
};

// Helper function to convert amount from one currency to another
const convertCurrency = (amount: number, fromCurrency: Currency, toCurrency: Currency, paymentMethod?: PaymentMethod): number => {
  if (fromCurrency === toCurrency) return amount;
  
  // Try to use custom conversion rates from payment method if available
  if (paymentMethod?.conversionRate && 
      paymentMethod.conversionRate[toCurrency] !== undefined) {
    return amount * paymentMethod.conversionRate[toCurrency];
  }
  
  // Otherwise use default rates
  return amount * DEFAULT_EXCHANGE_RATES[fromCurrency][toCurrency];
};

const Summary = ({ transactions, paymentMethods }: SummaryProps) => {
  const [activeTab, setActiveTab] = useState('thisMonth');
  const [displayCurrency, setDisplayCurrency] = useState<Currency>('USD');
  
  // Process transactions to ensure categories are set - only recompute when transactions change
  const processedTransactions = useMemo(() => {
    return transactions.map(tx => {
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
  
  // Calculate all summary data in a single pass, with currency conversion
  const summaryData = useMemo(() => {
    // Initialize counters and data structures
    const expensesByPaymentMethod = {};
    const expensesByCategory = {};
    let totalExpenses = 0;
    let transactionCount = 0;
    
    // Single loop through filtered transactions to calculate all metrics
    for (const tx of filteredTransactions) {
      transactionCount++;
      
      // Get the original amount in transaction currency
      const originalAmount = tx.amount;
      
      // Convert to display currency
      const convertedAmount = convertCurrency(
        originalAmount, 
        tx.currency as Currency, 
        displayCurrency, 
        tx.paymentMethod
      );
      
      // Calculate total expenses in display currency
      totalExpenses += convertedAmount;
      
      // Expenses by payment method (in display currency)
      const methodName = tx.paymentMethod.name;
      expensesByPaymentMethod[methodName] = (expensesByPaymentMethod[methodName] || 0) + convertedAmount;
      
      // Expenses by category (in display currency)
      const category = tx.category || 'Uncategorized';
      expensesByCategory[category] = (expensesByCategory[category] || 0) + convertedAmount;
    }
    
    // Derived calculations
    const averageAmount = transactionCount ? totalExpenses / transactionCount : 0;
    const totalRewardPoints = calculateTotalRewardPoints(filteredTransactions);
    
    // Create chart data arrays (only once per data change)
    const paymentMethodChartData = Object.entries(expensesByPaymentMethod)
      .map(([name, value], index) => ({
        name,
        value: value as number,
        color: COLORS[index % COLORS.length]
      }))
      .sort((a, b) => b.value - a.value);
    
    const categoryChartData = Object.entries(expensesByCategory)
      .map(([name, value], index) => ({
        name,
        value: value as number,
        color: COLORS[index % COLORS.length]
      }))
      .sort((a, b) => b.value - a.value);
    
    // Top payment method
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
  }, [filteredTransactions, displayCurrency]);
  
  return (
    <div className="space-y-6 w-full">
      <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-2xl font-bold tracking-tight">Expense Summary</h2>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <DisplayCurrencySelect 
              value={displayCurrency} 
              onChange={setDisplayCurrency} 
            />
            <TabsList>
              <TabsTrigger value="thisMonth">This Month</TabsTrigger>
              <TabsTrigger value="lastMonth">Last Month</TabsTrigger>
              <TabsTrigger value="lastThreeMonths">Last 3 Months</TabsTrigger>
              <TabsTrigger value="thisYear">This Year</TabsTrigger>
            </TabsList>
          </div>
        </div>
        
        {/* Single TabsContent implementation shared by all tabs */}
        <TabsContent 
          value={activeTab} 
          className="mt-4 space-y-6"
        >
          <SummaryCardGrid
            filteredTransactions={filteredTransactions}
            totalExpenses={summaryData.totalExpenses}
            transactionCount={summaryData.transactionCount}
            averageAmount={summaryData.averageAmount}
            topPaymentMethod={summaryData.topPaymentMethod}
            totalRewardPoints={summaryData.totalRewardPoints}
            displayCurrency={displayCurrency}
          />
          
          <SummaryCharts
            paymentMethodChartData={summaryData.paymentMethodChartData}
            categoryChartData={summaryData.categoryChartData}
            displayCurrency={displayCurrency}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Summary;
