// components/dashboard/layout/FinancialSummaryRow.tsx
/**
 * Compact horizontal row combining Income & Reimbursements
 * Designed for desktop layout to reduce vertical space
 */

import React from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  TrendingUpIcon,
  TrendingDownIcon,
  ArrowRightIcon,
  ArrowDownLeftIcon,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useCurrencyFormatter } from "@/hooks/useCurrencyFormatter";
import { Currency } from "@/types";
import { useDashboardContext } from "@/contexts/DashboardContext";
import { getTimeframeDateRange } from "@/utils/dashboard";

interface FinancialSummaryRowProps {
  totalIncome: number;
  netExpenses: number;
  totalReimbursed: number;
  reimbursedCount: number;
  displayCurrency: Currency;
  hasIncomeSources: boolean;
  hasReimbursements: boolean;
  className?: string;
}

/**
 * Compact row showing Income, Net Flow, and Reimbursements side by side
 */
const FinancialSummaryRow: React.FC<FinancialSummaryRowProps> = ({
  totalIncome,
  netExpenses,
  totalReimbursed,
  reimbursedCount,
  displayCurrency,
  hasIncomeSources,
  hasReimbursements,
  className = "",
}) => {
  const navigate = useNavigate();
  const { activeTab } = useDashboardContext();
  const { formatCurrency } = useCurrencyFormatter(displayCurrency);

  const netFlow = totalIncome - netExpenses;
  const isPositive = netFlow >= 0;

  // Handle click on reimbursed transactions link
  const handleReimbursedClick = () => {
    const dateRange = getTimeframeDateRange(activeTab);
    const params = new URLSearchParams();
    params.set("hasReimbursement", "true");
    if (dateRange) {
      params.set("from", dateRange.from);
      params.set("to", dateRange.to);
    }
    navigate(`/transactions?${params.toString()}`);
  };

  // Calculate grid columns based on what's visible
  const gridCols =
    hasIncomeSources && hasReimbursements ? 3 : hasIncomeSources ? 2 : 1;

  return (
    <Card className={className}>
      <CardContent className="py-4">
        <div
          className="grid gap-6"
          style={{
            gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))`,
          }}
        >
          {/* Income Section */}
          {hasIncomeSources && (
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 p-2 rounded-full bg-[var(--color-success)]/10">
                <TrendingUpIcon className="h-5 w-5 text-[var(--color-success)]" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">
                  Total Income
                </p>
                <p className="text-2xl font-semibold text-[var(--color-success)] truncate">
                  {formatCurrency(totalIncome)}
                </p>
              </div>
              <Link
                to="/income"
                className="flex-shrink-0 p-2 rounded-full hover:bg-muted/50 transition-colors"
                aria-label="Manage income sources"
              >
                <ArrowRightIcon className="h-4 w-4 text-muted-foreground" />
              </Link>
            </div>
          )}

          {/* Net Cash Flow Section */}
          {hasIncomeSources && (
            <div className="flex items-center gap-4 border-l border-border/50 pl-6">
              <div
                className={`flex-shrink-0 p-2 rounded-full ${
                  isPositive
                    ? "bg-[var(--color-success)]/10"
                    : "bg-destructive/10"
                }`}
              >
                {isPositive ? (
                  <TrendingUpIcon className="h-5 w-5 text-[var(--color-success)]" />
                ) : (
                  <TrendingDownIcon className="h-5 w-5 text-destructive" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">
                  Net Cash Flow
                </p>
                <p
                  className={`text-2xl font-semibold truncate ${
                    isPositive
                      ? "text-[var(--color-success)]"
                      : "text-destructive"
                  }`}
                >
                  {isPositive ? "+" : ""}
                  {formatCurrency(netFlow)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Income minus expenses
                </p>
              </div>
            </div>
          )}

          {/* Reimbursements Section */}
          {hasReimbursements && (
            <div
              className={`flex items-center gap-4 ${
                hasIncomeSources ? "border-l border-border/50 pl-6" : ""
              }`}
            >
              <div className="flex-shrink-0 p-2 rounded-full bg-primary/10">
                <ArrowDownLeftIcon className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">
                  Reimbursements
                </p>
                <p className="text-2xl font-semibold text-[var(--color-success)] truncate">
                  {formatCurrency(totalReimbursed)}
                </p>
                <button
                  onClick={handleReimbursedClick}
                  className="text-xs text-muted-foreground hover:text-primary hover:underline transition-colors"
                >
                  From {reimbursedCount} transaction
                  {reimbursedCount !== 1 ? "s" : ""}
                </button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default React.memo(FinancialSummaryRow);
