
import { Transaction } from '@/types';
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
}

const SummaryCharts = ({
  paymentMethodChartData,
  categoryChartData,
}: SummaryChartsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Payment Methods Chart */}
      <PieChartCard
        title="Expenses by Payment Method"
        data={paymentMethodChartData}
      />
            
      {/* Categories Chart */}
      <PieChartCard
        title="Expenses by Category"
        data={categoryChartData}
      />
    </div>
  );
};

export default SummaryCharts;
