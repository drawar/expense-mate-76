import { PaymentMethod, Transaction } from '@/types';
import { v4 as uuidv4 } from 'uuid';

// Function to calculate total spend for a given category
export const calculateCategorySpend = (transactions: Transaction[], category: string): number => {
  return transactions
    .filter(transaction => transaction.category === category)
    .reduce((sum, transaction) => sum + transaction.amount, 0);
};

// Function to calculate total rewards earned for a given category
export const calculateCategoryRewards = (transactions: Transaction[], category: string): number => {
  return transactions
    .filter(transaction => transaction.category === category)
    .reduce((sum, transaction) => sum + (transaction.rewardPoints || 0), 0);
};

// Function to identify top spending categories
export const identifyTopSpendingCategories = (transactions: Transaction[], limit: number = 3): { category: string, spend: number }[] => {
  const categorySpend: { [category: string]: number } = {};

  transactions.forEach(transaction => {
    if (transaction.category) {
      categorySpend[transaction.category] = (categorySpend[transaction.category] || 0) + transaction.amount;
    }
  });

  return Object.entries(categorySpend)
    .sort(([, a], [, b]) => b - a)
    .slice(0, limit)
    .map(([category, spend]) => ({ category, spend }));
};

// Function to identify underutilized payment methods
export const identifyUnderutilizedPaymentMethods = (transactions: Transaction[], paymentMethods: PaymentMethod[], minTransactions: number = 5): PaymentMethod[] => {
  const paymentMethodUsage: { [id: string]: number } = {};

  transactions.forEach(transaction => {
    paymentMethodUsage[transaction.paymentMethod.id] = (paymentMethodUsage[transaction.paymentMethod.id] || 0) + 1;
  });

  return paymentMethods.filter(paymentMethod => (paymentMethodUsage[paymentMethod.id] || 0) < minTransactions);
};

// Function to calculate potential rewards with an alternative card
export const calculatePotentialRewards = (transactions: Transaction[], category: string, alternativePaymentMethod: PaymentMethod): number => {
  // Mock transaction data for reward calculation
  const mockTransaction = {
    id: uuidv4(),
    date: new Date().toISOString(),
    amount: 100, // Assume a standard transaction amount
    currency: 'SGD',
    category,
    merchant: {
      id: 'mock-merchant',
      name: 'Mock Merchant',
      isOnline: false
    },
    paymentAmount: 100,
    paymentCurrency: 'SGD',
    paymentMethod: alternativePaymentMethod,
    rewardPoints: Math.round(100 * 0.02), // Assume a 2% reward rate
    isContactless: false
  };

  // Simulate reward calculation based on the alternative payment method
  return mockTransaction.rewardPoints || 0;
};

// Function to suggest alternative payment methods for specific categories
export const suggestAlternativePaymentMethods = (transactions: Transaction[], paymentMethods: PaymentMethod[], category: string): PaymentMethod[] => {
  // Filter payment methods that offer higher rewards for the given category
  return paymentMethods.filter(paymentMethod => {
    const currentRewards = calculateCategoryRewards(transactions, category);
    const potentialRewards = calculatePotentialRewards(transactions, category, paymentMethod);
    return potentialRewards > currentRewards;
  });
};

// Function to analyze spending patterns and provide personalized recommendations
export const analyzeSpendingPatterns = (transactions: Transaction[], paymentMethods: PaymentMethod[]): { topCategories: { category: string, spend: number }[], underutilizedMethods: PaymentMethod[] } => {
  // Identify top spending categories
  const topCategories = identifyTopSpendingCategories(transactions);

  // Identify underutilized payment methods
  const underutilizedMethods = identifyUnderutilizedPaymentMethods(transactions, paymentMethods);

  return { topCategories, underutilizedMethods };
};

// Function to calculate total spend
export const calculateTotalSpend = (transactions: Transaction[]): number => {
  return transactions.reduce((sum, transaction) => sum + transaction.amount, 0);
};

// Function to calculate total rewards earned
export const calculateTotalRewards = (transactions: Transaction[]): number => {
  return transactions.reduce((sum, transaction) => sum + (transaction.rewardPoints || 0), 0);
};

