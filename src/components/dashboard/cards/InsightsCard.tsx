// src/components/dashboard/cards/InsightsCard.tsx
import React, { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  LightbulbIcon,
  XIcon,
  AlertTriangleIcon,
  AlertCircleIcon,
  CheckCircleIcon,
  InfoIcon,
  ChevronRightIcon,
  SparklesIcon,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Transaction, Currency, PaymentMethod, RenderedInsight } from "@/types";
import { useInsights } from "@/hooks/useInsights";
import { cn } from "@/lib/utils";
import { TransactionDialog } from "@/components/expense/transaction/TransactionDialog";
import { startOfMonth, format } from "date-fns";

interface InsightsCardProps {
  transactions: Transaction[];
  monthlyBudget?: number;
  currency?: Currency;
  paymentMethods?: PaymentMethod[];
  className?: string;
  maxInsights?: number;
}

/**
 * Get icon component for insight severity - using Japandi design tokens
 */
function getSeverityIcon(severity: string) {
  switch (severity) {
    case "danger":
      return (
        <AlertTriangleIcon className="h-4 w-4 text-[var(--color-error)]" />
      );
    case "warning":
      return (
        <AlertCircleIcon className="h-4 w-4 text-[var(--color-warning)]" />
      );
    case "success":
      return (
        <CheckCircleIcon className="h-4 w-4 text-[var(--color-success)]" />
      );
    default:
      return <InfoIcon className="h-4 w-4 text-[var(--color-accent)]" />;
  }
}

/**
 * Get background color class for insight severity - using Japandi design tokens
 */
function getSeverityBgClass(severity: string) {
  switch (severity) {
    case "danger":
      return "bg-[rgba(168,111,100,0.1)] border-[rgba(168,111,100,0.3)]";
    case "warning":
      return "bg-[rgba(196,165,123,0.1)] border-[rgba(196,165,123,0.3)]";
    case "success":
      return "bg-[var(--color-accent-subtle)] border-[var(--color-badge-border)]";
    default:
      return "bg-[var(--color-accent-subtle)] border-[var(--color-badge-border)]";
  }
}

/**
 * Individual insight item component
 */
const InsightItem: React.FC<{
  insight: RenderedInsight;
  onDismiss?: () => void;
  onAction?: (insight: RenderedInsight) => void;
}> = ({ insight, onDismiss, onAction }) => {
  return (
    <div
      className={cn(
        "relative p-3 rounded-lg border transition-all",
        getSeverityBgClass(insight.severity)
      )}
    >
      <div className="flex items-start gap-2.5">
        <div className="flex-shrink-0 mt-0.5">
          {getSeverityIcon(insight.severity)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm text-foreground">
            {insight.title}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
            {insight.message}
          </p>
          {insight.actionText && onAction && (
            <button
              onClick={() => onAction(insight)}
              className="text-xs text-primary font-medium mt-1.5 flex items-center hover:underline"
            >
              {insight.actionText}
              <ChevronRightIcon className="h-3 w-3 ml-0.5" />
            </button>
          )}
        </div>
        {insight.isDismissible && onDismiss && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDismiss();
            }}
            className="flex-shrink-0 p-1 rounded hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            aria-label="Dismiss insight"
          >
            <XIcon className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        )}
      </div>
    </div>
  );
};

/**
 * Card component that displays financial insights and recommendations
 */
const InsightsCard: React.FC<InsightsCardProps> = ({
  transactions,
  monthlyBudget = 0,
  currency = "SGD",
  paymentMethods = [],
  className = "",
  maxInsights = 4,
}) => {
  const navigate = useNavigate();
  const [showAll, setShowAll] = useState(false);
  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaction | null>(null);

  const { insights, isLoading, dismissInsight, urgentCount } = useInsights(
    transactions,
    {
      monthlyBudget,
      currency,
      paymentMethods,
      maxResults: 10,
    }
  );

  // Handle insight action clicks (e.g., "Review transaction", "Review spending")
  const handleInsightAction = useCallback(
    (insight: RenderedInsight) => {
      // Handle "Review spending" - navigate to transactions with current month filter
      if (insight.actionText === "Review spending") {
        const now = new Date();
        const monthStart = startOfMonth(now);
        const fromDate = format(monthStart, "yyyy-MM-dd");
        const toDate = format(now, "yyyy-MM-dd");
        navigate(`/transactions?from=${fromDate}&to=${toDate}`);
        return;
      }

      // If actionTarget contains a transaction ID, find and show that transaction
      if (insight.actionTarget) {
        const transaction = transactions.find(
          (tx) => tx.id === insight.actionTarget
        );
        if (transaction) {
          setSelectedTransaction(transaction);
        }
      }
    },
    [transactions, navigate]
  );

  // Determine how many to display
  const displayedInsights = showAll ? insights : insights.slice(0, maxInsights);
  const hasMore = insights.length > maxInsights;

  // Empty state
  if (!isLoading && insights.length === 0) {
    return (
      <Card className={className}>
        <CardHeader className="pb-2">
          <CardTitle className="text-xl flex items-center gap-2">
            <LightbulbIcon className="h-5 w-5 text-primary" />
            Smart Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <SparklesIcon className="h-10 w-10 text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground">
              No insights yet. Keep tracking your expenses!
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl flex items-center gap-2">
            <LightbulbIcon className="h-5 w-5 text-primary" />
            Smart Insights
          </CardTitle>
          {urgentCount > 0 && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[rgba(168,111,100,0.15)] text-[var(--color-error)]">
              {urgentCount} {urgentCount === 1 ? "alert" : "alerts"}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-16 rounded-lg bg-muted/50 animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div className="space-y-2.5">
            {displayedInsights.map((insight) => (
              <InsightItem
                key={insight.id}
                insight={insight}
                onDismiss={
                  insight.isDismissible
                    ? () => dismissInsight(insight.insightId)
                    : undefined
                }
                onAction={handleInsightAction}
              />
            ))}

            {hasMore && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full mt-2 text-muted-foreground"
                onClick={() => setShowAll(!showAll)}
              >
                {showAll
                  ? "Show less"
                  : `Show ${insights.length - maxInsights} more insights`}
              </Button>
            )}
          </div>
        )}

        {/* Transaction review dialog */}
        <TransactionDialog
          transaction={selectedTransaction}
          paymentMethods={paymentMethods}
          isOpen={selectedTransaction !== null}
          onClose={() => setSelectedTransaction(null)}
        />
      </CardContent>
    </Card>
  );
};

export default React.memo(InsightsCard);
