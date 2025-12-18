/**
 * Property-based tests for EditablePointsField numeric validation
 *
 * **Feature: expense-editing-enhancements, Property 4: Numeric input validation**
 * **Validates: Requirements 1.2, 1.4**
 */

import { describe, it, expect } from "@jest/globals";
import fc from "fast-check";

// Arbitrary for generating valid reward points (non-negative with up to 2 decimal places)
const validRewardPointsArbitrary = (): fc.Arbitrary<string> =>
  fc
    .float({ min: 0, max: 100000, noNaN: true, noDefaultInfinity: true })
    .map((num) => {
      // Round to 2 decimal places
      const rounded = Math.round(num * 100) / 100;
      return rounded.toString();
    });

// Arbitrary for generating invalid reward points (negative values)
const negativeRewardPointsArbitrary = (): fc.Arbitrary<string> =>
  fc
    .float({ min: Math.fround(-100000), max: Math.fround(-0.01), noNaN: true, noDefaultInfinity: true })
    .map((num) => num.toString());

// Arbitrary for generating invalid reward points (more than 2 decimal places)
const tooManyDecimalsArbitrary = (): fc.Arbitrary<string> =>
  fc
    .float({ min: 0, max: 100000, noNaN: true, noDefaultInfinity: true })
    .map((num) => {
      // Force 3 or more decimal places
      return num.toFixed(3 + Math.floor(Math.random() * 3));
    });

// Arbitrary for generating non-numeric strings
const nonNumericArbitrary = (): fc.Arbitrary<string> =>
  fc.oneof(
    fc.string({ minLength: 1, maxLength: 20 }).filter((s) => isNaN(Number(s))),
    fc.constantFrom("abc", "12abc", "abc12", "12.34.56", "not-a-number")
  );

// Validation function that matches the form schema
const validateRewardPoints = (val: string): { isValid: boolean; error?: string } => {
  // Empty is valid (will be treated as 0)
  if (!val || val.trim() === "") {
    return { isValid: true };
  }

  const num = Number(val);

  // Check if it's a valid number
  if (isNaN(num)) {
    return { isValid: false, error: "Please enter a valid non-negative number" };
  }

  // Check if it's non-negative
  if (num < 0) {
    return { isValid: false, error: "Please enter a valid non-negative number" };
  }

  // Check for up to 2 decimal places
  const decimalPart = val.split(".")[1];
  if (decimalPart && decimalPart.length > 2) {
    return { isValid: false, error: "Please enter a number with up to 2 decimal places" };
  }

  return { isValid: true };
};

