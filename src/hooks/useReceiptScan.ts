import { useState, useCallback, useEffect } from "react";
import { ocrService, OcrError, ExpenseFormPrefill } from "@/core/ocr";
import { Currency, PaymentMethod } from "@/types";

export type ScanState =
  | "idle"
  | "loading-models"
  | "scanning"
  | "processing"
  | "success"
  | "error";

export interface ScanResult {
  prefill: ExpenseFormPrefill;
  receiptImageId: string;
  receiptImageUrl?: string;
}

export interface UseReceiptScanOptions {
  defaultCurrency?: Currency;
  /** User's payment methods for matching Apple Wallet card names */
  paymentMethods?: PaymentMethod[];
  onSuccess?: (result: ScanResult) => void;
  onError?: (error: string) => void;
}

export interface UseReceiptScanReturn {
  state: ScanState;
  error: string | null;
  result: ScanResult | null;
  progress: number;
  isModelsLoaded: boolean;
  isRecommended: boolean;
  scanReceipt: (file: File) => Promise<void>;
  preloadModels: () => Promise<void>;
  reset: () => void;
}

/**
 * Hook for handling receipt scanning with PaddleOCR
 *
 * Usage:
 * ```tsx
 * const { state, scanReceipt, result, error } = useReceiptScan({
 *   defaultCurrency: 'SGD',
 *   onSuccess: (result) => prefillForm(result.prefill),
 * });
 *
 * // Trigger scan
 * <input type="file" onChange={(e) => scanReceipt(e.target.files[0])} />
 * ```
 */
export function useReceiptScan(
  options: UseReceiptScanOptions = {}
): UseReceiptScanReturn {
  const {
    defaultCurrency = "SGD",
    paymentMethods,
    onSuccess,
    onError,
  } = options;

  const [state, setState] = useState<ScanState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [progress, setProgress] = useState(0);
  const [isModelsLoaded, setIsModelsLoaded] = useState(false);

  // Check if models are already loaded
  useEffect(() => {
    setIsModelsLoaded(ocrService.isReady());
  }, []);

  /**
   * Pre-load OCR models (optional, for faster first scan)
   */
  const preloadModels = useCallback(async () => {
    if (isModelsLoaded) return;

    try {
      setState("loading-models");
      setProgress(10);

      await ocrService.preloadModels();

      setIsModelsLoaded(true);
      setProgress(100);
      setState("idle");
    } catch (err) {
      console.error("Failed to preload OCR models:", err);
      setState("idle");
      // Don't set error - models will load on first scan
    }
  }, [isModelsLoaded]);

  /**
   * Scan a receipt image (local-only mode - no Supabase storage)
   */
  const scanReceipt = useCallback(
    async (file: File) => {
      setError(null);
      setResult(null);

      try {
        // Step 1: Load models if not already loaded
        if (!ocrService.isReady()) {
          setState("loading-models");
          setProgress(10);
          await ocrService.preloadModels();
          setIsModelsLoaded(true);
        }

        // Step 2: Process image with OCR (local only, no upload)
        setState("scanning");
        setProgress(30);

        const extractedData = await ocrService.processImageOnly(file);

        setProgress(70);
        setState("processing");

        if (!extractedData) {
          throw new Error("Failed to extract receipt data");
        }

        // Step 3: Convert to form prefill
        setProgress(90);

        // Generate a local ID for this scan session
        const localReceiptId = `local-${Date.now()}`;

        const prefill = ocrService.toExpenseFormPrefill(
          extractedData,
          localReceiptId,
          defaultCurrency,
          paymentMethods
        );

        // Create a local blob URL for preview
        const receiptImageUrl = URL.createObjectURL(file);

        const finalResult: ScanResult = {
          prefill,
          receiptImageId: localReceiptId,
          receiptImageUrl,
        };

        setResult(finalResult);
        setProgress(100);
        setState("success");

        onSuccess?.(finalResult);
      } catch (err) {
        const errorMessage =
          err instanceof OcrError
            ? getErrorMessage(err)
            : err instanceof Error
              ? err.message
              : "An unexpected error occurred";

        setError(errorMessage);
        setState("error");
        onError?.(errorMessage);
      }
    },
    [defaultCurrency, paymentMethods, onSuccess, onError]
  );

  /**
   * Reset to initial state
   */
  const reset = useCallback(() => {
    setState("idle");
    setError(null);
    setResult(null);
    setProgress(0);
  }, []);

  return {
    state,
    error,
    result,
    progress,
    isModelsLoaded,
    isRecommended: ocrService.isRecommended(),
    scanReceipt,
    preloadModels,
    reset,
  };
}

/**
 * Get user-friendly error message
 */
function getErrorMessage(error: OcrError): string {
  switch (error.code) {
    case "IMAGE_TOO_LARGE":
      return "Image is too large. Please use an image under 10MB.";
    case "INVALID_IMAGE_FORMAT":
      return "Unsupported image format. Please use JPEG, PNG, or WebP.";
    case "UPLOAD_FAILED":
      return "Failed to upload image. Please try again.";
    case "OCR_API_ERROR":
      return "Failed to process image. Please try again.";
    case "OCR_TIMEOUT":
      return "Processing took too long. Please try with a clearer image.";
    case "STORAGE_ERROR":
      return "Failed to save receipt. Please try again.";
    case "NETWORK_ERROR":
      return "Network error. Please check your connection.";
    default:
      return error.message || "An unexpected error occurred";
  }
}
