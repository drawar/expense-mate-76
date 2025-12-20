// components/expense/form/ConvertedAmountField.tsx
import React, { useEffect } from "react";
import { useFormContext } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { PaymentMethod, MerchantCategoryCode } from "@/types";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormDescription,
  FormMessage,
} from "@/components/ui/form";

// EUR/CAD conversion rate for Brim AF/KLM card
const EUR_CAD_RATE = 1.62;

// Air France (MCC 3007) and KLM (MCC 3010)
const AFKLM_MCCS = ["3007", "3010"];
const AFKLM_MERCHANTS = [
  "air france",
  "airfrance",
  "klm",
  "klm airline",
  "klm royal dutch",
  "flying blue",
];

interface ConvertedAmountFieldProps {
  shouldOverridePayment: boolean;
  selectedPaymentMethod: PaymentMethod | undefined;
  merchantName?: string;
  mcc?: MerchantCategoryCode | null;
}

/**
 * Detect if this is a Brim AF/KLM card + AF/KLM merchant transaction
 * Returns true if we should show the EUR fare amount input
 */
function isBrimAFKLMSpecialCase(
  paymentMethod: PaymentMethod | undefined,
  merchantName: string | undefined,
  mcc: MerchantCategoryCode | null | undefined
): boolean {
  if (!paymentMethod) return false;

  // Check if payment method is Brim AF/KLM card
  const issuer = paymentMethod.issuer?.toLowerCase() || "";
  const name = paymentMethod.name?.toLowerCase() || "";
  const isBrimAFKLMCard =
    issuer.includes("brim") && name.includes("air france");

  if (!isBrimAFKLMCard) return false;

  // Check if merchant is Air France or KLM
  const merchantLower = merchantName?.toLowerCase() || "";
  const isAFKLMMerchant = AFKLM_MERCHANTS.some((m) =>
    merchantLower.includes(m)
  );
  const isAFKLMMCC = mcc?.code && AFKLM_MCCS.includes(mcc.code);

  return isAFKLMMerchant || isAFKLMMCC;
}

const ConvertedAmountField: React.FC<ConvertedAmountFieldProps> = ({
  shouldOverridePayment,
  selectedPaymentMethod,
  merchantName,
  mcc,
}) => {
  const form = useFormContext();
  const amount = Number(form.watch("amount")) || 0;
  const currency = form.watch("currency");
  const eurFareAmount = form.watch("eurFareAmount");

  // Check for Brim AF/KLM special case
  const isBrimAFKLM = isBrimAFKLMSpecialCase(
    selectedPaymentMethod,
    merchantName,
    mcc
  );

  // Auto-populate EUR fare amount when conditions are met
  useEffect(() => {
    if (isBrimAFKLM && amount > 0 && currency === "CAD" && !eurFareAmount) {
      // Pre-populate with CAD amount converted to EUR
      const suggestedEUR = (amount / EUR_CAD_RATE).toFixed(2);
      form.setValue("eurFareAmount", suggestedEUR);
    }
  }, [isBrimAFKLM, amount, currency, eurFareAmount, form]);

  // Reset EUR fare amount when conditions are no longer met
  useEffect(() => {
    if (!isBrimAFKLM && eurFareAmount) {
      form.setValue("eurFareAmount", "");
    }
  }, [isBrimAFKLM, eurFareAmount, form]);

  // Show EUR fare input for Brim AF/KLM special case
  if (isBrimAFKLM && currency === "CAD") {
    return (
      <div className="space-y-4">
        <FormField
          control={form.control}
          name="eurFareAmount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Fare Amount (EUR)</FormLabel>
              <FormDescription>
                Please input the fare amount (excluding government taxes and
                fees) in EUR. This will be multiplied by 5 to calculate your
                bonus Flying Blue Miles.
              </FormDescription>
              <FormControl>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    €
                  </span>
                  <Input
                    type="number"
                    min="0.01"
                    step="0.01"
                    placeholder="0.00"
                    className="pl-7"
                    {...field}
                  />
                </div>
              </FormControl>
              <FormMessage />
              {field.value && Number(field.value) > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  Bonus: €{Number(field.value).toFixed(2)} × 5 ={" "}
                  {Math.floor(Number(field.value) * 5)} miles
                </p>
              )}
            </FormItem>
          )}
        />
      </div>
    );
  }

  // Standard converted amount field for other currency conversions
  if (!shouldOverridePayment || !selectedPaymentMethod) {
    return null;
  }

  return (
    <FormField
      control={form.control}
      name="paymentAmount"
      render={({ field }) => (
        <FormItem>
          <FormLabel>
            Converted Amount ({selectedPaymentMethod?.currency})
          </FormLabel>
          <FormDescription>
            Currency differs from transaction currency. Enter the actual payment
            amount.
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
