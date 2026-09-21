/**
 * "Recently used at {merchant}" pill row. Sits directly above the
 * payment-method dropdown on the quick-add form and lets the user
 * one-tap the top 3 PMs they've historically used at the confirmed
 * merchant.
 *
 * Behavior:
 *   - Watches merchantName + paymentMethodId via react-hook-form.
 *   - Renders 3 pills when there are recommendations and no PM is set.
 *   - Hides itself entirely once paymentMethodId has any value
 *     (dropdown pick OR pill click) — the row collapses to the plain
 *     dropdown-only state.
 *   - Pill click: sets paymentMethodId + triggers validation, matching
 *     the pattern in PaymentMethodSelect.
 *
 * Pattern mirrors CategoryPicker's "Suggested for you" pill row.
 */

import React from "react";
import { useFormContext } from "react-hook-form";

import { PaymentMethodItemContent } from "@/components/ui/payment-method-select-item";
import { useRecommendedPaymentMethods } from "@/hooks/useRecommendedPaymentMethods";
import type { PaymentMethod } from "@/types";

interface RecommendedPaymentMethodsProps {
  paymentMethods: PaymentMethod[];
}

const RecommendedPaymentMethods: React.FC<RecommendedPaymentMethodsProps> = ({
  paymentMethods,
}) => {
  const form = useFormContext();
  const merchantName = (form.watch("merchantName") as string | undefined) ?? "";
  const paymentMethodId =
    (form.watch("paymentMethodId") as string | undefined) ?? "";

  const { paymentMethods: recommendations, canonicalMerchantName } =
    useRecommendedPaymentMethods(merchantName, paymentMethods);

  // Hide once any PM is set (whether via pill or dropdown) OR when we
  // have nothing to recommend. Keeps the UI collapsed to the standard
  // dropdown-only state after a choice is made.
  if (paymentMethodId || recommendations.length === 0) {
    return null;
  }

  // Prefer the stored merchant name (e.g. "Uber") over the raw form
  // input (e.g. "uber") so the label matches the merchant's canonical
  // spelling from history.
  const displayName = canonicalMerchantName ?? merchantName;

  const handlePick = (pmId: string) => {
    form.setValue("paymentMethodId", pmId, { shouldValidate: true });
    // Match the async trigger pattern in PaymentMethodSelect so cross-
    // field validation runs after the value settles.
    setTimeout(() => {
      form.trigger("paymentMethodId");
    }, 0);
  };

  return (
    <div className="mb-2">
      <p className="text-[11px] text-muted-foreground mb-1.5">
        Recently used at {displayName}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {recommendations.map((pm) => (
          <button
            key={pm.id}
            type="button"
            onClick={() => handlePick(pm.id)}
            className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-background hover:bg-muted active:bg-muted/70 transition-colors px-2 py-1 text-xs"
            title={`Use ${pm.name}`}
          >
            <PaymentMethodItemContent method={pm} size="sm" />
          </button>
        ))}
      </div>
    </div>
  );
};

export default RecommendedPaymentMethods;
