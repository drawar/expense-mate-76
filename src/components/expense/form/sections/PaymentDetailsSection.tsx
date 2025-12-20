import React from "react";
import { useFormContext } from "react-hook-form";
import { PaymentMethod } from "@/types";
import { CreditCardIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PointsCalculationResult } from "@/hooks/useExpenseForm";

// Import Moss Dark UI components
import { MossCard } from "@/components/ui/moss-card";
import { CollapsibleSection } from "@/components/ui/collapsible-section";

// Import sub-components
import PaymentMethodSelect from "../elements/PaymentMethodSelect";
import ContactlessToggle from "../elements/ContactlessToggle";
import PointsDisplay from "../elements/PointsDisplay";
import ConvertedAmountField from "../elements/ConvertedAmountField";

interface PaymentDetailsSectionProps {
  paymentMethods: PaymentMethod[];
  selectedPaymentMethod: PaymentMethod | undefined;
  shouldOverridePayment: boolean;
  pointsCalculation: PointsCalculationResult;
  isSubmitting?: boolean;
  isEditMode?: boolean;
  minimal?: boolean; // Enable progressive disclosure mode
}

export const PaymentDetailsSection: React.FC<PaymentDetailsSectionProps> = ({
  paymentMethods,
  selectedPaymentMethod,
  shouldOverridePayment,
  pointsCalculation,
  isSubmitting = false,
  isEditMode = false,
  minimal = true, // Default to minimal view with progressive disclosure
}) => {
  const form = useFormContext();
  const isOnline = form.watch("isOnline");
  const isContactless = form.watch("isContactless");
  const amount = form.watch("amount");
  const currency = form.watch("currency");
  const mcc = form.watch("mcc");
  const merchantName = form.watch("merchantName");
  const paymentAmount = form.watch("paymentAmount");

  // Calculate converted amount and currency if needed
  const needsConversion =
    selectedPaymentMethod && selectedPaymentMethod.currency !== currency;
  const convertedAmount =
    needsConversion && paymentAmount ? Number(paymentAmount) : undefined;
  const convertedCurrency = needsConversion
    ? selectedPaymentMethod?.currency
    : undefined;

  return (
    <MossCard>
      <h2
        className="flex items-center gap-2 font-semibold mb-4"
        style={{
          fontSize: "var(--font-size-section-header)",
          color: "var(--color-text-primary)",
          fontWeight: "var(--font-weight-semibold)",
        }}
      >
        <CreditCardIcon
          className="h-5 w-5"
          style={{ color: "var(--color-icon-primary)" }}
        />
        Payment Details
      </h2>

      {/* Essential field - always visible */}
      <div className="space-y-4">
        <PaymentMethodSelect paymentMethods={paymentMethods} />
      </div>

      {/* Optional fields - collapsible when minimal mode is enabled */}
      {minimal ? (
        <CollapsibleSection
          trigger="Show payment details"
          id="payment-details-advanced"
          persistState={true}
        >
          <div className="space-y-4">
            <ContactlessToggle
              isOnline={isOnline}
              isCash={selectedPaymentMethod?.type === "cash" || false}
            />

            <ConvertedAmountField
              shouldOverridePayment={shouldOverridePayment}
              selectedPaymentMethod={selectedPaymentMethod}
              merchantName={merchantName}
              mcc={mcc}
            />

            <PointsDisplay
              paymentMethod={selectedPaymentMethod || null}
              calculationResult={pointsCalculation}
              isEditMode={isEditMode}
              editablePoints={0}
              onPointsChange={() => {}}
            />
          </div>
        </CollapsibleSection>
      ) : (
        // Non-minimal mode: show all fields
        <div className="space-y-4 mt-4">
          <ContactlessToggle
            isOnline={isOnline}
            isCash={selectedPaymentMethod?.type === "cash" || false}
          />

          <ConvertedAmountField
            shouldOverridePayment={shouldOverridePayment}
            selectedPaymentMethod={selectedPaymentMethod}
            merchantName={merchantName}
            mcc={mcc}
          />

          <PointsDisplay
            paymentMethod={selectedPaymentMethod || null}
            calculationResult={pointsCalculation}
            isEditMode={isEditMode}
            editablePoints={0}
            onPointsChange={() => {}}
          />
        </div>
      )}

      {/* Submit button */}
      <div className="flex justify-end space-x-2 mt-6">
        <Button
          type="submit"
          className="w-full md:w-auto"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Saving..." : "Save Transaction"}
        </Button>
      </div>
    </MossCard>
  );
};
