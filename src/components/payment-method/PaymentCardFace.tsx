import React from "react";
import { PaymentMethod } from "@/types";
import { cn } from "@/lib/utils";
import { CreditCardIcon, BanknoteIcon } from "lucide-react";
import { CurrencyService } from "@/core/currency/CurrencyService";
import { useTransactionsQuery } from "@/hooks/queries/useTransactionsQuery";

interface PaymentCardFaceProps {
  paymentMethod: PaymentMethod;
}

// Card image URLs for known cards
// To add custom cartoon-style images, use /generate-card-art command and save to /public/cards/
// Local images take precedence: '/cards/amex-cobalt.png' > external URL
const CARD_IMAGES: Record<string, string> = {
  // American Express cards (use local paths for custom art, external URLs as fallback)
  "american express:aeroplan reserve":
    "https://icm.aexp-static.com/Internet/internationalcardshop/en_ca/images/cards/aeroplan-reserve-card.png",
  "american express:platinum":
    "https://icm.aexp-static.com/Internet/internationalcardshop/en_ca/images/cards/The_Platinum_Card.png",
  "american express:cobalt":
    "https://www.americanexpress.com/content/dam/amex/en-ca/support/cobalt-card/explorer_2019_ca_di_dod_480x304.png",
  // Citibank cards
  "citibank:rewards visa signature":
    "https://www.asiamiles.com/content/dam/am-content/brand-v2/finance-pillar/product-small-image/Citibank/MY/MY-Rewards-Visa-20Signature2-480x305.png",
  "citibank:rewards world mastercard":
    "https://mhgprod.blob.core.windows.net/singsaver/strapi-uploads/bltea3680481263edcb_492d0be83f.png",
  // Neo Financial Cathay World Elite
  "mastercard:cathay world elite":
    "https://www.finlywealth.com/_next/image?url=%2Fapi%2Fmedia%2Ffile%2Fcathay_world_elite_creditcard.png&w=3840&q=100",
  "neo financial:cathay world elite mastercard":
    "https://www.finlywealth.com/_next/image?url=%2Fapi%2Fmedia%2Ffile%2Fcathay_world_elite_creditcard.png&w=3840&q=100",
  // HSBC cards
  "hsbc:revolution visa platinum":
    "https://yulueezoyjxobhureuxj.supabase.co/storage/v1/object/public/card-images/hsbc-revolution-visa-platinum.png",
  // Brim Financial cards
  "brim financial:air france-klm world elite":
    "https://yulueezoyjxobhureuxj.supabase.co/storage/v1/object/public/card-images/brim-financial-air-france-klm-world-elite.png",
};

/**
 * Get card image URL based on issuer and card name
 */
function getCardImageUrl(paymentMethod: PaymentMethod): string | null {
  if (paymentMethod.imageUrl) {
    return paymentMethod.imageUrl;
  }

  const issuer = paymentMethod.issuer?.toLowerCase() || "";
  const name = paymentMethod.name?.toLowerCase() || "";

  // Normalize issuer names
  const normalizedIssuer = issuer.includes("amex")
    ? "american express"
    : issuer;

  // Try exact match first
  const key = `${normalizedIssuer}:${name}`;
  if (CARD_IMAGES[key]) {
    return CARD_IMAGES[key];
  }

  // Try partial matches
  for (const [cardKey, url] of Object.entries(CARD_IMAGES)) {
    const [cardIssuer, cardName] = cardKey.split(":");
    if (normalizedIssuer.includes(cardIssuer) && name.includes(cardName)) {
      return url;
    }
  }

  return null;
}

