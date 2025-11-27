import { CardTypeIdService } from "../src/core/rewards/CardTypeIdService";
import fc from "fast-check";

describe("CardTypeIdService", () => {
  const service = new CardTypeIdService();

  describe("generateCardTypeId", () => {
    it("should generate a card type ID in lowercase with hyphens", () => {
      const result = service.generateCardTypeId("Chase", "Sapphire Reserve");
      expect(result).toBe("chase-sapphire-reserve");
    });

    it("should handle issuer with spaces", () => {
      const result = service.generateCardTypeId(
        "American Express",
        "Gold Card"
      );
      expect(result).toBe("american express-gold-card");
    });

    it("should replace multiple spaces in name with single hyphens", () => {
      const result = service.generateCardTypeId("Chase", "Freedom  Unlimited");
      expect(result).toBe("chase-freedom-unlimited");
    });

    it("should handle single word names", () => {
      const result = service.generateCardTypeId("Visa", "Platinum");
      expect(result).toBe("visa-platinum");
    });

    it("should trim whitespace from inputs", () => {
      const result = service.generateCardTypeId("  Chase  ", "  Sapphire  ");
      expect(result).toBe("chase-sapphire");
    });

    it("should throw error when issuer is empty", () => {
      expect(() => service.generateCardTypeId("", "Card Name")).toThrow(
        "Both issuer and name are required to generate a card type ID"
      );
    });

    it("should throw error when name is empty", () => {
      expect(() => service.generateCardTypeId("Issuer", "")).toThrow(
        "Both issuer and name are required to generate a card type ID"
      );
    });

    it("should throw error when both are empty", () => {
      expect(() => service.generateCardTypeId("", "")).toThrow(
        "Both issuer and name are required to generate a card type ID"
      );
    });

    it("should handle names with special characters", () => {
      const result = service.generateCardTypeId("Chase", "Sapphire Reserve's");
      expect(result).toBe("chase-sapphire-reserve's");
    });

    it("should handle names with numbers", () => {
      const result = service.generateCardTypeId("Citi", "Double Cash 2%");
      expect(result).toBe("citi-double-cash-2%");
    });
  });

  describe("generateCardTypeIdFromPaymentMethod", () => {
    it("should generate ID from payment method object", () => {
      const paymentMethod = {
        issuer: "Chase",
        name: "Sapphire Reserve",
        id: "some-id",
        type: "credit_card" as const,
        currency: "USD" as const,
        active: true,
      };

      const result = service.generateCardTypeIdFromPaymentMethod(paymentMethod);
      expect(result).toBe("chase-sapphire-reserve");
    });

    it("should work with minimal payment method object", () => {
      const paymentMethod = {
        issuer: "Visa",
        name: "Platinum",
      };

      const result = service.generateCardTypeIdFromPaymentMethod(paymentMethod);
      expect(result).toBe("visa-platinum");
    });
  });

  describe("isValidCardTypeId", () => {
    it("should validate correct card type IDs", () => {
      expect(service.isValidCardTypeId("chase-sapphire-reserve")).toBe(true);
      expect(service.isValidCardTypeId("american express-gold-card")).toBe(
        true
      );
      expect(service.isValidCardTypeId("visa-platinum")).toBe(true);
    });

    it("should reject IDs without hyphens", () => {
      expect(service.isValidCardTypeId("chase")).toBe(false);
      expect(service.isValidCardTypeId("chasesapphire")).toBe(false);
    });

    it("should reject IDs with uppercase letters", () => {
      expect(service.isValidCardTypeId("Chase-Sapphire-Reserve")).toBe(false);
      expect(service.isValidCardTypeId("chase-Sapphire-reserve")).toBe(false);
    });

    it("should reject IDs starting with hyphen", () => {
      expect(service.isValidCardTypeId("-chase-sapphire")).toBe(false);
    });

    it("should reject IDs ending with hyphen", () => {
      expect(service.isValidCardTypeId("chase-sapphire-")).toBe(false);
    });

    it("should reject IDs with consecutive hyphens", () => {
      expect(service.isValidCardTypeId("chase--sapphire")).toBe(false);
      expect(service.isValidCardTypeId("chase---sapphire")).toBe(false);
    });

    it("should reject empty strings", () => {
      expect(service.isValidCardTypeId("")).toBe(false);
    });

    it("should reject null or undefined", () => {
      expect(service.isValidCardTypeId(null as unknown as string)).toBe(false);
      expect(service.isValidCardTypeId(undefined as unknown as string)).toBe(
        false
      );
    });

    it("should reject non-string values", () => {
      expect(service.isValidCardTypeId(123 as unknown as string)).toBe(false);
      expect(service.isValidCardTypeId({} as unknown as string)).toBe(false);
      expect(service.isValidCardTypeId([] as unknown as string)).toBe(false);
    });

    it("should accept IDs with special characters (except spaces)", () => {
      expect(service.isValidCardTypeId("chase-sapphire-reserve's")).toBe(true);
      expect(service.isValidCardTypeId("citi-double-cash-2%")).toBe(true);
    });

    it("should accept IDs with numbers", () => {
      expect(service.isValidCardTypeId("chase-freedom-5x")).toBe(true);
      expect(service.isValidCardTypeId("amex-gold-4x")).toBe(true);
    });
  });

  describe("**Feature: codebase-improvements, Property 2: Card type ID consistency**", () => {
    /**
     * Property-Based Test for Card Type ID Consistency
     *
     * **Validates: Requirements 2.1, 2.2**
     *
     * This test verifies that for any payment method with the same issuer and name,
     * the card type ID generated during creation matches the ID generated during
     * rule queries or any other operation.
     *
     * The property ensures that:
     * 1. Multiple calls with the same inputs produce identical outputs
     * 2. The ID generation is deterministic and consistent
     * 3. Different code paths (direct call vs payment method object) produce the same result
     */
    it("should generate consistent card type IDs for the same issuer and name", async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate arbitrary issuer and name strings
          // The property is about consistency, not validity of edge cases
          fc
            .string({ minLength: 1, maxLength: 50 })
            .filter((s) => s.trim().length > 0),
          fc
            .string({ minLength: 1, maxLength: 50 })
            .filter((s) => s.trim().length > 0),
          async (issuer, name) => {
            // Generate ID using direct method call (simulating creation)
            const id1 = service.generateCardTypeId(issuer, name);

            // Generate ID using the same method again (simulating query)
            const id2 = service.generateCardTypeId(issuer, name);

            // Generate ID using payment method object (alternative code path)
            const paymentMethod = { issuer, name };
            const id3 =
              service.generateCardTypeIdFromPaymentMethod(paymentMethod);

            // All three IDs should be identical - this is the core consistency property
            expect(id1).toBe(id2);
            expect(id1).toBe(id3);
            expect(id2).toBe(id3);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should generate consistent IDs regardless of whitespace variations", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc
            .string({ minLength: 1, maxLength: 50 })
            .filter((s) => s.trim().length > 0),
          fc
            .string({ minLength: 1, maxLength: 50 })
            .filter((s) => s.trim().length > 0),
          async (issuer, name) => {
            // Generate ID with original strings
            const id1 = service.generateCardTypeId(issuer, name);

            // Generate ID with extra whitespace
            const id2 = service.generateCardTypeId(
              `  ${issuer}  `,
              `  ${name}  `
            );

            // Generate ID with tabs and newlines (if they exist in the string)
            const id3 = service.generateCardTypeId(issuer.trim(), name.trim());

            // All IDs should be identical (whitespace should be normalized)
            expect(id1).toBe(id2);
            expect(id1).toBe(id3);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should generate consistent IDs regardless of case variations", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc
            .string({ minLength: 1, maxLength: 50 })
            .filter((s) => s.trim().length > 0),
          fc
            .string({ minLength: 1, maxLength: 50 })
            .filter((s) => s.trim().length > 0),
          async (issuer, name) => {
            // Generate ID with original case
            const id1 = service.generateCardTypeId(issuer, name);

            // Generate ID with uppercase
            const id2 = service.generateCardTypeId(
              issuer.toUpperCase(),
              name.toUpperCase()
            );

            // Generate ID with lowercase
            const id3 = service.generateCardTypeId(
              issuer.toLowerCase(),
              name.toLowerCase()
            );

            // Generate ID with mixed case
            const id4 = service.generateCardTypeId(
              issuer.charAt(0).toUpperCase() + issuer.slice(1).toLowerCase(),
              name.charAt(0).toUpperCase() + name.slice(1).toLowerCase()
            );

            // All IDs should be identical (case should be normalized to lowercase)
            expect(id1).toBe(id2);
            expect(id1).toBe(id3);
            expect(id1).toBe(id4);

            // All IDs should be lowercase
            expect(id1).toBe(id1.toLowerCase());
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should generate the same ID when called multiple times in different contexts", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc
            .string({ minLength: 1, maxLength: 50 })
            .filter((s) => s.trim().length > 0),
          fc
            .string({ minLength: 1, maxLength: 50 })
            .filter((s) => s.trim().length > 0),
          async (issuer, name) => {
            // Simulate different contexts where ID generation might occur

            // Context 1: During payment method creation
            const creationId = service.generateCardTypeId(issuer, name);

            // Context 2: During rule query
            const queryId = service.generateCardTypeId(issuer, name);

            // Context 3: During reward calculation
            const calculationId = service.generateCardTypeIdFromPaymentMethod({
              issuer,
              name,
            });

            // Context 4: During rule creation
            const ruleCreationId = service.generateCardTypeId(issuer, name);

            // All contexts should produce the same ID
            expect(creationId).toBe(queryId);
            expect(creationId).toBe(calculationId);
            expect(creationId).toBe(ruleCreationId);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
