// components/dashboard/cards/TopMerchantsCard.tsx
/**
 * Top Merchants Card showing total spend by merchant
 * Same styling as RecentTransactionsCard with category icons
 */

import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  format,
  startOfMonth,
  endOfMonth,
  subMonths,
  startOfYear,
  endOfYear,
} from "date-fns";
import { Transaction, Currency, PaymentMethod } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronRightIcon, ArrowRightIcon } from "lucide-react";
import { getEffectiveCategory } from "@/utils/categoryMapping";
import {
  getCategoryIcon,
  getParentCategory,
} from "@/utils/constants/categories";
import { CategoryIcon, type CategoryIconName } from "@/utils/constants/icons";
import { CurrencyService } from "@/core/currency";
import { useDashboardContext } from "@/contexts/DashboardContext";

// Category colors for icon backgrounds (50% opacity)
const CATEGORY_HEX_COLORS: Record<string, string> = {
  essentials: "#073B4C",
  lifestyle: "#FFD166",
  home_living: "#118AB2",
  personal_care: "#EF476F",
  work_education: "#06D6A0",
  financial_other: "#F78C6B",
};

function getCategoryBgColor(categoryName: string): string {
  const parent = getParentCategory(categoryName);
  const hex = parent ? CATEGORY_HEX_COLORS[parent.id] : "#6b7280";
  if (!hex) return "rgba(107, 114, 128, 0.5)";
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return "rgba(107, 114, 128, 0.5)";
  const r = parseInt(result[1], 16);
  const g = parseInt(result[2], 16);
  const b = parseInt(result[3], 16);
  return `rgba(${r}, ${g}, ${b}, 0.5)`;
}

interface TopMerchantsCardProps {
  transactions: Transaction[];
  allTransactions?: Transaction[];
  displayCurrency: Currency;
  paymentMethods?: PaymentMethod[];
  maxItems?: number;
  className?: string;
}

interface MerchantSpend {
  name: string;
  category: string;
  totalSpend: number;
  transactionCount: number;
  currency: Currency;
  sampleTransaction: Transaction;
}

/**
 * Format merchant name
 */
function formatMerchantName(name: string): string {
  const trimmed = name?.trim() || "";
  const lowerName = trimmed.toLowerCase();

  if (
    !trimmed ||
    lowerName === "unknown" ||
    lowerName === "unknown merchant" ||
    lowerName.startsWith("unknown ") ||
    lowerName === "n/a" ||
    lowerName === "na"
  ) {
    return "Card Purchase";
  }

  return trimmed;
}

const TopMerchantsCard: React.FC<TopMerchantsCardProps> = ({
  transactions,
  displayCurrency,
  maxItems = 5,
  className = "",
}) => {
  const { activeTab } = useDashboardContext();

  // Calculate date range based on active time filter
  const dateRange = useMemo(() => {
    const now = new Date();
    let start: Date;
    let end: Date;

    switch (activeTab) {
      case "thisMonth":
        start = startOfMonth(now);
        end = endOfMonth(now);
        break;
      case "lastMonth":
        start = startOfMonth(subMonths(now, 1));
        end = endOfMonth(subMonths(now, 1));
        break;
      case "lastTwoMonths":
        start = startOfMonth(subMonths(now, 1));
        end = endOfMonth(now);
        break;
      case "lastThreeMonths":
        start = startOfMonth(subMonths(now, 2));
        end = endOfMonth(now);
        break;
      case "lastSixMonths":
        start = startOfMonth(subMonths(now, 5));
        end = endOfMonth(now);
        break;
      case "thisYear":
        start = startOfYear(now);
        end = endOfYear(now);
        break;
      default:
        start = startOfMonth(now);
        end = endOfMonth(now);
    }

    return {
      from: format(start, "yyyy-MM-dd"),
      to: format(end, "yyyy-MM-dd"),
    };
  }, [activeTab]);

  // Aggregate spending by merchant
  const topMerchants = useMemo((): MerchantSpend[] => {
    const merchantMap = new Map<string, MerchantSpend>();

    transactions.forEach((tx) => {
      const merchantName = tx.merchant?.name?.trim() || "Unknown";
      if (merchantName.toLowerCase() === "unknown") return;

      const existing = merchantMap.get(merchantName);
      const grossAmount = CurrencyService.convert(
        tx.paymentAmount ?? tx.amount,
        tx.paymentCurrency ?? tx.currency,
        displayCurrency
      );
      const reimbursed = tx.reimbursementAmount
        ? CurrencyService.convert(
            tx.reimbursementAmount,
            tx.paymentCurrency ?? tx.currency,
            displayCurrency
          )
        : 0;
      const amount = grossAmount - reimbursed;

      if (existing) {
        existing.totalSpend += amount;
        existing.transactionCount++;
      } else {
        merchantMap.set(merchantName, {
          name: merchantName,
          category: getEffectiveCategory(tx) || "Other",
          totalSpend: amount,
          transactionCount: 1,
          currency: displayCurrency,
          sampleTransaction: tx,
        });
      }
    });

    return Array.from(merchantMap.values())
      .sort((a, b) => b.totalSpend - a.totalSpend)
      .slice(0, maxItems);
  }, [transactions, displayCurrency, maxItems]);

  return (
    <Card className={`rounded-xl border border-border/50 bg-card ${className}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Top Merchants</CardTitle>
          <Link
            to="/transactions"
            className="group flex items-center gap-1 text-sm text-primary"
          >
            <span className="relative">
              View All
              <span className="absolute left-0 bottom-0 w-0 h-[1px] bg-primary transition-all duration-300 group-hover:w-full" />
            </span>
            <ArrowRightIcon className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>
        </div>
      </CardHeader>

      <CardContent>
        {topMerchants.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            No merchant data available
          </p>
        ) : (
          <div className="space-y-1">
            {topMerchants.map((merchant) => (
              <Link
                key={merchant.name}
                to={`/transactions?from=${dateRange.from}&to=${dateRange.to}&merchant=${encodeURIComponent(merchant.name)}`}
                className="w-full flex items-center justify-between py-2 px-2 rounded-lg hover:bg-muted/50 transition-colors text-left"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{
                      backgroundColor: getCategoryBgColor(merchant.category),
                    }}
                  >
                    <CategoryIcon
                      iconName={
                        getCategoryIcon(merchant.category) as CategoryIconName
                      }
                      size={16}
                      className="text-foreground"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium truncate">
                      {formatMerchantName(merchant.name)}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {merchant.category}
                    </p>
                  </div>
                </div>
                <div className="text-right ml-4">
                  <p className="font-medium">
                    {CurrencyService.format(
                      merchant.totalSpend,
                      merchant.currency
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {merchant.transactionCount}{" "}
                    {merchant.transactionCount === 1
                      ? "transaction"
                      : "transactions"}
                  </p>
                </div>
                <ChevronRightIcon className="h-4 w-4 text-muted-foreground ml-2" />
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default React.memo(TopMerchantsCard);
