
import { useState, useEffect } from 'react';
import { Transaction, PaymentMethod } from '@/types';

// This is a placeholder until we implement the real card optimization utility
const cardOptimizationUtils = {
  findOptimalCard: (transactions: Transaction[], paymentMethods: PaymentMethod[]) => {
    // Simplified logic - in reality this would be more complex
    if (!paymentMethods.length) return null;
    
    // Simply return the first active credit card for now
    return paymentMethods.find(pm => pm.active && pm.type === 'credit_card');
  },
  
  calculateSavings: (transactions: Transaction[]) => {
    // Simplified calculation
    return transactions.reduce((total, tx) => total + (tx.amount * 0.01), 0);
  }
};

export function useCardOptimization(
  transactions: Transaction[],
  paymentMethods: PaymentMethod[]
) {
  const [optimalCard, setOptimalCard] = useState<PaymentMethod | null>(null);
  const [potentialSavings, setPotentialSavings] = useState(0);
  
  useEffect(() => {
    if (transactions.length && paymentMethods.length) {
      // Find the optimal card based on transaction history
      const bestCard = cardOptimizationUtils.findOptimalCard(transactions, paymentMethods);
      setOptimalCard(bestCard);
      
      // Calculate potential savings
      const savings = cardOptimizationUtils.calculateSavings(transactions);
      setPotentialSavings(savings);
    }
  }, [transactions, paymentMethods]);
  
  return {
    optimalCard,
    potentialSavings
  };
}
