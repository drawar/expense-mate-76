
import { Transaction, PaymentMethod } from '@/types';
import { calculateBasicPoints, getTotalRewardPoints } from './rewards/baseCalculations';
import { calculateUOBPlatinumPoints, simulateUOBPlatinumPoints } from './rewards/uobPlatinum';
import { calculateUOBSignaturePoints, simulateUOBSignaturePoints } from './rewards/uobSignature';
import { calculateCitibankRewardsPoints, simulateCitibankRewardsPoints } from './rewards/citibankRewards';
import { getTransactions } from './storage/transactions';
import { isDateInStatementPeriod } from './dateUtils';

// Calculate reward points for a single transaction
export const calculateTransactionPoints = (
  transaction: Transaction,
  allTransactions: Transaction[]
): number => {
  const { paymentMethod } = transaction;
  
  // Special case for UOB Preferred Visa Platinum
  if (paymentMethod.issuer === 'UOB' && paymentMethod.name === 'Preferred Visa Platinum') {
    return calculateUOBPlatinumPoints(transaction, allTransactions);
  }
  
  // Special case for UOB Visa Signature
  if (paymentMethod.issuer === 'UOB' && paymentMethod.name === 'Visa Signature') {
    return calculateUOBSignaturePoints(transaction, allTransactions);
  }
  
  // Special case for Citibank Rewards Visa Signature
  if (paymentMethod.issuer === 'Citibank' && paymentMethod.name === 'Rewards Visa Signature') {
    return calculateCitibankRewardsPoints(transaction, allTransactions);
  }
  
  // Get transactions for this payment method in the current statement period
  const statementTransactions = allTransactions.filter(
    (t) => t.paymentMethod.id === paymentMethod.id && 
    isDateInStatementPeriod(new Date(t.date), paymentMethod)
  );
  
  // Use the basic points calculation for standard cards
  return calculateBasicPoints(
    transaction.amount,
    transaction.currency,
    paymentMethod,
    transaction.merchant.mcc?.code,
    transaction.merchant.name,
    transaction.merchant.isOnline,
    statementTransactions
  );
};

// Calculate points that would be earned for a potential transaction
export const simulateRewardPoints = (
  amount: number,
  currency: string,
  paymentMethod: PaymentMethod,
  mcc?: string,
  merchantName?: string,
  isOnline?: boolean,
  isContactless?: boolean,
  currentDate: Date = new Date()
): {
  totalPoints: number;
  basePoints?: number;
  bonusPoints?: number;
  remainingMonthlyBonusPoints?: number;
} => {
  if (paymentMethod.type === 'cash') {
    return { totalPoints: 0 };
  }
  
  const allTransactions = getTransactions();
  
  // Special case for UOB Preferred Visa Platinum
  if (paymentMethod.issuer === 'UOB' && paymentMethod.name === 'Preferred Visa Platinum') {
    // Calculate used bonus points
    const currentMonthTransactions = allTransactions.filter(tx => {
      const txDate = new Date(tx.date);
      return tx.paymentMethod.id === paymentMethod.id && 
             txDate.getMonth() === currentDate.getMonth() &&
             txDate.getFullYear() === currentDate.getFullYear();
    });
    
    let usedBonusPoints = 0;
    currentMonthTransactions.forEach(tx => {
      if (tx.rewardPoints > 0) {
        const txAmount = Math.floor(tx.amount / 5) * 5;
        const basePoints = Math.round(txAmount * 0.4);
        const bonusPoints = Math.max(0, tx.rewardPoints - basePoints);
        usedBonusPoints += bonusPoints;
      }
    });
    
    return simulateUOBPlatinumPoints(amount, mcc, isOnline, isContactless, usedBonusPoints);
  }
  
  // Special case for UOB Visa Signature
  if (paymentMethod.issuer === 'UOB' && paymentMethod.name === 'Visa Signature') {
    // Calculate non-SGD spend and check for SGD transactions
    const statementTransactions = allTransactions.filter(tx => 
      tx.paymentMethod.id === paymentMethod.id
    );
    
    let nonSgdSpendTotal = 0;
    let hasSgdTransactions = false;
    
    statementTransactions.forEach(tx => {
      if (tx.currency === 'SGD') {
        hasSgdTransactions = true;
      } else {
        nonSgdSpendTotal += tx.paymentAmount;
      }
    });
    
    return simulateUOBSignaturePoints(amount, currency, nonSgdSpendTotal, hasSgdTransactions);
  }
  
  // Special case for Citibank Rewards Visa Signature
  if (paymentMethod.issuer === 'Citibank' && paymentMethod.name === 'Rewards Visa Signature') {
    // Calculate used bonus points
    const currentMonthTransactions = allTransactions.filter(tx => {
      const txDate = new Date(tx.date);
      return tx.paymentMethod.id === paymentMethod.id && 
             txDate.getMonth() === currentDate.getMonth() &&
             txDate.getFullYear() === currentDate.getFullYear();
    });
    
    let usedBonusPoints = 0;
    currentMonthTransactions.forEach(tx => {
      if (tx.rewardPoints > 0) {
        const txAmount = Math.floor(tx.amount);
        const basePoints = Math.round(txAmount * 0.4);
        const bonusPoints = Math.max(0, tx.rewardPoints - basePoints);
        usedBonusPoints += bonusPoints;
      }
    });
    
    return simulateCitibankRewardsPoints(amount, mcc, isOnline, usedBonusPoints);
  }
  
  // For standard cards, get basic points
  const points = calculateBasicPoints(
    amount, 
    currency, 
    paymentMethod, 
    mcc, 
    merchantName, 
    isOnline
  );
  
  return { totalPoints: points };
};

// Re-export getTotalRewardPoints for convenience
export { getTotalRewardPoints };
