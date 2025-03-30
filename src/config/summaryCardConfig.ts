
import { ReactNode } from 'react';
import { 
  TrendingUpIcon, 
  CreditCardIcon, 
  ShoppingBagIcon, 
  ActivityIcon, 
  AlertTriangleIcon,
  PiggyBankIcon
} from 'lucide-react';

/**
 * Enum for summary card types
 */
export enum SummaryCardType {
  TOTAL_SPEND = 'totalSpend',
  PAYMENT_METHOD = 'paymentMethod',
  CATEGORY = 'category',
  TREND = 'trend',
  UNUSUAL = 'unusual',
  SAVINGS = 'savings',
  REWARDS = 'rewards',
  GENERIC = 'generic'
}

/**
 * Common styling for summary cards
 */
export const commonCardStyles = {
  card: "transition-all duration-300 h-full",
  title: "text-xs font-medium text-muted-foreground uppercase tracking-wider",
  value: "text-2xl font-bold truncate",
  description: "text-xs text-muted-foreground"
};

/**
 * Configuration for summary card types
 */
interface CardTypeConfig {
  title: string;
  icon: React.ComponentType<any>;
  cardColor?: string;
  valueColor?: string;
  cardClassName?: string;
  animationDelay?: string;
}

/**
 * Summary card configuration for different card types
 */
const summaryCardConfig: Record<SummaryCardType, CardTypeConfig> = {
  [SummaryCardType.TOTAL_SPEND]: {
    title: "Total Expenses",
    icon: ActivityIcon,
    animationDelay: "0ms"
  },
  [SummaryCardType.PAYMENT_METHOD]: {
    title: "Top Payment Method",
    icon: CreditCardIcon,
    animationDelay: "100ms"
  },
  [SummaryCardType.CATEGORY]: {
    title: "Top Category",
    icon: ShoppingBagIcon,
    animationDelay: "200ms"
  },
  [SummaryCardType.TREND]: {
    title: "Spending Trend",
    icon: TrendingUpIcon,
    animationDelay: "300ms"
  },
  [SummaryCardType.UNUSUAL]: {
    title: "Unusual Spending",
    icon: AlertTriangleIcon,
    cardColor: "bg-amber-50 dark:bg-amber-950/30",
    animationDelay: "400ms"
  },
  [SummaryCardType.SAVINGS]: {
    title: "Savings Potential",
    icon: PiggyBankIcon,
    cardColor: "bg-green-50 dark:bg-green-950/30",
    animationDelay: "500ms"
  },
  [SummaryCardType.REWARDS]: {
    title: "Reward Points",
    icon: CreditCardIcon,
    cardColor: "bg-blue-50 dark:bg-blue-950/30",
    animationDelay: "600ms"
  },
  [SummaryCardType.GENERIC]: {
    title: "Information",
    icon: CreditCardIcon,
    animationDelay: "0ms"
  }
};

export default summaryCardConfig;
