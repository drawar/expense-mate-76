// src/components/dashboard/cards/SpendingCategoryCard.tsx
import React from 'react';
import { TagIcon } from 'lucide-react';
import { Currency } from '@/types';
import { PieChart, ChartDataItem } from '@/components/dashboard/charts/PieChart';

interface SpendingCategoryCardProps {
  title?: string;
  data: ChartDataItem[];
  currency?: Currency;
  className?: string;
  maxCategories?: number;
}

/**
 * A specialized card for displaying spending by category
 * Wraps the PieChart component with domain-specific defaults and styling
 */
const SpendingCategoryCard: React.FC<SpendingCategoryCardProps> = ({
  title = 'Expense Categories',
  data,
  currency = 'SGD',
  className = '',
  maxCategories = 10
}) => {
  // Process data to show only the top categories and group others
  const processedData = React.useMemo(() => {
    if (!data || data.length <= maxCategories) return data;
    
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
  
  // Use specific domain settings for category visualization
  const innerRadius = 50;
  const outerRadius = 80;
  
  return (
    <PieChart
      title={title}
      icon={<TagIcon className="h-5 w-5 text-primary" />}
      data={processedData}
      currency={currency}
      className={className}
      innerRadius={innerRadius}
      outerRadius={outerRadius}
    />
  );
};

export default React.memo(SpendingCategoryCard);
