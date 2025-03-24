
import React from 'react';
import { useFormContext } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { PaymentMethod } from '@/types';
import { FormControl, FormField, FormItem, FormLabel, FormDescription, FormMessage } from '@/components/ui/form';

interface ConvertedAmountFieldProps {
  shouldOverridePayment: boolean;
  selectedPaymentMethod: PaymentMethod | undefined;
}

const ConvertedAmountField: React.FC<ConvertedAmountFieldProps> = ({ 
  shouldOverridePayment, 
  selectedPaymentMethod 
}) => {
  const form = useFormContext();
  
  if (!shouldOverridePayment || !selectedPaymentMethod) {
    return null;
  }
  
  return (
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
  );
};

export default ConvertedAmountField;
