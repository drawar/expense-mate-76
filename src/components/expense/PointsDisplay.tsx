
import React from 'react';
import { CoinsIcon } from 'lucide-react';
import { PaymentPointsCard } from './PaymentPointsCard';

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

  // Use specialized card components for specific cards
  // UOB Preferred Visa Platinum
  if (selectedPaymentMethod?.issuer === 'UOB' && 
      selectedPaymentMethod?.name === 'Preferred Visa Platinum') {
    return (
      <PaymentPointsCard 
        type="uob-platinum"
        amount={amount}
        mcc={mcc}
        isOnline={isOnline}
        isContactless={isContactless}
        usedBonusPoints={usedBonusPoints}
      />
    );
  }
  
  // UOB Visa Signature
  if (selectedPaymentMethod?.issuer === 'UOB' && 
      selectedPaymentMethod?.name === 'Visa Signature') {
    return (
      <PaymentPointsCard 
        type="uob-signature"
        amount={amount}
        currency={currency}
        nonSgdSpendTotal={nonSgdSpendTotal}
        hasSgdTransactions={hasSgdTransactions}
      />
    );
  }
  
  // Citibank Rewards Visa Signature
  if (selectedPaymentMethod?.issuer === 'Citibank' && 
      selectedPaymentMethod?.name === 'Rewards Visa Signature') {
    return (
      <PaymentPointsCard 
        type="citibank-rewards"
        amount={amount}
        mcc={mcc}
        isOnline={isOnline}
        usedBonusPoints={usedBonusPoints}
      />
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
          {estimatedPoints.basePoints !== undefined && (
            <p className="text-xs text-blue-500 dark:text-blue-300">
              Base: {estimatedPoints.basePoints}, 
              Bonus: {estimatedPoints.bonusPoints || 0}
            </p>
          )}
          {estimatedPoints.messageText && (
            <p className="text-xs text-blue-500 dark:text-blue-300">{estimatedPoints.messageText}</p>
          )}
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
