
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Transaction, PaymentMethod, Currency } from '@/types';
import SummaryCardGrid from './SummaryCardGrid';
import SummaryCharts from './SummaryCharts';
import DisplayCurrencySelect from './DisplayCurrencySelect';
import StatementCycleFilter from './StatementCycleFilter';
import { useSummaryData } from '@/hooks/dashboard/useSummaryData';

interface SummaryProps {
  transactions: Transaction[];
  paymentMethods: PaymentMethod[];
}

const Summary = ({ transactions, paymentMethods }: SummaryProps) => {
  const [activeTab, setActiveTab] = useState('thisMonth');
  const [displayCurrency, setDisplayCurrency] = useState<Currency>('USD');
  const [useStatementMonth, setUseStatementMonth] = useState(false);
  const [statementCycleDay, setStatementCycleDay] = useState(15); // Default to 15th
  
  // Use our custom hook to get filtered transactions and summary data
  const { filteredTransactions, summaryData } = useSummaryData(
    transactions, 
    displayCurrency, 
    activeTab, 
    useStatementMonth, 
    statementCycleDay
  );
  
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
        
        <div className="mt-4 mb-6">
          <StatementCycleFilter
            useStatementMonth={useStatementMonth}
            setUseStatementMonth={setUseStatementMonth}
            statementCycleDay={statementCycleDay}
            setStatementCycleDay={setStatementCycleDay}
          />
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
