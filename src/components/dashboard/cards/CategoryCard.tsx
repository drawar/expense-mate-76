// src/components/dashboard/cards/CategoryCard.tsx
import React, { Component } from 'react';
import { TagIcon } from 'lucide-react';
import AbstractFinancialInsightCard, { 
  FinancialInsightCardProps 
} from '@/components/dashboard/abstractions/AbstractFinancialInsightCard';
import CategoryPieChart from '@/components/dashboard/charts/CategoryPieChart';
import { PieChartDataItem } from '@/components/dashboard/abstractions/AbstractPieChart';

interface CategoryCardProps extends FinancialInsightCardProps {
  categoryData: PieChartDataItem[];
  currency?: string;
  showTrends?: boolean;
}

/**
 * Card component that displays expense category distribution
 * Extends AbstractFinancialInsightCard to inherit common card behaviors
 * Contains CategoryPieChart which inherits from AbstractPieChart
 */
class CategoryCard extends AbstractFinancialInsightCard<CategoryCardProps> {
  /**
   * Implement the abstract method to provide card-specific content
   */
  protected renderCardContent(): React.ReactNode {
    const { categoryData, currency, showTrends } = this.props;
    
    return (
      <CategoryPieChart 
        data={categoryData} 
        currency={currency || 'SGD'}
        showTrends={showTrends}
        standalone={false}
      />
    );
  }
}

/**
 * Factory function to create a CategoryCard with default props
 */
export const createCategoryCard = (
  categoryData: PieChartDataItem[],
  currency: string = 'SGD',
  className: string = '',
  showTrends: boolean = false
) => {
  return (
    <CategoryCard
      title="Expense Categories"
      icon={TagIcon}
      categoryData={categoryData}
      currency={currency}
      className={className}
      showTrends={showTrends}
    />
  );
};

export default CategoryCard;
