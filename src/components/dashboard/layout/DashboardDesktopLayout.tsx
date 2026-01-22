// components/dashboard/layout/DashboardDesktopLayout.tsx
/**
 * Desktop-optimized dashboard layout using CSS Grid for bento-box style
 * This layout maximizes horizontal space and reduces scrolling
 */

import React, { useState, useMemo } from "react";
import { parseISO } from "date-fns";
import { useDashboardContext } from "@/contexts/DashboardContext";
import { useBudget } from "@/hooks/useBudget";
import { useRecurringIncome } from "@/hooks/useRecurringIncome";
import {
  SpendingTrendCard,
  InsightsCard,
  PointsEarnedCardDesktop,
} from "@/components/dashboard/cards";
import BudgetSpendingCardDesktop from "@/components/dashboard/cards/BudgetSpendingCardDesktop";
import FinancialSummaryRow from "./FinancialSummaryRow";
import ActivitySection from "./ActivitySection";
import CategoryDrilldownSheet from "@/components/dashboard/CategoryDrilldownSheet";

interface DashboardDesktopLayoutProps {
  className?: string;
}

const DashboardDesktopLayout: React.FC<DashboardDesktopLayoutProps> = ({
  className = "",
}) => {
  const {
    transactions,
    filteredTransactions,
    previousPeriodTransactions,
    paymentMethods,
    dashboardData,
    activeTab,
    displayCurrency,
  } = useDashboardContext();

  const { scaledBudget } = useBudget(displayCurrency, activeTab);
  const { totalIncome, incomeSources } = useRecurringIncome(
    displayCurrency,
    activeTab
  );

  // Category drilldown state
  const [drilldownOpen, setDrilldownOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("");

  // Get metrics
  const metrics = dashboardData?.metrics || {
    totalExpenses: 0,
    totalReimbursed: 0,
  };
  const netExpenses =
    (metrics.totalExpenses || 0) - (metrics.totalReimbursed || 0);

  // Check if user has income sources configured
  const hasIncomeSources = incomeSources.length > 0;
  const hasReimbursements = (metrics?.totalReimbursed || 0) > 0;

  // Reimbursed transactions count
  const reimbursedTransactionsCount = useMemo(() => {
    if (!filteredTransactions.length) return 0;
    return filteredTransactions.reduce(
      (count, tx) => (tx.reimbursementAmount ? count + 1 : count),
      0
    );
  }, [filteredTransactions]);

  const commonCardClass =
    "rounded-xl border border-border/50 bg-card hover:shadow-md transition-all";

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Row 1: Budget & Spending + Spending Trends (equal width, equal height) */}
      <div className="grid grid-cols-2 gap-4">
        {/* Budget & Spending */}
        <BudgetSpendingCardDesktop
          className={`${commonCardClass} h-full`}
          transactions={filteredTransactions}
        />

        {/* Spending Trends */}
        <SpendingTrendCard
          transactions={filteredTransactions}
          allTransactions={transactions}
          previousPeriodTransactions={previousPeriodTransactions}
          currency={displayCurrency}
          className={`${commonCardClass} h-full flex flex-col`}
          timeframe={activeTab}
        />
      </div>

      {/* Row 2: Financial Summary (Income + Reimbursements) - compact row */}
      {(hasIncomeSources || hasReimbursements) && (
        <FinancialSummaryRow
          totalIncome={totalIncome}
          netExpenses={netExpenses}
          totalReimbursed={metrics?.totalReimbursed || 0}
          reimbursedCount={reimbursedTransactionsCount}
          displayCurrency={displayCurrency}
          hasIncomeSources={hasIncomeSources}
          hasReimbursements={hasReimbursements}
          className={commonCardClass}
        />
      )}

      {/* Row 3: Points Earned (full width, horizontal bar chart) */}
      <PointsEarnedCardDesktop
        transactions={filteredTransactions}
        displayCurrency={displayCurrency}
        className={commonCardClass}
      />

      {/* Row 4: Smart Insights (full width, compact) */}
      <InsightsCard
        transactions={filteredTransactions}
        monthlyBudget={scaledBudget}
        currency={displayCurrency}
        paymentMethods={paymentMethods}
        className={commonCardClass}
        maxInsights={3}
        timeframe={activeTab}
      />

      {/* Row 5: Activity Section (Recent Transactions + Merchants + Cards) */}
      <ActivitySection
        transactions={filteredTransactions}
        allTransactions={transactions}
        displayCurrency={displayCurrency}
        paymentMethods={paymentMethods}
      />

      {/* Category Drill-down Sheet */}
      <CategoryDrilldownSheet
        open={drilldownOpen}
        onOpenChange={setDrilldownOpen}
        categoryName={selectedCategory}
        transactions={filteredTransactions}
        currency={displayCurrency}
      />
    </div>
  );
};

export default React.memo(DashboardDesktopLayout);
