/**
 * CardTypeIdService
 *
 * Centralized service for generating consistent card type IDs across the application.
 * Card type IDs are used to associate reward rules with payment methods.
 *
 * Format: {issuer}-{name}
 * - Both issuer and name are converted to lowercase
 * - Spaces in the name are replaced with hyphens
 * - Special characters are preserved (except spaces)
 *
 * Examples:
 * - issuer: "Chase", name: "Sapphire Reserve" -> "chase-sapphire-reserve"
 * - issuer: "American Express", name: "Gold Card" -> "american express-gold-card"
 */
export class CardTypeIdService {
  /**
   * Generate a card type ID from issuer and name
   *
   * @param issuer - The card issuer (e.g., "Chase", "American Express")
   * @param name - The card name (e.g., "Sapphire Reserve", "Gold Card")
   * @returns A consistent card type ID in the format: {issuer}-{name}
   *
   * @example
   * ```typescript
   * const service = new CardTypeIdService();
   * const id = service.generateCardTypeId("Chase", "Sapphire Reserve");
   * // Returns: "chase-sapphire-reserve"
   * ```
   */
  generateCardTypeId(issuer: string, name: string): string {
    if (!issuer || !name) {
      throw new Error(
        "Both issuer and name are required to generate a card type ID"
      );
    }

    const normalizedIssuer = issuer.toLowerCase().trim();
    const normalizedName = name.toLowerCase().trim().replace(/\s+/g, "-");

    return `${normalizedIssuer}-${normalizedName}`;
  }

  /**
   * Generate a card type ID from a payment method object
   *
   * @param paymentMethod - Payment method object with issuer and name properties
   * @returns A consistent card type ID
   *
   * @example
   * ```typescript
   * const service = new CardTypeIdService();
   * const id = service.generateCardTypeIdFromPaymentMethod({
   *   issuer: "Chase",
   *   name: "Sapphire Reserve",
   *   // ... other properties
   * });
   * // Returns: "chase-sapphire-reserve"
   * ```
   */
  generateCardTypeIdFromPaymentMethod(paymentMethod: {
    issuer: string;
    name: string;
  }): string {
    return this.generateCardTypeId(paymentMethod.issuer, paymentMethod.name);
  }

  /**
   * Validate a card type ID format
   *
   * A valid card type ID:
   * - Must not be empty
   * - Must contain at least one hyphen (separating issuer and name)
   * - Must be lowercase
   * - Must not contain consecutive hyphens
   * - Must not start or end with a hyphen
   *
   * @param cardTypeId - The card type ID to validate
   * @returns true if the card type ID is valid, false otherwise
   *
   * @example
   * ```typescript
   * const service = new CardTypeIdService();
   * service.isValidCardTypeId("chase-sapphire-reserve"); // true
   * service.isValidCardTypeId("Chase-Sapphire-Reserve"); // false (not lowercase)
   * service.isValidCardTypeId("chase"); // false (no hyphen)
   * service.isValidCardTypeId("-chase-sapphire"); // false (starts with hyphen)
   * ```
   */
  isValidCardTypeId(cardTypeId: string): boolean {
    if (!cardTypeId || typeof cardTypeId !== "string") {
      return false;
    }

    // Must contain at least one hyphen
    if (!cardTypeId.includes("-")) {
      return false;
    }

    // Must be lowercase
    if (cardTypeId !== cardTypeId.toLowerCase()) {
      return false;
    }

    // Must not start or end with a hyphen
    if (cardTypeId.startsWith("-") || cardTypeId.endsWith("-")) {
      return false;
    }

    // Must not contain consecutive hyphens
    if (cardTypeId.includes("--")) {
      return false;
    }

    // Must not be empty after trimming
    if (cardTypeId.trim().length === 0) {
      return false;
    }

    return true;
  }
}

// Export a singleton instance for convenience
export const cardTypeIdService = new CardTypeIdService();
