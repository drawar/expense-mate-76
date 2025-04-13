// hooks/dashboard/useCardOptimization.ts
import { useMemo } from 'react';
import { Transaction, PaymentMethod } from '@/types';
import { cardOptimizationUtils } from '@/utils/dashboard';

/**
 * Interface for card optimization suggestions
 */
export interface CardSuggestion {
  /** Category name where optimization is possible */
  category: string;
  /** Number of transactions in this category */
  transactionCount: number;
  /** Currently used payment method */
  currentMethod: string;
  /** Recommended payment method for better rewards */
  suggestedMethod: string;
  /** Estimated monthly savings/additional rewards when using suggested method */
  potentialSavings: number;
}

/**
 * Hook for generating payment method optimization recommendations
 * Analyzes transaction patterns and suggests better card choices per category
 * 
 * @param transactions - Array of transactions to analyze
 * @param paymentMethods - Available payment methods to consider
 * @returns Array of card optimization suggestions
 */
export function useCardOptimization(
  transactions: Transaction[],
  paymentMethods: PaymentMethod[]
): CardSuggestion[] {
  return useMemo(() => {
    return cardOptimizationUtils.analyzePaymentMethodOptimization(transactions, paymentMethods);
  }, [transactions, paymentMethods]);
}

/**
 * Hook to find the optimal card for a specific transaction
 * 
 * @param transaction - Transaction to analyze
 * @param paymentMethods - Available payment methods
 * @returns The optimal payment method or null if none found
 */
export function useOptimalCard(
  transaction: Transaction,
  paymentMethods: PaymentMethod[]
): PaymentMethod | null {
  return useMemo(() => {
    return cardOptimizationUtils.calculateOptimalCard(transaction, paymentMethods);
  }, [transaction, paymentMethods]);
}

/**
 * Hook to calculate missed optimization opportunities
 * 
 * @param transactions - Transactions to analyze
 * @param paymentMethods - Available payment methods
 * @returns Analysis of missed rewards and optimization score
 */
export function useMissedOptimizations(
  transactions: Transaction[],
  paymentMethods: PaymentMethod[]
) {
  return useMemo(() => {
    return cardOptimizationUtils.calculateMissedOptimization(transactions, paymentMethods);
  }, [transactions, paymentMethods]);
}

export default useCardOptimization;
