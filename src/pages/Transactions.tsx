
import { useState } from 'react';
import { ViewMode } from '@/components/transaction/TransactionSortAndView';
import Navbar from '@/components/layout/Navbar';
import TransactionDialog from '@/components/expense/TransactionDialog';
import TransactionDeleteDialog from '@/components/transaction/TransactionDeleteDialog';
import { useTransactionList } from '@/hooks/useTransactionList';
import { useTransactionActions } from '@/hooks/useTransactionActions';
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
  } = useTransactionActions(transactions, setTransactions);

  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container max-w-6xl mx-auto pt-24 pb-20 px-4 sm:px-6">
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
          onDeleteTransaction={handleDeleteTransaction}
        />
      </main>
      
      {selectedTransaction && (
        <TransactionDialog
          transaction={selectedTransaction}
          paymentMethods={paymentMethods}
          allTransactions={transactions}
          isOpen={isTransactionDialogOpen}
          mode={dialogMode}
          onClose={() => setIsTransactionDialogOpen(false)}
          onEdit={handleEditTransaction}
          onDelete={handleDeleteTransaction}
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
