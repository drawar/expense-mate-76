// components/dashboard/cards/MoneyFlowSankey.tsx
/**
 * Sankey diagram showing money flow from income to expenses
 * Consolidates budget, spending, income, and reimbursements into one visualization
 */

import React, { useMemo, useEffect, useState } from "react";
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

// Category colors - Vibrant Palette
const CATEGORY_COLORS: Record<string, string> = {
  Essentials: "#073B4C", // Dark Teal
  Lifestyle: "#FFD166", // Golden Pollen
  "Home & Living": "#118AB2", // Ocean Blue
  "Personal Care": "#EF476F", // Bubblegum Pink
  "Work & Education": "#06D6A0", // Emerald
  "Financial & Other": "#F78C6B", // Coral Glow
  // Legacy mappings
  Transportation: "#073B4C",
  Shopping: "#FFD166",
  "Food & Dining": "#FFD166",
};

// Same colors for dark mode (vibrant palette works in both)
const CATEGORY_COLORS_DARK: Record<string, string> = {
  Essentials: "#073B4C", // Dark Teal
  Lifestyle: "#FFD166", // Golden Pollen
  "Home & Living": "#118AB2", // Ocean Blue
  "Personal Care": "#EF476F", // Bubblegum Pink
  "Work & Education": "#06D6A0", // Emerald
  "Financial & Other": "#F78C6B", // Coral Glow
  // Legacy mappings
  Transportation: "#073B4C",
  Shopping: "#FFD166",
  "Food & Dining": "#FFD166",
};

// Japandi node colors for dark mode
const NODE_COLORS_DARK: Record<string, string> = {
  Income: "#9BB596", // muted sage
  Reimbursed: "#7BA3A0", // dusty teal
  "Total Inflows": "#A8C4A2", // soft green
  Spending: "#C4836A", // terracotta
  Savings: "#8AABBF", // dusty blue
  Other: "#A8A8A8",
};

const MoneyFlowSankey: React.FC<MoneyFlowSankeyProps> = ({
  transactions,
  className = "",
}) => {
  const { displayCurrency, activeTab, dashboardData } = useDashboardContext();

  // Detect dark mode for label colors
  const [isDarkMode, setIsDarkMode] = useState(false);
  useEffect(() => {
    const checkDarkMode = () => {
      setIsDarkMode(document.documentElement.classList.contains("dark"));
    };
    checkDarkMode();
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);
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

    // Helper to get node color based on dark mode
    const getNodeColor = (id: string, defaultLight: string) => {
      if (isDarkMode && NODE_COLORS_DARK[id]) {
        return NODE_COLORS_DARK[id];
      }
      return defaultLight;
    };

    const getCategoryColor = (name: string, fallbackColor?: string) => {
      if (isDarkMode) {
        return CATEGORY_COLORS_DARK[name] || fallbackColor || "#BDBDBD";
      }
      return CATEGORY_COLORS[name] || fallbackColor || "#9E9E9E";
    };

    // === LEFT SIDE: Inflows ===

    // Add income source(s)
    if (totalIncome > 0) {
      if (incomeSources.length <= 3 && incomeSources.length > 0) {
        incomeSources.forEach((source) => {
          nodes.push({
            id: source.name,
            nodeColor: getNodeColor("Income", "#4CAF50"),
          });
          links.push({
            source: source.name,
            target: "Total Inflows",
            value: source.scaledAmount,
          });
        });
      } else if (totalIncome > 0) {
        nodes.push({
          id: "Income",
          nodeColor: getNodeColor("Income", "#4CAF50"),
        });
        links.push({
          source: "Income",
          target: "Total Inflows",
          value: totalIncome,
        });
      }
    }

    // Add reimbursements as inflow
    if (totalReimbursed > 0) {
      nodes.push({
        id: "Reimbursed",
        nodeColor: getNodeColor("Reimbursed", "#26A69A"),
      });
      links.push({
        source: "Reimbursed",
        target: "Total Inflows",
        value: totalReimbursed,
      });
    }

    // === MIDDLE: Total Inflows hub ===
    if (totalInflows > 0) {
      nodes.push({
        id: "Total Inflows",
        nodeColor: getNodeColor("Total Inflows", "#66BB6A"),
      });
    }

    // === MIDDLE-RIGHT: Spending and Savings ===

    // Add gross spending node (spending before reimbursements)
    if (grossExpenses > 0) {
      nodes.push({
        id: "Spending",
        nodeColor: getNodeColor("Spending", "#FF7043"),
      });

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
            nodeColor: getCategoryColor(category.name, category.color),
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
        nodes.push({
          id: "Other",
          nodeColor: getNodeColor("Other", "#9E9E9E"),
        });
        links.push({
          source: "Spending",
          target: "Other",
          value: otherAmount,
        });
      }
    }

    // Link inflows to savings if positive
    if (savings > 0 && totalInflows > 0) {
      nodes.push({
        id: "Savings",
        nodeColor: getNodeColor("Savings", "#29B6F6"),
      });
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
    isDarkMode,
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
            margin={{ top: 10, right: 220, bottom: 10, left: 200 }}
            align="justify"
            colors={(node) => node.nodeColor || "#888"}
            nodeOpacity={1}
            nodeHoverOpacity={1}
            nodeThickness={18}
            nodeSpacing={16}
            nodeBorderWidth={0}
            nodeBorderRadius={3}
            linkOpacity={isDarkMode ? 0.5 : 0.3}
            linkHoverOpacity={isDarkMode ? 0.7 : 0.6}
            linkContract={3}
            linkBlendMode={isDarkMode ? "screen" : "normal"}
            enableLinkGradient={true}
            labelPosition="outside"
            labelOrientation="horizontal"
            labelPadding={12}
            labelTextColor={isDarkMode ? "#e5e5e5" : "#374151"}
            theme={{
              labels: {
                text: {
                  fontSize: 13,
                  fontWeight: 500,
                },
              },
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
      </CardContent>
    </Card>
  );
};

export default React.memo(MoneyFlowSankey);
