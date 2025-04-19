// components/dashboard/cards/UnusualSpendingCard.tsx
import React from "react";
import { AlertTriangleIcon, ChevronRightIcon } from "lucide-react";
import { Transaction, Currency } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { currencyService } from "@/services/CurrencyService";
import { Link } from "react-router-dom";
import { 
  useUnusualSpending, 
  type SpendingAnomaly 
} from "@/hooks/dashboard/useUnusualSpending";

interface UnusualSpendingCardProps {
  title?: string;
  transactions: Transaction[];
  currency?: Currency;
  className?: string;
  maxDisplayedAnomalies?: number;
}

/**
 * Card component that displays unusual spending patterns and anomalies
 */
const UnusualSpendingCard: React.FC<UnusualSpendingCardProps> = ({
  title = "Unusual Spending",
  transactions,
  currency = "USD",
  className = "",
  maxDisplayedAnomalies = 3,
}) => {
  // Use our custom hook to detect anomalies
  const { anomalies, alertCount } = useUnusualSpending(transactions);

  // Get a subset of anomalies to display
  const displayedAnomalies = anomalies.slice(0, maxDisplayedAnomalies);

  // Helper to get dot color based on severity
  const getSeverityColor = (severity: "low" | "medium" | "high"): string => {
    switch (severity) {
      case "high":
        return "text-red-500 fill-red-500";
      case "medium":
        return "text-orange-500 fill-orange-500";
      case "low":
        return "text-blue-500 fill-blue-500";
      default:
        return "text-gray-500 fill-gray-500";
    }
  };

  return (
    <Card className={`overflow-hidden ${className}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl flex items-center gap-2">
            <AlertTriangleIcon className="h-5 w-5 text-amber-500" />
            {title}
          </CardTitle>

          {alertCount > 0 && (
            <Badge
              variant="outline"
              className="bg-amber-100 text-amber-800 border-amber-200 px-2 py-0.5"
            >
              {alertCount} {alertCount === 1 ? "alert" : "alerts"}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {anomalies.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center">
            <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-full mb-3">
              <AlertTriangleIcon className="h-6 w-6 text-green-500" />
            </div>
            <p className="text-muted-foreground">
              No unusual spending detected.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              We'll notify you when we spot any anomalies in your spending.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Anomaly List */}
            <div className="space-y-3">
              {displayedAnomalies.map((anomaly, index) => (
                <div
                  key={anomaly.transactionId}
                  className="flex items-start justify-between py-2"
                >
                  <div className="flex items-start gap-3">
                    {/* Severity Dot */}
                    <div
                      className={`mt-1.5 h-2 w-2 rounded-full ${getSeverityColor(anomaly.severity)}`}
                    />

                    {/* Merchant and Reason */}
                    <div>
                      <p className="font-medium">{anomaly.merchantName}</p>
                      <p className="text-sm text-muted-foreground">
                        {anomaly.reason}
                      </p>
                    </div>
                  </div>

                  {/* Amount */}
                  <div className="text-right font-medium">
                    {currencyService.format(anomaly.amount, currency)}
                  </div>
                </div>
              ))}
            </div>

            {/* View All Link */}
            {alertCount > maxDisplayedAnomalies && (
              <Link
                to="/transactions?filter=anomalies"
                className="text-sm text-primary flex items-center justify-center mt-2 hover:underline"
              >
                View All Anomalies <ChevronRightIcon className="h-4 w-4 ml-1" />
              </Link>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default React.memo(UnusualSpendingCard);
