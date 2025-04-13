// components/dashboard/charts/BaseChart.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Currency } from '@/types';

export interface BaseChartProps {
  /**
   * Chart title displayed in the header
   */
  title: string;
  
  /**
   * Optional icon to display next to the title
   */
  icon?: React.ReactNode;
  
  /**
   * Currency for display formatting
   */
  currency?: Currency;
  
  /**
   * Optional additional CSS classes
   */
  className?: string;
  
  /**
   * Chart content
   */
  children?: React.ReactNode;
  
  /**
   * Optional loading state
   */
  loading?: boolean;
  
  /**
   * Optional error message
   */
  error?: string | null;
  
  /**
   * Optional empty state configuration
   */
  emptyState?: {
    message: string;
    icon?: React.ReactNode;
  };
}

/**
 * Base component for all chart visualizations with consistent styling and states
 */
const BaseChart: React.FC<BaseChartProps> = ({
  title,
  icon,
  className = '',
  children,
  loading = false,
  error = null,
  emptyState,
}) => {
  // Loading state
  if (loading) {
    return (
      <Card className={`${className} animate-pulse`}>
        <CardHeader className="pb-2">
          <CardTitle className="text-xl flex items-center gap-2">
            {icon}
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-48 text-muted-foreground">
            <p>Loading chart data...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className={className}>
        <CardHeader className="pb-2">
          <CardTitle className="text-xl flex items-center gap-2">
            {icon}
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-48 text-muted-foreground">
            <p>Error: {error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Empty state (no data)
  if (!children && emptyState) {
    return (
      <Card className={className}>
        <CardHeader className="pb-2">
          <CardTitle className="text-xl flex items-center gap-2">
            {icon}
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-48 text-center">
            {emptyState.icon}
            <p className="text-muted-foreground">{emptyState.message}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Normal state
  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-xl flex items-center gap-2">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
};

export default React.memo(BaseChart);
