// components/dashboard/layout/InsightsGrid.tsx
import React, { useState } from "react";
import { DashboardData } from "@/types/dashboard";
import { Currency, PaymentMethod, Transaction } from "@/types";
import {
  SpendingTrendCard,
  FrequentMerchantsCard,
  CardOptimizationCard,
  InsightsCard,
  SpendingHealthCard,
  PointsEarnedCard,
  SpendByCardCard,
} from "@/components/dashboard/cards";
import CategoryDrilldownSheet from "@/components/dashboard/CategoryDrilldownSheet";
import { EmptyState } from ".";
import { BarChartIcon } from "lucide-react";
import { TimeframeTab } from "@/utils/dashboard";

interface InsightsGridProps {
  dashboardData: DashboardData | null;
  paymentMethods?: PaymentMethod[];
  currency: Currency;
  scaledBudget?: number;
  timeframe?: TimeframeTab;
  previousPeriodTransactions?: Transaction[];
  /** All transactions (unfiltered) - used for forecast historical analysis */
  allTransactions?: Transaction[];
}

/**
 * Grid layout for dashboard insights and visualizations
 */
const InsightsGrid: React.FC<InsightsGridProps> = ({
  dashboardData,
  paymentMethods = [],
  currency,
  scaledBudget = 0,
  timeframe = "thisMonth",
  previousPeriodTransactions = [],
  allTransactions = [],
}) => {
  // State for category drill-down
  const [drilldownOpen, setDrilldownOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("");

  // Ensure dashboardData is defined before destructuring
  const filteredTransactions = dashboardData?.filteredTransactions || [];
  const charts = dashboardData?.charts || {
    paymentMethods: [],
    categories: [],
  };

  // Early return if no data to prevent rendering empty charts
  const hasData = filteredTransactions.length > 0;

  // Memoize common card class for consistency
  const commonCardClass = React.useMemo(
    () =>
      "rounded-xl border border-border/50 bg-card hover:shadow-md transition-all",
    []
  );

  // Handle category click for drill-down
  const handleCategoryClick = (parentId: string, categoryName: string) => {
    setSelectedCategory(categoryName);
    setDrilldownOpen(true);
  };

  // Early return for empty data state
  if (!hasData) {
    return (
      <div className="mt-6 space-y-4">
        <h2 className="text-xl font-medium tracking-tight text-primary">
          Financial Insights
        </h2>
        <div className="p-6 text-center border border-dashed rounded-xl">
          <EmptyState
            title="No Insights Available"
            description="Add transactions to see financial insights and visualizations."
            icon={<BarChartIcon className="h-16 w-16 text-muted-foreground" />}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-4">
      <h2 className="text-xl font-medium tracking-tight text-primary">
        Financial Insights
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Spending Trends Card */}
        <SpendingTrendCard
          transactions={filteredTransactions}
          allTransactions={allTransactions}
          previousPeriodTransactions={previousPeriodTransactions}
          currency={currency}
          className={commonCardClass}
          timeframe={timeframe}
        />

        {/* Frequent Merchants Card - Quick Add */}
        <FrequentMerchantsCard
          transactions={filteredTransactions}
          currency={currency}
          className={commonCardClass}
        />

        {/* Card Optimization Card - only renders when suggestions exist */}
        <CardOptimizationCard
          title="Card Optimization"
          transactions={filteredTransactions}
          paymentMethods={paymentMethods}
          currency={currency}
          className={commonCardClass}
        />

        {/* Smart Insights Card - AI-powered recommendations */}
        <InsightsCard
          transactions={filteredTransactions}
          monthlyBudget={scaledBudget}
          currency={currency}
          paymentMethods={paymentMethods}
          className={commonCardClass}
          maxInsights={4}
        />

        {/* Points Earned Card */}
        <PointsEarnedCard
          transactions={filteredTransactions}
          displayCurrency={currency}
          className={commonCardClass}
        />

        {/* Spend by Card */}
        <SpendByCardCard
          transactions={filteredTransactions}
          displayCurrency={currency}
          className={commonCardClass}
        />

        {/* Spending Health Score Card */}
        {/* <SpendingHealthCard
          transactions={filteredTransactions}
          monthlyBudget={scaledBudget}
          totalSpent={dashboardData?.metrics?.totalExpenses || 0}
          currency={currency}
          className={commonCardClass}
        /> */}
      </div>

      {/* Category Drill-down Sheet */}
      <CategoryDrilldownSheet
        open={drilldownOpen}
        onOpenChange={setDrilldownOpen}
        categoryName={selectedCategory}
        transactions={filteredTransactions}
        currency={currency}
      />
    </div>
  );
};

export default React.memo(InsightsGrid);
