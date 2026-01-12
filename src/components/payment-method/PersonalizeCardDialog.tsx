import React, { useState, useEffect, useMemo } from "react";
import { CardCatalogEntry } from "@/core/catalog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  SelectedCatalogCardDisplay,
  BillingCycleFields,
  LastFourDigitsField,
} from "./form";

interface ValidationErrors {
  lastFourDigits?: string;
  statementStartDay?: string;
}

export interface PersonalizeCardData {
  card: CardCatalogEntry;
  lastFourDigits: string;
  statementStartDay: string;
  isMonthlyStatement: boolean;
}

interface PersonalizeCardDialogProps {
  open: boolean;
  card: CardCatalogEntry | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: PersonalizeCardData) => void;
  onCloseAll: () => void;
  onBackToCardSelect: () => void;
  isLoading?: boolean;
}

const PersonalizeCardDialog: React.FC<PersonalizeCardDialogProps> = ({
  open,
  card,
  onOpenChange,
  onSubmit,
  onCloseAll,
  onBackToCardSelect,
  isLoading = false,
}) => {
  const isMobile = useIsMobile();

  // Form state
  const [lastFourDigits, setLastFourDigits] = useState("");
  const [statementStartDay, setStatementStartDay] = useState("");
  const [isMonthlyStatement, setIsMonthlyStatement] = useState(false);
  const [showBillingDetails, setShowBillingDetails] = useState(false);

  // Validation state
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Validation functions
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
    const digitsError = validateLastFourDigits(lastFourDigits);
    const dayError = validateStatementDay(statementStartDay);
    return !digitsError && !dayError;
  }, [lastFourDigits, statementStartDay]);

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setLastFourDigits("");
      setStatementStartDay("");
      setIsMonthlyStatement(false);
      setShowBillingDetails(false);
      setErrors({});
      setTouched({});
    }
  }, [open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid || !card) return;

    onSubmit({
      card,
      lastFourDigits,
      statementStartDay,
      isMonthlyStatement,
    });
  };

  const handleBack = () => {
    onOpenChange(false);
  };

  // Handle small X button next to card - go back to card selection
  const handleClearCard = () => {
    onBackToCardSelect();
  };

  if (!card) return null;

  return (
    <Dialog open={open} onOpenChange={handleBack}>
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
          <DialogTitle>Personalize Your Card</DialogTitle>
        </DialogHeader>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col flex-1 min-h-0 overflow-hidden"
        >
          {/* Scrollable form content */}
          <div className="px-4 py-4 space-y-5 flex-1 overflow-y-auto min-h-0">
            {/* Selected card display */}
            <SelectedCatalogCardDisplay card={card} onClear={handleClearCard} />

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
                <div className="pt-2 space-y-4">
                  <BillingCycleFields
                    statementStartDay={statementStartDay}
                    onStatementDayChange={setStatementStartDay}
                    onStatementDayBlur={() =>
                      handleFieldBlur("statementStartDay")
                    }
                    error={errors.statementStartDay}
                    touched={touched.statementStartDay}
                  />

                  {/* Bonus Rewards Cap toggle */}
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
                </div>
              )}
            </div>
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
  );
};

export default PersonalizeCardDialog;
