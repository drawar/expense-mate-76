import { Transaction, PaymentMethod, Merchant, Currency } from '@/types';

// LocalStorage keys
const TRANSACTIONS_KEY = 'expenseTracker_transactions';
const PAYMENT_METHODS_KEY = 'expenseTracker_paymentMethods';
const MERCHANTS_KEY = 'expenseTracker_merchants';

// Sample MCC codes
export const MCC_CODES = [
  { code: '5411', description: 'Grocery Stores & Supermarkets' },
  { code: '5812', description: 'Restaurants & Eating Places' },
  { code: '5814', description: 'Fast Food Restaurants' },
  { code: '5912', description: 'Drug Stores & Pharmacies' },
  { code: '5311', description: 'Department Stores' },
  { code: '5541', description: 'Gas Stations' },
  { code: '4121', description: 'Taxi & Limousines' },
  { code: '4112', description: 'Passenger Railways' },
  { code: '3000', description: 'Airlines' },
  { code: '7011', description: 'Hotels & Motels' },
  { code: '4814', description: 'Telecommunication Services' },
  { code: '4899', description: 'Cable & Streaming Services' },
  { code: '5699', description: 'Apparel & Accessories' },
  { code: '5945', description: 'Hobby, Toy & Game Shops' },
  { code: '7832', description: 'Movie Theaters' },
  { code: '5732', description: 'Electronics & Appliances' },
];

// Default payment methods
const defaultPaymentMethods: PaymentMethod[] = [
  {
    id: '1',
    name: 'Cash',
    type: 'cash',
    currency: 'USD',
    rewardRules: [],
    active: true,
    icon: 'banknote',
    color: '#22c55e',
  },
  {
    id: '2',
    name: 'Blue Cash Preferred',
    type: 'credit_card',
    currency: 'USD',
    issuer: 'American Express',
    lastFourDigits: '1234',
    statementStartDay: 15,
    isMonthlyStatement: true,
    active: true,
    icon: 'credit-card',
    color: '#3b82f6',
    rewardRules: [
      {
        id: '2-1',
        name: 'Grocery Bonus',
        description: '6% back at U.S. supermarkets',
        type: 'mcc',
        condition: '5411',
        pointsMultiplier: 6,
        maxSpend: 6000,
      },
      {
        id: '2-2',
        name: 'Streaming Bonus',
        description: '6% back on select U.S. streaming',
        type: 'merchant',
        condition: ['Netflix', 'Spotify', 'Disney', 'Hulu', 'HBO'],
        pointsMultiplier: 6,
      },
      {
        id: '2-3',
        name: 'Gas Bonus',
        description: '3% back at U.S. gas stations',
        type: 'mcc',
        condition: '5541',
        pointsMultiplier: 3,
      },
    ],
  },
  {
    id: '3',
    name: 'Chase Sapphire Reserve',
    type: 'credit_card',
    currency: 'USD',
    issuer: 'Chase',
    lastFourDigits: '5678',
    statementStartDay: 1,
    isMonthlyStatement: false,
    active: true,
    icon: 'credit-card',
    color: '#6366f1',
    rewardRules: [
      {
        id: '3-1',
        name: 'Travel Bonus',
        description: '3x points on travel',
        type: 'mcc',
        condition: '3000',
        pointsMultiplier: 3,
      },
      {
        id: '3-2',
        name: 'Dining Bonus',
        description: '3x points on dining',
        type: 'mcc',
        condition: '5812',
        pointsMultiplier: 3,
      },
    ],
  },
  {
    id: '4',
    name: 'Preferred Visa Platinum',
    type: 'credit_card',
    currency: 'SGD',
    issuer: 'UOB',
    lastFourDigits: '9012',
    statementStartDay: 1,
    isMonthlyStatement: false,
    active: true,
    icon: 'credit-card',
    color: '#1e3a8a',
    rewardRules: [], // Special handling in rewardPoints.ts
  },
  {
    id: '5',
    name: 'Visa Signature',
    type: 'credit_card',
    currency: 'SGD',
    issuer: 'UOB',
    lastFourDigits: '3456',
    statementStartDay: 1,
    isMonthlyStatement: true,
    active: true,
    icon: 'credit-card',
    color: '#7e22ce',
    rewardRules: [], // Special handling in rewardPoints.ts
    conversionRate: {
      USD: 1.35,
      EUR: 1.47,
      GBP: 1.73,
      SGD: 1,
      JPY: 0.0091,
      AUD: 0.89,
      CAD: 0.99,
      CNY: 0.19,
      INR: 0.016,
      NTD: 0.042,
      VND: 0.000054,
      IDR: 0.000086,
      THB: 0.038,
      MYR: 0.31
    }
  },
  {
    id: '6',
    name: 'Rewards Visa Signature',
    type: 'credit_card',
    currency: 'SGD',
    issuer: 'Citibank',
    lastFourDigits: '7890',
    statementStartDay: 1,
    isMonthlyStatement: true,
    active: true,
    icon: 'credit-card',
    color: '#0891b2',
    rewardRules: [], // Special handling in rewardPoints.ts
    conversionRate: {
      USD: 1.35,
      EUR: 1.47,
      GBP: 1.73,
      SGD: 1,
      JPY: 0.0091,
      AUD: 0.89,
      CAD: 0.99,
      CNY: 0.19,
      INR: 0.016,
      NTD: 0.042,
      VND: 0.000054,
      IDR: 0.000086,
      THB: 0.038,
      MYR: 0.31
    }
  },
];

