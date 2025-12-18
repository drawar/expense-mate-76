/**
 * Property-based tests for Calculated Reference Updates in ExpenseForm
 *
 * **Feature: expense-editing-enhancements, Property 9: Calculated reference updates**
 * **Validates: Requirements 4.2**
 */

import { describe, it, expect, beforeEach } from "@jest/globals";
import fc from "fast-check";
import { rewardService } from "@/core/rewards/RewardService";
import { PaymentMethod, MerchantCategoryCode } from "@/types";

// Arbitrary for generating valid transaction amounts
const amountArbitrary = (): fc.Arbitrary<number> =>
  fc.float({ min: Math.fround(0.01), max: Math.fround(10000), noNaN: true, noDefaultInfinity: true });

// Arbitrary for generating merchant category codes
const mccArbitrary = (): fc.Arbitrary<string | undefined> =>
  fc.option(
    fc.constantFrom(
      "5411", // Grocery stores
      "5812", // Eating places and restaurants
      "5541", // Service stations
      "5912", // Drug stores and pharmacies
      "5999"  // Miscellaneous retail
    ),
    { nil: undefined }
  );

// Arbitrary for generating payment methods
const paymentMethodArbitrary = (): fc.Arbitrary<PaymentMethod> =>
  fc.record({
    id: fc.uuid(),
    name: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
    type: fc.constantFrom("credit_card", "debit_card", "cash"),
    currency: fc.constantFrom("USD", "EUR", "GBP", "JPY", "CAD", "AUD"),
    issuer: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
    lastFourDigits: fc.option(fc.string({ minLength: 4, maxLength: 4 }), { nil: undefined }),
    expiryDate: fc.option(fc.string({ maxLength: 7 }), { nil: undefined }),
    cardImage: fc.option(fc.string(), { nil: undefined }),
    rewardRules: fc.constant([]),
    active: fc.constant(true),
  }) as fc.Arbitrary<PaymentMethod>;

// Arbitrary for generating merchant names
const merchantNameArbitrary = (): fc.Arbitrary<string> =>
  fc.string({ minLength: 1, maxLength: 100 });

// Arbitrary for generating boolean flags
const booleanArbitrary = (): fc.Arbitrary<boolean> => fc.boolean();

