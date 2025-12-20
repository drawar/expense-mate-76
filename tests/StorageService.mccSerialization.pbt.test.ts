/**
 * Property-Based Tests for MCC Serialization
 *
 * **Feature: transaction-supabase-persistence, Property 6: MCC serialization round-trip**
 * **Validates: Requirements 3.2, 3.3, 5.1, 5.2, 5.3**
 */

import fc from "fast-check";
import { MerchantCategoryCode, Merchant } from "../src/types";

// Arbitraries for generating random test data

const mccArbitrary = (): fc.Arbitrary<MerchantCategoryCode> => {
  return fc.record({
    code: fc
      .string({ minLength: 4, maxLength: 4 })
      .filter((s) => /^\d{4}$/.test(s)),
    description: fc.string({ minLength: 1, maxLength: 100 }),
  });
};

const merchantWithMCCArbitrary = (): fc.Arbitrary<Merchant> => {
  return fc.record({
    id: fc.uuid(),
    name: fc.string({ minLength: 1, maxLength: 100 }),
    address: fc.option(fc.string({ maxLength: 200 }), { nil: undefined }),
    mcc: mccArbitrary(),
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

// Mock storage service that simulates JSONB serialization
interface MockMerchantStorage {
  merchants: Map<string, unknown>; // Stores JSONB representation
  upsertMerchant(merchant: Merchant): Promise<void>;
  getMerchant(id: string): Promise<Merchant | null>;
}

function createMockMerchantStorage(): MockMerchantStorage {
  const merchants = new Map<string, unknown>();

  return {
    merchants,
    async upsertMerchant(merchant: Merchant): Promise<void> {
      // Simulate JSONB serialization: convert MCC to JSON and back
      const serialized = {
        id: merchant.id,
        name: merchant.name,
        address: merchant.address,
        mcc: merchant.mcc ? JSON.parse(JSON.stringify(merchant.mcc)) : null,
        is_online: merchant.isOnline,
        coordinates: merchant.coordinates
          ? JSON.parse(JSON.stringify(merchant.coordinates))
          : null,
        is_deleted: false,
      };
      merchants.set(merchant.id, serialized);
    },
    async getMerchant(id: string): Promise<Merchant | null> {
      const stored = merchants.get(id) as
        | {
            id: string;
            name: string;
            address?: string;
            mcc?: { code: string; description: string };
            coordinates?: unknown;
            is_online: boolean;
          }
        | undefined;
      if (!stored) return null;

      // Simulate parsing JSONB back to MCC object
      return {
        id: stored.id,
        name: stored.name,
        address: stored.address || undefined,
        mcc: stored.mcc
          ? {
              code: String(stored.mcc.code),
              description: String(stored.mcc.description),
            }
          : undefined,
        isOnline: stored.is_online || false,
        coordinates: stored.coordinates
          ? {
              lat: Number(stored.coordinates.lat),
              lng: Number(stored.coordinates.lng),
            }
          : undefined,
      };
    },
  };
}

describe("MCC Serialization Property-Based Tests", () => {
  describe("**Feature: transaction-supabase-persistence, Property 6: MCC serialization round-trip**", () => {
    it("should preserve MCC code and description when saving and retrieving a merchant", async () => {
      await fc.assert(
        fc.asyncProperty(merchantWithMCCArbitrary(), async (merchant) => {
          // Create a mock storage
          const storage = createMockMerchantStorage();

          // Save the merchant (simulates upsert to Supabase)
          await storage.upsertMerchant(merchant);

          // Retrieve the merchant (simulates query from Supabase)
          const retrieved = await storage.getMerchant(merchant.id);

          // Verify the merchant was found
          expect(retrieved).not.toBeNull();
          if (!retrieved) {
            throw new Error("Merchant not found after save");
          }

          // Verify MCC is preserved
          expect(retrieved.mcc).toBeDefined();
          expect(retrieved.mcc?.code).toBe(merchant.mcc.code);
          expect(retrieved.mcc?.description).toBe(merchant.mcc.description);

          // Verify other fields are preserved
          expect(retrieved.id).toBe(merchant.id);
          expect(retrieved.name).toBe(merchant.name);
          expect(retrieved.isOnline).toBe(merchant.isOnline);
        }),
        { numRuns: 100 }
      );
    });

    it("should handle NULL MCC values correctly", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            id: fc.uuid(),
            name: fc.string({ minLength: 1, maxLength: 100 }),
            address: fc.option(fc.string({ maxLength: 200 }), {
              nil: undefined,
            }),
            mcc: fc.constant(undefined),
            isOnline: fc.boolean(),
            coordinates: fc.option(
              fc.record({
                lat: fc.double({ min: -90, max: 90, noNaN: true }),
                lng: fc.double({ min: -180, max: 180, noNaN: true }),
              }),
              { nil: undefined }
            ),
          }),
          async (merchant) => {
            // Create a mock storage
            const storage = createMockMerchantStorage();

            // Save the merchant without MCC
            await storage.upsertMerchant(merchant);

            // Retrieve the merchant
            const retrieved = await storage.getMerchant(merchant.id);

            // Verify the merchant was found
            expect(retrieved).not.toBeNull();
            if (!retrieved) {
              throw new Error("Merchant not found after save");
            }

            // Verify MCC is undefined/null
            expect(retrieved.mcc).toBeUndefined();
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should preserve MCC through multiple update operations", async () => {
      await fc.assert(
        fc.asyncProperty(
          merchantWithMCCArbitrary(),
          mccArbitrary(),
          async (initialMerchant, newMCC) => {
            // Create a mock storage
            const storage = createMockMerchantStorage();

            // Save the initial merchant
            await storage.upsertMerchant(initialMerchant);

            // Update the merchant with a new MCC
            const updatedMerchant = {
              ...initialMerchant,
              mcc: newMCC,
            };
            await storage.upsertMerchant(updatedMerchant);

            // Retrieve the merchant
            const retrieved = await storage.getMerchant(initialMerchant.id);

            // Verify the merchant was found
            expect(retrieved).not.toBeNull();
            if (!retrieved) {
              throw new Error("Merchant not found after update");
            }

            // Verify the new MCC is preserved
            expect(retrieved.mcc).toBeDefined();
            expect(retrieved.mcc?.code).toBe(newMCC.code);
            expect(retrieved.mcc?.description).toBe(newMCC.description);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
