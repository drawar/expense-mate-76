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
 * Detect if running on iOS (iPhone/iPad)
 * iOS Safari has memory limitations that can cause crashes with large WASM files
 */
function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

/**
 * Configure ONNX Runtime WASM paths
 * Must be called before creating OCR instance
 */
async function configureOnnxRuntime() {
  // Import onnxruntime-web to configure WASM paths
  const ort = await import("onnxruntime-web");

  // In development, serve from node_modules; in production, from root
  const isDev = import.meta.env.DEV;
  ort.env.wasm.wasmPaths = isDev ? "/node_modules/onnxruntime-web/dist/" : "/";

  // Disable multi-threading - required for iOS and simplifies loading
  ort.env.wasm.numThreads = 1;

  // Disable SIMD on iOS to reduce memory pressure
  if (isIOS()) {
    ort.env.wasm.simd = false;
  }
}

/**
 * Dynamically import and create OCR instance
 * This is done lazily to avoid loading 15MB of models until needed
 */
async function createOcrInstance() {
  // Configure ONNX Runtime WASM paths first
  await configureOnnxRuntime();

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
   * Note: iOS devices may crash due to memory limitations with large WASM models
   */
  isAvailable(): boolean {
    // Check for WebAssembly support
    if (typeof WebAssembly === "undefined") {
      return false;
    }
    return true;
  }

  /**
   * Check if OCR is recommended on this device
   * Returns false for iOS due to memory constraints
   */
  isRecommended(): boolean {
    return !isIOS();
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

      // Map library output to our type
      // Library returns: { text, mean, box?: number[][] }
      // We need: { text, score, frame: { top, left, width, height } }
      const lines: PaddleOcrTextLine[] = result.map((line) => {
        // Convert box (4 corner points) to frame (bounding box)
        // box is [[x1,y1], [x2,y2], [x3,y3], [x4,y4]] - 4 corners of quadrilateral
        let frame = { top: 0, left: 0, width: 0, height: 0 };

        if (line.box && line.box.length >= 4) {
          const xs = line.box.map((p) => p[0]);
          const ys = line.box.map((p) => p[1]);
          const minX = Math.min(...xs);
          const maxX = Math.max(...xs);
          const minY = Math.min(...ys);
          const maxY = Math.max(...ys);
          frame = {
            left: minX,
            top: minY,
            width: maxX - minX,
            height: maxY - minY,
          };
        }

        return {
          text: line.text,
          score: line.mean ?? 0.9, // Use 'mean' as confidence score
          frame,
        };
      });

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
