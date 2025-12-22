import { Transaction, Currency, PaymentMethod } from "@/types";

/**
 * Context data passed to insight evaluators
 */
export interface InsightContext {
  // Transaction data
  transactions: Transaction[];
  currentMonthTransactions: Transaction[];
  previousMonthTransactions: Transaction[];

  // Budget data
  monthlyBudget: number;
  totalSpent: number;

  // User preferences
  currency: Currency;
  paymentMethods: PaymentMethod[];

  // Time context
  currentDate: Date;
  dayOfMonth: number;
  daysInMonth: number;
  daysRemaining: number;

  // Computed metrics (populated by InsightService)
  categoryTotals?: Record<string, number>;
  tierTotals?: Record<string, number>;
  behaviorTotals?: Record<string, number>;
  merchantTotals?: Record<string, { total: number; count: number }>;
  previousMonthTotal?: number;
  averageTransaction?: number;
}

/**
 * Result from evaluating an insight condition
 */
export interface EvaluationResult {
  triggered: boolean;
  data: Record<string, unknown>;
}

/**
 * Condition evaluator function type
 */
export type ConditionEvaluator = (
  context: InsightContext,
  params: Record<string, unknown>
) => EvaluationResult;

/**
 * Map of condition types to their evaluators
 */
export type ConditionEvaluatorMap = Record<string, ConditionEvaluator>;
