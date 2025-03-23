
import { Transaction } from '@/types';
import { startOfMonth, endOfMonth, isSameMonth } from 'date-fns';

// List of eligible MCCs for UOB Preferred Visa Platinum
export const UOB_PLATINUM_ELIGIBLE_MCCS = [
  '4816', '5262', '5306', '5309', '5310', '5311', '5331', '5399', 
  '5611', '5621', '5631', '5641', '5651', '5661', '5691', '5699',
  '5732', '5733', '5734', '5735', '5912', '5942', '5944', '5945',
  '5946', '5947', '5948', '5949', '5964', '5965', '5966', '5967',
  '5968', '5969', '5970', '5992', '5999', '5811', '5812', '5814',
  '5333', '5411', '5441', '5462', '5499', '8012', '9751', '7278',
  '7832', '7841', '7922', '7991', '7996', '7998', '7999'
];

// Calculate UOB Platinum points for a transaction
export const calculateUOBPlatinumPoints = (
  transaction: Transaction,
  allTransactions: Transaction[]
): number => {
  const { amount, merchant, isContactless } = transaction;
  
  // Round down to nearest multiple of 5
  const roundedAmount = Math.floor(amount / 5) * 5;
  
  // Calculate base points (0.4x rounded amount)
  const basePoints = roundedAmount * 0.4;
  
  // Check if transaction is eligible for bonus points
  const isEligibleMCC = merchant.mcc && UOB_PLATINUM_ELIGIBLE_MCCS.includes(merchant.mcc.code);
  const isEligibleTransaction = isContactless || (merchant.isOnline && isEligibleMCC);
  
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
    
    const txAmount = Math.floor(tx.amount / 5) * 5;
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

// Simulate UOB Platinum points for a potential transaction
export const simulateUOBPlatinumPoints = (
  amount: number,
  mcc?: string,
  isOnline?: boolean,
  isContactless?: boolean,
  usedMonthlyBonusPoints: number = 0
): {
  totalPoints: number;
  basePoints: number;
  bonusPoints: number;
  remainingMonthlyBonusPoints: number;
} => {
  const roundedAmount = Math.floor(amount / 5) * 5;
  const basePoints = Math.round(roundedAmount * 0.4);
  
  const isEligibleMCC = mcc && UOB_PLATINUM_ELIGIBLE_MCCS.includes(mcc);
  const isEligibleTransaction = isContactless || (isOnline && isEligibleMCC);
  
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
