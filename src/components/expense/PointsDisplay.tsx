
import React from 'react';
import { UOBPlatinumCardWrapper } from './cards/UOBPlatinumCardRefactored';
import { UOBSignatureCardWrapper } from './cards/UOBSignatureCardRefactored';
import { CitibankRewardsCardWrapper } from './cards/CitibankRewardsCardRefactored';
import { AmexPlatinumCreditCard, AmexPlatinumSGCard } from './cards/AmexPlatinumSGD';
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
  // Only hide for cash payment methods or if no payment method is selected
  if (!selectedPaymentMethod || amount <= 0 || selectedPaymentMethod.type === 'cash') {
    return null;
  }

  // UOB Preferred Visa Platinum
  if (selectedPaymentMethod?.issuer === 'UOB' && 
      selectedPaymentMethod?.name === 'Preferred Visa Platinum') {
    return (
      <UOBPlatinumCardWrapper 
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
      <UOBSignatureCardWrapper 
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
      <CitibankRewardsCardWrapper 
        amount={amount}
        mcc={mcc}
        isOnline={isOnline}
        usedBonusPoints={usedBonusPoints}
      />
    );
  }
  
  // American Express Platinum Credit Card
  if (selectedPaymentMethod?.issuer === 'American Express' && 
      selectedPaymentMethod?.name === 'Platinum Credit') {
    return (
      <AmexPlatinumCreditCard 
        amount={amount}
        usedBonusPoints={usedBonusPoints || 0}
        pointsCurrency="MR (Credit Card)"
      />
    );
  }
  
  // American Express Platinum Singapore
  if (selectedPaymentMethod?.issuer === 'American Express' && 
      selectedPaymentMethod?.name === 'Platinum Singapore') {
    return (
      <AmexPlatinumSGCard 
        amount={amount}
        usedBonusPoints={usedBonusPoints || 0}
        pointsCurrency="MR (Charge Card)"
      />
    );
  }
  
  // Generic point display for other cards
  return <GenericPointsCard pointsInfo={estimatedPoints} />;
};

export default PointsDisplay;
