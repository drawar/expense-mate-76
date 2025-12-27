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
    // Month DD, YYYY (e.g., "Dec 23, 2025" or "Dec-23-2025" or "Dec.-23-2025")
    /(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?[-\s]+(\d{1,2}),?[-\s]+(\d{4})/i,
    // DD Month YYYY (e.g., "23 Dec 2025" or "23-Dec-2025" or "23-Dec.-2025")
    /(\d{1,2})[-\s]+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?[-\s]+(\d{4})/i,
  ];

  // Patterns for time extraction
  private timePatterns = [
    // Standard time (e.g., "7:20:12 PM" or "7:20:12p.m." or "19:20")
    /(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(a\.?m\.?|p\.?m\.?)?/i,
    // Dot separator (e.g., "7.20 PM")
    /(\d{1,2})\.(\d{2})\s*(a\.?m\.?|p\.?m\.?)?/i,
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
    // Receipt paper/printer noise
    /ecopaper/i,
    /bpa\s*free/i,
    /thermal/i,
    /\bfree\b/i,
    // Random characters/symbols
    /^[^\w\s]+$/,
    /^[\W\d]+$/,
    // Contains non-ASCII letters (likely OCR noise like "dooǝ")
    /[^\x20-\x7E]/,
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

    // Calculate confidence based on what we found
    const confidence = this.calculateConfidence({
      merchantName,
      totalAmount,
      transactionDate,
    });

    return {
      merchantName,
      totalAmount,
      taxAmount,
      transactionDate,
      transactionTime,
      // Currency is not detected from receipt - use locale default instead
      currencyCode: undefined,
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
    // Look at the first 8 lines for merchant name
    const topLines = sortedLines.slice(0, 8);

    // Filter out noise lines first
    const cleanLines: { text: string; index: number }[] = [];
    for (let i = 0; i < topLines.length; i++) {
      const text = topLines[i].text.trim();

      // Skip short lines
      if (text.length < 2) continue;

      // Skip excluded patterns
      const isExcluded = this.merchantExcludePatterns.some((pattern) =>
        pattern.test(text)
      );
      if (isExcluded) continue;

      // Skip if mostly numbers (like phone numbers, addresses)
      const alphaCount = (text.match(/[a-zA-Z]/g) || []).length;
      const digitCount = (text.match(/\d/g) || []).length;
      if (digitCount > alphaCount) continue;

      // Skip lines that look like addresses (contain street indicators)
      if (
        /^\s*#?\d+\s*[-–]\s*\d+|^\d+\s+\w+\s+(st|street|ave|avenue|rd|road|dr|drive|blvd|boulevard)/i.test(
          text
        )
      )
        continue;

      cleanLines.push({ text, index: i });
    }

    if (cleanLines.length === 0) return undefined;

    // Try to find and combine lines that form a merchant name
    // Look for lines that might be a split name (e.g., "CITY AVENUE" + "* MARKET")
    for (let i = 0; i < cleanLines.length; i++) {
      const current = cleanLines[i];
      const next = cleanLines[i + 1];

      // Try to combine with next line if it looks like a continuation
      if (next) {
        const combined = this.tryCombineMerchantLines(current.text, next.text);
        if (combined) {
          return this.normalizeMerchantName(combined);
        }
      }

      // If current line looks like a complete merchant name (has business word), use it
      if (this.looksLikeMerchantName(current.text)) {
        return this.normalizeMerchantName(current.text);
      }
    }

    // Fallback: use first clean line
    if (cleanLines.length > 0) {
      return this.normalizeMerchantName(cleanLines[0].text);
    }

    return undefined;
  }

  /**
   * Check if a line looks like a merchant/store name
   */
  private looksLikeMerchantName(text: string): boolean {
    // Contains common business words
    const businessWords =
      /\b(market|store|shop|cafe|restaurant|bistro|grill|bar|pub|hotel|inn|pharmacy|clinic|salon|spa|gym|fitness|bank|mall|plaza|center|centre)\b/i;
    if (businessWords.test(text)) return true;

    // Is mostly uppercase (common for store names)
    const upperCount = (text.match(/[A-Z]/g) || []).length;
    const lowerCount = (text.match(/[a-z]/g) || []).length;
    if (upperCount > lowerCount * 2 && text.length > 4) return true;

    return false;
  }

  /**
   * Try to combine two lines that might form a split merchant name
   */
  private tryCombineMerchantLines(line1: string, line2: string): string | null {
    // Clean up the lines
    const clean1 = line1.trim();
    const clean2 = line2.trim().replace(/^[*&\-–]\s*/, ""); // Remove leading *, &, -

    // Check if combining makes sense
    // Line 2 should look like a continuation (contains business word, or is short)
    const businessWords =
      /\b(market|store|shop|cafe|restaurant|bistro|grill|bar|pub|hotel|inn|pharmacy|clinic|salon|spa|gym|fitness|bank|mall|plaza|center|centre|supermarket|grocery)\b/i;

    if (businessWords.test(clean2) || clean2.length < 15) {
      const combined = `${clean1} ${clean2}`;
      // Only combine if result looks reasonable
      if (combined.length < 50 && this.looksLikeMerchantName(combined)) {
        return combined;
      }
    }

    return null;
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
      const ampmRaw = match[match.length - 1]?.toLowerCase() || "";
      // Normalize "p.m." -> "pm", "a.m." -> "am"
      const ampm = ampmRaw.replace(/\./g, "");

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

    // Convert to Title Case (init cap)
    normalized = this.toTitleCase(normalized);

    return normalized || name;
  }

  /**
   * Convert string to Title Case
   */
  private toTitleCase(str: string): string {
    // Words that should stay lowercase (unless first word)
    const lowercaseWords = new Set([
      "a",
      "an",
      "the",
      "and",
      "but",
      "or",
      "for",
      "nor",
      "on",
      "at",
      "to",
      "by",
      "of",
      "in",
      "with",
    ]);

    return str
      .toLowerCase()
      .split(" ")
      .map((word, index) => {
        if (index === 0 || !lowercaseWords.has(word)) {
          return word.charAt(0).toUpperCase() + word.slice(1);
        }
        return word;
      })
      .join(" ");
  }

  /**
   * Calculate confidence score based on extracted fields
   */
  private calculateConfidence(data: {
    merchantName?: string;
    totalAmount?: number;
    transactionDate?: string;
  }): number {
    let score = 0;
    let weights = 0;

    // Total amount is most important (50%)
    if (data.totalAmount !== undefined && data.totalAmount > 0) {
      score += 0.5;
    }
    weights += 0.5;

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

    return Math.round((score / weights) * 100) / 100;
  }
}

// Export singleton instance
export const receiptTextParser = new ReceiptTextParser();
