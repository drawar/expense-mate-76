// components/dashboard/cards/SpendingHealthCard.tsx
import React, { useMemo } from "react";
import {
  ActivityIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  XCircleIcon,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Transaction, Currency } from "@/types";
import { getEffectiveCategory } from "@/utils/categoryMapping";
import { getSpendingTier } from "@/utils/constants/categories";

interface SpendingHealthCardProps {
  transactions: Transaction[];
  monthlyBudget: number;
  totalSpent: number;
  currency: Currency;
  className?: string;
}

interface HealthFactor {
  label: string;
  status: "good" | "warning" | "bad";
  description: string;
}

/**
 * Calculate spending health score based on multiple factors
 */
function calculateHealthScore(
  transactions: Transaction[],
  monthlyBudget: number,
  totalSpent: number
): { score: number; factors: HealthFactor[] } {
  const factors: HealthFactor[] = [];
  let totalPoints = 0;
  let maxPoints = 0;

  // Factor 1: Budget adherence (30 points)
  maxPoints += 30;
  if (monthlyBudget > 0) {
    const budgetRatio = totalSpent / monthlyBudget;
    if (budgetRatio <= 0.9) {
      totalPoints += 30;
      factors.push({
        label: "Under budget",
        status: "good",
        description: "Spending within limits",
      });
    } else if (budgetRatio <= 1.0) {
      totalPoints += 20;
      factors.push({
        label: "Near budget",
        status: "warning",
        description: "Close to monthly limit",
      });
    } else {
      totalPoints += 0;
      factors.push({
        label: "Over budget",
        status: "bad",
        description: "Exceeded monthly limit",
      });
    }
  } else {
    totalPoints += 15; // Neutral if no budget set
    factors.push({
      label: "No budget set",
      status: "warning",
      description: "Set a budget to track better",
    });
  }

  // Factor 2: Essentials vs Lifestyle ratio (35 points)
  maxPoints += 35;
  if (transactions.length > 0) {
    let essentialsTotal = 0;
    let lifestyleTotal = 0;

    transactions.forEach((tx) => {
      const category = getEffectiveCategory(tx);
      const tier = getSpendingTier(category);
      if (tier === "Essentials") {
        essentialsTotal += tx.amount;
      } else if (tier === "Lifestyle") {
        lifestyleTotal += tx.amount;
      }
    });

    const total = essentialsTotal + lifestyleTotal;
    const lifestyleRatio = total > 0 ? lifestyleTotal / total : 0;

    if (lifestyleRatio <= 0.3) {
      totalPoints += 35;
      factors.push({
        label: "Balanced spending",
        status: "good",
        description: "Lifestyle under 30%",
      });
    } else if (lifestyleRatio <= 0.5) {
      totalPoints += 20;
      factors.push({
        label: "High discretionary",
        status: "warning",
        description: `Lifestyle at ${Math.round(lifestyleRatio * 100)}%`,
      });
    } else {
      totalPoints += 5;
      factors.push({
        label: "Very high discretionary",
        status: "bad",
        description: `Lifestyle at ${Math.round(lifestyleRatio * 100)}%`,
      });
    }
  }

  // Factor 3: Spending consistency (20 points)
  maxPoints += 20;
  if (transactions.length >= 5) {
    // Check for large outliers (transactions > 3x average)
    const amounts = transactions.map((tx) => tx.amount);
    const avg = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    const outliers = amounts.filter((a) => a > avg * 3).length;

    if (outliers === 0) {
      totalPoints += 20;
      factors.push({
        label: "Consistent spending",
        status: "good",
        description: "No unusual spikes",
      });
    } else if (outliers <= 2) {
      totalPoints += 12;
      factors.push({
        label: "Some large purchases",
        status: "warning",
        description: `${outliers} unusual transactions`,
      });
    } else {
      totalPoints += 5;
      factors.push({
        label: "Irregular spending",
        status: "bad",
        description: "Many large purchases",
      });
    }
  } else {
    totalPoints += 10;
  }

  // Factor 4: Category diversity (15 points) - not over-concentrated
  maxPoints += 15;
  if (transactions.length > 0) {
    const categoryTotals: Record<string, number> = {};
    let total = 0;
    transactions.forEach((tx) => {
      const cat = getEffectiveCategory(tx);
      categoryTotals[cat] = (categoryTotals[cat] || 0) + tx.amount;
      total += tx.amount;
    });

    const maxCategoryRatio = Math.max(
      ...Object.values(categoryTotals).map((v) => v / total)
    );

    if (maxCategoryRatio <= 0.4) {
      totalPoints += 15;
    } else if (maxCategoryRatio <= 0.6) {
      totalPoints += 10;
    } else {
      totalPoints += 5;
    }
  }

  const score =
    maxPoints > 0 ? Math.round((totalPoints / maxPoints) * 100) : 50;
  return { score, factors };
}

const SpendingHealthCard: React.FC<SpendingHealthCardProps> = ({
  transactions,
  monthlyBudget,
  totalSpent,
  currency,
  className = "",
}) => {
  const { score, factors } = useMemo(
    () => calculateHealthScore(transactions, monthlyBudget, totalSpent),
    [transactions, monthlyBudget, totalSpent]
  );

  // Determine score color and label
  const getScoreColor = () => {
    if (score >= 70) return "text-green-600 dark:text-green-400";
    if (score >= 50) return "text-amber-600 dark:text-amber-400";
    return "text-red-600 dark:text-red-400";
  };

  const getScoreLabel = () => {
    if (score >= 80) return "Excellent";
    if (score >= 70) return "Good";
    if (score >= 50) return "Fair";
    return "Needs Work";
  };

  const getStatusIcon = (status: HealthFactor["status"]) => {
    switch (status) {
      case "good":
        return <CheckCircleIcon className="h-3.5 w-3.5 text-green-500" />;
      case "warning":
        return <AlertCircleIcon className="h-3.5 w-3.5 text-amber-500" />;
      case "bad":
        return <XCircleIcon className="h-3.5 w-3.5 text-red-500" />;
    }
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-xl flex items-center gap-2">
          <ActivityIcon className="h-5 w-5 text-primary" />
          Spending Health
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Score Display */}
          <div className="flex items-center justify-between">
            <div>
              <span className={`text-4xl font-bold ${getScoreColor()}`}>
                {score}
              </span>
              <span className="text-lg text-muted-foreground">/100</span>
            </div>
            <div className={`text-sm font-medium ${getScoreColor()}`}>
              {getScoreLabel()}
            </div>
          </div>

          {/* Health Factors */}
          <div className="space-y-2">
            {factors.map((factor, idx) => (
              <div key={idx} className="flex items-center gap-2 text-sm">
                {getStatusIcon(factor.status)}
                <span className="font-medium">{factor.label}</span>
                <span className="text-muted-foreground text-xs">
                  – {factor.description}
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default React.memo(SpendingHealthCard);
