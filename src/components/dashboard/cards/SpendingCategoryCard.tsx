// src/components/dashboard/cards/SpendingCategoryCard.tsx
import React from 'react';
import { TagIcon } from 'lucide-react';
import { Currency } from '@/types';
import { currencyService } from '@/services/CurrencyService';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ChartDataItem } from '@/types/dashboard';

interface SpendingCategoryCardProps {
  title?: string;
  data: ChartDataItem[];
  currency?: Currency;
  className?: string;
  maxCategories?: number;
}

/**
 * A grid-based card for displaying spending by category
 */
const SpendingCategoryCard: React.FC<SpendingCategoryCardProps> = ({
  title = 'Expense Categories',
  data,
  currency = 'SGD',
  className = '',
  maxCategories = 10
}) => {
  // Log data coming into the component
  React.useEffect(() => {
    console.log(`SpendingCategoryCard data:`, data?.length || 0, 'items');
  }, [data]);
  
  // Process data to show only the top categories and group others
  const processedData = React.useMemo(() => {
    if (!data || data.length === 0) {
      console.log('No category data available');
      return [];
    }
    
    if (data.length <= maxCategories) return data;
    
    // Sort by value descending
    const sortedData = [...data].sort((a, b) => b.value - a.value);
    
    // Take top categories
    const topCategories = sortedData.slice(0, maxCategories - 1);
    
    // Group the rest as "Other"
    const otherCategories = sortedData.slice(maxCategories - 1);
    const otherValue = otherCategories.reduce((sum, item) => sum + item.value, 0);
    
    if (otherValue > 0) {
      return [
        ...topCategories,
        {
          name: 'Other',
          value: otherValue,
          color: '#9e9e9e' // Gray color for "Other" category
        }
      ];
    }
    
    return topCategories;
  }, [data, maxCategories]);
  
  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-xl flex items-center gap-2">
          <TagIcon className="h-5 w-5 text-primary" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {processedData && processedData.length > 0 ? (
          <div className="mt-2 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              {processedData.map((item, index) => (
                <React.Fragment key={`${item.name}-${index}`}>
                  <div className="flex items-center">
                    <div 
                      className="w-3 h-3 rounded-sm mr-2 flex-shrink-0" 
                      style={{ backgroundColor: item.color }} 
                    />
                    <span 
                      className="truncate text-[14px] font-medium text-olive-green dark:text-white" 
                      title={item.name}
                    >
                      {item.name}
                    </span>
                  </div>
                  <div 
                    className="text-right text-[14px] font-semibold text-olive-green dark:text-white"
                  >
                    {currencyService.format(item.value, currency)}
                  </div>
                </React.Fragment>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-36 text-muted-foreground">
            <p>No category data available</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default React.memo(SpendingCategoryCard);
