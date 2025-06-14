
import { useState } from 'react';
import { ViewMode } from '@/components/transaction/TransactionSortAndView';
import { TransactionDialog } from '@/components/expense/transaction/TransactionDialog';
import TransactionDeleteDialog from '@/components/transaction/TransactionDeleteDialog';
import { useTransactionList } from '@/hooks/expense/useTransactionList';
import { useTransactionManagement } from '@/hooks/useTransactionManagement';
import TransactionHeader from '@/components/transaction/TransactionHeader';
import TransactionFilterControls from '@/components/transaction/TransactionFilterControls';
import TransactionContent from '@/components/transaction/TransactionContent';

const Transactions = () => {
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
    isLoading
  } = useTransactionList();

  const transactionManagement = useTransactionManagement(transactions, setTransactions);
  
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
    handleSaveEdit
  } = transactionManagement;

  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  // Get unique categories for filter dropdown
  const categories = Array.from(
    new Set(
      transactions
        .map(t => t.category)
        .filter(Boolean)
    )
  );

  return (
    <div className="min-h-screen">
      <div className="container max-w-7xl mx-auto pb-16">
        <TransactionHeader />
        
        <TransactionFilterControls
          filters={filterOptions}
          onFiltersChange={handleFilterChange}
          paymentMethods={paymentMethods}
          categories={categories}
          onClearFilters={resetFilters}
        />
        
        <TransactionContent 
          transactions={filteredTransactions}
          paymentMethods={paymentMethods}
          onView={handleViewTransaction}
          onEdit={handleEditTransaction}
          onDelete={(transaction) => handleDeleteTransaction(transaction.id)}
          viewMode={'table'}
          sortOption={sortOption}
        />
      </div>
      
      {selectedTransaction && (
        <TransactionDialog
          transaction={selectedTransaction}
          paymentMethods={paymentMethods}
          isOpen={isTransactionDialogOpen}
          onClose={() => setIsTransactionDialogOpen(false)}
          onTransactionUpdated={handleSaveEdit}
        />
      )}
      
      <TransactionDeleteDialog
        isOpen={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        onConfirmDelete={confirmDeleteTransaction}
      />
    </div>
  );
};

export default Transactions;
