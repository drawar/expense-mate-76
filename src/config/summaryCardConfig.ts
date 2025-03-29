// src/config/summaryCardConfig.ts
import { 
    BarChartIcon,
    ReceiptIcon,
    CreditCardIcon,
    CoinsIcon
  } from 'lucide-react';
  import { CSSProperties, ReactNode } from 'react';
  import { SummaryCardProps } from '@/components/dashboard/abstractions/AbstractSummaryCard';
  
  /**
   * Types of summary cards available in the dashboard
   */
  export type SummaryCardType = 
    | 'expense'
    | 'transaction'
    | 'paymentMethod'
    | 'rewardPoints';
  
  /**
   * Configuration interface for visual aspects of summary cards
   */
  export interface SummaryCardVisualConfig {
    icon: React.ComponentType<any>; // Lucide React icon component
    title: string;
    cardColor: string;
    valueColor: string;
    animationDelay: string;
    cardClassName?: string;
  }
  
  /**
   * Configuration for all summary card types
   */
  const summaryCardConfig: Record<SummaryCardType, SummaryCardVisualConfig> = {
    expense: {
      icon: BarChartIcon,
      title: "Total Expenses",
      cardColor: "bg-gradient-to-br from-violet-500/10 to-purple-600/10",
      valueColor: "text-violet-800 dark:text-violet-300",
      animationDelay: "0ms",
    },
    
    transaction: {
      icon: ReceiptIcon,
      title: "Transactions",
      cardColor: "bg-gradient-to-br from-blue-500/10 to-indigo-600/10",
      valueColor: "text-blue-800 dark:text-blue-300",
      animationDelay: "100ms",
    },
    
    paymentMethod: {
      icon: CreditCardIcon,
      title: "Top Payment Method",
      cardColor: "bg-gradient-to-br from-fuchsia-500/10 to-pink-600/10",
      valueColor: "text-fuchsia-800 dark:text-fuchsia-300",
      animationDelay: "200ms",
    },
    
    rewardPoints: {
      icon: CoinsIcon,
      title: "Reward Points",
      cardColor: "bg-gradient-to-br from-amber-500/10 to-orange-600/10",
      valueColor: "text-amber-800 dark:text-amber-300",
      animationDelay: "300ms",
    }
  };
  
  /**
   * Common styling classes shared by all summary cards
   */
  export const commonCardStyles = {
    card: "rounded-xl border border-border/30 hover:border-border/80 hover:shadow-lg transition-all duration-200 hover:scale-[1.01]",
    title: "text-xs font-medium text-muted-foreground uppercase tracking-wider line-clamp-1",
    value: "text-2xl font-bold text-ellipsis whitespace-nowrap overflow-hidden",
    description: "text-xs text-muted-foreground flex items-center gap-1 break-words",
  };
  
  export default summaryCardConfig;
