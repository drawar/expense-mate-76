
import React from 'react';
import { CoinsIcon } from 'lucide-react';

interface UOBPlatinumCardProps {
  amount: number;
  mcc?: string;
  isOnline?: boolean;
  isContactless?: boolean;
  usedBonusPoints: number;
}

export const UOBPlatinumCard: React.FC<UOBPlatinumCardProps> = ({
  amount,
  mcc,
  isOnline,
  isContactless,
  usedBonusPoints
}) => {
  const roundedAmount = Math.floor(amount / 5) * 5;
  const basePoints = Math.round(roundedAmount * 0.4);
  
  const eligibleMCCs = ['4816', '5262', '5306', '5309', '5310', '5311', '5331', '5399', 
    '5611', '5621', '5631', '5641', '5651', '5661', '5691', '5699',
    '5732', '5733', '5734', '5735', '5912', '5942', '5944', '5945',
    '5946', '5947', '5948', '5949', '5964', '5965', '5966', '5967',
    '5968', '5969', '5970', '5992', '5999', '5811', '5812', '5814',
    '5333', '5411', '5441', '5462', '5499', '8012', '9751', '7278',
    '7832', '7841', '7922', '7991', '7996', '7998', '7999'];
  
  const isEligibleMCC = mcc && eligibleMCCs.includes(mcc);
  const isEligibleTransaction = isContactless || (isOnline && isEligibleMCC);
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
