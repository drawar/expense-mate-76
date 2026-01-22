// components/dashboard/cards/MoneyFlowSankey.tsx
/**
 * Sankey diagram showing money flow from income to expenses
 * Consolidates budget, spending, income, and reimbursements into one visualization
 */

import React, { useMemo } from "react";
import { ResponsiveSankey } from "@nivo/sankey";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Currency, Transaction } from "@/types";
import { useCurrencyFormatter } from "@/hooks/useCurrencyFormatter";
import { useRecurringIncome } from "@/hooks/useRecurringIncome";
import { useDashboardContext } from "@/contexts/DashboardContext";
import { useBudget } from "@/hooks/useBudget";
import {
  buildCategoryHierarchy,
  ParentCategorySpending,
} from "@/utils/dashboard/categoryHierarchy";
import { ArrowRightLeftIcon } from "lucide-react";

interface MoneyFlowSankeyProps {
  transactions: Transaction[];
  className?: string;
}

interface SankeyNode {
  id: string;
  nodeColor?: string;
}

interface SankeyLink {
  source: string;
  target: string;
  value: number;
}

// Category colors from the hierarchy
const CATEGORY_COLORS: Record<string, string> = {
  Lifestyle: "#E5A84B",
  Essentials: "#9B8BB8",
  "Home & Living": "#7BA3A8",
  "Financial & Other": "#E8B89D",
  Transportation: "#7BA3A8",
  Shopping: "#E5A84B",
  "Food & Dining": "#E8B89D",
};

