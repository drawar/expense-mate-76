// components/dashboard/layout/InsightsGrid.tsx
import React, { useState } from "react";
import { DashboardData } from "@/types/dashboard";
import { Currency, PaymentMethod, Transaction } from "@/types";
import {
  SpendingTrendCard,
  CardOptimizationCard,
  UnusualSpendingCard,
  SpendingBreakdownCard,
  InsightsCard,
  SpendingHealthCard,
} from "@/components/dashboard/cards";
import CategoryDrilldownSheet from "@/components/dashboard/CategoryDrilldownSheet";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { EmptyState } from ".";
import { BarChartIcon } from "lucide-react";

interface InsightsGridProps {
  dashboardData: DashboardData | null;
  paymentMethods?: PaymentMethod[];
  currency: Currency;
  monthlyBudget?: number;
}

/**
 * Grid layout for dashboard insights and visualizations
 */
const InsightsGrid: React.FC<InsightsGridProps> = ({
  dashboardData,
  paymentMethods = [],
  currency,
  monthlyBudget = 0,
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

  // Use media query hook
  const isMobile = useMediaQuery("(max-width: 768px)");

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
      <div className="my-6 space-y-6">
        <h2 className="text-2xl font-medium tracking-tight text-primary">
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
    <div className="my-6 space-y-6">
      <h2 className="text-2xl font-medium tracking-tight text-primary">
        Financial Insights
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* NEW: Hierarchical Spending Breakdown Card */}
        <SpendingBreakdownCard
          transactions={filteredTransactions}
          currency={currency}
          className={commonCardClass}
          onCategoryClick={handleCategoryClick}
          maxCategories={5}
        />

        {/* Spending Trends Card */}
        <SpendingTrendCard
          transactions={filteredTransactions}
          currency={currency}
          className={commonCardClass}
          initialPeriod="day"
        />

        {/* Unusual Spending Card */}
        <UnusualSpendingCard
          transactions={filteredTransactions}
          currency={currency}
          className={commonCardClass}
          maxDisplayedAnomalies={isMobile ? 2 : 3}
        />

        {/* Card Optimization Card - only renders when suggestions exist */}
        <CardOptimizationCard
          title="Card Optimization"
          transactions={filteredTransactions}
          paymentMethods={paymentMethods}
          currency={currency}
          className={commonCardClass}
        />

        {/* TODO: Re-enable when insights are refined
        {/* Smart Insights Card - AI-powered recommendations */}
        {/* <InsightsCard
          transactions={filteredTransactions}
          monthlyBudget={monthlyBudget}
          currency={currency}
          paymentMethods={paymentMethods}
          className={commonCardClass}
          maxInsights={4}
        /> */}

        {/* Spending Health Score Card */}
        {/* <SpendingHealthCard
          transactions={filteredTransactions}
          monthlyBudget={monthlyBudget}
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
