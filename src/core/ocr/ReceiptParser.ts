import { Currency, PaymentMethod } from "@/types";
import { OcrExtractedData, ExpenseFormPrefill } from "./types";
import { CurrencyService } from "@/core/currency";

// Confidence threshold for flagging review
const REVIEW_THRESHOLD = 0.7;

// Supported currencies in the app
const SUPPORTED_CURRENCIES: Currency[] = [
  "USD",
  "EUR",
  "GBP",
  "JPY",
  "CAD",
  "AUD",
  "CNY",
  "INR",
  "SGD",
  "TWD",
  "VND",
  "IDR",
  "THB",
  "MYR",
];

/**
 * ReceiptParser - Converts OCR data to expense form prefill data
 *
 * Handles validation, normalization, and currency detection
 */
export class ReceiptParser {
  private defaultCurrency: Currency;

  constructor(defaultCurrency: Currency = "SGD") {
    this.defaultCurrency = defaultCurrency;
  }

  /**
   * Convert OCR extracted data to expense form prefill
   * @param ocrData - Extracted OCR data
   * @param receiptImageId - ID of the uploaded receipt image
   * @param paymentMethods - Optional list of user's payment methods for matching (Apple Wallet)
   */
  toExpenseFormPrefill(
    ocrData: OcrExtractedData,
    receiptImageId: string,
    paymentMethods?: PaymentMethod[]
  ): ExpenseFormPrefill {
    // Normalize and validate merchant name
    const merchantName = this.normalizeMerchantName(ocrData.merchantName);

    // Validate and normalize amount
    const amount = this.validateAmount(ocrData.totalAmount);

    // Validate and normalize currency
    const currency = this.validateCurrency(ocrData.currencyCode);

    // Validate date (reject future dates or very old dates)
    const date = this.validateDate(ocrData.transactionDate);

    // Normalize time
    const time = this.normalizeTime(ocrData.transactionTime);

    // Determine if manual review is needed
    const needsReview = ocrData.confidence < REVIEW_THRESHOLD || !amount;

    // Check if this is an Apple Wallet screenshot
    const isAppleWallet =
      (ocrData.rawResponse as { isAppleWallet?: boolean })?.isAppleWallet ??
      false;

    // Try to match payment method from hint (for Apple Wallet screenshots)
    let paymentMethodId: string | undefined;
    const paymentMethodHint = ocrData.paymentMethodHint;

    if (paymentMethodHint && paymentMethods && paymentMethods.length > 0) {
      paymentMethodId = this.matchPaymentMethod(
        paymentMethodHint,
        paymentMethods
      );
    }

    return {
      merchantName,
      amount,
      currency,
      date,
      time,
      receiptImageId,
      confidence: ocrData.confidence,
      needsReview,
      paymentMethodId,
      paymentMethodHint,
      isAppleWallet,
    };
  }

  /**
   * Match a card name hint from Apple Wallet to user's payment methods
   * Uses fuzzy matching to handle variations in card names
   */
  private matchPaymentMethod(
    cardNameHint: string,
    paymentMethods: PaymentMethod[]
  ): string | undefined {
    if (!cardNameHint || paymentMethods.length === 0) return undefined;

    // Normalize the hint for matching
    const normalizedHint = this.normalizeCardName(cardNameHint);
    const hintTokens = normalizedHint.split(" ").filter((t) => t.length > 1);

    let bestMatch: { id: string; score: number } | null = null;

    for (const pm of paymentMethods) {
      if (!pm.active) continue; // Skip inactive payment methods

      // Normalize the payment method name
      const normalizedName = this.normalizeCardName(pm.name);
      const nameTokens = normalizedName.split(" ").filter((t) => t.length > 1);

      // Calculate match score based on token overlap
      let matchedTokens = 0;
      for (const hintToken of hintTokens) {
        for (const nameToken of nameTokens) {
          // Exact match or substring match for important keywords
          if (
            nameToken === hintToken ||
            (hintToken.length > 3 && nameToken.includes(hintToken)) ||
            (nameToken.length > 3 && hintToken.includes(nameToken))
          ) {
            matchedTokens++;
            break;
          }
        }
      }

      // Score is based on how many hint tokens matched, weighted by total tokens
      const score =
        hintTokens.length > 0 ? matchedTokens / hintTokens.length : 0;

      // Require at least 50% token match and at least 2 tokens matched
      if (score >= 0.5 && matchedTokens >= 2) {
        if (!bestMatch || score > bestMatch.score) {
          bestMatch = { id: pm.id, score };
        }
      }
    }

    return bestMatch?.id;
  }

  /**
   * Normalize card name for matching
   * Removes common noise words and symbols
   */
  private normalizeCardName(name: string): string {
    return name
      .toLowerCase()
      .replace(/[®™*©]/g, "") // Remove trademark symbols
      .replace(/\s+/g, " ") // Normalize whitespace
      .replace(/\bcard\b/gi, "") // Remove "card" as it's common
      .replace(/\bthe\b/gi, "") // Remove articles
      .trim();
  }

