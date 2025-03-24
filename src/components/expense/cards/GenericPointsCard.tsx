
import React from 'react';
import { CoinsIcon } from 'lucide-react';

interface GenericPointsCardProps {
  pointsInfo: number | {
    totalPoints: number;
    basePoints?: number;
    bonusPoints?: number;
    remainingMonthlyBonusPoints?: number;
    messageText?: string;
  };
}

export const GenericPointsCard: React.FC<GenericPointsCardProps> = ({ pointsInfo }) => {
  if (typeof pointsInfo === 'object' && pointsInfo.totalPoints > 0) {
    return (
      <div className="rounded-md bg-blue-50 dark:bg-blue-900/20 p-3 flex items-center gap-2">
        <CoinsIcon className="h-5 w-5 text-blue-500" />
        <div>
          <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
            Estimated Reward Points: {pointsInfo.totalPoints}
          </p>
          {pointsInfo.basePoints !== undefined && (
            <p className="text-xs text-blue-500 dark:text-blue-300">
              Base: {pointsInfo.basePoints}, 
              Bonus: {pointsInfo.bonusPoints || 0}
            </p>
          )}
          {pointsInfo.messageText && (
            <p className="text-xs text-blue-500 dark:text-blue-300">{pointsInfo.messageText}</p>
          )}
        </div>
      </div>
    );
  } else if (typeof pointsInfo === 'number' && pointsInfo > 0) {
    return (
      <div className="rounded-md bg-blue-50 dark:bg-blue-900/20 p-3 flex items-center gap-2">
        <CoinsIcon className="h-5 w-5 text-blue-500" />
        <div>
          <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
            Estimated Reward Points: {pointsInfo}
          </p>
          <p className="text-xs text-blue-500 dark:text-blue-300">
            Based on your selected payment method
          </p>
        </div>
      </div>
    );
  }
  
  return null;
};
