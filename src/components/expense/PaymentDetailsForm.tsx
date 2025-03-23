import { useEffect } from 'react';
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

interface PaymentDetailsFormProps {
  paymentMethods: PaymentMethod[];
  selectedPaymentMethod: PaymentMethod | undefined;
  shouldOverridePayment: boolean;
  estimatedPoints: number;
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
  const mcc = form.watch('mcc')?.code;
  const isContactless = form.watch('isContactless');
  
  const getPointsMessage = () => {
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
      const bonusPoints = isEligibleTransaction ? Math.min(Math.round(roundedAmount * 3.6), 4000) : 0;
      
      return (
        <div className="space-y-2">
          <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
            Base Points: {basePoints}
          </p>
          <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
            Bonus Points: {bonusPoints}
            {bonusPoints === 4000 && ' (Monthly cap reached)'}
          </p>
          <p className="text-xs text-blue-500 dark:text-blue-300">
            Total Points: {basePoints + bonusPoints}
          </p>
          {isEligibleTransaction && bonusPoints < 4000 && (
            <p className="text-xs text-green-500">
              Remaining bonus points available this month: {4000 - bonusPoints}
            </p>
          )}
        </div>
      );
    }
    
    return estimatedPoints > 0 && (
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
        
        {!isOnline && (
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
                <FormLabel>Payment Amount ({selectedPaymentMethod?.currency})</FormLabel>
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
