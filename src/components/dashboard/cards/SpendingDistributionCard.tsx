// src/components/dashboard/cards/SpendingDistributionCard.tsx
import React, { useState } from 'react';
import { Currency } from '@/types';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { CreditCardIcon, TagIcon } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ChartDataItem } from '@/types/dashboard';
import { currencyService } from '@/services/CurrencyService';

interface SpendingDistributionCardProps {
  categoryData: ChartDataItem[];
  paymentMethodData: ChartDataItem[];
  currency?: Currency;
  className?: string;
  maxCategories?: number;
  highlightTopMethod?: boolean;
}

type ViewMode = 'category' | 'payment';

/**
 * A combined card component that toggles between category and payment method distribution views
 */
const SpendingDistributionCard: React.FC<SpendingDistributionCardProps> = ({
  categoryData,
  paymentMethodData,
  currency = 'SGD',
  className = '',
  maxCategories = 10,
  highlightTopMethod = true
}) => {
  // State to track which view is currently active
  const [viewMode, setViewMode] = useState<ViewMode>('category');
  
  // Process category data
  const processedCategoryData = React.useMemo(() => {
    if (!categoryData || categoryData.length <= maxCategories) return categoryData;
    
    // Sort by value descending
    const sortedData = [...categoryData].sort((a, b) => b.value - a.value);
    
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
  }, [categoryData, maxCategories]);
  
  // Process payment method data
  const processedPaymentData = React.useMemo(() => {
    if (!paymentMethodData || !highlightTopMethod) return paymentMethodData;
    
    // Sort by value descending to find top method
    const sortedData = [...paymentMethodData].sort((a, b) => b.value - a.value);
    
    if (sortedData.length > 0) {
      // Add visual differentiation to the top method
      return sortedData.map((item, index) => ({
        ...item,
        highlighted: index === 0
      }));
    }
    
    return paymentMethodData;
  }, [paymentMethodData, highlightTopMethod]);
  
  // Get active data based on current view mode
  const activeData = viewMode === 'category' ? processedCategoryData : processedPaymentData;
  
  // Get title based on current view mode
  const title = viewMode === 'category' ? 'Expense Categories' : 'Payment Methods';
  
  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl flex items-center gap-2">
            {viewMode === 'category' ? (
              <TagIcon className="h-5 w-5 text-primary" />
            ) : (
              <CreditCardIcon className="h-5 w-5 text-primary" />
            )}
            {title}
          </CardTitle>
          
          <ToggleGroup type="single" value={viewMode} onValueChange={(value) => value && setViewMode(value as ViewMode)}>
            <ToggleGroupItem value="category" aria-label="View categories">
              <TagIcon className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Category</span>
            </ToggleGroupItem>
            <ToggleGroupItem value="payment" aria-label="View payment methods">
              <CreditCardIcon className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Payment</span>
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </CardHeader>
      <CardContent>
        {activeData && activeData.length > 0 ? (
          <div className="mt-2 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              {activeData.map((item, index) => (
                // Replace React.Fragment with a regular div with grid properties
                <div key={`${item.name}-${index}`} className="contents">
                  <div className="flex items-center">
                    <div 
                      className="w-3 h-3 rounded-sm mr-2 flex-shrink-0" 
                      style={{ backgroundColor: item.color }} 
                    />
                    <span 
                      className={`truncate text-[14px] font-medium text-olive-green dark:text-white ${
                        item.highlighted ? 'font-semibold' : ''
                      }`}
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
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-36 text-muted-foreground">
            <p>No {viewMode === 'category' ? 'category' : 'payment method'} data available</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default React.memo(SpendingDistributionCard);
