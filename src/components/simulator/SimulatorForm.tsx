import React, { useEffect, useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { MerchantCategoryCode } from "@/types";
import { SimulationInput } from "@/core/currency/SimulatorService";

// Import reused form sections
import { MerchantDetailsSection } from "@/components/expense/form/sections/MerchantDetailsSection";
import { SimulatorTransactionDetails } from "./SimulatorTransactionDetails";

// Define form schema for simulator (similar to expense form but without payment method)
// Includes optional fields that TransactionDetailsSection may render
const simulatorFormSchema = z.object({
  merchantName: z.string().min(1, "Merchant name is required"),
  merchantAddress: z.string().optional(),
  isOnline: z.boolean().default(false),
  isContactless: z.boolean().default(false),
  amount: z.string().min(1, "Amount is required"),
  currency: z.string().min(1, "Currency is required"),
  convertedAmount: z.string().optional(),
  convertedCurrency: z.string().optional(),
  date: z.date(),
  notes: z.string().optional(),
  mcc: z.custom<MerchantCategoryCode | null>().optional(),
  reimbursementAmount: z.string().optional(), // Optional field from TransactionDetailsSection
});

type SimulatorFormValues = z.infer<typeof simulatorFormSchema>;

interface SimulatorFormProps {
  onInputChange: (input: SimulationInput) => void;
  initialValues?: Partial<SimulationInput>;
}

export const SimulatorForm: React.FC<SimulatorFormProps> = ({
  onInputChange,
  initialValues,
}) => {
  const [selectedMCC, setSelectedMCC] = useState<MerchantCategoryCode | null>(
    null
  );

  const form = useForm<SimulatorFormValues>({
    resolver: zodResolver(simulatorFormSchema),
    defaultValues: {
      merchantName: initialValues?.merchantName || "",
      merchantAddress: initialValues?.merchantAddress || "",
      isOnline: initialValues?.isOnline ?? false,
      isContactless: initialValues?.isContactless ?? false,
      amount: initialValues?.amount?.toString() || "",
      currency: initialValues?.currency || "CAD",
      convertedAmount: initialValues?.convertedAmount?.toString() || "",
      convertedCurrency: initialValues?.convertedCurrency || "CAD",
      date: initialValues?.date || new Date(),
      notes: "",
      mcc: null,
      reimbursementAmount: "", // Optional field
    },
  });

  // Watch all form fields for changes
  const formValues = form.watch();

  // Debounce form changes to avoid excessive calculations
  useEffect(() => {
    const timer = setTimeout(() => {
      // Validate form before triggering calculation
      const isValid = form.formState.isValid;
      const amount = Number(formValues.amount);

      // Only trigger calculation if form is valid and amount is positive
      if (isValid && amount > 0 && formValues.merchantName.trim()) {
        const convertedAmount = formValues.convertedAmount
          ? Number(formValues.convertedAmount)
          : undefined;

        const simulationInput: SimulationInput = {
          merchantName: formValues.merchantName.trim(),
          merchantAddress: formValues.merchantAddress?.trim(),
          mcc: selectedMCC?.code,
          isOnline: formValues.isOnline,
          amount: amount,
          currency: formValues.currency,
          convertedAmount: convertedAmount,
          convertedCurrency: formValues.convertedCurrency || "CAD",
          isContactless: !formValues.isOnline && formValues.isContactless,
          date: formValues.date,
        };

        onInputChange(simulationInput);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    formValues,
    selectedMCC,
    form.formState.isValid,
    // onInputChange is intentionally omitted to prevent infinite loops
  ]);

  return (
    <FormProvider {...form}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "var(--space-xl)", // 24px spacing between sections (same as ExpenseForm)
        }}
      >
        <MerchantDetailsSection
          onSelectMCC={setSelectedMCC}
          selectedMCC={selectedMCC}
        />

        <SimulatorTransactionDetails />
      </div>
    </FormProvider>
  );
};
