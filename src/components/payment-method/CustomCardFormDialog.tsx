import React, { useState, useEffect, useMemo } from "react";
import { format, startOfDay } from "date-fns";
import { Currency } from "@/types";
import { CurrencyService, ConversionService } from "@/core/currency";
import { RewardCurrency } from "@/core/currency/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { AlertCircle, CalendarIcon, ChevronRight } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { BillingCycleFields, LastFourDigitsField } from "./form";
import SelectionDialog, { SelectionOption } from "./SelectionDialog";

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
  issuer?: string;
  rewardCurrencyId?: string;
  lastFourDigits?: string;
  statementStartDay?: string;
  totalLoaded?: string;
  purchaseDate?: string;
}

export interface CustomCardFormData {
  name: string;
  type: string;
  currency: Currency;
  issuer: string;
  lastFourDigits: string;
  pointsCurrency: string;
  rewardCurrencyId: string;
  statementStartDay: string;
  isMonthlyStatement: boolean;
  totalLoaded: string;
  purchaseDate: string;
}

interface CustomCardFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CustomCardFormData) => void;
  onCloseAll: () => void;
  isLoading?: boolean;
}

const CustomCardFormDialog: React.FC<CustomCardFormDialogProps> = ({
  open,
  onOpenChange,
  onSubmit,
  onCloseAll,
  isLoading = false,
}) => {
  const isMobile = useIsMobile();

  // Form state
  const [name, setName] = useState("");
  const [selectedType, setSelectedType] = useState("credit_card");
  const [currency, setCurrency] = useState<Currency>("CAD");
  const [issuer, setIssuer] = useState("");
  const [lastFourDigits, setLastFourDigits] = useState("");
  const [pointsCurrency, setPointsCurrency] = useState("");
  const [rewardCurrencyId, setRewardCurrencyId] = useState("");
  const [statementStartDay, setStatementStartDay] = useState("");
  const [isMonthlyStatement, setIsMonthlyStatement] = useState(false);
  const [totalLoaded, setTotalLoaded] = useState("");
  const [purchaseDate, setPurchaseDate] = useState("");

  // Validation state
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Selection dialog state
  const [showTypeDialog, setShowTypeDialog] = useState(false);
  const [showCurrencyDialog, setShowCurrencyDialog] = useState(false);
  const [showIssuerDialog, setShowIssuerDialog] = useState(false);
  const [showRewardsCurrencyDialog, setShowRewardsCurrencyDialog] =
    useState(false);

  // Reward currencies from database
  const [rewardCurrencies, setRewardCurrencies] = useState<RewardCurrency[]>(
    []
  );
  const [isLoadingCurrencies, setIsLoadingCurrencies] = useState(false);

  // Validation functions
  const validateName = (
    value: string,
    isRequired: boolean
  ): string | undefined => {
    if (!value.trim()) {
      return isRequired ? "Name is required" : undefined;
    }
    if (value.trim().length < 2) {
      return "Name must be at least 2 characters";
    }
    return undefined;
  };

  const validateIssuer = (
    value: string,
    isRequired: boolean
  ): string | undefined => {
    if (!value && isRequired) {
      return "Issuer is required";
    }
    return undefined;
  };

  const validateRewardCurrency = (
    value: string,
    isRequired: boolean
  ): string | undefined => {
    if (!value && isRequired) {
      return "Rewards currency is required";
    }
    return undefined;
  };

  const validateLastFourDigits = (value: string): string | undefined => {
    if (!value) return undefined;
    if (!/^\d{4}$/.test(value)) {
      return "Must be exactly 4 digits";
    }
    return undefined;
  };

  const validateStatementDay = (value: string): string | undefined => {
    if (!value) return undefined;
    const day = parseInt(value, 10);
    if (isNaN(day) || day < 1 || day > 31) {
      return "Must be between 1 and 31";
    }
    return undefined;
  };

  const validateTotalLoaded = (
    value: string,
    isRequired: boolean
  ): string | undefined => {
    if (!value) {
      return isRequired ? "Total loaded is required" : undefined;
    }
    const amount = parseFloat(value);
    if (isNaN(amount) || amount < 0) {
      return "Must be a positive number";
    }
    return undefined;
  };

  const validatePurchaseDate = (
    value: string,
    isRequired: boolean
  ): string | undefined => {
    if (!value && isRequired) {
      return "Purchase date is required";
    }
    return undefined;
  };

  // Run validation on field change
  const handleFieldBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));

    const newErrors = { ...errors };
    const isCreditCardType = selectedType === "credit_card";
    const isGiftCardType = selectedType === "gift_card";
    switch (field) {
      case "name":
        newErrors.name = validateName(name, isCreditCardType);
        break;
      case "lastFourDigits":
        newErrors.lastFourDigits = validateLastFourDigits(lastFourDigits);
        break;
      case "statementStartDay":
        newErrors.statementStartDay = validateStatementDay(statementStartDay);
        break;
      case "totalLoaded":
        newErrors.totalLoaded = validateTotalLoaded(
          totalLoaded,
          isGiftCardType
        );
        break;
      case "purchaseDate":
        newErrors.purchaseDate = validatePurchaseDate(
          purchaseDate,
          isGiftCardType
        );
        break;
    }
    setErrors(newErrors);
  };

  // Check if form is valid
  const isFormValid = useMemo(() => {
    const isCreditCardType = selectedType === "credit_card";
    const isGiftCardType = selectedType === "gift_card";
    const nameError = validateName(name, isCreditCardType);
    const issuerError = validateIssuer(
      issuer,
      isCreditCardType || isGiftCardType
    );
    const rewardCurrencyError = validateRewardCurrency(
      rewardCurrencyId,
      isCreditCardType
    );
    const digitsError = validateLastFourDigits(lastFourDigits);
    const dayError = validateStatementDay(statementStartDay);
    const loadedError = validateTotalLoaded(totalLoaded, isGiftCardType);
    const purchaseDateError = validatePurchaseDate(
      purchaseDate,
      isGiftCardType
    );
    return (
      !nameError &&
      !issuerError &&
      !rewardCurrencyError &&
      !digitsError &&
      !dayError &&
      !loadedError &&
      !purchaseDateError
    );
  }, [
    name,
    issuer,
    rewardCurrencyId,
    lastFourDigits,
    statementStartDay,
    totalLoaded,
    purchaseDate,
    selectedType,
  ]);

  // Reward currency options for selection dialog
  const rewardCurrencyOptions: SelectionOption[] = useMemo(() => {
    return rewardCurrencies.map((curr) => ({
      value: curr.id,
      label: curr.displayName,
    }));
  }, [rewardCurrencies]);

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

  // Check if any child dialog is open
  const isChildDialogOpen =
    showTypeDialog ||
    showCurrencyDialog ||
    showIssuerDialog ||
    showRewardsCurrencyDialog;

  // Fetch reward currencies when dialog opens
  useEffect(() => {
    if (open) {
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
  }, [open]);

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setName("");
      setSelectedType("credit_card");
      setCurrency("CAD");
      setIssuer("");
      setLastFourDigits("");
      setPointsCurrency("");
      setRewardCurrencyId("");
      setStatementStartDay("");
      setIsMonthlyStatement(false);
      setTotalLoaded("");
      setPurchaseDate("");
      setErrors({});
      setTouched({});
    }
  }, [open]);

  const isCreditCard = selectedType === "credit_card";
  const isGiftCard = selectedType === "gift_card";
  const isCash = selectedType === "cash";
  const isCardType = isCreditCard || isGiftCard;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    onSubmit({
      name,
      type: selectedType,
      currency,
      issuer,
      lastFourDigits,
      pointsCurrency,
      rewardCurrencyId,
      statementStartDay,
      isMonthlyStatement,
      totalLoaded,
      purchaseDate,
    });
  };

  const handleBack = () => {
    onOpenChange(false);
  };

  // Hide parent dialog when child dialog is open
  const isParentVisible = open && !isChildDialogOpen;

  // Clickable field component for selection dialogs
  const SelectionField: React.FC<{
    label: string;
    value: string;
    onClick: () => void;
    placeholder?: boolean;
    required?: boolean;
  }> = ({ label, value, onClick, placeholder = false, required = false }) => (
    <button
      type="button"
      onClick={onClick}
      className="w-full py-3 flex items-center justify-between text-base md:text-sm"
    >
      <span
        className="font-medium"
        style={{ color: "var(--color-text-secondary)" }}
      >
        {label}{" "}
        {required && <span style={{ color: "var(--color-error)" }}>*</span>}
      </span>
      <span className="flex items-center gap-1">
        <span
          className="truncate"
          style={{
            color: placeholder
              ? "var(--color-text-tertiary)"
              : "var(--color-text-primary)",
          }}
        >
          {value}
        </span>
        <ChevronRight
          className="h-4 w-4 shrink-0"
          style={{ color: "var(--color-text-tertiary)" }}
        />
      </span>
    </button>
  );

  return (
    <>
      <Dialog open={isParentVisible} onOpenChange={handleBack}>
        <DialogContent
          className="sm:max-w-lg max-h-[85vh] flex flex-col gap-0 p-0 overflow-hidden"
          hideCloseButton
          hideOverlay
        >
          <DialogHeader
            className="border-b flex-shrink-0"
            showBackButton
            onBack={handleBack}
            showCloseButton
            onClose={onCloseAll}
          >
            <DialogTitle>Create Custom Card</DialogTitle>
          </DialogHeader>

          <form
            onSubmit={handleSubmit}
            className="flex flex-col flex-1 min-h-0 overflow-hidden"
          >
            {/* Scrollable form content */}
            <div className="px-4 py-4 space-y-5 flex-1 overflow-y-auto min-h-0">
              {/* === CORE FIELDS SECTION === */}
              <div className="space-y-4">
                {/* Type field - at top */}
                <SelectionField
                  label="Type"
                  value={getTypeLabel()}
                  onClick={() => setShowTypeDialog(true)}
                />

                {/* Currency field */}
                <SelectionField
                  label="Currency"
                  value={getCurrencyLabel()}
                  onClick={() => setShowCurrencyDialog(true)}
                />

                {/* Issuer (credit card and gift card) - required for both */}
                {(isCreditCard || isGiftCard) && (
                  <SelectionField
                    label="Issuer"
                    value={getIssuerLabel()}
                    onClick={() => setShowIssuerDialog(true)}
                    placeholder={!issuer}
                    required
                  />
                )}

                {/* Total Loaded (gift card only) - required */}
                {isGiftCard && (
                  <div>
                    <div className="py-3 flex items-center justify-between gap-4">
                      <label
                        htmlFor="totalLoaded"
                        className="text-base md:text-sm font-medium shrink-0"
                        style={{ color: "var(--color-text-secondary)" }}
                      >
                        Total Loaded{" "}
                        <span style={{ color: "var(--color-error)" }}>*</span>
                      </label>
                      <Input
                        id="totalLoaded"
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

                {/* Purchase Date (gift card only) - required */}
                {isGiftCard && (
                  <div>
                    <div className="py-3 flex items-center justify-between gap-4">
                      <span
                        className="text-base md:text-sm font-medium shrink-0"
                        style={{ color: "var(--color-text-secondary)" }}
                      >
                        Purchase Date{" "}
                        <span style={{ color: "var(--color-error)" }}>*</span>
                      </span>
                      <Popover>
                        <PopoverTrigger asChild>
                          <button
                            type="button"
                            className="flex items-center gap-2 text-base md:text-sm"
                            style={{
                              color: purchaseDate
                                ? "var(--color-text-primary)"
                                : "var(--color-text-tertiary)",
                            }}
                          >
                            <span>
                              {purchaseDate
                                ? format(new Date(purchaseDate), "PPP")
                                : "Select date"}
                            </span>
                            <CalendarIcon
                              className="h-4 w-4"
                              style={{ color: "var(--color-text-tertiary)" }}
                            />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="end">
                          <Calendar
                            mode="single"
                            selected={
                              purchaseDate ? new Date(purchaseDate) : undefined
                            }
                            onSelect={(date) => {
                              if (date) {
                                setPurchaseDate(format(date, "yyyy-MM-dd"));
                              }
                            }}
                            disabled={(date) => {
                              const today = startOfDay(new Date());
                              const compareDate = startOfDay(date);
                              return compareDate > today;
                            }}
                            initialFocus
                            className="pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    {touched.purchaseDate && errors.purchaseDate && (
                      <p
                        className="text-xs flex items-center gap-1 justify-end"
                        style={{ color: "var(--color-error)" }}
                      >
                        <AlertCircle className="h-3 w-3" />
                        {errors.purchaseDate}
                      </p>
                    )}
                  </div>
                )}

                {/* Name field - required for credit cards, optional for gift cards and cash */}
                {(isCreditCard || isGiftCard || isCash) && (
                  <div>
                    <div className="py-3 flex items-center justify-between gap-4">
                      <label
                        htmlFor="name"
                        className="text-base md:text-sm font-medium shrink-0"
                        style={{ color: "var(--color-text-secondary)" }}
                      >
                        Name{" "}
                        {isCreditCard && (
                          <span style={{ color: "var(--color-error)" }}>*</span>
                        )}
                      </label>
                      <Input
                        id="name"
                        placeholder={
                          isGiftCard || isCash
                            ? "Optional"
                            : "e.g. Chase Sapphire"
                        }
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        onBlur={() => handleFieldBlur("name")}
                        required={isCreditCard}
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

                {/* Rewards Currency (credit card only) */}
                {isCreditCard && (
                  <SelectionField
                    label="Rewards Currency"
                    value={getRewardsCurrencyLabel()}
                    onClick={() => setShowRewardsCurrencyDialog(true)}
                    placeholder={!rewardCurrencyId}
                    required
                  />
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
                onClick={handleBack}
                className="flex-1 h-12 rounded-xl font-medium"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading || !isFormValid}
                className="flex-1 h-12 rounded-xl font-medium"
                style={{
                  backgroundColor: isFormValid
                    ? "var(--color-accent)"
                    : undefined,
                  color: isFormValid ? "var(--color-bg)" : undefined,
                }}
              >
                {isLoading ? "Saving..." : "Add"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Type Selection Dialog */}
      <SelectionDialog
        open={showTypeDialog}
        onOpenChange={setShowTypeDialog}
        onSelect={setSelectedType}
        onCloseAll={onCloseAll}
        title="Select Type"
        options={TYPE_OPTIONS}
        selectedValue={selectedType}
      />

      {/* Currency Selection Dialog */}
      <SelectionDialog
        open={showCurrencyDialog}
        onOpenChange={setShowCurrencyDialog}
        onSelect={(v) => setCurrency(v as Currency)}
        onCloseAll={onCloseAll}
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
        onCloseAll={onCloseAll}
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
        onCloseAll={onCloseAll}
        title="Select Rewards Currency"
        options={rewardCurrencyOptions}
        selectedValue={rewardCurrencyId}
        searchable
        searchPlaceholder="Search rewards currencies..."
      />
    </>
  );
};

export default CustomCardFormDialog;
