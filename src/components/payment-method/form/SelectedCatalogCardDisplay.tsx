import React from "react";
import { CreditCard, X } from "lucide-react";
import {
  VisaLogoIcon,
  MastercardLogoIcon,
  AmericanExpressLogoIcon,
} from "react-svg-credit-card-payment-icons";
import { CardCatalogEntry } from "@/core/catalog";

// Fallback card images for cards without defaultImageUrl
const CARD_IMAGE_FALLBACKS: Record<string, string> = {
  "american express:aeroplan reserve":
    "https://icm.aexp-static.com/Internet/internationalcardshop/en_ca/images/cards/aeroplan-reserve-card.png",
  "american express:platinum":
    "https://icm.aexp-static.com/Internet/internationalcardshop/en_ca/images/cards/The_Platinum_Card.png",
  "american express:cobalt":
    "https://www.americanexpress.com/content/dam/amex/en-ca/support/cobalt-card/explorer_2019_ca_di_dod_480x304.png",
  "citibank:rewards visa signature":
    "https://www.asiamiles.com/content/dam/am-content/brand-v2/finance-pillar/product-small-image/Citibank/MY/MY-Rewards-Visa-20Signature2-480x305.png",
  "citibank:rewards world mastercard":
    "https://www.asiamiles.com/content/dam/am-content/brand-v2/finance-pillar/product-small-image/Citibank/ID/Citi%20ID_Rewards_Mastercard-480x305.png/jcr:content/renditions/cq5dam.crop.900.600.png",
  "neo financial:cathay world elite mastercard":
    "https://www.finlywealth.com/_next/image?url=%2Fapi%2Fmedia%2Ffile%2Fcathay_world_elite_creditcard.png&w=3840&q=100",
  "hsbc:revolution visa platinum":
    "https://storage.googleapis.com/max-sg/assets/cc_appplication_icons/HSBC%20Revolution.png",
  "brim financial:air france-klm world elite":
    "https://princeoftravel.com/wp-content/uploads/2023/09/AFKLM_WorldElite_FINAL-V2-01-1.png",
};

/**
 * Get card image URL from catalog entry or fallback
 */
export function getCardImageUrl(card: CardCatalogEntry): string | null {
  if (card.defaultImageUrl) {
    return card.defaultImageUrl;
  }

  const issuer = card.issuer?.toLowerCase() || "";
  const name = card.name?.toLowerCase() || "";
  const key = `${issuer}:${name}`;

  if (CARD_IMAGE_FALLBACKS[key]) {
    return CARD_IMAGE_FALLBACKS[key];
  }

  // Try partial matches
  for (const [cardKey, url] of Object.entries(CARD_IMAGE_FALLBACKS)) {
    const [cardIssuer, cardName] = cardKey.split(":");
    if (issuer.includes(cardIssuer) && name.includes(cardName)) {
      return url;
    }
  }

  return null;
}

/**
 * Network logo component
 */
const NetworkLogo: React.FC<{ network?: string; size?: number }> = ({
  network,
  size = 24,
}) => {
  switch (network?.toLowerCase()) {
    case "visa":
      return <VisaLogoIcon width={size} />;
    case "mastercard":
      return <MastercardLogoIcon width={size} />;
    case "amex":
      return <AmericanExpressLogoIcon width={size} />;
    default:
      return null;
  }
};

interface SelectedCatalogCardDisplayProps {
  card: CardCatalogEntry;
  onClear: () => void;
}

/**
 * Displays the selected catalog card with image, details, and a clear button.
 * Used in the lean catalog card flow when adding a new payment method.
 */
export const SelectedCatalogCardDisplay: React.FC<
  SelectedCatalogCardDisplayProps
> = ({ card, onClear }) => {
  const cardImageUrl = getCardImageUrl(card);

  return (
    <div
      className="border rounded-xl p-4"
      style={{
        backgroundColor: "var(--color-bg-secondary)",
        borderColor: "var(--color-border)",
      }}
    >
      <div className="flex items-center gap-3">
        {/* Card image */}
        <div className="shrink-0 w-12 h-8 rounded overflow-hidden bg-muted flex items-center justify-center">
          {cardImageUrl ? (
            <img
              src={cardImageUrl}
              alt={card.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          )}
        </div>

        {/* Card details */}
        <div className="flex-1 min-w-0">
          <p
            className="font-medium"
            style={{ color: "var(--color-text-primary)" }}
          >
            {card.name}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            <span
              className="text-xs"
              style={{ color: "var(--color-text-secondary)" }}
            >
              {card.issuer}
            </span>
            <span
              className="text-xs"
              style={{ color: "var(--color-text-tertiary)" }}
            >
              {card.currency}
            </span>
          </div>
        </div>

        {/* Network logo */}
        {card.network && (
          <div className="shrink-0">
            <NetworkLogo network={card.network} size={24} />
          </div>
        )}

        {/* Remove button */}
        <button
          type="button"
          className="shrink-0 p-1 rounded-md hover:bg-accent transition-colors"
          onClick={onClear}
          aria-label="Remove card selection"
        >
          <X
            className="h-5 w-5"
            style={{ color: "var(--color-text-tertiary)" }}
          />
        </button>
      </div>
    </div>
  );
};

export default SelectedCatalogCardDisplay;
