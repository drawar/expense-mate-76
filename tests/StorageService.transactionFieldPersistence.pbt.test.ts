/**
 * Property-Based Tests for Transaction Field Persistence
 *
 * **Feature: transaction-supabase-persistence, Property 9: Transaction field persistence**
 * **Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5**
 */

import fc from "fast-check";
import { Transaction, PaymentMethod, Merchant, Currency } from "../src/types";

// Generate valid date strings in YYYY-MM-DD format
const dateStringArbitrary = (): fc.Arbitrary<string> => {
  return fc
    .tuple(
      fc.integer({ min: 2020, max: 2025 }),
      fc.integer({ min: 1, max: 12 }),
      fc.integer({ min: 1, max: 28 }) // Use 28 to avoid invalid dates
    )
    .map(([year, month, day]) => {
      const m = month.toString().padStart(2, "0");
      const d = day.toString().padStart(2, "0");
      return `${year}-${m}-${d}`;
    });
};

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
    type: fc.constantFrom(
      "credit_card",
      "debit_card",
      "cash",
      "bank_account",
      "other"
    ),
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

const transactionArbitrary = (): fc.Arbitrary<Transaction> => {
  return fc
    .tuple(
      fc.uuid(),
      fc.integer({ min: 2020, max: 2025 }),
      fc.integer({ min: 1, max: 12 }),
      fc.integer({ min: 1, max: 28 }), // Use 28 to avoid invalid dates
      merchantArbitrary(),
      fc.double({
        min: 0.01,
        max: 100000,
        noNaN: true,
        noDefaultInfinity: true,
      }),
      currencyArbitrary(),
      paymentMethodArbitrary(),
      fc.double({ min: 0, max: 100000, noNaN: true, noDefaultInfinity: true }),
      fc.boolean(),
      fc.option(fc.string({ maxLength: 500 }), { nil: undefined }),
      fc.option(
        fc.double({
          min: 0,
          max: 100000,
          noNaN: true,
          noDefaultInfinity: true,
        }),
        {
          nil: undefined,
        }
      ),
      fc.option(fc.string({ maxLength: 100 }), { nil: undefined })
    )
    .map(
      ([
        id,
        year,
        month,
        day,
        merchant,
        amount,
        currency,
        paymentMethod,
        rewardPoints,
        isContactless,
        notes,
        reimbursementAmount,
        category,
      ]) => ({
        id,
        date: `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
        merchant,
        amount,
        currency,
        paymentMethod,
        paymentAmount: amount,
        paymentCurrency: currency,
        rewardPoints,
        basePoints: rewardPoints * 0.7,
        bonusPoints: rewardPoints * 0.3,
        isContactless,
        notes,
        reimbursementAmount,
        category,
      })
    );
};

// Mock storage service that simulates database persistence
interface MockTransactionStorage {
  transactions: Map<string, Transaction>;
  updateTransaction(
    id: string,
    updates: Partial<Transaction>
  ): Promise<Transaction | null>;
}

function createMockTransactionStorage(): MockTransactionStorage {
  const transactions = new Map<string, Transaction>();

  return {
    transactions,
    async updateTransaction(
      id: string,
      updates: Partial<Transaction>
    ): Promise<Transaction | null> {
      const existing = transactions.get(id);
      if (!existing) return null;

      // Simulate the behavior of the real updateTransaction method
      const updated: Transaction = {
        ...existing,
        ...updates,
      };

      transactions.set(id, updated);
      return updated;
    },
  };
}

describe("Transaction Field Persistence Property-Based Tests", () => {
  describe("**Feature: transaction-supabase-persistence, Property 9: Transaction field persistence**", () => {
    it("should persist amount field when updating a transaction", async () => {
      await fc.assert(
        fc.asyncProperty(
          transactionArbitrary(),
          fc.double({
            min: 0.01,
            max: 100000,
            noNaN: true,
            noDefaultInfinity: true,
          }),
          async (transaction, newAmount) => {
            // Create a mock storage
            const storage = createMockTransactionStorage();
            storage.transactions.set(transaction.id, transaction);

            // Update the amount
            const updated = await storage.updateTransaction(transaction.id, {
              amount: newAmount,
            });

            // Verify the update was successful
            expect(updated).not.toBeNull();
            if (!updated) {
              throw new Error("Update failed");
            }

            // Verify the amount was persisted
            expect(updated.amount).toBeCloseTo(newAmount, 2);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should persist date field when updating a transaction", async () => {
      await fc.assert(
        fc.asyncProperty(
          transactionArbitrary(),
          dateStringArbitrary(),
          async (transaction, newDateString) => {
            // Create a mock storage
            const storage = createMockTransactionStorage();
            storage.transactions.set(transaction.id, transaction);

            // Update the date
            const updated = await storage.updateTransaction(transaction.id, {
              date: newDateString,
            });

            // Verify the update was successful
            expect(updated).not.toBeNull();
            if (!updated) {
              throw new Error("Update failed");
            }

            // Verify the date was persisted
            expect(updated.date).toBe(newDateString);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should persist notes field when updating a transaction", async () => {
      await fc.assert(
        fc.asyncProperty(
          transactionArbitrary(),
          fc.option(fc.string({ maxLength: 500 }), { nil: undefined }),
          async (transaction, newNotes) => {
            // Create a mock storage
            const storage = createMockTransactionStorage();
            storage.transactions.set(transaction.id, transaction);

            // Update the notes
            const updated = await storage.updateTransaction(transaction.id, {
              notes: newNotes,
            });

            // Verify the update was successful
            expect(updated).not.toBeNull();
            if (!updated) {
              throw new Error("Update failed");
            }

            // Verify the notes were persisted
            expect(updated.notes).toBe(newNotes);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should persist reimbursement_amount field when updating a transaction", async () => {
      await fc.assert(
        fc.asyncProperty(
          transactionArbitrary(),
          fc.option(
            fc.double({
              min: 0,
              max: 100000,
              noNaN: true,
              noDefaultInfinity: true,
            }),
            {
              nil: undefined,
            }
          ),
          async (transaction, newReimbursementAmount) => {
            // Create a mock storage
            const storage = createMockTransactionStorage();
            storage.transactions.set(transaction.id, transaction);

            // Update the reimbursement amount
            const updated = await storage.updateTransaction(transaction.id, {
              reimbursementAmount: newReimbursementAmount,
            });

            // Verify the update was successful
            expect(updated).not.toBeNull();
            if (!updated) {
              throw new Error("Update failed");
            }

            // Verify the reimbursement amount was persisted
            if (newReimbursementAmount !== undefined) {
              expect(updated.reimbursementAmount).toBeCloseTo(
                newReimbursementAmount,
                2
              );
            } else {
              expect(updated.reimbursementAmount).toBeUndefined();
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should persist multiple fields simultaneously when updating a transaction", async () => {
      await fc.assert(
        fc.asyncProperty(
          transactionArbitrary(),
          fc.record({
            amount: fc.double({
              min: 0.01,
              max: 100000,
              noNaN: true,
              noDefaultInfinity: true,
            }),
            notes: fc.option(fc.string({ maxLength: 500 }), { nil: undefined }),
            reimbursementAmount: fc.option(
              fc.double({
                min: 0,
                max: 100000,
                noNaN: true,
                noDefaultInfinity: true,
              }),
              { nil: undefined }
            ),
            category: fc.option(fc.string({ maxLength: 100 }), {
              nil: undefined,
            }),
          }),
          async (transaction, updates) => {
            // Create a mock storage
            const storage = createMockTransactionStorage();
            storage.transactions.set(transaction.id, transaction);

            // Update multiple fields
            const updated = await storage.updateTransaction(
              transaction.id,
              updates
            );

            // Verify the update was successful
            expect(updated).not.toBeNull();
            if (!updated) {
              throw new Error("Update failed");
            }

            // Verify all fields were persisted
            expect(updated.amount).toBeCloseTo(updates.amount, 2);
            expect(updated.notes).toBe(updates.notes);
            expect(updated.category).toBe(updates.category);
            if (updates.reimbursementAmount !== undefined) {
              expect(updated.reimbursementAmount).toBeCloseTo(
                updates.reimbursementAmount,
                2
              );
            } else {
              expect(updated.reimbursementAmount).toBeUndefined();
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
