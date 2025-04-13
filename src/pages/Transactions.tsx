
import { useState } from 'react';
import { ViewMode } from '@/components/transaction/TransactionSortAndView';
import TransactionDialog from '@/components/expense/TransactionDialog';
import TransactionDeleteDialog from '@/components/transaction/TransactionDeleteDialog';
import { useTransactionList } from '@/hooks/useTransactionList';
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

  return (
    <div className="min-h-screen">
      <div className="container max-w-7xl mx-auto pb-16">
        <TransactionHeader />
        
        <TransactionFilterControls
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          filterOptions={filterOptions}
          activeFilters={activeFilters}
          paymentMethods={paymentMethods}
          onFilterChange={handleFilterChange}
          onResetFilters={resetFilters}
          sortOption={sortOption}
          viewMode={viewMode}
          onSortChange={setSortOption}
          onViewChange={setViewMode}
        />
        
        <TransactionContent 
          isLoading={isLoading}
          transactions={transactions}
          filteredTransactions={filteredTransactions}
          paymentMethods={paymentMethods}
          viewMode={viewMode}
          sortOption={sortOption}
          onViewChange={setViewMode}
          onResetFilters={resetFilters}
          onViewTransaction={handleViewTransaction}
          onEditTransaction={handleEditTransaction}
          onDeleteTransaction={(transaction) => handleDeleteTransaction(transaction.id)}
        />
      </div>
      
      {selectedTransaction && (
        <TransactionDialog
          transaction={selectedTransaction}
          paymentMethods={paymentMethods}
          allTransactions={transactions}
          isOpen={isTransactionDialogOpen}
          mode={dialogMode === 'delete' ? 'view' : dialogMode}
          onClose={() => setIsTransactionDialogOpen(false)}
          onEdit={handleEditTransaction}
          onDelete={(transaction) => handleDeleteTransaction(transaction.id)}
          onSave={handleSaveEdit}
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
