import React, { useState, useEffect, useMemo } from "react";
import { PaymentMethod, Currency } from "@/types";
import { CurrencyService, ConversionService } from "@/core/currency";
import { RewardCurrency } from "@/core/currency/types";
import { CardCatalogEntry } from "@/core/catalog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { AlertCircle, CreditCard, Plus, ChevronRight } from "lucide-react";
import CardCatalogPicker, { PersonalizeCardData } from "./CardCatalogPicker";
import CustomCardFormDialog, {
  CustomCardFormData,
} from "./CustomCardFormDialog";
import SelectionDialog, { SelectionOption } from "./SelectionDialog";
import { useIsMobile } from "@/hooks/use-mobile";
import { BillingCycleFields, LastFourDigitsField } from "./form";

// Credit/debit card issuers
const CREDIT_CARD_ISSUERS = [
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

// Gift card issuers
const GIFT_CARD_ISSUERS = ["Best Buy", "Joker", "Uber"] as const;

// Combined list of all issuers (sorted alphabetically)
const CARD_ISSUERS = [
  ...CREDIT_CARD_ISSUERS,
  ...GIFT_CARD_ISSUERS,
].sort() as unknown as readonly string[];

const currencyOptions = CurrencyService.getCurrencyOptions();

// Type options for selection dialog
const TYPE_OPTIONS: SelectionOption[] = [
  {
    value: "credit_card",
    label: "Credit Card",
    description: "Visa, Mastercard, Amex, etc.",
  },
  { value: "gift_card", label: "Gift Card", description: "Prepaid gift cards" },
  { value: "cash", label: "Cash", description: "Cash payments" },
];

// Currency options for selection dialog
const CURRENCY_OPTIONS: SelectionOption[] = currencyOptions.map((opt) => ({
  value: opt.value,
  label: opt.label,
}));

// Issuer options for selection dialog
const ISSUER_OPTIONS: SelectionOption[] = CARD_ISSUERS.map((issuer) => ({
  value: issuer,
  label: issuer,
}));

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
    currentMethod?.isMonthlyStatement ?? false
  );
  const [active, setActive] = useState<boolean>(currentMethod?.active ?? true);
  const [totalLoaded, setTotalLoaded] = useState<string>(
    currentMethod?.totalLoaded?.toString() || ""
  );
  const [purchaseDate, setPurchaseDate] = useState<string>(
    currentMethod?.purchaseDate || ""
  );

  // Card catalog state
  const [showCatalogPicker, setShowCatalogPicker] = useState(false);
  const [showCustomCardForm, setShowCustomCardForm] = useState(false);
  const [cardCatalogId, setCardCatalogId] = useState<string>(
    currentMethod?.cardCatalogId || ""
  );
  const [nickname, setNickname] = useState<string>(
    currentMethod?.nickname || ""
  );

  // Validation state
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Reward currencies from database
  const [rewardCurrencies, setRewardCurrencies] = useState<RewardCurrency[]>(
    []
  );
  const [isLoadingCurrencies, setIsLoadingCurrencies] = useState(false);

  // Selection dialog states (for edit mode)
  const [showTypeDialog, setShowTypeDialog] = useState(false);
  const [showCurrencyDialog, setShowCurrencyDialog] = useState(false);
  const [showIssuerDialog, setShowIssuerDialog] = useState(false);
  const [showRewardsCurrencyDialog, setShowRewardsCurrencyDialog] =
    useState(false);

  // Helper to get display labels
  const getTypeLabel = () =>
    TYPE_OPTIONS.find((o) => o.value === selectedType)?.label || "Select type";
  const getCurrencyLabel = () =>
    CURRENCY_OPTIONS.find((o) => o.value === currency)?.label ||
    "Select currency";
  const getIssuerLabel = () => issuer || "Select issuer";
  const getRewardsCurrencyLabel = () => {
    if (isLoadingCurrencies) return "Loading...";
    return (
      rewardCurrencies.find((c) => c.id === rewardCurrencyId)?.displayName ||
      "Select rewards currency"
    );
  };

  // Reward currency options for selection dialog
  const rewardCurrencyOptions: SelectionOption[] = useMemo(() => {
    return rewardCurrencies.map((curr) => ({
      value: curr.id,
      label: curr.displayName,
    }));
  }, [rewardCurrencies]);

  // Check if any child dialog is open (for edit mode)
  const isChildDialogOpen =
    showTypeDialog ||
    showCurrencyDialog ||
    showIssuerDialog ||
    showRewardsCurrencyDialog;

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

  // Check if form is valid (only used in edit mode)
  const isFormValid = useMemo(() => {
    const nameError = validateName(name);
    const digitsError = validateLastFourDigits(lastFourDigits);
    const dayError = validateStatementDay(statementStartDay);
    const loadedError = validateTotalLoaded(totalLoaded);
    return !nameError && !digitsError && !dayError && !loadedError;
  }, [name, lastFourDigits, statementStartDay, totalLoaded]);

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

  // Handle catalog card selection (for custom card path)
  const handleCatalogSelection = (entry: CardCatalogEntry | null) => {
    if (!entry) {
      // Creating custom card - open the custom card form
      setShowCustomCardForm(true);
    }
    // If entry is provided, it's handled by onCardPersonalized
  };

  // Handle card personalized submission from PersonalizeCardDialog
  const handleCardPersonalized = (data: PersonalizeCardData) => {
    const {
      card,
      lastFourDigits: digits,
      statementStartDay: day,
      isMonthlyStatement: monthly,
    } = data;

    // Create a synthetic event with the form data
    const syntheticEvent = {
      preventDefault: () => {},
      currentTarget: {
        elements: {
          name: { value: card.name },
          type: { value: "credit_card" },
          currency: { value: card.currency },
          issuer: { value: card.issuer },
          lastFourDigits: { value: digits },
          pointsCurrency: { value: card.pointsCurrency || "" },
          rewardCurrencyId: { value: card.rewardCurrencyId || "" },
          statementStartDay: { value: day },
          isMonthlyStatement: { checked: monthly },
          active: { checked: true },
          totalLoaded: { value: "" },
          purchaseDate: { value: "" },
          cardCatalogId: { value: card.id },
          nickname: { value: "" },
        },
      },
    } as unknown as React.FormEvent<HTMLFormElement>;

    onSubmit(syntheticEvent);
  };

  // Handle custom card form submission
  const handleCustomCardSubmit = (data: CustomCardFormData) => {
    // Set all form state from the custom card data
    setName(data.name);
    setSelectedType(data.type);
    setCurrency(data.currency);
    setIssuer(data.issuer);
    setLastFourDigits(data.lastFourDigits);
    setPointsCurrency(data.pointsCurrency);
    setRewardCurrencyId(data.rewardCurrencyId);
    setStatementStartDay(data.statementStartDay);
    setIsMonthlyStatement(data.isMonthlyStatement);
    setTotalLoaded(data.totalLoaded);
    setPurchaseDate(data.purchaseDate);
    setCardCatalogId("");
    setShowCustomCardForm(false);

    // Create a synthetic form event and submit
    const formData = new FormData();
    formData.set("name", data.name);
    formData.set("type", data.type);
    formData.set("currency", data.currency);
    formData.set("issuer", data.issuer);
    formData.set("lastFourDigits", data.lastFourDigits);
    formData.set("pointsCurrency", data.pointsCurrency);
    formData.set("rewardCurrencyId", data.rewardCurrencyId);
    formData.set("statementStartDay", data.statementStartDay);
    formData.set("isMonthlyStatement", data.isMonthlyStatement ? "on" : "");
    formData.set("active", "on");
    formData.set("totalLoaded", data.totalLoaded);
    formData.set("purchaseDate", data.purchaseDate);
    formData.set("cardCatalogId", "");
    formData.set("nickname", "");

    // Create a synthetic event with the form data
    const syntheticEvent = {
      preventDefault: () => {},
      currentTarget: {
        elements: {
          name: { value: data.name },
          type: { value: data.type },
          currency: { value: data.currency },
          issuer: { value: data.issuer },
          lastFourDigits: { value: data.lastFourDigits },
          pointsCurrency: { value: data.pointsCurrency },
          rewardCurrencyId: { value: data.rewardCurrencyId },
          statementStartDay: { value: data.statementStartDay },
          isMonthlyStatement: { checked: data.isMonthlyStatement },
          active: { checked: true },
          totalLoaded: { value: data.totalLoaded },
          purchaseDate: { value: data.purchaseDate },
          cardCatalogId: { value: "" },
          nickname: { value: "" },
        },
      },
    } as unknown as React.FormEvent<HTMLFormElement>;

    onSubmit(syntheticEvent);
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
    setIsMonthlyStatement(currentMethod?.isMonthlyStatement ?? false);
    setActive(currentMethod?.active ?? true);
    setTotalLoaded(currentMethod?.totalLoaded?.toString() || "");
    setPurchaseDate(currentMethod?.purchaseDate || "");
    // Card catalog state
    setCardCatalogId(currentMethod?.cardCatalogId || "");
    setNickname(currentMethod?.nickname || "");
    // Reset validation state
    setErrors({});
    setTouched({});
  }, [currentMethod, isOpen]);

  const isCreditCard = selectedType === "credit_card";
  const isGiftCard = selectedType === "gift_card";
  const isCardType = isCreditCard || isGiftCard;

  // Form content
  const formContent = (
    <form
      onSubmit={onSubmit}
      className="flex flex-col flex-1 min-h-0 overflow-hidden"
    >
      {/* Hidden inputs */}
      <input type="hidden" name="name" value={name} />
      <input type="hidden" name="type" value={selectedType} />
      <input type="hidden" name="currency" value={currency} />
      <input type="hidden" name="pointsCurrency" value={pointsCurrency} />
      <input type="hidden" name="rewardCurrencyId" value={rewardCurrencyId} />
      <input type="hidden" name="statementStartDay" value={statementStartDay} />
      <input
        type="hidden"
        name="isMonthlyStatement"
        value={isMonthlyStatement ? "on" : ""}
      />
      <input type="hidden" name="active" value={active ? "on" : ""} />
      <input type="hidden" name="totalLoaded" value={totalLoaded} />
      <input type="hidden" name="purchaseDate" value={purchaseDate} />
      <input type="hidden" name="cardCatalogId" value={cardCatalogId} />
      <input type="hidden" name="nickname" value={nickname} />
      <input type="hidden" name="issuer" value={issuer} />

      {/* Scrollable form content */}
      <div className="px-4 py-4 space-y-5 flex-1 overflow-y-auto min-h-0">
        {/* ============================================ */}
        {/* ADD MODE - Card Selection Options           */}
        {/* ============================================ */}
        {!isEditing ? (
          <div className="space-y-4">
            <Button
              type="button"
              variant="outline"
              className="w-full h-14 rounded-xl text-base justify-start px-4"
              onClick={() => setShowCatalogPicker(true)}
            >
              <CreditCard className="h-5 w-5 mr-3" />
              <div className="text-left">
                <div className="font-medium">Select Card from Catalog</div>
                <div
                  className="text-xs font-normal"
                  style={{ color: "var(--color-text-tertiary)" }}
                >
                  Choose from our database of cards
                </div>
              </div>
            </Button>

            <Button
              type="button"
              variant="outline"
              className="w-full h-14 rounded-xl text-base justify-start px-4"
              onClick={() => setShowCustomCardForm(true)}
            >
              <Plus className="h-5 w-5 mr-3" />
              <div className="text-left">
                <div className="font-medium">Create Custom Card</div>
                <div
                  className="text-xs font-normal"
                  style={{ color: "var(--color-text-tertiary)" }}
                >
                  Add a card not in our catalog
                </div>
              </div>
            </Button>
          </div>
        ) : (
          <>
            {/* ============================================ */}
            {/* FULL FORM (Edit mode only)                  */}
            {/* ============================================ */}

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
                <div>
                  <div className="py-3 flex items-center justify-between gap-4">
                    <label
                      htmlFor="nickname"
                      className="text-base md:text-sm font-medium shrink-0"
                      style={{ color: "var(--color-text-secondary)" }}
                    >
                      Nickname
                    </label>
                    <Input
                      id="nickname"
                      name="nickname-field"
                      placeholder="e.g. My Travel Card"
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      className="h-9 rounded-lg text-base md:text-sm text-right border-none shadow-none pl-0 pr-2 focus-visible:ring-0"
                      style={{
                        backgroundColor: "transparent",
                        color: "var(--color-text-primary)",
                      }}
                    />
                  </div>
                </div>
              ) : (
                /* Name field (custom cards) */
                <div>
                  <div className="py-3 flex items-center justify-between gap-4">
                    <label
                      htmlFor="name"
                      className="text-base md:text-sm font-medium shrink-0"
                      style={{ color: "var(--color-text-secondary)" }}
                    >
                      Name{" "}
                      <span style={{ color: "var(--color-error)" }}>*</span>
                    </label>
                    <Input
                      id="name"
                      name="name"
                      placeholder="e.g. Chase Sapphire"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      onBlur={() => handleFieldBlur("name")}
                      required
                      className="h-9 rounded-lg text-base md:text-sm text-right border-none shadow-none pl-0 pr-2 focus-visible:ring-0"
                      style={{
                        backgroundColor: "transparent",
                        color: "var(--color-text-primary)",
                      }}
                    />
                  </div>
                  {touched.name && errors.name && (
                    <p
                      className="text-xs flex items-center gap-1 justify-end"
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
                <>
                  {/* Type field */}
                  <button
                    type="button"
                    onClick={() => setShowTypeDialog(true)}
                    className="w-full py-3 flex items-center justify-between text-base md:text-sm"
                  >
                    <span
                      className="font-medium whitespace-nowrap shrink-0"
                      style={{ color: "var(--color-text-secondary)" }}
                    >
                      Type
                    </span>
                    <span className="flex items-center gap-1">
                      <span
                        className="truncate"
                        style={{ color: "var(--color-text-primary)" }}
                      >
                        {getTypeLabel()}
                      </span>
                      <ChevronRight
                        className="h-4 w-4 shrink-0"
                        style={{ color: "var(--color-text-tertiary)" }}
                      />
                    </span>
                  </button>

                  {/* Currency field */}
                  <button
                    type="button"
                    onClick={() => setShowCurrencyDialog(true)}
                    className="w-full py-3 flex items-center justify-between text-base md:text-sm"
                  >
                    <span
                      className="font-medium whitespace-nowrap shrink-0"
                      style={{ color: "var(--color-text-secondary)" }}
                    >
                      Currency
                    </span>
                    <span className="flex items-center gap-1">
                      <span
                        className="truncate"
                        style={{ color: "var(--color-text-primary)" }}
                      >
                        {getCurrencyLabel()}
                      </span>
                      <ChevronRight
                        className="h-4 w-4 shrink-0"
                        style={{ color: "var(--color-text-tertiary)" }}
                      />
                    </span>
                  </button>
                </>
              )}

              {/* Issuer (credit card and gift card) */}
              {(isCreditCard || isGiftCard) && (
                <button
                  type="button"
                  onClick={() => setShowIssuerDialog(true)}
                  className="w-full py-3 flex items-center justify-between text-base md:text-sm"
                >
                  <span
                    className="font-medium whitespace-nowrap shrink-0"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    Issuer
                  </span>
                  <span className="flex items-center gap-1">
                    <span
                      className="truncate"
                      style={{
                        color: issuer
                          ? "var(--color-text-primary)"
                          : "var(--color-text-tertiary)",
                      }}
                    >
                      {getIssuerLabel()}
                    </span>
                    <ChevronRight
                      className="h-4 w-4 shrink-0"
                      style={{ color: "var(--color-text-tertiary)" }}
                    />
                  </span>
                </button>
              )}

              {/* Rewards Currency (credit card only, custom cards) */}
              {isCreditCard && !(isEditing && currentMethod?.cardCatalogId) && (
                <button
                  type="button"
                  onClick={() => setShowRewardsCurrencyDialog(true)}
                  className="w-full py-3 flex items-center justify-between text-base md:text-sm"
                >
                  <span
                    className="font-medium whitespace-nowrap shrink-0"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    Rewards Currency
                  </span>
                  <span className="flex items-center gap-1">
                    <span
                      className="truncate"
                      style={{
                        color: rewardCurrencyId
                          ? "var(--color-text-primary)"
                          : "var(--color-text-tertiary)",
                      }}
                    >
                      {getRewardsCurrencyLabel()}
                    </span>
                    <ChevronRight
                      className="h-4 w-4 shrink-0"
                      style={{ color: "var(--color-text-tertiary)" }}
                    />
                  </span>
                </button>
              )}

              {/* Bonus Rewards Cap toggle (credit card only) */}
              {isCreditCard && (
                <div className="py-3 flex items-center justify-between gap-4">
                  <span
                    className="text-base md:text-sm font-medium"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    Bonus Rewards Cap
                  </span>
                  <div className="flex items-center gap-2">
                    <span
                      className="text-base md:text-sm"
                      style={{ color: "var(--color-text-primary)" }}
                    >
                      {isMonthlyStatement
                        ? "By statement month"
                        : "By calendar month"}
                    </span>
                    <Switch
                      id="isMonthlyStatement"
                      checked={isMonthlyStatement}
                      onCheckedChange={setIsMonthlyStatement}
                    />
                  </div>
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
                    <LastFourDigitsField
                      value={lastFourDigits}
                      onChange={setLastFourDigits}
                      onBlur={() => handleFieldBlur("lastFourDigits")}
                      error={errors.lastFourDigits}
                      touched={touched.lastFourDigits}
                    />
                  )}

                  {/* Total Loaded (gift card only) */}
                  {isGiftCard && (
                    <div>
                      <div className="py-3 flex items-center justify-between gap-4">
                        <label
                          htmlFor="totalLoaded"
                          className="text-base md:text-sm font-medium shrink-0"
                          style={{ color: "var(--color-text-secondary)" }}
                        >
                          Total Loaded
                        </label>
                        <Input
                          id="totalLoaded"
                          name="totalLoaded"
                          type="text"
                          inputMode="decimal"
                          placeholder="e.g. 500.00"
                          value={totalLoaded}
                          onChange={(e) => setTotalLoaded(e.target.value)}
                          onBlur={() => handleFieldBlur("totalLoaded")}
                          className="h-9 rounded-lg text-base md:text-sm text-right border-none shadow-none pl-0 pr-2 focus-visible:ring-0"
                          style={{
                            backgroundColor: "transparent",
                            color: "var(--color-text-primary)",
                          }}
                        />
                      </div>
                      {touched.totalLoaded && errors.totalLoaded && (
                        <p
                          className="text-xs flex items-center gap-1 justify-end"
                          style={{ color: "var(--color-error)" }}
                        >
                          <AlertCircle className="h-3 w-3" />
                          {errors.totalLoaded}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Credit card statement day */}
                  {isCreditCard && (
                    <BillingCycleFields
                      statementStartDay={statementStartDay}
                      onStatementDayChange={setStatementStartDay}
                      onStatementDayBlur={() =>
                        handleFieldBlur("statementStartDay")
                      }
                      error={errors.statementStartDay}
                      touched={touched.statementStartDay}
                    />
                  )}
                </div>
              </>
            )}

            {/* === STATUS TOGGLE (Edit mode only) === */}
            {isEditing && (
              <div className="py-3 flex items-center justify-between gap-4">
                <span
                  className="text-base md:text-sm font-medium"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  Status
                </span>
                <div className="flex items-center gap-2">
                  <span
                    className="text-base md:text-sm"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    {active ? "Active" : "Hidden"}
                  </span>
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

      {/* Footer - only show when editing */}
      {isEditing && (
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
      )}
    </form>
  );

  const title = isEditing ? "Edit Payment Method" : "Add Payment Method";

  // Hide parent dialog when child dialog is open (for edit mode)
  const isParentVisible = isEditing ? isOpen && !isChildDialogOpen : isOpen;

  // Use Dialog for both mobile and desktop
  return (
    <>
      <Dialog open={isParentVisible} onOpenChange={onClose}>
        <DialogContent
          className="sm:max-w-lg max-h-[85vh] flex flex-col gap-0 p-0 overflow-hidden"
          hideCloseButton
          hideOverlay={isEditing && isChildDialogOpen}
        >
          <DialogHeader className="border-b flex-shrink-0" showCloseButton>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
          {formContent}
        </DialogContent>
      </Dialog>

      <CardCatalogPicker
        open={showCatalogPicker}
        onOpenChange={setShowCatalogPicker}
        onSelectCard={handleCatalogSelection}
        onCardPersonalized={handleCardPersonalized}
        onCloseAll={() => {
          setShowCatalogPicker(false);
          onClose();
        }}
        isLoading={isLoading}
      />

      <CustomCardFormDialog
        open={showCustomCardForm}
        onOpenChange={setShowCustomCardForm}
        onSubmit={handleCustomCardSubmit}
        onCloseAll={() => {
          setShowCustomCardForm(false);
          onClose();
        }}
        isLoading={isLoading}
      />

      {/* Selection Dialogs (for edit mode) */}
      {isEditing && (
        <>
          {/* Type Selection Dialog */}
          <SelectionDialog
            open={showTypeDialog}
            onOpenChange={setShowTypeDialog}
            onSelect={setSelectedType}
            onCloseAll={onClose}
            title="Select Type"
            options={TYPE_OPTIONS}
            selectedValue={selectedType}
          />

          {/* Currency Selection Dialog */}
          <SelectionDialog
            open={showCurrencyDialog}
            onOpenChange={setShowCurrencyDialog}
            onSelect={(v) => setCurrency(v as Currency)}
            onCloseAll={onClose}
            title="Select Currency"
            options={CURRENCY_OPTIONS}
            selectedValue={currency}
            searchable
            searchPlaceholder="Search currencies..."
          />

          {/* Issuer Selection Dialog */}
          <SelectionDialog
            open={showIssuerDialog}
            onOpenChange={setShowIssuerDialog}
            onSelect={setIssuer}
            onCloseAll={onClose}
            title="Select Issuer"
            options={ISSUER_OPTIONS}
            selectedValue={issuer}
            searchable
            searchPlaceholder="Search issuers..."
          />

          {/* Rewards Currency Selection Dialog */}
          <SelectionDialog
            open={showRewardsCurrencyDialog}
            onOpenChange={setShowRewardsCurrencyDialog}
            onSelect={(value) => {
              setRewardCurrencyId(value);
              const selected = rewardCurrencies.find((c) => c.id === value);
              if (selected) {
                setPointsCurrency(selected.displayName);
              }
            }}
            onCloseAll={onClose}
            title="Select Rewards Currency"
            options={rewardCurrencyOptions}
            selectedValue={rewardCurrencyId}
            searchable
            searchPlaceholder="Search rewards currencies..."
          />
        </>
      )}
    </>
  );
};

export default PaymentMethodForm;
