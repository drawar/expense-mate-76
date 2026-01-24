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
  SpendingOverviewCard,
  CategoryPeriodComparisonCard,
  IncomeSavingsStack,
  SecondaryKPICards,
  CategoryInsightCards,
  MostFrequentMerchantCard,
  MostFavoriteCardCard,
  RecentTransactionsCard,
  TopMerchantsCard,
  TopCardsCard,
  TopLoyaltyProgramsCard,
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
          HERO ZONE - Income/Savings Stack + Spending Overview
          ============================================ */}
      <div className="grid grid-cols-[25%_1fr] gap-4">
        <IncomeSavingsStack />
        <SpendingOverviewCard className={`${cardClass} shadow-sm h-full`} />
      </div>

      {/* ============================================
          CATEGORY ZONE - Top Category + Comparison Chart
          ============================================ */}
      <div className="grid grid-cols-[25%_1fr] gap-4">
        <CategoryInsightCards />
        <CategoryPeriodComparisonCard className={`${cardClassHover} h-full`} />
      </div>

      {/* ============================================
          MERCHANT ZONE - Most Frequent Merchant + Recent Transactions + Top Merchants
          ============================================ */}
      <div className="grid grid-cols-[25%_1fr_1fr] gap-4 items-start">
        <MostFrequentMerchantCard />
        <RecentTransactionsCard
          transactions={filteredTransactions}
          allTransactions={transactions}
          displayCurrency={displayCurrency}
          paymentMethods={paymentMethods}
          maxItems={5}
          className="min-w-0"
        />
        <TopMerchantsCard
          transactions={filteredTransactions}
          displayCurrency={displayCurrency}
          maxItems={5}
          className="min-w-0"
        />
      </div>

      {/* ============================================
          CARD ZONE - Most Favorite Card + Spending by Card + Rewards by Program
          ============================================ */}
      <div className="grid grid-cols-[25%_1fr_1fr] gap-4 items-start">
        <MostFavoriteCardCard />
        <TopCardsCard
          transactions={filteredTransactions}
          displayCurrency={displayCurrency}
          maxItems={5}
          className="min-w-0"
        />
        <TopLoyaltyProgramsCard
          transactions={filteredTransactions}
          displayCurrency={displayCurrency}
          maxItems={5}
          className="min-w-0"
        />
      </div>

      {/* ============================================
          COLLAPSIBLE ZONE - Detailed Visualizations
          Hidden by default, expandable for power users
          ============================================ */}
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
          Transactions | Cards | Loyalty Programs
          ============================================ */}
      <ActivitySection
        transactions={filteredTransactions}
        allTransactions={transactions}
        displayCurrency={displayCurrency}
        paymentMethods={paymentMethods}
      />

      {/* ============================================
          BUDGET ZONE - Budget Status
          Shows spend vs budget, projection, days left
          Period comparison (vs last month)
          ============================================ */}
      <BudgetStatusCard className={`${cardClass} shadow-sm`} />

      {/* ============================================
          SPENDING TREND - Detailed daily/weekly view
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

      {/* ============================================
          CATEGORY ZONE - Spending by Category Treemap
          ============================================ */}
      <CategoryVarianceCard className={cardClassHover} />

      {/* ============================================
          KPI CARDS - Largest Expense & Most Used Card
          ============================================ */}
      <SecondaryKPICards />
    </div>
  );
};

export default React.memo(DashboardDesktopLayout);
