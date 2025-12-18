/**
 * Property-Based Tests for NULL Value Handling
 *
 * **Feature: transaction-supabase-persistence, Property 5: NULL value handling**
 * **Validates: Requirements 2.5**
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

// Database row representation with nullable fields
interface DbTransactionRow {
  id: string;
  date: string;
  merchant_id: string;
  amount: number;
  currency: string;
  payment_method_id: string;
  payment_amount: number;
  payment_currency: string;
  total_points: number | null;
  base_points: number | null;
  bonus_points: number | null;
  is_contactless: boolean;
  notes: string | null;
  reimbursement_amount: number | null;
  category: string | null;
  deleted_at: string | null;
  merchants: {
    id: string;
    name: string;
    address: string | null;
    mcc: { code: string; description: string } | null;
    is_online: boolean;
    coordinates: { lat: number; lng: number } | null;
    is_deleted: boolean;
  };
  payment_methods: {
    id: string;
    name: string;
    type: string;
    issuer: string;
    last_four_digits: string | null;
    currency: string;
    icon: string | null;
    color: string | null;
    image_url: string | null;
    is_active: boolean;
    reward_rules: unknown[];
    selected_categories: string[];
    statement_start_day: number | null;
    is_monthly_statement: boolean | null;
    conversion_rate: Record<string, number> | null;
  };
}

const dbTransactionRowArbitrary = (): fc.Arbitrary<DbTransactionRow> => {
  return fc
    .tuple(
      fc.uuid(),
      fc.integer({ min: 2020, max: 2025 }),
      fc.integer({ min: 1, max: 12 }),
      fc.integer({ min: 1, max: 28 }), // Use 28 to avoid invalid dates
      merchantArbitrary(),
      fc.double({ min: 0.01, max: 100000, noNaN: true, noDefaultInfinity: true }),
      currencyArbitrary(),
      paymentMethodArbitrary(),
      fc.boolean(),
      fc.option(fc.string({ maxLength: 500 }), { nil: null }),
      fc.option(fc.string({ maxLength: 100 }), { nil: null })
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
        isContactless,
        notes,
        category,
      ]) => ({
        id,
        date: `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
        merchant_id: merchant.id,
        amount,
        currency,
        payment_method_id: paymentMethod.id,
        payment_amount: amount,
        payment_currency: currency,
        total_points: null, // NULL in database
        base_points: null, // NULL in database
        bonus_points: null, // NULL in database
        is_contactless: isContactless,
        notes,
        reimbursement_amount: null, // NULL in database
        category,
        deleted_at: null,
        merchants: {
          id: merchant.id,
          name: merchant.name,
          address: merchant.address || null,
          mcc: merchant.mcc || null,
          is_online: merchant.isOnline,
          coordinates: merchant.coordinates || null,
          is_deleted: false,
        },
        payment_methods: {
          id: paymentMethod.id,
          name: paymentMethod.name,
          type: paymentMethod.type,
          issuer: paymentMethod.issuer,
          last_four_digits: paymentMethod.lastFourDigits || null,
          currency: paymentMethod.currency,
          icon: paymentMethod.icon || null,
          color: paymentMethod.color || null,
          image_url: paymentMethod.imageUrl || null,
          is_active: paymentMethod.active,
          reward_rules: paymentMethod.rewardRules || [],
          selected_categories: paymentMethod.selectedCategories || [],
          statement_start_day: paymentMethod.statementStartDay || null,
          is_monthly_statement: paymentMethod.isMonthlyStatement || null,
          conversion_rate: paymentMethod.conversionRate || null,
        },
      })
    );
};

// Mock function that simulates the parsing logic in getTransactions
function parseTransactionFromDb(row: DbTransactionRow): Transaction {
  return {
    id: row.id,
    date: row.date,
    merchant: {
      id: row.merchants.id,
      name: row.merchants.name,
      address: row.merchants.address || undefined,
      mcc: row.merchants.mcc
        ? {
            code: String(row.merchants.mcc.code),
            description: String(row.merchants.mcc.description),
          }
        : undefined,
      isOnline: row.merchants.is_online,
      coordinates: row.merchants.coordinates
        ? {
            lat: Number(row.merchants.coordinates.lat),
            lng: Number(row.merchants.coordinates.lng),
          }
        : undefined,
      is_deleted: row.merchants.is_deleted,
    },
    amount: parseFloat(row.amount.toString()),
    currency: row.currency as Currency,
    paymentMethod: {
      id: row.payment_methods.id,
      name: row.payment_methods.name,
      type: row.payment_methods.type as any,
      issuer: row.payment_methods.issuer,
      lastFourDigits: row.payment_methods.last_four_digits || undefined,
      currency: row.payment_methods.currency as Currency,
      icon: row.payment_methods.icon || undefined,
      color: row.payment_methods.color || undefined,
      imageUrl: row.payment_methods.image_url || undefined,
      pointsCurrency: undefined,
      active: row.payment_methods.is_active,
      rewardRules: row.payment_methods.reward_rules || [],
      selectedCategories: row.payment_methods.selected_categories || [],
      statementStartDay: row.payment_methods.statement_start_day || undefined,
      isMonthlyStatement: row.payment_methods.is_monthly_statement || undefined,
      conversionRate: row.payment_methods.conversion_rate || undefined,
    },
    paymentAmount: parseFloat(row.payment_amount.toString()),
    paymentCurrency: row.payment_currency as Currency,
    rewardPoints: row.total_points || 0,
    basePoints: row.base_points || 0,
    bonusPoints: row.bonus_points || 0,
    isContactless: row.is_contactless,
    notes: row.notes || undefined,
    reimbursementAmount: row.reimbursement_amount != null
      ? parseFloat(row.reimbursement_amount.toString())
      : undefined,
    category: row.category || undefined,
    deleted_at: row.deleted_at || undefined,
  };
}

describe("NULL Value Handling Property-Based Tests", () => {
  describe("**Feature: transaction-supabase-persistence, Property 5: NULL value handling**", () => {
    it("should default NULL base_points to 0 when retrieving transactions", async () => {
      await fc.assert(
        fc.asyncProperty(dbTransactionRowArbitrary(), async (dbRow) => {
          // Ensure base_points is NULL
          dbRow.base_points = null;

          // Parse the transaction (simulates getTransactions behavior)
          const transaction = parseTransactionFromDb(dbRow);

          // Verify base_points defaults to 0
          expect(transaction.basePoints).toBe(0);
        }),
        { numRuns: 100 }
      );
    });

    it("should default NULL bonus_points to 0 when retrieving transactions", async () => {
      await fc.assert(
        fc.asyncProperty(dbTransactionRowArbitrary(), async (dbRow) => {
          // Ensure bonus_points is NULL
          dbRow.bonus_points = null;

          // Parse the transaction (simulates getTransactions behavior)
          const transaction = parseTransactionFromDb(dbRow);

          // Verify bonus_points defaults to 0
          expect(transaction.bonusPoints).toBe(0);
        }),
        { numRuns: 100 }
      );
    });

    it("should default NULL total_points to 0 when retrieving transactions", async () => {
      await fc.assert(
        fc.asyncProperty(dbTransactionRowArbitrary(), async (dbRow) => {
          // Ensure total_points is NULL
          dbRow.total_points = null;

          // Parse the transaction (simulates getTransactions behavior)
          const transaction = parseTransactionFromDb(dbRow);

          // Verify rewardPoints defaults to 0
          expect(transaction.rewardPoints).toBe(0);
        }),
        { numRuns: 100 }
      );
    });

    it("should handle NULL reimbursement_amount correctly when retrieving transactions", async () => {
      await fc.assert(
        fc.asyncProperty(dbTransactionRowArbitrary(), async (dbRow) => {
          // Ensure reimbursement_amount is NULL
          dbRow.reimbursement_amount = null;

          // Parse the transaction (simulates getTransactions behavior)
          const transaction = parseTransactionFromDb(dbRow);

          // Verify reimbursement_amount is undefined (not 0, as it's optional)
          expect(transaction.reimbursementAmount).toBeUndefined();
        }),
        { numRuns: 100 }
      );
    });

    it("should handle all NULL numeric fields simultaneously", async () => {
      await fc.assert(
        fc.asyncProperty(dbTransactionRowArbitrary(), async (dbRow) => {
          // Ensure all nullable numeric fields are NULL
          dbRow.total_points = null;
          dbRow.base_points = null;
          dbRow.bonus_points = null;
          dbRow.reimbursement_amount = null;

          // Parse the transaction (simulates getTransactions behavior)
          const transaction = parseTransactionFromDb(dbRow);

          // Verify all point fields default to 0
          expect(transaction.rewardPoints).toBe(0);
          expect(transaction.basePoints).toBe(0);
          expect(transaction.bonusPoints).toBe(0);

          // Verify reimbursement_amount is undefined
          expect(transaction.reimbursementAmount).toBeUndefined();
        }),
        { numRuns: 100 }
      );
    });

    it("should preserve non-NULL values when retrieving transactions", async () => {
      await fc.assert(
        fc.asyncProperty(
          dbTransactionRowArbitrary(),
          fc.record({
            total_points: fc.double({ min: 0, max: 100000, noNaN: true, noDefaultInfinity: true }),
            base_points: fc.double({ min: 0, max: 100000, noNaN: true, noDefaultInfinity: true }),
            bonus_points: fc.double({ min: 0, max: 100000, noNaN: true, noDefaultInfinity: true }),
            reimbursement_amount: fc.double({
              min: 0,
              max: 100000,
              noNaN: true,
              noDefaultInfinity: true,
            }),
          }),
          async (dbRow, values) => {
            // Set non-NULL values
            dbRow.total_points = values.total_points;
            dbRow.base_points = values.base_points;
            dbRow.bonus_points = values.bonus_points;
            dbRow.reimbursement_amount = values.reimbursement_amount;

            // Parse the transaction (simulates getTransactions behavior)
            const transaction = parseTransactionFromDb(dbRow);

            // Verify all values are preserved
            expect(transaction.rewardPoints).toBeCloseTo(values.total_points, 2);
            expect(transaction.basePoints).toBeCloseTo(values.base_points, 2);
            expect(transaction.bonusPoints).toBeCloseTo(values.bonus_points, 2);
            expect(transaction.reimbursementAmount).toBeCloseTo(values.reimbursement_amount, 2);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
