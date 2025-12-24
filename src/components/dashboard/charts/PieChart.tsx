// src/components/dashboard/charts/PieChart.tsx
import React, { useMemo, useState, useEffect, useRef } from "react";
import {
  PieChart as RechartsPie,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Currency } from "@/types";
import { CurrencyService } from "@/core/currency";

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
  currency = "SGD",
  className = "",
  innerRadius = 60,
  outerRadius = 80,
  paddingAngle = 2,
}) => {
  // Create a ref for the chart container
  const chartContainerRef = useRef<HTMLDivElement>(null);

  // State to hold the calculated radius values
  const [radius, setRadius] = useState({
    innerRadius: innerRadius,
    outerRadius: outerRadius,
  });

  // Process data to include percentages - optimized to avoid deep copying when not needed
  const processedData = useMemo(() => {
    if (!data || data.length === 0) return [];

    const total = data.reduce((sum, item) => sum + item.value, 0);

    if (total === 0) return [];

    return data.map((item) => ({
      ...item,
      percentage: (item.value / total) * 100,
    }));
  }, [data]);

  // Memoize radius calculation based on original props
  const baseRadius = useMemo(
    () => ({
      innerScale: innerRadius / 200,
      outerScale: outerRadius / 200,
    }),
    [innerRadius, outerRadius]
  );

  // Use ResizeObserver with fewer dependencies and throttled updates
  useEffect(() => {
    const container = chartContainerRef.current;
    if (!container || !processedData.length) return;

    // Throttle resize calculations to reduce performance impact
    let rafId: number;
    let lastUpdateTime = 0;
    const THROTTLE_DELAY = 100; // ms

    // Create a throttled handler for resize events
    const handleResize = (entries: ResizeObserverEntry[]) => {
      const now = Date.now();
      if (now - lastUpdateTime < THROTTLE_DELAY) {
        // Cancel any pending updates and schedule a new one
        cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(() => processResize(entries));
        return;
      }

      lastUpdateTime = now;
      processResize(entries);
    };

    const processResize = (entries: ResizeObserverEntry[]) => {
      const entry = entries[0];
      if (!entry) return;

      // Get container dimensions
      const { width, height } = entry.contentRect;
      const minDimension = Math.min(width, height);

      // Update radius values using memoized scales
      setRadius({
        innerRadius: Math.max(minDimension * baseRadius.innerScale, 20),
        outerRadius: Math.min(
          minDimension * baseRadius.outerScale,
          Math.min(width, height) / 2 - 10
        ),
      });
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    return () => {
      cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
    };
  }, [baseRadius, processedData.length]); // Only re-setup when base scales change or data presence changes

  // Memoize tooltip component to prevent recreation on each render
  const CustomTooltip = useMemo(() => {
    // Define proper types for the tooltip props
    interface TooltipProps {
      active?: boolean;
      payload?: Array<{
        name: string;
        value: number;
        payload: {
          percentage: number;
          [key: string]: unknown;
        };
        [key: string]: unknown;
      }>;
    }

    return ({ active, payload }: TooltipProps) => {
      if (!active || !payload || !payload.length) return null;

      const item = payload[0];
      const entry = item.payload;

      return (
        <div className="bg-background border border-border p-3 rounded-md shadow-lg">
          <p className="font-medium text-sm mb-1">{item.name}</p>
          <p className="text-primary font-medium">
            {CurrencyService.format(item.value, currency)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {Math.round(entry.percentage)}% of total
          </p>
        </div>
      );
    };
  }, [currency]);

  // Memoize legend items to prevent expensive re-calculation
  const legendItems = useMemo(() => {
    if (!processedData || processedData.length === 0) return null;

    return (
      <div className="grid grid-cols-1 gap-2 w-full max-h-[240px] overflow-y-auto pr-2">
        {processedData.map((entry, index) => (
          <div
            key={`legend-${index}`}
            className="flex items-center justify-between text-xs"
          >
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
  }, [processedData]);

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
            {legendItems}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Export both as named export and default export for flexibility
export { PieChart };
export default React.memo(PieChart);