const MoneyFlowSankey: React.FC<MoneyFlowSankeyProps> = ({
  transactions,
  className = "",
}) => {
  const { displayCurrency, activeTab, dashboardData } = useDashboardContext();
  const { formatCurrency } = useCurrencyFormatter(displayCurrency);
  const { totalIncome, incomeSources } = useRecurringIncome(
    displayCurrency,
    activeTab
  );
  const { scaledBudget } = useBudget(displayCurrency, activeTab);

  // Get metrics
  const metrics = dashboardData?.metrics || {
    totalExpenses: 0,
    totalReimbursed: 0,
  };
  const grossExpenses = metrics.totalExpenses || 0; // Total spending before reimbursements
  const totalReimbursed = metrics.totalReimbursed || 0;
  const netExpenses = grossExpenses - totalReimbursed;

  // Build category hierarchy
  const hierarchyData = useMemo(
    () => buildCategoryHierarchy(transactions, displayCurrency),
    [transactions, displayCurrency]
  );

  // Build Sankey data
  const sankeyData = useMemo(() => {
    const nodes: SankeyNode[] = [];
    const links: SankeyLink[] = [];

    // Only show if we have income or expenses
    if (totalIncome === 0 && grossExpenses === 0) {
      return { nodes: [], links: [] };
    }

    // Total inflows = income + reimbursements
    const totalInflows = totalIncome + totalReimbursed;

    // Calculate savings (income - net expenses, i.e. what's left after all spending minus reimbursements)
    const savings =
      totalIncome > 0 ? Math.max(0, totalIncome - netExpenses) : 0;

    // === LEFT SIDE: Inflows ===

    // Add income source(s)
    if (totalIncome > 0) {
      if (incomeSources.length <= 3 && incomeSources.length > 0) {
        incomeSources.forEach((source) => {
          nodes.push({ id: source.name, nodeColor: "#4CAF50" });
          links.push({
            source: source.name,
            target: "Total Inflows",
            value: source.scaledAmount,
          });
        });
      } else if (totalIncome > 0) {
        nodes.push({ id: "Income", nodeColor: "#4CAF50" });
        links.push({
          source: "Income",
          target: "Total Inflows",
          value: totalIncome,
        });
      }
    }

    // Add reimbursements as inflow
    if (totalReimbursed > 0) {
      nodes.push({ id: "Reimbursed", nodeColor: "#26A69A" });
      links.push({
        source: "Reimbursed",
        target: "Total Inflows",
        value: totalReimbursed,
      });
    }

    // === MIDDLE: Total Inflows hub ===
    if (totalInflows > 0) {
      nodes.push({ id: "Total Inflows", nodeColor: "#66BB6A" });
    }

    // === MIDDLE-RIGHT: Spending and Savings ===

    // Add gross spending node (spending before reimbursements)
    if (grossExpenses > 0) {
      nodes.push({ id: "Spending", nodeColor: "#FF7043" });

      // Link inflows to spending
      if (totalInflows > 0) {
        links.push({
          source: "Total Inflows",
          target: "Spending",
          value: grossExpenses,
        });
      }

      // === RIGHT SIDE: Categories ===
      const topCategories = hierarchyData.categories.slice(0, 6);
      topCategories.forEach((category: ParentCategorySpending) => {
        if (category.amount > 0) {
          nodes.push({
            id: category.name,
            nodeColor:
              category.color || CATEGORY_COLORS[category.name] || "#9E9E9E",
          });
          links.push({
            source: "Spending",
            target: category.name,
            value: category.amount,
          });
        }
      });

      // Add "Other" category if there are more
      const otherAmount = hierarchyData.categories
        .slice(6)
        .reduce(
          (sum: number, cat: ParentCategorySpending) => sum + cat.amount,
          0
        );
      if (otherAmount > 0) {
        nodes.push({ id: "Other", nodeColor: "#9E9E9E" });
        links.push({
          source: "Spending",
          target: "Other",
          value: otherAmount,
        });
      }
    }

    // Link inflows to savings if positive
    if (savings > 0 && totalInflows > 0) {
      nodes.push({ id: "Savings", nodeColor: "#29B6F6" });
      links.push({
        source: "Total Inflows",
        target: "Savings",
        value: savings,
      });
    }

    return { nodes, links };
  }, [
    totalIncome,
    incomeSources,
    grossExpenses,
    netExpenses,
    totalReimbursed,
    hierarchyData,
  ]);

  // Don't render if no data
  if (sankeyData.nodes.length === 0 || sankeyData.links.length === 0) {
    return null;
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-xl flex items-center gap-2">
          <ArrowRightLeftIcon className="h-5 w-5 text-primary" />
          Money Flow
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-72">
          <ResponsiveSankey
            data={sankeyData}
            margin={{ top: 10, right: 140, bottom: 10, left: 10 }}
            align="justify"
            colors={(node) => node.nodeColor || "#888"}
            nodeOpacity={1}
            nodeHoverOpacity={1}
            nodeThickness={18}
            nodeSpacing={16}
            nodeBorderWidth={0}
            nodeBorderRadius={3}
            linkOpacity={0.3}
            linkHoverOpacity={0.6}
            linkContract={3}
            enableLinkGradient={true}
            labelPosition="outside"
            labelOrientation="horizontal"
            labelPadding={12}
            labelTextColor={{
              from: "color",
              modifiers: [["darker", 1]],
            }}
            label={(node) => `${node.id} ${formatCurrency(node.value)}`}
            nodeTooltip={({ node }) => (
              <div className="bg-popover text-popover-foreground px-3 py-2 rounded-md shadow-md border text-sm">
                <strong>{node.id}</strong>
                <br />
                {formatCurrency(node.value)}
              </div>
            )}
            linkTooltip={({ link }) => (
              <div className="bg-popover text-popover-foreground px-3 py-2 rounded-md shadow-md border text-sm">
                {link.source.id} → {link.target.id}
                <br />
                <strong>{formatCurrency(link.value)}</strong>
              </div>
            )}
          />
        </div>

        {/* Hero metrics row */}
        <div className="flex items-center justify-around pt-6 border-t border-border/50 mt-4">
          {totalIncome > 0 && (
            <div className="text-center">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Income
              </p>
              <p className="text-3xl font-bold text-[var(--color-success)]">
                {formatCurrency(totalIncome)}
              </p>
            </div>
          )}
          {totalReimbursed > 0 && (
            <div className="text-center">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Reimbursed
              </p>
              <p className="text-3xl font-bold text-[var(--color-success)]">
                {formatCurrency(totalReimbursed)}
              </p>
            </div>
          )}
          <div className="text-center">
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Gross Spent
            </p>
            <p className="text-3xl font-bold text-[var(--color-error)]">
              {formatCurrency(grossExpenses)}
            </p>
          </div>
          {totalIncome > netExpenses && totalIncome > 0 && (
            <div className="text-center">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Saved
              </p>
              <p className="text-3xl font-bold text-primary">
                {formatCurrency(totalIncome - netExpenses)}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default React.memo(MoneyFlowSankey);
