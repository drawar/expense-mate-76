import { Currency } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  TooltipProps,
} from "recharts";
import { CreditCardIcon, TagIcon } from "lucide-react";
import { CurrencyService } from "@/services/CurrencyService";

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

// Define the value and name types that will be used in TooltipProps
type ValueType = number;
type NameType = string;

// Define a formatter function type
type FormatterFunc = (value: ValueType) => string;

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: ValueType;
    payload: {
      totalValue: number;
    };
  }>;
  formatter?: FormatterFunc;
}

const SummaryCharts = ({
  paymentMethodChartData,
  categoryChartData,
  displayCurrency,
}: SummaryChartsProps) => {
  // Custom tooltip component
  const CustomTooltip = ({
    active,
    payload,
    formatter,
  }: CustomTooltipProps) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border p-3 rounded-md shadow-lg">
          <p className="font-medium text-sm mb-1">{payload[0].name}</p>
          <p className="text-primary font-bold">
            {formatter ? formatter(payload[0].value) : payload[0].value}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {Math.round(
              (payload[0].value / payload[0].payload.totalValue) * 100
            )}
            % of total
          </p>
        </div>
      );
    }
    return null;
  };

  // Add total value to each data point for percentage calculation
  const prepareChartData = (data: ChartData[]) => {
    const totalValue = data.reduce((sum, item) => sum + item.value, 0);
    return data.map((item) => ({
      ...item,
      totalValue,
    }));
  };

  const preparedMethodData = prepareChartData(paymentMethodChartData);
  const preparedCategoryData = prepareChartData(categoryChartData);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 min-h-[300px]">
      {/* Payment Methods Chart */}
      <Card className="rounded-xl border border-border/50 bg-card hover:shadow-md transition-all overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl flex items-center gap-2">
            <CreditCardIcon className="h-5 w-5 text-primary" />
            Payment Methods
          </CardTitle>
        </CardHeader>
        <CardContent>
          {preparedMethodData.length > 0 ? (
            <div className="w-full h-60 mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={preparedMethodData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {preparedMethodData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.color}
                        stroke="var(--background)"
                        strokeWidth={2}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    content={
                      <CustomTooltip
                        formatter={(value: number) =>
                          CurrencyService.format(value, displayCurrency)
                        }
                      />
                    }
                  />
                  <Legend
                    layout="vertical"
                    verticalAlign="middle"
                    align="right"
                    formatter={(value, entry, index) => (
                      <span className="text-xs">{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex items-center justify-center h-60 text-muted-foreground">
              <p>No payment method data available</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Categories Chart */}
      <Card className="rounded-xl border border-border/50 bg-card hover:shadow-md transition-all overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl flex items-center gap-2">
            <TagIcon className="h-5 w-5 text-primary" />
            Expense Categories
          </CardTitle>
        </CardHeader>
        <CardContent>
          {preparedCategoryData.length > 0 ? (
            <div className="w-full h-60 mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={preparedCategoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {preparedCategoryData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.color}
                        stroke="var(--background)"
                        strokeWidth={2}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    content={
                      <CustomTooltip
                        formatter={(value: number) =>
                          CurrencyService.format(value, displayCurrency)
                        }
                      />
                    }
                  />
                  <Legend
                    layout="vertical"
                    verticalAlign="middle"
                    align="right"
                    formatter={(value, entry, index) => (
                      <span className="text-xs">{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex items-center justify-center h-60 text-muted-foreground">
              <p>No category data available</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SummaryCharts;