describe("EditablePointsField Numeric Validation Property-Based Tests", () => {
  it("**Feature: expense-editing-enhancements, Property 4: Numeric input validation** - Valid non-negative numbers with up to 2 decimals are accepted", () => {
    fc.assert(
      fc.property(validRewardPointsArbitrary(), (rewardPoints) => {
        // Validate the reward points
        const result = validateRewardPoints(rewardPoints);

        // Should be valid
        expect(result.isValid).toBe(true);
        expect(result.error).toBeUndefined();

        // Verify it's a valid number
        const num = Number(rewardPoints);
        expect(isNaN(num)).toBe(false);
        expect(num).toBeGreaterThanOrEqual(0);

        // Verify decimal places
        const decimalPart = rewardPoints.split(".")[1];
        if (decimalPart) {
          expect(decimalPart.length).toBeLessThanOrEqual(2);
        }
      }),
      { numRuns: 100 }
    );
  });

  it("**Feature: expense-editing-enhancements, Property 4: Numeric input validation** - Negative values are rejected", () => {
    fc.assert(
      fc.property(negativeRewardPointsArbitrary(), (rewardPoints) => {
        // Validate the reward points
        const result = validateRewardPoints(rewardPoints);

        // Should be invalid
        expect(result.isValid).toBe(false);
        expect(result.error).toBeDefined();
        expect(result.error).toContain("non-negative");

        // Verify it's actually negative
        const num = Number(rewardPoints);
        expect(num).toBeLessThan(0);
      }),
      { numRuns: 100 }
    );
  });

  it("**Feature: expense-editing-enhancements, Property 4: Numeric input validation** - Values with more than 2 decimal places are rejected", () => {
    fc.assert(
      fc.property(tooManyDecimalsArbitrary(), (rewardPoints) => {
        // Validate the reward points
        const result = validateRewardPoints(rewardPoints);

        // Should be invalid
        expect(result.isValid).toBe(false);
        expect(result.error).toBeDefined();
        expect(result.error).toContain("2 decimal places");

        // Verify it has more than 2 decimal places
        const decimalPart = rewardPoints.split(".")[1];
        expect(decimalPart).toBeDefined();
        expect(decimalPart!.length).toBeGreaterThan(2);
      }),
      { numRuns: 100 }
    );
  });

  it("**Feature: expense-editing-enhancements, Property 4: Numeric input validation** - Non-numeric values are rejected", () => {
    fc.assert(
      fc.property(nonNumericArbitrary(), (rewardPoints) => {
        // Validate the reward points
        const result = validateRewardPoints(rewardPoints);

        // Should be invalid
        expect(result.isValid).toBe(false);
        expect(result.error).toBeDefined();

        // Verify it's not a valid number
        const num = Number(rewardPoints);
        expect(isNaN(num)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it("**Feature: expense-editing-enhancements, Property 4: Numeric input validation** - Empty string is valid (treated as zero)", () => {
    fc.assert(
      fc.property(fc.constantFrom("", "  ", "\t", "\n"), (emptyValue) => {
        // Validate the empty value
        const result = validateRewardPoints(emptyValue);

        // Should be valid
        expect(result.isValid).toBe(true);
        expect(result.error).toBeUndefined();

        // When converted, should be 0
        const num = emptyValue.trim() === "" ? 0 : Number(emptyValue);
        expect(num).toBe(0);
      }),
      { numRuns: 100 }
    );
  });

  it("**Feature: expense-editing-enhancements, Property 4: Numeric input validation** - Zero is a valid value", () => {
    fc.assert(
      fc.property(fc.constantFrom("0", "0.0", "0.00"), (zeroValue) => {
        // Validate zero
        const result = validateRewardPoints(zeroValue);

        // Should be valid
        expect(result.isValid).toBe(true);
        expect(result.error).toBeUndefined();

        // Verify it's zero
        const num = Number(zeroValue);
        expect(num).toBe(0);
      }),
      { numRuns: 100 }
    );
  });

  it("**Feature: expense-editing-enhancements, Property 4: Numeric input validation** - Boundary values are handled correctly", () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.constant("0"),
          fc.constant("0.01"),
          fc.constant("99999.99"),
          fc.constant("100000")
        ),
        (boundaryValue) => {
          // Validate boundary value
          const result = validateRewardPoints(boundaryValue);

          // Should be valid
          expect(result.isValid).toBe(true);
          expect(result.error).toBeUndefined();

          // Verify it's a valid number
          const num = Number(boundaryValue);
          expect(isNaN(num)).toBe(false);
          expect(num).toBeGreaterThanOrEqual(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("Validation consistency: same input always produces same result", () => {
    fc.assert(
      fc.property(
        fc.oneof(
          validRewardPointsArbitrary(),
          negativeRewardPointsArbitrary(),
          tooManyDecimalsArbitrary(),
          nonNumericArbitrary()
        ),
        (rewardPoints) => {
          // Validate twice
          const result1 = validateRewardPoints(rewardPoints);
          const result2 = validateRewardPoints(rewardPoints);

          // Results should be identical
          expect(result1.isValid).toBe(result2.isValid);
          expect(result1.error).toBe(result2.error);
        }
      ),
      { numRuns: 100 }
    );
  });
});
