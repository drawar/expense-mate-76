import React, { useState, useEffect, useMemo } from "react";
import { PaymentMethod, Currency } from "@/types";
import { CurrencyService, ConversionService } from "@/core/currency";
import { RewardCurrency } from "@/core/currency/types";
import { CardCatalogEntry } from "@/core/catalog";
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
import {
  AlertCircle,
  CreditCard,
  X,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import CardCatalogPicker from "./CardCatalogPicker";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  SelectedCatalogCardDisplay,
  BillingCycleFields,
  LastFourDigitsField,
} from "./form";

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
      <input type="hidden" name="cardCatalogId" value={cardCatalogId} />
      <input type="hidden" name="nickname" value={nickname} />
      <input type="hidden" name="issuer" value={issuer} />

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
            <SelectedCatalogCardDisplay
              card={selectedCatalogEntry}
              onClear={handleClearCatalogSelection}
            />

            {/* Last 4 Digits */}
            <LastFourDigitsField
              value={lastFourDigits}
              onChange={setLastFourDigits}
              onBlur={() => handleFieldBlur("lastFourDigits")}
              error={errors.lastFourDigits}
              touched={touched.lastFourDigits}
              autoFocus
            />

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
                <div className="pt-2">
                  <BillingCycleFields
                    statementStartDay={statementStartDay}
                    isMonthlyStatement={isMonthlyStatement}
                    onStatementDayChange={setStatementStartDay}
                    onStatementDayBlur={() =>
                      handleFieldBlur("statementStartDay")
                    }
                    onMonthlyStatementChange={setIsMonthlyStatement}
                    error={errors.statementStartDay}
                    touched={touched.statementStartDay}
                    compact
                  />
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
                className="w-full h-12 rounded-xl text-base"
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
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    Nickname
                  </Label>
                  <Input
                    id="nickname"
                    name="nickname-field"
                    placeholder="e.g. My Travel Card (optional)"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    className="h-11 rounded-lg text-base md:text-sm"
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
                    style={{ color: "var(--color-text-secondary)" }}
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
                    className="h-11 rounded-lg text-base md:text-sm"
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
                      style={{ color: "var(--color-text-secondary)" }}
                    >
                      Type
                    </Label>
                    <Select
                      value={selectedType}
                      onValueChange={setSelectedType}
                    >
                      <SelectTrigger className="h-11 rounded-lg text-base md:text-sm">
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
                      style={{ color: "var(--color-text-secondary)" }}
                    >
                      Currency
                    </Label>
                    <Select value={currency} onValueChange={setCurrency}>
                      <SelectTrigger className="h-11 rounded-lg text-base md:text-sm">
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

              {/* Issuer (credit card only) */}
              {isCreditCard && (
                <div className="space-y-1.5">
                  <Label
                    htmlFor="issuer"
                    className="text-sm font-medium"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    Issuer
                  </Label>
                  <Select value={issuer} onValueChange={setIssuer}>
                    <SelectTrigger className="h-11 rounded-lg text-base md:text-sm">
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
                </div>
              )}

              {/* Rewards Currency (credit card only, custom cards) */}
              {isCreditCard && !(isEditing && currentMethod?.cardCatalogId) && (
                <div className="space-y-1.5">
                  <Label
                    htmlFor="rewardCurrency"
                    className="text-sm font-medium"
                    style={{ color: "var(--color-text-secondary)" }}
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
                    <SelectTrigger className="h-11 rounded-lg text-base md:text-sm">
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
                    <LastFourDigitsField
                      value={lastFourDigits}
                      onChange={setLastFourDigits}
                      onBlur={() => handleFieldBlur("lastFourDigits")}
                      error={errors.lastFourDigits}
                      touched={touched.lastFourDigits}
                    />
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
                        className="h-11 rounded-lg text-base md:text-sm"
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
                    <BillingCycleFields
                      statementStartDay={statementStartDay}
                      isMonthlyStatement={isMonthlyStatement}
                      onStatementDayChange={setStatementStartDay}
                      onStatementDayBlur={() =>
                        handleFieldBlur("statementStartDay")
                      }
                      onMonthlyStatementChange={setIsMonthlyStatement}
                      error={errors.statementStartDay}
                      touched={touched.statementStartDay}
                    />
                  )}
                </div>
              </>
            )}

            {/* === STATUS TOGGLE (Edit mode only) === */}
            {isEditing && (
              <div className="flex items-center justify-between">
                <div>
                  <Label
                    className="text-sm font-medium"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    Status
                  </Label>
                  <p
                    className="text-xs"
                    style={{ color: "var(--color-text-tertiary)" }}
                  >
                    {active ? "Card is active" : "Card is hidden"}
                  </p>
                </div>
                <Switch
                  id="active"
                  name="active"
                  checked={active}
                  onCheckedChange={setActive}
                />
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
            className="px-5 py-3 border-b"
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
