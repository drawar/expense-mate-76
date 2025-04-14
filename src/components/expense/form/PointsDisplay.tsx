
// components/expense/form/PointsDisplay.tsx
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { CoinsIcon } from 'lucide-react';
import { PaymentMethod } from '@/types';
import { PointsCalculationResult } from '@/hooks/expense/expense-form/useRewardPointsStandalone';
import { rewardService } from '@/services/rewards';

interface PointsDisplayProps {
  selectedPaymentMethod: PaymentMethod | undefined;
  pointsCalculation: PointsCalculationResult;
}

/**
 * Component for displaying reward point calculations
 */
const PointsDisplay: React.FC<PointsDisplayProps> = ({
  selectedPaymentMethod,
  pointsCalculation
}) => {
  // Only hide for cash payment methods or if no payment method is selected
  if (!selectedPaymentMethod || selectedPaymentMethod.type === 'cash') {
    return null;
  }

  const { 
    totalPoints, 
    basePoints = 0, 
    bonusPoints = 0, 
    remainingMonthlyBonusPoints,
    messageText,
    pointsCurrency = selectedPaymentMethod ? 
      rewardService.getPointsCurrency(selectedPaymentMethod) : 
      'Points'
  } = pointsCalculation;

  // Render a card with the points information
  return (
    <Card className="border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
      <CardContent className="pt-6 pb-4">
        <div className="flex items-start space-x-4">
          <div className="bg-amber-100 dark:bg-amber-900/30 p-2 rounded-full">
            <CoinsIcon className="h-6 w-6 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-semibold">
              {totalPoints.toLocaleString()} {pointsCurrency}
            </h3>
            {basePoints !== undefined && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Base: {basePoints.toLocaleString()} {bonusPoints > 0 && 
                  `+ Bonus: ${bonusPoints.toLocaleString()}`}
              </p>
            )}
            {messageText && (
              <p className="text-sm text-amber-600 dark:text-amber-400">
                {messageText}
              </p>
            )}
            {remainingMonthlyBonusPoints !== undefined && remainingMonthlyBonusPoints > 0 && (
              <p className="text-xs text-gray-500 dark:text-gray-500">
                {remainingMonthlyBonusPoints.toLocaleString()} bonus points remaining this month
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PointsDisplay;
