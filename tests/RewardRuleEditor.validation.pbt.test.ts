/**
 * Property-Based Tests for RewardRuleEditor Validation
 *
 * These tests verify that the validation logic correctly identifies
 * invalid reward rule inputs across a wide range of generated test cases.
 */

import fc from "fast-check";

/**
 * Validation function extracted from RewardRuleEditor
 * This mirrors the validation logic in the component
 */
interface ValidationErrors {
  name?: string;
  cardTypeId?: string;
  priority?: string;
  baseMultiplier?: string;
  bonusMultiplier?: string;
  blockSize?: string;
  monthlyCap?: string;
  monthlyMinSpend?: string;
}

interface RewardRuleInput {
  name: string;
  cardTypeId: string;
  priority: number;
  baseMultiplier: number;
  bonusMultiplier: number;
  blockSize: number;
  monthlyCap?: number;
  monthlyMinSpend?: number;
}

function validateRewardRule(input: RewardRuleInput): ValidationErrors {
  const errors: ValidationErrors = {};

  // Validate required fields
  if (!input.name || input.name.trim() === "") {
    errors.name = "Name is required";
  }

  if (!input.cardTypeId || input.cardTypeId.trim() === "") {
    errors.cardTypeId = "Card type ID is required";
  }

  // Validate numeric fields
  if (input.priority < 0) {
    errors.priority = "Priority must be a non-negative number";
  }

  if (input.baseMultiplier < 0) {
    errors.baseMultiplier = "Base multiplier must be a non-negative number";
  }

  if (input.bonusMultiplier < 0) {
    errors.bonusMultiplier = "Bonus multiplier must be a non-negative number";
  }

  if (input.blockSize <= 0) {
    errors.blockSize = "Block size must be greater than 0";
  }

  if (input.monthlyCap !== undefined && input.monthlyCap < 0) {
    errors.monthlyCap = "Monthly cap must be a non-negative number";
  }

  if (input.monthlyMinSpend !== undefined && input.monthlyMinSpend < 0) {
    errors.monthlyMinSpend =
      "Monthly minimum spend must be a non-negative number";
  }

  return errors;
}

function isValid(input: RewardRuleInput): boolean {
  const errors = validateRewardRule(input);
  return Object.keys(errors).length === 0;
}

