import { PaddleOcrTextLine, PaddleOcrResponse, OcrError } from "./types";

// Model paths relative to public directory
const MODEL_PATHS = {
  detectionPath: "/ocr-models/ch_PP-OCRv4_det_infer.onnx",
  recognitionPath: "/ocr-models/ch_PP-OCRv4_rec_infer.onnx",
  dictionaryPath: "/ocr-models/ppocr_keys_v1.txt",
};

// Lazy-loaded OCR instance
let ocrInstance: Awaited<ReturnType<typeof createOcrInstance>> | null = null;
let initPromise: Promise<void> | null = null;

/**
 * Dynamically import and create OCR instance
 * This is done lazily to avoid loading 15MB of models until needed
 */
async function createOcrInstance() {
  const { default: Ocr } = await import("@gutenye/ocr-browser");
  return Ocr.create({
    models: MODEL_PATHS,
  });
}

/**
 * PaddleOcrProvider - Handles OCR processing via PaddleOCR (runs client-side)
 *
 * Uses @gutenye/ocr-browser which runs PP-OCRv4 model via ONNX Runtime Web.
 * All processing happens in the browser - no server costs.
 */
export class PaddleOcrProvider {
  private isInitialized = false;

  /**
   * Initialize the OCR engine (loads ~15MB of models)
   * Call this early to pre-warm the models
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    if (initPromise) {
      await initPromise;
      return;
    }

    initPromise = (async () => {
      try {
        console.log("PaddleOCR: Loading models...");
        const startTime = performance.now();

        ocrInstance = await createOcrInstance();

        const loadTime = Math.round(performance.now() - startTime);
        console.log(`PaddleOCR: Models loaded in ${loadTime}ms`);

        this.isInitialized = true;
      } catch (error) {
        initPromise = null;
        console.error("PaddleOCR: Failed to load models:", error);
        throw new OcrError(
          "Failed to initialize OCR engine",
          "OCR_API_ERROR",
          "paddleocr"
        );
      }
    })();

    await initPromise;
  }

  /**
   * Check if the provider is available
   */
  isAvailable(): boolean {
    // PaddleOCR is always available (runs client-side)
    return true;
  }

  /**
   * Check if models are loaded
   */
  isReady(): boolean {
    return this.isInitialized && ocrInstance !== null;
  }

  /**
   * Process a receipt image and extract text
   *
   * @param imageFile - The image file (Blob or File)
   * @returns Raw OCR text lines with positions
   */
  async processImage(imageFile: Blob | File): Promise<PaddleOcrResponse> {
    // Ensure initialized
    if (!this.isReady()) {
      await this.initialize();
    }

    if (!ocrInstance) {
      throw new OcrError(
        "OCR engine not initialized",
        "OCR_API_ERROR",
        "paddleocr"
      );
    }

    try {
      const startTime = performance.now();

      // Convert file to data URL for PaddleOCR
      const dataUrl = await this.fileToDataUrl(imageFile);

      // Run OCR detection
      const result = await ocrInstance.detect(dataUrl);

      const processingTimeMs = Math.round(performance.now() - startTime);
      console.log(
        `PaddleOCR: Processed in ${processingTimeMs}ms, found ${result.length} text regions`
      );

      // Map to our type
      const lines: PaddleOcrTextLine[] = result.map((line) => ({
        text: line.text,
        score: line.score,
        frame: line.frame,
      }));

      return {
        lines,
        processingTimeMs,
      };
    } catch (error) {
      console.error("PaddleOCR: Processing error:", error);
      throw new OcrError(
        `OCR processing failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        "OCR_API_ERROR",
        "paddleocr"
      );
    }
  }

  /**
   * Convert File/Blob to data URL
   */
  private fileToDataUrl(file: Blob | File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsDataURL(file);
    });
  }
}

// Export singleton instance
export const paddleOcrProvider = new PaddleOcrProvider();
