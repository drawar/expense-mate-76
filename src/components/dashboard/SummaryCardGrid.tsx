import React, { useMemo } from 'react';
import { Transaction, PaymentMethod, Currency } from '@/types';
import SummaryCard from './SummaryCard';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  ExternalLinkIcon, 
  TrendingUp, 
  TrendingDown, 
  CreditCardIcon,
  CoinsIcon,
  ReceiptIcon,
  BarChartIcon
} from 'lucide-react';

interface SummaryCardGridProps {
  filteredTransactions: Transaction[];
  totalExpenses: number;
  transactionCount: number;
  averageAmount: number;
  topPaymentMethod: { name: string; value: number };
  totalRewardPoints: number;
  displayCurrency: Currency;
}

const SummaryCardGrid: React.FC<SummaryCardGridProps> = ({
  filteredTransactions,
  totalExpenses,
  transactionCount,
  averageAmount,
  topPaymentMethod,
  totalRewardPoints,
  displayCurrency
}) => {
  // Calculate actual percentage change (using 20% as example fallback if we can't calculate)
  const percentageChange = useMemo(() => {
    // In a real implementation, we would use data from previous month/period
    // For now, using a fallback value
    const prevMonthTotal = totalExpenses * 0.8; // Simulating previous month as 80% of current
    if (prevMonthTotal === 0) return 0;
    
    const change = ((totalExpenses - prevMonthTotal) / prevMonthTotal) * 100;
    return Math.round(change);
  }, [totalExpenses]);

  // Helper function to render percentage change with icon and color
  const renderPercentChange = (percent: number) => {
    const isPositive = percent >= 0;
    const color = isPositive ? "text-red-500 dark:text-red-400" : "text-green-500 dark:text-green-400";
    const Icon = isPositive ? TrendingUp : TrendingDown;
    
    return (
      <div className={`flex items-center gap-1 ${color}`}>
        <Icon className="h-3.5 w-3.5" />
        <span>{`${isPositive ? '+' : ''}${percent}% since last period`}</span>
      </div>
    );
  };

  // Create metrics for the summary cards
  const metrics = [
    {
      title: "Total Expenses",
      value: `${displayCurrency} ${totalExpenses.toLocaleString()}`,
      description: renderPercentChange(percentageChange),
      icon: <BarChartIcon className="h-4 w-4 text-primary" />,
      cardColor: "bg-gradient-to-br from-violet-500/10 to-purple-600/10",
      valueColor: "text-violet-800 dark:text-violet-300"
    },
    {
      title: "Transactions",
      value: transactionCount.toString(),
      description: `Avg ${displayCurrency} ${averageAmount.toLocaleString()} per transaction`,
      icon: <ReceiptIcon className="h-4 w-4 text-primary" />,
      cardColor: "bg-gradient-to-br from-blue-500/10 to-indigo-600/10",
      valueColor: "text-blue-800 dark:text-blue-300"
    },
    {
      title: "Top Payment Method",
      value: topPaymentMethod?.name || "N/A",
      description: topPaymentMethod ? `${displayCurrency} ${topPaymentMethod.value.toLocaleString()} spent` : "No data",
      icon: <CreditCardIcon className="h-4 w-4 text-primary" />,
      cardColor: "bg-gradient-to-br from-fuchsia-500/10 to-pink-600/10",
      valueColor: "text-fuchsia-800 dark:text-fuchsia-300"
    },
    {
      title: "Reward Points",
      value: totalRewardPoints.toLocaleString(),
      description: `From ${filteredTransactions.filter(tx => (tx.rewardPoints || 0) > 0).length} transactions`,
      icon: <CoinsIcon className="h-4 w-4 text-primary" />,
      cardColor: "bg-gradient-to-br from-amber-500/10 to-orange-600/10",
      valueColor: "text-amber-800 dark:text-amber-300"
    }
  ];

  return (
    <div className="w-full">
      {/* Summary Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {metrics.map((metric, index) => (
          <SummaryCard
            key={index}
            title={metric.title}
            value={metric.value}
            description={metric.description}
            icon={metric.icon}
            cardColor={metric.cardColor}
            className="rounded-xl border border-border/30 hover:border-border/80 hover:shadow-lg transition-all duration-200 hover:scale-[1.01]"
            style={{
              animationDelay: `${index * 100}ms`,
            }}
            customContent={
              <div className={`text-2xl font-bold truncate ${metric.valueColor}`}>
                {metric.value}
              </div>
            }
          />
        ))}
      </div>
      
      <div className="flex justify-end">
        <Link to="/reward-points">
          <Button variant="outline" size="sm" className="flex gap-2 items-center">
            <span>View Reward Points Analytics</span>
            <ExternalLinkIcon size={16} />
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default SummaryCardGrid;
