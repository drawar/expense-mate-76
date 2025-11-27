import React from "react";
import { useFormContext } from "react-hook-form";
import { PaymentMethod } from "@/types";
import { CreditCardIcon } from "lucide-react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PointsCalculationResult } from "@/hooks/useExpenseForm";

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
}

export const PaymentDetailsSection: React.FC<PaymentDetailsSectionProps> = ({
  paymentMethods,
  selectedPaymentMethod,
  shouldOverridePayment,
  pointsCalculation,
  isSubmitting = false,
  isEditMode = false,
}) => {
  const form = useFormContext();
  const isOnline = form.watch("isOnline");
  const isContactless = form.watch("isContactless");
  const amount = form.watch("amount");
  const currency = form.watch("currency");
  const mcc = form.watch("mcc");
  const merchantName = form.watch("merchantName");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCardIcon className="h-5 w-5" />
          Payment Details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <PaymentMethodSelect paymentMethods={paymentMethods} />

        <ContactlessToggle
          isOnline={isOnline}
          isCash={selectedPaymentMethod?.type === "cash" || false}
        />

        <ConvertedAmountField
          shouldOverridePayment={shouldOverridePayment}
          selectedPaymentMethod={selectedPaymentMethod}
        />

        <PointsDisplay
          amount={amount || 0}
          currency={currency || "CAD"}
          paymentMethod={selectedPaymentMethod || null}
          mcc={mcc?.code}
          merchantName={merchantName}
          isOnline={isOnline}
          isContactless={isContactless}
          isEditMode={isEditMode}
          editablePoints={0}
          onPointsChange={() => {}}
        />
      </CardContent>
      <CardFooter className="flex justify-end space-x-2">
        <Button
          type="submit"
          className="w-full md:w-auto"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Saving..." : "Save Transaction"}
        </Button>
      </CardFooter>
    </Card>
  );
};
