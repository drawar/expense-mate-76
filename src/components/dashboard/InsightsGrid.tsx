
// src/components/dashboard/InsightsGrid.tsx
import React from "react";
import { useDashboardContext } from "@/contexts/DashboardContext";
import SpendingTrendCard from "@/components/dashboard/cards/SpendingTrendCard";
import CardOptimizationCard from "@/components/dashboard/cards/CardOptimizationCard";
import SavingsPotentialCard from "@/components/dashboard/cards/SavingsPotentialCard";
import UnusualSpendingCard from "@/components/dashboard/cards/UnusualSpendingCard";
import SpendingDistributionCard from "@/components/dashboard/cards/SpendingDistributionCard";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { EmptyState } from "./EmptyState";
import { BarChartIcon } from "lucide-react";

/**
 * Grid component that displays financial insights using domain-specific cards
 * Uses the Dashboard context instead of props
 */
const InsightsGrid: React.FC = () => {
  const { dashboardData, paymentMethods, displayCurrency } =
    useDashboardContext();

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

  // Memoize common class to prevent recreation on every render
  const commonCardClass = React.useMemo(
    () =>
      "rounded-xl border border-border/50 bg-card hover:shadow-md transition-all",
    []
  );

  // Early return for empty data state
  if (!hasData) {
    return (
      <div className="my-6 space-y-6">
        <h2 className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-[#6366f1] to-[#a855f7]">
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
      <h2 className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-[#6366f1] to-[#a855f7]">
        Financial Insights
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Combined Spending Distribution Card */}
        <SpendingDistributionCard
          categoryData={charts.categories}
          paymentMethodData={charts.paymentMethods}
          currency={displayCurrency}
          className={commonCardClass}
          maxCategories={7}
          highlightTopMethod={true}
        />

        {/* Unusual Spending Card */}
        <UnusualSpendingCard
          transactions={filteredTransactions}
          currency={displayCurrency}
          className={commonCardClass}
          maxDisplayedAnomalies={isMobile ? 2 : 3}
        />

        {/* Spending Trends Card */}
        <SpendingTrendCard
          transactions={filteredTransactions}
          currency={displayCurrency}
          className={commonCardClass}
          initialPeriod="day"
        />

        {/* Container for optimization cards */}
        <div
          className={`grid grid-cols-1 gap-4 ${isMobile ? "" : "col-span-1"}`}
        >
          <div className="grid grid-cols-1 gap-4">
            {/* Card Optimization Card */}
            <CardOptimizationCard
              title="Card Optimization"
              transactions={filteredTransactions}
              paymentMethods={paymentMethods}
              currency={displayCurrency}
              className={commonCardClass}
            />

            {/* Savings Potential Card */}
            <SavingsPotentialCard
              title="Savings Potential"
              transactions={filteredTransactions}
              savingsGoalPercentage={20}
              currency={displayCurrency}
              className={commonCardClass}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(InsightsGrid);
