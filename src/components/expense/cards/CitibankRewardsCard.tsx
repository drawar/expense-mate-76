import React from 'react';
import { CoinsIcon } from 'lucide-react';

interface CitibankRewardsCardProps {
  amount: number;
  mcc?: string;
  isOnline?: boolean;
  usedBonusPoints: number;
}

export const CitibankRewardsCard: React.FC<CitibankRewardsCardProps> = ({
  amount,
  mcc,
  isOnline,
  usedBonusPoints
}) => {
  const roundedAmount = Math.floor(amount);
  const basePoints = Math.round(roundedAmount * 0.4);
  
  // Check if merchant is eligible for bonus points
  const exclusionMCCs = [
    // Airlines (3000-3999)
    ...[...Array(1000)].map((_, i) => `${3000 + i}`),
    // Other exclusions
    '4511', '7512', '7011', '4111', '4112', '4789', '4411', '4722', '4723', '5962', '7012'
  ];
  
  const inclusionMCCs = ['5311', '5611', '5621', '5631', '5641', '5651', '5655', '5661', '5691', '5699', '5948'];
  
  const isExcludedMCC = mcc && exclusionMCCs.includes(mcc);
  const isIncludedMCC = mcc && inclusionMCCs.includes(mcc);
  const isEligibleTransaction = (isOnline && !isExcludedMCC) || isIncludedMCC;
  
  const potentialBonusPoints = isEligibleTransaction ? Math.round(roundedAmount * 3.6) : 0;
  const actualBonusPoints = Math.min(potentialBonusPoints, 4000 - usedBonusPoints);
  
  return (
    <div className="rounded-md bg-blue-50 dark:bg-blue-900/20 p-3 space-y-2">
      <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
        Base Points: {basePoints}
      </p>
      <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
        Bonus Points: {actualBonusPoints}
        {potentialBonusPoints > 0 && actualBonusPoints === 0 && ' (Monthly cap reached)'}
      </p>
      <p className="text-sm text-blue-500 dark:text-blue-300">
        Total Points: {basePoints + actualBonusPoints}
      </p>
      {isEligibleTransaction && usedBonusPoints < 4000 && (
        <p className="text-xs text-green-500">
          Remaining bonus points available this month: {4000 - usedBonusPoints - (actualBonusPoints > 0 ? actualBonusPoints : 0)}
        </p>
      )}
    </div>
  );
};
