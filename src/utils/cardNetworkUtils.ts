export type CardNetwork =
  | "visa"
  | "mastercard"
  | "amex"
  | "discover"
  | "unknown";

/**
 * Determine card network from issuer and card name strings
 * Parses common card name patterns to identify the network
 */
export function getCardNetwork(issuer: string, cardName: string): CardNetwork {
  const combined = `${issuer} ${cardName}`.toLowerCase();

  if (combined.includes("visa")) return "visa";
  if (combined.includes("mastercard") || combined.includes("master card"))
    return "mastercard";
  if (combined.includes("amex") || combined.includes("american express"))
    return "amex";
  if (combined.includes("discover")) return "discover";

  return "unknown";
}

/**
 * Format full card display name as "Issuer CardName"
 * Avoids duplication if issuer is already in the card name
 */
export function formatCardDisplayName(issuer: string, name: string): string {
  if (!issuer) return name;

  const issuerLower = issuer.toLowerCase();
  const nameLower = name.toLowerCase();

  // Avoid duplication if issuer is already in the name
  if (nameLower.includes(issuerLower)) {
    return name;
  }

  return `${issuer} ${name}`;
}

// Rank + Network combinations to strip (order matters - longer patterns first)
// Ranks should only be stripped when paired with a network name
const RANK_NETWORK_PATTERNS = [
  // Mastercard ranks
  "world elite mastercard",
  "world elite master card",
  "world select mastercard",
  "world select master card",
  "world mastercard",
  "world master card",
  "platinum mastercard",
  "platinum master card",
  // Visa ranks
  "visa infinite privilege",
  "visa infinite",
  "visa signature",
  "visa platinum",
  // Standalone networks (no rank)
  "mastercard",
  "master card",
  "visa",
  "american express",
  "amex",
  "discover",
];

/**
 * Format card name for compact display by removing network and rank terms
 * Only removes rank terms when paired with a network (e.g., "World Elite MasterCard")
 * e.g., "Neo Financial Cathay World Elite MasterCard" → "Neo Financial Cathay"
 */
export function formatCardShortName(issuer: string, name: string): string {
  let result = formatCardDisplayName(issuer, name);

  // Remove rank+network combinations (case-insensitive, order matters - longer patterns first)
  for (const pattern of RANK_NETWORK_PATTERNS) {
    const regex = new RegExp(`\\b${pattern}\\b`, "gi");
    result = result.replace(regex, "");
  }

  // Clean up extra whitespace
  return result.replace(/\s+/g, " ").trim();
}
