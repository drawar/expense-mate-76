import React from "react";
import { FormProvider } from "react-hook-form";
import { Transaction, PaymentMethod, Currency } from "@/types";
import { useExpenseForm } from "@/hooks/useExpenseForm";
import { useToast } from "@/hooks/use-toast";
import {
  useSplitPayment,
  SplitPortion,
} from "@/hooks/expense/expense-form/useSplitPayment";

// Import section components
import { MerchantDetailsSection } from "./sections/MerchantDetailsSection";
import { TransactionDetailsSection } from "./sections/TransactionDetailsSection";
import { PaymentDetailsSection } from "./sections/PaymentDetailsSection";
import { SplitPaymentSection } from "./sections/SplitPaymentSection";

// Split transaction input type
export interface SplitTransactionInput {
  totalAmount: number;
  currency: Currency;
  merchant: {
    id?: string;
    name: string;
    address?: string;
    isOnline: boolean;
    mcc?: { code: string; description: string } | null;
  };
  date: string;
  portions: Array<{
    paymentMethodId: string;
    amount: number;
    paymentAmount?: number;
    paymentCurrency?: Currency;
    rewardPoints: number;
    basePoints: number;
    bonusPoints: number;
  }>;
  isContactless: boolean;
  notes?: string;
  userCategory?: string;
}

interface ExpenseFormProps {
  paymentMethods: PaymentMethod[];
  onSubmit: (transaction: Omit<Transaction, "id">) => void;
  onSplitSubmit?: (input: SplitTransactionInput) => void;
  defaultValues?: Partial<Transaction> | Record<string, unknown>; // Accept both Transaction and FormValues formats
  useLocalStorage?: boolean;
  isSaving?: boolean;
  isEditMode?: boolean;
}