// Function to calculate rewards rate
export const calculateRewardsRate = (transactions: Transaction[]): number => {
  const totalSpend = calculateTotalSpend(transactions);
  const totalRewards = calculateTotalRewards(transactions);
  return totalSpend > 0 ? totalRewards / totalSpend : 0;
};

// Function to identify high-spend transactions
export const identifyHighSpendTransactions = (transactions: Transaction[], threshold: number = 100): Transaction[] => {
  return transactions.filter(transaction => transaction.amount > threshold);
};

// Function to identify potential savings by consolidating transactions
export const identifyPotentialSavings = (transactions: Transaction[], paymentMethods: PaymentMethod[]): number => {
  let potentialSavings = 0;

  // Analyze each transaction
  transactions.forEach(transaction => {
    // Find alternative payment methods that offer higher rewards
    const alternativeMethods = suggestAlternativePaymentMethods(transactions, paymentMethods, transaction.category || 'Uncategorized');

    // Calculate potential savings
    if (alternativeMethods.length > 0) {
      const potentialRewards = calculatePotentialRewards(transactions, transaction.category || 'Uncategorized', alternativeMethods[0]);
      potentialSavings += potentialRewards - (transaction.rewardPoints || 0);
    }
  });

  return potentialSavings;
};

// Function to provide personalized recommendations for card optimization
export const provideCardOptimizationRecommendations = (transactions: Transaction[], paymentMethods: PaymentMethod[]): { topCategories: { category: string, spend: number }[], underutilizedMethods: PaymentMethod[], potentialSavings: number } => {
  // Analyze spending patterns
  const { topCategories, underutilizedMethods } = analyzeSpendingPatterns(transactions, paymentMethods);

  // Calculate potential savings
  const potentialSavings = identifyPotentialSavings(transactions, paymentMethods);

  return { topCategories, underutilizedMethods, potentialSavings };
};

// Function to generate mock transaction data
const generateMockTransactions = (paymentMethods: PaymentMethod[]): Transaction[] => {
  const categories = ['Food', 'Shopping', 'Travel', 'Entertainment'];
  const transactions: Transaction[] = [];

  for (let i = 0; i < 100; i++) {
    const category = categories[Math.floor(Math.random() * categories.length)];
    const amount = Math.random() * 100;
    const paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];

    transactions.push({
      id: uuidv4(),
      date: new Date().toISOString(),
      amount,
      currency: 'SGD',
      category,
      merchant: {
        id: 'mock-merchant',
        name: 'Mock Merchant',
        isOnline: false
      },
      paymentAmount: amount,
      paymentCurrency: 'SGD',
      paymentMethod,
      rewardPoints: Math.round(amount * 0.02),
      isContactless: false
    });
  }

  return transactions;
};

// Function to generate mock payment method data
const generateMockPaymentMethods = (): PaymentMethod[] => {
  const paymentMethods: PaymentMethod[] = [
    {
      id: uuidv4(),
      name: 'DBS Visa',
      type: 'credit_card',
      currency: 'SGD',
      rewardRules: [],
      active: true
    },
    {
      id: uuidv4(),
      name: 'UOB Mastercard',
      type: 'credit_card',
      currency: 'SGD',
      rewardRules: [],
      active: true
    },
    {
      id: uuidv4(),
      name: 'OCBC 365',
      type: 'credit_card',
      currency: 'SGD',
      rewardRules: [],
      active: true
    }
  ];

  return paymentMethods;
};

// Function to simulate card optimization analysis
export const simulateCardOptimizationAnalysis = (): { topCategories: { category: string, spend: number }[], underutilizedMethods: PaymentMethod[], potentialSavings: number } => {
  // Generate mock data
  const paymentMethods = generateMockPaymentMethods();
  const transactions = generateMockTransactions(paymentMethods);

  // Perform card optimization analysis
  const { topCategories, underutilizedMethods, potentialSavings } = provideCardOptimizationRecommendations(transactions, paymentMethods);

  return { topCategories, underutilizedMethods, potentialSavings };
};

