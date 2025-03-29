// src/components/dashboard/cards/PaymentMethodCard.tsx
import React from 'react';
import { CreditCardIcon } from 'lucide-react';
import { Currency } from '@/types';
import { PieChart, ChartDataItem } from '@/components/dashboard/charts/PieChart';

interface PaymentMethodCardProps {
  title?: string;
  data: ChartDataItem[];
  currency?: Currency;
  className?: string;
  highlightTopMethod?: boolean;
}

/**
 * A specialized card for displaying payment method distribution
 * Wraps the PieChart component with payment-specific formatting and behavior
 */
const PaymentMethodCard: React.FC<PaymentMethodCardProps> = ({
  title = 'Payment Methods',
  data,
  currency = 'SGD',
  className = '',
  highlightTopMethod = true
}) => {
  // Process data to highlight the top payment method if requested
  const processedData = React.useMemo(() => {
    if (!data || !highlightTopMethod) return data;
    
    // Sort by value descending to find top method
    const sortedData = [...data].sort((a, b) => b.value - a.value);
    
    if (sortedData.length > 0) {
      // Add visual differentiation to the top method (slightly larger outer radius)
      return sortedData.map((item, index) => ({
        ...item,
        // Attributes specific to payment visualization could be added here
        highlighted: index === 0
      }));
    }
    
    return data;
  }, [data, highlightTopMethod]);
  
  // Payment method chart can use different radius to distinguish it from category chart
  const innerRadius = 50;
  const outerRadius = 80;
  
  return (
    <PieChart
      title={title}
      icon={<CreditCardIcon className="h-5 w-5 text-primary" />}
      data={processedData}
      currency={currency}
      className={className}
      innerRadius={innerRadius}
      outerRadius={outerRadius}
    />
  );
};

export default React.memo(PaymentMethodCard);
