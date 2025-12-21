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
