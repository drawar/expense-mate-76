// components/dashboard/cards/RecentTransactionsCard.tsx
/**
 * Recent Transactions Card with category icons
 * Standalone card showing recent transactions as a flat list
 */

import React, { useCallback, useState } from "react";
import { Link } from "react-router-dom";
import { parseISO, format } from "date-fns";
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
import { TransactionDialog } from "@/components/expense/transaction/TransactionDialog";
import TransactionDeleteDialog from "@/components/transaction/TransactionDeleteDialog";
import { useTransactionActions } from "@/hooks/expense/useTransactionActions";

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

interface RecentTransactionsCardProps {
  transactions: Transaction[];
  allTransactions?: Transaction[];
  displayCurrency: Currency;
  paymentMethods?: PaymentMethod[];
  maxItems?: number;
  className?: string;
}

/**
 * Format date as "Mmm DD, YYYY" (e.g., "Jan 21, 2024")
 */
function formatTransactionDate(date: Date | string): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "MMM dd, yyyy");
}

/**
 * Format merchant name
 */
function formatMerchantName(merchant: { name: string }): string {
  const name = merchant.name?.trim() || "";
  const lowerName = name.toLowerCase();

  if (
    !name ||
    lowerName === "unknown" ||
    lowerName === "unknown merchant" ||
    lowerName.startsWith("unknown ") ||
    lowerName === "n/a" ||
    lowerName === "na"
  ) {
    return "Card Purchase";
  }

  return name;
}

const RecentTransactionsCard: React.FC<RecentTransactionsCardProps> = ({
  transactions,
  allTransactions,
  displayCurrency,
  paymentMethods = [],
  maxItems = 5,
  className = "",
}) => {
  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaction | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<string | null>(
    null
  );

  const { handleDelete } = useTransactionActions();
  const txList = allTransactions || transactions;

  // Get the most recent transactions (already sorted by date)
  const displayTransactions = transactions.slice(0, maxItems);

  // Handle transaction click
  const handleTransactionClick = useCallback((tx: Transaction) => {
    setSelectedTransaction(tx);
  }, []);

  // Handle delete
  const handleDeleteTransaction = useCallback((transactionId: string) => {
    setTransactionToDelete(transactionId);
    setDeleteConfirmOpen(true);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (transactionToDelete) {
      const tx = txList.find((t) => t.id === transactionToDelete);
      if (tx) {
        await handleDelete(tx);
      }
      setDeleteConfirmOpen(false);
      setTransactionToDelete(null);
      setSelectedTransaction(null);
    }
  }, [transactionToDelete, txList, handleDelete]);

  return (
    <Card className={`rounded-xl border border-border/50 bg-card ${className}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Recent Transactions</CardTitle>
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
        {displayTransactions.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            No recent transactions
          </p>
        ) : (
          <div className="space-y-1">
            {displayTransactions.map((tx) => (
              <button
                key={tx.id}
                onClick={() => handleTransactionClick(tx)}
                className="w-full flex items-center justify-between py-2 px-2 rounded-lg hover:bg-muted/50 transition-colors text-left"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{
                      backgroundColor: getCategoryBgColor(
                        getEffectiveCategory(tx) || "Other"
                      ),
                    }}
                  >
                    <CategoryIcon
                      iconName={
                        getCategoryIcon(
                          getEffectiveCategory(tx) || "Other"
                        ) as CategoryIconName
                      }
                      size={16}
                      className="text-foreground"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium truncate">
                      {formatMerchantName(tx.merchant)}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {getEffectiveCategory(tx) || "Other"}
                    </p>
                  </div>
                </div>
                <div className="text-right ml-4">
                  <p className="font-medium">
                    {CurrencyService.format(tx.amount, tx.currency)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatTransactionDate(tx.date)}
                  </p>
                </div>
                <ChevronRightIcon className="h-4 w-4 text-muted-foreground ml-2" />
              </button>
            ))}
          </div>
        )}
      </CardContent>

      {/* Transaction Dialog */}
      <TransactionDialog
        transaction={selectedTransaction}
        paymentMethods={paymentMethods}
        isOpen={selectedTransaction !== null}
        onClose={() => setSelectedTransaction(null)}
        onTransactionUpdated={(updated) => setSelectedTransaction(updated)}
        onDelete={handleDeleteTransaction}
      />

      <TransactionDeleteDialog
        isOpen={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        onConfirmDelete={confirmDelete}
      />
    </Card>
  );
};

export default React.memo(RecentTransactionsCard);
