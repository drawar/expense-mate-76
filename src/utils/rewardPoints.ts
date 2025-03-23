
import { Transaction, PaymentMethod, RewardRule } from '@/types';
import { isDateInStatementPeriod } from './dateUtils';
import { startOfMonth, endOfMonth, isSameMonth } from 'date-fns';

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
  
  // Special case for UOB Preferred Visa Platinum
  if (paymentMethod.issuer === 'UOB' && paymentMethod.name === 'Preferred Visa Platinum') {
    return calculateUOBPlatinumPoints(transaction, allTransactions);
  }
  
  // Special case for UOB Visa Signature
  if (paymentMethod.issuer === 'UOB' && paymentMethod.name === 'Visa Signature') {
    return calculateUOBSignaturePoints(transaction, allTransactions);
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

// Special calculation for UOB Preferred Visa Platinum
const calculateUOBPlatinumPoints = (
  transaction: Transaction,
  allTransactions: Transaction[]
): number => {
  const { amount, merchant, isContactless } = transaction;
  
  // Round down to nearest multiple of 5
  const roundedAmount = Math.floor(amount / 5) * 5;
  
  // Calculate base points (0.4x rounded amount)
  const basePoints = roundedAmount * 0.4;
  
  // Check if transaction is eligible for bonus points
  const eligibleMCCs = [
    '4816', '5262', '5306', '5309', '5310', '5311', '5331', '5399', 
    '5611', '5621', '5631', '5641', '5651', '5661', '5691', '5699',
    '5732', '5733', '5734', '5735', '5912', '5942', '5944', '5945',
    '5946', '5947', '5948', '5949', '5964', '5965', '5966', '5967',
    '5968', '5969', '5970', '5992', '5999', '5811', '5812', '5814',
    '5333', '5411', '5441', '5462', '5499', '8012', '9751', '7278',
    '7832', '7841', '7922', '7991', '7996', '7998', '7999'
  ];
  
  const isEligibleMCC = merchant.mcc && eligibleMCCs.includes(merchant.mcc.code);
  const isEligibleTransaction = isContactless || (merchant.isOnline && isEligibleMCC);
  
  if (!isEligibleTransaction) {
    return Math.round(basePoints);
  }
  
  // Calculate total bonus points earned this calendar month
  const currentDate = new Date(transaction.date);
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  
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

// Special calculation for UOB Visa Signature
const calculateUOBSignaturePoints = (
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
  
  // Special case for UOB Preferred Visa Platinum
  if (paymentMethod.issuer === 'UOB' && paymentMethod.name === 'Preferred Visa Platinum') {
    const roundedAmount = Math.floor(amount / 5) * 5;
    const basePoints = roundedAmount * 0.4;
    
    const eligibleMCCs = [
      '4816', '5262', '5306', '5309', '5310', '5311', '5331', '5399', 
      '5611', '5621', '5631', '5641', '5651', '5661', '5691', '5699',
      '5732', '5733', '5734', '5735', '5912', '5942', '5944', '5945',
      '5946', '5947', '5948', '5949', '5964', '5965', '5966', '5967',
      '5968', '5969', '5970', '5992', '5999', '5811', '5812', '5814',
      '5333', '5411', '5441', '5462', '5499', '8012', '9751', '7278',
      '7832', '7841', '7922', '7991', '7996', '7998', '7999'
    ];
    
    const isEligibleMCC = mcc && eligibleMCCs.includes(mcc);
    const isEligibleTransaction = isContactless || (isOnline && isEligibleMCC);
    
    if (!isEligibleTransaction) {
      return {
        totalPoints: Math.round(basePoints),
        basePoints: Math.round(basePoints),
        bonusPoints: 0,
        remainingMonthlyBonusPoints: 4000
      };
    }
    
    const bonusPoints = Math.min(roundedAmount * 3.6, 4000);
    
    return {
      totalPoints: Math.round(basePoints + bonusPoints),
      basePoints: Math.round(basePoints),
      bonusPoints: Math.round(bonusPoints),
      remainingMonthlyBonusPoints: 4000 - Math.round(bonusPoints)
    };
  }
  
  // Special case for UOB Visa Signature
  if (paymentMethod.issuer === 'UOB' && paymentMethod.name === 'Visa Signature') {
    const roundedAmount = Math.floor(amount / 5) * 5;
    const basePoints = (roundedAmount / 5) * 2;
    
    // For simulation, we can only show basic points since we don't know other transactions
    return {
      totalPoints: Math.round(basePoints),
      basePoints: Math.round(basePoints),
      bonusPoints: 0
    };
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
  
  return { totalPoints: Math.round(points) };
};
