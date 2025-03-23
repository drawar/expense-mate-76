
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Transaction, PaymentMethod, Currency } from '@/types';
import { getTransactions, getPaymentMethods } from '@/utils/storageUtils';
import { formatDate } from '@/utils/dateUtils';
import Navbar from '@/components/layout/Navbar';
import TransactionCard from '@/components/expense/TransactionCard';
import { Button } from '@/components/ui/button';
import {
  PlusCircleIcon,
  FilterIcon,
  SortAscIcon,
  SortDescIcon,
  SearchIcon,
  CheckIcon,
  XIcon,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { currencyOptions } from '@/utils/currencyFormatter';
import { cn } from '@/lib/utils';

type SortOption = 'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc';

type FilterOptions = {
  merchantName: string;
  paymentMethodId: string;
  currency: string;
  startDate: string;
  endDate: string;
};

const Transactions = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
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
  
  // Load data
  useEffect(() => {
    const loadedTransactions = getTransactions();
    const loadedPaymentMethods = getPaymentMethods();
    
    setTransactions(loadedTransactions);
    setPaymentMethods(loadedPaymentMethods);
    setIsLoading(false);
    
    // Add event listener for storage changes
    window.addEventListener('storage', () => {
      setTransactions(getTransactions());
      setPaymentMethods(getPaymentMethods());
    });
    
    return () => {
      window.removeEventListener('storage', () => {});
    };
  }, []);
  
  // Apply filters and sorting
  useEffect(() => {
    let filtered = [...transactions];
    
    // Apply search query
    if (searchQuery) {
      filtered = filtered.filter(tx => 
        tx.merchant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.notes?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Apply filters
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
    
    // Apply sorting
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
    
    // Update active filters
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
        
        {/* Search and Filter Bar */}
        <div className="sticky top-[72px] z-20 bg-background py-4 mb-6 border-b">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-grow">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search transactions..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <FilterIcon className="h-4 w-4" />
                    Filter
                    {activeFilters.length > 0 && (
                      <Badge variant="secondary" className="ml-1 px-1 min-w-[20px]">
                        {activeFilters.length}
                      </Badge>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80">
                  <div className="space-y-4">
                    <h4 className="font-medium">Filter Transactions</h4>
                    
                    <div className="space-y-2">
                      <Label htmlFor="merchant-filter">Merchant</Label>
                      <Input
                        id="merchant-filter"
                        placeholder="Enter merchant name"
                        value={filterOptions.merchantName}
                        onChange={(e) => handleFilterChange('merchantName', e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="payment-method-filter">Payment Method</Label>
                      <Select
                        value={filterOptions.paymentMethodId}
                        onValueChange={(value) => handleFilterChange('paymentMethodId', value)}
                      >
                        <SelectTrigger id="payment-method-filter">
                          <SelectValue placeholder="Select payment method" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">All Payment Methods</SelectItem>
                          {paymentMethods.map((method) => (
                            <SelectItem key={method.id} value={method.id}>
                              {method.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="currency-filter">Currency</Label>
                      <Select
                        value={filterOptions.currency}
                        onValueChange={(value) => handleFilterChange('currency', value)}
                      >
                        <SelectTrigger id="currency-filter">
                          <SelectValue placeholder="Select currency" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">All Currencies</SelectItem>
                          {currencyOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="start-date">Start Date</Label>
                        <Input
                          id="start-date"
                          type="date"
                          value={filterOptions.startDate}
                          onChange={(e) => handleFilterChange('startDate', e.target.value)}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="end-date">End Date</Label>
                        <Input
                          id="end-date"
                          type="date"
                          value={filterOptions.endDate}
                          onChange={(e) => handleFilterChange('endDate', e.target.value)}
                        />
                      </div>
                    </div>
                    
                    <div className="flex justify-between">
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        onClick={resetFilters}
                      >
                        <XIcon className="h-4 w-4" />
                        Reset
                      </Button>
                      
                      <Button
                        size="sm"
                        className="gap-2"
                        onClick={() => document.body.click()} // Close popover
                      >
                        <CheckIcon className="h-4 w-4" />
                        Apply
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
              
              <Select
                value={sortOption}
                onValueChange={(value) => setSortOption(value as SortOption)}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date-desc">
                    <div className="flex items-center">
                      <SortDescIcon className="h-4 w-4 mr-2" />
                      Newest First
                    </div>
                  </SelectItem>
                  <SelectItem value="date-asc">
                    <div className="flex items-center">
                      <SortAscIcon className="h-4 w-4 mr-2" />
                      Oldest First
                    </div>
                  </SelectItem>
                  <SelectItem value="amount-desc">
                    <div className="flex items-center">
                      <SortDescIcon className="h-4 w-4 mr-2" />
                      Highest Amount
                    </div>
                  </SelectItem>
                  <SelectItem value="amount-asc">
                    <div className="flex items-center">
                      <SortAscIcon className="h-4 w-4 mr-2" />
                      Lowest Amount
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Active Filters */}
          {activeFilters.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {activeFilters.map((filter) => (
                <Badge key={filter} variant="secondary" className="gap-1">
                  {filter}
                </Badge>
              ))}
              
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={resetFilters}
              >
                Clear All
              </Button>
            </div>
          )}
        </div>
        
        {isLoading ? (
          <div className="animate-pulse-slow flex items-center justify-center py-12">
            Loading transactions...
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="glass-card rounded-xl p-8 text-center">
            <p className="text-muted-foreground mb-4">
              {transactions.length === 0
                ? 'No transactions recorded yet.'
                : 'No transactions match your filters.'}
            </p>
            
            {transactions.length === 0 ? (
              <Link to="/add-expense">
                <Button>
                  <PlusCircleIcon className="mr-2 h-4 w-4" />
                  Record Your First Expense
                </Button>
              </Link>
            ) : (
              <Button variant="outline" onClick={resetFilters}>
                Reset Filters
              </Button>
            )}
          </div>
        ) : (
          <>
            {/* Transaction List */}
            <div className="space-y-4">
              {/* Group transactions by date */}
              {Object.entries(
                filteredTransactions.reduce<Record<string, Transaction[]>>((groups, transaction) => {
                  const date = transaction.date;
                  if (!groups[date]) {
                    groups[date] = [];
                  }
                  groups[date].push(transaction);
                  return groups;
                }, {})
              )
                .sort(([dateA], [dateB]) => {
                  return sortOption.includes('desc')
                    ? new Date(dateB).getTime() - new Date(dateA).getTime()
                    : new Date(dateA).getTime() - new Date(dateB).getTime();
                })
                .map(([date, dateTransactions]) => (
                  <div key={date}>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 sticky top-[146px] bg-background py-2 z-10">
                      {formatDate(date)}
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
                      {dateTransactions.map((transaction) => (
                        <TransactionCard
                          key={transaction.id}
                          transaction={transaction}
                          className="animate-fade-in"
                        />
                      ))}
                    </div>
                  </div>
                ))}
            </div>
            
            {/* Summary */}
            <div className="mt-8 text-sm text-gray-500 dark:text-gray-400">
              Showing {filteredTransactions.length} of {transactions.length} transactions
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default Transactions;
