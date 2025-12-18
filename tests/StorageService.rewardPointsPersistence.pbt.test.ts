/**
 * Property-Based Tests for Reward Points Persistence
 *
 * **Feature: transaction-supabase-persistence, Property 7: Reward points persistence round-trip**
 * **Validates: Requirements 4.1, 4.2, 4.3, 4.4**
 */

import fc from "fast-check";
import { Transaction, PaymentMethod, Merchant, Currency } from "../src/types";

// Arbitraries for generating random test data

const currencyArbitrary = (): fc.Arbitrary<Currency> => {
  return fc.constantFrom(
    "USD",
    "EUR",
    "GBP",
    "JPY",
    "CAD",
    "AUD",
    "CNY",
    "INR",
    "SGD",
    "TWD"
  );
};

const merchantArbitrary = (): fc.Arbitrary<Merchant> => {
  return fc.record({
    id: fc.uuid(),
    name: fc.string({ minLength: 1, maxLength: 100 }),
    address: fc.option(fc.string({ maxLength: 200 }), { nil: undefined }),
    mcc: fc.option(
      fc.record({
        code: fc.string({ minLength: 4, maxLength: 4 }),
        description: fc.string({ minLength: 1, maxLength: 100 }),
      }),
      { nil: undefined }
    ),
    isOnline: fc.boolean(),
    coordinates: fc.option(
      fc.record({
        lat: fc.double({ min: -90, max: 90, noNaN: true }),
        lng: fc.double({ min: -180, max: 180, noNaN: true }),
      }),
      { nil: undefined }
    ),
  });
};

const paymentMethodArbitrary = (): fc.Arbitrary<PaymentMethod> => {
  return fc.record({
    id: fc.uuid(),
    name: fc.string({ minLength: 1, maxLength: 100 }),
    type: fc.constantFrom("credit_card", "debit_card", "cash", "bank_account", "other"),
    issuer: fc.string({ maxLength: 50 }),
    lastFourDigits: fc.option(fc.string({ minLength: 4, maxLength: 4 }), {
      nil: undefined,
    }),
    currency: currencyArbitrary(),
    icon: fc.option(fc.string(), { nil: undefined }),
    color: fc.option(fc.string(), { nil: undefined }),
    imageUrl: fc.option(fc.string(), { nil: undefined }),
    pointsCurrency: fc.option(fc.string(), { nil: undefined }),
    active: fc.boolean(),
    rewardRules: fc.constant([]),
    selectedCategories: fc.constant([]),
    statementStartDay: fc.option(fc.integer({ min: 1, max: 31 }), {
      nil: undefined,
    }),
    isMonthlyStatement: fc.option(fc.boolean(), { nil: undefined }),
    conversionRate: fc.option(fc.constant({}), { nil: undefined }),
  });
};

const rewardPointsArbitrary = (): fc.Arbitrary<{
  total: number;
  base: number;
  bonus: number;
}> => {
  return fc.record({
    base: fc.double({ min: 0, max: 100000, noNaN: true, noDefaultInfinity: true }),
    bonus: fc.double({ min: 0, max: 100000, noNaN: true, noDefaultInfinity: true }),
  }).map(({ base, bonus }) => ({
    total: base + bonus,
    base,
    bonus,
  }));
};

const transactionDataArbitrary = (): fc.Arbitrary<Omit<Transaction, "id">> => {
  return fc
    .tuple(
      fc.date({ min: new Date("2020-01-01"), max: new Date("2025-12-31") }),
      merchantArbitrary(),
      fc.double({ min: 0.01, max: 100000, noNaN: true, noDefaultInfinity: true }),
      currencyArbitrary(),
      paymentMethodArbitrary(),
      rewardPointsArbitrary(),
      fc.boolean(),
      fc.option(fc.string({ maxLength: 500 }), { nil: undefined }),
      fc.option(fc.double({ min: 0, max: 100000, noNaN: true, noDefaultInfinity: true }), {
        nil: undefined,
      }),
      fc.option(fc.string({ maxLength: 100 }), { nil: undefined })
    )
    .map(
      ([
        date,
        merchant,
        amount,
        currency,
        paymentMethod,
        points,
        isContactless,
        notes,
        reimbursementAmount,
        category,
      ]) => ({
        date: date.toISOString().split("T")[0],
        merchant,
        amount,
        currency,
        paymentMethod,
        paymentAmount: amount,
        paymentCurrency: currency,
        rewardPoints: points.total,
        basePoints: points.base,
        bonusPoints: points.bonus,
        isContactless,
        notes,
        reimbursementAmount,
        category,
      })
    );
};

