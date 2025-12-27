import { supabase } from "@/integrations/supabase/client";
import {
  ReceiptImage,
  ReceiptOcrData,
  OcrExtractedData,
  ExpenseFormPrefill,
  ReceiptUploadResult,
  OcrProcessingResult,
  ReceiptScanResult,
  OcrProcessingOptions,
  OcrError,
  DbReceiptImage,
  DbReceiptOcrData,
  mapDbReceiptImage,
  mapDbReceiptOcrData,
} from "./types";
import { PaddleOcrProvider } from "./PaddleOcrProvider";
import { CloudOcrProvider } from "./CloudOcrProvider";
import { ReceiptTextParser } from "./ReceiptTextParser";
import { ReceiptParser } from "./ReceiptParser";
import { Currency } from "@/types";

// Maximum file size: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;
// Supported image formats
const SUPPORTED_FORMATS = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
];
// Storage bucket name
const STORAGE_BUCKET = "receipts";

/**
 * OcrService - Main service for receipt scanning and OCR processing
 *
 * Handles the complete flow:
 * 1. Image upload to Supabase Storage
 * 2. OCR processing via PaddleOCR (runs client-side, no API costs)
 * 3. Data extraction and normalization
 * 4. Database persistence
 * 5. Expense form pre-fill generation
 */
export class OcrService {
  private paddleOcrProvider: PaddleOcrProvider;
  private cloudOcrProvider: CloudOcrProvider;
  private receiptTextParser: ReceiptTextParser;
  private receiptParser: ReceiptParser;

  constructor() {
    this.paddleOcrProvider = new PaddleOcrProvider();
    this.cloudOcrProvider = new CloudOcrProvider();
    this.receiptTextParser = new ReceiptTextParser();
    this.receiptParser = new ReceiptParser();
  }

  /**
   * Get the active OCR provider based on device capabilities
   * Uses cloud provider on iOS/mobile where client-side OCR is not recommended
   */
  private getActiveProvider(): PaddleOcrProvider | CloudOcrProvider {
    if (!this.paddleOcrProvider.isRecommended()) {
      console.log(
        "OcrService: Using cloud provider (device not recommended for local OCR)"
      );
      return this.cloudOcrProvider;
    }
    return this.paddleOcrProvider;
  }

  /**
   * Check if OCR service is available
   * Available if either client-side or cloud provider works
   */
  isAvailable(): boolean {
    return (
      this.paddleOcrProvider.isAvailable() ||
      this.cloudOcrProvider.isAvailable()
    );
  }

  /**
   * Check if OCR is recommended on this device
   * Returns false for iOS due to memory constraints that can cause crashes
   * (cloud provider will be used as fallback)
   */
  isRecommended(): boolean {
    return this.paddleOcrProvider.isRecommended();
  }

  /**
   * Check if OCR models are loaded and ready
   */
  isReady(): boolean {
    const activeProvider = this.getActiveProvider();
    return activeProvider.isReady();
  }

  /**
   * Pre-load OCR models for faster first scan
   * Call this early (e.g., on app load) to warm up the models
   * Only loads for PaddleOCR; cloud provider doesn't need preloading
   */
  async preloadModels(): Promise<void> {
    // Only preload if using PaddleOCR (client-side)
    if (this.paddleOcrProvider.isRecommended()) {
      await this.paddleOcrProvider.initialize();
    }
    // Cloud provider doesn't need preloading
  }

  /**
   * Full receipt scan flow: upload → OCR → parse → prefill
   *
   * @param imageFile - The receipt image file
   * @param options - Processing options
   * @returns Combined result with receipt image, OCR data, and form prefill
   */
  async scanReceipt(
    imageFile: File,
    options?: OcrProcessingOptions
  ): Promise<ReceiptScanResult> {
    // Step 1: Validate and upload image
    const uploadResult = await this.uploadReceiptImage(imageFile);

    // Step 2: Process with OCR
    const ocrResult = await this.processWithOcr(
      imageFile,
      uploadResult.receiptImage.id,
      options
    );

    if (!ocrResult.success || !ocrResult.data) {
      return {
        receiptImage: uploadResult.receiptImage,
        error: ocrResult.error,
      };
    }

    // Step 3: Get the saved OCR data record
    let ocrData: ReceiptOcrData | undefined;
    if (ocrResult.ocrDataId) {
      ocrData = await this.getOcrData(ocrResult.ocrDataId);
    }

    return {
      receiptImage: uploadResult.receiptImage,
      ocrData,
      extractedData: ocrResult.data,
    };
  }