  /**
   * Normalize merchant name
   * - Remove common suffixes (Inc, Ltd, LLC, etc.)
   * - Clean up extra whitespace
   * - Title case
   */
  private normalizeMerchantName(name?: string): string | undefined {
    if (!name) return undefined;

    // Remove common business suffixes
    const suffixes = [
      /\s+(inc\.?|incorporated)$/i,
      /\s+(ltd\.?|limited)$/i,
      /\s+(llc\.?)$/i,
      /\s+(corp\.?|corporation)$/i,
      /\s+(co\.?)$/i,
      /\s+#\d+$/i, // Store numbers like "#123"
      /\s+-\s+\d+$/i, // Store numbers like "- 123"
    ];

    let normalized = name.trim();
    for (const suffix of suffixes) {
      normalized = normalized.replace(suffix, "");
    }

    // Clean up whitespace
    normalized = normalized.replace(/\s+/g, " ").trim();

    // Don't return empty strings
    return normalized || undefined;
  }

  /**
   * Validate amount
   * - Must be positive
   * - Must be reasonable (<$50,000 for a receipt)
   * - Round to 2 decimal places
   */
  private validateAmount(amount?: number): number | undefined {
    if (amount === undefined || amount === null) return undefined;
    if (amount <= 0) return undefined;
    if (amount > 50000) {
      console.warn("Amount seems unreasonably large:", amount);
      // Still return it, but it will be flagged for review
    }

    // Round to 2 decimal places
    return Math.round(amount * 100) / 100;
  }

  /**
   * Validate currency
   * - Must be in supported list
   * - Fall back to locale-detected default currency
   */
  private validateCurrency(currencyCode?: string): Currency {
    if (!currencyCode) {
      // Use locale-detected currency as default
      return CurrencyService.getDefaultCurrency();
    }

    const upper = currencyCode.toUpperCase() as Currency;
    if (SUPPORTED_CURRENCIES.includes(upper)) {
      return upper;
    }

    console.warn("Unsupported currency detected:", currencyCode);
    return CurrencyService.getDefaultCurrency();
  }

  /**
   * Validate date
   * - Must not be in the future
   * - Must not be older than 2 years
   */
  private validateDate(dateStr?: string): string | undefined {
    if (!dateStr) return undefined;

    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return undefined;

      const now = new Date();
      const twoYearsAgo = new Date();
      twoYearsAgo.setFullYear(now.getFullYear() - 2);

      // Reject future dates
      if (date > now) {
        console.warn("Receipt date is in the future:", dateStr);
        return undefined;
      }

      // Reject dates older than 2 years
      if (date < twoYearsAgo) {
        console.warn("Receipt date is too old:", dateStr);
        return undefined;
      }

      // Return ISO date string
      return date.toISOString().split("T")[0];
    } catch {
      return undefined;
    }
  }

  /**
   * Normalize time to HH:mm format
   */
  private normalizeTime(timeStr?: string): string | undefined {
    if (!timeStr) return undefined;

    // Already in HH:mm format
    if (/^\d{2}:\d{2}$/.test(timeStr)) {
      return timeStr;
    }

    // Try to extract HH:mm from various formats
    const match = timeStr.match(/(\d{1,2}):(\d{2})/);
    if (match) {
      const hours = match[1].padStart(2, "0");
      const minutes = match[2];

      // Validate hours and minutes
      const h = parseInt(hours, 10);
      const m = parseInt(minutes, 10);
      if (h >= 0 && h < 24 && m >= 0 && m < 60) {
        return `${hours}:${minutes}`;
      }
    }

    return undefined;
  }

  /**
   * Suggest category based on merchant name
   * This integrates with the existing CategorizationService
   */
  suggestCategory(merchantName?: string): string | undefined {
    if (!merchantName) return undefined;

    const name = merchantName.toLowerCase();

    // Simple heuristics - the full CategorizationService will handle this properly
    const categoryPatterns: Record<string, string[]> = {
      "Groceries & Household": [
        "grocery",
        "supermarket",
        "fairprice",
        "cold storage",
        "sheng siong",
        "giant",
        "costco",
        "walmart",
        "target",
        "trader joe",
        "whole foods",
      ],
      "Dining & Entertainment": [
        "restaurant",
        "cafe",
        "coffee",
        "starbucks",
        "mcdonald",
        "kfc",
        "subway",
        "pizza",
        "sushi",
        "bar",
        "bistro",
        "grill",
      ],
      Transportation: [
        "gas",
        "petrol",
        "shell",
        "esso",
        "caltex",
        "grab",
        "uber",
        "taxi",
        "parking",
        "transit",
        "mrt",
        "bus",
      ],
      "Healthcare & Wellness": [
        "pharmacy",
        "guardian",
        "watsons",
        "cvs",
        "walgreens",
        "clinic",
        "hospital",
        "medical",
        "dental",
        "doctor",
      ],
      Shopping: [
        "amazon",
        "lazada",
        "shopee",
        "uniqlo",
        "h&m",
        "zara",
        "ikea",
        "best buy",
        "apple store",
      ],
    };

    for (const [category, patterns] of Object.entries(categoryPatterns)) {
      for (const pattern of patterns) {
        if (name.includes(pattern)) {
          return category;
        }
      }
    }

    return undefined;
  }
}

// Export singleton with default currency
export const receiptParser = new ReceiptParser();
