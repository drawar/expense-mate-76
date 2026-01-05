// Direct imports to avoid browser dependencies
import { ReceiptTextParser } from "../core/ocr/ReceiptTextParser";

// Inline type definitions to avoid browser dependency issues
interface PaymentMethod {
  id: string;
  name: string;
  type: string;
  issuer: string;
  currency: string;
  active: boolean;
}

interface OcrExtractedData {
  merchantName?: string;
  totalAmount?: number;
  transactionDate?: string;
  transactionTime?: string;
  paymentMethodHint?: string;
  currencyCode?: string;
  taxAmount?: number;
  confidence: number;
  rawResponse: unknown;
}

// Create parser instance
const receiptTextParser = new ReceiptTextParser();

// Sample Apple Wallet screenshot OCR text
const appleWalletText = `11:23
Gmail
<
$123.02
Chexy Utility
2026-01-05, 11:22 AM
Status: Approved
American Express® Aeroplan®*
Reserve Card
Total
$123.02
View in American Express App
Contact American Express
For help with a charge you don't recognize or to
dispute a charge, contact American Express.
Report Incorrect Merchant Info
Wallet uses Maps to provide merchant name, category,
and location for your transactions. Help improve
accuracy by reporting incorrect information.`;

// Simulate user's payment methods
const mockPaymentMethods: PaymentMethod[] = [
  {
    id: "pm-1",
    name: "American Express Aeroplan Reserve Card",
    type: "credit_card",
    issuer: "American Express",
    currency: "CAD",
    active: true,
  },
  {
    id: "pm-2",
    name: "Visa Infinite Privilege",
    type: "credit_card",
    issuer: "TD",
    currency: "CAD",
    active: true,
  },
  {
    id: "pm-3",
    name: "Mastercard World Elite",
    type: "credit_card",
    issuer: "CIBC",
    currency: "CAD",
    active: true,
  },
];

// Convert text to PaddleOcrTextLine format
const lines = appleWalletText.split("\n").map((text, i) => ({
  text,
  score: 0.95,
  frame: { top: i * 20, left: 0, width: 200, height: 20 },
}));

console.log("=== Apple Wallet Parser Test ===\n");

// Test receipt text parser
const extractedData = receiptTextParser.parseReceiptText(lines);

console.log("--- Extracted Data ---");
console.log("Merchant Name:", extractedData.merchantName);
console.log("Total Amount:", extractedData.totalAmount);
console.log("Date:", extractedData.transactionDate);
console.log("Time:", extractedData.transactionTime);
console.log("Payment Method Hint:", extractedData.paymentMethodHint);
console.log("Confidence:", extractedData.confidence);
console.log(
  "Is Apple Wallet:",
  (extractedData.rawResponse as { isAppleWallet?: boolean })?.isAppleWallet
);
console.log();

// Simple payment method matching function (same logic as ReceiptParser)
function matchPaymentMethod(
  cardNameHint: string,
  paymentMethods: PaymentMethod[]
): string | undefined {
  if (!cardNameHint || paymentMethods.length === 0) return undefined;

  const normalizeCardName = (name: string): string => {
    return name
      .toLowerCase()
      .replace(/[®™*©]/g, "")
      .replace(/\s+/g, " ")
      .replace(/\bcard\b/gi, "")
      .replace(/\bthe\b/gi, "")
      .trim();
  };

  const normalizedHint = normalizeCardName(cardNameHint);
  const hintTokens = normalizedHint.split(" ").filter((t) => t.length > 1);

  let bestMatch: { id: string; score: number } | null = null;

  for (const pm of paymentMethods) {
    if (!pm.active) continue;

    const normalizedName = normalizeCardName(pm.name);
    const nameTokens = normalizedName.split(" ").filter((t) => t.length > 1);

    let matchedTokens = 0;
    for (const hintToken of hintTokens) {
      for (const nameToken of nameTokens) {
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

    const score = hintTokens.length > 0 ? matchedTokens / hintTokens.length : 0;

    if (score >= 0.5 && matchedTokens >= 2) {
      if (!bestMatch || score > bestMatch.score) {
        bestMatch = { id: pm.id, score };
      }
    }
  }

  return bestMatch?.id;
}

// Test payment method matching
const isAppleWallet =
  (extractedData.rawResponse as { isAppleWallet?: boolean })?.isAppleWallet ??
  false;
const paymentMethodId = extractedData.paymentMethodHint
  ? matchPaymentMethod(extractedData.paymentMethodHint, mockPaymentMethods)
  : undefined;

console.log("--- Prefill Data ---");
console.log("Merchant Name:", extractedData.merchantName);
console.log("Amount:", extractedData.totalAmount);
console.log("Date:", extractedData.transactionDate);
console.log("Time:", extractedData.transactionTime);
console.log("Payment Method ID:", paymentMethodId);
console.log("Payment Method Hint:", extractedData.paymentMethodHint);
console.log("Is Apple Wallet:", isAppleWallet);
console.log("Confidence:", extractedData.confidence);
console.log();

// Verify matched payment method
const matchedMethod = mockPaymentMethods.find(
  (pm) => pm.id === paymentMethodId
);
console.log("--- Matched Payment Method ---");
if (matchedMethod) {
  console.log("Name:", matchedMethod.name);
  console.log("Issuer:", matchedMethod.issuer);
  console.log("ID:", matchedMethod.id);
} else {
  console.log("No payment method matched");
}
console.log();

// Test cases summary
console.log("=== Test Results ===");
const tests = [
  { name: "Detected as Apple Wallet", pass: isAppleWallet === true },
  { name: "Amount extracted", pass: extractedData.totalAmount === 123.02 },
  {
    name: "Merchant extracted",
    pass: extractedData.merchantName === "Chexy Utility",
  },
  {
    name: "Date extracted",
    pass: extractedData.transactionDate === "2026-01-05",
  },
  { name: "Time extracted", pass: extractedData.transactionTime === "11:22" },
  { name: "Payment method matched", pass: paymentMethodId === "pm-1" },
];

tests.forEach((test) => {
  console.log(`${test.pass ? "✓" : "✗"} ${test.name}`);
});

const allPassed = tests.every((t) => t.pass);
console.log(`\n${allPassed ? "All tests passed!" : "Some tests failed"}`);