  /**
   * Process image with OCR only (without uploading)
   * Useful for preview before saving
   * Uses cloud provider on iOS/mobile devices
   */
  async processImageOnly(imageFile: File | Blob): Promise<OcrExtractedData> {
    const provider = this.getActiveProvider();
    const ocrResponse = await provider.processImage(imageFile);
    return this.receiptTextParser.parseReceiptText(ocrResponse.lines);
  }

  /**
   * Upload a receipt image to Supabase Storage
   */
  async uploadReceiptImage(imageFile: File): Promise<ReceiptUploadResult> {
    // Validate file
    this.validateImageFile(imageFile);

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new OcrError("Authentication required", "UPLOAD_FAILED");
    }

    // Generate unique ID for this receipt
    const receiptId = crypto.randomUUID();
    const fileExtension = this.getFileExtension(imageFile.type);
    const storagePath = `${user.id}/${receiptId}.${fileExtension}`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(storagePath, imageFile, {
        contentType: imageFile.type,
        cacheControl: "3600",
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      throw new OcrError(
        `Failed to upload image: ${uploadError.message}`,
        "STORAGE_ERROR"
      );
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(storagePath);

    // Create database record
    const { data: dbRecord, error: dbError } = await supabase
      .from("receipt_images")
      .insert({
        id: receiptId,
        user_id: user.id,
        storage_path: storagePath,
        file_size_bytes: imageFile.size,
        mime_type: imageFile.type,
        original_filename: imageFile.name,
      })
      .select()
      .single();

    if (dbError || !dbRecord) {
      // Rollback: delete uploaded file
      await supabase.storage.from(STORAGE_BUCKET).remove([storagePath]);
      throw new OcrError(
        `Failed to save receipt record: ${dbError?.message || "Unknown error"}`,
        "STORAGE_ERROR"
      );
    }

    return {
      receiptImage: mapDbReceiptImage(dbRecord as DbReceiptImage),
      publicUrl: urlData.publicUrl,
    };
  }

  /**
   * Process an uploaded image with OCR
   * Uses cloud provider on iOS/mobile devices
   */
  async processWithOcr(
    imageFile: File | Blob,
    receiptImageId: string,
    _options?: OcrProcessingOptions
  ): Promise<OcrProcessingResult> {
    const activeProvider = this.getActiveProvider();
    const providerName =
      activeProvider === this.cloudOcrProvider ? "cloudvision" : "paddleocr";

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: "Authentication required" };
    }

    // Create pending OCR record
    const { data: ocrRecord, error: insertError } = await supabase
      .from("receipt_ocr_data")
      .insert({
        receipt_image_id: receiptImageId,
        user_id: user.id,
        ocr_provider: providerName,
        processing_status: "processing",
      })
      .select()
      .single();

    if (insertError || !ocrRecord) {
      return {
        success: false,
        error: `Failed to create OCR record: ${insertError?.message}`,
      };
    }

