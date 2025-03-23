
import { Transaction, PaymentMethod, RewardRule } from '@/types';
import { isDateInStatementPeriod } from './dateUtils';

// Calculate reward points for a single transaction
export const calculateTransactionPoints = (
  transaction: Transaction,
  allTransactions: Transaction[]
): number => {
  const { paymentMethod, merchant, amount, currency } = transaction;
  
  // Cash doesn't earn rewards
  if (paymentMethod.type === 'cash') {
    return 0;
  }
  
  // Get total spend in the current statement period for this payment method
  const statementTransactions = allTransactions.filter(
    (t) => t.paymentMethod.id === paymentMethod.id && 
    isDateInStatementPeriod(new Date(t.date), paymentMethod)
  );
  
  const totalStatementSpend = statementTransactions.reduce(
    (sum, tx) => sum + (tx.paymentCurrency === paymentMethod.currency ? tx.paymentAmount : 0),
    0
  );
  
  let points = 0;
  const basePointRate = 1; // Default 1 point per dollar/unit
  
  // Apply reward rules
  for (const rule of paymentMethod.rewardRules) {
    let ruleApplies = false;
    
    switch (rule.type) {
      case 'mcc':
        // Check if merchant category code matches
        ruleApplies = merchant.mcc?.code === rule.condition;
        break;
        
      case 'merchant':
        // Check if merchant name includes any of the specified strings
        if (Array.isArray(rule.condition)) {
          ruleApplies = rule.condition.some(name => 
            merchant.name.toLowerCase().includes(name.toLowerCase())
          );
        } else {
          ruleApplies = merchant.name.toLowerCase().includes(rule.condition.toLowerCase());
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

// Calculate points that would be earned for a potential transaction
export const simulateRewardPoints = (
  amount: number,
  currency: string,
  paymentMethod: PaymentMethod,
  mcc?: string,
  merchantName?: string
): number => {
  if (paymentMethod.type === 'cash') {
    return 0;
  }
  
  let points = 0;
  const basePointRate = 1;
  
  // Apply relevant reward rules
  for (const rule of paymentMethod.rewardRules) {
    let ruleApplies = false;
    
    switch (rule.type) {
      case 'mcc':
        ruleApplies = !!mcc && rule.condition === mcc;
        break;
        
      case 'merchant':
        if (merchantName && Array.isArray(rule.condition)) {
          ruleApplies = rule.condition.some(name => 
            merchantName.toLowerCase().includes(name.toLowerCase())
          );
        } else if (merchantName) {
          ruleApplies = merchantName.toLowerCase().includes((rule.condition as string).toLowerCase());
        }
        break;
        
      case 'currency':
        ruleApplies = currency === rule.condition;
        break;
        
      case 'spend_threshold':
        // This would require knowing the current statement spend, which we don't have in this simulation
        // So we'll assume the user is within the threshold
        ruleApplies = true;
        break;
    }
    
    if (ruleApplies) {
      points = amount * basePointRate * rule.pointsMultiplier;
      break;
    }
  }
  
  if (points === 0) {
    points = amount * basePointRate;
  }
  
  return Math.round(points);
};
