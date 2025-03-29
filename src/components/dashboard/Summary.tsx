import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Transaction, PaymentMethod, Currency } from '@/types';
import { Filter } from 'lucide-react';
import SummaryCardGrid from './SummaryCardGrid';
import SummaryCharts from './SummaryCharts';
import DisplayCurrencySelect from './DisplayCurrencySelect';
import StatementCycleFilter from './StatementCycleFilter';
import { useSummaryCalculator } from '@/hooks/dashboard/useSummaryCalculator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import "./dashboard.css";

interface SummaryProps {
  transactions: Transaction[];
  paymentMethods: PaymentMethod[];
  previousPeriodTransactions?: Transaction[];
}

const Summary = ({ 
  transactions, 
  paymentMethods,
  previousPeriodTransactions = [] 
}: SummaryProps) => {
  const [activeTab, setActiveTab] = useState('thisMonth');
  const [displayCurrency, setDisplayCurrency] = useState<Currency>('SGD');
  const [useStatementMonth, setUseStatementMonth] = useState(false);
  const [statementCycleDay, setStatementCycleDay] = useState(15); // Default to 15th
  
  // Use our new hook for calculations
  const { summaryData, filteredTransactions } = useSummaryCalculator(
    transactions,
    displayCurrency,
    activeTab,
    useStatementMonth,
    statementCycleDay,
    previousPeriodTransactions
  );
  
  return (
    <div className="space-y-4 w-full">
      <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <h2 className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-[#6366f1] to-[#a855f7]">Expense Summary</h2>
          <div className="flex flex-col sm:flex-row sm:flex-wrap gap-4 items-start sm:items-center">
            {/* Currency Selector */}
            <DisplayCurrencySelect 
              value={displayCurrency} 
              onChange={setDisplayCurrency}
              className="component-hover-box currency-selector"
            />
            
            {/* Time Frame Selector */}
            <div className="component-hover-box timeframe-selector">
              <Filter className="h-5 w-5 text-muted-foreground mr-2" />
              <Select
                value={activeTab}
                onValueChange={setActiveTab}
              >
                <SelectTrigger className="w-[120px] h-7 text-sm bg-transparent border-none">
                  <SelectValue placeholder="This Month" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="thisMonth">This Month</SelectItem>
                  <SelectItem value="lastMonth">Last Month</SelectItem>
                  <SelectItem value="lastThreeMonths">Last 3 Months</SelectItem>
                  <SelectItem value="thisYear">This Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Statement Month toggle */}
            <StatementCycleFilter
              useStatementMonth={useStatementMonth}
              setUseStatementMonth={setUseStatementMonth}
              statementCycleDay={statementCycleDay}
              setStatementCycleDay={setStatementCycleDay}
              className="component-hover-box statement-toggle"
            />
          </div>
        </div>
        
        {/* Single TabsContent implementation shared by all tabs */}
        <TabsContent 
          value={activeTab} 
          className="mt-4 space-y-4"
        >
          <SummaryCardGrid
            filteredTransactions={filteredTransactions}
            summaryData={summaryData}
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
