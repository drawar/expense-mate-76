
// services/rewards/index.ts
import { Transaction, PaymentMethod } from '@/types';
import {
  CalculationInput,
  CalculationResult,
  RewardRule,
  TransactionType
} from './types';
import { RuleEngine } from './RuleEngine';
import { RuleRepository } from './RuleRepository';
import { CardRegistry } from './CardRegistry';
import { MonthlySpendingTracker } from './MonthlySpendingTracker';
import { rewardService } from './RewardCalculatorService';

/**
 * Initialize the reward system with read-only mode for expense submission
 * This ensures we don't accidentally modify rules during expense operations
 */
export const initializeRewardSystem = async (readOnly: boolean = false): Promise<void> => {
  try {
    console.log(`Initializing reward system (read-only: ${readOnly})`);
    // Set read-only mode on the repository
    const ruleRepository = RuleRepository.getInstance();
    ruleRepository.setReadOnly(readOnly);
    
    // Initialize the reward service
    await rewardService.initialize();
    console.log('Reward system initialized successfully');
  } catch (error) {
    console.error('Failed to initialize reward system:', error);
    throw error;
  }
};

/**
 * Calculate reward points for a transaction
 */
export async function calculateRewardPoints(transaction: Transaction): Promise<CalculationResult> {
  return rewardService.calculatePoints(transaction, 0);
}

/**
 * Simulate reward points for a transaction in the expense form
 * This is a READ-ONLY operation and should never modify rules
 */
export async function simulateRewardPoints(
  amount: number,
  currency: string,
  paymentMethod: PaymentMethod,
  mcc?: string,
  merchantName?: string,
  isOnline?: boolean,
  isContactless?: boolean
): Promise<CalculationResult> {
  return rewardService.simulatePoints(
    amount,
    currency,
    paymentMethod,
    mcc,
    merchantName,
    isOnline,
    isContactless
  );
}

// Format reward points message
export function formatRewardPointsMessage(
  points: number,
  bonusPoints: number = 0,
  remainingMonthlyBonusPoints?: number
): string | undefined {
  if (bonusPoints === 0 && remainingMonthlyBonusPoints === 0) {
    return "Monthly bonus points cap reached";
  } else if (bonusPoints === 0) {
    return "Not eligible for bonus points";
  } else if (bonusPoints > 0) {
    return `Earning ${bonusPoints} bonus points`;
  } else if (remainingMonthlyBonusPoints !== undefined) {
    return `${remainingMonthlyBonusPoints.toLocaleString()} bonus points remaining this month`;
  }
  return undefined;
}

// Re-export the types for easier access
export * from './types';

// Re-export the singleton instances
export { rewardService };
export { RuleRepository, CardRegistry, MonthlySpendingTracker };
