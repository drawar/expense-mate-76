
import { Transaction, PaymentMethod } from '@/types';
import { CalculationResult } from '@/types';
import { rewardService } from './RewardService';
import { RuleRepository } from './RuleRepository';
import { DateTime } from 'luxon';

export const initializeRewardSystem = async (readOnly: boolean = false): Promise<void> => {
  try {
    console.log(`Initializing reward system (read-only: ${readOnly})`);
    // Set read-only mode on the repository
    const ruleRepository = RuleRepository.getInstance();
    ruleRepository.setReadOnly(readOnly);
    
    console.log('Reward system initialized successfully');
  } catch (error) {
    console.error('Failed to initialize reward system:', error);
    throw error;
  }
};

export async function calculateRewardPoints(transaction: Transaction): Promise<CalculationResult> {
  const input = {
    amount: transaction.amount,
    currency: transaction.currency,
    paymentMethod: transaction.paymentMethod,
    mcc: transaction.merchant.mcc?.code,
    merchantName: transaction.merchant.name,
    transactionType: 'purchase' as const,
    isOnline: transaction.merchant.isOnline,
    isContactless: transaction.isContactless,
    date: DateTime.fromISO(transaction.date)
  };
  
  return rewardService.calculateRewards(input);
}

export async function simulateRewardPoints(
  amount: number,
  currency: string,
  paymentMethod: PaymentMethod,
  mcc?: string,
  merchantName?: string,
  isOnline?: boolean,
  isContactless?: boolean
): Promise<CalculationResult> {
  const input = {
    amount,
    currency,
    paymentMethod,
    mcc,
    merchantName,
    transactionType: 'purchase' as const,
    isOnline,
    isContactless,
    date: DateTime.now()
  };
  
  return rewardService.calculateRewards(input);
}

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

// Re-export the singleton instances
export { rewardService, RuleRepository };
