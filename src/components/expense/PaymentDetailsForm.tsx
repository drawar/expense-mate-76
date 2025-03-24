
import { useState, useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import { PaymentMethod, Currency, Transaction } from '@/types';
import { CreditCardIcon } from 'lucide-react';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getTransactions } from '@/utils/storageUtils';

// Import our refactored components
import PaymentMethodSelect from './PaymentCardRender';
import ContactlessToggle from './ContactlessToggle';
import PointsDisplay from './PointsDisplay';
import ConvertedAmountField from './ConvertedAmountField';

interface PaymentDetailsFormProps {
  paymentMethods: PaymentMethod[];
  selectedPaymentMethod: PaymentMethod | undefined;
  shouldOverridePayment: boolean;
  estimatedPoints: number | {
    totalPoints: number;
    basePoints?: number;
    bonusPoints?: number;
    remainingMonthlyBonusPoints?: number;
  };
}

const PaymentDetailsForm = ({ 
  paymentMethods, 
  selectedPaymentMethod, 
  shouldOverridePayment,
  estimatedPoints
}: PaymentDetailsFormProps) => {
  const form = useFormContext();
  const isOnline = form.watch('isOnline');
  const amount = Number(form.watch('amount')) || 0;
  const currency = form.watch('currency') as Currency;
  const mcc = form.watch('mcc')?.code;
  const isContactless = form.watch('isContactless');
  
  // State for transactions
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  
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

  // State for UOB Visa Signature calculation
  const [nonSgdSpendTotal, setNonSgdSpendTotal] = useState<number>(0);
  const [hasSgdTransactions, setHasSgdTransactions] = useState<boolean>(false);
  
  // State for bonus points tracking
  const [usedBonusPoints, setUsedBonusPoints] = useState<number>(0);
  
  // Calculate card-specific metrics based on transactions
  useEffect(() => {
    // Get current payment method
    const paymentMethodId = form.watch('paymentMethodId');
    const paymentMethod = paymentMethods.find(m => m.id === paymentMethodId);
    
    // Calculate for UOB Visa Signature
    if (paymentMethod?.issuer === 'UOB' && paymentMethod?.name === 'Visa Signature' && transactions.length > 0) {
      let statementTotal = 0;
      let hasAnySgdTransaction = false;
      
      const statementTransactions = transactions.filter(tx => 
        tx.paymentMethod.id === paymentMethod.id
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
    if (((paymentMethod?.issuer === 'UOB' && paymentMethod?.name === 'Preferred Visa Platinum') ||
        (paymentMethod?.issuer === 'Citibank' && paymentMethod?.name === 'Rewards Visa Signature')) &&
        transactions.length > 0) {
      
      const currentDate = new Date();
      let totalMonthBonusPoints = 0;
      
      const currentMonthTransactions = transactions.filter(tx => {
        const txDate = new Date(tx.date);
        return tx.paymentMethod.id === paymentMethod.id && 
               txDate.getMonth() === currentDate.getMonth() &&
               txDate.getFullYear() === currentDate.getFullYear();
      });
      
      currentMonthTransactions.forEach(tx => {
        if (tx.rewardPoints > 0) {
          const multiplier = paymentMethod.issuer === 'UOB' ? 5 : 1;
          const baseMultiplier = paymentMethod.issuer === 'UOB' ? 0.4 : 0.4;
          
          const txAmount = Math.floor(tx.amount / multiplier) * multiplier;
          const basePoints = Math.round(txAmount * baseMultiplier);
          const bonusPoints = Math.max(0, tx.rewardPoints - basePoints);
          totalMonthBonusPoints += bonusPoints;
        }
      });
      
      setUsedBonusPoints(Math.min(totalMonthBonusPoints, 4000));
    }
  }, [form, paymentMethods, transactions]);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCardIcon className="h-5 w-5" />
          Payment Details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <PaymentMethodSelect paymentMethods={paymentMethods} />
        
        <ContactlessToggle 
          isOnline={isOnline} 
          isCash={selectedPaymentMethod?.type === 'cash' || false} 
        />
        
        <ConvertedAmountField 
          shouldOverridePayment={shouldOverridePayment} 
          selectedPaymentMethod={selectedPaymentMethod} 
        />
        
        <PointsDisplay 
          selectedPaymentMethod={selectedPaymentMethod}
          amount={amount}
          currency={currency}
          mcc={mcc}
          isOnline={isOnline}
          isContactless={isContactless}
          usedBonusPoints={usedBonusPoints}
          nonSgdSpendTotal={nonSgdSpendTotal}
          hasSgdTransactions={hasSgdTransactions}
          estimatedPoints={estimatedPoints}
        />
      </CardContent>
      <CardFooter className="flex justify-end space-x-2">
        <Button type="submit" className="w-full md:w-auto">
          Save Transaction
        </Button>
      </CardFooter>
    </Card>
  );
};

export default PaymentDetailsForm;
