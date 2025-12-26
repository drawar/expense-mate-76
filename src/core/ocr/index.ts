/**
 * OCR Module - Receipt scanning and data extraction
 *
 * This module provides receipt scanning capabilities using PaddleOCR (PP-OCRv4).
 * All OCR processing runs client-side via ONNX Runtime - no API costs!
 *
 * Usage:
 * ```typescript
 * import { ocrService, OcrError } from '@/core/ocr';
 *
 * // Optional: Pre-load models on app startup for faster first scan
 * // (models are ~15MB and loaded lazily on first use)
 * await ocrService.preloadModels();
 *
 * // Scan a receipt image
 * try {
 *   const result = await ocrService.scanReceipt(imageFile);
 *
 *   if (result.extractedData) {
 *     // Convert to expense form prefill
 *     const prefill = ocrService.toExpenseFormPrefill(
 *       result.extractedData,
 *       result.receiptImage.id,
 *       'SGD' // default currency
 *     );
 *
 *     // Use prefill data to populate expense form
 *     console.log(prefill.merchantName, prefill.amount, prefill.currency);
 *   }
 *
 *   // After saving expense, link the receipt
 *   await ocrService.linkReceiptToExpense(
 *     result.receiptImage.id,
 *     savedExpenseId
 *   );
 * } catch (error) {
 *   if (error instanceof OcrError) {
 *     console.error('OCR Error:', error.code, error.message);
 *   }
 * }
 * ```
 *
 * Model Files Required (in public/ocr-models/):
 * - ch_PP-OCRv4_det_infer.onnx (~4.7MB) - Text detection model
 * - ch_PP-OCRv4_rec_infer.onnx (~10.8MB) - Text recognition model
 * - ppocr_keys_v1.txt (~26KB) - Character dictionary
 *
 * Database Tables:
 * - receipt_images: Stores uploaded receipt image metadata
 * - receipt_ocr_data: Stores extracted OCR data
 *
 * Storage:
 * - receipts bucket: Supabase Storage bucket for receipt images
 */

// Main service
export { OcrService, ocrService } from "./OcrService";

// Providers
export { PaddleOcrProvider, paddleOcrProvider } from "./PaddleOcrProvider";

// Parsers
export { ReceiptTextParser, receiptTextParser } from "./ReceiptTextParser";
export { ReceiptParser, receiptParser } from "./ReceiptParser";

// Types
export type {
  // Image types
  ReceiptImage,
  DbReceiptImage,
  // OCR data types
  ReceiptOcrData,
  DbReceiptOcrData,
  OcrExtractedData,
  // Processing types
  OcrProvider,
  ProcessingStatus,
  OcrProcessingOptions,
  OcrProcessingResult,
  ReceiptUploadResult,
  ReceiptScanResult,
  // Form integration
  ExpenseFormPrefill,
  // PaddleOCR response types
  PaddleOcrTextLine,
  PaddleOcrResponse,
} from "./types";

// Error types
export { OcrError } from "./types";
export type { OcrErrorCode } from "./types";

// Mappers
export { mapDbReceiptImage, mapDbReceiptOcrData } from "./types";
