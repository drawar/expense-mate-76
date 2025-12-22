// components/dashboard/cards/UnusualSpendingCard.tsx
import React from "react";
import { AlertTriangleIcon } from "lucide-react";
import { Chevron } from "@/components/ui/chevron";
import { Transaction, Currency } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CurrencyService } from "@/core/currency";
import { Link } from "react-router-dom";
import {
  useUnusualSpending,
  type SpendingAnomaly,
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

  // Helper to get dot color based on severity - using Japandi design tokens
  const getSeverityColor = (severity: "low" | "medium" | "high"): string => {
    switch (severity) {
      case "high":
        return "text-[var(--color-error)] fill-[var(--color-error)]";
      case "medium":
        return "text-[var(--color-warning)] fill-[var(--color-warning)]";
      case "low":
        return "text-[var(--color-accent)] fill-[var(--color-accent)]";
      default:
        return "text-muted-foreground fill-muted-foreground";
    }
  };

  // Hide entirely when no anomalies
  if (anomalies.length === 0) {
    return null;
  }

  return (
    <Card className={`overflow-hidden ${className}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl flex items-center gap-2">
            <AlertTriangleIcon className="h-5 w-5 text-[var(--color-warning)]" />
            {title}
          </CardTitle>

          {alertCount > 0 && (
            <Badge
              variant="outline"
              className="bg-[var(--color-badge-bg)] text-[var(--color-badge-text)] border-[var(--color-badge-border)] px-2 py-0.5"
            >
              {alertCount} {alertCount === 1 ? "alert" : "alerts"}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent>
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
                  {CurrencyService.format(anomaly.amount, currency)}
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
              View All Anomalies{" "}
              <Chevron direction="right" size="small" className="ml-1" />
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default React.memo(UnusualSpendingCard);