    try {
      // Step 1: Run OCR to get raw text (uses cloud or local provider based on device)
      const ocrResponse = await activeProvider.processImage(imageFile);

      // Step 2: Parse raw text into structured receipt data
      const extractedData = this.receiptTextParser.parseReceiptText(
        ocrResponse.lines
      );

      // Update OCR record with results
      const { error: updateError } = await supabase
        .from("receipt_ocr_data")
        .update({
          raw_ocr_response: extractedData.rawResponse,
          merchant_name: extractedData.merchantName,
          merchant_address: extractedData.merchantAddress,
          transaction_date: extractedData.transactionDate,
          transaction_time: extractedData.transactionTime,
          currency_code: extractedData.currencyCode,
          total_amount: extractedData.totalAmount,
          tax_amount: extractedData.taxAmount,
          ocr_confidence_score: extractedData.confidence,
          processing_status: "completed",
          ocr_processed_at: new Date().toISOString(),
        })
        .eq("id", ocrRecord.id);

      if (updateError) {
        console.error("Failed to update OCR record:", updateError);
      }

      return {
        success: true,
        data: extractedData,
        ocrDataId: ocrRecord.id,
      };
    } catch (error) {
      // Update record with error
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      await supabase
        .from("receipt_ocr_data")
        .update({
          processing_status: "failed",
          error_message: errorMessage,
        })
        .eq("id", ocrRecord.id);

      return {
        success: false,
        error: errorMessage,
        ocrDataId: ocrRecord.id,
      };
    }
  }

  /**
   * Convert OCR result to expense form prefill data
   */
  toExpenseFormPrefill(
    extractedData: OcrExtractedData,
    receiptImageId: string,
    defaultCurrency?: Currency
  ): ExpenseFormPrefill {
    if (defaultCurrency) {
      this.receiptParser = new ReceiptParser(defaultCurrency);
    }
    return this.receiptParser.toExpenseFormPrefill(
      extractedData,
      receiptImageId
    );
  }

  /**
   * Get OCR data by ID
   */
  async getOcrData(ocrDataId: string): Promise<ReceiptOcrData | undefined> {
    const { data, error } = await supabase
      .from("receipt_ocr_data")
      .select("*")
      .eq("id", ocrDataId)
      .single();

    if (error || !data) {
      console.error("Failed to get OCR data:", error);
      return undefined;
    }

    return mapDbReceiptOcrData(data as DbReceiptOcrData);
  }

  /**
   * Get receipt image by ID
   */
  async getReceiptImage(imageId: string): Promise<ReceiptImage | undefined> {
    const { data, error } = await supabase
      .from("receipt_images")
      .select("*")
      .eq("id", imageId)
      .single();

    if (error || !data) {
      console.error("Failed to get receipt image:", error);
      return undefined;
    }

    return mapDbReceiptImage(data as DbReceiptImage);
  }

  /**
   * Get receipt image URL
   */
  getReceiptImageUrl(storagePath: string): string {
    const { data } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(storagePath);
    return data.publicUrl;
  }

  /**
   * Link a receipt image to an expense
   */
  async linkReceiptToExpense(
    receiptImageId: string,
    expenseId: string
  ): Promise<void> {
    const { error: imageError } = await supabase
      .from("receipt_images")
      .update({ expense_id: expenseId })
      .eq("id", receiptImageId);

    if (imageError) {
      console.error("Failed to link receipt to expense:", imageError);
      throw new OcrError("Failed to link receipt", "STORAGE_ERROR");
    }

    // Also update the transaction
    const { error: txError } = await supabase
      .from("transactions")
      .update({ receipt_image_id: receiptImageId })
      .eq("id", expenseId);

    if (txError) {
      console.error("Failed to update transaction:", txError);
    }
  }

  /**
   * Delete a receipt image and associated OCR data
   */
  async deleteReceipt(receiptImageId: string): Promise<void> {
    // Get the image record first
    const image = await this.getReceiptImage(receiptImageId);
    if (!image) return;

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .remove([image.storagePath]);

    if (storageError) {
      console.error("Failed to delete from storage:", storageError);
    }

    // Delete thumbnail if exists
    if (image.thumbnailPath) {
      await supabase.storage.from(STORAGE_BUCKET).remove([image.thumbnailPath]);
    }

    // Delete database records (cascade will handle OCR data)
    const { error: dbError } = await supabase
      .from("receipt_images")
      .delete()
      .eq("id", receiptImageId);

    if (dbError) {
      throw new OcrError("Failed to delete receipt", "STORAGE_ERROR");
    }
  }

  /**
   * Get all receipts for current user
   */
  async getUserReceipts(): Promise<ReceiptImage[]> {
    const { data, error } = await supabase
      .from("receipt_images")
      .select("*")
      .order("uploaded_at", { ascending: false });

    if (error) {
      console.error("Failed to get user receipts:", error);
      return [];
    }

    return (data || []).map((r) => mapDbReceiptImage(r as DbReceiptImage));
  }

  // ==========================================================================
  // Private helpers
  // ==========================================================================

  private validateImageFile(file: File): void {
    if (file.size > MAX_FILE_SIZE) {
      throw new OcrError(
        `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`,
        "IMAGE_TOO_LARGE"
      );
    }

    if (!SUPPORTED_FORMATS.includes(file.type)) {
      throw new OcrError(
        `Unsupported image format: ${file.type}. Supported: JPEG, PNG, WebP, HEIC`,
        "INVALID_IMAGE_FORMAT"
      );
    }
  }

  private getFileExtension(mimeType: string): string {
    const extensions: Record<string, string> = {
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
      "image/heic": "heic",
    };
    return extensions[mimeType] || "jpg";
  }
}

// Export singleton instance
export const ocrService = new OcrService();
