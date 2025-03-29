// src/components/dashboard/charts/PieChart.tsx
import React, { useMemo } from 'react';
import { PieChart as RechartsPie, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Currency } from '@/types';
import { formatCurrency } from '@/utils/formatting';

/**
 * Common data structure for pie chart data
 */
export interface ChartDataItem {
  name: string;
  value: number;
  color: string;
}

export interface PieChartProps {
  title: string;
  icon?: React.ReactNode;
  data: ChartDataItem[];
  currency?: Currency;
  className?: string;
  innerRadius?: number;
  outerRadius?: number;
  paddingAngle?: number;
}

/**
 * Functional replacement for AbstractPieChart
 * Provides a reusable component for pie/donut charts with consistent styling
 */
const PieChart: React.FC<PieChartProps> = ({
  title,
  icon,
  data,
  currency = 'SGD',
  className = '',
  innerRadius = 60,
  outerRadius = 80,
  paddingAngle = 2
}) => {
  // Process data to include percentages
  const processedData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    const total = data.reduce((sum, item) => sum + item.value, 0);
    return data.map(item => ({
      ...item,
      percentage: total > 0 ? (item.value / total * 100) : 0
    }));
  }, [data]);

  // Custom tooltip component
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const totalValue = data.reduce((sum, item) => sum + item.value, 0);
      const percentage = Math.round((payload[0].value / totalValue) * 100);
      
      return (
        <div className="bg-background border border-border p-3 rounded-md shadow-lg">
          <p className="font-medium text-sm mb-1">{payload[0].name}</p>
          <p className="text-primary font-bold">
            {formatCurrency(payload[0].value, currency)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {percentage}% of total
          </p>
        </div>
      );
    }
    return null;
  };
  
  // Render legend items
  const renderLegendItems = () => {
    if (!processedData || processedData.length === 0) return null;
    
    return (
      <div className="grid grid-cols-1 gap-2 w-full max-h-[240px] overflow-y-auto pr-2">
        {processedData.map((entry, index) => (
          <div key={`legend-${index}`} className="flex items-center justify-between text-xs">
            <div className="flex items-center">
              <div 
                className="w-3 h-3 rounded-sm mr-2 flex-shrink-0" 
                style={{ backgroundColor: entry.color }}
              />
              <span className="truncate max-w-[150px]" title={entry.name}>
                {entry.name}
              </span>
            </div>
            <span className="ml-1 font-medium whitespace-nowrap">
              {entry.percentage.toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    );
  };

  // Empty state
  if (processedData.length === 0) {
    return (
      <Card className={`${className}`}>
        <CardHeader className="pb-2">
          <CardTitle className="text-xl flex items-center gap-2">
            {icon}
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            <p>No data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`${className}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-xl flex items-center gap-2">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row h-64">
          <div className="w-full md:w-1/2">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPie>
                <Pie
                  data={processedData}
                  cx="50%"
                  cy="50%"
                  innerRadius={innerRadius}
                  outerRadius={outerRadius}
                  paddingAngle={paddingAngle}
                  dataKey="value"
                >
                  {processedData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.color} 
                      stroke="var(--background)"
                      strokeWidth={2}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </RechartsPie>
            </ResponsiveContainer>
          </div>
          
          <div className="w-full md:w-1/2 mt-4 md:mt-0 md:pl-4">
            {renderLegendItems()}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Export both as named export and default export for flexibility
export { PieChart };
export default React.memo(PieChart);
