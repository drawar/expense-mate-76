import { useState, useEffect, useMemo } from "react";
import { Transaction, PaymentMethod } from "@/types";
import { storageService } from "@/core/storage";
import { getEffectiveCategory } from "@/utils/categoryMapping";

export type SortOption =
  | "date-desc"
  | "date-asc"
  | "amount-desc"
  | "amount-asc";

export interface FilterOptions {
  paymentMethods: string[];
  dateRange: {
    from: Date | null;
    to: Date | null;
  };
  merchants: string[];
  categories: string[];
  currencies: string[];
  tags: string[]; // Tag slugs for filtering
  hasReimbursement?: boolean;
  // Add these to match what TransactionFilters is expecting
  merchantName?: string;
  paymentMethodId?: string;
  currency?: string;
  startDate?: Date | null;
  endDate?: Date | null;
}

// export interface FilterOptions {
//   merchantName: string;  // Required
//   paymentMethodId: string;  // Required
//   currency: string;  // Required
//   startDate: Date | null;  // Required
//   endDate: Date | null;  // Required
// }

export function useTransactionList() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [sortOption, setSortOption] = useState<SortOption>("date-desc");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    paymentMethods: [],
    dateRange: { from: null, to: null },
    merchants: [],
    categories: [],
    currencies: [],
    tags: [],
  });

  // Load transactions
  const loadTransactions = async () => {
    setIsLoading(true);
    try {
      const loadedTransactions = await storageService.getTransactions();
      setTransactions(loadedTransactions);

      // Include inactive payment methods so users can filter by cards they've used in the past
      const loadedPaymentMethods = await storageService.getPaymentMethods({
        includeInactive: true,
      });
      setPaymentMethods(loadedPaymentMethods);
    } catch (error) {
      console.error("Error loading transactions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh transactions
  const refreshTransactions = () => {
    loadTransactions();
  };

  // Generate filter options from transactions
  const generateFilterOptions = useMemo(() => {
    if (!transactions.length) return {};

    const paymentMethodOptions = Array.from(
      new Set(transactions.map((tx) => tx.paymentMethod.id))
    );

    const merchantOptions = Array.from(
      new Set(transactions.map((tx) => tx.merchant.name))
    );

    const categoryOptions = Array.from(
      new Set(
        transactions
          .map((tx) => getEffectiveCategory(tx) || "Uncategorized")
          .filter(Boolean)
      )
    );

    const currencyOptions = Array.from(
      new Set(transactions.map((tx) => tx.currency))
    );

    return {
      paymentMethods: paymentMethodOptions,
      merchants: merchantOptions,
      categories: categoryOptions,
      currencies: currencyOptions,
    };
  }, [transactions]);

  // Active filters count
  const activeFilters = useMemo(() => {
    const activeFiltersList: string[] = [];

    if (filterOptions.paymentMethods.length > 0)
      activeFiltersList.push("paymentMethods");
    if (filterOptions.merchants.length > 0) activeFiltersList.push("merchants");
    if (filterOptions.categories.length > 0)
      activeFiltersList.push("categories");
    if (filterOptions.currencies.length > 0)
      activeFiltersList.push("currencies");
    if (filterOptions.tags.length > 0) activeFiltersList.push("tags");
    if (filterOptions.dateRange.from || filterOptions.dateRange.to)
      activeFiltersList.push("dateRange");
    if (filterOptions.hasReimbursement)
      activeFiltersList.push("hasReimbursement");
    if (searchQuery) activeFiltersList.push("search");

    return activeFiltersList;
  }, [filterOptions, searchQuery]);

  // Apply filters and sorting
  const filteredTransactions = useMemo(() => {
    if (isLoading) return [];

    // Apply search
    let filtered = transactions;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((tx) =>
        tx.merchant.name.toLowerCase().includes(query)
      );
    }

    // Apply payment method filter
    if (filterOptions.paymentMethods.length > 0) {
      filtered = filtered.filter((tx) =>
        filterOptions.paymentMethods.includes(tx.paymentMethod.id)
      );
    }

    // Apply merchant filter
    if (filterOptions.merchants.length > 0) {
      filtered = filtered.filter((tx) =>
        filterOptions.merchants.includes(tx.merchant.name)
      );
    }

    // Apply category filter
    if (filterOptions.categories.length > 0) {
      filtered = filtered.filter((tx) =>
        filterOptions.categories.includes(
          getEffectiveCategory(tx) || "Uncategorized"
        )
      );
    }

    // Apply currency filter
    if (filterOptions.currencies.length > 0) {
      filtered = filtered.filter((tx) =>
        filterOptions.currencies.includes(tx.currency)
      );
    }

    // Apply date range filter
    if (filterOptions.dateRange.from || filterOptions.dateRange.to) {
      filtered = filtered.filter((tx) => {
        const txDate = new Date(tx.date);

        if (filterOptions.dateRange.from && filterOptions.dateRange.to) {
          return (
            txDate >= filterOptions.dateRange.from &&
            txDate <= filterOptions.dateRange.to
          );
        } else if (filterOptions.dateRange.from) {
          return txDate >= filterOptions.dateRange.from;
        } else if (filterOptions.dateRange.to) {
          return txDate <= filterOptions.dateRange.to;
        }

        return true;
      });
    }

    // Apply reimbursement filter
    if (filterOptions.hasReimbursement) {
      filtered = filtered.filter(
        (tx) => tx.reimbursementAmount && tx.reimbursementAmount > 0
      );
    }

    // Apply tags filter
    if (filterOptions.tags.length > 0) {
      filtered = filtered.filter((tx) => {
        if (!tx.tags) return false;
        const txTagSlugs = tx.tags.split(",").map((s) => s.trim());
        // Transaction must have at least one of the selected tags
        return filterOptions.tags.some((tagSlug) =>
          txTagSlugs.includes(tagSlug)
        );
      });
    }

    // Apply sorting
    return [...filtered].sort((a, b) => {
      switch (sortOption) {
        case "date-desc":
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        case "date-asc":
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        case "amount-desc":
          return b.amount - a.amount;
        case "amount-asc":
          return a.amount - b.amount;
        default:
          return 0;
      }
    });
  }, [transactions, sortOption, searchQuery, filterOptions, isLoading]);

  // Handle filter changes
  const handleFilterChange = (
    name: keyof FilterOptions,
    value: FilterOptions[keyof FilterOptions]
  ) => {
    setFilterOptions((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Reset all filters
  const resetFilters = () => {
    setFilterOptions({
      paymentMethods: [],
      dateRange: { from: null, to: null },
      merchants: [],
      categories: [],
      currencies: [],
      tags: [],
      hasReimbursement: undefined,
    });
    setSearchQuery("");
    setSortOption("date-desc");
  };

  useEffect(() => {
    loadTransactions();
  }, []);

  return {
    transactions,
    setTransactions,
    paymentMethods,
    filteredTransactions,
    sortOption,
    setSortOption,
    searchQuery,
    setSearchQuery,
    filterOptions,
    handleFilterChange,
    activeFilters,
    resetFilters,
    isLoading,
    refreshTransactions,
    availableFilters: generateFilterOptions,
  };
}
