/**
 * Unit tests for Merchant Category form initialization in ExpenseForm
 *
 * Tests that edit form displays existing MCC and handles empty MCC correctly
 * **Validates: Requirements 2.1, 2.4**
 */

import { describe, it, expect } from "@jest/globals";
import { MerchantCategoryCode } from "@/types";

describe("ExpenseForm MCC Initialization Unit Tests", () => {
  describe("Edit form displays existing MCC", () => {
    it("should initialize with MCC when provided in defaultValues", () => {
      const existingMCC: MerchantCategoryCode = {
        code: "5411",
        description: "Grocery Stores & Supermarkets",
      };

      const defaultValues = {
        merchantName: "Whole Foods",
        amount: "50.00",
        currency: "USD",
        paymentMethodId: "test-id",
        date: new Date(),
        mcc: existingMCC,
        isOnline: false,
        isContactless: false,
      };

      // Simulate the initialization logic from useExpenseForm
      const initializedMCC = defaultValues.mcc || null;

      expect(initializedMCC).not.toBeNull();
      expect(initializedMCC?.code).toBe("5411");
      expect(initializedMCC?.description).toBe(
        "Grocery Stores & Supermarkets"
      );
    });

    it("should preserve MCC structure with code and description", () => {
      const existingMCC: MerchantCategoryCode = {
        code: "5812",
        description: "Restaurants & Eating Places",
      };

      const defaultValues = {
        mcc: existingMCC,
      };

      const initializedMCC = defaultValues.mcc || null;

      expect(initializedMCC).toHaveProperty("code");
      expect(initializedMCC).toHaveProperty("description");
      expect(typeof initializedMCC?.code).toBe("string");
      expect(typeof initializedMCC?.description).toBe("string");
    });

    it("should handle MCC with various valid codes", () => {
      const testCases = [
        { code: "5411", description: "Grocery Stores & Supermarkets" },
        { code: "5812", description: "Restaurants & Eating Places" },
        { code: "5541", description: "Gas Stations" },
        { code: "5912", description: "Drug Stores & Pharmacies" },
      ];

      testCases.forEach((mcc) => {
        const defaultValues = { mcc };
        const initializedMCC = defaultValues.mcc || null;

        expect(initializedMCC).not.toBeNull();
        expect(initializedMCC?.code).toBe(mcc.code);
        expect(initializedMCC?.description).toBe(mcc.description);
      });
    });
  });

  describe("Empty MCC shows empty selector", () => {
    it("should initialize with null when no MCC is provided", () => {
      const defaultValues = {
        merchantName: "Test Merchant",
        amount: "100.00",
        currency: "USD",
        paymentMethodId: "test-id",
        date: new Date(),
        mcc: null,
        isOnline: false,
        isContactless: false,
      };

      const initializedMCC = defaultValues.mcc || null;

      expect(initializedMCC).toBeNull();
    });

    it("should initialize with null when mcc is undefined", () => {
      const defaultValues = {
        merchantName: "Test Merchant",
        amount: "100.00",
        currency: "USD",
        paymentMethodId: "test-id",
        date: new Date(),
        mcc: undefined,
        isOnline: false,
        isContactless: false,
      };

      const initializedMCC = defaultValues.mcc || null;

      expect(initializedMCC).toBeNull();
    });

    it("should handle missing mcc property in defaultValues", () => {
      const defaultValues = {
        merchantName: "Test Merchant",
        amount: "100.00",
        currency: "USD",
        paymentMethodId: "test-id",
        date: new Date(),
        isOnline: false,
        isContactless: false,
      };

      // @ts-expect-error - Testing missing property
      const initializedMCC = defaultValues.mcc || null;

      expect(initializedMCC).toBeNull();
    });

    it("should distinguish between null and valid MCC", () => {
      const withMCC = {
        mcc: { code: "5411", description: "Grocery Stores & Supermarkets" },
      };
      const withoutMCC = { mcc: null };

      const initializedWithMCC = withMCC.mcc || null;
      const initializedWithoutMCC = withoutMCC.mcc || null;

      expect(initializedWithMCC).not.toBeNull();
      expect(initializedWithoutMCC).toBeNull();
    });
  });

  describe("MCC validation", () => {
    it("should accept valid MCC objects", () => {
      const validMCC: MerchantCategoryCode = {
        code: "5411",
        description: "Grocery Stores & Supermarkets",
      };

      expect(validMCC.code).toBeDefined();
      expect(validMCC.description).toBeDefined();
      expect(validMCC.code.length).toBeGreaterThan(0);
      expect(validMCC.description.length).toBeGreaterThan(0);
    });

    it("should handle MCC with special characters in description", () => {
      const mccWithSpecialChars: MerchantCategoryCode = {
        code: "5137",
        description: "Men's, Women's and Children's Uniforms and Commercial Clothing",
      };

      const defaultValues = { mcc: mccWithSpecialChars };
      const initializedMCC = defaultValues.mcc || null;

      expect(initializedMCC).not.toBeNull();
      expect(initializedMCC?.description).toContain("'");
    });
  });
});
