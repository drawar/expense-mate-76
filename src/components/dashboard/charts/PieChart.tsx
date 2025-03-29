// src/components/dashboard/charts/PieChart.tsx
import React, { useMemo, useState, useEffect, useRef } from 'react';
import { PieChart as RechartsPie, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
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
 * Enhanced PieChart component with real-time responsive sizing
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
  // Create a ref for the chart container
  const chartContainerRef = useRef<HTMLDivElement>(null);
  
  // State to hold the calculated radius values
  const [radius, setRadius] = useState({
    innerRadius: innerRadius,
    outerRadius: outerRadius
  });

  // Process data to include percentages
  const processedData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    const total = data.reduce((sum, item) => sum + item.value, 0);
    return data.map(item => ({
      ...item,
      percentage: total > 0 ? (item.value / total * 100) : 0
    }));
  }, [data]);
  
  // Use ResizeObserver to monitor the container size and update radius values
  useEffect(() => {
    const container = chartContainerRef.current;
    if (!container) return;
    
    // Create a resize observer to watch the container
    const resizeObserver = new ResizeObserver(entries => {
      const entry = entries[0];
      if (!entry) return;
      
      // Get container dimensions
      const { width, height } = entry.contentRect;
      const minDimension = Math.min(width, height);
      
      // Calculate radius values proportional to the container size
      // Scale factor is based on the original radius values
      const innerScale = innerRadius / 200; // Baseline size of 200px
      const outerScale = outerRadius / 200; // Baseline size of 200px
      
      // Update radius values
      setRadius({
        innerRadius: Math.max(minDimension * innerScale, 20), // Minimum inner radius of 20px
        outerRadius: Math.min(minDimension * outerScale, Math.min(width, height) / 2 - 10) // Max is half container minus margin
      });
    });
    
    // Start observing the container
    resizeObserver.observe(container);
    
    // Clean up observer when component unmounts
    return () => {
      resizeObserver.disconnect();
    };
  }, [innerRadius, outerRadius]);

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
        <div className="flex flex-col md:flex-row h-auto">
          {/* Chart container that shrinks proportionally - using ref for size detection */}
          <div 
            ref={chartContainerRef}
            className="w-full md:w-1/2 h-[200px] sm:h-[220px] md:h-[240px] lg:h-[260px] flex items-center justify-center"
          >
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPie>
                <Pie
                  data={processedData}
                  cx="50%"
                  cy="50%"
                  innerRadius={radius.innerRadius}
                  outerRadius={radius.outerRadius}
                  paddingAngle={paddingAngle}
                  dataKey="value"
                  isAnimationActive={false}
                  labelLine={false}
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
          
          {/* Legend container that adapts to available space */}
          <div className="w-full md:w-1/2 mt-4 md:mt-0 md:pl-4 max-h-[200px] md:max-h-[240px] overflow-y-auto">
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
