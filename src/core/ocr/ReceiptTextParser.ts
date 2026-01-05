import { PaddleOcrTextLine, OcrExtractedData } from "./types";
import {
  AIRLINE_MERCHANT_MCC_MAP,
  HOTEL_MERCHANT_MCC_MAP,
  TRAVEL_AGENCY_MERCHANT_MAP,
  GROCERY_MERCHANT_MCC_MAP,
} from "@/utils/constants/merchantMccMapping";

// Build a combined list of all known merchant patterns (sorted by length, longest first)
const ALL_MERCHANT_PATTERNS = [
  ...Object.keys(AIRLINE_MERCHANT_MCC_MAP),
  ...Object.keys(HOTEL_MERCHANT_MCC_MAP),
  ...Object.keys(TRAVEL_AGENCY_MERCHANT_MAP),
  ...Object.keys(GROCERY_MERCHANT_MCC_MAP),
].sort((a, b) => b.length - a.length);

/**
 * ReceiptTextParser - Extracts structured receipt data from raw OCR text
 *
 * Since PaddleOCR returns raw text lines, we need to parse them to extract:
 * - Merchant name (usually at top)
 * - Total amount (look for "Total", "Grand Total", etc.)
 * - Date and time
 * - Currency
 *
 * Also handles Apple Wallet transaction screenshots which have a different format:
 * - Card name displayed (can be matched to user's payment methods)
 * - Amount, merchant, date/time, status clearly laid out
 */
export class ReceiptTextParser {
  // Patterns to detect Apple Wallet screenshots
  private appleWalletIndicators = [
    /view\s+in\s+.+\s*app/i, // "View in American Express App"
    /contact\s+(american\s+express|visa|mastercard|discover)/i,
    /report\s+incorrect\s+merchant\s+info/i,
    /wallet\s+uses\s+maps/i,
    /status:\s*(approved|declined|pending)/i,
  ];

