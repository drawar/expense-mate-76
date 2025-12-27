// pages/AddExpense.tsx - UPDATED FILE
import { useSupabaseConnectionCheck } from "@/hooks/useSupabaseConnectionCheck";
import { usePaymentMethods } from "@/hooks/usePaymentMethods";
import { useTransactionSubmit } from "@/hooks/useTransactionSubmit";
import { ExpenseForm } from "@/components/expense/form/ExpenseForm";
import StorageModeAlert from "@/components/expense/StorageModeAlert";
import ErrorAlert from "@/components/expense/ErrorAlert";
import ErrorBoundary from "@/components/common/ErrorBoundary";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
// Import the initialization function from rewards service
import { initializeRewardSystem } from "@/core/rewards";
import { MCC_CODES } from "@/utils/constants/mcc";
// Receipt scanning
import { ReceiptScanDialog } from "@/components/receipt/ReceiptScanDialog";
import { ScanResult } from "@/hooks/useReceiptScan";
import { Camera, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CurrencyService } from "@/core/currency";

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

  // Receipt scanning state
  const [isScanDialogOpen, setIsScanDialogOpen] = useState(false);
  const [scannedData, setScannedData] = useState<ScanResult | null>(null);

  // Handle scan complete - store the result to pre-fill form
  const handleScanComplete = useCallback((result: ScanResult) => {
    setScannedData(result);
    setIsScanDialogOpen(false);
  }, []);

  // Clear scanned data
  const clearScannedData = useCallback(() => {
    setScannedData(null);
  }, []);

  // Parse URL query parameters and scanned data for pre-filling the form
  const defaultValues = useMemo(() => {
    // Priority: scanned data > URL params
    if (scannedData?.prefill) {
      const prefill = scannedData.prefill;
      const values: Record<string, unknown> = {};

      if (prefill.merchantName) {
        values.merchantName = prefill.merchantName;
      }
      if (prefill.amount !== undefined) {
        values.amount = prefill.amount;
      }
      if (prefill.currency) {
        values.currency = prefill.currency;
      }
      if (prefill.date) {
        // Form expects date as Date object, prefill.date is ISO string "YYYY-MM-DD"
        // Parse as local date to avoid timezone issues
        const [year, month, day] = prefill.date.split("-").map(Number);
        values.date = new Date(year, month - 1, day);
      }
      if (prefill.time) {
        values.time = prefill.time;
      }

      return Object.keys(values).length > 0 ? values : undefined;
    }

    // Fall back to URL params
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
  }, [searchParams, scannedData]);

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

        {/* Scan Receipt Button */}
        {!scannedData ? (
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsScanDialogOpen(true)}
            className="w-full mb-6 h-12 border-dashed"
          >
            <Camera className="h-5 w-5 mr-2" />
            Scan Receipt
          </Button>
        ) : (
          <div className="mb-6 p-4 rounded-lg border bg-muted/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium flex items-center gap-2">
                <Camera className="h-4 w-4" />
                Receipt scanned
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={clearScannedData}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Clear</span>
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Form pre-filled with extracted data. Review and adjust as needed.
            </p>
          </div>
        )}

        {/* Receipt Scan Dialog */}
        <ReceiptScanDialog
          open={isScanDialogOpen}
          onOpenChange={setIsScanDialogOpen}
          onScanComplete={handleScanComplete}
          defaultCurrency={CurrencyService.getDefaultCurrency()}
        />

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
                key={scannedData?.receiptImageId || "manual"}
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
