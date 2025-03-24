
import { Transaction } from '@/types';

interface PointsBreakdown {
  basePoints: number;
  bonusPoints: number;
  totalPoints: number;
}

export const calculatePoints = (transaction: Omit<Transaction, 'id'>): PointsBreakdown => {
  if (transaction.paymentMethod.type === 'cash') {
    return {
      basePoints: 0,
      bonusPoints: 0,
      totalPoints: 0
    };
  }
  
  // Round down the amount to integer for consistent calculation with simulation
  const roundedAmount = Math.floor(transaction.amount / 5);
  let basePoints = roundedAmount * 2; // Use Math.floor to match simulation logic
  let bonusPoints = 0;
  
  // Calculate bonus points based on card type and conditions
  if (transaction.paymentMethod.issuer === 'UOB' && 
      transaction.paymentMethod.name === 'Preferred Visa Platinum') {
    if (transaction.isContactless) {
      // For UOB Preferred Visa Platinum with contactless payment,
      // calculate points exactly as in simulation logic
      bonusPoints = roundedAmount * 18; // 
    }
  } else if (transaction.paymentMethod.issuer === 'Citibank' && 
             transaction.paymentMethod.name === 'Rewards Visa Signature') {
    const eligibleMCCs = ['5311', '5611', '5621', '5631', '5641', '5651', '5655', '5661', '5691', '5699', '5948'];
    const isEligibleTransaction = (transaction.merchant.isOnline && !transaction.merchant.mcc?.code) || 
                                (transaction.merchant.mcc?.code && eligibleMCCs.includes(transaction.merchant.mcc.code));
    
    if (isEligibleTransaction) {
      bonusPoints = roundedAmount * 18; // 
    }
  }
  
  // Ensure consistent rounding between simulation and actual calculation
  return {
    basePoints,
    bonusPoints,
    totalPoints: basePoints + bonusPoints
  };
};