export const ExpenseForm: React.FC<ExpenseFormProps> = ({
  paymentMethods,
  onSubmit,
  onSplitSubmit,
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

  // Watch form values for split payment
  const amount = Number(form.watch("amount")) || 0;
  const currency = form.watch("currency") as Currency;
  const merchantName = form.watch("merchantName");
  const isOnline = form.watch("isOnline");
  const isContactless = form.watch("isContactless");

  // Split payment state
  const {
    isSplitMode,
    setIsSplitMode,
    portions,
    addPortion,
    removePortion,
    updatePortion,
    remainingAmount,
    isValid: isSplitValid,
    validationError: splitValidationError,
    totalPoints: splitTotalPoints,
  } = useSplitPayment({
    paymentMethods,
    totalAmount: amount,
    currency,
    merchantName,
    mcc: selectedMCC,
    isOnline,
    isContactless,
  });

  // When split mode is enabled, set a placeholder paymentMethodId to bypass form validation
  // The actual payment methods are in the portions array
  React.useEffect(() => {
    if (isSplitMode && portions.length > 0) {
      // Use the first portion's payment method as a placeholder
      form.setValue(
        "paymentMethodId",
        portions[0].paymentMethodId || "split-mode",
        {
          shouldValidate: false,
        }
      );
    }
  }, [isSplitMode, portions, form]);

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

      // Handle split payment submission
      if (isSplitMode) {
        if (!isSplitValid) {
          toast({
            title: "Error",
            description:
              splitValidationError ||
              "Please complete all split payment fields",
            variant: "destructive",
          });
          return;
        }

        if (!onSplitSubmit) {
          toast({
            title: "Error",
            description: "Split payment not supported",
            variant: "destructive",
          });
          return;
        }

        // Combine date with time
        const selectedDate = values.date as Date;
        const timeValue = values.time as string | undefined;

        if (timeValue) {
          const [hours, minutes] = timeValue.split(":").map(Number);
          selectedDate.setHours(hours, minutes, 0, 0);
        } else {
          const now = new Date();
          selectedDate.setHours(
            now.getHours(),
            now.getMinutes(),
            now.getSeconds()
          );
        }

        const merchantData = {
          id:
            isEditMode && (defaultValues as Record<string, unknown>)?.merchantId
              ? ((defaultValues as Record<string, unknown>)
                  .merchantId as string)
              : undefined,
          name: (values.merchantName as string).trim(),
          address: values.merchantAddress
            ? (values.merchantAddress as string).trim()
            : undefined,
          isOnline: values.isOnline as boolean,
          mcc: selectedMCC,
        };

        const splitInput: SplitTransactionInput = {
          totalAmount: Number(values.amount),
          currency: values.currency as Currency,
          merchant: merchantData,
          date: selectedDate.toISOString(),
          portions: portions.map((p) => ({
            paymentMethodId: p.paymentMethodId,
            amount: p.amount,
            paymentAmount: p.paymentAmount,
            paymentCurrency: p.paymentCurrency,
            rewardPoints: p.rewardPoints,
            basePoints: p.basePoints,
            bonusPoints: p.bonusPoints,
          })),
          isContactless:
            !(values.isOnline as boolean) && (values.isContactless as boolean),
          notes: values.notes as string,
        };

        console.log("Split transaction data being submitted:", splitInput);
        onSplitSubmit(splitInput);
        return;
      }

      // Regular single payment submission
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
        // Tags for grouping transactions
        tags: (values.tags as string) || undefined,
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

  // Only show split option when there are at least 2 active payment methods
  const canSplit =
    paymentMethods.filter((pm) => pm.active !== false).length >= 2;

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

        {/* Split payment toggle - only show when not in edit mode */}
        {canSplit && !isEditMode && onSplitSubmit && (
          <div
            className="flex items-center justify-between p-4 rounded-lg"
            style={{
              backgroundColor: "var(--color-surface-secondary)",
              border: "1px solid var(--color-border)",
            }}
          >
            <div className="flex items-center gap-2">
              <span
                className="text-sm font-medium"
                style={{ color: "var(--color-text-primary)" }}
              >
                Split across multiple cards
              </span>
              <span
                className="text-xs"
                style={{ color: "var(--color-text-secondary)" }}
              >
                (e.g., gift card + credit card)
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isSplitMode}
                onChange={(e) => setIsSplitMode(e.target.checked)}
                className="sr-only peer"
              />
              <div
                className="w-11 h-6 rounded-full peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-offset-2 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:rounded-full after:h-5 after:w-5 after:transition-all"
                style={{
                  backgroundColor: isSplitMode
                    ? "var(--color-accent)"
                    : "var(--color-surface-tertiary)",
                  boxShadow: "inset 0 1px 2px rgba(0,0,0,0.1)",
                }}
              >
                <div
                  className="absolute top-[2px] left-[2px] rounded-full h-5 w-5 transition-all"
                  style={{
                    backgroundColor: "white",
                    transform: isSplitMode
                      ? "translateX(20px)"
                      : "translateX(0)",
                  }}
                />
              </div>
            </label>
          </div>
        )}

        {/* Show either split payment section or regular payment section */}
        {isSplitMode ? (
          <SplitPaymentSection
            paymentMethods={paymentMethods}
            portions={portions}
            totalAmount={amount}
            currency={currency}
            remainingAmount={remainingAmount}
            validationError={splitValidationError}
            totalPoints={splitTotalPoints}
            onAddPortion={addPortion}
            onRemovePortion={removePortion}
            onUpdatePortion={updatePortion}
          />
        ) : (
          <PaymentDetailsSection
            paymentMethods={paymentMethods}
            selectedPaymentMethod={selectedPaymentMethod}
            shouldOverridePayment={shouldOverridePayment}
            pointsCalculation={pointsCalculation}
            isSubmitting={isSaving}
            isEditMode={isEditMode}
          />
        )}

        {/* Submit button for split mode - outside the sections */}
        {isSplitMode && (
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSaving || !isSplitValid}
              className="px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: "var(--color-accent)",
                color: "white",
              }}
            >
              {isSaving ? "Saving..." : "Save Split Transaction"}
            </button>
          </div>
        )}
      </form>
    </FormProvider>
  );
};
