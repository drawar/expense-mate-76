
import React from 'react';
import { CoinsIcon } from 'lucide-react';

interface UOBSignatureCardProps {
  amount: number;
  currency: string;
  nonSgdSpendTotal: number;
  hasSgdTransactions: boolean;
}

export const UOBSignatureCard: React.FC<UOBSignatureCardProps> = ({
  amount,
  currency,
  nonSgdSpendTotal,
  hasSgdTransactions
}) => {
  const paymentAmount = amount;
  const roundedAmount = Math.floor(paymentAmount / 5) * 5;
  const basePoints = Math.round((roundedAmount / 5) * 2);
  
  let bonusPointMessage = "";
  let bonusPoints = 0;
  
  if (currency !== 'SGD') {
    const totalNonSgdSpend = nonSgdSpendTotal + paymentAmount;
    
    if (!hasSgdTransactions) {
      if (totalNonSgdSpend >= 1000) {
        bonusPoints = Math.round((Math.floor(totalNonSgdSpend / 5) * 5 / 5) * 18);
        bonusPointMessage = `Bonus Points: ${bonusPoints} (Minimum spend reached)`;
      } else {
        const remainingToSpend = 1000 - totalNonSgdSpend;
        const potentialBonusPoints = Math.round((Math.floor(1000 / 5) * 5 / 5) * 18);
        bonusPointMessage = `Spend SGD ${remainingToSpend.toFixed(2)} more to earn ${potentialBonusPoints} bonus points`;
      }
    } else {
      bonusPointMessage = "No bonus points (SGD transactions present this month)";
    }
  } else {
    bonusPointMessage = "No bonus points (SGD currency)";
  }
  
  const totalPoints = Math.min(basePoints + bonusPoints, 8000);
  
  return (
    <div className="rounded-md bg-blue-50 dark:bg-blue-900/20 p-3 space-y-2">
      <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
        Base Points: {basePoints}
      </p>
      <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
        {bonusPointMessage}
      </p>
      <p className="text-sm text-blue-500 dark:text-blue-300">
        Total Points: {totalPoints}
      </p>
    </div>
  );
};
