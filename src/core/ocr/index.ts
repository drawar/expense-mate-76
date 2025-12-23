/**
 * OCR Module - Receipt scanning and data extraction
 *
 * This module provides receipt scanning capabilities using Mindee's OCR API.
 *
 * Usage:
 * ```typescript
 * import { ocrService, OcrError } from '@/core/ocr';
 *
 * // Check if OCR is available (API key configured)
 * if (ocrService.isAvailable()) {
 *   try {
 *     // Scan a receipt image
 *     const result = await ocrService.scanReceipt(imageFile);
 *
 *     if (result.extractedData) {
 *       // Convert to expense form prefill
 *       const prefill = ocrService.toExpenseFormPrefill(
 *         result.extractedData,
 *         result.receiptImage.id
 *       );
 *
 *       // Use prefill data to populate expense form
 *       console.log(prefill.merchantName, prefill.amount, prefill.currency);
 *     }
 *
 *     // After saving expense, link the receipt
 *     await ocrService.linkReceiptToExpense(
 *       result.receiptImage.id,
 *       savedExpenseId
 *     );
 *   } catch (error) {
 *     if (error instanceof OcrError) {
 *       console.error('OCR Error:', error.code, error.message);
 *     }
 *   }
 * }
 * ```
 *
 * Environment Variables Required:
 * - VITE_MINDEE_API_KEY: Mindee API key for receipt OCR
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
export { MindeeProvider, mindeeProvider } from "./MindeeProvider";

// Parser
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
  // Provider response types
  MindeeReceiptResponse,
} from "./types";

// Error types
export { OcrError } from "./types";
export type { OcrErrorCode } from "./types";

// Mappers
export { mapDbReceiptImage, mapDbReceiptOcrData } from "./types";
