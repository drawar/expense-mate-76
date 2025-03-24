
import { Transaction } from '@/types';
import { calculateBasicPoints } from '../../rewards/baseCalculations';

export const calculatePoints = (transaction: Omit<Transaction, 'id'>): number => {
  if (transaction.paymentMethod.type === 'cash') {
    return 0;
  }
  
  if (transaction.paymentMethod.type === 'credit_card') {
    const basePoints = Math.round(transaction.amount * 0.4);
    
    if (transaction.paymentMethod.issuer === 'UOB' && transaction.isContactless) {
      return Math.round(basePoints * 1.2);
    }
    
    const isDining = transaction.category === 'Food & Drinks' || 
                    (transaction.merchant.mcc?.code && ['5811', '5812', '5813', '5814'].includes(transaction.merchant.mcc.code));
    
    if (isDining && ['UOB', 'Citibank'].includes(transaction.paymentMethod.issuer || '')) {
      return Math.round(basePoints * 2);
    }
    
    return basePoints;
  }
  
  return 0;
};
