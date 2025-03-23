
import { useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import { PaymentMethod, Currency } from '@/types';
import { CreditCardIcon, BanknoteIcon, CoinsIcon } from 'lucide-react';
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
        
        {estimatedPoints > 0 && (
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
        )}
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
