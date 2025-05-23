import { PaymentMethod } from '@/types';

// Default payment methods with proper UUID format
export const defaultPaymentMethods: PaymentMethod[] = [
  // Cash options for different currencies
  {
    id: 'c81d6e04-79bd-44da-8293-d951c35a8501',
    name: 'Cash (USD)',
    type: 'cash',
    currency: 'USD',
    rewardRules: [],
    active: true,
    icon: 'banknote',
    color: '#22c55e',
  },
  {
    id: 'c81d6e04-79bd-44da-8293-d951c35a8502',
    name: 'Cash (SGD)',
    type: 'cash',
    currency: 'SGD',
    rewardRules: [],
    active: true,
    icon: 'banknote',
    color: '#22c55e',
  },
  {
    id: 'c81d6e04-79bd-44da-8293-d951c35a8503',
    name: 'Cash (TWD)',
    type: 'cash',
    currency: 'TWD',
    rewardRules: [],
    active: true,
    icon: 'banknote',
    color: '#22c55e',
  },
  {
    id: 'c81d6e04-79bd-44da-8293-d951c35a8504',
    name: 'Cash (CAD)',
    type: 'cash',
    currency: 'CAD',
    rewardRules: [],
    active: true,
    icon: 'banknote',
    color: '#22c55e',
  },
  {
    id: 'c81d6e04-79bd-44da-8293-d951c35a8505',
    name: 'Cash (VND)',
    type: 'cash',
    currency: 'VND',
    rewardRules: [],
    active: true,
    icon: 'banknote',
    color: '#22c55e',
  },
  {
    id: 'c81d6e04-79bd-44da-8293-d951c35a8506',
    name: 'Cash (THB)',
    type: 'cash',
    currency: 'THB',
    rewardRules: [],
    active: true,
    icon: 'banknote',
    color: '#22c55e',
  },
  // Credit cards
  {
    id: 'b5ea3301-a599-47b9-9943-13410d48cdd6',
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
        id: 'b5ea3301-a599-47b9-9943-13410d48cdd7',
        name: 'Grocery Bonus',
        description: '6% back at U.S. supermarkets',
        cardTypeId: 'amex_blue_cash_preferred',
        enabled: true,
        priority: 10,
        conditions: [{
          type: 'mcc',
          operation: 'include',
          values: ['5411']
        }],
        reward: {
          calculationMethod: 'standard',
          baseMultiplier: 0.4,
          bonusMultiplier: 5.6,
          pointsRoundingStrategy: 'floor',
          amountRoundingStrategy: 'floor',
          blockSize: 1,
          monthlyCap: 6000,
          pointsCurrency: 'Cashback'
        },
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'b5ea3301-a599-47b9-9943-13410d48cdd8',
        name: 'Streaming Bonus',
        description: '6% back on select U.S. streaming',
        cardTypeId: 'amex_blue_cash_preferred',
        enabled: true,
        priority: 10,
        conditions: [{
          type: 'merchant',
          operation: 'include',
          values: ['Netflix', 'Spotify', 'Disney', 'Hulu', 'HBO']
        }],
        reward: {
          calculationMethod: 'standard',
          baseMultiplier: 0.4,
          bonusMultiplier: 5.6,
          pointsRoundingStrategy: 'floor',
          amountRoundingStrategy: 'floor',
          blockSize: 1,
          pointsCurrency: 'Cashback'
        },
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'b5ea3301-a599-47b9-9943-13410d48cdd9',
        name: 'Gas Bonus',
        description: '3% back at U.S. gas stations',
        cardTypeId: 'amex_blue_cash_preferred',
        enabled: true,
        priority: 10,
        conditions: [{
          type: 'mcc',
          operation: 'include',
          values: ['5541']
        }],
        reward: {
          calculationMethod: 'standard',
          baseMultiplier: 0.4,
          bonusMultiplier: 2.6,
          pointsRoundingStrategy: 'floor',
          amountRoundingStrategy: 'floor',
          blockSize: 1,
          pointsCurrency: 'Cashback'
        },
        createdAt: new Date(),
        updatedAt: new Date()
      },
    ],
  },
  {
    id: '2f6b1a24-7e3c-40b4-8582-97357f384612',
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
        id: '2f6b1a24-7e3c-40b4-8582-97357f384613',
        name: 'Travel Bonus',
        description: '3x points on travel',
        cardTypeId: 'chase_sapphire_reserve',
        enabled: true,
        priority: 10,
        conditions: [{
          type: 'mcc',
          operation: 'include',
          values: ['3000']
        }],
        reward: {
          calculationMethod: 'standard',
          baseMultiplier: 1,
          bonusMultiplier: 2,
          pointsRoundingStrategy: 'floor',
          amountRoundingStrategy: 'floor',
          blockSize: 1,
          pointsCurrency: 'Ultimate Rewards'
        },
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '2f6b1a24-7e3c-40b4-8582-97357f384614',
        name: 'Dining Bonus',
        description: '3x points on dining',
        cardTypeId: 'chase_sapphire_reserve',
        enabled: true,
        priority: 10,
        conditions: [{
          type: 'mcc',
          operation: 'include',
          values: ['5812']
        }],
        reward: {
          calculationMethod: 'standard',
          baseMultiplier: 1,
          bonusMultiplier: 2,
          pointsRoundingStrategy: 'floor',
          amountRoundingStrategy: 'floor',
          blockSize: 1,
          pointsCurrency: 'Ultimate Rewards'
        },
        createdAt: new Date(),
        updatedAt: new Date()
      },
    ],
  },
  {
    id: '9c5a3e87-1de4-4d1a-9ea3-ce8d932fe728',
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
    id: '7e8c1909-7cca-48e0-84c0-118a9d8fedf1',
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
      TWD: 0.042,
      VND: 0.000054,
      IDR: 0.000086,
      THB: 0.038,
      MYR: 0.31
    }
  },
  {
    id: 'd4b9c8a7-3f6e-42d1-b590-584f5e682ab3',
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
      TWD: 0.042,
      VND: 0.000054,
      IDR: 0.000086,
      THB: 0.038,
      MYR: 0.31
    }
  },
  {
    id: 'e5f7a9c2-1b3d-4e8f-a6c9-7d8e2f1b3a4c',
    name: 'Cobalt',
    type: 'credit_card',
    currency: 'CAD',
    issuer: 'American Express',
    lastFourDigits: '1234',
    statementStartDay: 1,
    isMonthlyStatement: true,
    active: true,
    icon: 'credit-card',
    color: '#6b21a8',
    rewardRules: [], // Special handling in rewards logic
  },
  {
    id: 'f6e8d7c5-a4b3-2c1d-e9f8-7d6e5f4a3b2c',
    name: 'Platinum Canada',
    type: 'credit_card',
    currency: 'CAD',
    issuer: 'American Express',
    lastFourDigits: '2345',
    statementStartDay: 1,
    isMonthlyStatement: true,
    active: true,
    icon: 'credit-card',
    color: '#7c3aed',
    rewardRules: [], // Special handling in rewards logic
  },
  {
    id: 'a1b2c3d4-e5f6-a7b8-c9d0-e1f2a3b4c5d6',
    name: 'Platinum Credit',
    type: 'credit_card',
    currency: 'USD',
    issuer: 'American Express',
    lastFourDigits: '3456',
    statementStartDay: 1,
    isMonthlyStatement: true,
    active: true,
    icon: 'credit-card',
    color: '#8b5cf6',
    rewardRules: [], // Special handling in rewards logic
  },
  {
    id: 'c5d6e7f8-a9b0-c1d2-e3f4-a5b6c7d8e9f0',
    name: 'Platinum Singapore',
    type: 'credit_card',
    currency: 'SGD',
    issuer: 'American Express',
    lastFourDigits: '4567',
    statementStartDay: 1,
    isMonthlyStatement: true,
    active: true,
    icon: 'credit-card',
    color: '#a78bfa',
    rewardRules: [], // Special handling in rewards logic
  },
  {
    id: 'd7e8f9a0-b1c2-d3e4-f5a6-b7c8d9e0f1a2',
    name: 'Aeroplan Visa Infinite',
    type: 'credit_card',
    currency: 'CAD',
    issuer: 'TD',
    lastFourDigits: '5678',
    statementStartDay: 1,
    isMonthlyStatement: true,
    active: true,
    icon: 'credit-card',
    color: '#c4b5fd',
    rewardRules: [], // Special handling in rewards logic
  },
  {
    id: 'b3c4d5e6-f7a8-b9c0-d1e2-f3a4b5c6d7e8',
    name: 'Lady\'s Solitaire',
    type: 'credit_card',
    currency: 'SGD',
    issuer: 'UOB',
    lastFourDigits: '6789',
    statementStartDay: 1,
    isMonthlyStatement: true,
    active: true,
    icon: 'credit-card',
    color: '#ddd6fe',
    rewardRules: [], // Special handling in rewards logic
  },
  // Add OCBC Rewards World Mastercard
  {
    id: 'e9f0a1b2-c3d4-e5f6-a7b8-c9d0e1f2a3b4',
    name: 'Rewards World Mastercard',
    type: 'credit_card',
    currency: 'SGD',
    issuer: 'OCBC',
    lastFourDigits: '8901',
    statementStartDay: 1,
    isMonthlyStatement: true,
    active: true,
    icon: 'credit-card',
    color: '#eb6e1f', // OCBC orange color
    rewardRules: [], // Special handling in RewardCalculationService
  },
  // Add DBS Woman's World MasterCard
  {
    id: 'f1e2d3c4-b5a6-4789-8765-4321abcdef12',
    name: 'Woman\'s World MasterCard',
    type: 'credit_card',
    currency: 'SGD',
    issuer: 'DBS',
    lastFourDigits: '1234',
    statementStartDay: 1,
    isMonthlyStatement: true,
    active: true,
    icon: 'credit-card',
    color: '#eb008b',
    rewardRules: [], // Special handling in rewardPoints.ts
  },
];

// Helper function to find cash payment method for a specific currency
export const findCashPaymentMethodForCurrency = (currency: string): PaymentMethod | undefined => {
  return defaultPaymentMethods.find(method => 
    method.type === 'cash' && method.currency === currency
  );
};
