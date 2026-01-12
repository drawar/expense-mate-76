import React, { useState, useCallback, useEffect } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  Camera,
  RotateCcw,
  ArrowRight,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ReceiptCapture } from "./ReceiptCapture";
import { ReceiptPreview } from "./ReceiptPreview";
import { useReceiptScan, ScanResult } from "@/hooks/useReceiptScan";
import { Currency, PaymentMethod } from "@/types";

interface ReceiptScanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScanComplete: (result: ScanResult) => void;
  defaultCurrency?: Currency;
  /** User's payment methods for matching Apple Wallet card names */
  paymentMethods?: PaymentMethod[];
}

/**
 * ReceiptScanDialog - Full-screen dialog for receipt scanning
 *
 * Shows different states:
 * - Capture mode: Camera/file selection
 * - Scanning: Progress indicator
 * - Success: Preview with extracted data
 * - Error: Error message with retry option
 *
 * Uses Drawer on mobile, Dialog on desktop
 */
export const ReceiptScanDialog: React.FC<ReceiptScanDialogProps> = ({
  open,
  onOpenChange,
  onScanComplete,
  defaultCurrency = "SGD",
  paymentMethods,
}) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const { state, error, result, progress, scanReceipt, reset, isRecommended } =
    useReceiptScan({
      defaultCurrency,
      paymentMethods,
    });

  // Create preview URL when file is selected
  const handleFileSelect = useCallback(
    async (file: File) => {
      // Create preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);

      // Start scanning
      await scanReceipt(file);
    },
    [scanReceipt]
  );

  // Cleanup preview URL
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // Handle dialog close
  const handleClose = useCallback(() => {
    if (state === "scanning" || state === "loading-models") {
      // Don't close while scanning
      return;
    }
    onOpenChange(false);
    // Reset after animation
    setTimeout(() => {
      reset();
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
    }, 200);
  }, [state, onOpenChange, reset, previewUrl]);

  // Handle retry
  const handleRetry = useCallback(() => {
    reset();
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  }, [reset, previewUrl]);

  // Handle continue (use results)
  const handleContinue = useCallback(() => {
    if (result) {
      onScanComplete(result);
      handleClose();
    }
  }, [result, onScanComplete, handleClose]);

  const content = (
    <div className="flex flex-col gap-4">
      {/* iOS warning */}
      {state === "idle" && !isRecommended && (
        <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-700 dark:text-amber-400">
            Receipt scanning may not work well on this device due to memory
            limitations. Consider using a desktop browser for best results.
          </AlertDescription>
        </Alert>
      )}

      {/* Idle state - show capture options */}
      {state === "idle" && (
        <ReceiptCapture onFileSelect={handleFileSelect} variant="dropzone" />
      )}

      {/* Loading/Scanning states */}
      {(state === "loading-models" ||
        state === "scanning" ||
        state === "processing") && (
        <div className="flex flex-col items-center gap-6 py-8">
          {previewUrl && (
            <div className="relative w-48 h-64 rounded-lg overflow-hidden bg-muted">
              <img
                src={previewUrl}
                alt="Receipt preview"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            </div>
          )}

          <div className="text-center space-y-2">
            <p className="text-sm font-medium">
              {state === "loading-models" && "Loading OCR engine..."}
              {state === "scanning" && "Scanning receipt..."}
              {state === "processing" && "Extracting details..."}
            </p>
            <p
              className="text-xs"
              style={{ color: "var(--color-text-secondary)" }}
            >
              {state === "loading-models"
                ? "First scan takes a few seconds to load models"
                : "This usually takes 5-10 seconds"}
            </p>
          </div>

          <Progress value={progress} className="w-full max-w-xs h-2" />
        </div>
      )}

      {/* Success state */}
      {state === "success" && result && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle2 className="h-5 w-5" />
            <span className="font-medium">Receipt scanned successfully</span>
          </div>

          <ReceiptPreview
            imageUrl={result.receiptImageUrl || previewUrl || undefined}
            extractedData={{
              merchantName: result.prefill.merchantName,
              amount: result.prefill.amount,
              currency: result.prefill.currency,
              date: result.prefill.date,
              time: result.prefill.time,
            }}
            confidence={result.prefill.confidence}
            needsReview={result.prefill.needsReview}
          />

          <div className="flex gap-2 mt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleRetry}
              className="flex-1"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Scan Again
            </Button>
            <Button type="button" onClick={handleContinue} className="flex-1">
              Continue
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {/* Error state */}
      {state === "error" && (
        <div className="flex flex-col gap-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>

          {previewUrl && (
            <div className="w-full h-48 rounded-lg overflow-hidden bg-muted">
              <img
                src={previewUrl}
                alt="Receipt preview"
                className="w-full h-full object-contain"
              />
            </div>
          )}

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleRetry}
              className="flex-1"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={handleClose}
              className="flex-1"
            >
              Enter Manually
            </Button>
          </div>
        </div>
      )}
    </div>
  );

  // Use Dialog for both mobile and desktop for consistent styling
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="max-w-lg max-h-[85vh] flex flex-col overflow-hidden"
        hideCloseButton
      >
        <DialogHeader showCloseButton>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Scan Receipt
          </DialogTitle>
          <DialogDescription>
            {state === "idle"
              ? "Take a photo or select an image to extract receipt details"
              : state === "success"
                ? "Review the extracted information below"
                : "Processing your receipt..."}
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto">{content}</div>
      </DialogContent>
    </Dialog>
  );
};
