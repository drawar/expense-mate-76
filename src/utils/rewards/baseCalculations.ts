
import { Transaction, PaymentMethod, RewardRule } from '@/types';
import { isDateInStatementPeriod } from '../dateUtils';

// Calculate basic reward points based on reward rules
export const calculateBasicPoints = (
  amount: number,
  currency: string,
  paymentMethod: PaymentMethod,
  merchantMCC?: string,
  merchantName?: string,
  isOnline?: boolean,
  statementTransactions?: Transaction[]
): number => {
  // Cash doesn't earn rewards
  if (paymentMethod.type === 'cash') {
    return 0;
  }
  
  // Get total spend in the current statement period for this payment method
  const totalStatementSpend = statementTransactions?.reduce(
    (sum, tx) => sum + (tx.paymentCurrency === paymentMethod.currency ? tx.paymentAmount : 0),
    0
  ) || 0;
  
  let points = 0;
  const basePointRate = 1; // Default 1 point per dollar/unit
  
  // Apply reward rules
  for (const rule of paymentMethod.rewardRules) {
    let ruleApplies = false;
    
    switch (rule.type) {
      case 'mcc':
        // Check if merchant category code matches
        ruleApplies = merchantMCC === rule.condition;
        break;
        
      case 'merchant':
        // Check if merchant name includes any of the specified strings
        if (Array.isArray(rule.condition)) {
          ruleApplies = rule.condition.some(name => 
            merchantName?.toLowerCase().includes(name.toLowerCase())
          );
        } else {
          ruleApplies = merchantName?.toLowerCase().includes((rule.condition as string).toLowerCase()) || false;
        }
        break;
        
      case 'currency':
        // Check if transaction currency matches
        ruleApplies = currency === rule.condition;
        break;
        
      case 'spend_threshold':
        // Check if total statement spend is within the threshold
        ruleApplies = (!rule.minSpend || totalStatementSpend >= rule.minSpend) && 
                     (!rule.maxSpend || totalStatementSpend <= rule.maxSpend);
        break;
    }
    
    // If rule applies, calculate points
    if (ruleApplies) {
      points = amount * basePointRate * rule.pointsMultiplier;
      break; // Use the first applicable rule
    }
  }
  
  // If no specific rule applied, use the base rate
  if (points === 0) {
    points = amount * basePointRate;
  }
  
  return Math.round(points);
};

// Get total reward points earned across all transactions
export const getTotalRewardPoints = (transactions: Transaction[]): number => {
  return transactions.reduce((total, transaction) => total + transaction.rewardPoints, 0);
};