export const PaymentCardFace: React.FC<PaymentCardFaceProps> = ({
  paymentMethod,
}) => {
  // Get transactions for this payment method to calculate balance
  const { data: allTransactions = [] } = useTransactionsQuery();

  // Filter transactions for this payment method in the current month
  const currentMonthTransactions = allTransactions.filter(
    (tx) =>
      tx.paymentMethod.id === paymentMethod.id &&
      tx.is_deleted !== true &&
      new Date(tx.date).getMonth() === new Date().getMonth() &&
      new Date(tx.date).getFullYear() === new Date().getFullYear()
  );

  // Calculate current balance
  const currentBalance = currentMonthTransactions.reduce(
    (total, tx) => total + tx.paymentAmount,
    0
  );

  // Generate a background gradient based on the payment method
  const getCardBackground = (): string => {
    if (paymentMethod.type === "cash") {
      return "bg-gradient-to-br from-emerald-500 to-teal-700";
    }

    // Credit card background based on issuer
    const issuerLower = paymentMethod.issuer?.toLowerCase() || "";

    if (issuerLower.includes("amex") || issuerLower.includes("american")) {
      return "bg-gradient-to-br from-blue-500 to-blue-800";
    } else if (issuerLower.includes("visa")) {
      return "bg-gradient-to-br from-blue-400 to-blue-700";
    } else if (issuerLower.includes("mastercard")) {
      return "bg-gradient-to-br from-orange-500 to-red-700";
    } else if (issuerLower.includes("discover")) {
      return "bg-gradient-to-br from-orange-400 to-orange-700";
    } else if (issuerLower.includes("diners")) {
      return "bg-gradient-to-br from-slate-500 to-slate-800";
    } else if (issuerLower.includes("jcb")) {
      return "bg-gradient-to-br from-green-500 to-emerald-700";
    } else if (issuerLower.includes("uob")) {
      return "bg-gradient-to-br from-blue-600 to-blue-900";
    } else if (issuerLower.includes("dbs")) {
      return "bg-gradient-to-br from-red-600 to-red-900";
    } else if (issuerLower.includes("ocbc")) {
      return "bg-gradient-to-br from-red-500 to-orange-800";
    }

    // Default green gradient
    return "bg-gradient-to-br from-emerald-500 to-teal-800";
  };

  // Custom card badge component instead of using the problematic package
  const CardNetworkBadge = () => {
    if (paymentMethod.type !== "credit_card" || !paymentMethod.issuer) {
      return null;
    }

    const issuerLower = paymentMethod.issuer.toLowerCase();
    let badgeClasses =
      "h-10 w-10 p-2 rounded-full bg-white/90 text-black font-medium flex items-center justify-center";
    let networkName = "";

    if (issuerLower.includes("visa")) {
      networkName = "VISA";
      badgeClasses += " text-blue-700";
    } else if (
      issuerLower.includes("mastercard") ||
      issuerLower.includes("master")
    ) {
      networkName = "MC";
      badgeClasses += " text-red-600";
    } else if (
      issuerLower.includes("amex") ||
      issuerLower.includes("american express")
    ) {
      networkName = "AMEX";
      badgeClasses += " text-blue-800";
    } else if (issuerLower.includes("discover")) {
      networkName = "DISC";
      badgeClasses += " text-orange-600";
    } else if (
      issuerLower.includes("diners") ||
      issuerLower.includes("diner")
    ) {
      networkName = "DC";
      badgeClasses += " text-slate-700";
    } else if (issuerLower.includes("jcb")) {
      networkName = "JCB";
      badgeClasses += " text-green-700";
    } else {
      return (
        <CreditCardIcon
          className="h-10 w-10 text-white opacity-80"
          style={{ strokeWidth: 2.5 }}
        />
      );
    }

    return <div className={badgeClasses}>{networkName}</div>;
  };

  const cardImageUrl = getCardImageUrl(paymentMethod);

  // If we have a card image, render the image-based card (clean, no overlays)
  if (cardImageUrl) {
    return (
      <div className="w-full aspect-[1.586/1] relative overflow-hidden rounded-xl shadow-lg">
        {/* Card Image */}
        <img
          src={cardImageUrl}
          alt={`${paymentMethod.issuer || ""} ${paymentMethod.nickname || paymentMethod.name}`}
          className="w-full h-full object-contain"
        />

        {/* Inactive overlay */}
        {!paymentMethod.active && (
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center">
            <div className="bg-white/20 px-4 py-2 rounded-full text-white font-medium rotate-[-15deg]">
              Inactive
            </div>
          </div>
        )}
      </div>
    );
  }

  // Default gradient-based card face
  return (
    <div
      className={cn(
        "rounded-xl w-full aspect-[1.586/1] p-5 text-white relative overflow-hidden shadow-lg",
        getCardBackground()
      )}
    >
      {/* Card Network Logo */}
      {paymentMethod.type === "credit_card" && (
        <div className="absolute top-3 right-3">
          <CardNetworkBadge />
        </div>
      )}

      {/* Card Type Icon (for cash) */}
      {paymentMethod.type === "cash" && (
        <div className="absolute top-3 right-3">
          <BanknoteIcon
            className="h-8 w-8 opacity-80"
            style={{ strokeWidth: 2.5 }}
          />
        </div>
      )}

      {/* Current Balance Label */}
      <div className="text-xs text-white/80">Current Balance</div>

      {/* Balance Amount - Japandi: font-weight 500 max */}
      <div className="text-xl font-medium mt-0.5">
        {CurrencyService.format(currentBalance, paymentMethod.currency)}
      </div>

      {/* Card Details */}
      <div className="absolute bottom-4 left-5 right-5">
        {paymentMethod.type === "credit_card" ? (
          <>
            <div className="flex justify-between items-center mb-1.5">
              <div className="flex items-center text-sm">
                <span className="mr-2 tracking-wider">●●●●</span>
                {paymentMethod.lastFourDigits && (
                  <span className="font-mono">
                    {paymentMethod.lastFourDigits}
                  </span>
                )}
              </div>
            </div>

            {/* Card name - show nickname if set, otherwise issuer + name */}
            <div className="text-xs font-medium truncate opacity-90">
              {paymentMethod.nickname ||
                `${paymentMethod.issuer || ""} ${paymentMethod.name}`}
            </div>
          </>
        ) : (
          <div className="text-xs font-medium">
            {`${paymentMethod.nickname || paymentMethod.name} (${paymentMethod.currency})`}
          </div>
        )}
      </div>

      {/* Background pattern/design */}
      <div className="absolute inset-0 z-0 overflow-hidden opacity-10 pointer-events-none">
        <div className="absolute -right-16 -top-16 rounded-full w-64 h-64 bg-white/20"></div>
        <div className="absolute -left-16 -bottom-16 rounded-full w-64 h-64 bg-white/10"></div>
      </div>

      {/* Inactive overlay */}
      {!paymentMethod.active && (
        <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white/20 px-4 py-2 rounded-full text-white font-medium rotate-[-15deg]">
            Inactive
          </div>
        </div>
      )}
    </div>
  );
};
