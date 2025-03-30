// src/utils/storage/transactions/calculations.ts
import { Transaction } from '@/types';
import { rewardCalculationService } from '@/services/RewardCalculationService';

interface PointsBreakdown {
  basePoints: number;
  bonusPoints: number;
  totalPoints: number;
}

export const calculatePoints = (transaction: Omit<Transaction, 'id'>): PointsBreakdown => {
  if (transaction.paymentMethod.type === 'cash') {
    return {
      basePoints: 0,
      bonusPoints: 0,
      totalPoints: 0
    };
  }
  
  // This function is now a thin wrapper around the RewardCalculationService
  // Note: In a real implementation, we would fetch the used bonus points for the month
  // For now, we'll assume 0 used points
  const usedBonusPoints = 0; // Replace with actual bonus points tracking
  
  // Use the centralized service to calculate points
  return rewardCalculationService.calculatePoints(transaction as Transaction, usedBonusPoints);
};
