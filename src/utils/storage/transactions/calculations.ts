
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
  
  const roundedAmount = Math.floor(transaction.amount);
  let basePoints = Math.round(roundedAmount * 0.4);
  let bonusPoints = 0;
  
  // Calculate bonus points based on card type and conditions
  if (transaction.paymentMethod.issuer === 'UOB' && 
      transaction.paymentMethod.name === 'Preferred Visa Platinum') {
    if (transaction.isContactless) {
      // For UOB Preferred Visa Platinum with contactless payment,
      // the bonus multiplier should be 4x (base points earn 0.4x per $1, contactless earns 4x = 1.6x)
      bonusPoints = Math.round(basePoints * 4); // 4x base points as bonus
    }
  } else if (transaction.paymentMethod.issuer === 'Citibank' && 
             transaction.paymentMethod.name === 'Rewards Visa Signature') {
    const eligibleMCCs = ['5311', '5611', '5621', '5631', '5641', '5651', '5655', '5661', '5691', '5699', '5948'];
    const isEligibleTransaction = (transaction.merchant.isOnline && !transaction.merchant.mcc?.code) || 
                                (transaction.merchant.mcc?.code && eligibleMCCs.includes(transaction.merchant.mcc.code));
    
    if (isEligibleTransaction) {
      bonusPoints = Math.round(basePoints * 4); // 4x base points as bonus
    }
  }
  
  return {
    basePoints,
    bonusPoints,
    totalPoints: basePoints + bonusPoints
  };
};
