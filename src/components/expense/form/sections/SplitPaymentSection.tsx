import React from "react";
import { PaymentMethod, Currency } from "@/types";
import { SplitPortion } from "@/hooks/expense/expense-form/useSplitPayment";
import { Plus, Trash2, SplitIcon, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MossCard } from "@/components/ui/moss-card";
import { PaymentMethodItemContent } from "@/components/ui/payment-method-select-item";

// Helper to format numbers with locale
const formatNumber = (num: number) => num.toLocaleString();

interface SplitPaymentSectionProps {
  paymentMethods: PaymentMethod[];
  portions: SplitPortion[];
  totalAmount: number;
  currency: Currency;
  remainingAmount: number;
  validationError: string | null;
  totalPoints: number;
  onAddPortion: () => void;
  onRemovePortion: (id: string) => void;
  onUpdatePortion: (id: string, updates: Partial<SplitPortion>) => void;
}

export const SplitPaymentSection: React.FC<SplitPaymentSectionProps> = ({
  paymentMethods,
  portions,
  totalAmount,
  currency,
  remainingAmount,
  validationError,
  totalPoints,
  onAddPortion,
  onRemovePortion,
  onUpdatePortion,
}) => {
  // Get list of already used payment method IDs
  const usedMethodIds = portions.map((p) => p.paymentMethodId);
  const activePaymentMethods = paymentMethods.filter(
    (pm) => pm.active !== false
  );

  // Helper to get available methods for a portion (exclude used by others)
  const getAvailableMethodsForPortion = (portionId: string) => {
    const otherUsedIds = portions
      .filter((p) => p.id !== portionId)
      .map((p) => p.paymentMethodId);
    return activePaymentMethods.filter((pm) => !otherUsedIds.includes(pm.id));
  };

  // Helper to get payment method by ID
  const getPaymentMethod = (id: string) =>
    paymentMethods.find((pm) => pm.id === id);

  return (
    <MossCard>
      <h2
        className="flex items-center gap-2 font-medium mb-4"
        style={{
          fontSize: "var(--font-size-section-header)",
          color: "var(--color-text-primary)",
        }}
      >
        <SplitIcon
          className="h-5 w-5"
          style={{ color: "var(--color-icon-primary)" }}
        />
        Split Payment
      </h2>

      {/* Summary bar */}
      <div
        className="flex items-center justify-between p-3 rounded-lg mb-4"
        style={{ backgroundColor: "var(--color-surface-secondary)" }}
      >
        <div>
          <span
            className="text-sm"
            style={{ color: "var(--color-text-secondary)" }}
          >
            Total:
          </span>
          <span
            className="ml-2 font-medium"
            style={{ color: "var(--color-text-primary)" }}
          >
            {currency} {formatNumber(totalAmount)}
          </span>
        </div>
        <div>
          <span
            className="text-sm"
            style={{ color: "var(--color-text-secondary)" }}
          >
            Remaining:
          </span>
          <span
            className="ml-2 font-medium"
            style={{
              color:
                Math.abs(remainingAmount) < 0.01
                  ? "var(--color-success)"
                  : remainingAmount > 0
                    ? "var(--color-warning)"
                    : "var(--color-error)",
            }}
          >
            {currency} {formatNumber(Math.abs(remainingAmount))}
            {Math.abs(remainingAmount) < 0.01 && " ✓"}
          </span>
        </div>
      </div>

      {/* Portion list */}
      <div className="space-y-4">
        {portions.map((portion, index) => {
          const pm = getPaymentMethod(portion.paymentMethodId);
          const availableMethods = getAvailableMethodsForPortion(portion.id);

          return (
            <div
              key={portion.id}
              className="p-4 rounded-lg border"
              style={{
                backgroundColor: "var(--color-surface-primary)",
                borderColor: "var(--color-border)",
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <span
                  className="text-sm font-medium"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  Payment {index + 1}
                </span>
                {portions.length > 2 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemovePortion(portion.id)}
                    className="h-8 w-8 p-0"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Payment Method Select */}
                <div className="space-y-2">
                  <Label
                    className="text-sm"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    Payment Method
                  </Label>
                  <Select
                    value={portion.paymentMethodId || ""}
                    onValueChange={(value) =>
                      onUpdatePortion(portion.id, { paymentMethodId: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select method">
                        {pm && <PaymentMethodItemContent method={pm} />}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {availableMethods.map((method) => (
                        <SelectItem key={method.id} value={method.id}>
                          <PaymentMethodItemContent method={method} />
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Amount Input */}
                <div className="space-y-2">
                  <Label
                    className="text-sm"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    Amount ({currency})
                  </Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={portion.amount || ""}
                    onChange={(e) =>
                      onUpdatePortion(portion.id, {
                        amount: parseFloat(e.target.value) || 0,
                      })
                    }
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* Points display */}
              {portion.amount > 0 && pm && (
                <div
                  className="mt-3 pt-3 flex items-center justify-end"
                  style={{ borderTop: "1px solid var(--color-border)" }}
                >
                  <span
                    className="text-sm"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    Earns:
                  </span>
                  <span
                    className="ml-2 font-medium"
                    style={{ color: "var(--color-accent)" }}
                  >
                    {formatNumber(portion.rewardPoints)}{" "}
                    {portion.pointsCurrency || pm.pointsCurrency || "pts"}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add portion button */}
      {activePaymentMethods.length > portions.length && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onAddPortion}
          className="mt-4 w-full"
          style={{
            borderColor: "var(--color-border)",
            color: "var(--color-text-secondary)",
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Payment Method
        </Button>
      )}

      {/* Validation error */}
      {validationError && (
        <div
          className="mt-4 p-3 rounded-lg flex items-center gap-2"
          style={{
            backgroundColor: "var(--color-error-bg, rgba(239, 68, 68, 0.1))",
          }}
        >
          <AlertCircle
            className="h-4 w-4 flex-shrink-0"
            style={{ color: "var(--color-error)" }}
          />
          <span className="text-sm" style={{ color: "var(--color-error)" }}>
            {validationError}
          </span>
        </div>
      )}

      {/* Total points summary */}
      <div
        className="mt-4 pt-4 flex items-center justify-between"
        style={{ borderTop: "1px solid var(--color-border)" }}
      >
        <span
          className="text-sm font-medium"
          style={{ color: "var(--color-text-secondary)" }}
        >
          Total Points
        </span>
        <span
          className="font-semibold"
          style={{ color: "var(--color-accent)", fontSize: "1.125rem" }}
        >
          {formatNumber(totalPoints)} pts
        </span>
      </div>
    </MossCard>
  );
};
