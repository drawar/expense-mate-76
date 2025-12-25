import React from "react";
import { PaymentMethod } from "@/types";
import {
  SelectItem,
  SelectContent,
  SelectTrigger,
  SelectValue,
  Select,
} from "@/components/ui/select";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useFormContext } from "react-hook-form";
import { PaymentMethodItemContent } from "@/components/ui/payment-method-select-item";

interface PaymentMethodSelectProps {
  paymentMethods: PaymentMethod[];
  onSelectPaymentMethod?: (value: string) => void;
}

const PaymentMethodSelect: React.FC<PaymentMethodSelectProps> = ({
  paymentMethods,
  onSelectPaymentMethod,
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
            value={field.value ? String(field.value) : ""}
            onValueChange={(value) => {
              console.log("Payment method selected:", value);
              field.onChange(value);
              if (onSelectPaymentMethod) onSelectPaymentMethod(value);
              // Force form validation after selection
              setTimeout(() => form.trigger("paymentMethodId"), 100);
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
                    <PaymentMethodItemContent method={method} />
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="no-methods" disabled>
                  No payment methods available
                </SelectItem>
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
