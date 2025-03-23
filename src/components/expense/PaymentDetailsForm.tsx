
import { useEffect, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { PaymentMethod, Currency, Transaction } from '@/types';
import { CreditCardIcon, CoinsIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { currencyOptions } from '@/utils/currencyFormatter';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import PaymentCardRender from './PaymentCardRender';
import ContactlessToggle from './ContactlessToggle';
import PointsDisplay from './PointsDisplay';

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
  const paymentMethodId = form.watch('paymentMethodId');
  
  const paymentMethod = paymentMethods.find(m => m.id === paymentMethodId);
  const isCash = paymentMethod?.type === 'cash';

  // State for transactions
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  
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

  // Handle currency conversion when payment method currency differs from transaction currency
  useEffect(() => {
    if (shouldOverridePayment && selectedPaymentMethod && currency && amount > 0) {
      const conversionRates: Record<string, Record<string, number>> = {
        USD: { SGD: 1.35, EUR: 0.92, GBP: 0.78 },
        SGD: { USD: 0.74, EUR: 0.68, GBP: 0.58 },
        EUR: { USD: 1.09, SGD: 1.47, GBP: 0.85 },
        GBP: { USD: 1.28, SGD: 1.73, EUR: 1.17 }
      };
      
      for (const fromCurr of Object.keys(conversionRates)) {
        for (const toCurr of currencyOptions.map(c => c.value)) {
          if (!conversionRates[fromCurr]?.[toCurr] && fromCurr !== toCurr) {
            conversionRates[fromCurr] = { 
              ...conversionRates[fromCurr], 
              [toCurr]: 1.0 
            };
          }
        }
      }
      
      const rate = conversionRates[currency]?.[selectedPaymentMethod.currency] || 1;
      const convertedAmount = (amount * rate).toFixed(2);
      form.setValue('paymentAmount', convertedAmount);
    }
  }, [currency, amount, selectedPaymentMethod, shouldOverridePayment, form]);
  
  // Set isContactless to true if credit card and not online
  useEffect(() => {
    if (!isOnline && paymentMethod?.type === 'credit_card') {
      form.setValue('isContactless', true);
    }
  }, [isOnline, paymentMethod, form]);

  // State for UOB Visa Signature calculation
  const [nonSgdSpendTotal, setNonSgdSpendTotal] = useState<number>(0);
  const [hasSgdTransactions, setHasSgdTransactions] = useState<boolean>(false);
  
  useEffect(() => {
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
  }, [selectedPaymentMethod, transactions]);
  
  // State for bonus points tracking
  const [usedBonusPoints, setUsedBonusPoints] = useState<number>(0);
  
  useEffect(() => {
    // Used for both UOB Preferred Visa Platinum and Citibank Rewards Visa Signature 
    // since they have similar bonus points mechanics
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
    }
  }, [selectedPaymentMethod, transactions]);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCardIcon className="h-5 w-5" />
          Payment Details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormField
          control={form.control}
          name="paymentMethodId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Payment Method</FormLabel>
              <Select 
                value={field.value} 
                onValueChange={(value) => {
                  field.onChange(value);
                }}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <PaymentCardRender paymentMethods={paymentMethods} />
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <ContactlessToggle isOnline={isOnline} isCash={isCash || false} />
        
        {shouldOverridePayment && (
          <FormField
            control={form.control}
            name="paymentAmount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Converted Amount ({selectedPaymentMethod?.currency})</FormLabel>
                <FormDescription>
                  Currency differs from transaction currency. Enter the actual payment amount.
                </FormDescription>
                <FormControl>
                  <Input
                    type="number"
                    min="0.01"
                    step="0.01"
                    placeholder="0.00"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        
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
