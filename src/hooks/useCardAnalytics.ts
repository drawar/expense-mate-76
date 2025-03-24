
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
        console.log('Loaded transactions:', allTransactions.length);
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
        (selectedPaymentMethod?.issuer === 'Citibank' && selectedPaymentMethod?.name === 'Rewards Visa Signature')) &&
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
          const multiplier = selectedPaymentMethod.issuer === 'UOB' ? 5 : 1;
          const baseMultiplier = selectedPaymentMethod.issuer === 'UOB' ? 0.4 : 0.4;
          
          const txAmount = Math.floor(tx.amount / multiplier) * multiplier;
          const basePoints = Math.round(txAmount * baseMultiplier);
          const bonusPoints = Math.max(0, tx.rewardPoints - basePoints);
          totalMonthBonusPoints += bonusPoints;
        }
      });
      
      setUsedBonusPoints(Math.min(totalMonthBonusPoints, 4000));
      console.log(`Used bonus points for ${selectedPaymentMethod.name}: ${Math.min(totalMonthBonusPoints, 4000)}`);
    }
  }, [selectedPaymentMethod, transactions]);

  return {
    nonSgdSpendTotal,
    hasSgdTransactions,
    usedBonusPoints
  };
};
