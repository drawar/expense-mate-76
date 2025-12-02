// pages/AddExpense.tsx - UPDATED FILE
import { useSupabaseConnectionCheck } from "@/hooks/useSupabaseConnectionCheck";
import { usePaymentMethods } from "@/hooks/usePaymentMethods";
import { useTransactionSubmit } from "@/hooks/useTransactionSubmit";
import { ExpenseForm } from "@/components/expense/form/ExpenseForm";
import StorageModeAlert from "@/components/expense/StorageModeAlert";
import ErrorAlert from "@/components/expense/ErrorAlert";
import { useState, useEffect } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
// Import the initialization function from rewards service
import { initializeRewardSystem } from "@/core/rewards";

const AddExpense = () => {
  const { useLocalStorage } = useSupabaseConnectionCheck();
  const { paymentMethods, isLoading } = usePaymentMethods();
  const {
    handleSubmit,
    isLoading: isSaving,
    saveError,
  } = useTransactionSubmit(useLocalStorage);
  const isMobile = useIsMobile();
  const [initializationStatus, setInitializationStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");

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
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-bg)' }}>
      {/* Responsive container: full-width on mobile with padding, centered with max-width on tablet/desktop */}
      <div className="w-full px-4 md:px-0 md:max-w-[600px] lg:max-w-[640px] mx-auto pb-16">
        {/* Page header with new typography scale */}
        <div className="flex flex-col mt-6 mb-6">
          <h1 
            className="font-semibold tracking-tight"
            style={{
              fontSize: 'var(--font-size-title-1)',
              lineHeight: 'var(--line-height-tight)',
              color: 'var(--color-text)',
            }}
          >
            Add Expense
          </h1>
          <p 
            className="mt-2"
            style={{
              fontSize: 'var(--font-size-body)',
              color: 'var(--color-text-secondary)',
            }}
          >
            Record a new expense transaction
          </p>
        </div>

        {/* Spacing between header and content: 24px (xl) */}
        <div style={{ marginTop: 'var(--space-xl)' }}>
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
            <ExpenseForm
              paymentMethods={paymentMethods}
              onSubmit={handleSubmit}
              useLocalStorage={useLocalStorage}
              isSaving={isSaving}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default AddExpense;
