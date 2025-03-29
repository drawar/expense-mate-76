// src/components/dashboard/cards/CategoryCard.tsx
import React from 'react';
import { TagIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Currency } from '@/types';
import { formatCurrency } from '@/utils/formatting';
import { ChartDataItem } from './PaymentMethodCard';

interface CategoryCardProps {
  title: string;
  categoryData: ChartDataItem[];
  currency?: Currency;
  showTrends?: boolean;
  className?: string;
}

/**
 * Card component that displays expense category distribution
 */
const CategoryCard: React.FC<CategoryCardProps> = ({
  title,
  categoryData,
  currency = 'SGD',
  showTrends = false,
  className = ''
}) => {
  // Custom tooltip component
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const totalValue = categoryData.reduce((sum, item) => sum + item.value, 0);
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
          {showTrends && payload[0].trend !== undefined && (
            <p className={`text-xs mt-1 ${payload[0].trend > 0 ? 'text-red-500' : 'text-green-500'}`}>
              {payload[0].trend > 0 ? '+' : ''}{payload[0].trend.toFixed(1)}% vs last period
            </p>
          )}
        </div>
      );
    }
    return null;
  };
  
  // Generate a legend that's formatted nicely
  const renderLegend = (props: any) => {
    const { payload } = props;
    const totalValue = categoryData.reduce((sum, item) => sum + item.value, 0);
    
    return (
      <ul className="flex flex-col gap-2 text-sm max-h-48 overflow-y-auto pr-2">
        {payload.map((entry: any, index: number) => {
          const percentage = Math.round((entry.value / totalValue) * 100);
          return (
            <li key={`item-${index}`} className="flex items-center justify-between">
              <div className="flex items-center">
                <div 
                  className="w-3 h-3 rounded-sm mr-2 flex-shrink-0" 
                  style={{ backgroundColor: entry.color }}
                ></div>
                <span className="truncate max-w-[120px]" title={entry.name}>
                  {entry.name}
                </span>
              </div>
              <span>{percentage}%</span>
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <Card className={`${className}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-xl flex items-center gap-2">
          <TagIcon className="h-5 w-5 text-primary" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {categoryData.length > 0 ? (
          <div className="w-full h-64 mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.color} 
                      stroke="var(--background)"
                      strokeWidth={2}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  content={renderLegend}
                  layout="vertical" 
                  verticalAlign="middle" 
                  align="right"
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            <p>No category data available</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default React.memo(CategoryCard);
