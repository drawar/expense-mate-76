import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { CoinsIcon } from 'lucide-react';
import { PaymentMethod } from '@/types';
import { rewardCalculatorService } from '@/services/rewards/RewardCalculatorService';

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
          rewardCalculatorService.getPointsCurrency(selectedPaymentMethod) : 
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
    bonusPoints: typeof pointsInfo.bonusPoints === 'number' ? pointsInfo.bonusPoints : 0,
    basePoints: pointsInfo.basePoints ?? pointsInfo.totalPoints ?? 0,
    // Add a debug message to help troubleshoot
    messageText: pointsInfo.messageText || (
      (pointsInfo.bonusPoints && pointsInfo.bonusPoints > 0) ? 
        `Earning ${pointsInfo.bonusPoints} bonus points` : 
        undefined
    )
  };

  // Render a generic card with the points information
  return (
    <Card className="border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
      <CardContent className="pt-6 pb-4">
        <div className="flex items-start space-x-4">
          <div className="bg-amber-100 dark:bg-amber-900/30 p-2 rounded-full">
            <CoinsIcon className="h-6 w-6 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-semibold">
              {finalPointsInfo.totalPoints.toLocaleString()} {finalPointsInfo.pointsCurrency || 'Points'}
            </h3>
            {finalPointsInfo.basePoints !== undefined && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Base: {finalPointsInfo.basePoints.toLocaleString()} {finalPointsInfo.bonusPoints > 0 && 
                  `+ Bonus: ${finalPointsInfo.bonusPoints.toLocaleString()}`}
              </p>
            )}
            {finalPointsInfo.messageText && (
              <p className="text-sm text-amber-600 dark:text-amber-400">
                {finalPointsInfo.messageText}
              </p>
            )}
            {finalPointsInfo.remainingMonthlyBonusPoints !== undefined && finalPointsInfo.remainingMonthlyBonusPoints > 0 && (
              <p className="text-xs text-gray-500 dark:text-gray-500">
                {finalPointsInfo.remainingMonthlyBonusPoints.toLocaleString()} bonus points remaining this month
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PointsDisplay;
