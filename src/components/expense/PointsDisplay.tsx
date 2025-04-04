
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
        basePoints: estimatedPoints,
        bonusPoints: 0,
        pointsCurrency: selectedPaymentMethod ? 
          rewardCalculationService.getPointsCurrency(selectedPaymentMethod) : 
          'Points'
      } 
    : estimatedPoints;

  // Ensure bonusPoints is properly defined
  if (typeof pointsInfo === 'object' && pointsInfo.bonusPoints === undefined && 
      pointsInfo.basePoints !== undefined && pointsInfo.totalPoints !== undefined) {
    pointsInfo.bonusPoints = pointsInfo.totalPoints - pointsInfo.basePoints;
  }

  // Ensure we never pass undefined bonus points to the card
  const finalPointsInfo = {
    ...pointsInfo,
    bonusPoints: pointsInfo.bonusPoints ?? 0,
    basePoints: pointsInfo.basePoints ?? pointsInfo.totalPoints ?? 0,
  };

  // Use the GenericPointsCard for all card types
  // This ensures a single source of truth for all reward calculations
  return <GenericPointsCard pointsInfo={finalPointsInfo} />;
};

export default PointsDisplay;