describe("RewardRuleEditor Validation - Property-Based Tests", () => {
  /**
   * **Feature: codebase-improvements, Property 12: Required field validation**
   * **Validates: Requirements 8.4**
   *
   * For any reward rule with missing required fields (name, cardTypeId),
   * the validation should reject it with a validation error.
   */
  it("**Feature: codebase-improvements, Property 12: Required field validation**", () => {
    fc.assert(
      fc.property(
        // Generate reward rules with potentially missing required fields
        fc.record({
          name: fc.oneof(
            fc.constant(""), // Empty string
            fc.constant("   "), // Whitespace only
            fc.string({ minLength: 1, maxLength: 50 }) // Valid name
          ),
          cardTypeId: fc.oneof(
            fc.constant(""), // Empty string
            fc.constant("   "), // Whitespace only
            fc.string({ minLength: 1, maxLength: 50 }) // Valid ID
          ),
          priority: fc.nat({ max: 100 }),
          baseMultiplier: fc.float({ min: 0, max: 10, noNaN: true }),
          bonusMultiplier: fc.float({ min: 0, max: 10, noNaN: true }),
          blockSize: fc.float({
            min: Math.fround(0.01),
            max: 100,
            noNaN: true,
          }),
          monthlyCap: fc.option(fc.float({ min: 0, max: 100000, noNaN: true })),
          monthlyMinSpend: fc.option(
            fc.float({ min: 0, max: 100000, noNaN: true })
          ),
        }),
        (input) => {
          const errors = validateRewardRule(input);

          // If name is empty or whitespace, should have name error
          if (!input.name || input.name.trim() === "") {
            expect(errors.name).toBeDefined();
            expect(errors.name).toBe("Name is required");
          } else {
            expect(errors.name).toBeUndefined();
          }

          // If cardTypeId is empty or whitespace, should have cardTypeId error
          if (!input.cardTypeId || input.cardTypeId.trim() === "") {
            expect(errors.cardTypeId).toBeDefined();
            expect(errors.cardTypeId).toBe("Card type ID is required");
          } else {
            expect(errors.cardTypeId).toBeUndefined();
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Test that valid inputs with all required fields pass validation
   */
  it("should accept valid reward rules with all required fields", () => {
    fc.assert(
      fc.property(
        fc.record({
          name: fc
            .string({ minLength: 1, maxLength: 50 })
            .filter((s) => s.trim().length > 0),
          cardTypeId: fc
            .string({ minLength: 1, maxLength: 50 })
            .filter((s) => s.trim().length > 0),
          priority: fc.nat({ max: 100 }),
          baseMultiplier: fc.float({ min: 0, max: 10, noNaN: true }),
          bonusMultiplier: fc.float({ min: 0, max: 10, noNaN: true }),
          blockSize: fc.float({
            min: Math.fround(0.01),
            max: 100,
            noNaN: true,
          }),
          monthlyCap: fc.option(fc.float({ min: 0, max: 100000, noNaN: true })),
          monthlyMinSpend: fc.option(
            fc.float({ min: 0, max: 100000, noNaN: true })
          ),
        }),
        (input) => {
          expect(isValid(input)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Test that numeric field validation works correctly
   */
  it("should reject invalid numeric values", () => {
    fc.assert(
      fc.property(
        fc.record({
          name: fc
            .string({ minLength: 1, maxLength: 50 })
            .filter((s) => s.trim().length > 0),
          cardTypeId: fc
            .string({ minLength: 1, maxLength: 50 })
            .filter((s) => s.trim().length > 0),
          priority: fc.integer({ min: -100, max: 100 }),
          baseMultiplier: fc.float({ min: -10, max: 10, noNaN: true }),
          bonusMultiplier: fc.float({ min: -10, max: 10, noNaN: true }),
          blockSize: fc.float({ min: -10, max: 10, noNaN: true }),
          monthlyCap: fc.option(
            fc.float({ min: -10000, max: 100000, noNaN: true })
          ),
          monthlyMinSpend: fc.option(
            fc.float({ min: -10000, max: 100000, noNaN: true })
          ),
        }),
        (input) => {
          const errors = validateRewardRule(input);

          // Priority must be non-negative
          if (input.priority < 0) {
            expect(errors.priority).toBeDefined();
          } else {
            expect(errors.priority).toBeUndefined();
          }

          // Base multiplier must be non-negative
          if (input.baseMultiplier < 0) {
            expect(errors.baseMultiplier).toBeDefined();
          } else {
            expect(errors.baseMultiplier).toBeUndefined();
          }

          // Bonus multiplier must be non-negative
          if (input.bonusMultiplier < 0) {
            expect(errors.bonusMultiplier).toBeDefined();
          } else {
            expect(errors.bonusMultiplier).toBeUndefined();
          }

          // Block size must be greater than 0
          if (input.blockSize <= 0) {
            expect(errors.blockSize).toBeDefined();
          } else {
            expect(errors.blockSize).toBeUndefined();
          }

          // Monthly cap must be non-negative if provided
          if (input.monthlyCap !== undefined && input.monthlyCap < 0) {
            expect(errors.monthlyCap).toBeDefined();
          } else {
            expect(errors.monthlyCap).toBeUndefined();
          }

          // Monthly min spend must be non-negative if provided
          if (
            input.monthlyMinSpend !== undefined &&
            input.monthlyMinSpend < 0
          ) {
            expect(errors.monthlyMinSpend).toBeDefined();
          } else {
            expect(errors.monthlyMinSpend).toBeUndefined();
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: codebase-improvements, Property 11: Validation error specificity**
   * **Validates: Requirements 6.3**
   *
   * For any invalid reward rule input, the validation error should indicate
   * which specific field is invalid.
   */
  it("**Feature: codebase-improvements, Property 11: Validation error specificity**", () => {
    fc.assert(
      fc.property(
        // Generate inputs with at least one invalid field
        fc.oneof(
          // Invalid name
          fc.record({
            name: fc.constant(""),
            cardTypeId: fc
              .string({ minLength: 1, maxLength: 50 })
              .filter((s) => s.trim().length > 0),
            priority: fc.nat({ max: 100 }),
            baseMultiplier: fc.float({ min: 0, max: 10, noNaN: true }),
            bonusMultiplier: fc.float({ min: 0, max: 10, noNaN: true }),
            blockSize: fc.float({
              min: Math.fround(0.01),
              max: 100,
              noNaN: true,
            }),
            monthlyCap: fc.option(
              fc.float({ min: 0, max: 100000, noNaN: true })
            ),
            monthlyMinSpend: fc.option(
              fc.float({ min: 0, max: 100000, noNaN: true })
            ),
          }),
          // Invalid cardTypeId
          fc.record({
            name: fc
              .string({ minLength: 1, maxLength: 50 })
              .filter((s) => s.trim().length > 0),
            cardTypeId: fc.constant(""),
            priority: fc.nat({ max: 100 }),
            baseMultiplier: fc.float({ min: 0, max: 10, noNaN: true }),
            bonusMultiplier: fc.float({ min: 0, max: 10, noNaN: true }),
            blockSize: fc.float({
              min: Math.fround(0.01),
              max: 100,
              noNaN: true,
            }),
            monthlyCap: fc.option(
              fc.float({ min: 0, max: 100000, noNaN: true })
            ),
            monthlyMinSpend: fc.option(
              fc.float({ min: 0, max: 100000, noNaN: true })
            ),
          }),
          // Invalid priority
          fc.record({
            name: fc
              .string({ minLength: 1, maxLength: 50 })
              .filter((s) => s.trim().length > 0),
            cardTypeId: fc
              .string({ minLength: 1, maxLength: 50 })
              .filter((s) => s.trim().length > 0),
            priority: fc.integer({ min: -100, max: -1 }),
            baseMultiplier: fc.float({ min: 0, max: 10, noNaN: true }),
            bonusMultiplier: fc.float({ min: 0, max: 10, noNaN: true }),
            blockSize: fc.float({
              min: Math.fround(0.01),
              max: 100,
              noNaN: true,
            }),
            monthlyCap: fc.option(
              fc.float({ min: 0, max: 100000, noNaN: true })
            ),
            monthlyMinSpend: fc.option(
              fc.float({ min: 0, max: 100000, noNaN: true })
            ),
          }),
          // Invalid baseMultiplier
          fc.record({
            name: fc
              .string({ minLength: 1, maxLength: 50 })
              .filter((s) => s.trim().length > 0),
            cardTypeId: fc
              .string({ minLength: 1, maxLength: 50 })
              .filter((s) => s.trim().length > 0),
            priority: fc.nat({ max: 100 }),
            baseMultiplier: fc.float({
              min: -10,
              max: Math.fround(-0.01),
              noNaN: true,
            }),
            bonusMultiplier: fc.float({ min: 0, max: 10, noNaN: true }),
            blockSize: fc.float({
              min: Math.fround(0.01),
              max: 100,
              noNaN: true,
            }),
            monthlyCap: fc.option(
              fc.float({ min: 0, max: 100000, noNaN: true })
            ),
            monthlyMinSpend: fc.option(
              fc.float({ min: 0, max: 100000, noNaN: true })
            ),
          }),
          // Invalid blockSize
          fc.record({
            name: fc
              .string({ minLength: 1, maxLength: 50 })
              .filter((s) => s.trim().length > 0),
            cardTypeId: fc
              .string({ minLength: 1, maxLength: 50 })
              .filter((s) => s.trim().length > 0),
            priority: fc.nat({ max: 100 }),
            baseMultiplier: fc.float({ min: 0, max: 10, noNaN: true }),
            bonusMultiplier: fc.float({ min: 0, max: 10, noNaN: true }),
            blockSize: fc.float({ min: -10, max: 0, noNaN: true }),
            monthlyCap: fc.option(
              fc.float({ min: 0, max: 100000, noNaN: true })
            ),
            monthlyMinSpend: fc.option(
              fc.float({ min: 0, max: 100000, noNaN: true })
            ),
          })
        ),
        (input) => {
          const errors = validateRewardRule(input);

          // Should have at least one error
          expect(Object.keys(errors).length).toBeGreaterThan(0);

          // Each error should be specific to a field
          Object.entries(errors).forEach(([field, message]) => {
            expect(message).toBeDefined();
            expect(typeof message).toBe("string");
            expect(message.length).toBeGreaterThan(0);

            // Error message should be specific and not generic
            expect(message).not.toBe("Invalid input");
            expect(message).not.toBe("Validation failed");

            // Verify the error is for the correct field
            if (field === "name") {
              expect(input.name.trim()).toBe("");
            } else if (field === "cardTypeId") {
              expect(input.cardTypeId.trim()).toBe("");
            } else if (field === "priority") {
              expect(input.priority).toBeLessThan(0);
            } else if (field === "baseMultiplier") {
              expect(input.baseMultiplier).toBeLessThan(0);
            } else if (field === "bonusMultiplier") {
              expect(input.bonusMultiplier).toBeLessThan(0);
            } else if (field === "blockSize") {
              expect(input.blockSize).toBeLessThanOrEqual(0);
            } else if (field === "monthlyCap") {
              expect(input.monthlyCap).toBeLessThan(0);
            } else if (field === "monthlyMinSpend") {
              expect(input.monthlyMinSpend).toBeLessThan(0);
            }
          });
        }
      ),
      { numRuns: 100 }
    );
  });
});
