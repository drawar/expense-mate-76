import React, { useState, useEffect, useMemo } from "react";
import { PaymentMethod, Currency } from "@/types";
import { CurrencyService, ConversionService } from "@/core/currency";
import { RewardCurrency } from "@/core/currency/types";
import { CardCatalogEntry } from "@/core/catalog";
import { v4 as uuidv4 } from "uuid";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertCircle,
  CreditCard,
  X,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  VisaLogoIcon,
  MastercardLogoIcon,
  AmericanExpressLogoIcon,
} from "react-svg-credit-card-payment-icons";
import CardCatalogPicker from "./CardCatalogPicker";
import { useIsMobile } from "@/hooks/use-mobile";

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
  "neo financial:cathay world elite mastercard":
    "https://www.finlywealth.com/_next/image?url=%2Fapi%2Fmedia%2Ffile%2Fcathay_world_elite_creditcard.png&w=3840&q=100",
  "hsbc:revolution visa platinum":
    "https://storage.googleapis.com/max-sg/assets/cc_appplication_icons/HSBC%20Revolution.png",
  "brim financial:air france klm world elite":
    "https://princeoftravel.com/wp-content/uploads/2023/09/AFKLM_WorldElite_FINAL-V2-01-1.png",
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

// Common credit card issuers
const CARD_ISSUERS = [
  "American Express",
  "BMO",
  "Brim Financial",
  "CIBC",
  "Citibank",
  "DBS",
  "HSBC",
  "Neo Financial",
  "OCBC",
  "RBC",
  "Scotiabank",
  "TD",
  "UOB",
] as const;

// Validation error type
interface ValidationErrors {
  name?: string;
  lastFourDigits?: string;
  statementStartDay?: string;
  totalLoaded?: string;
}

interface PaymentMethodFormProps {
  currentMethod: PaymentMethod | null;
  isEditing: boolean;
  isLoading: boolean;
  onClose: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  isOpen: boolean; // Add this prop to control the dialog open state
}

const currencyOptions = CurrencyService.getCurrencyOptions();

