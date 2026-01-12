import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { ViewMode } from "@/components/transaction/TransactionSortAndView";
import { TransactionDialog } from "@/components/expense/transaction/TransactionDialog";
import TransactionDeleteDialog from "@/components/transaction/TransactionDeleteDialog";
import { useTransactionList } from "@/hooks/expense/useTransactionList";
import { useTransactionManagement } from "@/hooks/useTransactionManagement";
import TransactionHeader from "@/components/transaction/TransactionHeader";
import TransactionFilterControls from "@/components/transaction/TransactionFilterControls";
import TransactionContent from "@/components/transaction/TransactionContent";
import { CategoryPicker } from "@/components/expense/transaction/CategoryPicker";
import { CategoryReviewQueue } from "@/components/expense/transaction/CategoryReviewQueue";
import { categorizationService } from "@/core/categorization";
import { storageService } from "@/core/storage/StorageService";
import { getEffectiveCategory } from "@/utils/categoryMapping";
import { Transaction } from "@/types";
import { Button } from "@/components/ui/button";
import { AlertCircle, X } from "lucide-react";
import { parseISO, startOfDay, endOfDay } from "date-fns";

const Transactions = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const {
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
  } = useTransactionList();

  // Apply URL filters on mount (date range, category, hasReimbursement)
  useEffect(() => {
    const fromParam = searchParams.get("from");
    const toParam = searchParams.get("to");
    const categoryParam = searchParams.get("category");
    const hasReimbursementParam = searchParams.get("hasReimbursement");

    let hasFilters = false;

    if (fromParam || toParam) {
      const from = fromParam ? startOfDay(parseISO(fromParam)) : null;
      const to = toParam ? endOfDay(parseISO(toParam)) : null;
      handleFilterChange("dateRange", { from, to });
      hasFilters = true;
    }

    if (categoryParam) {
      // Support multiple categories separated by comma
      const categories = categoryParam.split(",").map((c) => c.trim());
      handleFilterChange("categories", categories);
      hasFilters = true;
    }

    if (hasReimbursementParam === "true") {
      handleFilterChange("hasReimbursement", true);
      hasFilters = true;
    }

    // Clear the URL params after applying (so refresh doesn't re-apply)
    if (hasFilters) {
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams, handleFilterChange]);

  const transactionManagement = useTransactionManagement(
    transactions,
    setTransactions
  );

  const {
    selectedTransaction,
    isTransactionDialogOpen,
    setIsTransactionDialogOpen,
    dialogMode,
    deleteConfirmOpen,
    setDeleteConfirmOpen,
    transactionToDelete,
    handleViewTransaction,
    handleEditTransaction,
    handleDeleteTransaction,
    confirmDeleteTransaction,
    handleSaveEdit,
  } = transactionManagement;

  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  // Category picker state
  const [categoryPickerOpen, setCategoryPickerOpen] = useState(false);
  const [categoryEditTransaction, setCategoryEditTransaction] =
    useState<Transaction | null>(null);

  // Review queue state
  const [showReviewQueue, setShowReviewQueue] = useState(false);
  const [reviewCount, setReviewCount] = useState(0);

  // Check for transactions needing review on load
  useEffect(() => {
    const checkReviewCount = async () => {
      try {
        const needsReview =
          await categorizationService.getTransactionsNeedingReview();
        setReviewCount(needsReview.length);
      } catch (error) {
        console.error("Error checking review count:", error);
      }
    };
    checkReviewCount();
  }, [transactions]);

  // Handle opening category picker
  const handleCategoryEdit = (transaction: Transaction) => {
    setCategoryEditTransaction(transaction);
    setCategoryPickerOpen(true);
  };

  // Handle category selection with learning
  const handleCategorySelect = async (
    category: string,
    transaction: Transaction
  ) => {
    const currentCategory = getEffectiveCategory(transaction);
    const isChange = category !== currentCategory;

    try {
      // Update the transaction
      const updates: Partial<Transaction> = {
        userCategory: category,
        isRecategorized: isChange,
        needsReview: false, // Clear review flag once user selects
      };

      await storageService.updateTransaction(transaction.id, updates);

      // Record user correction for learning (if category changed)
      if (isChange) {
        await categorizationService.recordUserCorrection(
          transaction.merchant.name,
          transaction.amount,
          category
        );
      }

      // Update local state
      setTransactions((prev) =>
        prev.map((t) => (t.id === transaction.id ? { ...t, ...updates } : t))
      );

      // Update review count
      if (transaction.needsReview) {
        setReviewCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error("Error updating category:", error);
    }
  };

  // Handle review queue completion
  const handleReviewComplete = () => {
    setShowReviewQueue(false);
    setReviewCount(0);
  };

  // Handle transaction update from review queue
  const handleReviewTransactionUpdate = (updatedTransaction: Transaction) => {
    setTransactions((prev) =>
      prev.map((t) => (t.id === updatedTransaction.id ? updatedTransaction : t))
    );
    setReviewCount((prev) => Math.max(0, prev - 1));
  };

  // Get unique categories for filter dropdown
  const categories = Array.from(
    new Set(transactions.map((t) => t.category).filter(Boolean))
  );

  return (
    <div className="min-h-screen">
      <div className="container max-w-7xl mx-auto pb-16 px-4 md:px-6">
        <TransactionHeader />

        {/* Review Queue Banner */}
        {reviewCount > 0 && !showReviewQueue && (
          <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600" />
              <div>
                <p className="font-medium text-amber-800">
                  {reviewCount} transaction{reviewCount > 1 ? "s" : ""} need
                  {reviewCount === 1 ? "s" : ""} category review
                </p>
                <p className="text-sm text-amber-600">
                  Help improve auto-categorization by reviewing these
                  transactions
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="border-amber-300 text-amber-700 hover:bg-amber-100"
              onClick={() => setShowReviewQueue(true)}
            >
              Review Now
            </Button>
          </div>
        )}

        {/* Review Queue */}
        {showReviewQueue && (
          <div className="mb-6">
            <div className="flex justify-end mb-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowReviewQueue(false)}
              >
                <X className="h-4 w-4 mr-1" />
                Close
              </Button>
            </div>
            <CategoryReviewQueue
              onComplete={handleReviewComplete}
              onTransactionUpdate={handleReviewTransactionUpdate}
            />
          </div>
        )}

        <TransactionFilterControls
          filters={filterOptions}
          onFiltersChange={handleFilterChange}
          paymentMethods={paymentMethods}
          categories={categories}
          onClearFilters={resetFilters}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

        <TransactionContent
          transactions={filteredTransactions}
          paymentMethods={paymentMethods}
          onView={handleViewTransaction}
          onEdit={handleEditTransaction}
          onDelete={(transaction) => handleDeleteTransaction(transaction.id)}
          viewMode={"table"}
          sortOption={sortOption}
          onCategoryEdit={handleCategoryEdit}
          selectedCurrencies={filterOptions.currencies}
          onCurrencyFilterChange={(currencies) =>
            handleFilterChange("currencies", currencies)
          }
          allTransactions={transactions}
        />
      </div>

      {selectedTransaction && (
        <TransactionDialog
          transaction={selectedTransaction}
          paymentMethods={paymentMethods}
          isOpen={isTransactionDialogOpen}
          onClose={() => setIsTransactionDialogOpen(false)}
          onTransactionUpdated={handleSaveEdit}
          onDelete={handleDeleteTransaction}
        />
      )}

      <TransactionDeleteDialog
        isOpen={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        onConfirmDelete={confirmDeleteTransaction}
      />

      {/* Category Picker */}
      <CategoryPicker
        open={categoryPickerOpen}
        onOpenChange={setCategoryPickerOpen}
        transaction={categoryEditTransaction}
        onCategorySelect={handleCategorySelect}
      />
    </div>
  );
};

export default Transactions;