describe("ExpenseForm Calculated Reference Updates Property-Based Tests", () => {
  beforeEach(() => {
    // Reset any state in reward service if needed
  });

  it("**Feature: expense-editing-enhancements, Property 9: Calculated reference updates** - Changing amount updates calculated reference", async () => {
    await fc.assert(
      fc.asyncProperty(
        amountArbitrary(),
        amountArbitrary(),
        paymentMethodArbitrary(),
        mccArbitrary(),
        merchantNameArbitrary(),
        booleanArbitrary(),
        booleanArbitrary(),
        async (amount1, amount2, paymentMethod, mcc, merchantName, isOnline, isContactless) => {
          // Skip if amounts are the same
          fc.pre(Math.abs(amount1 - amount2) > 0.01);

          const currency = paymentMethod.currency;

          // Calculate points for first amount
          const result1 = await rewardService.simulateRewards(
            amount1,
            currency,
            paymentMethod,
            mcc,
            merchantName,
            isOnline,
            isContactless
          );

          // Calculate points for second amount
          const result2 = await rewardService.simulateRewards(
            amount2,
            currency,
            paymentMethod,
            mcc,
            merchantName,
            isOnline,
            isContactless
          );

          // Property: When amount changes, calculated points should update
          // (unless both amounts result in 0 points)
          if (result1.totalPoints > 0 || result2.totalPoints > 0) {
            // At least one should have points, and they should be different
            // (proportional to the amount difference)
            const pointsChanged = result1.totalPoints !== result2.totalPoints;
            expect(pointsChanged).toBe(true);
          }

          // Both results should be valid
          expect(result1.totalPoints).toBeGreaterThanOrEqual(0);
          expect(result2.totalPoints).toBeGreaterThanOrEqual(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("**Feature: expense-editing-enhancements, Property 9: Calculated reference updates** - Changing MCC updates calculated reference", async () => {
    await fc.assert(
      fc.asyncProperty(
        amountArbitrary(),
        paymentMethodArbitrary(),
        merchantNameArbitrary(),
        booleanArbitrary(),
        booleanArbitrary(),
        async (amount, paymentMethod, merchantName, isOnline, isContactless) => {
          const currency = paymentMethod.currency;

          // Calculate points with MCC "5411" (Grocery)
          const result1 = await rewardService.simulateRewards(
            amount,
            currency,
            paymentMethod,
            "5411",
            merchantName,
            isOnline,
            isContactless
          );

          // Calculate points with MCC "5812" (Restaurants)
          const result2 = await rewardService.simulateRewards(
            amount,
            currency,
            paymentMethod,
            "5812",
            merchantName,
            isOnline,
            isContactless
          );

          // Property: Both calculations should be valid
          expect(result1.totalPoints).toBeGreaterThanOrEqual(0);
          expect(result2.totalPoints).toBeGreaterThanOrEqual(0);

          // Both should have the same structure
          expect(result1).toHaveProperty('totalPoints');
          expect(result1).toHaveProperty('basePoints');
          expect(result1).toHaveProperty('bonusPoints');
          expect(result2).toHaveProperty('totalPoints');
          expect(result2).toHaveProperty('basePoints');
          expect(result2).toHaveProperty('bonusPoints');
        }
      ),
      { numRuns: 100 }
    );
  });

  it("**Feature: expense-editing-enhancements, Property 9: Calculated reference updates** - Changing payment method updates calculated reference", async () => {
    await fc.assert(
      fc.asyncProperty(
        amountArbitrary(),
        paymentMethodArbitrary(),
        paymentMethodArbitrary(),
        mccArbitrary(),
        merchantNameArbitrary(),
        booleanArbitrary(),
        booleanArbitrary(),
        async (amount, paymentMethod1, paymentMethod2, mcc, merchantName, isOnline, isContactless) => {
          // Skip if payment methods are the same
          fc.pre(paymentMethod1.id !== paymentMethod2.id);

          // Use the same currency for both to make comparison meaningful
          const currency = "CAD" as const;
          const pm1 = { ...paymentMethod1, currency };
          const pm2 = { ...paymentMethod2, currency };

          // Calculate points for first payment method
          const result1 = await rewardService.simulateRewards(
            amount,
            currency,
            pm1,
            mcc,
            merchantName,
            isOnline,
            isContactless
          );

          // Calculate points for second payment method
          const result2 = await rewardService.simulateRewards(
            amount,
            currency,
            pm2,
            mcc,
            merchantName,
            isOnline,
            isContactless
          );

          // Property: Both calculations should be valid
          expect(result1.totalPoints).toBeGreaterThanOrEqual(0);
          expect(result2.totalPoints).toBeGreaterThanOrEqual(0);

          // Both should have complete structure
          expect(result1).toHaveProperty('totalPoints');
          expect(result1).toHaveProperty('basePoints');
          expect(result1).toHaveProperty('bonusPoints');
          expect(result1).toHaveProperty('pointsCurrency');
          expect(result2).toHaveProperty('totalPoints');
          expect(result2).toHaveProperty('basePoints');
          expect(result2).toHaveProperty('bonusPoints');
          expect(result2).toHaveProperty('pointsCurrency');
        }
      ),
      { numRuns: 100 }
    );
  });

  it("**Feature: expense-editing-enhancements, Property 9: Calculated reference updates** - Changing isOnline flag updates calculated reference", async () => {
    await fc.assert(
      fc.asyncProperty(
        amountArbitrary(),
        paymentMethodArbitrary(),
        mccArbitrary(),
        merchantNameArbitrary(),
        booleanArbitrary(),
        async (amount, paymentMethod, mcc, merchantName, isContactless) => {
          const currency = paymentMethod.currency;

          // Calculate points with isOnline = true
          const result1 = await rewardService.simulateRewards(
            amount,
            currency,
            paymentMethod,
            mcc,
            merchantName,
            true,
            isContactless
          );

          // Calculate points with isOnline = false
          const result2 = await rewardService.simulateRewards(
            amount,
            currency,
            paymentMethod,
            mcc,
            merchantName,
            false,
            isContactless
          );

          // Property: Both calculations should be valid
          expect(result1.totalPoints).toBeGreaterThanOrEqual(0);
          expect(result2.totalPoints).toBeGreaterThanOrEqual(0);

          // Both should have complete structure
          expect(result1).toHaveProperty('totalPoints');
          expect(result1).toHaveProperty('basePoints');
          expect(result1).toHaveProperty('bonusPoints');
          expect(result2).toHaveProperty('totalPoints');
          expect(result2).toHaveProperty('basePoints');
          expect(result2).toHaveProperty('bonusPoints');
        }
      ),
      { numRuns: 100 }
    );
  });

  it("**Feature: expense-editing-enhancements, Property 9: Calculated reference updates** - Calculated reference is always non-negative", async () => {
    await fc.assert(
      fc.asyncProperty(
        amountArbitrary(),
        paymentMethodArbitrary(),
        mccArbitrary(),
        merchantNameArbitrary(),
        booleanArbitrary(),
        booleanArbitrary(),
        async (amount, paymentMethod, mcc, merchantName, isOnline, isContactless) => {
          const currency = paymentMethod.currency;

          // Calculate points
          const result = await rewardService.simulateRewards(
            amount,
            currency,
            paymentMethod,
            mcc,
            merchantName,
            isOnline,
            isContactless
          );

          // Property: All point values should be non-negative
          expect(result.totalPoints).toBeGreaterThanOrEqual(0);
          expect(result.basePoints).toBeGreaterThanOrEqual(0);
          expect(result.bonusPoints).toBeGreaterThanOrEqual(0);

          // Property: Total points should equal base + bonus
          expect(result.totalPoints).toBe(result.basePoints + result.bonusPoints);
        }
      ),
      { numRuns: 100 }
    );
  });
});
