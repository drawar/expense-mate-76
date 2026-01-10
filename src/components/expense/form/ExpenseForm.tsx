import React from "react";
import { FormProvider } from "react-hook-form";
import { Transaction, PaymentMethod } from "@/types";
import { useExpenseForm } from "@/hooks/useExpenseForm";
import { useToast } from "@/hooks/use-toast";

// Import section components
import { MerchantDetailsSection } from "./sections/MerchantDetailsSection";
import { TransactionDetailsSection } from "./sections/TransactionDetailsSection";
import { PaymentDetailsSection } from "./sections/PaymentDetailsSection";

interface ExpenseFormProps {
  paymentMethods: PaymentMethod[];
  onSubmit: (transaction: Omit<Transaction, "id">) => void;
  defaultValues?: Partial<Transaction> | Record<string, unknown>; // Accept both Transaction and FormValues formats
  useLocalStorage?: boolean;
  isSaving?: boolean;
  isEditMode?: boolean;
}

export const ExpenseForm: React.FC<ExpenseFormProps> = ({
  paymentMethods,
  onSubmit,
  defaultValues,
  useLocalStorage = false,
  isSaving = false,
  isEditMode = false,
}) => {
  const { toast } = useToast();
  const {
    form,
    selectedMCC,
    setSelectedMCC,
    selectedPaymentMethod,
    shouldOverridePayment,
    pointsCalculation,
    enteredPoints,
  } = useExpenseForm({
    paymentMethods,
    defaultValues,
  });

  const handleFormSubmit = (values: Record<string, unknown>) => {
    try {
      if (
        !values.merchantName ||
        (values.merchantName as string).trim() === ""
      ) {
        toast({
          title: "Error",
          description: "Merchant name is required",
          variant: "destructive",
        });
        return;
      }

      if (!values.paymentMethodId) {
        toast({
          title: "Error",
          description: "Payment method is required",
          variant: "destructive",
        });
        return;
      }

      const paymentMethod = paymentMethods.find(
        (pm) => pm.id === values.paymentMethodId
      );
      if (!paymentMethod) {
        toast({
          title: "Error",
          description: "Invalid payment method",
          variant: "destructive",
        });
        return;
      }

      const merchantData = {
        id:
          isEditMode && defaultValues?.merchantId
            ? defaultValues.merchantId
            : "", // Preserve merchant ID when editing
        name: (values.merchantName as string).trim(),
        address: values.merchantAddress
          ? (values.merchantAddress as string).trim()
          : undefined,
        isOnline: values.isOnline as boolean,
        mcc: selectedMCC,
      };

      const paymentAmount =
        shouldOverridePayment && values.paymentAmount
          ? Number(values.paymentAmount)
          : Number(values.amount);

      const reimbursementAmount = values.reimbursementAmount
        ? Number(values.reimbursementAmount)
        : 0;

      console.log("Form submission - Points calculation:", pointsCalculation);

      // Get all editable point values from form (user can override any of these)
      const basePoints =
        values.basePoints && (values.basePoints as string).trim() !== ""
          ? Number(values.basePoints)
          : pointsCalculation?.basePoints || 0;

      const bonusPoints =
        values.bonusPoints && (values.bonusPoints as string).trim() !== ""
          ? Number(values.bonusPoints)
          : pointsCalculation?.bonusPoints || 0;

      const promoBonusPoints =
        values.promoBonusPoints &&
        (values.promoBonusPoints as string).trim() !== ""
          ? Number(values.promoBonusPoints)
          : 0;

      // Total is always calculated from the three components
      const finalRewardPoints = basePoints + bonusPoints + promoBonusPoints;

      console.log("Form submission - Points breakdown:", {
        basePoints,
        bonusPoints,
        promoBonusPoints,
        total: finalRewardPoints,
      });

      // Combine date with time
      // If user specified a time, use it; otherwise use current system time
      const selectedDate = values.date as Date;
      const timeValue = values.time as string | undefined;

      if (timeValue) {
        // User specified a time - use it
        const [hours, minutes] = timeValue.split(":").map(Number);
        selectedDate.setHours(hours, minutes, 0, 0);
      } else {
        // No time specified - use current system time
        const now = new Date();
        selectedDate.setHours(
          now.getHours(),
          now.getMinutes(),
          now.getSeconds()
        );
      }

      const transactionData: Omit<Transaction, "id"> = {
        date: selectedDate.toISOString(), // Full ISO string preserves timezone correctly
        merchant: merchantData,
        amount: Number(values.amount),
        currency: values.currency as Transaction["currency"],
        paymentMethod: paymentMethod,
        paymentAmount: paymentAmount,
        paymentCurrency: paymentMethod.currency,
        rewardPoints: finalRewardPoints,
        basePoints: basePoints,
        bonusPoints: bonusPoints,
        promoBonusPoints: promoBonusPoints,
        notes: values.notes as string,
        isContactless:
          !(values.isOnline as boolean) && (values.isContactless as boolean),
        reimbursementAmount: reimbursementAmount,
        // Don't set category here - let StorageService auto-categorize based on
        // MCC + historical patterns for highest confidence category selection
      };

      console.log("Transaction data being submitted:", transactionData);
      onSubmit(transactionData);
    } catch (error) {
      console.error("Error submitting form:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  return (
    <FormProvider {...form}>
      <form
        onSubmit={form.handleSubmit(handleFormSubmit)}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "var(--space-xl)", // 24px spacing between sections
        }}
      >
        <MerchantDetailsSection
          onSelectMCC={setSelectedMCC}
          selectedMCC={selectedMCC}
        />

        <TransactionDetailsSection />

        <PaymentDetailsSection
          paymentMethods={paymentMethods}
          selectedPaymentMethod={selectedPaymentMethod}
          shouldOverridePayment={shouldOverridePayment}
          pointsCalculation={pointsCalculation}
          isSubmitting={isSaving}
          isEditMode={isEditMode}
        />
      </form>
    </FormProvider>
  );
};
