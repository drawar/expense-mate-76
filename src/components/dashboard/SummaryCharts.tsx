
import { Currency } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import SpendingDistributionCard from "./cards/SpendingDistributionCard";

interface ChartData {
  name: string;
  value: number;
  color: string;
}

interface SummaryChartsProps {
  paymentMethodChartData: Array<ChartData>;
  categoryChartData: Array<ChartData>;
  displayCurrency: Currency;
}

const SummaryCharts = ({
  paymentMethodChartData,
  categoryChartData,
  displayCurrency,
}: SummaryChartsProps) => {
  return (
    <div className="grid grid-cols-1 gap-4 min-h-[300px]">
      {/* Combined spending distribution card */}
      <SpendingDistributionCard
        categoryData={categoryChartData}
        paymentMethodData={paymentMethodChartData}
        currency={displayCurrency}
        className="rounded-xl border border-border/50 bg-card hover:shadow-md transition-all overflow-hidden"
        maxCategories={10}
        highlightTopMethod={true}
      />
    </div>
  );
};

export default SummaryCharts;
