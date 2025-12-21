// components/expense/form/PaymentMethodSelect.tsx
import React from "react";
import { PaymentMethod } from "@/types";
import { CreditCardIcon, BanknoteIcon } from "lucide-react";
import {
  getCardNetwork,
  formatCardDisplayName,
} from "@/utils/cardNetworkUtils";
import {
  VisaLogoIcon,
  MastercardLogoIcon,
  AmericanExpressLogoIcon,
  DiscoverLogoIcon,
} from "react-svg-credit-card-payment-icons";
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
                paymentMethods.map((method) => {
                  const network = getCardNetwork(method.issuer, method.name);
                  const displayName = formatCardDisplayName(
                    method.issuer,
                    method.name
                  );

                  // Select appropriate icon based on card network for credit cards
                  const renderIcon = () => {
                    if (
                      method.type === "credit_card" ||
                      method.type === "debit_card" ||
                      method.type === "prepaid_card"
                    ) {
                      switch (network) {
                        case "visa":
                          return <VisaLogoIcon width={40} />;
                        case "mastercard":
                          return <MastercardLogoIcon width={40} />;
                        case "amex":
                          return <AmericanExpressLogoIcon width={40} />;
                        case "discover":
                          return <DiscoverLogoIcon width={40} />;
                        default:
                          return (
                            <CreditCardIcon
                              className="flex-shrink-0"
                              style={{
                                width: 40,
                                height: 26,
                                color: method.color || "#333",
                              }}
                            />
                          );
                      }
                    }
                    return (
                      <BanknoteIcon
                        className="flex-shrink-0"
                        style={{
                          width: 40,
                          height: 26,
                          color: method.color || "#333",
                        }}
                      />
                    );
                  };

                  return (
                    <SelectItem key={method.id} value={method.id}>
                      <div className="flex items-center gap-2">
                        {renderIcon()}
                        <span>{displayName}</span>
                        {(method.type === "credit_card" ||
                          method.type === "debit_card" ||
                          method.type === "prepaid_card") &&
                          method.lastFourDigits && (
                            <span className="text-gray-500 text-xs">
                              ...{method.lastFourDigits}
                            </span>
                          )}
                      </div>
                    </SelectItem>
                  );
                })
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
