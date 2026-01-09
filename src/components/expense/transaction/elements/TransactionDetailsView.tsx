import { useState, useEffect } from "react";
import { Transaction, PaymentMethod } from "@/types";
import { CurrencyService } from "@/core/currency";
import { formatDate } from "@/utils/dates/formatters";
import { PropertyResolver } from "@/core/catalog/PropertyResolver";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";

// Fallback card images for cards without defaultImageUrl (same as CardCatalogPicker)
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
    "https://mhgprod.blob.core.windows.net/singsaver/strapi-uploads/bltea3680481263edcb_492d0be83f.png",
  "neo financial:cathay world elite mastercard":
    "https://www.finlywealth.com/_next/image?url=%2Fapi%2Fmedia%2Ffile%2Fcathay_world_elite_creditcard.png&w=3840&q=100",
  "hsbc:revolution visa platinum":
    "https://yulueezoyjxobhureuxj.supabase.co/storage/v1/object/public/card-images/hsbc-revolution-visa-platinum.png",
  "brim financial:air france-klm world elite":
    "https://yulueezoyjxobhureuxj.supabase.co/storage/v1/object/public/card-images/brim-financial-air-france-klm-world-elite.png",
};

/**
 * Get card image URL from payment method, catalog, or fallback
 */
function getCardImageFallback(paymentMethod: PaymentMethod): string | null {
  const issuer = paymentMethod.issuer?.toLowerCase() || "";
  const name = paymentMethod.name?.toLowerCase() || "";
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

import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  CreditCardIcon,
  CalendarIcon,
  TagIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  PencilIcon,
  TrashIcon,
  EditIcon,
  CoinsIcon,
} from "lucide-react";
import { CategoryPicker } from "@/components/expense/transaction/CategoryPicker";

// Loyalty program logo URLs (synced with PointsEarnedCard)
const LOYALTY_PROGRAM_LOGOS: Record<string, string> = {
  krisflyer:
    "https://yulueezoyjxobhureuxj.supabase.co/storage/v1/object/public/loyalty-programs/krisflyer.png",
  "krisflyer miles":
    "https://yulueezoyjxobhureuxj.supabase.co/storage/v1/object/public/loyalty-programs/krisflyer.png",
  avios:
    "https://yulueezoyjxobhureuxj.supabase.co/storage/v1/object/public/loyalty-programs/avios.png",
  "membership rewards":
    "https://yulueezoyjxobhureuxj.supabase.co/storage/v1/object/public/loyalty-programs/membership-rewards.png",
  "membership rewards points (ca)":
    "https://yulueezoyjxobhureuxj.supabase.co/storage/v1/object/public/loyalty-programs/amex-mr.png",
  "hsbc rewards":
    "https://yulueezoyjxobhureuxj.supabase.co/storage/v1/object/public/loyalty-programs/hsbc-rewards.png",
  "hsbc rewards points":
    "https://yulueezoyjxobhureuxj.supabase.co/storage/v1/object/public/loyalty-programs/hsbc-rewards.png",
  "td rewards":
    "https://yulueezoyjxobhureuxj.supabase.co/storage/v1/object/public/loyalty-programs/td-rewards.png",
  "citi thankyou":
    "https://yulueezoyjxobhureuxj.supabase.co/storage/v1/object/public/loyalty-programs/citi-thankyou.png",
  "citi thankyou points":
    "https://yulueezoyjxobhureuxj.supabase.co/storage/v1/object/public/loyalty-programs/citi-thankyou.png",
  thankyou:
    "https://yulueezoyjxobhureuxj.supabase.co/storage/v1/object/public/loyalty-programs/citi-thankyou.png",
  "thankyou points":
    "https://yulueezoyjxobhureuxj.supabase.co/storage/v1/object/public/loyalty-programs/citi-thankyou.png",
  "asia miles":
    "https://yulueezoyjxobhureuxj.supabase.co/storage/v1/object/public/loyalty-programs/cx-asiamiles.png",
  asiamiles:
    "https://yulueezoyjxobhureuxj.supabase.co/storage/v1/object/public/loyalty-programs/cx-asiamiles.png",
  "amazon rewards":
    "https://yulueezoyjxobhureuxj.supabase.co/storage/v1/object/public/loyalty-programs/amazon-rewards.png",
  "flying blue":
    "https://yulueezoyjxobhureuxj.supabase.co/storage/v1/object/public/loyalty-programs/afklm-flyingblue.png",
  flyingblue:
    "https://yulueezoyjxobhureuxj.supabase.co/storage/v1/object/public/loyalty-programs/afklm-flyingblue.png",
  "flying blue miles":
    "https://yulueezoyjxobhureuxj.supabase.co/storage/v1/object/public/loyalty-programs/afklm-flyingblue.png",
  "flying blue points":
    "https://yulueezoyjxobhureuxj.supabase.co/storage/v1/object/public/loyalty-programs/afklm-flyingblue.png",
  aeroplan:
    "https://yulueezoyjxobhureuxj.supabase.co/storage/v1/object/public/loyalty-programs/ac-aeroplan.png",
  "aeroplan points":
    "https://yulueezoyjxobhureuxj.supabase.co/storage/v1/object/public/loyalty-programs/ac-aeroplan.png",
};

