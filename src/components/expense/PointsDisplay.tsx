
import React from 'react';
import { UOBPlatinumCard } from './cards/UOBPlatinumCard';
import { UOBSignatureCard } from './cards/UOBSignatureCard';
import { CitibankRewardsCard } from './cards/CitibankRewardsCard';
import { GenericPointsCard } from './cards/GenericPointsCard';
import { PaymentMethod } from '@/types';

interface PointsDisplayProps {
  selectedPaymentMethod: PaymentMethod | undefined;
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
    return (
      <UOBPlatinumCard 
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
      <UOBSignatureCard 
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
      <CitibankRewardsCard 
        amount={amount}
        mcc={mcc}
        isOnline={isOnline}
        usedBonusPoints={usedBonusPoints}
      />
    );
  }
  
  // Generic point display for other cards
  return <GenericPointsCard pointsInfo={estimatedPoints} />;
};

export default PointsDisplay;
