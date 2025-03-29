// src/components/dashboard/SummaryCard.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUpIcon, TrendingDownIcon } from 'lucide-react';

interface SummaryCardProps {
  title: string;
  icon: React.ReactNode;
  value: string;
  description?: string | React.ReactNode;
  trend?: number;
  cardColor?: string;
  valueColor?: string;
}

const SummaryCard: React.FC<SummaryCardProps> = ({ 
  title, 
  icon, 
  value, 
  description, 
  trend, 
  cardColor = "bg-card",
  valueColor = "text-foreground"
}) => {
  // Format trend if available
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
    <Card className={`summary-card overflow-hidden animate-fadeIn ${cardColor}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center">
          {icon && <span className="mr-1.5">{icon}</span>}
          {title}
        </CardTitle>
        
        <div className="mt-2">
          <div className={`text-2xl font-bold truncate ${valueColor}`} title={value}>
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
