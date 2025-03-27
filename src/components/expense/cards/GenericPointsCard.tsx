
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { CoinsIcon } from 'lucide-react';

interface GenericPointsCardProps {
  pointsInfo: number | {
    totalPoints: number;
    basePoints?: number;
    bonusPoints?: number;
    remainingMonthlyBonusPoints?: number;
    messageText?: string;
    pointsCurrency?: string;
  };
}

export const GenericPointsCard: React.FC<GenericPointsCardProps> = ({ pointsInfo }) => {
  if (typeof pointsInfo === 'number') {
    if (pointsInfo <= 0) return null;
    
    return (
      <Card className="mt-2">
        <CardContent className="pt-4">
          <div className="text-sm">
            <div className="flex items-center text-amber-600 dark:text-amber-400 mb-1">
              <CoinsIcon className="h-4 w-4 mr-1.5" />
              <span className="font-medium">Estimated Rewards</span>
            </div>
            <div className="text-lg font-bold flex items-baseline">
              {pointsInfo.toLocaleString()} <span className="text-xs ml-1 text-gray-500">Points</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  const { 
    totalPoints, 
    basePoints, 
    bonusPoints, 
    messageText,
    pointsCurrency = 'Points'
  } = pointsInfo;
  
  if (totalPoints <= 0) return null;
  
  return (
    <Card className="mt-2">
      <CardContent className="pt-4">
        <div className="text-sm">
          <div className="flex items-center text-amber-600 dark:text-amber-400 mb-1">
            <CoinsIcon className="h-4 w-4 mr-1.5" />
            <span className="font-medium">Estimated Rewards</span>
          </div>
          
          <div className="text-lg font-bold flex items-baseline">
            {totalPoints.toLocaleString()} <span className="text-xs ml-1 text-gray-500">{pointsCurrency}</span>
          </div>
          
          {basePoints !== undefined && bonusPoints !== undefined && (
            <div className="text-xs text-gray-500 mt-1">
              Base: {basePoints.toLocaleString()} + Bonus: {bonusPoints.toLocaleString()}
            </div>
          )}
          
          {messageText && (
            <div className="text-xs text-gray-500 mt-1">
              {messageText}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