const PaymentMethodForm: React.FC<PaymentMethodFormProps> = ({
  currentMethod,
  isEditing,
  isLoading,
  onClose,
  onSubmit,
  isOpen,
}) => {
  const isMobile = useIsMobile();

  // All form fields as controlled state
  const [name, setName] = useState<string>(currentMethod?.name || "");
  const [selectedType, setSelectedType] = useState<string>(
    currentMethod?.type || "credit_card"
  );
  const [currency, setCurrency] = useState<string>(
    currentMethod?.currency || "CAD"
  );
  const [issuer, setIssuer] = useState<string>(currentMethod?.issuer || "");
  const [lastFourDigits, setLastFourDigits] = useState<string>(
    currentMethod?.lastFourDigits || ""
  );
  const [pointsCurrency, setPointsCurrency] = useState<string>(
    currentMethod?.pointsCurrency || ""
  );
  const [rewardCurrencyId, setRewardCurrencyId] = useState<string>(
    currentMethod?.rewardCurrencyId || ""
  );
  const [statementStartDay, setStatementStartDay] = useState<string>(
    currentMethod?.statementStartDay?.toString() || ""
  );
  const [isMonthlyStatement, setIsMonthlyStatement] = useState<boolean>(
    currentMethod?.isMonthlyStatement || false
  );
  const [active, setActive] = useState<boolean>(currentMethod?.active ?? true);
  const [totalLoaded, setTotalLoaded] = useState<string>(
    currentMethod?.totalLoaded?.toString() || ""
  );

  // Card catalog state
  const [showCatalogPicker, setShowCatalogPicker] = useState(false);
  const [selectedCatalogEntry, setSelectedCatalogEntry] =
    useState<CardCatalogEntry | null>(null);
  const [cardCatalogId, setCardCatalogId] = useState<string>(
    currentMethod?.cardCatalogId || ""
  );
  const [nickname, setNickname] = useState<string>(
    currentMethod?.nickname || ""
  );

  // Collapsible section state for lean catalog card flow
  const [showBillingDetails, setShowBillingDetails] = useState(false);

  // Validation state
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Reward currencies from database
  const [rewardCurrencies, setRewardCurrencies] = useState<RewardCurrency[]>(
    []
  );
  const [isLoadingCurrencies, setIsLoadingCurrencies] = useState(false);

  // Validation functions
  const validateName = (value: string): string | undefined => {
    if (!value.trim()) {
      return "Name is required";
    }
    if (value.trim().length < 2) {
      return "Name must be at least 2 characters";
    }
    return undefined;
  };

  const validateLastFourDigits = (value: string): string | undefined => {
    if (!value) return undefined; // Optional field
    if (!/^\d{4}$/.test(value)) {
      return "Must be exactly 4 digits";
    }
    return undefined;
  };

  const validateStatementDay = (value: string): string | undefined => {
    if (!value) return undefined; // Optional field
    const day = parseInt(value, 10);
    if (isNaN(day) || day < 1 || day > 28) {
      return "Must be between 1 and 28";
    }
    return undefined;
  };

  const validateTotalLoaded = (value: string): string | undefined => {
    if (!value) return undefined; // Optional field
    const amount = parseFloat(value);
    if (isNaN(amount) || amount < 0) {
      return "Must be a positive number";
    }
    return undefined;
  };

  // Run validation on field change
  const handleFieldBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));

    const newErrors = { ...errors };
    switch (field) {
      case "name":
        newErrors.name = validateName(name);
        break;
      case "lastFourDigits":
        newErrors.lastFourDigits = validateLastFourDigits(lastFourDigits);
        break;
      case "statementStartDay":
        newErrors.statementStartDay = validateStatementDay(statementStartDay);
        break;
      case "totalLoaded":
        newErrors.totalLoaded = validateTotalLoaded(totalLoaded);
        break;
    }
    setErrors(newErrors);
  };

  // Check if form is valid
  const isFormValid = useMemo(() => {
    // For catalog cards, name is pre-filled from catalog
    const nameError = selectedCatalogEntry ? undefined : validateName(name);
    const digitsError = validateLastFourDigits(lastFourDigits);
    const dayError = validateStatementDay(statementStartDay);
    const loadedError = validateTotalLoaded(totalLoaded);
    return !nameError && !digitsError && !dayError && !loadedError;
  }, [
    name,
    lastFourDigits,
    statementStartDay,
    totalLoaded,
    selectedCatalogEntry,
  ]);

  // Fetch all reward currencies when dialog opens
  useEffect(() => {
    if (isOpen) {
      const fetchCurrencies = async () => {
        setIsLoadingCurrencies(true);
        try {
          const conversionService = ConversionService.getInstance();
          const currencies = await conversionService.getRewardCurrencies();
          setRewardCurrencies(currencies);
        } catch (error) {
          console.error("Error fetching reward currencies:", error);
        } finally {
          setIsLoadingCurrencies(false);
        }
      };
      fetchCurrencies();
    }
  }, [isOpen]);

  // Handle catalog card selection
  const handleCatalogSelection = (entry: CardCatalogEntry | null) => {
    if (entry) {
      // Selected a card from catalog
      setSelectedCatalogEntry(entry);
      setCardCatalogId(entry.id);
      // Pre-fill fields from catalog
      setName(entry.name);
      setIssuer(entry.issuer);
      setCurrency(entry.currency as Currency);
      setPointsCurrency(entry.pointsCurrency || "");
      setRewardCurrencyId(entry.rewardCurrencyId || "");
      setSelectedType("credit_card");
    } else {
      // Creating custom card
      setSelectedCatalogEntry(null);
      setCardCatalogId("");
      // Reset to defaults for manual entry
      setName("");
      setIssuer("");
    }
  };

  // Clear catalog selection
  const handleClearCatalogSelection = () => {
    setSelectedCatalogEntry(null);
    setCardCatalogId("");
    setName("");
    setIssuer("");
    setPointsCurrency("");
    setRewardCurrencyId("");
  };

  // Reset all form values when dialog opens with different method
  useEffect(() => {
    setName(currentMethod?.name || "");
    setSelectedType(currentMethod?.type || "credit_card");
    setCurrency(currentMethod?.currency || "CAD");
    setIssuer(currentMethod?.issuer || "");
    setLastFourDigits(currentMethod?.lastFourDigits || "");
    setPointsCurrency(currentMethod?.pointsCurrency || "");
    setRewardCurrencyId(currentMethod?.rewardCurrencyId || "");
    setStatementStartDay(currentMethod?.statementStartDay?.toString() || "");
    setIsMonthlyStatement(currentMethod?.isMonthlyStatement || false);
    setActive(currentMethod?.active ?? true);
    setTotalLoaded(currentMethod?.totalLoaded?.toString() || "");
    // Card catalog state
    setCardCatalogId(currentMethod?.cardCatalogId || "");
    setNickname(currentMethod?.nickname || "");
    setSelectedCatalogEntry(null); // Will be fetched separately if needed
    setShowBillingDetails(false); // Reset collapsible state
    // Reset validation state
    setErrors({});
    setTouched({});
  }, [currentMethod, isOpen]);

  const isCreditCard = selectedType === "credit_card";
  const isPrepaidCard = selectedType === "prepaid_card";
  const isCardType = isCreditCard || isPrepaidCard;

  // Form content
  const formContent = (
    <form
      onSubmit={onSubmit}
      style={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        minHeight: 0,
        overflow: "hidden",
      }}
    >
      {/* Hidden inputs */}
      <input type="hidden" name="type" value={selectedType} />
      <input type="hidden" name="currency" value={currency} />
      <input type="hidden" name="pointsCurrency" value={pointsCurrency} />
      <input type="hidden" name="rewardCurrencyId" value={rewardCurrencyId} />
      <input
        type="hidden"
        name="isMonthlyStatement"
        value={isMonthlyStatement ? "on" : ""}
      />
      <input type="hidden" name="active" value={active ? "on" : ""} />
      <input type="hidden" name="totalLoaded" value={totalLoaded} />
      <input type="hidden" name="cardCatalogId" value={cardCatalogId} />
      <input type="hidden" name="nickname" value={nickname} />
      {selectedCatalogEntry && (
        <input type="hidden" name="issuer" value={issuer} />
      )}

      {/* Scrollable form content */}
      <div
        className="px-4 py-4 space-y-5"
        style={{ flex: 1, overflowY: "auto", minHeight: 0 }}
      >
        {/* ============================================ */}
        {/* LEAN CATALOG CARD FLOW (Add mode only)      */}
        {/* ============================================ */}
        {!isEditing && selectedCatalogEntry ? (
          <>
            {/* Selected card display */}
            {(() => {
              const cardImageUrl = getCardImageUrl(selectedCatalogEntry);
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
                          alt={selectedCatalogEntry.name}
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
                        {selectedCatalogEntry.name}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span
                          className="text-xs"
                          style={{ color: "var(--color-text-secondary)" }}
                        >
                          {selectedCatalogEntry.issuer}
                        </span>
                        <span
                          className="text-xs"
                          style={{ color: "var(--color-text-tertiary)" }}
                        >
                          {selectedCatalogEntry.currency}
                        </span>
                      </div>
                    </div>

                    {/* Network logo */}
                    {selectedCatalogEntry.network && (
                      <div className="shrink-0">
                        <NetworkLogo
                          network={selectedCatalogEntry.network}
                          size={24}
                        />
                      </div>
                    )}

                    {/* Remove button - consistent 24px icon, tertiary color */}
                    <button
                      type="button"
                      className="shrink-0 p-1 rounded-md hover:bg-accent transition-colors"
                      onClick={handleClearCatalogSelection}
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
            })()}

            {/* Last 4 Digits - the only required field */}
            <div className="space-y-1.5">
              <Label
                htmlFor="lastFourDigits"
                className="text-sm font-medium"
                style={{ color: "var(--color-text-primary)" }}
              >
                Last 4 Digits{" "}
                <span style={{ color: "var(--color-text-tertiary)" }}>
                  (optional)
                </span>
              </Label>
              <Input
                id="lastFourDigits"
                name="lastFourDigits"
                placeholder="1234"
                maxLength={4}
                inputMode="numeric"
                autoFocus
                value={lastFourDigits}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "");
                  setLastFourDigits(value);
                }}
                onBlur={() => handleFieldBlur("lastFourDigits")}
                className="h-11 rounded-lg text-base"
                style={{
                  borderColor:
                    touched.lastFourDigits && errors.lastFourDigits
                      ? "var(--color-error)"
                      : undefined,
                }}
              />
              {touched.lastFourDigits && errors.lastFourDigits && (
                <p
                  className="text-xs flex items-center gap-1"
                  style={{ color: "var(--color-error)" }}
                >
                  <AlertCircle className="h-3 w-3" />
                  {errors.lastFourDigits}
                </p>
              )}
            </div>

            {/* Collapsible billing details */}
            <div>
              <button
                type="button"
                className="flex items-center gap-2 text-sm py-2"
                style={{ color: "var(--color-text-secondary)" }}
                onClick={() => setShowBillingDetails(!showBillingDetails)}
              >
                {showBillingDetails ? (
                  <ChevronUp
                    className="h-4 w-4"
                    style={{ color: "var(--color-text-tertiary)" }}
                  />
                ) : (
                  <ChevronDown
                    className="h-4 w-4"
                    style={{ color: "var(--color-text-tertiary)" }}
                  />
                )}
                {showBillingDetails ? "Hide" : "Show"} billing cycle details
              </button>

              {showBillingDetails && (
                <div className="space-y-4 pt-2">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="statementStartDay"
                        className="text-sm font-medium"
                        style={{ color: "var(--color-text-secondary)" }}
                      >
                        Statement Day
                      </Label>
                      <Input
                        id="statementStartDay"
                        name="statementStartDay"
                        type="number"
                        inputMode="numeric"
                        min="1"
                        max="28"
                        placeholder="15"
                        value={statementStartDay}
                        onChange={(e) => setStatementStartDay(e.target.value)}
                        onBlur={() => handleFieldBlur("statementStartDay")}
                        className="h-11 rounded-lg text-base"
                        style={{
                          borderColor:
                            touched.statementStartDay &&
                            errors.statementStartDay
                              ? "var(--color-error)"
                              : undefined,
                        }}
                      />
                    </div>
                    <div className="space-y-1.5 flex flex-col justify-end">
                      <div
                        className="h-11 px-3 rounded-lg border flex items-center justify-between cursor-pointer"
                        style={{ borderColor: "var(--color-border)" }}
                        onClick={() =>
                          setIsMonthlyStatement(!isMonthlyStatement)
                        }
                      >
                        <span
                          className="text-sm"
                          style={{ color: "var(--color-text-secondary)" }}
                        >
                          {isMonthlyStatement ? "Statement" : "Calendar"}
                        </span>
                        <Switch
                          id="isMonthlyStatement"
                          name="isMonthlyStatement"
                          checked={isMonthlyStatement}
                          onCheckedChange={setIsMonthlyStatement}
                          className="scale-90"
                        />
                      </div>
                    </div>
                  </div>
                  <p
                    className="text-xs"
                    style={{ color: "var(--color-text-tertiary)" }}
                  >
                    {isMonthlyStatement
                      ? `Statement month: ${statementStartDay || "2"}th to ${statementStartDay ? parseInt(statementStartDay) - 1 || 1 : "1"}st`
                      : "Calendar month: 1st to end of month"}
                  </p>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            {/* ============================================ */}
            {/* FULL FORM (Custom cards or Edit mode)       */}
            {/* ============================================ */}

            {/* Card Catalog Selection - Only for new credit cards */}
            {!isEditing && isCreditCard && (
              <Button
                type="button"
                variant="outline"
                className="w-full h-12 rounded-xl"
                onClick={() => setShowCatalogPicker(true)}
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Select Card from Catalog
              </Button>
            )}

            {/* Show linked catalog info when editing */}
            {isEditing && currentMethod?.cardCatalogId && (
              <div
                className="border rounded-xl p-3"
                style={{
                  backgroundColor: "var(--color-bg-secondary)",
                  borderColor: "var(--color-border)",
                }}
              >
                <p
                  className="text-xs"
                  style={{ color: "var(--color-text-tertiary)" }}
                >
                  Linked to catalog card
                </p>
                <p
                  className="font-medium"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  {currentMethod.issuer} {currentMethod.name}
                </p>
              </div>
            )}

            {/* === CORE FIELDS SECTION === */}
            <div className="space-y-4">
              {/* Nickname field (editing catalog card) */}
              {isEditing && currentMethod?.cardCatalogId ? (
                <div className="space-y-1.5">
                  <Label
                    htmlFor="nickname"
                    className="text-sm font-medium"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    Nickname
                  </Label>
                  <Input
                    id="nickname"
                    name="nickname-field"
                    placeholder="e.g. My Travel Card (optional)"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    className="h-11 rounded-lg text-base"
                  />
                  <p
                    className="text-xs"
                    style={{ color: "var(--color-text-tertiary)" }}
                  >
                    Optional custom name for this card
                  </p>
                </div>
              ) : (
                /* Name field (custom cards) */
                <div className="space-y-1.5">
                  <Label
                    htmlFor="name"
                    className="text-sm font-medium"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    Name <span style={{ color: "var(--color-error)" }}>*</span>
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="e.g. Chase Sapphire"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onBlur={() => handleFieldBlur("name")}
                    required
                    className="h-11 rounded-lg text-base"
                    style={{
                      borderColor:
                        touched.name && errors.name
                          ? "var(--color-error)"
                          : undefined,
                    }}
                  />
                  {touched.name && errors.name && (
                    <p
                      className="text-xs flex items-center gap-1"
                      style={{ color: "var(--color-error)" }}
                    >
                      <AlertCircle className="h-3 w-3" />
                      {errors.name}
                    </p>
                  )}
                </div>
              )}

              {/* Type + Currency (custom cards only, not when editing catalog card) */}
              {!(isEditing && currentMethod?.cardCatalogId) && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="type"
                      className="text-sm font-medium"
                      style={{ color: "var(--color-text-primary)" }}
                    >
                      Type
                    </Label>
                    <Select
                      value={selectedType}
                      onValueChange={setSelectedType}
                    >
                      <SelectTrigger className="h-11 rounded-lg text-base">
                        <SelectValue placeholder="Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="credit_card">Credit Card</SelectItem>
                        <SelectItem value="prepaid_card">
                          Prepaid Card
                        </SelectItem>
                        <SelectItem value="cash">Cash</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="currency"
                      className="text-sm font-medium"
                      style={{ color: "var(--color-text-primary)" }}
                    >
                      Currency
                    </Label>
                    <Select value={currency} onValueChange={setCurrency}>
                      <SelectTrigger className="h-11 rounded-lg text-base">
                        <SelectValue placeholder="Currency" />
                      </SelectTrigger>
                      <SelectContent>
                        {currencyOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {/* Issuer (credit card only, custom cards) */}
              {isCreditCard && !(isEditing && currentMethod?.cardCatalogId) && (
                <div className="space-y-1.5">
                  <Label
                    htmlFor="issuer"
                    className="text-sm font-medium"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    Issuer
                  </Label>
                  <Select value={issuer} onValueChange={setIssuer}>
                    <SelectTrigger className="h-11 rounded-lg text-base">
                      <SelectValue placeholder="Select issuer" />
                    </SelectTrigger>
                    <SelectContent>
                      {CARD_ISSUERS.map((issuerOption) => (
                        <SelectItem key={issuerOption} value={issuerOption}>
                          {issuerOption}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <input type="hidden" name="issuer" value={issuer} />
                </div>
              )}

              {/* Rewards Currency (credit card only, custom cards) */}
              {isCreditCard && !(isEditing && currentMethod?.cardCatalogId) && (
                <div className="space-y-1.5">
                  <Label
                    htmlFor="rewardCurrency"
                    className="text-sm font-medium"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    Rewards Currency
                  </Label>
                  <Select
                    key={`${rewardCurrencies.length}-${rewardCurrencyId}`}
                    value={rewardCurrencyId}
                    onValueChange={(value) => {
                      setRewardCurrencyId(value);
                      const selected = rewardCurrencies.find(
                        (c) => c.id === value
                      );
                      if (selected) {
                        setPointsCurrency(selected.displayName);
                      }
                    }}
                    disabled={isLoadingCurrencies}
                  >
                    <SelectTrigger className="h-11 rounded-lg text-base">
                      <SelectValue
                        placeholder={
                          isLoadingCurrencies
                            ? "Loading..."
                            : "Select rewards currency"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {rewardCurrencies.map((curr) => (
                        <SelectItem key={curr.id} value={curr.id}>
                          {curr.displayName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* === OPTIONAL FIELDS SECTION === */}
            {(isCardType || isCreditCard) && (
              <>
                <div
                  className="h-px my-5"
                  style={{ backgroundColor: "var(--color-border)" }}
                />

                <div className="space-y-4">
                  {/* Last 4 Digits (cards only) */}
                  {isCardType && (
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="lastFourDigits"
                        className="text-sm font-medium"
                        style={{ color: "var(--color-text-secondary)" }}
                      >
                        Last 4 Digits
                      </Label>
                      <Input
                        id="lastFourDigits"
                        name="lastFourDigits"
                        placeholder="1234"
                        maxLength={4}
                        inputMode="numeric"
                        value={lastFourDigits}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, "");
                          setLastFourDigits(value);
                        }}
                        onBlur={() => handleFieldBlur("lastFourDigits")}
                        className="h-11 rounded-lg text-base"
                        style={{
                          borderColor:
                            touched.lastFourDigits && errors.lastFourDigits
                              ? "var(--color-error)"
                              : undefined,
                        }}
                      />
                      {touched.lastFourDigits && errors.lastFourDigits && (
                        <p
                          className="text-xs flex items-center gap-1"
                          style={{ color: "var(--color-error)" }}
                        >
                          <AlertCircle className="h-3 w-3" />
                          {errors.lastFourDigits}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Total Loaded (prepaid only) */}
                  {isPrepaidCard && (
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="totalLoaded"
                        className="text-sm font-medium"
                        style={{ color: "var(--color-text-secondary)" }}
                      >
                        Total Loaded
                      </Label>
                      <Input
                        id="totalLoaded"
                        name="totalLoaded"
                        type="number"
                        inputMode="decimal"
                        min="0"
                        step="0.01"
                        placeholder="500.00"
                        value={totalLoaded}
                        onChange={(e) => setTotalLoaded(e.target.value)}
                        onBlur={() => handleFieldBlur("totalLoaded")}
                        className="h-11 rounded-lg text-base"
                        style={{
                          borderColor:
                            touched.totalLoaded && errors.totalLoaded
                              ? "var(--color-error)"
                              : undefined,
                        }}
                      />
                      {touched.totalLoaded && errors.totalLoaded && (
                        <p
                          className="text-xs flex items-center gap-1"
                          style={{ color: "var(--color-error)" }}
                        >
                          <AlertCircle className="h-3 w-3" />
                          {errors.totalLoaded}
                        </p>
                      )}
                      <p
                        className="text-xs"
                        style={{ color: "var(--color-text-tertiary)" }}
                      >
                        Total amount loaded onto this prepaid card
                      </p>
                    </div>
                  )}

                  {/* Credit card billing fields */}
                  {isCreditCard && (
                    <>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label
                            htmlFor="statementStartDay"
                            className="text-sm font-medium"
                            style={{ color: "var(--color-text-secondary)" }}
                          >
                            Statement Day
                          </Label>
                          <Input
                            id="statementStartDay"
                            name="statementStartDay"
                            type="number"
                            inputMode="numeric"
                            min="1"
                            max="28"
                            placeholder="15"
                            value={statementStartDay}
                            onChange={(e) =>
                              setStatementStartDay(e.target.value)
                            }
                            onBlur={() => handleFieldBlur("statementStartDay")}
                            className="h-11 rounded-lg text-base"
                            style={{
                              borderColor:
                                touched.statementStartDay &&
                                errors.statementStartDay
                                  ? "var(--color-error)"
                                  : undefined,
                            }}
                          />
                          {touched.statementStartDay &&
                            errors.statementStartDay && (
                              <p
                                className="text-xs flex items-center gap-1"
                                style={{ color: "var(--color-error)" }}
                              >
                                <AlertCircle className="h-3 w-3" />
                                {errors.statementStartDay}
                              </p>
                            )}
                        </div>
                        <div className="space-y-1.5 flex flex-col justify-end">
                          <div
                            className="h-11 px-3 rounded-lg border flex items-center justify-between cursor-pointer"
                            style={{ borderColor: "var(--color-border)" }}
                            onClick={() =>
                              setIsMonthlyStatement(!isMonthlyStatement)
                            }
                          >
                            <span
                              className="text-sm"
                              style={{ color: "var(--color-text-secondary)" }}
                            >
                              {isMonthlyStatement ? "Statement" : "Calendar"}
                            </span>
                            <Switch
                              id="isMonthlyStatement"
                              name="isMonthlyStatement"
                              checked={isMonthlyStatement}
                              onCheckedChange={setIsMonthlyStatement}
                              className="scale-90"
                            />
                          </div>
                        </div>
                      </div>
                      <p
                        className="text-xs -mt-2"
                        style={{ color: "var(--color-text-tertiary)" }}
                      >
                        {isMonthlyStatement
                          ? `Statement: ${statementStartDay || "2"}th to ${statementStartDay ? parseInt(statementStartDay) - 1 || 1 : "1"}st`
                          : "Calendar: 1st to end of month"}
                      </p>
                    </>
                  )}
                </div>
              </>
            )}

            {/* === STATUS TOGGLE (Edit mode only) === */}
            {isEditing && (
              <div className="pt-2">
                <div
                  className="px-4 py-3 rounded-xl flex items-center justify-between"
                  style={{ backgroundColor: "var(--color-bg-secondary)" }}
                >
                  <div>
                    <p
                      className="text-sm font-medium"
                      style={{ color: "var(--color-text-primary)" }}
                    >
                      Status
                    </p>
                    <p
                      className="text-xs"
                      style={{ color: "var(--color-text-tertiary)" }}
                    >
                      {active
                        ? "This card is active and available"
                        : "Card is hidden from selection"}
                    </p>
                  </div>
                  <Switch
                    id="active"
                    name="active"
                    checked={active}
                    onCheckedChange={setActive}
                  />
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <div
        className="px-4 py-4 border-t flex gap-3"
        style={{
          flexShrink: 0,
          borderColor: "var(--color-border)",
          backgroundColor: "var(--color-bg)",
          paddingBottom: isMobile
            ? "max(16px, env(safe-area-inset-bottom))"
            : "16px",
        }}
      >
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          className="flex-1 h-12 rounded-xl font-medium"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isLoading || !isFormValid}
          className="flex-1 h-12 rounded-xl font-medium"
          style={{
            backgroundColor: isFormValid ? "var(--color-accent)" : undefined,
            color: isFormValid ? "var(--color-bg)" : undefined,
          }}
        >
          {isLoading ? "Saving..." : isEditing ? "Update" : "Add"}
        </Button>
      </div>
    </form>
  );

  const title = isEditing ? "Edit Payment Method" : "Add Payment Method";

  // Use Dialog for both mobile and desktop
  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent
          className="sm:max-w-md p-0 overflow-hidden"
          hideCloseButton
          style={{
            display: "flex",
            flexDirection: "column",
            maxHeight: "85vh",
            gap: 0,
          }}
        >
          <DialogHeader
            className="px-5 py-4 border-b"
            style={{
              borderColor: "var(--color-border)",
              flexShrink: 0,
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <DialogTitle>{title}</DialogTitle>
            <DialogClose
              className="h-11 w-11 rounded-lg flex items-center justify-center ring-offset-background transition-colors hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              style={{ marginLeft: "12px" }}
            >
              <X
                className="h-6 w-6"
                style={{ color: "var(--color-text-tertiary)" }}
              />
              <span className="sr-only">Close</span>
            </DialogClose>
          </DialogHeader>
          {formContent}
        </DialogContent>
      </Dialog>

      <CardCatalogPicker
        open={showCatalogPicker}
        onOpenChange={setShowCatalogPicker}
        onSelectCard={handleCatalogSelection}
      />
    </>
  );
};

export default PaymentMethodForm;
