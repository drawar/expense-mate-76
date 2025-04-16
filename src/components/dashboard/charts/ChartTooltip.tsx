// src/components/dashboard/charts/ChartTooltip.tsx
import React from "react";
import { CurrencyService } from "@/core/currency";
import { Currency } from "@/types";

const DEFAULT_CURRENCY: Currency = "SGD";

// Define a type for category data
interface CategoryData {
  category: string;
  amount: number;
}

// Define the payload item's nested payload object
interface NestedPayload {
  topCategories?: CategoryData[];
  // Add other known properties you might use
  [key: string]: unknown;
}

// Define a type for the payload items
interface TooltipPayloadItem {
  value: number;
  name: string;
  dataKey?: string;
  payload: NestedPayload;
  stroke?: string;
  fill?: string;
  // For other properties that might exist in the payload item
  [key: string]: unknown;
}

// Common props for all chart tooltips
export interface ChartTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
  currency?: Currency;
}

// Base tooltip component with common styling and structure
export const ChartTooltip: React.FC<ChartTooltipProps> = ({
  active,
  payload,
  label,
  currency = DEFAULT_CURRENCY,
}) => {
  if (!active || !payload || !payload.length) {
    return null;
  }

  return (
    <div className="bg-background border border-border p-3 rounded-md shadow-md">
      <p className="font-medium">{label}</p>
      <p className="text-primary">
        {CurrencyService.format(payload[0].value, currency)}
      </p>
    </div>
  );
};

// Props for tooltips with additional category insights
export interface InsightTooltipProps extends ChartTooltipProps {
  showInsights?: boolean;
}

// Extended tooltip for spending charts with category insights
export const SpendingInsightTooltip: React.FC<InsightTooltipProps> = ({
  active,
  payload,
  label,
  currency = DEFAULT_CURRENCY,
  showInsights = true,
}) => {
  if (!active || !payload || !payload.length) {
    return null;
  }

  const data = payload[0].payload;

  return (
    <div className="bg-background border border-border p-3 rounded-md shadow-md max-w-xs">
      <p className="font-medium">{label}</p>
      <p className="text-primary text-lg font-semibold">
        {CurrencyService.format(payload[0].value, currency)}
      </p>

      {showInsights && data.topCategories && data.topCategories.length > 0 && (
        <>
          <p className="mt-2 font-medium text-xs text-muted-foreground">
            Top Categories:
          </p>
          <div className="mt-1 space-y-1">
            {data.topCategories.map((cat: CategoryData, index: number) => (
              <div key={index} className="flex justify-between text-xs">
                <span>{cat.category}</span>
                <span>{CurrencyService.format(cat.amount, currency)}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

// Utility functions to create formatters for Recharts' built-in tooltip
export const createCurrencyFormatter = (currency: Currency = "USD") => {
  return (value: number, name: string, props?: unknown) => [
    CurrencyService.format(value, currency),
    name,
  ];
};

export const createLabelFormatter = () => {
  return (name: string) => name;
};

// HOC to add tooltip capability to any chart component
export function withTooltip<P extends object>(
  Component: React.ComponentType<P>,
  TooltipComponent: React.ComponentType<ChartTooltipProps> = ChartTooltip
) {
  return function TooltipWrapper(props: P & ChartTooltipProps) {
    const renderCustomTooltip = (tooltipProps: ChartTooltipProps) => {
      return <TooltipComponent {...tooltipProps} currency={props.currency} />;
    };

    return <Component {...props} customTooltip={renderCustomTooltip} />;
  };
}
