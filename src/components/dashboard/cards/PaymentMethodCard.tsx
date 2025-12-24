// src/components/dashboard/cards/PaymentMethodCard.tsx
import React from "react";
import { CreditCardIcon } from "lucide-react";
import { Currency } from "@/types";
import { CurrencyService } from "@/core/currency";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ChartDataItem } from "@/types/dashboard";

interface PaymentMethodCardProps {
  title?: string;
  data: ChartDataItem[];
  currency?: Currency;
  className?: string;
  highlightTopMethod?: boolean;
}

/**
 * A grid-based card for displaying payment method distribution
 */
const PaymentMethodCard: React.FC<PaymentMethodCardProps> = ({
  title = "Payment Methods",
  data,
  currency = "SGD",
  className = "",
  highlightTopMethod = true,
}) => {
  // Log data coming into the component
  React.useEffect(() => {
    console.log(`PaymentMethodCard data:`, data?.length || 0, "items");
  }, [data]);

  // Process data to highlight the top payment method if requested
  const processedData = React.useMemo(() => {
    if (!data || data.length === 0) {
      console.log("No payment method data available");
      return [];
    }

    if (!highlightTopMethod) return data;

    // Sort by value descending to find top method
    const sortedData = [...data].sort((a, b) => b.value - a.value);

    if (sortedData.length > 0) {
      // Add visual differentiation to the top method
      return sortedData.map((item, index) => ({
        ...item,
        highlighted: index === 0,
      }));
    }

    return data;
  }, [data, highlightTopMethod]);

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-xl flex items-center gap-2">
          <CreditCardIcon className="h-5 w-5 text-primary" />
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
                  <div className="text-right text-[14px] font-medium text-olive-green dark:text-white">
                    {CurrencyService.format(item.value, currency)}
                  </div>
                </React.Fragment>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-36 text-muted-foreground">
            <p>No payment method data available</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default React.memo(PaymentMethodCard);
