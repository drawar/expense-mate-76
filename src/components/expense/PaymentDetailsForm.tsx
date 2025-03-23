
import { useEffect, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { PaymentMethod, Currency } from '@/types';
import { CreditCardIcon, BanknoteIcon, CoinsIcon, WifiIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
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
import { Switch } from '@/components/ui/switch';
import { getTransactions } from '@/utils/storageUtils';

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
  
  // Get payment method
  const paymentMethod = paymentMethods.find(m => m.id === paymentMethodId);
  const isCash = paymentMethod?.type === 'cash';

  // Get suggested conversion rate
  useEffect(() => {
    if (shouldOverridePayment && selectedPaymentMethod && currency && amount > 0) {
      // Default conversion rates (in practice, this would come from an API)
      const conversionRates: Record<string, Record<string, number>> = {
        USD: { SGD: 1.35, EUR: 0.92, GBP: 0.78 },
        SGD: { USD: 0.74, EUR: 0.68, GBP: 0.58 },
        EUR: { USD: 1.09, SGD: 1.47, GBP: 0.85 },
        GBP: { USD: 1.28, SGD: 1.73, EUR: 1.17 }
      };
      
      // Set default conversion rates for all currencies
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
      
      // Calculate converted amount
      const rate = conversionRates[currency]?.[selectedPaymentMethod.currency] || 1;
      const convertedAmount = (amount * rate).toFixed(2);
      form.setValue('paymentAmount', convertedAmount);
    }
  }, [currency, amount, selectedPaymentMethod, shouldOverridePayment, form]);
  
  // Set contactless to true by default for credit cards when not online
  useEffect(() => {
    if (!isOnline && paymentMethod?.type === 'credit_card') {
      form.setValue('isContactless', true);
    }
  }, [isOnline, paymentMethod, form]);

  // Get all transactions for calculating the UOB Visa Signature minimum spending status
  const [nonSgdSpendTotal, setNonSgdSpendTotal] = useState<number>(0);
  const [hasSgdTransactions, setHasSgdTransactions] = useState<boolean>(false);
  
  useEffect(() => {
    if (selectedPaymentMethod?.issuer === 'UOB' && selectedPaymentMethod?.name === 'Visa Signature') {
      const allTransactions = getTransactions();
      const currentDate = new Date();
      let statementTotal = 0;
      let hasAnySgdTransaction = false;
      
      // Filter transactions for this payment method in the current statement period
      const statementTransactions = allTransactions.filter(tx => 
        tx.paymentMethod.id === selectedPaymentMethod.id
      );
      
      // Calculate total non-SGD spend and check for any SGD transactions
      statementTransactions.forEach(tx => {
        if (tx.currency === 'SGD') {
          hasAnySgdTransaction = true;
        } else {
          statementTotal += tx.paymentAmount; // This is already in SGD
        }
      });
      
      setNonSgdSpendTotal(statementTotal);
      setHasSgdTransactions(hasAnySgdTransaction);
    }
  }, [selectedPaymentMethod]);
  
  // Calculate the UOB Preferred Visa Platinum used bonus points
  const [usedBonusPoints, setUsedBonusPoints] = useState<number>(0);
  
  useEffect(() => {
    if (selectedPaymentMethod?.issuer === 'UOB' && selectedPaymentMethod?.name === 'Preferred Visa Platinum') {
      const allTransactions = getTransactions();
      const currentDate = new Date();
      let totalMonthBonusPoints = 0;
      
      // Get current month's transactions for this payment method
      const currentMonthTransactions = allTransactions.filter(tx => {
        const txDate = new Date(tx.date);
        return tx.paymentMethod.id === selectedPaymentMethod.id && 
               txDate.getMonth() === currentDate.getMonth() &&
               txDate.getFullYear() === currentDate.getFullYear();
      });
      
      // Calculate total bonus points from these transactions
      currentMonthTransactions.forEach(tx => {
        if (tx.rewardPoints > 0) {
          const txAmount = Math.floor(tx.amount / 5) * 5;
          const basePoints = Math.round(txAmount * 0.4);
          const bonusPoints = Math.max(0, tx.rewardPoints - basePoints);
          totalMonthBonusPoints += bonusPoints;
        }
      });
      
      setUsedBonusPoints(Math.min(totalMonthBonusPoints, 4000));
    }
  }, [selectedPaymentMethod]);
  
  const getPointsMessage = () => {
    // Handle UOB Preferred Visa Platinum
    if (selectedPaymentMethod?.issuer === 'UOB' && 
        selectedPaymentMethod?.name === 'Preferred Visa Platinum' &&
        amount > 0) {
      const roundedAmount = Math.floor(amount / 5) * 5;
      const basePoints = Math.round(roundedAmount * 0.4);
      
      const eligibleMCCs = ['4816', '5262', '5306', '5309', '5310', '5311', '5331', '5399', 
        '5611', '5621', '5631', '5641', '5651', '5661', '5691', '5699',
        '5732', '5733', '5734', '5735', '5912', '5942', '5944', '5945',
        '5946', '5947', '5948', '5949', '5964', '5965', '5966', '5967',
        '5968', '5969', '5970', '5992', '5999', '5811', '5812', '5814',
        '5333', '5411', '5441', '5462', '5499', '8012', '9751', '7278',
        '7832', '7841', '7922', '7991', '7996', '7998', '7999'];
      
      const isEligibleMCC = mcc && eligibleMCCs.includes(mcc);
      const isEligibleTransaction = isContactless || (isOnline && isEligibleMCC);
      const potentialBonusPoints = isEligibleTransaction ? Math.round(roundedAmount * 3.6) : 0;
      const actualBonusPoints = Math.min(potentialBonusPoints, 4000 - usedBonusPoints);
      
      return (
        <div className="space-y-2">
          <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
            Base Points: {basePoints}
          </p>
          <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
            Bonus Points: {actualBonusPoints}
            {potentialBonusPoints > 0 && actualBonusPoints === 0 && ' (Monthly cap reached)'}
          </p>
          <p className="text-xs text-blue-500 dark:text-blue-300">
            Total Points: {basePoints + actualBonusPoints}
          </p>
          {isEligibleTransaction && usedBonusPoints < 4000 && (
            <p className="text-xs text-green-500">
              Remaining bonus points available this month: {4000 - usedBonusPoints}
            </p>
          )}
        </div>
      );
    }
    
    // Handle UOB Visa Signature
    if (selectedPaymentMethod?.issuer === 'UOB' && 
        selectedPaymentMethod?.name === 'Visa Signature' &&
        amount > 0) {
      const paymentAmount = Number(form.watch('paymentAmount')) || amount;
      const roundedAmount = Math.floor(paymentAmount / 5) * 5;
      const basePoints = Math.round((roundedAmount / 5) * 2);
      
      // Calculate potential bonus points
      let bonusPointMessage = "";
      let bonusPoints = 0;
      
      // Check if transaction is in non-SGD currency
      if (currency !== 'SGD') {
        // Convert to SGD for minimum spend calculation if needed
        const sgdEquivalent = shouldOverridePayment ? paymentAmount : amount * 1.35; // Default USD to SGD rate
        const totalNonSgdSpend = nonSgdSpendTotal + sgdEquivalent;
        
        if (!hasSgdTransactions) {
          if (totalNonSgdSpend >= 1000) {
            // Calculate bonus points - all eligible transactions (rounded down to nearest 5) * 18 / 5
            bonusPoints = Math.round((Math.floor(totalNonSgdSpend / 5) * 5 / 5) * 18);
            bonusPointMessage = `Bonus Points: ${bonusPoints} (Minimum spend reached)`;
          } else {
            const remainingToSpend = 1000 - totalNonSgdSpend;
            const potentialBonusPoints = Math.round((Math.floor(1000 / 5) * 5 / 5) * 18);
            bonusPointMessage = `Spend SGD ${remainingToSpend.toFixed(2)} more to earn ${potentialBonusPoints} bonus points`;
          }
        } else {
          bonusPointMessage = "No bonus points (SGD transactions present this month)";
        }
      } else {
        bonusPointMessage = "No bonus points (SGD currency)";
      }
      
      // Cap total at 8000 per statement
      const totalPoints = Math.min(basePoints + bonusPoints, 8000);
      
      return (
        <div className="space-y-2">
          <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
            Base Points: {basePoints}
          </p>
          <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
            {bonusPointMessage}
          </p>
          <p className="text-xs text-blue-500 dark:text-blue-300">
            Total Points: {totalPoints}
          </p>
        </div>
      );
    }
    
    // Default message for other cards
    if (typeof estimatedPoints === 'object' && estimatedPoints.totalPoints > 0) {
      return (
        <div className="rounded-md bg-blue-50 dark:bg-blue-900/20 p-3 flex items-center gap-2">
          <CoinsIcon className="h-5 w-5 text-blue-500" />
          <div>
            <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
              Estimated Reward Points: {estimatedPoints.totalPoints}
            </p>
            <p className="text-xs text-blue-500 dark:text-blue-300">
              Based on your selected payment method
            </p>
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
                  {paymentMethods.map((method) => (
                    <SelectItem key={method.id} value={method.id}>
                      <div className="flex items-center gap-2">
                        {method.type === 'credit_card' ? (
                          <CreditCardIcon className="h-4 w-4" style={{ color: method.color }} />
                        ) : (
                          <BanknoteIcon className="h-4 w-4" style={{ color: method.color }} />
                        )}
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
        
        {!isOnline && !isCash && (
          <FormField
            control={form.control}
            name="isContactless"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                <div className="space-y-0.5">
                  <FormLabel>Contactless Payment</FormLabel>
                  <FormDescription>
                    Toggle if the payment was made contactless
                  </FormDescription>
                </div>
                <FormControl>
                  <div className="flex items-center space-x-2">
                    <WifiIcon className="h-4 w-4 text-muted-foreground" />
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </div>
                </FormControl>
              </FormItem>
            )}
          />
        )}
        
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
        
        {getPointsMessage()}
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
