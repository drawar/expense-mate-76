import { OcrExtractedData, OcrError, MindeeReceiptResponse } from "./types";

/**
 * MindeeProvider - Handles OCR processing via Mindee Receipt API
 *
 * API Documentation: https://developers.mindee.com/docs/receipt-ocr
 * Free tier: 250 receipts/month
 */
export class MindeeProvider {
  private apiKey: string;
  private baseUrl =
    "https://api.mindee.net/v1/products/mindee/expense_receipts/v5/predict";
  private timeout = 30000; // 30 seconds

  constructor(apiKey?: string) {
    this.apiKey = apiKey || import.meta.env.VITE_MINDEE_API_KEY || "";
    if (!this.apiKey) {
      console.warn("MindeeProvider: No API key configured");
    }
  }

  /**
   * Check if the provider is configured and available
   */
  isAvailable(): boolean {
    return Boolean(this.apiKey);
  }

  /**
   * Process a receipt image and extract structured data
   *
   * @param imageFile - The image file (Blob or File)
   * @returns Extracted receipt data
   */
  async processReceipt(imageFile: Blob | File): Promise<OcrExtractedData> {
    if (!this.apiKey) {
      throw new OcrError(
        "Mindee API key not configured",
        "OCR_API_ERROR",
        "mindee"
      );
    }

    const formData = new FormData();
    formData.append("document", imageFile);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(this.baseUrl, {
        method: "POST",
        headers: {
          Authorization: `Token ${this.apiKey}`,
        },
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorBody = await response.text();
        console.error("Mindee API error:", response.status, errorBody);

        if (response.status === 401) {
          throw new OcrError(
            "Invalid Mindee API key",
            "OCR_API_ERROR",
            "mindee"
          );
        }
        if (response.status === 429) {
          throw new OcrError(
            "Monthly OCR quota exceeded",
            "QUOTA_EXCEEDED",
            "mindee"
          );
        }
        throw new OcrError(
          `Mindee API error: ${response.status}`,
          "OCR_API_ERROR",
          "mindee"
        );
      }

      const data: MindeeReceiptResponse = await response.json();
      return this.parseResponse(data);
    } catch (error) {
      if (error instanceof OcrError) {
        throw error;
      }
      if (error instanceof Error && error.name === "AbortError") {
        throw new OcrError("OCR processing timed out", "OCR_TIMEOUT", "mindee");
      }
      throw new OcrError(
        `Network error: ${error instanceof Error ? error.message : "Unknown"}`,
        "NETWORK_ERROR",
        "mindee"
      );
    }
  }

  /**
   * Parse Mindee response into normalized format
   */
  private parseResponse(response: MindeeReceiptResponse): OcrExtractedData {
    const prediction = response.document?.inference?.prediction;

    if (!prediction) {
      throw new OcrError(
        "Invalid response from Mindee API",
        "PARSING_ERROR",
        "mindee"
      );
    }

    // Calculate overall confidence as weighted average
    const confidenceValues: number[] = [];
    if (prediction.total_amount?.confidence) {
      confidenceValues.push(prediction.total_amount.confidence * 1.5); // Weight total higher
    }
    if (prediction.supplier_name?.confidence) {
      confidenceValues.push(prediction.supplier_name.confidence);
    }
    if (prediction.date?.confidence) {
      confidenceValues.push(prediction.date.confidence);
    }

    const overallConfidence =
      confidenceValues.length > 0
        ? confidenceValues.reduce((a, b) => a + b, 0) / confidenceValues.length
        : 0;

    // Parse date - handle various formats
    let transactionDate: string | undefined;
    if (prediction.date?.value) {
      try {
        const dateValue = prediction.date.value;
        // Mindee returns dates in YYYY-MM-DD format
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
          transactionDate = dateValue;
        } else {
          // Try to parse other formats
          const parsed = new Date(dateValue);
          if (!isNaN(parsed.getTime())) {
            transactionDate = parsed.toISOString().split("T")[0];
          }
        }
      } catch {
        console.warn("Failed to parse date:", prediction.date.value);
      }
    }

    // Parse time - normalize to HH:mm format
    let transactionTime: string | undefined;
    if (prediction.time?.value) {
      const timeValue = prediction.time.value;
      // Extract HH:mm from various formats
      const timeMatch = timeValue.match(/(\d{1,2}):(\d{2})/);
      if (timeMatch) {
        const hours = timeMatch[1].padStart(2, "0");
        const minutes = timeMatch[2];
        transactionTime = `${hours}:${minutes}`;
      }
    }

    // Map currency code - normalize common variations
    let currencyCode: string | undefined;
    if (prediction.locale?.currency) {
      currencyCode = this.normalizeCurrency(prediction.locale.currency);
    }

    return {
      merchantName: prediction.supplier_name?.value || undefined,
      merchantAddress: prediction.supplier_address?.value || undefined,
      transactionDate,
      transactionTime,
      currencyCode,
      totalAmount: prediction.total_amount?.value ?? undefined,
      taxAmount: prediction.total_tax?.value ?? undefined,
      confidence: Math.min(overallConfidence, 1),
      rawResponse: response,
    };
  }

  /**
   * Normalize currency codes to match our Currency type
   */
  private normalizeCurrency(currency: string): string {
    const currencyMap: Record<string, string> = {
      // Common variations
      US: "USD",
      DOLLAR: "USD",
      DOLLARS: "USD",
      CA: "CAD",
      CANADIAN: "CAD",
      SG: "SGD",
      SINGAPORE: "SGD",
      EU: "EUR",
      EURO: "EUR",
      UK: "GBP",
      POUND: "GBP",
      POUNDS: "GBP",
      JP: "JPY",
      YEN: "JPY",
      VN: "VND",
      DONG: "VND",
      MY: "MYR",
      TH: "THB",
      ID: "IDR",
      TW: "TWD",
      AU: "AUD",
      CN: "CNY",
      IN: "INR",
    };

    const normalized = currency.toUpperCase().trim();
    return currencyMap[normalized] || normalized;
  }
}

// Export singleton instance
export const mindeeProvider = new MindeeProvider();
