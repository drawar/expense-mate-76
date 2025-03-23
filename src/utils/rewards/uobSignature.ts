
import { Transaction } from '@/types';
import { isDateInStatementPeriod } from '../dateUtils';

// Calculate UOB Visa Signature points for a transaction
export const calculateUOBSignaturePoints = (
  transaction: Transaction,
  allTransactions: Transaction[]
): number => {
  const { paymentAmount, currency } = transaction;
  
  // Round down payment amount to nearest multiple of 5
  const roundedAmount = Math.floor(paymentAmount / 5) * 5;
  
  // Calculate base points (2x for every SGD 5)
  const basePoints = (roundedAmount / 5) * 2;
  
  // Check conditions for bonus points
  // 1. All transactions must be in non-SGD currency
  // 2. Total spend must be at least SGD 1000
  
  // Get transactions for this payment method in the current statement period
  const currentDate = new Date(transaction.date);
  const statementTransactions = allTransactions.filter(t => 
    t.paymentMethod.id === transaction.paymentMethod.id &&
    isDateInStatementPeriod(new Date(t.date), transaction.paymentMethod)
  );
  
  // Check if any transactions are in SGD
  const hasSgdTransactions = statementTransactions.some(t => t.currency === 'SGD');
  
  if (hasSgdTransactions) {
    return Math.round(basePoints);
  }
  
  // Calculate total spend including current transaction
  let totalSpend = statementTransactions.reduce((sum, tx) => {
    if (tx.id !== transaction.id) { // Exclude current transaction
      return sum + tx.paymentAmount;
    }
    return sum;
  }, 0);
  
  // Add current transaction
  totalSpend += paymentAmount;
  
  // Check if minimum spend is met
  if (totalSpend < 1000) {
    return Math.round(basePoints);
  }
  
  // Calculate bonus points based on total spend
  const roundedTotal = Math.floor(totalSpend / 5) * 5;
  const bonusPoints = (roundedTotal / 5) * 18;
  
  // Cap at 8000 points total
  const totalPoints = basePoints + bonusPoints;
  return Math.min(Math.round(totalPoints), 8000);
};

// Simulate UOB Signature points for a potential transaction
export const simulateUOBSignaturePoints = (
  amount: number,
  currency: string,
  nonSgdSpendTotal: number,
  hasSgdTransactions: boolean
): {
  totalPoints: number;
  basePoints: number;
  bonusPoints: number;
  messageText?: string;
} => {
  const paymentAmount = amount;
  const roundedAmount = Math.floor(paymentAmount / 5) * 5;
  const basePoints = Math.round((roundedAmount / 5) * 2);
  
  let bonusPoints = 0;
  let messageText;
  
  if (currency !== 'SGD') {
    const totalNonSgdSpend = nonSgdSpendTotal + paymentAmount;
    
    if (!hasSgdTransactions) {
      if (totalNonSgdSpend >= 1000) {
        bonusPoints = Math.round((Math.floor(totalNonSgdSpend / 5) * 5 / 5) * 18);
        messageText = "Minimum spend reached";
      } else {
        const remainingToSpend = 1000 - totalNonSgdSpend;
        messageText = `Spend SGD ${remainingToSpend.toFixed(2)} more to earn bonus points`;
      }
    } else {
      messageText = "No bonus points (SGD transactions present this month)";
    }
  } else {
    messageText = "No bonus points (SGD currency)";
  }
  
  const totalPoints = Math.min(basePoints + bonusPoints, 8000);
  
  return {
    totalPoints,
    basePoints,
    bonusPoints,
    messageText
  };
};
