
import { useEffect, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { PaymentMethod, Currency, Transaction } from '@/types';
import { CreditCardIcon } from 'lucide-react';
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
  SelectItem,
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
    const paymentMethodId = form.watch('paymentMethodId');
    const paymentMethod = paymentMethods.find(m => m.id === paymentMethodId);
    
    if (!isOnline && paymentMethod?.type === 'credit_card') {
      form.setValue('isContactless', true);
    }
  }, [isOnline, form, paymentMethods]);

  // State for UOB Visa Signature calculation
  const [nonSgdSpendTotal, setNonSgdSpendTotal] = useState<number>(0);
  const [hasSgdTransactions, setHasSgdTransactions] = useState<boolean>(false);
  
  useEffect(() => {
    const paymentMethodId = form.watch('paymentMethodId');
    const paymentMethod = paymentMethods.find(m => m.id === paymentMethodId);
    
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
  }, [form, paymentMethods, transactions]);
  
  // State for bonus points tracking
  const [usedBonusPoints, setUsedBonusPoints] = useState<number>(0);
  
  useEffect(() => {
    // Get current payment method
    const paymentMethodId = form.watch('paymentMethodId');
    const paymentMethod = paymentMethods.find(m => m.id === paymentMethodId);
    
    // Used for both UOB Preferred Visa Platinum and Citibank Rewards Visa Signature 
    // since they have similar bonus points mechanics
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
        <FormField
          control={form.control}
          name="paymentMethodId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Payment Method</FormLabel>
              <Select 
                value={field.value} 
                onValueChange={(value) => {
                  console.log('Payment method selected:', value);
                  field.onChange(value);
                }}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {paymentMethods.map((method) => (
                    <SelectItem key={method.id} value={method.id}>
                      <div className="flex items-center gap-2">
                        <CreditCardIcon className="h-4 w-4" style={{ color: method.color }} />
                        <span>{method.name}</span>
                        {method.type === 'credit_card' && method.lastFourDigits && (
                          <span className="text-gray-500 text-xs">...{method.lastFourDigits}</span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <ContactlessToggle 
          isOnline={isOnline} 
          isCash={selectedPaymentMethod?.type === 'cash' || false} 
        />
        
        {shouldOverridePayment && selectedPaymentMethod && (
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