  // Common card issuer patterns for extracting card names
  private cardNamePatterns = [
    // American Express cards
    /american\s*express[®™]*\s*(.+?card)/i,
    // Visa cards
    /visa[®™]*\s*(.+?card)/i,
    // Mastercard
    /mastercard[®™]*\s*(.+?card)/i,
    // Generic card pattern with trademark symbols
    /([a-z\s]+[®™]+[a-z\s*®™]*card)/i,
  ];
  // Patterns for total amount extraction (ordered by priority - final charged amount first)
  private totalPatterns = [
    // Credit card / payment amount (final amount with tip)
    /(?:credit\s+card|debit\s+card)\s*(?:sale|payment|charge)?\s*[:\s]*\$?\s*([\d,]+\.?\d*)/i,
    /\bcard\s+(?:sale|payment|charge)\s*[:\s]*\$?\s*([\d,]+\.?\d*)/i,
    /(?:charged?|paid|payment)\s+(?:amount)?\s*[:\s]*\$?\s*([\d,]+\.?\d*)/i,
    // Grand total (usually final)
    /grand\s*total\s*[:\s]*\$?\s*([\d,]+\.?\d*)/i,
    // Regular total
    /\btotal\s*[:\s]*\$?\s*([\d,]+\.?\d*)/i,
    /amount\s*(?:due|paid|owing)?\s*[:\s]*\$?\s*([\d,]+\.?\d*)/i,
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

    // Check if this is an Apple Wallet screenshot
    const isAppleWallet = this.isAppleWalletScreenshot(allText);

    if (isAppleWallet) {
      return this.parseAppleWalletScreenshot(sortedLines, allText);
    }

    // Standard receipt parsing
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
   * Check if the OCR text is from an Apple Wallet transaction screenshot
   */
  private isAppleWalletScreenshot(allText: string): boolean {
    // Need at least 2 indicators to confirm it's Apple Wallet
    let matchCount = 0;
    for (const pattern of this.appleWalletIndicators) {
      if (pattern.test(allText)) {
        matchCount++;
        if (matchCount >= 2) return true;
      }
    }
    return false;
  }

  /**
   * Parse Apple Wallet transaction screenshot
   * Format is typically:
   * - Amount (large, at top)
   * - Merchant name
   * - Date and time (e.g., "2026-01-05, 11:22 AM")
   * - Status: Approved/Declined
   * - Card name with trademark symbols
   * - Total amount
   * - "View in [Issuer] App"
   */
  private parseAppleWalletScreenshot(
    sortedLines: PaddleOcrTextLine[],
    allText: string
  ): OcrExtractedData {
    // Extract amount - typically appears as "$123.02" format
    const totalAmount = this.extractAppleWalletAmount(sortedLines);

    // Extract merchant name - appears after amount, before date
    const merchantName = this.extractAppleWalletMerchant(sortedLines);

    // Extract date and time - format like "2026-01-05, 11:22 AM"
    const { date: transactionDate, time: transactionTime } =
      this.extractAppleWalletDateTime(allText);

    // Extract card/payment method name
    const paymentMethodHint = this.extractAppleWalletCardName(allText);

    // Higher confidence for Apple Wallet screenshots since format is consistent
    const confidence = this.calculateConfidence({
      merchantName,
      totalAmount,
      transactionDate,
      isAppleWallet: true,
    });

    return {
      merchantName,
      totalAmount,
      transactionDate,
      transactionTime,
      paymentMethodHint,
      currencyCode: undefined,
      confidence,
      rawResponse: { lines: sortedLines, isAppleWallet: true },
    };
  }

  /**
   * Extract amount from Apple Wallet screenshot
   */
  private extractAppleWalletAmount(
    lines: PaddleOcrTextLine[]
  ): number | undefined {
    // Amount typically appears early, as "$123.02" format
    for (const line of lines.slice(0, 5)) {
      const match = line.text.match(/^\$?([\d,]+\.\d{2})$/);
      if (match) {
        return this.parseAmount(match[1]);
      }
    }
    // Fallback to regular extraction
    return undefined;
  }

  /**
   * Extract merchant name from Apple Wallet screenshot
   * Merchant appears after the amount, before the date line
   */
  private extractAppleWalletMerchant(
    lines: PaddleOcrTextLine[]
  ): string | undefined {
    // Find the amount line index
    let amountLineIndex = -1;
    for (let i = 0; i < lines.length && i < 5; i++) {
      if (/^\$?[\d,]+\.\d{2}$/.test(lines[i].text)) {
        amountLineIndex = i;
        break;
      }
    }

    // Merchant should be the line right after the amount
    if (amountLineIndex >= 0 && amountLineIndex + 1 < lines.length) {
      const merchantLine = lines[amountLineIndex + 1].text.trim();
      // Skip if it looks like a date or status
      if (
        !/^\d{4}-\d{2}-\d{2}/.test(merchantLine) &&
        !/^status:/i.test(merchantLine)
      ) {
        return this.normalizeMerchantName(merchantLine);
      }
    }

    return undefined;
  }

  /**
   * Extract date and time from Apple Wallet format
   * Format: "2026-01-05, 11:22 AM"
   */
  private extractAppleWalletDateTime(allText: string): {
    date?: string;
    time?: string;
  } {
    // Look for Apple Wallet specific format: "YYYY-MM-DD, HH:MM AM/PM"
    const walletDateTimePattern =
      /(\d{4}-\d{2}-\d{2}),?\s*(\d{1,2}:\d{2})\s*(am|pm)?/i;
    const match = allText.match(walletDateTimePattern);

    if (match) {
      const date = match[1]; // Already in YYYY-MM-DD format
      let hours = parseInt(match[2].split(":")[0]);
      const minutes = match[2].split(":")[1];
      const ampm = match[3]?.toLowerCase();

      // Convert to 24-hour format
      if (ampm === "pm" && hours < 12) hours += 12;
      if (ampm === "am" && hours === 12) hours = 0;

      const time = `${hours.toString().padStart(2, "0")}:${minutes}`;

      return { date, time };
    }

    // Fallback to regular date/time extraction
    return this.extractDateTime(allText);
  }

  /**
   * Extract card name from Apple Wallet screenshot
   * Look for card names with trademark symbols or known card patterns
   */
  private extractAppleWalletCardName(allText: string): string | undefined {
    // Clean up common OCR artifacts
    const cleanedText = allText
      .replace(/[Ⓡ]/g, "®")
      .replace(/[*]/g, " ")
      .replace(/\s+/g, " ");

    // Try each card name pattern
    for (const pattern of this.cardNamePatterns) {
      const match = cleanedText.match(pattern);
      if (match) {
        // Clean up the extracted card name
        const cardName = match[0]
          .replace(/[®™*]/g, "") // Remove trademark symbols
          .replace(/\s+/g, " ") // Normalize whitespace
          .trim();

        return cardName;
      }
    }

    // Fallback: Look for lines containing "Card" with issuer keywords
    const lines = allText.split("\n");
    for (const line of lines) {
      const lowercaseLine = line.toLowerCase();
      if (
        lowercaseLine.includes("card") &&
        (lowercaseLine.includes("american express") ||
          lowercaseLine.includes("amex") ||
          lowercaseLine.includes("visa") ||
          lowercaseLine.includes("mastercard") ||
          lowercaseLine.includes("discover") ||
          lowercaseLine.includes("aeroplan") ||
          lowercaseLine.includes("platinum") ||
          lowercaseLine.includes("gold") ||
          lowercaseLine.includes("reserve"))
      ) {
        return line
          .replace(/[®™Ⓡ*]/g, "")
          .replace(/\s+/g, " ")
          .trim();
      }
    }

    return undefined;
  }

  /**
   * Extract merchant name (usually first few lines at top of receipt)
   * First tries to match against known merchant database, then falls back to heuristics
   */
  private extractMerchantName(
    sortedLines: PaddleOcrTextLine[]
  ): string | undefined {
    // First pass: Try to match against known merchant database
    // This handles cases where header text appears before merchant name
    const knownMerchantMatch = this.findKnownMerchant(sortedLines);
    if (knownMerchantMatch) {
      return this.normalizeMerchantName(knownMerchantMatch);
    }

    // Fallback to original heuristic-based extraction
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

    // First pass: look for a line that already looks like a complete merchant name
    for (const line of cleanLines) {
      if (this.looksLikeMerchantName(line.text)) {
        return this.normalizeMerchantName(line.text);
      }
    }

    // Second pass: try to combine adjacent lines that might form a merchant name
    for (let i = 0; i < cleanLines.length - 1; i++) {
      const current = cleanLines[i];
      const next = cleanLines[i + 1];

      const combined = this.tryCombineMerchantLines(current.text, next.text);
      if (combined) {
        return this.normalizeMerchantName(combined);
      }
    }

    // Fallback: use first clean line
    if (cleanLines.length > 0) {
      return this.normalizeMerchantName(cleanLines[0].text);
    }

    return undefined;
  }

  /**
   * Search through all OCR lines to find a known merchant name from the database.
   * This helps when receipts have header text (store number, date, address) before the merchant name.
   * Returns the matched text from the line containing the known merchant.
   */
  private findKnownMerchant(lines: PaddleOcrTextLine[]): string | undefined {
    // Search through all lines (not just top 8) for known merchant patterns
    for (const line of lines) {
      const text = line.text.trim().toLowerCase();
      if (text.length < 3) continue;

      // Check against all known merchant patterns (airlines, hotels, travel agencies)
      for (const pattern of ALL_MERCHANT_PATTERNS) {
        if (text.includes(pattern)) {
          // Found a known merchant - return the original line text (preserving case)
          // This effectively "truncates" everything before this line
          return line.text.trim();
        }
      }
    }

    return undefined;
  }

  /**
   * Check if a line looks like a merchant/store name
   */
  private looksLikeMerchantName(text: string): boolean {
    // Contains common business words
    const businessWords =
      /\b(market|store|shop|cafe|restaurant|bistro|grill|bar|pub|hotel|inn|pharmacy|clinic|salon|spa|gym|fitness|bank|mall|plaza|center|centre|mart|smart|foods|grocer|grocery|kitchen|deli|bakery|butcher|supermarket|express|depot|warehouse)\b/i;
    if (businessWords.test(text)) return true;

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
      /\b(market|store|shop|cafe|restaurant|bistro|grill|bar|pub|hotel|inn|pharmacy|clinic|salon|spa|gym|fitness|bank|mall|plaza|center|centre|mart|smart|foods|grocer|grocery|kitchen|deli|bakery|butcher|supermarket|express|depot|warehouse)\b/i;

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
   * Convert string to Title Case, preserving brand names with internal capitals
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
      .split(" ")
      .map((word, index) => {
        // Preserve words with internal capitals (e.g., "PriceSmart", "McDonald's")
        const hasInternalCaps = /[a-z][A-Z]/.test(word);
        if (hasInternalCaps) {
          return word;
        }

        // Preserve short all-caps words or words with special chars (e.g., "T&T", "H&M", "AT&T")
        // These are likely acronyms or brand names
        if (word.length <= 5 && /^[A-Z&]+$/.test(word)) {
          return word;
        }

        // Convert to title case
        const lowerWord = word.toLowerCase();
        if (index === 0 || !lowercaseWords.has(lowerWord)) {
          return lowerWord.charAt(0).toUpperCase() + lowerWord.slice(1);
        }
        return lowerWord;
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
    isAppleWallet?: boolean;
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

    let confidence = Math.round((score / weights) * 100) / 100;

    // Boost confidence for Apple Wallet screenshots since the format is more consistent
    if (data.isAppleWallet && confidence > 0) {
      confidence = Math.min(1, confidence + 0.1);
    }

    return confidence;
  }
}

// Export singleton instance
export const receiptTextParser = new ReceiptTextParser();
