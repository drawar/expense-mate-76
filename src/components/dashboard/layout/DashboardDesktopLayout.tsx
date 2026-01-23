// components/dashboard/layout/DashboardDesktopLayout.tsx
/**
 * Desktop-optimized dashboard layout with actionable hierarchy:
 * 1. Hero Zone - Budget Status (with period comparison)
 * 2. Category Zone - Spending by Category Treemap
 * 3. Collapsible Zone - Trend, Money Flow
 * 4. Alerts Zone - Smart Insights
 * 5. Activity Zone - Transactions, Merchants, Cards, Loyalty (tabbed)
 */

import React from "react";
import { useDashboardContext } from "@/contexts/DashboardContext";
import { useBudget } from "@/hooks/useBudget";
import {
  SpendingTrendCard,
  InsightsCard,
  MoneyFlowSankey,
  BudgetStatusCard,
  CategoryVarianceCard,
  CollapsibleCard,
} from "@/components/dashboard/cards";
import ActivitySection from "./ActivitySection";

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
    activeTab,
    displayCurrency,
  } = useDashboardContext();

  const { scaledBudget } = useBudget(displayCurrency, activeTab);

  // Card styling
  const cardClass = "rounded-xl border border-border/50 bg-card";
  const cardClassHover = `${cardClass} hover:shadow-md transition-all`;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* ============================================
          HERO ZONE - Budget Status (Primary Focus)
          Shows spend vs budget, projection, days left
          Now includes period comparison (vs last month)
          ============================================ */}
      <BudgetStatusCard className={`${cardClass} shadow-sm`} />

      {/* ============================================
          CATEGORY ZONE - Spending by Category Treemap
          ============================================ */}
      <CategoryVarianceCard className={cardClassHover} />

      {/* ============================================
          COLLAPSIBLE ZONE - Detailed Visualizations
          Hidden by default, expandable for power users
          ============================================ */}
      <CollapsibleCard
        title="Spending Trend"
        defaultCollapsed
        className={cardClass}
      >
        <SpendingTrendCard
          transactions={filteredTransactions}
          allTransactions={transactions}
          previousPeriodTransactions={previousPeriodTransactions}
          currency={displayCurrency}
          className="border-0 shadow-none"
          timeframe={activeTab}
        />
      </CollapsibleCard>

      <CollapsibleCard
        title="Money Flow Details"
        defaultCollapsed
        className={cardClass}
      >
        <MoneyFlowSankey
          transactions={filteredTransactions}
          className="border-0 shadow-none"
        />
      </CollapsibleCard>

      {/* ============================================
          ALERTS ZONE - Smart Insights
          Card optimization, unusual spending, etc.
          (Budget status is in Hero Zone)
          ============================================ */}
      <InsightsCard
        transactions={filteredTransactions}
        monthlyBudget={scaledBudget}
        currency={displayCurrency}
        paymentMethods={paymentMethods}
        className={cardClassHover}
        maxInsights={3}
        timeframe={activeTab}
      />

      {/* ============================================
          ACTIVITY ZONE - Tabbed Activity Hub
          Transactions | Merchants | Cards | Loyalty
          ============================================ */}
      <ActivitySection
        transactions={filteredTransactions}
        allTransactions={transactions}
        displayCurrency={displayCurrency}
        paymentMethods={paymentMethods}
      />
    </div>
  );
};

export default React.memo(DashboardDesktopLayout);
