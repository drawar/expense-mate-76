
import { Currency } from '@/types';
import PieChartCard from './PieChartCard';

interface SummaryChartsProps {
  paymentMethodChartData: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  categoryChartData: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  displayCurrency: Currency;
}

const SummaryCharts = ({
  paymentMethodChartData,
  categoryChartData,
  displayCurrency,
}: SummaryChartsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 min-h-[320px]">
      {/* Payment Methods Chart */}
      <div className="w-full h-full">
        <PieChartCard
          title={`Expenses by Payment Method (${displayCurrency})`}
          data={paymentMethodChartData}
        />
      </div>
            
      {/* Categories Chart */}
      <div className="w-full h-full">
        <PieChartCard
          title={`Expenses by Category (${displayCurrency})`}
          data={categoryChartData}
        />
      </div>
    </div>
  );
};

export default SummaryCharts;
