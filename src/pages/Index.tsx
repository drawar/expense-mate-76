import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  PlusCircleIcon, 
  ArrowUpRightIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  CreditCardIcon,
  TagIcon
} from 'lucide-react';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { Transaction, PaymentMethod } from '@/types';
import { getTransactions, getPaymentMethods } from '@/utils/storageUtils';
import TransactionCard from '@/components/expense/TransactionCard';
import SummaryCardGrid from '@/components/dashboard/SummaryCardGrid';
import SpendingTrends from '@/components/dashboard/SpendingTrends';
import CardOptimizationCard from '@/components/dashboard/cards/CardOptimizationCard';
import SavingsPotentialCard from '@/components/dashboard/cards/SavingsPotentialCard';
import PieChartCard from '@/components/dashboard/PieChartCard';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/utils/currencyFormatter';
import { useSummaryData } from '@/hooks/dashboard/useSummaryData';
import { supabase, USE_LOCAL_STORAGE_DEFAULT } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

// Type for Supabase real-time payload
interface RealtimePayload {
  new?: { date?: string; [key: string]: any };
  old?: { date?: string; [key: string]: any };
}

const Index = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const isMobile = useIsMobile();
  
  // Get summary data for dashboard
  const { summaryData } = useSummaryData(
    transactions,
    'SGD', // Default currency
    'thisMonth',
    false,
    15
  );
  
  // Use ref to prevent unnecessary reloads
  const initialized = useRef(false);
  
  // Define loadData outside useEffect for reuse
  const loadData = useCallback(async () => {
    try {
      if (!initialized.current) {
        setLoading(true);
        initialized.current = true;
      }
      
      // Get only recent transactions for homepage (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      // Get payment methods - these are typically few in number
      const loadedPaymentMethods = await getPaymentMethods();
      
      // Get transactions and filter to recent ones client-side
      const allTransactions = await getTransactions(USE_LOCAL_STORAGE_DEFAULT);
      
      // Filter to only recent transactions (last 30 days) to improve performance
      const loadedTransactions = allTransactions.filter(tx => {
        const txDate = new Date(tx.date);
        return txDate >= thirtyDaysAgo;
      }).slice(0, 50); // Limit to 50 most recent transactions for homepage performance
      
      setTransactions(loadedTransactions);
      setPaymentMethods(loadedPaymentMethods);
      setLoading(false);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: 'Error loading data',
        description: 'There was a problem loading your expense data',
        variant: 'destructive'
      });
      setLoading(false);
    }
  }, [toast]);
  
  useEffect(() => {
    // Load data on component mount
    loadData();
    
    // Set up real-time subscription for transactions, but only reload recent data
    const channel = supabase
      .channel('public:transactions')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'transactions'
      }, (payload: RealtimePayload) => {
        // Check if this is a recent transaction before triggering reload
        const payloadDate = payload.new?.date || payload.old?.date;
        if (payloadDate) {
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          const txDate = new Date(payloadDate);
          
          // Only reload if this is a recent transaction
          if (txDate >= thirtyDaysAgo) {
            loadData();
          }
        }
      })
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadData]);
  
  // Get most recent 5 transactions for display - memoize this calculation
  const recentTransactions = useMemo(() => {
    return transactions
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }, [transactions]);
  
  // Generate category chart data for the PieChartCard
  const categoryChartData = useMemo(() => {
    if (!transactions.length) return [];
    
    // Create a map of category -> total amount
    const categoryMap = new Map<string, number>();
    
    // Group transactions by category
    transactions.forEach(tx => {
      const category = tx.category || 'Uncategorized';
      const existingAmount = categoryMap.get(category) || 0;
      categoryMap.set(category, existingAmount + tx.amount);
    });
    
    // Generate colors for each category
    const colors = [
      '#3B82F6', // blue
      '#10B981', // green
      '#F59E0B', // amber
      '#8B5CF6', // violet
      '#EC4899', // pink
      '#6366F1', // indigo
      '#EF4444', // red
      '#14B8A6', // teal
      '#F97316', // orange
      '#8B5CF6'  // purple
    ];
    
    // Convert to array with colors
    return Array.from(categoryMap.entries())
      .sort((a, b) => b[1] - a[1]) // Sort by amount in descending order
      .slice(0, 10) // Take top 10 categories
      .map(([name, value], index) => ({
        name,
        value,
        color: colors[index % colors.length]
      }));
  }, [transactions]);

  // Loading state with animation
  if (loading) {
    return (
      <div className="min-h-screen">  
        <div className="container max-w-7xl mx-auto pb-16">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-10 mt-4">
            <div className="animate-pulse bg-muted h-10 w-48 rounded-md"></div>
            <div className="animate-pulse bg-muted h-10 w-32 rounded-md mt-4 sm:mt-0"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="animate-pulse bg-muted h-48 rounded-xl"></div>
            <div className="animate-pulse bg-muted h-48 rounded-xl"></div>
            <div className="animate-pulse bg-muted h-48 rounded-xl"></div>
            <div className="animate-pulse bg-muted h-48 rounded-xl"></div>
          </div>
        </div>
      </div>
    );
  }
    
  return (
    <div className="min-h-screen">  
      <div className="container max-w-7xl mx-auto pb-16">
        {/* Title and Add Expense Button */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-10 mt-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gradient">
              Expense Tracker
            </h1>
            <p className="text-muted-foreground mt-1.5 text-sm">
              Track and manage your expenses
            </p>
          </div>
          
          <div className="flex items-center gap-3 mt-4 sm:mt-0">
            <ThemeToggle />
            <Link to="/add-expense">
              <Button className={`btn-hover-effect bg-gradient-to-r from-[#6366f1] to-[#a855f7] ${!isMobile ? 'gap-2' : 'w-10 h-10 p-0'}`}>
                <PlusCircleIcon className="h-4 w-4" />
                {!isMobile && <span>Add Expense</span>}
              </Button>
            </Link>
          </div>
        </div>
        
        {/* Main Content - Grid Layout */}
        <div className="grid gap-4">
          {/* Summary Section - only SummaryCardGrid */}
          <div className="mb-4">
            <div className="space-y-4 w-full">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4">
                <h2 className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-[#6366f1] to-[#a855f7]">Expense Summary</h2>
              </div>
              
              <SummaryCardGrid
                filteredTransactions={transactions}
                totalExpenses={summaryData.totalExpenses}
                transactionCount={summaryData.transactionCount}
                averageAmount={summaryData.averageAmount}
                topPaymentMethod={summaryData.topPaymentMethod}
                totalRewardPoints={summaryData.totalRewardPoints}
                displayCurrency="SGD"
              />
            </div>
          </div>
          
          {/* Financial Insights Section - 2x3 grid with all six cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 mb-4">
            {/* Row 1, Card 1: Payment Methods Chart */}
            <Card className="rounded-xl border border-border/50 bg-card hover:shadow-md transition-all overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-xl flex items-center gap-2">
                  <CreditCardIcon className="h-5 w-5 text-primary" />
                  Payment Methods
                </CardTitle>
              </CardHeader>
              <CardContent>
                {summaryData.paymentMethodChartData.length > 0 ? (
                  <div className="w-full h-60 mt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={summaryData.paymentMethodChartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {summaryData.paymentMethodChartData.map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={entry.color} 
                              stroke="var(--background)"
                              strokeWidth={2}
                            />
                          ))}
                        </Pie>
                        <Tooltip 
                          content={(tooltipProps) => {
                            const { active, payload } = tooltipProps;
                            if (active && payload && payload.length) {
                              const value = Number(payload[0].value);
                              // Calculate total of all payment method values
                              const total = summaryData.paymentMethodChartData.reduce(
                                (sum, item) => sum + Number(item.value), 0
                              );
                              const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                              return (
                                <div className="bg-background border border-border p-3 rounded-md shadow-lg">
                                  <p className="font-medium text-sm mb-1">{payload[0].name}</p>
                                  <p className="text-primary font-bold">
                                    {formatCurrency(value, 'SGD')}
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {percentage}% of total
                                  </p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Legend 
                          layout="vertical" 
                          verticalAlign="middle" 
                          align="right"
                          formatter={(value) => (
                            <span className="text-xs">{value}</span>
                          )}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-60 text-muted-foreground">
                    <p>No payment method data available</p>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Row 1, Card 2: Expense Categories Chart */}
            <Card className="rounded-xl border border-border/50 bg-card hover:shadow-md transition-all overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-xl flex items-center gap-2">
                  <TagIcon className="h-5 w-5 text-primary" />
                  Expense Categories
                </CardTitle>
              </CardHeader>
              <CardContent>
                {summaryData.categoryChartData.length > 0 ? (
                  <div className="w-full h-60 mt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={summaryData.categoryChartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {summaryData.categoryChartData.map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={entry.color}
                              stroke="var(--background)"
                              strokeWidth={2}
                            />
                          ))}
                        </Pie>
                        <Tooltip 
                          content={(tooltipProps) => {
                            const { active, payload } = tooltipProps;
                            if (active && payload && payload.length) {
                              const value = Number(payload[0].value);
                              // Calculate total of all category values
                              const total = summaryData.categoryChartData.reduce(
                                (sum, item) => sum + Number(item.value), 0
                              );
                              const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                              return (
                                <div className="bg-background border border-border p-3 rounded-md shadow-lg">
                                  <p className="font-medium text-sm mb-1">{payload[0].name}</p>
                                  <p className="text-primary font-bold">
                                    {formatCurrency(value, 'SGD')}
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {percentage}% of total
                                  </p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Legend 
                          layout="vertical" 
                          verticalAlign="middle" 
                          align="right"
                          formatter={(value) => (
                            <span className="text-xs">{value}</span>
                          )}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-60 text-muted-foreground">
                    <p>No category data available</p>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Row 2, Card 1: Spending Trends */}
            <SpendingTrends 
              transactions={transactions} 
            />
            
            {/* Row 2, Card 2: Card Optimization */}
            <CardOptimizationCard 
              transactions={transactions} 
              paymentMethods={paymentMethods} 
            />
            
            {/* Row 3, Card 1: Savings Potential */}
            <SavingsPotentialCard 
              transactions={transactions}
            />
            
            {/* Row 3, Card 2: Category Analysis */}
            <PieChartCard 
              title="Category Analysis" 
              data={categoryChartData}
            />
          </div>
          
          {/* Recent Transactions Section */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-medium tracking-tight">Recent Transactions</h2>
              <Link to="/transactions" className="interactive-link text-primary flex items-center text-sm font-medium">
                View All <ArrowUpRightIcon className="ml-1 h-4 w-4" />
              </Link>
            </div>
            
            {recentTransactions.length === 0 ? (
              <div className="glass-card p-8 text-center rounded-xl border border-border/50 bg-card hover:shadow-md transition-all">
                <p className="text-muted-foreground mb-4">No transactions recorded yet.</p>
                <Link to="/add-expense">
                  <Button className={`btn-hover-effect bg-gradient-to-r from-[#6366f1] to-[#a855f7] ${!isMobile ? 'gap-2' : 'w-10 h-10 p-0'}`}>
                    <PlusCircleIcon className={isMobile ? "h-4 w-4" : "mr-2 h-4 w-4"} />
                    {!isMobile && <span>Record Your First Expense</span>}
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {recentTransactions.map((transaction, index) => (
                  <TransactionCard 
                    key={transaction.id} 
                    transaction={transaction}
                    className="glass-card-elevated rounded-xl border border-border/50 bg-card hover:shadow-md hover:scale-[1.01] transition-all"
                    onClick={() => {
                      // You could navigate to a transaction detail page here
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;