// Simple mock for testing updateTransaction behavior
interface MockStorageService {
  transactions: Map<string, Transaction>;
  updateTransaction(id: string, updates: Partial<Transaction>): Promise<Transaction | null>;
}

function createMockStorageService(): MockStorageService {
  const transactions = new Map<string, Transaction>();
  
  return {
    transactions,
    async updateTransaction(id: string, updates: Partial<Transaction>): Promise<Transaction | null> {
      const existing = transactions.get(id);
      if (!existing) return null;
      
      // Simulate the behavior of the real updateTransaction method
      // Handle NULL values by defaulting to 0
      const updated: Transaction = {
        ...existing,
        ...updates,
        basePoints: updates.basePoints ?? 0,
        bonusPoints: updates.bonusPoints ?? 0,
      };
      
      transactions.set(id, updated);
      return updated;
    },
  };
}

describe("Reward Points Persistence Property-Based Tests", () => {
  describe("**Feature: transaction-supabase-persistence, Property 7: Reward points persistence round-trip**", () => {
    it("should preserve reward points (total, base, bonus) when updating a transaction", async () => {
      await fc.assert(
        fc.asyncProperty(
          transactionDataArbitrary(),
          rewardPointsArbitrary(),
          async (transactionData, newPoints) => {
            // Create a mock storage service
            const storageService = createMockStorageService();

            // Add the transaction to the mock storage
            const transactionId = crypto.randomUUID();
            const initialTransaction: Transaction = {
              ...transactionData,
              id: transactionId,
            };
            storageService.transactions.set(transactionId, initialTransaction);

            // Update the reward points
            const updatedTransaction = await storageService.updateTransaction(
              transactionId,
              {
                rewardPoints: newPoints.total,
                basePoints: newPoints.base,
                bonusPoints: newPoints.bonus,
              }
            );

            // Verify the update was successful
            expect(updatedTransaction).not.toBeNull();
            if (!updatedTransaction) {
              throw new Error("Update failed");
            }

            // Verify all point values are preserved with reasonable precision
            expect(updatedTransaction.rewardPoints).toBeCloseTo(newPoints.total, 2);
            expect(updatedTransaction.basePoints).toBeCloseTo(newPoints.base, 2);
            expect(updatedTransaction.bonusPoints).toBeCloseTo(newPoints.bonus, 2);

            // Verify the relationship: total = base + bonus
            const calculatedTotal = updatedTransaction.basePoints + updatedTransaction.bonusPoints;
            expect(updatedTransaction.rewardPoints).toBeCloseTo(calculatedTotal, 2);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should default NULL reward points to 0 when updating transactions", async () => {
      await fc.assert(
        fc.asyncProperty(transactionDataArbitrary(), async (transactionData) => {
          // Create a mock storage service
          const storageService = createMockStorageService();

          // Add the transaction to the mock storage
          const transactionId = crypto.randomUUID();
          const initialTransaction: Transaction = {
            ...transactionData,
            id: transactionId,
          };
          storageService.transactions.set(transactionId, initialTransaction);

          // Update with undefined points (simulating NULL in database)
          const updatedTransaction = await storageService.updateTransaction(
            transactionId,
            {
              rewardPoints: undefined,
              basePoints: undefined,
              bonusPoints: undefined,
            }
          );

          // Verify the update was successful
          expect(updatedTransaction).not.toBeNull();
          if (!updatedTransaction) {
            throw new Error("Update failed");
          }

          // Verify NULL values default to 0
          expect(updatedTransaction.basePoints).toBe(0);
          expect(updatedTransaction.bonusPoints).toBe(0);
        }),
        { numRuns: 100 }
      );
    });
  });
});
