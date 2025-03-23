import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Transaction } from '@/types';
import { getTransactions, getPaymentMethods, deleteTransaction, editTransaction } from '@/utils/storageUtils';
import Navbar from '@/components/layout/Navbar';
import TransactionDialog from '@/components/expense/TransactionDialog';
import { PlusCircleIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';

import TransactionSearchBar from '@/components/transaction/TransactionSearchBar';
import TransactionFilters, { FilterOptions } from '@/components/transaction/TransactionFilters';
import TransactionSortAndView, { SortOption, ViewMode } from '@/components/transaction/TransactionSortAndView';
import TransactionGroupView from '@/components/transaction/TransactionGroupView';
import TransactionTable from '@/components/expense/TransactionTable';
import TransactionDeleteDialog from '@/components/transaction/TransactionDeleteDialog';
import TransactionEmptyState from '@/components/transaction/TransactionEmptyState';

const Transactions = () => {
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [sortOption, setSortOption] = useState<SortOption>('date-desc');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    merchantName: '',
    paymentMethodId: '',
    currency: '',
    startDate: '',
    endDate: '',
  });
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [isTransactionDialogOpen, setIsTransactionDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'view' | 'edit'>('view');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);
  
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const loadedTransactions = await getTransactions();
        const loadedPaymentMethods = await getPaymentMethods();
        
        setTransactions(loadedTransactions);
        setPaymentMethods(loadedPaymentMethods);
      } catch (error) {
        console.error('Error loading data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load transaction data',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
    
    const channel = supabase
      .channel('public:transactions')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'transactions'
      }, async () => {
        const updatedTransactions = await getTransactions();
        setTransactions(updatedTransactions);
      })
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [toast]);
  
  useEffect(() => {
    let filtered = [...transactions];
    
    if (searchQuery) {
      filtered = filtered.filter(tx => 
        tx.merchant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.notes?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    if (filterOptions.merchantName) {
      filtered = filtered.filter(tx => 
        tx.merchant.name.toLowerCase().includes(filterOptions.merchantName.toLowerCase())
      );
    }
    
    if (filterOptions.paymentMethodId) {
      filtered = filtered.filter(tx => 
        tx.paymentMethod.id === filterOptions.paymentMethodId
      );
    }
    
    if (filterOptions.currency) {
      filtered = filtered.filter(tx => 
        tx.currency === filterOptions.currency
      );
    }
    
    if (filterOptions.startDate) {
      filtered = filtered.filter(tx => 
        new Date(tx.date) >= new Date(filterOptions.startDate)
      );
    }
    
    if (filterOptions.endDate) {
      filtered = filtered.filter(tx => 
        new Date(tx.date) <= new Date(filterOptions.endDate)
      );
    }
    
    switch (sortOption) {
      case 'date-desc':
        filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        break;
      case 'date-asc':
        filtered.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        break;
      case 'amount-desc':
        filtered.sort((a, b) => b.amount - a.amount);
        break;
      case 'amount-asc':
        filtered.sort((a, b) => a.amount - b.amount);
        break;
    }
    
    setFilteredTransactions(filtered);
    
    const newActiveFilters: string[] = [];
    if (filterOptions.merchantName) newActiveFilters.push('Merchant');
    if (filterOptions.paymentMethodId) newActiveFilters.push('Payment Method');
    if (filterOptions.currency) newActiveFilters.push('Currency');
    if (filterOptions.startDate || filterOptions.endDate) newActiveFilters.push('Date Range');
    
    setActiveFilters(newActiveFilters);
  }, [transactions, searchQuery, filterOptions, sortOption]);
  
  const handleFilterChange = (key: keyof FilterOptions, value: string) => {
    setFilterOptions(prev => ({
      ...prev,
      [key]: value,
    }));
  };
  
  const resetFilters = () => {
    setFilterOptions({
      merchantName: '',
      paymentMethodId: '',
      currency: '',
      startDate: '',
      endDate: '',
    });
  };
  
  const handleViewTransaction = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setDialogMode('view');
    setIsTransactionDialogOpen(true);
  };
  
  const handleEditTransaction = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setDialogMode('edit');
    setIsTransactionDialogOpen(true);
  };
  
  const handleDeleteTransaction = (transaction: Transaction) => {
    setTransactionToDelete(transaction);
    setDeleteConfirmOpen(true);
  };
  
  const confirmDeleteTransaction = async () => {
    if (!transactionToDelete) return;
    
    try {
      setIsLoading(true);
      const success = await deleteTransaction(transactionToDelete.id);
      
      if (success) {
        setTransactions(prev => prev.filter(tx => tx.id !== transactionToDelete.id));
        
        toast({
          title: "Transaction deleted",
          description: "The transaction has been successfully deleted.",
        });
        
        setDeleteConfirmOpen(false);
        setIsTransactionDialogOpen(false);
      } else {
        toast({
          title: "Error",
          description: "Failed to delete the transaction.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error deleting transaction:', error);
      toast({
        title: "Error",
        description: "Failed to delete the transaction.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSaveEdit = async (updatedTransaction: Omit<Transaction, 'id'>) => {
    if (!selectedTransaction) return;
    
    try {
      setIsLoading(true);
      const result = await editTransaction(selectedTransaction.id, updatedTransaction);
      
      if (result) {
        setTransactions(prev => 
          prev.map(tx => tx.id === selectedTransaction.id ? result : tx)
        );
        
        toast({
          title: "Transaction updated",
          description: "The transaction has been successfully updated.",
        });
        
        setIsTransactionDialogOpen(false);
      } else {
        toast({
          title: "Error",
          description: "Failed to update the transaction.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error updating transaction:', error);
      toast({
        title: "Error",
        description: "Failed to update the transaction.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container max-w-6xl mx-auto pt-24 pb-20 px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Transactions</h1>
            <p className="text-muted-foreground mt-1">
              View and filter your expense history
            </p>
          </div>
          
          <Link to="/add-expense">
            <Button className="mt-4 sm:mt-0 gap-2">
              <PlusCircleIcon className="h-4 w-4" />
              Add Expense
            </Button>
          </Link>
        </div>
        
        <div className="sticky top-[72px] z-20 bg-background py-4 mb-6 border-b">
          <div className="flex flex-col md:flex-row gap-4">
            <TransactionSearchBar 
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
            />
            
            <div className="flex items-center gap-2">
              <TransactionFilters
                filterOptions={filterOptions}
                activeFilters={activeFilters}
                paymentMethods={paymentMethods}
                onFilterChange={handleFilterChange}
                onResetFilters={resetFilters}
              />
              
              <TransactionSortAndView
                sortOption={sortOption}
                viewMode={viewMode}
                onSortChange={setSortOption}
                onViewChange={setViewMode}
              />
            </div>
          </div>
        </div>
        
        {isLoading ? (
          <div className="animate-pulse-slow flex items-center justify-center py-12">
            Loading transactions...
          </div>
        ) : filteredTransactions.length === 0 ? (
          <TransactionEmptyState 
            hasTransactions={transactions.length > 0}
            onResetFilters={resetFilters}
          />
        ) : (
          <div className="space-y-8">
            <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as ViewMode)} className="sm:hidden">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="grid">Card View</TabsTrigger>
                <TabsTrigger value="table">Table View</TabsTrigger>
              </TabsList>
              
              <TabsContent value="grid">
                <TransactionGroupView
                  transactions={filteredTransactions}
                  sortOption={sortOption}
                  onViewTransaction={handleViewTransaction}
                />
              </TabsContent>
              
              <TabsContent value="table">
                <TransactionTable
                  transactions={filteredTransactions}
                  paymentMethods={paymentMethods}
                  onEdit={handleEditTransaction}
                  onDelete={handleDeleteTransaction}
                  onView={handleViewTransaction}
                />
              </TabsContent>
            </Tabs>
            
            <div className="hidden sm:block">
              {viewMode === 'grid' ? (
                <TransactionGroupView
                  transactions={filteredTransactions}
                  sortOption={sortOption}
                  onViewTransaction={handleViewTransaction}
                />
              ) : (
                <TransactionTable
                  transactions={filteredTransactions}
                  paymentMethods={paymentMethods}
                  onEdit={handleEditTransaction}
                  onDelete={handleDeleteTransaction}
                  onView={handleViewTransaction}
                />
              )}
            </div>
            
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Showing {filteredTransactions.length} of {transactions.length} transactions
            </div>
          </div>
        )}
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
