// pages/AddExpense.tsx - UPDATED FILE
import { useSupabaseConnectionCheck } from "@/hooks/useSupabaseConnectionCheck";
import { usePaymentMethods } from "@/hooks/usePaymentMethods";
import { useTransactionSubmit } from "@/hooks/useTransactionSubmit";
import { ExpenseForm } from "@/components/expense/form/ExpenseForm";
import StorageModeAlert from "@/components/expense/StorageModeAlert";
import ErrorAlert from "@/components/expense/ErrorAlert";
import ErrorBoundary from "@/components/common/ErrorBoundary";
import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
// Import the initialization function from rewards service
import { initializeRewardSystem } from "@/core/rewards";
import { MCC_CODES } from "@/utils/constants/mcc";

const AddExpense = () => {
  const { useLocalStorage } = useSupabaseConnectionCheck();
  const { paymentMethods, isLoading } = usePaymentMethods();
  const {
    handleSubmit,
    isLoading: isSaving,
    saveError,
  } = useTransactionSubmit(useLocalStorage);
  const [searchParams] = useSearchParams();
  const [initializationStatus, setInitializationStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("loading");

  // Parse URL query parameters for pre-filling the form
  const defaultValues = useMemo(() => {
    const merchantName = searchParams.get("merchantName");
    const mccCode = searchParams.get("mccCode");

    if (!merchantName && !mccCode) {
      return undefined;
    }

    const values: Record<string, unknown> = {};

    if (merchantName) {
      values.merchantName = merchantName;
    }

    if (mccCode) {
      // Look up full MCC object from code
      const mcc = MCC_CODES.find((m) => m.code === mccCode);
      if (mcc) {
        values.mcc = mcc;
      }
    }

    return values;
  }, [searchParams]);

  // Initialize the reward calculation system when the page loads
  useEffect(() => {
    const initializeRewardSystemOnMount = async () => {
      console.log("AddExpense: Initializing reward system...");
      setInitializationStatus("loading");

      try {
        // Initialize the reward calculation service
        await initializeRewardSystem();

        // Update status
        setInitializationStatus("success");
        console.log("Reward calculation system ready");
      } catch (error) {
        console.error("Failed to initialize reward system:", error);
        setInitializationStatus("error");
      }
    };

    initializeRewardSystemOnMount();
  }, []);

  useEffect(() => {
    console.log("Payment methods in AddExpense:", paymentMethods);
  }, [paymentMethods]);

  return (
    <div className="min-h-screen">
      {/* Responsive container: full-width on mobile with padding, centered with max-width on tablet/desktop */}
      <div className="w-full px-4 md:px-0 md:max-w-[600px] lg:max-w-[640px] mx-auto pb-16">
        {/* Page header */}
        <div className="flex flex-col mt-6 mb-6">
          <h1 className="text-2xl font-medium tracking-tight text-gradient">
            Add Expense
          </h1>
          <p className="text-muted-foreground mt-1.5 text-sm">
            Record a new expense transaction
          </p>
        </div>

        {/* Spacing between header and content: 24px (xl) */}
        <div style={{ marginTop: "var(--space-xl)" }}>
          <StorageModeAlert useLocalStorage={useLocalStorage} />
          <ErrorAlert error={saveError} />

          {(isLoading && paymentMethods.length === 0) ||
          initializationStatus === "loading" ? (
            <div className="animate-pulse text-center py-10">Loading...</div>
          ) : initializationStatus === "error" ? (
            <div className="text-center py-10 text-red-500">
              Error initializing reward system. Please try refreshing the page.
            </div>
          ) : (
            <ErrorBoundary>
              <ExpenseForm
                paymentMethods={paymentMethods}
                onSubmit={handleSubmit}
                defaultValues={defaultValues}
                useLocalStorage={useLocalStorage}
                isSaving={isSaving}
              />
            </ErrorBoundary>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddExpense;
