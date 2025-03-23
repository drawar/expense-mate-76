import { Transaction } from '@/types';
import { isSameMonth } from 'date-fns';

// Included and excluded MCCs for Citibank Rewards Visa Signature
export const CITIBANK_REWARDS_INCLUSION_MCCS = [
  '5311', '5611', '5621', '5631', '5641', '5651', '5655', '5661', '5691', '5699', '5948'
];

export const CITIBANK_REWARDS_EXCLUSION_MCCS = [
  // Airlines and travel-related (3000-3999)
  ...[...Array(1000)].map((_, i) => `${3000 + i}`),
  // Other exclusions
  '4511', '7512', '7011', '4111', '4112', '4789', '4411', '4722', '4723', '5962', '7012'
];

// Calculate Citibank Rewards Visa Signature points for a transaction
export const calculateCitibankRewardsPoints = (
  transaction: Transaction,
  allTransactions: Transaction[]
): number => {
  const { amount, merchant } = transaction;
  
  // Round down to nearest whole number
  const roundedAmount = Math.floor(amount);
  
  // Calculate base points (0.4x rounded amount)
  const basePoints = roundedAmount * 0.4;
  
  // Check if transaction is eligible for bonus points
  const isExcludedMCC = merchant.mcc && CITIBANK_REWARDS_EXCLUSION_MCCS.includes(merchant.mcc.code);
  const isIncludedMCC = merchant.mcc && CITIBANK_REWARDS_INCLUSION_MCCS.includes(merchant.mcc.code);
  const isEligibleTransaction = (merchant.isOnline && !isExcludedMCC) || isIncludedMCC;
  
  if (!isEligibleTransaction) {
    return Math.round(basePoints);
  }
  
  // Calculate total bonus points earned this calendar month
  const currentDate = new Date(transaction.date);
  
  const monthTransactions = allTransactions.filter(t => 
    t.paymentMethod.id === transaction.paymentMethod.id &&
    isSameMonth(new Date(t.date), currentDate)
  );
  
  const totalMonthBonusPoints = monthTransactions.reduce((sum, tx) => {
    if (tx.id === transaction.id) return sum; // Exclude current transaction
    
    const txAmount = Math.floor(tx.amount);
    const txBasePoints = txAmount * 0.4;
    const txTotalPoints = tx.rewardPoints;
    const txBonusPoints = Math.max(0, txTotalPoints - Math.round(txBasePoints));
    
    return sum + txBonusPoints;
  }, 0);
  
  // Calculate bonus points for current transaction
  const potentialBonusPoints = roundedAmount * 3.6;
  const remainingBonusPoints = 4000 - totalMonthBonusPoints;
  const actualBonusPoints = Math.min(potentialBonusPoints, Math.max(0, remainingBonusPoints));
  
  return Math.round(basePoints + actualBonusPoints);
};

// Simulate Citibank Rewards points for a potential transaction
export const simulateCitibankRewardsPoints = (
  amount: number,
  mcc?: string,
  isOnline?: boolean,
  usedMonthlyBonusPoints: number = 0
): {
  totalPoints: number;
  basePoints: number;
  bonusPoints: number;
  remainingMonthlyBonusPoints: number;
} => {
  const roundedAmount = Math.floor(amount);
  const basePoints = Math.round(roundedAmount * 0.4);
  
  const isExcludedMCC = mcc && CITIBANK_REWARDS_EXCLUSION_MCCS.includes(mcc);
  const isIncludedMCC = mcc && CITIBANK_REWARDS_INCLUSION_MCCS.includes(mcc);
  const isEligibleTransaction = (isOnline && !isExcludedMCC) || isIncludedMCC;
  
  if (!isEligibleTransaction) {
    return {
      totalPoints: basePoints,
      basePoints: basePoints,
      bonusPoints: 0,
      remainingMonthlyBonusPoints: 4000 - usedMonthlyBonusPoints
    };
  }
  
  const potentialBonusPoints = roundedAmount * 3.6;
  const remainingBonusPoints = 4000 - usedMonthlyBonusPoints;
  const actualBonusPoints = Math.min(potentialBonusPoints, Math.max(0, remainingBonusPoints));
  
  return {
    totalPoints: basePoints + Math.round(actualBonusPoints),
    basePoints: basePoints,
    bonusPoints: Math.round(actualBonusPoints),
    remainingMonthlyBonusPoints: 4000 - usedMonthlyBonusPoints - Math.round(actualBonusPoints)
  };
};
