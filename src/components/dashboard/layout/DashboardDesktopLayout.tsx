// components/dashboard/layout/DashboardDesktopLayout.tsx
/**
 * Desktop-optimized dashboard layout with clear visual hierarchy:
 * 1. Hero Zone - Money Flow Sankey (primary focus)
 * 2. Context Zone - Spending Trends
 * 3. Alerts Zone - Smart Insights (only if alerts exist)
 * 4. Activity Zone - Recent Transactions + Frequent Merchants
 * 5. Reference Zone - Points Earned (collapsible)
 */

import React, { useState } from "react";
import { useDashboardContext } from "@/contexts/DashboardContext";
import { useBudget } from "@/hooks/useBudget";
import {
  SpendingTrendCard,
  InsightsCard,
  PointsEarnedCardDesktop,
  MoneyFlowSankey,
  BudgetSpendingCardDesktop,
} from "@/components/dashboard/cards";
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
    activeTab,
    displayCurrency,
  } = useDashboardContext();

  const { scaledBudget } = useBudget(displayCurrency, activeTab);

  // Category drilldown state
  const [drilldownOpen, setDrilldownOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("");

  // Card styling
  const cardClass = "rounded-xl border border-border/50 bg-card";
  const cardClassHover = `${cardClass} hover:shadow-md transition-all`;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* ============================================
          HERO ZONE - Money Flow Sankey (Primary Focus)
          Shows income → spending → categories flow
          ============================================ */}
      <MoneyFlowSankey
        transactions={filteredTransactions}
        className={`${cardClass} shadow-sm`}
      />

      {/* ============================================
          BUDGET ZONE - Budget Progress + Category Waffle
          ============================================ */}
      <BudgetSpendingCardDesktop
        transactions={filteredTransactions}
        className={cardClassHover}
      />

      {/* ============================================
          CONTEXT ZONE - Trends
          ============================================ */}
      <SpendingTrendCard
        transactions={filteredTransactions}
        allTransactions={transactions}
        previousPeriodTransactions={previousPeriodTransactions}
        currency={displayCurrency}
        className={`${cardClassHover} flex flex-col h-80`}
        timeframe={activeTab}
      />

      {/* ============================================
          ALERTS ZONE - Smart Insights
          Only shows when there are actionable insights
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
          ACTIVITY ZONE - Recent Transactions + Merchants
          ============================================ */}
      <ActivitySection
        transactions={filteredTransactions}
        allTransactions={transactions}
        displayCurrency={displayCurrency}
        paymentMethods={paymentMethods}
      />

      {/* ============================================
          REFERENCE ZONE - Points Earned (Collapsible)
          Secondary info, expandable for details
          ============================================ */}
      <PointsEarnedCardDesktop
        transactions={filteredTransactions}
        displayCurrency={displayCurrency}
        className={cardClassHover}
        collapsible
        defaultCollapsed
        maxItems={5}
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
