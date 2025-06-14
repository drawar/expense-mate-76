
import { Transaction, PaymentMethod } from '@/types';
import { CalculationResult } from '@/types';
import { rewardService } from './RewardService';
import { RuleRepository, initializeRuleRepository } from './RuleRepository';
import { supabase } from '@/integrations/supabase/client';
import { DateTime } from 'luxon';

export const initializeRewardSystem = async (readOnly: boolean = false): Promise<void> => {
  try {
    console.log(`Initializing reward system (read-only: ${readOnly})`);
    
    // Initialize the rule repository with supabase client
    const ruleRepository = initializeRuleRepository(supabase);
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
  return rewardService.simulateRewards(
    amount,
    currency,
    paymentMethod,
    mcc,
    merchantName,
    isOnline,
    isContactless
  );
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
