import { useState, useEffect } from 'react';
import { PaymentMethod } from '@/types';
import { getTransactions } from '@/utils/storageUtils';
import { bonusPointsTrackingService } from '@/services/BonusPointsTrackingService';
import { monthlySpendingTracker } from '@/services/rewards/MonthlySpendingTracker';
import { rewardUtilityService } from '@/services/rewards/RewardUtilityService';

export const useCardAnalytics = (selectedPaymentMethod: PaymentMethod | undefined) => {
  // State for UOB Visa Signature calculation
  const [nonSgdSpendTotal, setNonSgdSpendTotal] = useState<number>(0);
  const [hasSgdTransactions, setHasSgdTransactions] = useState<boolean>(false);
  
  // State for bonus points tracking
  const [usedBonusPoints, setUsedBonusPoints] = useState<number>(0);
  const [remainingBonusPoints, setRemainingBonusPoints] = useState<number>(0);
  
  // Analysis data for the card
  const [cardAnalysis, setCardAnalysis] = useState<any>(null);
  
  // Load card data and analyze rewards
  useEffect(() => {
    if (!selectedPaymentMethod) return;
    
    const analyzeCard = async () => {
      try {
        // Get the current date for calculations
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();
        const currentMonth = currentDate.getMonth();
        
        // Get transactions directly from database via our services
        const { data: transactions } = await monthlySpendingTracker.supabase
          .from('transactions')
          .select('*, payment_method:payment_methods(*), merchant:merchants(*)')
          .eq('payment_method_id', selectedPaymentMethod.id)
          .gte('date', new Date(currentYear, currentMonth, 1).toISOString())
          .lt('date', new Date(currentYear, currentMonth + 1, 1).toISOString())
          .eq('is_deleted', false);
        
        // Get foreign currency transactions for UOB Visa Signature
        if (selectedPaymentMethod.issuer === 'UOB' && selectedPaymentMethod.name === 'Visa Signature') {
          let statementTotal = 0;
          let hasAnySgdTransaction = false;
          
          if (transactions) {
            transactions.forEach(tx => {
              if (tx.currency === 'SGD') {
                hasAnySgdTransaction = true;
              } else {
                statementTotal += tx.amount;
              }
            });
          }
          
          setNonSgdSpendTotal(statementTotal);
          setHasSgdTransactions(hasAnySgdTransaction);
        }
        
        // Use our services to get bonus points information
        const used = await bonusPointsTrackingService.getUsedBonusPoints(
          selectedPaymentMethod.id,
          currentYear,
          currentMonth
        );
        
        const remaining = await bonusPointsTrackingService.getRemainingBonusPoints(
          selectedPaymentMethod,
          used
        );
        
        setUsedBonusPoints(used);
        setRemainingBonusPoints(remaining);
        
        // Get spend analysis using our new service for UI display
        const analysis = await rewardUtilityService.analyzeRewardOpportunities(selectedPaymentMethod);
        setCardAnalysis(analysis);
        
      } catch (error) {
        console.error('Error analyzing card:', error);
      }
    };
    
    analyzeCard();
  }, [selectedPaymentMethod]);

  return {
    nonSgdSpendTotal,
    hasSgdTransactions,
    usedBonusPoints,
    remainingBonusPoints,
    cardAnalysis
  };
};
