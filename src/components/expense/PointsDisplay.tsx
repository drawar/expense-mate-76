
import React from 'react';
import { GenericPointsCard } from './cards/GenericPointsCard';
import { PaymentMethod } from '@/types';
import { rewardCalculationService } from '@/services/RewardCalculationService';

interface PointsDisplayProps {
  selectedPaymentMethod: PaymentMethod | undefined;
  estimatedPoints: number | {
    totalPoints: number;
    basePoints?: number;
    bonusPoints?: number;
    remainingMonthlyBonusPoints?: number;
    messageText?: string;
    pointsCurrency?: string;
  };
}

/**
 * PointsDisplay component that shows reward point calculations using the
 * centralized calculation system.
 * 
 * This component is part of the reward points calculation refactoring.
 * It now uses a single source of truth (estimatedPoints from the useRewardPoints hook)
 * instead of using individual card components for calculations.
 */
const PointsDisplay: React.FC<PointsDisplayProps> = ({
  selectedPaymentMethod,
  estimatedPoints
}) => {
  // Only hide for cash payment methods or if no payment method is selected
  if (!selectedPaymentMethod || selectedPaymentMethod.type === 'cash') {
    return null;
  }

  // If estimatedPoints is just a number, create a proper object
  const pointsInfo = typeof estimatedPoints === 'number' 
    ? { 
        totalPoints: estimatedPoints,
        pointsCurrency: selectedPaymentMethod ? 
          rewardCalculationService.getPointsCurrency(selectedPaymentMethod) : 
          'Points'
      } 
    : estimatedPoints;

  // Use the GenericPointsCard for all card types
  // This ensures a single source of truth for all reward calculations
  return <GenericPointsCard pointsInfo={pointsInfo} />;
};

export default PointsDisplay;
