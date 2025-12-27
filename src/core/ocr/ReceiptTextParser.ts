import { PaddleOcrTextLine, OcrExtractedData } from "./types";

/**
 * ReceiptTextParser - Extracts structured receipt data from raw OCR text
 *
 * Since PaddleOCR returns raw text lines, we need to parse them to extract:
 * - Merchant name (usually at top)
 * - Total amount (look for "Total", "Grand Total", etc.)
 * - Date and time
 * - Currency
 */
export class ReceiptTextParser {
  // Patterns for total amount extraction
  private totalPatterns = [
    /(?:grand\s*)?total\s*[:\s]*\$?\s*([\d,]+\.?\d*)/i,
    /amount\s*(?:due|paid|owing)?\s*[:\s]*\$?\s*([\d,]+\.?\d*)/i,
    /(?:sub)?total\s*[:\s]*\$?\s*([\d,]+\.?\d*)/i,
    /balance\s*(?:due)?\s*[:\s]*\$?\s*([\d,]+\.?\d*)/i,
    /(?:net|gross)\s*amount\s*[:\s]*\$?\s*([\d,]+\.?\d*)/i,
    /to\s*pay\s*[:\s]*\$?\s*([\d,]+\.?\d*)/i,
    // Currency-prefixed amounts
    /(?:sgd|usd|cad|aud|eur|gbp)\s*([\d,]+\.?\d*)/i,
    // Standalone large amounts (likely totals) - last resort
    /^\s*\$?\s*([\d]{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*$/,
  ];

  // Patterns for tax extraction
  private taxPatterns = [
    /(?:gst|tax|vat|hst)\s*[:\s]*\$?\s*([\d,]+\.?\d*)/i,
    /(?:gst|tax|vat|hst)\s*(?:\d+%?)?\s*[:\s]*\$?\s*([\d,]+\.?\d*)/i,
  ];

  // Patterns for date extraction
  private datePatterns = [
    // Labeled date/time (e.g., "DATE/TIME: 11/25/2025 18:26:17" or "DATE/TIMEL 11/25/2025")
    /date[/:]?\s*time[:\s]*(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})/i,
    // DD/MM/YYYY or MM/DD/YYYY
    /(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})/,
    // YYYY/MM/DD or YYYY-MM-DD
    /(\d{4})[-/](\d{1,2})[-/](\d{1,2})/,
    // Month DD, YYYY
    /(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+(\d{1,2}),?\s+(\d{4})/i,
    // DD Month YYYY
    /(\d{1,2})\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+(\d{4})/i,
  ];

  // Patterns for time extraction
  private timePatterns = [
    /(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(am|pm)?/i,
    /(\d{1,2})\.(\d{2})\s*(am|pm)?/i,
  ];

  // Currency detection patterns
  private currencyPatterns: Array<{ pattern: RegExp; currency: string }> = [
    { pattern: /\bsgd\b|\bsg\$|\$\s*s/i, currency: "SGD" },
    { pattern: /\busd\b|\bus\$|\$\s*(?!\s*s)/i, currency: "USD" },
    { pattern: /\bcad\b|\bc\$/i, currency: "CAD" },
    { pattern: /\baud\b|\ba\$/i, currency: "AUD" },
    { pattern: /\beur\b|€/i, currency: "EUR" },
    { pattern: /\bgbp\b|£/i, currency: "GBP" },
    { pattern: /\bjpy\b|¥/i, currency: "JPY" },
    { pattern: /\bvnd\b|₫/i, currency: "VND" },
    { pattern: /\bmyr\b|\brm\b/i, currency: "MYR" },
    { pattern: /\bthb\b|฿/i, currency: "THB" },
    { pattern: /\bidr\b|\brp\b/i, currency: "IDR" },
  ];

  // Words to exclude from merchant names
  private merchantExcludePatterns = [
    /^receipt$/i,
    /^invoice$/i,
    /^tax$/i,
    /^gst$/i,
    /^total$/i,
    /^subtotal$/i,
    /^change$/i,
    /^cash$/i,
    /^card$/i,
    /^visa$/i,
    /^mastercard$/i,
    /^amex$/i,
    /^\d+$/,
    /^tel:?$/i,
    /^phone:?$/i,
    /^fax:?$/i,
    /^date:?$/i,
    /^time:?$/i,
    /^www\./i,
    /^http/i,
    /^thank/i,
  ];

  /**
   * Parse raw OCR text lines into structured receipt data
   */
  parseReceiptText(lines: PaddleOcrTextLine[]): OcrExtractedData {
    if (lines.length === 0) {
      return {
        confidence: 0,
        rawResponse: { lines: [] },
      };
    }

    // Sort lines by vertical position (top to bottom)
    const sortedLines = [...lines].sort((a, b) => a.frame.top - b.frame.top);

    // Extract all text for pattern matching
    const allText = sortedLines.map((l) => l.text).join("\n");

    // Extract fields
    const merchantName = this.extractMerchantName(sortedLines);
    const totalAmount = this.extractTotalAmount(sortedLines, allText);
    const taxAmount = this.extractTaxAmount(allText);
    const { date: transactionDate, time: transactionTime } =
      this.extractDateTime(allText);
    const currencyCode = this.extractCurrency(allText);

    // Calculate confidence based on what we found
    const confidence = this.calculateConfidence({
      merchantName,
      totalAmount,
      transactionDate,
      currencyCode,
    });

    return {
      merchantName,
      totalAmount,
      taxAmount,
      transactionDate,
      transactionTime,
      currencyCode,
      confidence,
      rawResponse: { lines: sortedLines },
    };
  }

  /**
   * Extract merchant name (usually first few lines at top of receipt)
   */
  private extractMerchantName(
    sortedLines: PaddleOcrTextLine[]
  ): string | undefined {
    // Look at the first 5 lines for merchant name
    const topLines = sortedLines.slice(0, 5);

    for (const line of topLines) {
      const text = line.text.trim();

      // Skip short lines or numbers-only
      if (text.length < 3) continue;

      // Skip excluded patterns
      const isExcluded = this.merchantExcludePatterns.some((pattern) =>
        pattern.test(text)
      );
      if (isExcluded) continue;

      // Skip if mostly numbers (like phone numbers, addresses)
      const digitRatio =
        (text.match(/\d/g) || []).length / text.replace(/\s/g, "").length;
      if (digitRatio > 0.5) continue;

      // Found a good candidate
      return this.normalizeMerchantName(text);
    }

    return undefined;
  }

  /**
   * Extract total amount from receipt
   */
  private extractTotalAmount(
    lines: PaddleOcrTextLine[],
    allText: string
  ): number | undefined {
    // First, try structured patterns on full text
    for (const pattern of this.totalPatterns.slice(0, -1)) {
      const match = allText.match(pattern);
      if (match) {
        const amount = this.parseAmount(match[1]);
        if (amount && amount > 0 && amount < 100000) {
          return amount;
        }
      }
    }

    // Look for lines containing "total" and extract nearby amounts
    for (const line of lines) {
      const text = line.text.toLowerCase();
      if (
        text.includes("total") ||
        text.includes("amount") ||
        text.includes("pay")
      ) {
        // Try to extract amount from this line
        const amountMatch = line.text.match(/([\d,]+\.?\d*)/);
        if (amountMatch) {
          const amount = this.parseAmount(amountMatch[1]);
          if (amount && amount > 0 && amount < 100000) {
            return amount;
          }
        }
      }
    }

    // Last resort: find the largest amount in bottom half of receipt
    const bottomHalf = lines.slice(Math.floor(lines.length / 2));
    let maxAmount = 0;

    for (const line of bottomHalf) {
      const amounts = line.text.match(/[\d,]+\.\d{2}/g) || [];
      for (const amountStr of amounts) {
        const amount = this.parseAmount(amountStr);
        if (amount && amount > maxAmount && amount < 100000) {
          maxAmount = amount;
        }
      }
    }

    return maxAmount > 0 ? maxAmount : undefined;
  }

  /**
   * Extract tax amount
   */
  private extractTaxAmount(allText: string): number | undefined {
    for (const pattern of this.taxPatterns) {
      const match = allText.match(pattern);
      if (match) {
        const amount = this.parseAmount(match[1]);
        if (amount && amount > 0 && amount < 10000) {
          return amount;
        }
      }
    }
    return undefined;
  }

  /**
   * Extract date and time
   */
  private extractDateTime(allText: string): { date?: string; time?: string } {
    let date: string | undefined;
    let time: string | undefined;

    // Extract date
    for (const pattern of this.datePatterns) {
      const match = allText.match(pattern);
      if (match) {
        date = this.normalizeDate(match);
        if (date) break;
      }
    }

    // Extract time
    for (const pattern of this.timePatterns) {
      const match = allText.match(pattern);
      if (match) {
        time = this.normalizeTime(match);
        if (time) break;
      }
    }

    return { date, time };
  }

  /**
   * Extract currency from text
   */
  private extractCurrency(allText: string): string | undefined {
    for (const { pattern, currency } of this.currencyPatterns) {
      if (pattern.test(allText)) {
        return currency;
      }
    }
    return undefined;
  }

  /**
   * Parse amount string to number
   */
  private parseAmount(amountStr: string): number | undefined {
    if (!amountStr) return undefined;

    // Remove commas and parse
    const cleaned = amountStr.replace(/,/g, "");
    const amount = parseFloat(cleaned);

    if (isNaN(amount)) return undefined;
    return Math.round(amount * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Normalize date to ISO format
   */
  private normalizeDate(match: RegExpMatchArray): string | undefined {
    try {
      const monthNames: Record<string, number> = {
        jan: 0,
        feb: 1,
        mar: 2,
        apr: 3,
        may: 4,
        jun: 5,
        jul: 6,
        aug: 7,
        sep: 8,
        oct: 9,
        nov: 10,
        dec: 11,
      };

      let year: number, month: number, day: number;

      if (match[0].match(/^\d{4}/)) {
        // YYYY-MM-DD format
        year = parseInt(match[1]);
        month = parseInt(match[2]) - 1;
        day = parseInt(match[3]);
      } else if (match[1].match(/[a-z]/i)) {
        // Month DD, YYYY format
        month = monthNames[match[1].toLowerCase().slice(0, 3)];
        day = parseInt(match[2]);
        year = parseInt(match[3]);
      } else if (match[2].match(/[a-z]/i)) {
        // DD Month YYYY format
        day = parseInt(match[1]);
        month = monthNames[match[2].toLowerCase().slice(0, 3)];
        year = parseInt(match[3]);
      } else {
        // Numeric format: could be DD/MM/YYYY or MM/DD/YYYY
        const first = parseInt(match[1]);
        const second = parseInt(match[2]);
        year = parseInt(match[3]);

        // Handle 2-digit years
        if (year < 100) {
          year += year < 50 ? 2000 : 1900;
        }

        // Smart detection: if first > 12, it must be day (DD/MM/YYYY)
        // If second > 12, it must be day (MM/DD/YYYY)
        // Otherwise, prefer MM/DD/YYYY for US receipts (more common in apps)
        if (first > 12 && second <= 12) {
          // DD/MM/YYYY format (first is day)
          day = first;
          month = second - 1;
        } else if (second > 12 && first <= 12) {
          // MM/DD/YYYY format (second is day)
          month = first - 1;
          day = second;
        } else {
          // Ambiguous - default to MM/DD/YYYY (US format, common for receipts)
          month = first - 1;
          day = second;
        }
      }

      const date = new Date(year, month, day);
      if (isNaN(date.getTime())) return undefined;

      // Validate the date components match what we set (catches invalid dates like Feb 30)
      if (date.getMonth() !== month || date.getDate() !== day) {
        return undefined;
      }

      // Validate date is reasonable (within last 2 years and not in future)
      const now = new Date();
      const twoYearsAgo = new Date();
      twoYearsAgo.setFullYear(now.getFullYear() - 2);

      if (date > now || date < twoYearsAgo) return undefined;

      // Format as YYYY-MM-DD without timezone conversion
      // Don't use toISOString() as it converts to UTC and can shift the date
      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, "0");
      const dd = String(date.getDate()).padStart(2, "0");
      return `${yyyy}-${mm}-${dd}`;
    } catch {
      return undefined;
    }
  }

  /**
   * Normalize time to HH:mm format
   */
  private normalizeTime(match: RegExpMatchArray): string | undefined {
    try {
      let hours = parseInt(match[1]);
      const minutes = parseInt(match[2]);
      const ampm = match[match.length - 1]?.toLowerCase();

      // Handle AM/PM
      if (ampm === "pm" && hours < 12) hours += 12;
      if (ampm === "am" && hours === 12) hours = 0;

      if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
        return undefined;
      }

      return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
    } catch {
      return undefined;
    }
  }

  /**
   * Normalize merchant name
   */
  private normalizeMerchantName(name: string): string {
    // Remove common suffixes
    let normalized = name
      .replace(/\s+(inc\.?|incorporated)$/i, "")
      .replace(/\s+(ltd\.?|limited)$/i, "")
      .replace(/\s+(llc\.?)$/i, "")
      .replace(/\s+(pte\.?)$/i, "")
      .replace(/\s+(corp\.?|corporation)$/i, "")
      .replace(/\s+#\d+$/i, "")
      .trim();

    // Clean up whitespace
    normalized = normalized.replace(/\s+/g, " ");

    return normalized || name;
  }

  /**
   * Calculate confidence score based on extracted fields
   */
  private calculateConfidence(data: {
    merchantName?: string;
    totalAmount?: number;
    transactionDate?: string;
    currencyCode?: string;
  }): number {
    let score = 0;
    let weights = 0;

    // Total amount is most important (40%)
    if (data.totalAmount !== undefined && data.totalAmount > 0) {
      score += 0.4;
    }
    weights += 0.4;

    // Merchant name (30%)
    if (data.merchantName && data.merchantName.length > 2) {
      score += 0.3;
    }
    weights += 0.3;

    // Date (20%)
    if (data.transactionDate) {
      score += 0.2;
    }
    weights += 0.2;

    // Currency (10%)
    if (data.currencyCode) {
      score += 0.1;
    }
    weights += 0.1;

    return Math.round((score / weights) * 100) / 100;
  }
}

// Export singleton instance
export const receiptTextParser = new ReceiptTextParser();