function getLoyaltyProgramLogo(currency: string | undefined): string | null {
  if (!currency) return null;
  return LOYALTY_PROGRAM_LOGOS[currency.toLowerCase()] || null;
}

// Background colors for logos with non-transparent backgrounds
const LOYALTY_PROGRAM_BG_COLORS: Record<string, string> = {
  "membership rewards": "#006FCF", // Amex blue
  "membership rewards points (ca)": "#006FCF",
};

function getLoyaltyProgramBgColor(currency: string | undefined): string {
  if (!currency) return "white";
  return LOYALTY_PROGRAM_BG_COLORS[currency.toLowerCase()] || "white";
}

interface TransactionDetailsViewProps {
  transaction: Transaction;
  onCategoryChange?: (category: string) => void;
  onDelete?: () => void;
  onEdit?: () => void;
  isLoading?: boolean;
}

const TransactionDetailsView = ({
  transaction,
  onCategoryChange,
  onDelete,
  onEdit,
  isLoading = false,
}: TransactionDetailsViewProps) => {
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isCategoryPickerOpen, setIsCategoryPickerOpen] = useState(false);
  const [cardImageUrl, setCardImageUrl] = useState<string | undefined>(
    transaction.paymentMethod.imageUrl
  );

  // Resolve card image from catalog or fallback
  useEffect(() => {
    const resolveCardImage = async () => {
      // First try PropertyResolver (pm.imageUrl > catalog.defaultImageUrl)
      const resolved = await PropertyResolver.resolveAll(
        transaction.paymentMethod
      );
      if (resolved.effectiveImageUrl) {
        setCardImageUrl(resolved.effectiveImageUrl);
        return;
      }

      // Fall back to hardcoded fallbacks
      const fallback = getCardImageFallback(transaction.paymentMethod);
      if (fallback) {
        setCardImageUrl(fallback);
        return;
      }

      setCardImageUrl(undefined);
    };
    resolveCardImage();
  }, [transaction.paymentMethod]);

  const handleCategorySelect = (
    category: string,
    _transaction: Transaction
  ) => {
    onCategoryChange?.(category);
  };

  // Determine if there's additional details to show
  const hasExchangeRate =
    transaction.currency !== transaction.paymentCurrency &&
    transaction.paymentAmount &&
    transaction.amount;
  const exchangeRate = hasExchangeRate
    ? (transaction.paymentAmount / transaction.amount).toFixed(4)
    : null;

  const pointsCurrency = transaction.paymentMethod.pointsCurrency || "points";
  const loyaltyLogo = getLoyaltyProgramLogo(pointsCurrency);

  return (
    <div className="space-y-6">
      {/* Section 3: Amount (Hero) */}
      <div className="py-2">
        <p className="text-4xl font-semibold">
          {CurrencyService.format(transaction.amount, transaction.currency)}
        </p>
        {transaction.currency !== transaction.paymentCurrency && (
          <p className="text-sm text-muted-foreground mt-1">
            Paid{" "}
            {CurrencyService.format(
              transaction.paymentAmount,
              transaction.paymentCurrency
            )}
          </p>
        )}
        {/* Reimbursement and Net Spend */}
        {transaction.reimbursementAmount != null &&
          transaction.reimbursementAmount > 0 && (
            <div className="mt-2 space-y-0.5">
              <p className="text-sm text-green-600">
                Reimbursement:{" "}
                <span className="font-semibold">
                  {CurrencyService.format(
                    -transaction.reimbursementAmount,
                    transaction.currency
                  )}
                </span>
              </p>
              <p className="text-sm">
                Net spend:{" "}
                <span className="font-semibold">
                  {CurrencyService.format(
                    transaction.amount - transaction.reimbursementAmount,
                    transaction.currency
                  )}
                </span>
              </p>
            </div>
          )}
      </div>

      {/* Section 4: Context (no label) */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm">
          <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          <span>{formatDate(transaction.date)}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <TagIcon className="h-4 w-4 text-muted-foreground" />
          <span>{transaction.category || "Uncategorized"}</span>
          {onCategoryChange && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => setIsCategoryPickerOpen(true)}
            >
              <PencilIcon className="h-3 w-3 mr-1" />
              Edit
            </Button>
          )}
        </div>
      </div>

      {/* Section 5: Payment Method */}
      <div>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
          Payment method
        </p>
        <div className="flex items-center gap-3">
          {cardImageUrl ? (
            <img
              src={cardImageUrl}
              alt={transaction.paymentMethod.name}
              className="h-10 w-16 object-contain rounded"
            />
          ) : (
            <CreditCardIcon className="h-6 w-6 shrink-0" />
          )}
          <div className="min-w-0">
            <p className="font-medium">{transaction.paymentMethod.name}</p>
            <p className="text-sm text-muted-foreground">
              {transaction.paymentMethod.issuer}
            </p>
          </div>
        </div>
      </div>

      {/* Section 6: Rewards (linked to payment) */}
      {transaction.rewardPoints !== 0 && (
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
            Rewards
          </p>
          <div className="flex items-center gap-3">
            {loyaltyLogo ? (
              <div
                className="h-16 w-16 flex items-center justify-center relative rounded-full overflow-hidden"
                style={{
                  backgroundColor: getLoyaltyProgramBgColor(pointsCurrency),
                }}
              >
                <img
                  src={loyaltyLogo}
                  alt={pointsCurrency}
                  className="h-16 w-16 object-contain"
                  style={{ transform: "scale(0.85)" }}
                />
              </div>
            ) : (
              <CoinsIcon className="h-16 w-16 text-amber-500" />
            )}
            <p
              className={`font-medium ${transaction.rewardPoints < 0 ? "text-destructive" : ""}`}
            >
              {transaction.rewardPoints > 0 ? "+ " : ""}
              {transaction.rewardPoints.toLocaleString()} {pointsCurrency}
            </p>
          </div>
        </div>
      )}

      {/* Section 7: Additional Details (Collapsed) */}
      <Collapsible open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <CollapsibleTrigger asChild>
          <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-full">
            <span className="text-xs font-medium uppercase tracking-wide">
              Additional details
            </span>
            {isDetailsOpen ? (
              <ChevronUpIcon className="h-4 w-4" />
            ) : (
              <ChevronDownIcon className="h-4 w-4" />
            )}
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-3">
          <div className="space-y-2 text-sm text-muted-foreground">
            {transaction.id && (
              <div className="flex justify-between">
                <span>Transaction ID</span>
                <span className="font-mono text-xs">{transaction.id}</span>
              </div>
            )}
            {transaction.merchant.descriptor && (
              <div className="flex justify-between">
                <span>Merchant descriptor</span>
                <span>{transaction.merchant.descriptor}</span>
              </div>
            )}
            {transaction.merchant.mcc && (
              <div className="flex justify-between">
                <span>MCC</span>
                <span>
                  {transaction.merchant.mcc.code} -{" "}
                  {transaction.merchant.mcc.description}
                </span>
              </div>
            )}
            {exchangeRate && (
              <div className="flex justify-between">
                <span>Exchange rate</span>
                <span>
                  1 {transaction.currency} = {exchangeRate}{" "}
                  {transaction.paymentCurrency}
                </span>
              </div>
            )}
            {transaction.merchant.address && (
              <div className="flex justify-between">
                <span>Address</span>
                <span className="text-right max-w-[200px]">
                  {transaction.merchant.address}
                </span>
              </div>
            )}
            {transaction.notes && (
              <div className="pt-2 border-t">
                <span className="block mb-1">Notes</span>
                <div className="prose prose-sm dark:prose-invert max-w-none text-foreground prose-p:my-1 prose-table:text-sm">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeRaw]}
                  >
                    {transaction.notes}
                  </ReactMarkdown>
                </div>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Section 8: Actions */}
      <div className="pt-4 border-t flex gap-2">
        {onEdit && (
          <Button
            variant="secondary"
            className="flex-1"
            onClick={onEdit}
            disabled={isLoading}
          >
            <EditIcon className="h-4 w-4 mr-1" />
            Edit transaction
          </Button>
        )}
        {onDelete && (
          <Button
            variant="secondary"
            className="flex-1 text-destructive hover:text-destructive"
            onClick={onDelete}
            disabled={isLoading}
          >
            <TrashIcon className="h-4 w-4 mr-1" />
            Delete transaction
          </Button>
        )}
      </div>

      {/* Category Picker */}
      <CategoryPicker
        open={isCategoryPickerOpen}
        onOpenChange={setIsCategoryPickerOpen}
        transaction={transaction}
        onCategorySelect={handleCategorySelect}
      />
    </div>
  );
};

export default TransactionDetailsView;
