import { Transaction, PaymentMethod } from "@/types";

export interface CardOptimizationInsight {
  category: string;
  currentMethod: string;
  suggestedMethod: string;
  potentialSavings: number;
  transactionCount: number;
}

export const analyzeTransactions = (
  transactions: Transaction[],
  paymentMethods: PaymentMethod[]
): CardOptimizationInsight[] => {
  const insights: CardOptimizationInsight[] = [];

  // Group transactions by category
  const transactionsByCategory: { [category: string]: Transaction[] } = {};
  transactions.forEach((transaction) => {
    if (transaction.category) {
      if (!transactionsByCategory[transaction.category]) {
        transactionsByCategory[transaction.category] = [];
      }
      transactionsByCategory[transaction.category].push(transaction);
    }
  });

  // Analyze each category
  for (const category in transactionsByCategory) {
    const transactions = transactionsByCategory[category];
    if (!transactions || transactions.length === 0) continue;

    // Find the most used payment method in this category
    const methodUsage: { [methodId: string]: number } = {};
    transactions.forEach((transaction) => {
      const methodId = transaction.paymentMethod.id;
      methodUsage[methodId] = (methodUsage[methodId] || 0) + 1;
    });

    const currentMethodId = Object.keys(methodUsage).reduce((a, b) =>
      methodUsage[a] > methodUsage[b] ? a : b
    );
    const currentMethod = paymentMethods.find(
      (method) => method.id === currentMethodId
    );

    if (!currentMethod) continue;

    // Find a better payment method (for simplicity, just a placeholder)
    const suggestedMethod = paymentMethods.find(
      (method) =>
        method.type === "credit_card" &&
        method.id !== currentMethodId &&
        method.active
    );

    if (!suggestedMethod) continue;

    // Calculate potential savings (placeholder)
    const potentialSavings = transactions.length * 0.5; // $0.5 per transaction

    insights.push({
      category,
      currentMethod: currentMethod.name,
      suggestedMethod: suggestedMethod.name,
      potentialSavings,
      transactionCount: transactions.length,
    });
  }

  return insights;
};

export const getMockTransactions = (): Transaction[] => {
  const mockPaymentMethods: PaymentMethod[] = [
    {
      id: "dbs-live-fresh",
      name: "DBS Live Fresh",
      type: "credit_card",
      currency: "SGD",
      issuer: "DBS",
      rewardRules: [],
      active: true,
    },
    {
      id: "uob-one",
      name: "UOB One Card",
      type: "credit_card",
      currency: "SGD",
      issuer: "UOB",
      rewardRules: [],
      active: true,
    },
    {
      id: "citi-rewards",
      name: "Citi Rewards Card",
      type: "credit_card",
      currency: "SGD",
      issuer: "Citi",
      rewardRules: [],
      active: true,
    },
  ];

  const mockTransactions: Transaction[] = [
    {
      id: "1",
      date: "2024-01-15",
      amount: 50,
      currency: "SGD",
      category: "Dining",
      merchant: {
        id: "mcd-001",
        name: "McDonald's",
        isOnline: false,
      },
      paymentAmount: 50,
      paymentCurrency: "SGD",
      paymentMethod: mockPaymentMethods[0],
      rewardPoints: 1,
      basePoints: 1,
      bonusPoints: 0,
      isContactless: false,
    },
  ];

  return [
    ...mockTransactions,
    {
      id: "2",
      date: "2024-01-16",
      amount: 100,
      currency: "SGD",
      category: "Groceries",
      merchant: {
        id: "ntuc-001",
        name: "NTUC FairPrice",
        isOnline: false,
      },
      paymentAmount: 100,
      paymentCurrency: "SGD",
      paymentMethod: mockPaymentMethods[1],
      rewardPoints: 2,
      basePoints: 2,
      bonusPoints: 0,
      isContactless: false,
    },
  ];
};
