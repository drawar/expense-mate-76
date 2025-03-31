// src/components/dashboard/SummaryCard.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUpIcon, TrendingDownIcon } from 'lucide-react';

interface SummaryCardProps {
  /**
   * Card title displayed in the header
   */
  title: string;
  
  /**
   * Icon component to display next to the title
   */
  icon: React.ReactNode;
  
  /**
   * Primary value to display in the card
   */
  value: string;
  
  /**
   * Optional description text or component
   */
  description?: string | React.ReactNode;
  
  /**
   * Optional percentage trend value
   * Positive values show up/red, negative values show down/green
   */
  trend?: number;
  
  /**
   * Optional background color class for the card
   */
  cardColor?: string;
  
  /**
   * Optional text color class for the value
   */
  valueColor?: string;
  
  /**
   * Optional className for additional styling
   */
  className?: string;
}

/**
 * Reusable summary card component for displaying metric information
 * Supports trend indicators and custom styling
 */
const SummaryCard: React.FC<SummaryCardProps> = ({ 
  title, 
  icon, 
  value, 
  description, 
  trend, 
  cardColor = "bg-card",
  valueColor = "text-foreground",
  className = ""
}) => {
  // Format trend data with appropriate styling
  const renderTrend = () => {
    if (trend === undefined) return null;
    
    const isTrendPositive = trend >= 0;
    // For expenses, negative is good (spending less)
    const trendColor = isTrendPositive 
      ? "text-red-500 dark:text-red-400" 
      : "text-green-500 dark:text-green-400";
    const formattedTrend = `${isTrendPositive ? '+' : ''}${trend.toFixed(1)}%`;
    const TrendIcon = isTrendPositive ? TrendingUpIcon : TrendingDownIcon;
    
    return (
      <span className={`flex items-center gap-1 ${trendColor}`}>
        <TrendIcon className="h-3.5 w-3.5" />
        <span>{formattedTrend}</span>
      </span>
    );
  };

  return (
    <Card className={`summary-card overflow-hidden animate-fadeIn ${cardColor} ${className}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center">
          {icon && <span className="mr-1.5">{icon}</span>}
          {title}
        </CardTitle>
        
        <div className="mt-2">
          <div 
            className={`text-2xl font-bold truncate ${valueColor}`}
            title={value} // Add title for tooltip on hover
          >
            {value}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="text-xs text-muted-foreground flex items-center gap-1">
          {trend !== undefined ? renderTrend() : description}
        </div>
      </CardContent>
    </Card>
  );
};

export default React.memo(SummaryCard);
