
import React from 'react';
import { PaymentMethod } from '@/types';
import { CreditCardIcon, BanknoteIcon } from 'lucide-react';
import { SelectItem, SelectContent, SelectTrigger, SelectValue, Select } from '@/components/ui/select';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useFormContext } from 'react-hook-form';

interface PaymentMethodSelectProps {
  paymentMethods: PaymentMethod[];
  onSelectPaymentMethod?: (value: string) => void;
}

const PaymentMethodSelect: React.FC<PaymentMethodSelectProps> = ({ 
  paymentMethods,
  onSelectPaymentMethod 
}) => {
  const form = useFormContext();
  
  return (
    <FormField
      control={form.control}
      name="paymentMethodId"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Payment Method</FormLabel>
          <Select 
            value={field.value ? String(field.value) : ''} 
            onValueChange={(value) => {
              console.log('Payment method selected:', value);
              field.onChange(value);
              if (onSelectPaymentMethod) onSelectPaymentMethod(value);
              // Force form validation after selection
              setTimeout(() => form.trigger('paymentMethodId'), 100);
            }}
          >
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder="Select payment method" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {paymentMethods && paymentMethods.length > 0 ? (
                paymentMethods.map((method) => (
                  <SelectItem key={method.id} value={method.id}>
                    <div className="flex items-center gap-2">
                      {method.type === 'credit_card' ? (
                        <CreditCardIcon className="h-4 w-4" style={{ color: method.color || '#333' }} />
                      ) : (
                        <BanknoteIcon className="h-4 w-4" style={{ color: method.color || '#333' }} />
                      )}
                      <span>{method.name}</span>
                      {method.type === 'credit_card' && method.lastFourDigits && (
                        <span className="text-gray-500 text-xs">...{method.lastFourDigits}</span>
                      )}
                    </div>
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="no-methods" disabled>No payment methods available</SelectItem>
              )}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export default PaymentMethodSelect;
