// components/ui/payment-method-select-item.tsx
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

interface PaymentMethodItemContentProps {
  method: PaymentMethod;
  /** Size variant for icons - 'sm' for filters, 'md' for forms */
  size?: "sm" | "md";
  /** Whether to show last 4 digits */
  showLastFour?: boolean;
}

/**
 * Renders a payment method icon based on card network
 */
export const PaymentMethodIcon: React.FC<{
  method: PaymentMethod;
  size?: "sm" | "md";
}> = ({ method, size = "md" }) => {
  const iconWidth = size === "sm" ? 32 : 40;
  const lucideSize = size === "sm" ? "h-4 w-4" : "h-5 w-5";

  if (
    method.type === "credit_card" ||
    method.type === "debit_card" ||
    method.type === "prepaid_card"
  ) {
    const network = getCardNetwork(method.issuer || "", method.name);

    switch (network) {
      case "visa":
        return <VisaLogoIcon width={iconWidth} />;
      case "mastercard":
        return <MastercardLogoIcon width={iconWidth} />;
      case "amex":
        return <AmericanExpressLogoIcon width={iconWidth} />;
      case "discover":
        return <DiscoverLogoIcon width={iconWidth} />;
      default:
        return (
          <CreditCardIcon
            className={`flex-shrink-0 ${lucideSize}`}
            style={{ color: method.color || "var(--color-text-secondary)" }}
          />
        );
    }
  }

  return (
    <BanknoteIcon
      className={`flex-shrink-0 ${lucideSize}`}
      style={{ color: method.color || "var(--color-text-secondary)" }}
    />
  );
};

/**
 * Standard content for payment method select items
 * Use this inside SelectItem to ensure consistent rendering across the app
 */
export const PaymentMethodItemContent: React.FC<
  PaymentMethodItemContentProps
> = ({ method, size = "md", showLastFour = true }) => {
  const displayName = formatCardDisplayName(method.issuer || "", method.name);
  const hasLastFour =
    showLastFour &&
    (method.type === "credit_card" ||
      method.type === "debit_card" ||
      method.type === "prepaid_card") &&
    method.lastFourDigits;

  return (
    <div className="flex items-center gap-2 min-w-0">
      <PaymentMethodIcon method={method} size={size} />
      <span className="truncate">{displayName}</span>
      {hasLastFour && (
        <span className="text-muted-foreground text-xs shrink-0">
          ...{method.lastFourDigits}
        </span>
      )}
    </div>
  );
};

export default PaymentMethodItemContent;
