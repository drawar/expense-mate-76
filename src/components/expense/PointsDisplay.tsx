import React from 'react';
import { CoinsIcon } from 'lucide-react';

interface PointsDisplayProps {
  selectedPaymentMethod: any;
  amount: number;
  currency: string;
  mcc?: string;
  isOnline: boolean;
  isContactless: boolean;
  usedBonusPoints?: number;
  nonSgdSpendTotal?: number;
  hasSgdTransactions?: boolean;
  estimatedPoints: number | {
    totalPoints: number;
    basePoints?: number;
    bonusPoints?: number;
    remainingMonthlyBonusPoints?: number;
    messageText?: string;
  };
}

const PointsDisplay: React.FC<PointsDisplayProps> = ({
  selectedPaymentMethod,
  amount,
  currency,
  mcc,
  isOnline,
  isContactless,
  usedBonusPoints = 0,
  nonSgdSpendTotal = 0,
  hasSgdTransactions = false,
  estimatedPoints
}) => {
  if (!selectedPaymentMethod || amount <= 0) {
    return null;
  }

  // UOB Preferred Visa Platinum
  if (selectedPaymentMethod?.issuer === 'UOB' && 
      selectedPaymentMethod?.name === 'Preferred Visa Platinum') {
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
      <div className="space-y-2">
        <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
          Base Points: {basePoints}
        </p>
        <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
          Bonus Points: {actualBonusPoints}
          {potentialBonusPoints > 0 && actualBonusPoints === 0 && ' (Monthly cap reached)'}
        </p>
        <p className="text-xs text-blue-500 dark:text-blue-300">
          Total Points: {basePoints + actualBonusPoints}
        </p>
        {isEligibleTransaction && usedBonusPoints < 4000 && (
          <p className="text-xs text-green-500">
            Remaining bonus points available this month: {4000 - usedBonusPoints - (actualBonusPoints > 0 ? actualBonusPoints : 0)}
          </p>
        )}
      </div>
    );
  }
  
  // UOB Visa Signature
  if (selectedPaymentMethod?.issuer === 'UOB' && 
      selectedPaymentMethod?.name === 'Visa Signature') {
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
      <div className="space-y-2">
        <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
          Base Points: {basePoints}
        </p>
        <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
          {bonusPointMessage}
        </p>
        <p className="text-xs text-blue-500 dark:text-blue-300">
          Total Points: {totalPoints}
        </p>
      </div>
    );
  }
  
  // Citibank Rewards Visa Signature
  if (selectedPaymentMethod?.issuer === 'Citibank' && 
      selectedPaymentMethod?.name === 'Rewards Visa Signature') {
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
      <div className="space-y-2">
        <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
          Base Points: {basePoints}
        </p>
        <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
          Bonus Points: {actualBonusPoints}
          {potentialBonusPoints > 0 && actualBonusPoints === 0 && ' (Monthly cap reached)'}
        </p>
        <p className="text-xs text-blue-500 dark:text-blue-300">
          Total Points: {basePoints + actualBonusPoints}
        </p>
        {isEligibleTransaction && usedBonusPoints < 4000 && (
          <p className="text-xs text-green-500">
            Remaining bonus points available this month: {4000 - usedBonusPoints - (actualBonusPoints > 0 ? actualBonusPoints : 0)}
          </p>
        )}
      </div>
    );
  }
  
  // Generic point display
  if (typeof estimatedPoints === 'object' && estimatedPoints.totalPoints > 0) {
    return (
      <div className="rounded-md bg-blue-50 dark:bg-blue-900/20 p-3 flex items-center gap-2">
        <CoinsIcon className="h-5 w-5 text-blue-500" />
        <div>
          <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
            Estimated Reward Points: {estimatedPoints.totalPoints}
          </p>
          <p className="text-xs text-blue-500 dark:text-blue-300">
            Based on your selected payment method
          </p>
        </div>
      </div>
    );
  } else if (typeof estimatedPoints === 'number' && estimatedPoints > 0) {
    return (
      <div className="rounded-md bg-blue-50 dark:bg-blue-900/20 p-3 flex items-center gap-2">
        <CoinsIcon className="h-5 w-5 text-blue-500" />
        <div>
          <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
            Estimated Reward Points: {estimatedPoints}
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

export default PointsDisplay;
