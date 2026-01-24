import { useState, useEffect } from "react";
import {
  Transaction,
  PaymentMethod,
  Currency,
  MerchantCategoryCode,
} from "@/types";
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { format, parseISO } from "date-fns";
import { storageService } from "@/core/storage/StorageService";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

// Import the same form sections as ExpenseForm
import { MerchantDetailsSection } from "../../form/sections/MerchantDetailsSection";
import { TransactionDetailsSection } from "../../form/sections/TransactionDetailsSection";
import { SplitPaymentSection } from "../../form/sections/SplitPaymentSection";
import { useSplitPayment } from "@/hooks/expense/expense-form/useSplitPayment";

export interface SplitTransactionEditFormProps {
  transaction: Transaction;
  paymentMethods: PaymentMethod[];
  onSubmit: (transactions: Transaction[]) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

// Form schema matching ExpenseForm
const formSchema = z.object({
  merchantName: z.string().min(1, "Merchant name is required"),
  merchantAddress: z.string().optional(),
  isOnline: z.boolean(),
  isContactless: z.boolean(),
  amount: z.string().min(1, "Amount is required"),
  currency: z.string(),
  date: z.date(),
  time: z.string().optional(),
  notes: z.string().optional(),
  reimbursementAmount: z.string().optional(),
  // Placeholder for split mode validation
  paymentMethodId: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export const SplitTransactionEditForm: React.FC<
  SplitTransactionEditFormProps
> = ({
  transaction,
  paymentMethods,
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  const [splitGroupTransactions, setSplitGroupTransactions] = useState<
    Transaction[]
  >([]);
  const [selectedMCC, setSelectedMCC] = useState<MerchantCategoryCode | null>(
    transaction.merchant.mcc || null
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Form setup with same structure as ExpenseForm
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      merchantName: transaction.merchant.name,
      merchantAddress: transaction.merchant.address || "",
      isOnline: transaction.merchant.isOnline,
      isContactless: transaction.isContactless || false,
      amount: "0", // Will be set from split group total
      currency: transaction.currency,
      date: parseISO(transaction.date),
      time: format(parseISO(transaction.date), "HH:mm"),
      notes: "",
      reimbursementAmount: "0",
      paymentMethodId: "split-mode", // Placeholder for split mode
    },
  });

  const watchedAmount = Number(form.watch("amount")) || 0;
  const watchedCurrency = form.watch("currency") as Currency;
  const watchedMerchantName = form.watch("merchantName");
  const watchedIsOnline = form.watch("isOnline");
  const watchedIsContactless = form.watch("isContactless");

  // Split payment hook
  const {
    portions,
    addPortion,
    removePortion,
    updatePortion,
    remainingAmount,
    isValid: isSplitValid,
    validationError: splitValidationError,
    totalPoints: splitTotalPoints,
    setIsSplitMode,
  } = useSplitPayment({
    paymentMethods,
    totalAmount: watchedAmount,
    currency: watchedCurrency,
    merchantName: watchedMerchantName,
    mcc: selectedMCC,
    isOnline: watchedIsOnline,
    isContactless: watchedIsContactless,
  });

  // Fetch split group data
  useEffect(() => {
    const fetchSplitGroupData = async () => {
      if (!transaction.splitGroupId) return;

      try {
        const [transactions, splitGroup] = await Promise.all([
          storageService.getTransactionsBySplitGroup(transaction.splitGroupId),
          storageService.getSplitGroup(transaction.splitGroupId),
        ]);

        setSplitGroupTransactions(transactions);

        // Calculate total amount from all portions (round to 2 decimal places to avoid floating point errors)
        const totalAmount =
          Math.round(
            transactions.reduce((sum, tx) => sum + tx.amount, 0) * 100
          ) / 100;
        form.setValue("amount", totalAmount.toString());
        form.setValue("notes", splitGroup?.notes || "");

        // Calculate total reimbursement from all portions
        const totalReimbursement =
          Math.round(
            transactions.reduce(
              (sum, tx) => sum + (tx.reimbursementAmount || 0),
              0
            ) * 100
          ) / 100;
        form.setValue(
          "reimbursementAmount",
          totalReimbursement > 0 ? totalReimbursement.toString() : "0"
        );
      } catch (error) {
        console.error("Error fetching split group data:", error);
      }
    };

    fetchSplitGroupData();
  }, [transaction.splitGroupId, form]);

  // Initialize split mode
  useEffect(() => {
    if (splitGroupTransactions.length > 0 && !isInitialized) {
      setIsSplitMode(true);
      setIsInitialized(true);
    }
  }, [splitGroupTransactions.length, isInitialized, setIsSplitMode]);

  // Pre-fill portions from existing transactions
  useEffect(() => {
    if (
      splitGroupTransactions.length > 0 &&
      portions.length >= 2 &&
      isInitialized
    ) {
      // Check if portions are still at default (amount = 0)
      const arePortionsEmpty = portions.every((p) => p.amount === 0);
      if (arePortionsEmpty) {
        // Update portions with existing transaction data
        splitGroupTransactions.forEach((tx, index) => {
          if (index < portions.length) {
            updatePortion(portions[index].id, {
              paymentMethodId: tx.paymentMethod.id,
              amount: tx.amount,
              paymentAmount: tx.paymentAmount,
              paymentCurrency: tx.paymentCurrency,
            });
          }
        });

        // If we have more split transactions than initial portions, add them
        if (splitGroupTransactions.length > portions.length) {
          for (
            let i = portions.length;
            i < splitGroupTransactions.length;
            i++
          ) {
            addPortion();
          }
        }
      }
    }
  }, [
    splitGroupTransactions,
    portions,
    updatePortion,
    addPortion,
    isInitialized,
  ]);

  const handleSave = async () => {
    if (!isSplitValid || !transaction.splitGroupId) return;

    setIsSaving(true);

    try {
      const values = form.getValues();

      // Combine date with time
      const selectedDate = new Date(values.date);
      if (values.time) {
        const [hours, minutes] = values.time.split(":").map(Number);
        selectedDate.setHours(hours, minutes, 0, 0);
      }

      const merchantData = {
        id: transaction.merchant.id,
        name: values.merchantName.trim(),
        address: values.merchantAddress?.trim() || undefined,
        isOnline: values.isOnline,
        mcc: selectedMCC,
      };

      // Calculate proportional reimbursement for each portion
      const totalReimbursement = parseFloat(values.reimbursementAmount || "0");
      const totalAmount = watchedAmount;

      // Distribute reimbursement proportionally to each portion
      const getPortionReimbursement = (portionAmount: number): number => {
        if (totalReimbursement <= 0 || totalAmount <= 0) return 0;
        // If fully reimbursed, each portion is fully reimbursed
        if (Math.abs(totalReimbursement - totalAmount) < 0.01) {
          return portionAmount;
        }
        // Otherwise, distribute proportionally
        return (
          Math.round(totalReimbursement * (portionAmount / totalAmount) * 100) /
          100
        );
      };

      // Update existing split transactions (preserves transaction IDs)
      const updatedTransactions = await storageService.updateSplitTransaction({
        splitGroupId: transaction.splitGroupId,
        totalAmount: watchedAmount,
        currency: watchedCurrency,
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
          reimbursementAmount: getPortionReimbursement(p.amount),
        })),
        isContactless: !values.isOnline && values.isContactless,
        notes: values.notes || undefined,
      });

      onSubmit(updatedTransactions);
    } catch (error) {
      console.error("Error saving split transaction:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <FormProvider {...form}>
      <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
        <DialogHeader
          className="border-b flex-shrink-0"
          showBackButton
          onBack={onCancel}
        >
          <DialogTitle>Edit Split Transaction</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-4 py-4 min-h-0">
          <div className="flex flex-col gap-6">
            {/* Same sections as ExpenseForm */}
            <MerchantDetailsSection
              onSelectMCC={setSelectedMCC}
              selectedMCC={selectedMCC}
            />

            <TransactionDetailsSection />

            <SplitPaymentSection
              paymentMethods={paymentMethods}
              portions={portions}
              totalAmount={watchedAmount}
              currency={watchedCurrency}
              remainingAmount={remainingAmount}
              validationError={splitValidationError}
              totalPoints={splitTotalPoints}
              onAddPortion={addPortion}
              onRemovePortion={removePortion}
              onUpdatePortion={updatePortion}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="border-t px-4 py-4 flex gap-3 flex-shrink-0">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onCancel}
            disabled={isSaving || isLoading}
          >
            Cancel
          </Button>
          <Button
            className="flex-1"
            onClick={handleSave}
            disabled={isSaving || isLoading || !isSplitValid}
          >
            {isSaving ? "Saving..." : "Save Split Transaction"}
          </Button>
        </div>
      </div>
    </FormProvider>
  );
};

export default SplitTransactionEditForm;
