import React, { useState, useEffect, useMemo } from "react";
import { PaymentMethod, Currency } from "@/types";
import { CurrencyService, ConversionService } from "@/core/currency";
import { RewardCurrency } from "@/core/currency/types";
import { v4 as uuidv4 } from "uuid";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { AlertCircle, Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
  isOpen, // Use this prop to control the dialog
}) => {
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
    }
    setErrors(newErrors);
  };

  // Check if form is valid
  const isFormValid = useMemo(() => {
    const nameError = validateName(name);
    const digitsError = validateLastFourDigits(lastFourDigits);
    const dayError = validateStatementDay(statementStartDay);
    return !nameError && !digitsError && !dayError;
  }, [name, lastFourDigits, statementStartDay]);

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
    // Reset validation state
    setErrors({});
    setTouched({});
  }, [currentMethod, isOpen]);

  const isCreditCard = selectedType === "credit_card";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Payment Method" : "Add Payment Method"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the details of your payment method"
              : "Add a new payment method for tracking expenses"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit}>
          {/* Hidden inputs to sync controlled state values with FormData */}
          <input type="hidden" name="type" value={selectedType} />
          <input type="hidden" name="currency" value={currency} />
          <input type="hidden" name="pointsCurrency" value={pointsCurrency} />
          <input
            type="hidden"
            name="rewardCurrencyId"
            value={rewardCurrencyId}
          />
          <input
            type="hidden"
            name="isMonthlyStatement"
            value={isMonthlyStatement ? "on" : ""}
          />
          <input type="hidden" name="active" value={active ? "on" : ""} />
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-4 items-start gap-4">
              <Label
                htmlFor="name"
                className="text-right pt-2"
                style={{ color: "var(--color-text-primary)" }}
              >
                Name <span style={{ color: "var(--color-error)" }}>*</span>
              </Label>
              <div className="col-span-3 space-y-1">
                <Input
                  id="name"
                  name="name"
                  placeholder="e.g. Chase Sapphire"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onBlur={() => handleFieldBlur("name")}
                  required
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
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="type" className="text-right">
                Type
              </Label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select payment type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="credit_card">Credit Card</SelectItem>
                  <SelectItem value="prepaid_card">Prepaid Card</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="currency" className="text-right">
                Currency
              </Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select currency" />
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

            {isCreditCard ? (
              <>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="issuer" className="text-right">
                    Issuer
                  </Label>
                  <Select value={issuer} onValueChange={setIssuer}>
                    <SelectTrigger className="col-span-3">
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

                <div className="grid grid-cols-4 items-start gap-4">
                  <Label
                    htmlFor="lastFourDigits"
                    className="text-right pt-2"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    Last 4 Digits
                  </Label>
                  <div className="col-span-3 space-y-1">
                    <Input
                      id="lastFourDigits"
                      name="lastFourDigits"
                      placeholder="e.g. 1234"
                      maxLength={4}
                      value={lastFourDigits}
                      onChange={(e) => {
                        // Only allow numeric input
                        const value = e.target.value.replace(/\D/g, "");
                        setLastFourDigits(value);
                      }}
                      onBlur={() => handleFieldBlur("lastFourDigits")}
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
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="rewardCurrency" className="text-right">
                    Rewards Currency
                  </Label>
                  <Select
                    key={`${rewardCurrencies.length}-${rewardCurrencyId}`}
                    value={rewardCurrencyId}
                    onValueChange={(value) => {
                      setRewardCurrencyId(value);
                      // Also set pointsCurrency for backward compatibility
                      const selected = rewardCurrencies.find(
                        (c) => c.id === value
                      );
                      if (selected) {
                        setPointsCurrency(selected.displayName);
                      }
                    }}
                    disabled={isLoadingCurrencies}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue
                        placeholder={
                          isLoadingCurrencies
                            ? "Loading..."
                            : "Select rewards currency"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {rewardCurrencies.map((currency) => (
                        <SelectItem key={currency.id} value={currency.id}>
                          {currency.displayName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-4 items-start gap-4">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Label
                          htmlFor="statementStartDay"
                          className="text-right pt-2 cursor-help flex items-center justify-end gap-1"
                          style={{ color: "var(--color-text-primary)" }}
                        >
                          Statement Day
                          <Info
                            className="h-3 w-3"
                            style={{ color: "var(--color-text-tertiary)" }}
                          />
                        </Label>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Value must be between 1-28</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <div className="col-span-3 space-y-1">
                    <Input
                      id="statementStartDay"
                      name="statementStartDay"
                      type="number"
                      min="1"
                      max="28"
                      placeholder="e.g. 15"
                      value={statementStartDay}
                      onChange={(e) => setStatementStartDay(e.target.value)}
                      onBlur={() => handleFieldBlur("statementStartDay")}
                      style={{
                        borderColor:
                          touched.statementStartDay && errors.statementStartDay
                            ? "var(--color-error)"
                            : undefined,
                      }}
                    />
                    {touched.statementStartDay && errors.statementStartDay && (
                      <p
                        className="text-xs flex items-center gap-1"
                        style={{ color: "var(--color-error)" }}
                      >
                        <AlertCircle className="h-3 w-3" />
                        {errors.statementStartDay}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-4 items-start gap-4">
                  <Label
                    className="text-right pt-2"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    Statement Type
                  </Label>
                  <div className="col-span-3 space-y-2">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="isMonthlyStatement"
                        name="isMonthlyStatement"
                        checked={isMonthlyStatement}
                        onCheckedChange={setIsMonthlyStatement}
                      />
                      <Label htmlFor="isMonthlyStatement">
                        Use statement month
                      </Label>
                    </div>
                    <p
                      className="text-xs"
                      style={{ color: "var(--color-text-tertiary)" }}
                    >
                      {isMonthlyStatement
                        ? `Statement month: e.g. Dec ${statementStartDay || "2"} - Jan ${statementStartDay ? parseInt(statementStartDay) - 1 || 1 : "1"}`
                        : "Calendar month: Dec 1 - Dec 31"}
                    </p>
                  </div>
                </div>
              </>
            ) : null}

            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Status</Label>
              <div className="col-span-3 flex items-center space-x-2">
                <Switch
                  id="active"
                  name="active"
                  checked={active}
                  onCheckedChange={setActive}
                />
                <Label htmlFor="active">Active</Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !isFormValid}
              style={{
                backgroundColor: isFormValid
                  ? "var(--color-accent)"
                  : undefined,
                color: isFormValid ? "var(--color-bg)" : undefined,
              }}
            >
              {isLoading ? "Saving..." : isEditing ? "Update" : "Add"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentMethodForm;
