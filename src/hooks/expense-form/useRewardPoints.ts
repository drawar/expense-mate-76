
import { Transaction, PaymentMethod } from '@/types';
import { simulateRewardPoints } from '@/utils/rewards/rewardPoints';
import { cardRuleService } from '@/components/expense/cards/CardRuleService';

export const useRewardPoints = () => {
  const simulatePoints = async (
    amount: number,
    currency: string,
    paymentMethod: PaymentMethod,
    mcc?: string,
    merchantName?: string,
    isOnline?: boolean,
    isContactless?: boolean
  ) => {
    const result = await simulateRewardPoints(
      amount, 
      currency, 
      paymentMethod, 
      mcc, 
      merchantName, 
      isOnline, 
      isContactless
    );

    // Get points currency from card rules
    const cardRules = await cardRuleService.loadRules();
    const matchingRule = cardRules.find(rule => 
      rule.cardType === paymentMethod.name && rule.enabled
    );

    return {
      ...result,
      pointsCurrency: matchingRule?.pointsCurrency || 'Points'
    };
  };

  return { simulatePoints };
};
