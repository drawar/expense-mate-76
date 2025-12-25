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

// Terms to strip from card names for compact display
const NETWORK_TERMS = [
  "visa",
  "mastercard",
  "master card",
  "amex",
  "american express",
  "discover",
];

const RANK_TERMS = [
  "infinite privilege",
  "world elite",
  "world select",
  "infinite",
  "signature",
  "platinum",
  "world",
];

/**
 * Format card name for compact display by removing network and rank terms
 * e.g., "Neo Financial Cathay World Elite MasterCard" → "Neo Financial Cathay"
 */
export function formatCardShortName(issuer: string, name: string): string {
  let result = formatCardDisplayName(issuer, name);

  // Remove network terms (case-insensitive)
  for (const term of NETWORK_TERMS) {
    const regex = new RegExp(`\\b${term}\\b`, "gi");
    result = result.replace(regex, "");
  }

  // Remove rank terms (case-insensitive, order matters - longer terms first)
  for (const term of RANK_TERMS) {
    const regex = new RegExp(`\\b${term}\\b`, "gi");
    result = result.replace(regex, "");
  }

  // Clean up extra whitespace
  return result.replace(/\s+/g, " ").trim();
}
