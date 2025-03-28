import { Transaction, PaymentMethod } from '@/types';

/**
 * Calculate the optimal payment method for a given transaction
 * based on reward points, merchant category codes, and other factors
 */
export const calculateOptimalCard = (
  transaction: Transaction,
  paymentMethods: PaymentMethod[]
): PaymentMethod | null => {
  // Only consider credit cards
  const creditCards = paymentMethods.filter(
    method => method.type === 'credit_card' && method.active
  );
  
  if (creditCards.length === 0) return null;
  
  // Calculate estimated points for each card
  const cardScores = creditCards.map(card => {
    let pointsEstimate = 0;
    
    // Basic points (1 point per dollar is standard)
    pointsEstimate += transaction.amount;
    
    // Check for bonus categories based on reward rules
    if (card.rewardRules && card.rewardRules.length > 0) {
      for (const rule of card.rewardRules) {
        let ruleApplies = false;
        
        // Check if rule applies based on type
        if (rule.type === 'mcc' && transaction.merchant.mcc?.code === rule.condition) {
          ruleApplies = true;
        } else if (rule.type === 'merchant' && Array.isArray(rule.condition)) {
          // Check if merchant name contains any of the keywords
          ruleApplies = rule.condition.some(keyword => 
            transaction.merchant.name.toLowerCase().includes(keyword.toLowerCase())
          );
        } else if (transaction.category && rule.condition === transaction.category) {
          // Generic condition match against transaction category
          ruleApplies = true;
        }
        
        // Apply bonus multiplier if rule applies
        if (ruleApplies) {
          // Calculate bonus points (multiplier - 1 because base points are already counted)
          const bonusMultiplier = rule.pointsMultiplier - 1;
          const bonusPoints = transaction.amount * bonusMultiplier;
          
          // Check for spending caps
          if (rule.maxSpend) {
            // This is a simplified check - in a real implementation, 
            // you'd need to track year-to-date spend in each category
            pointsEstimate += Math.min(bonusPoints, rule.maxSpend * bonusMultiplier);
          } else {
            pointsEstimate += bonusPoints;
          }
          
          // Once we find a matching rule, no need to check others
          // (assuming rules don't stack - modify if they do)
          break;
        }
      }
    }
    
    return {
      card,
      pointsEstimate
    };
  });
  
  // Sort by estimated points (highest first)
  cardScores.sort((a, b) => b.pointsEstimate - a.pointsEstimate);
  
  // Return the card with the highest score
  return cardScores.length > 0 ? cardScores[0].card : null;
};

/**
 * Calculate the total missed optimization opportunities in a set of transactions
 */
export const calculateMissedOptimization = (
  transactions: Transaction[],
  paymentMethods: PaymentMethod[]
): {
  missedPoints: number;
  suboptimalTransactions: Transaction[];
  optimizationScore: number;
} => {
  let totalMissedPoints = 0;
  let totalPotentialPoints = 0;
  let totalActualPoints = 0;
  const suboptimalTransactions: Transaction[] = [];
  
  transactions.forEach(transaction => {
    const optimalCard = calculateOptimalCard(transaction, paymentMethods);
    const actualPoints = transaction.rewardPoints || 0;
    totalActualPoints += actualPoints;
    
    if (optimalCard && optimalCard.id !== transaction.paymentMethod.id) {
      // Calculate estimated potential points
      // In a real implementation, you'd use your reward calculation logic
      
      // For now, use a simplified estimate (30% better)
      const estimatedOptimalPoints = actualPoints * 1.3;
      const missedPoints = estimatedOptimalPoints - actualPoints;
      
      totalMissedPoints += missedPoints;
      totalPotentialPoints += estimatedOptimalPoints;
      suboptimalTransactions.push(transaction);
    } else {
      totalPotentialPoints += actualPoints;
    }
  });
  
  // Calculate optimization score (0-100)
  const optimizationScore = totalPotentialPoints > 0 
    ? Math.round((totalActualPoints / totalPotentialPoints) * 100) 
    : 100;
  
  return {
    missedPoints: Math.round(totalMissedPoints),
    suboptimalTransactions,
    optimizationScore
  };
};

/**
 * Get the best card recommendation for future purchases
 */
export const getBestCardRecommendation = (
  transactions: Transaction[],
  paymentMethods: PaymentMethod[]
): { card: PaymentMethod; category: string } | null => {
  // Get active cards
  const activeCards = paymentMethods.filter(
    method => method.type === 'credit_card' && method.active
  );
  
  if (activeCards.length === 0 || transactions.length === 0) return null;
  
  // Find the most frequent category
  const categoryCounts = transactions.reduce((acc, tx) => {
    const category = tx.category;
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  // Find the most common category
  const mostCommonCategory = Object.entries(categoryCounts)
    .sort((a, b) => b[1] - a[1])[0][0];
  
  // Create a dummy transaction with this category
  const dummyTransaction: Transaction = {
    id: 'dummy',
    date: new Date().toISOString(),
    amount: 100, // Arbitrary amount
    currency: 'USD',
    category: mostCommonCategory,
    merchant: {
      id: 'dummy-merchant',
      name: mostCommonCategory, // Using category as merchant name
      isOnline: false
    },
    paymentAmount: 100,
    paymentCurrency: 'USD',
    paymentMethod: activeCards[0], // Placeholder
    rewardPoints: 0
  };
  
  // Find the best card for this category
  const bestCard = calculateOptimalCard(dummyTransaction, paymentMethods);
  
  if (!bestCard) return null;
  
  return {
    card: bestCard,
    category: mostCommonCategory
  };
};
