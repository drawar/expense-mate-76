// components/ui/payment-method-select-item.tsx
import React from "react";
import "flag-icons/css/flag-icons.min.css";
import { PaymentMethod } from "@/types";
import { CreditCardIcon, BanknoteIcon } from "lucide-react";
import { getCardNetwork, formatCardShortName } from "@/utils/cardNetworkUtils";
import {
  VisaLogoIcon,
  MastercardLogoIcon,
  AmericanExpressLogoIcon,
  DiscoverLogoIcon,
} from "react-svg-credit-card-payment-icons";

/**
 * Currency to ISO 3166-1-alpha-2 country code mapping (lowercase)
 * Used for flag-icons CSS classes
 */
const CURRENCY_TO_COUNTRY: Record<string, string> = {
  USD: "us",
  EUR: "eu",
  GBP: "gb",
  JPY: "jp",
  AUD: "au",
  CAD: "ca",
  CNY: "cn",
  INR: "in",
  TWD: "tw",
  SGD: "sg",
  VND: "vn",
  IDR: "id",
  THB: "th",
  MYR: "my",
  QAR: "qa",
  KRW: "kr",
};

function getCurrencyCountryCode(currency: string | undefined): string | null {
  if (!currency) return null;
  return CURRENCY_TO_COUNTRY[currency] || null;
}

interface PaymentMethodItemContentProps {
  method: PaymentMethod;
  /** Size variant for icons - 'sm' for filters, 'md' for forms */
  size?: "sm" | "md";
}

/**
 * Renders a payment method icon based on card network
 * Wrapped in fixed-width container for consistent alignment
 */
export const PaymentMethodIcon: React.FC<{
  method: PaymentMethod;
  size?: "sm" | "md";
}> = ({ method, size = "md" }) => {
  const iconWidth = size === "sm" ? 28 : 36;
  const containerWidth = size === "sm" ? "w-7" : "w-9";
  const lucideSize = size === "sm" ? "h-4 w-4" : "h-5 w-5";

  const renderIcon = () => {
    if (
      method.type === "credit_card" ||
      method.type === "debit_card" ||
      method.type === "gift_card"
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
              className={lucideSize}
              style={{ color: method.color || "var(--color-text-secondary)" }}
            />
          );
      }
    }

    return (
      <BanknoteIcon
        className={lucideSize}
        style={{ color: method.color || "var(--color-text-secondary)" }}
      />
    );
  };

  return (
    <span
      className={`${containerWidth} flex-shrink-0 flex items-center justify-center`}
    >
      {renderIcon()}
    </span>
  );
};

/**
 * Standard content for payment method select items
 * Uses short card names (network/rank stripped) for compact display
 */
export const PaymentMethodItemContent: React.FC<
  PaymentMethodItemContentProps
> = ({ method, size = "md" }) => {
  const displayName = formatCardShortName(method.issuer || "", method.name);
  const countryCode = getCurrencyCountryCode(method.currency);
  // Match the network logo size: sm=28px, md=36px -> use similar font size
  const flagSize = size === "sm" ? "text-lg" : "text-xl";

  return (
    <div className="flex items-center gap-2 min-w-0">
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <PaymentMethodIcon method={method} size={size} />
        {countryCode && (
          <span
            className={`fi fi-${countryCode} ${flagSize}`}
            style={{ lineHeight: 1 }}
          />
        )}
      </div>
      <span className="truncate">{displayName}</span>
    </div>
  );
};

export default PaymentMethodItemContent;
