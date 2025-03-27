
import { useState, useEffect } from 'react';
import { PaymentMethod, Transaction } from '@/types';
import { getTransactions } from '@/utils/storageUtils';

export const useCardAnalytics = (selectedPaymentMethod: PaymentMethod | undefined) => {
  // State for transactions
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  
  // State for UOB Visa Signature calculation
  const [nonSgdSpendTotal, setNonSgdSpendTotal] = useState<number>(0);
  const [hasSgdTransactions, setHasSgdTransactions] = useState<boolean>(false);
  
  // State for bonus points tracking
  const [usedBonusPoints, setUsedBonusPoints] = useState<number>(0);
  
  // Load transactions
  useEffect(() => {
    const loadTransactions = async () => {
      try {
        const allTransactions = await getTransactions();
        setTransactions(allTransactions);
      } catch (error) {
        console.error('Error loading transactions:', error);
        setTransactions([]);
      }
    };
    
    loadTransactions();
  }, []);

  // Calculate card-specific metrics based on transactions
  useEffect(() => {
    if (!selectedPaymentMethod) return;
    
    // Calculate for UOB Visa Signature
    if (selectedPaymentMethod?.issuer === 'UOB' && selectedPaymentMethod?.name === 'Visa Signature' && transactions.length > 0) {
      let statementTotal = 0;
      let hasAnySgdTransaction = false;
      
      const statementTransactions = transactions.filter(tx => 
        tx.paymentMethod.id === selectedPaymentMethod.id
      );
      
      statementTransactions.forEach(tx => {
        if (tx.currency === 'SGD') {
          hasAnySgdTransaction = true;
        } else {
          statementTotal += tx.paymentAmount;
        }
      });
      
      setNonSgdSpendTotal(statementTotal);
      setHasSgdTransactions(hasAnySgdTransaction);
    }
    
    // Calculate bonus points used for UOB Preferred Platinum and Citibank Rewards
    if (((selectedPaymentMethod?.issuer === 'UOB' && selectedPaymentMethod?.name === 'Preferred Visa Platinum') ||
        (selectedPaymentMethod?.issuer === 'Citibank' && selectedPaymentMethod?.name === 'Rewards Visa Signature') ||
        (selectedPaymentMethod?.issuer === 'American Express')) && 
        transactions.length > 0) {
      
      const currentDate = new Date();
      let totalMonthBonusPoints = 0;
      
      const currentMonthTransactions = transactions.filter(tx => {
        const txDate = new Date(tx.date);
        return tx.paymentMethod.id === selectedPaymentMethod.id && 
               txDate.getMonth() === currentDate.getMonth() &&
               txDate.getFullYear() === currentDate.getFullYear();
      });
      
      currentMonthTransactions.forEach(tx => {
        if (tx.rewardPoints > 0) {
          // Different multipliers based on card type
          let multiplier = 1;
          let baseMultiplier = 0.4;
          
          if (selectedPaymentMethod.issuer === 'UOB') {
            multiplier = 5;
            baseMultiplier = 0.4;
          } else if (selectedPaymentMethod.issuer === 'Citibank') {
            multiplier = 1;
            baseMultiplier = 0.4;
          } else if (selectedPaymentMethod.issuer === 'American Express') {
            multiplier = 1;
            baseMultiplier = 1.25; // $1.60 = 2 points => 2/1.6 = 1.25 points per dollar
          }
          
          const txAmount = Math.floor(tx.amount / multiplier) * multiplier;
          const basePoints = Math.round(txAmount * baseMultiplier);
          const bonusPoints = Math.max(0, tx.rewardPoints - basePoints);
          totalMonthBonusPoints += bonusPoints;
        }
      });
      
      // Apply cap (if applicable)
      let cap = 4000; // Default cap for UOB and Citibank
      
      // American Express cards have no cap
      if (selectedPaymentMethod.issuer === 'American Express') {
        cap = Number.MAX_SAFE_INTEGER;
      }
      
      setUsedBonusPoints(Math.min(totalMonthBonusPoints, cap));
    }
  }, [selectedPaymentMethod, transactions]);

  return {
    nonSgdSpendTotal,
    hasSgdTransactions,
    usedBonusPoints
  };
};
