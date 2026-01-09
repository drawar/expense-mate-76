import React, { useMemo } from "react";
import "flag-icons/css/flag-icons.min.css";
import { Transaction, PaymentMethod, Currency } from "@/types";
import TransactionTable from "@/components/expense/TransactionTable";
import TransactionGroupView from "./TransactionGroupView";
import { CurrencyService } from "@/core/currency";

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
}

// Summary component showing totals by currency
const TransactionSummary: React.FC<{ transactions: Transaction[] }> = ({
  transactions,
}) => {
  const summaryByCurrency = useMemo(() => {
    const totals = new Map<Currency, number>();

    transactions.forEach((tx) => {
      const current = totals.get(tx.currency) || 0;
      totals.set(tx.currency, current + tx.amount);
    });

    // Sort by total amount (descending) and convert to array
    return Array.from(totals.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([currency, total]) => ({ currency, total }));
  }, [transactions]);

  if (transactions.length === 0 || summaryByCurrency.length === 0) {
    return null;
  }

  return (
    <div className="mb-4 p-3 bg-muted/50 rounded-lg">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        <span className="text-sm text-muted-foreground">
          {transactions.length} transaction
          {transactions.length !== 1 ? "s" : ""}:
        </span>
        {summaryByCurrency.map(({ currency, total }) => (
          <span
            key={currency}
            className="text-sm font-medium flex items-center gap-1"
          >
            {currencyToCountry[currency] && (
              <span className={`fi fi-${currencyToCountry[currency]}`} />
            )}
            {CurrencyService.format(total, currency)}
          </span>
        ))}
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
}) => {
  if (viewMode === "group") {
    return (
      <>
        <TransactionSummary transactions={transactions} />
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
      <TransactionSummary transactions={transactions} />
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