// Fix the transaction mock to include the isContactless property
const mockTransaction = (category: string, amount: number, paymentMethod: PaymentMethod): Transaction => {
  return {
    id: uuidv4(),
    date: new Date().toISOString(),
    amount,
    currency: 'SGD',
    category,
    merchant: {
      id: 'mock-merchant',
      name: 'Mock Merchant',
      isOnline: false
    },
    paymentAmount: amount,
    paymentCurrency: 'SGD',
    paymentMethod,
    rewardPoints: Math.round(amount),
    isContactless: false // Add the missing property
  };
};

// Function to analyze card optimization
export const analyzeCardOptimization = (
  transactions: Transaction[],
  paymentMethods: PaymentMethod[]
): CardOptimizationInsight[] => {
  const currentCard = paymentMethods.find(method => method.active);

  const sampleTransactions: Transaction[] = [
    {
      id: 'sample-1',
      date: '2024-01-01',
      amount: 150,
      currency: 'SGD',
      category: 'Dining',
      merchant: {
        id: 'merchant-1',
        name: 'Restaurant ABC',
        isOnline: false
      },
      paymentAmount: 150,
      paymentCurrency: 'SGD',
      paymentMethod: currentCard,
      rewardPoints: 1,
      basePoints: 1,
      bonusPoints: 0,
      isContactless: false
    },
    {
      id: 'sample-2',
      date: '2024-01-02',
      amount: 200,
      currency: 'SGD',
      category: 'Shopping',
      merchant: {
        id: 'merchant-2',
        name: 'Online Store XYZ',
        isOnline: true
      },
      paymentAmount: 200,
      paymentCurrency: 'SGD',
      paymentMethod: currentCard,
      rewardPoints: 2,
      basePoints: 2,
      bonusPoints: 0,
      isContactless: false
    },
    {
      id: 'sample-3',
      date: '2024-01-03',
      amount: 100,
      currency: 'SGD',
      category: 'Travel',
      merchant: {
        id: 'merchant-3',
        name: 'Airline ABC',
        isOnline: false
      },
      paymentAmount: 100,
      paymentCurrency: 'SGD',
      paymentMethod: currentCard,
      rewardPoints: 1,
      basePoints: 1,
      bonusPoints: 0,
      isContactless: false
    },
    {
      id: 'sample-4',
      date: '2024-01-04',
      amount: 300,
      currency: 'SGD',
      category: 'Entertainment',
      merchant: {
        id: 'merchant-4',
        name: 'Movie Theater XYZ',
        isOnline: false
      },
      paymentAmount: 300,
      paymentCurrency: 'SGD',
      paymentMethod: currentCard,
      rewardPoints: 3,
      basePoints: 3,
      bonusPoints: 0,
      isContactless: false
    }
  ];

  const mockCards: PaymentMethod[] = [
    {
      id: 'uob-preferred',
      name: 'UOB Preferred Platinum Visa',
      type: 'credit_card',
      issuer: 'UOB',
      currency: 'SGD',
      rewardRules: [],
      active: true
    },
    {
      id: 'dbs-altitude',
      name: 'DBS Altitude Visa Signature',
      type: 'credit_card',
      issuer: 'DBS',
      currency: 'SGD',
      rewardRules: [],
      active: true
    },
    {
      id: 'citi-rewards',
      name: 'Citibank Rewards Visa',
      type: 'credit_card',
      issuer: 'Citibank',
      currency: 'SGD',
      rewardRules: [],
      active: true
    }
  ];

  return [{
    id: 'sample-optimization',
    type: 'better_card',
    title: 'Consider UOB Preferred Platinum for Dining',
    description: 'You could earn 5x more points on dining with UOB Preferred Platinum',
    potentialSavings: 45,
    currentCard: currentCard.name,
    recommendedCard: 'UOB Preferred Platinum Visa',
    category: 'Dining',
    transactions: sampleTransactions.map(tx => ({
      ...tx,
      basePoints: tx.basePoints || 0,
      bonusPoints: tx.bonusPoints || 0
    })),
    impact: 'high'
  }];
};
