import React, { useMemo } from "react";
import "flag-icons/css/flag-icons.min.css";
import { Transaction, PaymentMethod, Currency } from "@/types";
import TransactionTable from "@/components/expense/TransactionTable";
import TransactionGroupView from "./TransactionGroupView";
import { CurrencyService } from "@/core/currency";
import { Checkbox } from "@/components/ui/checkbox";

// Currency to ISO 3166-1-alpha-2 country code mapping (lowercase)
const currencyToCountry: Record<string, string> = {
  CAD: "ca",
  USD: "us",
  SGD: "sg",
  EUR: "eu",
  GBP: "gb",
  JPY: "jp",
  AUD: "au",
  CNY: "cn",
  INR: "in",
  TWD: "tw",
  VND: "vn",
  IDR: "id",
  THB: "th",
  MYR: "my",
  HKD: "hk",
  KRW: "kr",
  PHP: "ph",
  NZD: "nz",
  CHF: "ch",
  QAR: "qa",
};

interface TransactionContentProps {
  transactions: Transaction[];
  paymentMethods: PaymentMethod[];
  onEdit: (transaction: Transaction) => void;
  onDelete: (transaction: Transaction) => void;
  onView: (transaction: Transaction) => void;
  viewMode: "table" | "group";
  sortOption: string;
  onCategoryEdit?: (transaction: Transaction) => void;
  // Currency filter props
  selectedCurrencies?: string[];
  onCurrencyFilterChange?: (currencies: string[]) => void;
  // All transactions (unfiltered) for showing complete currency breakdown
  allTransactions?: Transaction[];
}

// Summary component showing totals by currency with filter checkboxes
interface TransactionSummaryProps {
  transactions: Transaction[];
  allTransactions?: Transaction[];
  selectedCurrencies?: string[];
  onCurrencyFilterChange?: (currencies: string[]) => void;
}

const TransactionSummary: React.FC<TransactionSummaryProps> = ({
  transactions,
  allTransactions,
  selectedCurrencies = [],
  onCurrencyFilterChange,
}) => {
  // Use allTransactions for summary if provided, otherwise use filtered transactions
  const transactionsForSummary = allTransactions || transactions;

  const summaryByCurrency = useMemo(() => {
    const totals = new Map<Currency, { total: number; count: number }>();

    transactionsForSummary.forEach((tx) => {
      const current = totals.get(tx.currency) || { total: 0, count: 0 };
      totals.set(tx.currency, {
        total: current.total + tx.amount,
        count: current.count + 1,
      });
    });

    // Sort by total amount (descending) and convert to array
    return Array.from(totals.entries())
      .sort((a, b) => b[1].total - a[1].total)
      .map(([currency, { total, count }]) => ({ currency, total, count }));
  }, [transactionsForSummary]);

  const toggleCurrency = (currency: string) => {
    if (!onCurrencyFilterChange) return;

    const newSelection = selectedCurrencies.includes(currency)
      ? selectedCurrencies.filter((c) => c !== currency)
      : [...selectedCurrencies, currency];
    onCurrencyFilterChange(newSelection);
  };

  if (transactionsForSummary.length === 0 || summaryByCurrency.length === 0) {
    return null;
  }

  // Calculate displayed transaction count based on filter
  const displayedCount =
    selectedCurrencies.length > 0
      ? transactions.length
      : transactionsForSummary.length;

  return (
    <div className="mb-4 p-3 bg-muted/50 rounded-lg">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <span className="text-sm text-muted-foreground">
          {displayedCount} transaction
          {displayedCount !== 1 ? "s" : ""}:
        </span>
        {summaryByCurrency.map(({ currency, total, count }) => {
          const isSelected = selectedCurrencies.includes(currency);
          const isFilterActive = selectedCurrencies.length > 0;

          return (
            <label
              key={currency}
              className={`text-sm font-medium flex items-center gap-1.5 cursor-pointer transition-opacity ${
                isFilterActive && !isSelected ? "opacity-50" : ""
              }`}
            >
              {onCurrencyFilterChange && (
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => toggleCurrency(currency)}
                  className="h-3.5 w-3.5 rounded-none"
                />
              )}
              {currencyToCountry[currency] && (
                <span className={`fi fi-${currencyToCountry[currency]}`} />
              )}
              <span
                onClick={() =>
                  onCurrencyFilterChange && toggleCurrency(currency)
                }
              >
                {CurrencyService.format(total, currency)}
                {isFilterActive && isSelected && (
                  <span className="text-muted-foreground ml-1">({count})</span>
                )}
              </span>
            </label>
          );
        })}
        {selectedCurrencies.length > 0 && onCurrencyFilterChange && (
          <button
            onClick={() => onCurrencyFilterChange([])}
            className="text-xs text-muted-foreground hover:text-foreground underline"
          >
            Clear filter
          </button>
        )}
      </div>
    </div>
  );
};

export const TransactionContent: React.FC<TransactionContentProps> = ({
  transactions,
  paymentMethods,
  onEdit,
  onDelete,
  onView,
  viewMode,
  sortOption,
  onCategoryEdit,
  selectedCurrencies,
  onCurrencyFilterChange,
  allTransactions,
}) => {
  if (viewMode === "group") {
    return (
      <>
        <TransactionSummary
          transactions={transactions}
          allTransactions={allTransactions}
          selectedCurrencies={selectedCurrencies}
          onCurrencyFilterChange={onCurrencyFilterChange}
        />
        <TransactionGroupView
          transactions={transactions}
          sortOption={sortOption}
          onViewTransaction={onView}
        />
      </>
    );
  }

  return (
    <>
      <TransactionSummary
        transactions={transactions}
        allTransactions={allTransactions}
        selectedCurrencies={selectedCurrencies}
        onCurrencyFilterChange={onCurrencyFilterChange}
      />
      <TransactionTable
        transactions={transactions}
        paymentMethods={paymentMethods}
        onEdit={onEdit}
        onDelete={onDelete}
        onView={onView}
        onCategoryEdit={onCategoryEdit}
      />
    </>
  );
};

export default TransactionContent;
