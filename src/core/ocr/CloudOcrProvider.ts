import { supabase } from "@/integrations/supabase/client";
import { PaddleOcrResponse, OcrError } from "./types";

/**
 * CloudOcrProvider - Handles OCR processing via Google Cloud Vision (server-side)
 *
 * Uses a Supabase Edge Function that calls Google Cloud Vision TEXT_DETECTION API.
 * Processing happens server-side, making it suitable for mobile devices where
 * client-side WASM models would be too memory-intensive.
 */
export class CloudOcrProvider {
  /**
   * Cloud OCR is always available (server-side processing)
   */
  isAvailable(): boolean {
    return true;
  }

  /**
   * Cloud OCR is always recommended (no client-side memory constraints)
   */
  isRecommended(): boolean {
    return true;
  }

  /**
   * Cloud OCR doesn't require model loading
   */
  isReady(): boolean {
    return true;
  }

  /**
   * No-op for cloud provider (no models to load)
   */
  async initialize(): Promise<void> {
    // Cloud provider doesn't need initialization
  }

  /**
   * Process a receipt image via Cloud Vision API
   *
   * @param imageFile - The image file (Blob or File)
   * @returns OCR text lines with positions (same format as PaddleOcrProvider)
   */
  async processImage(imageFile: Blob | File): Promise<PaddleOcrResponse> {
    const startTime = performance.now();

    try {
      // Convert image to base64
      const base64 = await this.fileToBase64(imageFile);

      console.log("CloudOCR: Calling edge function...");

      // Call Supabase edge function
      const { data, error } = await supabase.functions.invoke("ocr-receipt", {
        body: {
          image: base64,
          mimeType: imageFile.type || "image/jpeg",
        },
      });

      if (error) {
        console.error("CloudOCR: Edge function error:", error);
        throw new OcrError(
          `Cloud OCR failed: ${error.message}`,
          "OCR_API_ERROR",
          "cloudvision"
        );
      }

      if (data.error) {
        console.error("CloudOCR: API error:", data.error);
        throw new OcrError(
          `Cloud OCR failed: ${data.error}`,
          "OCR_API_ERROR",
          "cloudvision"
        );
      }

      const clientProcessingTime = Math.round(performance.now() - startTime);
      console.log(
        `CloudOCR: Completed in ${clientProcessingTime}ms (server: ${data.processingTimeMs}ms), found ${data.lines?.length ?? 0} lines`
      );

      // Log full raw text for debugging
      if (data.fullText) {
        console.log(
          "CloudOCR: Full raw text from Google Vision:\n",
          data.fullText
        );
      }

      return {
        lines: data.lines ?? [],
        processingTimeMs: clientProcessingTime,
      };
    } catch (error) {
      if (error instanceof OcrError) {
        throw error;
      }

      console.error("CloudOCR: Processing error:", error);
      throw new OcrError(
        `Cloud OCR processing failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        "OCR_API_ERROR",
        "cloudvision"
      );
    }
  }

  /**
   * Convert File/Blob to base64 string (without data URL prefix)
   */
  private fileToBase64(file: Blob | File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        // Remove data URL prefix (e.g., "data:image/jpeg;base64,")
        const base64 = dataUrl.split(",")[1];
        resolve(base64);
      };
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsDataURL(file);
    });
  }
}

// Export singleton instance
export const cloudOcrProvider = new CloudOcrProvider();
