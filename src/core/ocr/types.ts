import { Currency } from "@/types";

// =============================================================================
// OCR Provider Types
// =============================================================================

export type OcrProvider = "paddleocr" | "cloudvision";

export type ProcessingStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed";

// =============================================================================
// Receipt Image Types
// =============================================================================

export interface ReceiptImage {
  id: string;
  userId: string;
  expenseId?: string;
  storagePath: string;
  thumbnailPath?: string;
  fileSizeBytes?: number;
  mimeType: string;
  originalFilename?: string;
  uploadedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface DbReceiptImage {
  id: string;
  user_id: string;
  expense_id: string | null;
  storage_path: string;
  thumbnail_path: string | null;
  file_size_bytes: number | null;
  mime_type: string | null;
  original_filename: string | null;
  uploaded_at: string;
  created_at: string;
  updated_at: string;
}

// =============================================================================
// OCR Data Types
// =============================================================================

export interface ReceiptOcrData {
  id: string;
  receiptImageId: string;
  userId: string;
  rawOcrResponse?: unknown;
  merchantName?: string;
  merchantAddress?: string;
  transactionDate?: string; // ISO date string
  transactionTime?: string; // HH:mm:ss format
  currencyCode?: Currency;
  subtotalAmount?: number;
  taxAmount?: number;
  totalAmount?: number;
  receiptNumber?: string;
  paymentMethodHint?: string;
  ocrProvider: OcrProvider;
  ocrConfidenceScore?: number;
  ocrProcessedAt: string;
  processingStatus: ProcessingStatus;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DbReceiptOcrData {
  id: string;
  receipt_image_id: string;
  user_id: string;
  raw_ocr_response: unknown | null;
  merchant_name: string | null;
  merchant_address: string | null;
  transaction_date: string | null;
  transaction_time: string | null;
  currency_code: string | null;
  subtotal_amount: number | null;
  tax_amount: number | null;
  total_amount: number | null;
  receipt_number: string | null;
  payment_method_hint: string | null;
  ocr_provider: string;
  ocr_confidence_score: number | null;
  ocr_processed_at: string;
  processing_status: string;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

// =============================================================================
// OCR Processing Types
// =============================================================================

/**
 * Raw text line from PaddleOCR
 */
export interface PaddleOcrTextLine {
  text: string;
  score: number;
  frame: {
    top: number;
    left: number;
    width: number;
    height: number;
  };
}

/**
 * Raw response from PaddleOCR
 */
export interface PaddleOcrResponse {
  lines: PaddleOcrTextLine[];
  processingTimeMs: number;
}

/**
 * Normalized OCR result (provider-agnostic)
 */
export interface OcrExtractedData {
  merchantName?: string;
  merchantAddress?: string;
  transactionDate?: string; // ISO date format YYYY-MM-DD
  transactionTime?: string; // HH:mm format
  currencyCode?: string;
  subtotalAmount?: number;
  taxAmount?: number;
  totalAmount?: number;
  receiptNumber?: string;
  paymentMethodHint?: string;
  confidence: number; // Overall confidence 0-1
  rawResponse: unknown;
}

/**
 * Options for OCR processing
 */
export interface OcrProcessingOptions {
  provider?: OcrProvider;
  skipThumbnail?: boolean;
}

/**
 * Result of receipt upload
 */
export interface ReceiptUploadResult {
  receiptImage: ReceiptImage;
  publicUrl: string;
  thumbnailUrl?: string;
}

/**
 * Result of OCR processing
 */
export interface OcrProcessingResult {
  success: boolean;
  data?: OcrExtractedData;
  ocrDataId?: string;
  error?: string;
}

/**
 * Combined result for the full receipt scan flow
 */
export interface ReceiptScanResult {
  receiptImage: ReceiptImage;
  ocrData?: ReceiptOcrData;
  extractedData?: OcrExtractedData;
  error?: string;
}

// =============================================================================
// Pre-fill Types (for expense form integration)
// =============================================================================

/**
 * Data structure to pre-fill the expense form from OCR
 */
export interface ExpenseFormPrefill {
  merchantName?: string;
  amount?: number;
  currency?: Currency;
  date?: string; // ISO date string
  time?: string; // HH:mm format
  receiptImageId: string;
  confidence: number;
  needsReview: boolean;
}

// =============================================================================
// Error Types
// =============================================================================

export class OcrError extends Error {
  constructor(
    message: string,
    public code: OcrErrorCode,
    public provider?: OcrProvider
  ) {
    super(message);
    this.name = "OcrError";
  }
}

export type OcrErrorCode =
  | "UPLOAD_FAILED"
  | "IMAGE_TOO_LARGE"
  | "INVALID_IMAGE_FORMAT"
  | "OCR_API_ERROR"
  | "OCR_TIMEOUT"
  | "QUOTA_EXCEEDED"
  | "LOW_CONFIDENCE"
  | "PARSING_ERROR"
  | "STORAGE_ERROR"
  | "NETWORK_ERROR";

// =============================================================================
// Mappers
// =============================================================================

export function mapDbReceiptImage(db: DbReceiptImage): ReceiptImage {
  return {
    id: db.id,
    userId: db.user_id,
    expenseId: db.expense_id ?? undefined,
    storagePath: db.storage_path,
    thumbnailPath: db.thumbnail_path ?? undefined,
    fileSizeBytes: db.file_size_bytes ?? undefined,
    mimeType: db.mime_type ?? "image/webp",
    originalFilename: db.original_filename ?? undefined,
    uploadedAt: db.uploaded_at,
    createdAt: db.created_at,
    updatedAt: db.updated_at,
  };
}

export function mapDbReceiptOcrData(db: DbReceiptOcrData): ReceiptOcrData {
  return {
    id: db.id,
    receiptImageId: db.receipt_image_id,
    userId: db.user_id,
    rawOcrResponse: db.raw_ocr_response ?? undefined,
    merchantName: db.merchant_name ?? undefined,
    merchantAddress: db.merchant_address ?? undefined,
    transactionDate: db.transaction_date ?? undefined,
    transactionTime: db.transaction_time ?? undefined,
    currencyCode: db.currency_code as Currency | undefined,
    subtotalAmount: db.subtotal_amount ?? undefined,
    taxAmount: db.tax_amount ?? undefined,
    totalAmount: db.total_amount ?? undefined,
    receiptNumber: db.receipt_number ?? undefined,
    paymentMethodHint: db.payment_method_hint ?? undefined,
    ocrProvider: db.ocr_provider as OcrProvider,
    ocrConfidenceScore: db.ocr_confidence_score ?? undefined,
    ocrProcessedAt: db.ocr_processed_at,
    processingStatus: db.processing_status as ProcessingStatus,
    errorMessage: db.error_message ?? undefined,
    createdAt: db.created_at,
    updatedAt: db.updated_at,
  };
}
