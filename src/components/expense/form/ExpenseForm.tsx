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
  defaultValues?: Partial<Transaction>;
  useLocalStorage?: boolean;
  isSaving?: boolean;
  isEditMode?: boolean;
  editingTransaction?: Transaction; // Add this to preserve merchant ID when editing
}

export const ExpenseForm: React.FC<ExpenseFormProps> = ({
  paymentMethods,
  onSubmit,
  defaultValues,
  useLocalStorage = false,
  isSaving = false,
  isEditMode = false,
  editingTransaction, // Extract the new prop
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
      if (!values.merchantName || values.merchantName.trim() === "") {
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
        id: isEditMode && editingTransaction?.merchant?.id ? editingTransaction.merchant.id : "", // Preserve merchant ID when editing
        name: values.merchantName.trim(),
        address: values.merchantAddress?.trim(),
        isOnline: values.isOnline,
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

      // Use edited reward points from form field if provided, otherwise use calculated
      // Handle empty field as zero points
      const finalRewardPoints =
        values.rewardPoints && values.rewardPoints.trim() !== ""
          ? Number(values.rewardPoints)
          : pointsCalculation?.totalPoints || 0;

      // Always preserve basePoints and bonusPoints from calculation
      // This maintains the breakdown for reference even when total is edited
      const transactionData: Omit<Transaction, "id"> = {
        date: values.date.toISOString().split("T")[0], // YYYY-MM-DD format
        merchant: merchantData,
        amount: Number(values.amount),
        currency: values.currency,
        paymentMethod: paymentMethod,
        paymentAmount: paymentAmount,
        paymentCurrency: paymentMethod.currency,
        rewardPoints: finalRewardPoints,
        basePoints: pointsCalculation?.basePoints || 0,
        bonusPoints: pointsCalculation?.bonusPoints || 0,
        notes: values.notes,
        isContactless: !values.isOnline && values.isContactless,
        reimbursementAmount: reimbursementAmount,
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
        className="space-y-8"
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