// Save transactions to localStorage
export const saveTransactions = (transactions: Transaction[]): void => {
  localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(transactions));
};

// Get transactions from localStorage
export const getTransactions = (): Transaction[] => {
  const stored = localStorage.getItem(TRANSACTIONS_KEY);
  return stored ? JSON.parse(stored) : [];
};

// Save payment methods to localStorage
export const savePaymentMethods = (paymentMethods: PaymentMethod[]): void => {
  localStorage.setItem(PAYMENT_METHODS_KEY, JSON.stringify(paymentMethods));
};

// Get payment methods from localStorage or return defaults
export const getPaymentMethods = (): PaymentMethod[] => {
  const stored = localStorage.getItem(PAYMENT_METHODS_KEY);
  return stored ? JSON.parse(stored) : defaultPaymentMethods;
};

// Save merchants to localStorage
export const saveMerchants = (merchants: Merchant[]): void => {
  localStorage.setItem(MERCHANTS_KEY, JSON.stringify(merchants));
};

// Get merchants from localStorage
export const getMerchants = (): Merchant[] => {
  const stored = localStorage.getItem(MERCHANTS_KEY);
  return stored ? JSON.parse(stored) : [];
};

// Add a new merchant or update if already exists
export const addOrUpdateMerchant = (merchant: Merchant): Merchant => {
  const merchants = getMerchants();
  
  // Check if merchant with same name exists
  const existingIndex = merchants.findIndex(m => m.name.toLowerCase() === merchant.name.toLowerCase());
  
  if (existingIndex >= 0) {
    // Update existing merchant
    merchants[existingIndex] = {
      ...merchants[existingIndex],
      ...merchant,
      id: merchants[existingIndex].id,
    };
  } else {
    // Add new merchant
    merchant.id = Date.now().toString();
    merchants.push(merchant);
  }
  
  saveMerchants(merchants);
  return existingIndex >= 0 ? merchants[existingIndex] : merchant;
};

// Get merchant by name (case insensitive) or return undefined
export const getMerchantByName = (name: string): Merchant | undefined => {
  const merchants = getMerchants();
  return merchants.find(m => m.name.toLowerCase() === name.toLowerCase());
};

// Add a new transaction
export const addTransaction = (transaction: Omit<Transaction, 'id'>): Transaction => {
  const transactions = getTransactions();
  const newTransaction = {
    ...transaction,
    id: Date.now().toString(),
  };
  
  transactions.push(newTransaction);
  saveTransactions(transactions);
  return newTransaction as Transaction;
};

// Initialize storage with default data
export const initializeStorage = (): void => {
  // Set up default payment methods if none exist
  if (!localStorage.getItem(PAYMENT_METHODS_KEY)) {
    savePaymentMethods(defaultPaymentMethods);
  }
};
