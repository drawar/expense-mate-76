
import { useState } from 'react';
import { ViewMode } from '@/components/transaction/TransactionSortAndView';
import { useTransactionList } from '@/hooks/useTransactionList';
import { useTransactionActions } from '@/hooks/useTransactionActions';
import TransactionHeader from '@/components/transaction/TransactionHeader';
import TransactionContent from '@/components/transaction/TransactionContent';
import TransactionLayout from '@/components/transaction/layout/TransactionLayout';
import TransactionFiltersContainer from '@/components/transaction/container/TransactionFiltersContainer';
import TransactionDialogsContainer from '@/components/transaction/container/TransactionDialogsContainer';
import { SortOption } from '@/hooks/transaction-list/types';

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

  const handleSortChange = (sort: string) => {
    setSortOption(sort as SortOption);
  };

  return (
    <TransactionLayout>
      <TransactionHeader />
      
      <TransactionFiltersContainer
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        filterOptions={filterOptions}
        activeFilters={activeFilters}
        paymentMethods={paymentMethods}
        onFilterChange={handleFilterChange}
        onResetFilters={resetFilters}
        sortOption={sortOption}
        viewMode={viewMode}
        onSortChange={handleSortChange}
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
      
      <TransactionDialogsContainer 
        selectedTransaction={selectedTransaction}
        isTransactionDialogOpen={isTransactionDialogOpen}
        setIsTransactionDialogOpen={setIsTransactionDialogOpen}
        dialogMode={dialogMode}
        deleteConfirmOpen={deleteConfirmOpen}
        setDeleteConfirmOpen={setDeleteConfirmOpen}
        transactions={transactions}
        paymentMethods={paymentMethods}
        onEdit={handleEditTransaction}
        onDelete={handleDeleteTransaction}
        onSave={handleSaveEdit}
        onConfirmDelete={confirmDeleteTransaction}
      />
    </TransactionLayout>
  );
};

export default Transactions;
