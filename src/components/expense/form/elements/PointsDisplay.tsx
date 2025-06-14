
import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CoinsIcon } from 'lucide-react';
import { PaymentMethod } from '@/types';
import { rewardService } from '@/core/rewards';

interface PointsDisplayProps {
  amount: number;
  currency: string;
  paymentMethod: PaymentMethod | null;
  mcc?: string;
  merchantName?: string;
  isOnline?: boolean;
  isContactless?: boolean;
}

export const PointsDisplay: React.FC<PointsDisplayProps> = ({
  amount,
  currency,
  paymentMethod,
  mcc,
  merchantName,
  isOnline,
  isContactless
}) => {
  const [points, setPoints] = useState<{
    totalPoints: number;
    basePoints: number;
    bonusPoints: number;
    pointsCurrency: string;
    messages?: string[];
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const calculatePoints = async () => {
      if (!paymentMethod || !amount || amount <= 0) {
        setPoints(null);
        return;
      }

      setIsLoading(true);
      try {
        const result = await rewardService.simulateRewards(
          amount,
          currency,
          paymentMethod,
          mcc,
          merchantName,
          isOnline,
          isContactless
        );

        setPoints({
          totalPoints: result.totalPoints,
          basePoints: result.basePoints,
          bonusPoints: result.bonusPoints,
          pointsCurrency: result.pointsCurrency,
          messages: result.messages
        });
      } catch (error) {
        console.error('Error calculating points:', error);
        setPoints(null);
      } finally {
        setIsLoading(false);
      }
    };

    calculatePoints();
  }, [amount, currency, paymentMethod, mcc, merchantName, isOnline, isContactless]);

  if (!paymentMethod || !amount || amount <= 0) {
    return null;
  }

  return (
    <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CoinsIcon className="h-5 w-5 text-blue-600" />
            <span className="font-medium text-blue-900">Reward Points</span>
          </div>
          
          {isLoading ? (
            <div className="animate-pulse">
              <div className="h-6 w-16 bg-gray-200 rounded"></div>
            </div>
          ) : points ? (
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                {points.totalPoints.toLocaleString()} {points.pointsCurrency}
              </Badge>
              {points.bonusPoints > 0 && (
                <Badge variant="default" className="bg-green-100 text-green-800">
                  +{points.bonusPoints} bonus
                </Badge>
              )}
            </div>
          ) : (
            <span className="text-gray-500">No points</span>
          )}
        </div>
        
        {points && points.messages && points.messages.length > 0 && (
          <div className="mt-2 text-xs text-gray-600">
            {points.messages.map((message, index) => (
              <div key={index}>{message}</div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PointsDisplay;
