import React, { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, CreditCard, Loader2 } from "lucide-react";
import {
  VisaLogoIcon,
  MastercardLogoIcon,
  AmericanExpressLogoIcon,
} from "react-svg-credit-card-payment-icons";
import { CardCatalogEntry } from "@/core/catalog";
import {
  useCardCatalogQuery,
  useCardCatalogRegionsQuery,
} from "@/hooks/queries/useCardCatalogQuery";

interface CardCatalogPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectCard: (card: CardCatalogEntry | null) => void;
  defaultRegion?: string;
}

const REGION_LABELS: Record<string, string> = {
  SG: "Singapore",
  CA: "Canada",
  US: "United States",
  ALL: "All Regions",
};

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
    "https://mhgprod.blob.core.windows.net/singsaver/strapi-uploads/bltea3680481263edcb_492d0be83f.png",
  "neo financial:cathay world elite mastercard":
    "https://www.finlywealth.com/_next/image?url=%2Fapi%2Fmedia%2Ffile%2Fcathay_world_elite_creditcard.png&w=3840&q=100",
  "hsbc:revolution visa platinum":
    "https://yulueezoyjxobhureuxj.supabase.co/storage/v1/object/public/card-images/hsbc-revolution-visa-platinum.png",
  "brim financial:air france-klm world elite":
    "https://yulueezoyjxobhureuxj.supabase.co/storage/v1/object/public/card-images/brim-financial-air-france-klm-world-elite.png",
};

/**
 * Get card image URL from catalog entry or fallback
 */
function getCardImageUrl(card: CardCatalogEntry): string | null {
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

const NetworkIcon: React.FC<{ network?: string }> = ({ network }) => {
  switch (network?.toLowerCase()) {
    case "visa":
      return <VisaLogoIcon width={32} />;
    case "mastercard":
      return <MastercardLogoIcon width={32} />;
    case "amex":
      return <AmericanExpressLogoIcon width={32} />;
    default:
      return <CreditCard className="h-6 w-6 text-muted-foreground" />;
  }
};

const CardCatalogPicker: React.FC<CardCatalogPickerProps> = ({
  open,
  onOpenChange,
  onSelectCard,
  defaultRegion = "ALL",
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRegion, setSelectedRegion] = useState<string | undefined>(
    defaultRegion
  );

  // Fetch card catalog and regions
  const { data: cards = [], isLoading: isLoadingCards } = useCardCatalogQuery({
    region: selectedRegion === "ALL" ? undefined : selectedRegion,
  });
  const { data: regions = [] } = useCardCatalogRegionsQuery();

  // Filter cards based on search query
  const filteredCards = useMemo(() => {
    if (!searchQuery.trim()) return cards;

    const query = searchQuery.toLowerCase();
    return cards.filter(
      (card) =>
        card.name.toLowerCase().includes(query) ||
        card.issuer.toLowerCase().includes(query) ||
        card.pointsCurrency?.toLowerCase().includes(query)
    );
  }, [cards, searchQuery]);

  // Group cards by issuer for display
  const groupedCards = useMemo(() => {
    const groups = new Map<string, CardCatalogEntry[]>();
    for (const card of filteredCards) {
      const existing = groups.get(card.issuer) || [];
      existing.push(card);
      groups.set(card.issuer, existing);
    }
    // Sort issuers alphabetically
    return new Map(
      [...groups.entries()].sort((a, b) => a[0].localeCompare(b[0]))
    );
  }, [filteredCards]);

  const handleSelectCard = (card: CardCatalogEntry) => {
    onSelectCard(card);
    onOpenChange(false);
  };

  const handleCreateCustomCard = () => {
    onSelectCard(null);
    onOpenChange(false);
  };

  const handleClose = () => {
    setSearchQuery("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Select Your Card</DialogTitle>
          <DialogDescription>
            Choose from our catalog or create a custom card
          </DialogDescription>
        </DialogHeader>

        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by card name or issuer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Region Filter */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant={selectedRegion === "ALL" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedRegion("ALL")}
          >
            All
          </Button>
          {regions.map((region) => (
            <Button
              key={region}
              variant={selectedRegion === region ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedRegion(region)}
            >
              {REGION_LABELS[region] || region}
            </Button>
          ))}
        </div>

        {/* Card List */}
        <div className="flex-1 min-h-0 max-h-[50vh] overflow-y-auto -mx-5 px-5">
          {isLoadingCards ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredCards.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <CreditCard className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">
                {searchQuery
                  ? "No cards match your search"
                  : "No cards available in this region"}
              </p>
              <Button onClick={handleCreateCustomCard} variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Create Custom Card
              </Button>
            </div>
          ) : (
            <div className="space-y-6 pb-4">
              {Array.from(groupedCards.entries()).map(
                ([issuer, issuerCards]) => (
                  <div key={issuer}>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2 sticky top-0 bg-background py-1">
                      {issuer}
                    </h3>
                    <div className="space-y-3">
                      {issuerCards.map((card) => {
                        const imageUrl = getCardImageUrl(card);
                        return (
                          <button
                            key={card.id}
                            onClick={() => handleSelectCard(card)}
                            className="w-full p-4 border rounded-xl hover:bg-accent text-left transition-colors"
                            style={{ borderColor: "var(--color-border)" }}
                          >
                            <div className="flex items-center gap-3">
                              {/* Card image or fallback */}
                              {imageUrl ? (
                                <img
                                  src={imageUrl}
                                  alt={card.name}
                                  className="h-[37px] w-[58px] object-contain flex-shrink-0 rounded-sm"
                                />
                              ) : (
                                <div className="h-[37px] w-[58px] bg-muted flex items-center justify-center flex-shrink-0 rounded-sm">
                                  <CreditCard className="h-5 w-5 text-muted-foreground" />
                                </div>
                              )}

                              {/* Card info */}
                              <div className="flex-1 min-w-0">
                                <div className="font-medium truncate">
                                  {card.name}
                                </div>
                                {card.pointsCurrency && (
                                  <p className="text-xs text-muted-foreground mt-0.5 truncate">
                                    Earns {card.pointsCurrency}
                                  </p>
                                )}
                              </div>

                              {/* Network icon */}
                              <div className="shrink-0">
                                <NetworkIcon network={card.network} />
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </div>

        {/* Custom Card Option */}
        <div className="border-t pt-4 -mx-5 px-5">
          <Button
            onClick={handleCreateCustomCard}
            variant="outline"
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Custom Card (Not in Catalog)
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CardCatalogPicker;
