import { useState, useEffect } from "react";
import { format, parseISO } from "date-fns";
import { Transaction, PaymentMethod, Merchant } from "@/types";
import { CurrencyService } from "@/core/currency";
import { PropertyResolver } from "@/core/catalog/PropertyResolver";
import { storageService } from "@/core/storage";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix for default marker icon in Leaflet with bundlers
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)
  ._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

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
  ChevronDownIcon,
  ChevronUpIcon,
  PencilIcon,
  CoinsIcon,
  SplitIcon,
  MapPinIcon,
  TagIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tag } from "@/types";

/**
 * Get the display location for a merchant
 * If merchant has display_location, show it (even if marked as online)
 * Only returns "Online" if merchant is online AND has no physical location
 */
function getLocationDisplay(merchant: Merchant): string | null {
  if (merchant.display_location) return merchant.display_location;
  if (merchant.isOnline) return "Online";
  return null;
}
import { CategoryPicker } from "@/components/expense/transaction/CategoryPicker";

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
  const [splitGroupTransactions, setSplitGroupTransactions] = useState<
    Transaction[]
  >([]);
  const [splitGroupNotes, setSplitGroupNotes] = useState<string | null>(null);
  const [isSplitSectionOpen, setIsSplitSectionOpen] = useState(true);
  const [allTags, setAllTags] = useState<Tag[]>([]);

  // Fetch other transactions in the same split group and split group details
  useEffect(() => {
    const fetchSplitGroupData = async () => {
      if (!transaction.splitGroupId) {
        setSplitGroupTransactions([]);
        setSplitGroupNotes(null);
        return;
      }

      try {
        // Fetch transactions and split group details in parallel
        const [transactions, splitGroup] = await Promise.all([
          storageService.getTransactionsBySplitGroup(transaction.splitGroupId),
          storageService.getSplitGroup(transaction.splitGroupId),
        ]);

        setSplitGroupTransactions(transactions);
        setSplitGroupNotes(splitGroup?.notes || null);
      } catch (error) {
        console.error("Error fetching split group data:", error);
        setSplitGroupTransactions([]);
        setSplitGroupNotes(null);
      }
    };

    fetchSplitGroupData();
  }, [transaction.splitGroupId]);

  // Load all tags for display name lookup
  useEffect(() => {
    const loadTags = async () => {
      try {
        const tags = await storageService.getTags();
        setAllTags(tags);
      } catch (error) {
        console.error("Error loading tags:", error);
      }
    };
    loadTags();
  }, []);

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

  // Get display name for a tag slug
  const getTagDisplayName = (slug: string): string => {
    const tag = allTags.find((t) => t.slug === slug);
    return tag?.displayName || slug;
  };

  // Parse transaction tags
  const transactionTags = transaction.tags
    ? transaction.tags.split(",").filter(Boolean)
    : [];

  // Determine if there's additional details to show
  const hasExchangeRate =
    transaction.currency !== transaction.paymentCurrency &&
    transaction.paymentAmount &&
    transaction.amount;
  const exchangeRate = hasExchangeRate
    ? (transaction.paymentAmount / transaction.amount).toFixed(4)
    : null;

  const pointsCurrency = transaction.paymentMethod.pointsCurrency || "points";
  const loyaltyLogo = transaction.paymentMethod.rewardCurrencyLogoUrl;
  const loyaltyBgColor = transaction.paymentMethod.rewardCurrencyBgColor;
  const loyaltyLogoScale = transaction.paymentMethod.rewardCurrencyLogoScale;

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6 min-h-0 overscroll-contain">
        {/* Section 3: Amount (Hero) */}
        <div className="py-2 text-center">
          {/* Show net amount if there's reimbursement, otherwise show full amount */}
          <p className="text-4xl font-semibold">
            {CurrencyService.format(
              transaction.reimbursementAmount &&
                transaction.reimbursementAmount > 0
                ? transaction.amount - transaction.reimbursementAmount
                : transaction.amount,
              transaction.currency
            )}
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mt-1">
            <span>{format(parseISO(transaction.date), "yyyy-MM-dd")}</span>
            {getLocationDisplay(transaction.merchant) && (
              <>
                <span>·</span>
                <span>{getLocationDisplay(transaction.merchant)}</span>
              </>
            )}
            <span>·</span>
            <span>{transaction.category || "Uncategorized"}</span>
            {onCategoryChange && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                onClick={() => setIsCategoryPickerOpen(true)}
              >
                <PencilIcon className="h-3 w-3" />
              </Button>
            )}
          </div>
          {transaction.currency !== transaction.paymentCurrency && (
            <p className="text-sm text-muted-foreground mt-1">
              Paid{" "}
              {CurrencyService.format(
                transaction.paymentAmount,
                transaction.paymentCurrency
              )}
            </p>
          )}
          {/* Reimbursement Breakdown Card */}
          {transaction.reimbursementAmount != null &&
            transaction.reimbursementAmount > 0 && (
              <div className="mt-4 rounded-lg bg-muted/50 p-4 text-left">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">You paid</span>
                  <span>
                    {CurrencyService.format(
                      transaction.amount,
                      transaction.currency
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-muted-foreground">You got back</span>
                  <span className="text-green-600">
                    −
                    {CurrencyService.format(
                      transaction.reimbursementAmount,
                      transaction.currency
                    )}
                  </span>
                </div>
                <div className="border-t border-border my-2" />
                <div className="flex justify-between text-sm font-medium">
                  <span>Final cost</span>
                  <span>
                    {CurrencyService.format(
                      transaction.amount - transaction.reimbursementAmount,
                      transaction.currency
                    )}
                  </span>
                </div>
              </div>
            )}
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

        {/* Section 5.5: Split Payment Info */}
        {transaction.splitGroupId && splitGroupTransactions.length > 1 && (
          <Collapsible
            open={isSplitSectionOpen}
            onOpenChange={setIsSplitSectionOpen}
          >
            <CollapsibleTrigger asChild>
              <button className="flex items-center gap-2 text-sm w-full">
                <SplitIcon className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Split Payment ({splitGroupTransactions.length} parts)
                </span>
                {isSplitSectionOpen ? (
                  <ChevronUpIcon className="h-4 w-4 text-muted-foreground ml-auto" />
                ) : (
                  <ChevronDownIcon className="h-4 w-4 text-muted-foreground ml-auto" />
                )}
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-3">
              <div className="space-y-3">
                {/* Total amount */}
                <div className="flex justify-between text-sm pb-2 border-b">
                  <span className="text-muted-foreground">Total Purchase</span>
                  <span className="font-medium">
                    {CurrencyService.format(
                      splitGroupTransactions.reduce(
                        (sum, tx) => sum + tx.amount,
                        0
                      ),
                      transaction.currency
                    )}
                  </span>
                </div>

                {/* Individual portions */}
                {splitGroupTransactions.map((tx) => (
                  <div
                    key={tx.id}
                    className={`flex items-center justify-between p-2 rounded-lg ${
                      tx.id === transaction.id
                        ? "bg-accent/10 border border-accent/30"
                        : "bg-muted/30"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <CreditCardIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <div className="min-w-0">
                        <p
                          className={`text-sm truncate ${tx.id === transaction.id ? "font-medium" : ""}`}
                        >
                          {tx.paymentMethod.name}
                          {tx.id === transaction.id && (
                            <span className="text-xs text-muted-foreground ml-1">
                              (this)
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {tx.rewardPoints > 0
                            ? `+${tx.rewardPoints.toLocaleString()} ${tx.paymentMethod.pointsCurrency || "pts"}`
                            : "No points"}
                        </p>
                      </div>
                    </div>
                    <span className="text-sm font-medium whitespace-nowrap">
                      {CurrencyService.format(tx.amount, tx.currency)}
                    </span>
                  </div>
                ))}

                {/* Total points */}
                <div className="flex justify-between text-sm pt-2 border-t">
                  <span className="text-muted-foreground">Total Points</span>
                  <span className="font-medium text-primary">
                    +
                    {splitGroupTransactions
                      .reduce((sum, tx) => sum + tx.rewardPoints, 0)
                      .toLocaleString()}{" "}
                    pts
                  </span>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}

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
                  style={{ backgroundColor: loyaltyBgColor || "#ffffff" }}
                >
                  <img
                    src={loyaltyLogo}
                    alt={pointsCurrency}
                    className="h-16 w-16 object-contain"
                    style={
                      loyaltyLogoScale
                        ? { transform: `scale(${loyaltyLogoScale})` }
                        : undefined
                    }
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
            <div className="space-y-3 text-sm text-muted-foreground">
              {/* Map for merchants with coordinates (even if marked online) */}
              {transaction.merchant.coordinates && (
                <div
                  className="relative rounded-lg overflow-hidden"
                  style={{ height: "150px" }}
                >
                  <MapContainer
                    center={[
                      transaction.merchant.coordinates.lat,
                      transaction.merchant.coordinates.lng,
                    ]}
                    zoom={15}
                    scrollWheelZoom={false}
                    dragging={false}
                    zoomControl={false}
                    doubleClickZoom={false}
                    touchZoom={false}
                    keyboard={false}
                    boxZoom={false}
                    style={{
                      height: "100%",
                      width: "100%",
                    }}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <Marker
                      position={[
                        transaction.merchant.coordinates.lat,
                        transaction.merchant.coordinates.lng,
                      ]}
                    />
                  </MapContainer>
                  {/* Transparent overlay to capture clicks */}
                  {transaction.merchant.google_maps_url && (
                    <div
                      className="absolute inset-0 cursor-pointer z-[1000]"
                      onClick={() => {
                        window.open(
                          transaction.merchant.google_maps_url,
                          "_blank"
                        );
                      }}
                    >
                      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/70 text-white px-3 py-1 rounded text-xs flex items-center gap-1">
                        <MapPinIcon className="h-3 w-3" />
                        Tap to open in Google Maps
                      </div>
                    </div>
                  )}
                </div>
              )}

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
              {/* Show notes: split group notes for split transactions, otherwise transaction notes */}
              {(transaction.notes || splitGroupNotes) && (
                <div className="pt-2 border-t">
                  <span className="block mb-1">Notes</span>
                  <div className="prose prose-sm dark:prose-invert max-w-none text-foreground prose-p:my-1 prose-table:text-sm">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      rehypePlugins={[rehypeRaw]}
                    >
                      {splitGroupNotes || transaction.notes || ""}
                    </ReactMarkdown>
                  </div>
                </div>
              )}
              {/* Tags */}
              {transactionTags.length > 0 && (
                <div className="pt-2 border-t">
                  <span className="block mb-2">Tags</span>
                  <div className="flex flex-wrap gap-1.5">
                    {transactionTags.map((slug) => (
                      <Badge
                        key={slug}
                        variant="secondary"
                        className="flex items-center gap-1"
                      >
                        <TagIcon className="h-3 w-3" />
                        <span>{getTagDisplayName(slug)}</span>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>

      {/* Section 8: Actions (Footer) */}
      <div
        className="px-4 py-4 border-t flex flex-col gap-2 flex-shrink-0"
        style={{ borderColor: "var(--color-border)" }}
      >
        {onEdit && (
          <Button
            variant="outline"
            className="w-full"
            onClick={onEdit}
            disabled={isLoading}
          >
            Edit transaction
          </Button>
        )}
        {onDelete && (
          <Button
            variant="ghost"
            className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={onDelete}
            disabled={isLoading}
          >
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
