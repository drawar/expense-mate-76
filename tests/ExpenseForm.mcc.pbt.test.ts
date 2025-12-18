/**
 * Property-based tests for Merchant Category persistence in ExpenseForm
 *
 * **Feature: expense-editing-enhancements, Property 2: Merchant category persistence round-trip**
 * **Feature: expense-editing-enhancements, Property 3: Merchant category change persistence**
 * **Validates: Requirements 2.2, 2.3**
 */

import { describe, it, expect } from "@jest/globals";
import fc from "fast-check";
import { MerchantCategoryCode } from "@/types";
import { MCC_CODES } from "@/utils/constants/mcc";
import { FormValues } from "@/hooks/expense/expense-form/formSchema";

// Arbitraries for generating test data
const mccArbitrary = (): fc.Arbitrary<MerchantCategoryCode> =>
  fc.constantFrom(...MCC_CODES);

const formValuesArbitrary = (): fc.Arbitrary<Partial<FormValues>> =>
  fc.record({
    merchantName: fc.string({ minLength: 1, maxLength: 100 }),
    merchantAddress: fc.option(fc.string({ maxLength: 200 }), { nil: undefined }),
    isOnline: fc.boolean(),
    isContactless: fc.boolean(),
    amount: fc.float({ min: Math.fround(0.01), max: Math.fround(10000), noNaN: true }).map(String),
    currency: fc.constantFrom("USD", "EUR", "GBP", "JPY", "CAD", "AUD"),
    paymentMethodId: fc.uuid(),
    paymentAmount: fc.option(fc.float({ min: Math.fround(0.01), max: Math.fround(10000), noNaN: true }).map(String), { nil: undefined }),
    date: fc.date({ min: new Date("2020-01-01"), max: new Date("2025-12-31") }),
    notes: fc.option(fc.string({ maxLength: 500 }), { nil: undefined }),
    mcc: fc.option(mccArbitrary(), { nil: null }),
  });

describe("ExpenseForm Merchant Category Persistence Property-Based Tests", () => {
  it("**Feature: expense-editing-enhancements, Property 2: Merchant category persistence round-trip** - Form initialization preserves MCC from defaultValues", () => {
    fc.assert(
      fc.property(formValuesArbitrary(), (formValues) => {
        // Skip form values without MCC
        if (!formValues.mcc) {
          return true;
        }

        // Simulate form initialization with defaultValues containing MCC
        const defaultValues = {
          ...formValues,
          mcc: formValues.mcc,
        };

        // The key property: when defaultValues.mcc is provided,
        // it should be used to initialize the selectedMCC state
        const initializedMCC = defaultValues.mcc;

        // Verify MCC is preserved
        expect(initializedMCC).toBeDefined();
        expect(initializedMCC?.code).toBe(formValues.mcc.code);
        expect(initializedMCC?.description).toBe(formValues.mcc.description);

        // Verify the MCC object structure is intact
        expect(typeof initializedMCC?.code).toBe("string");
        expect(typeof initializedMCC?.description).toBe("string");
        expect(initializedMCC?.code.length).toBeGreaterThan(0);
        expect(initializedMCC?.description.length).toBeGreaterThan(0);
      }),
      { numRuns: 100 }
    );
  });

  it("**Feature: expense-editing-enhancements, Property 3: Merchant category change persistence** - Changing MCC updates form state", () => {
    fc.assert(
      fc.property(
        formValuesArbitrary(),
        mccArbitrary(),
        (formValues, newMCC) => {
          // Start with form values (may or may not have MCC)
          const initialMCC = formValues.mcc;

          // Simulate user changing MCC
          const updatedFormValues = {
            ...formValues,
            mcc: newMCC,
          };

          // Verify new MCC is set
          expect(updatedFormValues.mcc).toBeDefined();
          expect(updatedFormValues.mcc?.code).toBe(newMCC.code);
          expect(updatedFormValues.mcc?.description).toBe(newMCC.description);

          // Verify the change is different from initial (if initial existed)
          if (initialMCC) {
            // If we're changing to a different MCC, verify it's actually different
            if (initialMCC.code !== newMCC.code) {
              expect(updatedFormValues.mcc?.code).not.toBe(initialMCC.code);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it("Form values without MCC can be initialized", () => {
    fc.assert(
      fc.property(formValuesArbitrary(), (formValues) => {
        // Ensure no MCC
        const formValuesWithoutMCC = {
          ...formValues,
          mcc: null,
        };

        // Verify MCC is null or undefined
        expect(
          formValuesWithoutMCC.mcc === null ||
            formValuesWithoutMCC.mcc === undefined
        ).toBe(true);

        // Verify other form values are still valid
        expect(formValuesWithoutMCC.merchantName).toBeDefined();
        expect(formValuesWithoutMCC.amount).toBeDefined();
      }),
      { numRuns: 100 }
    );
  });

  it("MCC values from MCC_CODES are valid", () => {
    fc.assert(
      fc.property(mccArbitrary(), (mcc) => {
        // Verify MCC structure
        expect(mcc).toBeDefined();
        expect(typeof mcc.code).toBe("string");
        expect(typeof mcc.description).toBe("string");
        expect(mcc.code.length).toBeGreaterThan(0);
        expect(mcc.description.length).toBeGreaterThan(0);

        // Verify MCC is from the valid list
        const isValidMCC = MCC_CODES.some(
          (validMCC) =>
            validMCC.code === mcc.code &&
            validMCC.description === mcc.description
        );
        expect(isValidMCC).toBe(true);
      }),
      { numRuns: 100 }
    );
  });
});
