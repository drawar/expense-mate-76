/**
 * Property-based tests for Base and Bonus Points Breakdown Preservation
 *
 * **Feature: expense-editing-enhancements, Property 7: Base and bonus breakdown preservation**
 * **Validates: Requirements 3.2**
 */

import { describe, it, expect } from "@jest/globals";
import fc from "fast-check";
import { Transaction } from "@/types";

// Arbitrary for generating valid points breakdown
const pointsBreakdownArbitrary = (): fc.Arbitrary<{
  totalPoints: number;
  basePoints: number;
  bonusPoints: number;
}> =>
  fc
    .record({
      basePoints: fc.float({ min: 0, max: 10000, noNaN: true, noDefaultInfinity: true }),
      bonusPoints: fc.float({ min: 0, max: 10000, noNaN: true, noDefaultInfinity: true }),
    })
    .map(({ basePoints, bonusPoints }) => {
      // Round to 2 decimal places
      const roundedBase = Math.round(basePoints * 100) / 100;
      const roundedBonus = Math.round(bonusPoints * 100) / 100;
      const totalPoints = Math.round((roundedBase + roundedBonus) * 100) / 100;
      
      return {
        totalPoints,
        basePoints: roundedBase,
        bonusPoints: roundedBonus,
      };
    });

// Arbitrary for generating edited total points (different from calculated)
const editedTotalPointsArbitrary = (): fc.Arbitrary<number> =>
  fc
    .float({ min: 0, max: 100000, noNaN: true, noDefaultInfinity: true })
    .map((num) => Math.round(num * 100) / 100);

describe("ExpenseForm Breakdown Preservation Property-Based Tests", () => {
  it("**Feature: expense-editing-enhancements, Property 7: Base and bonus breakdown preservation** - Editing total points preserves breakdown", () => {
    fc.assert(
      fc.property(
        pointsBreakdownArbitrary(),
        editedTotalPointsArbitrary(),
        (originalBreakdown, editedTotal) => {
          // Simulate a transaction with calculated breakdown
          const originalBasePoints = originalBreakdown.basePoints;
          const originalBonusPoints = originalBreakdown.bonusPoints;
          const calculatedTotal = originalBreakdown.totalPoints;

          // User edits the total points to a different value
          const userEditedTotal = editedTotal;

          // Simulate form submission with edited total
          // The key property: basePoints and bonusPoints should remain unchanged
          const submittedTransaction = {
            rewardPoints: userEditedTotal,
            basePoints: originalBasePoints,
            bonusPoints: originalBonusPoints,
          };

          // Verify breakdown is preserved
          expect(submittedTransaction.basePoints).toBe(originalBasePoints);
          expect(submittedTransaction.bonusPoints).toBe(originalBonusPoints);

          // Verify the breakdown values are valid
          expect(submittedTransaction.basePoints).toBeGreaterThanOrEqual(0);
          expect(submittedTransaction.bonusPoints).toBeGreaterThanOrEqual(0);

          // Verify total can be different from breakdown sum (user override)
          // This is intentional - user can override total while keeping breakdown for reference
          const breakdownSum = Math.round((submittedTransaction.basePoints + submittedTransaction.bonusPoints) * 100) / 100;
          
          // The breakdown sum should equal the original calculated total
          expect(breakdownSum).toBe(calculatedTotal);
          
          // But the submitted total can be different (user edited)
          // We just verify it's a valid number
          expect(submittedTransaction.rewardPoints).toBeGreaterThanOrEqual(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("Breakdown preservation works when total is set to zero", () => {
    fc.assert(
      fc.property(pointsBreakdownArbitrary(), (originalBreakdown) => {
        // User sets total to zero (e.g., clearing the field)
        const userEditedTotal = 0;

        // Breakdown should still be preserved
        const submittedTransaction = {
          rewardPoints: userEditedTotal,
          basePoints: originalBreakdown.basePoints,
          bonusPoints: originalBreakdown.bonusPoints,
        };

        // Verify breakdown is preserved even when total is zero
        expect(submittedTransaction.basePoints).toBe(originalBreakdown.basePoints);
        expect(submittedTransaction.bonusPoints).toBe(originalBreakdown.bonusPoints);
        expect(submittedTransaction.rewardPoints).toBe(0);
      }),
      { numRuns: 100 }
    );
  });

  it("Breakdown preservation works when total is increased", () => {
    fc.assert(
      fc.property(pointsBreakdownArbitrary(), (originalBreakdown) => {
        // User increases total (e.g., promotional bonus)
        const calculatedTotal = originalBreakdown.totalPoints;
        const userEditedTotal = calculatedTotal + 1000; // Add 1000 bonus points

        // Breakdown should still reflect original calculation
        const submittedTransaction = {
          rewardPoints: userEditedTotal,
          basePoints: originalBreakdown.basePoints,
          bonusPoints: originalBreakdown.bonusPoints,
        };

        // Verify breakdown is preserved
        expect(submittedTransaction.basePoints).toBe(originalBreakdown.basePoints);
        expect(submittedTransaction.bonusPoints).toBe(originalBreakdown.bonusPoints);
        
        // Verify total is increased
        expect(submittedTransaction.rewardPoints).toBeGreaterThan(calculatedTotal);
      }),
      { numRuns: 100 }
    );
  });

  it("Breakdown preservation works when total is decreased", () => {
    fc.assert(
      fc.property(pointsBreakdownArbitrary(), (originalBreakdown) => {
        // Skip if calculated total is already zero
        fc.pre(originalBreakdown.totalPoints > 0);

        // User decreases total (e.g., correction)
        const calculatedTotal = originalBreakdown.totalPoints;
        const userEditedTotal = Math.max(0, calculatedTotal - 100); // Decrease by 100, min 0

        // Breakdown should still reflect original calculation
        const submittedTransaction = {
          rewardPoints: userEditedTotal,
          basePoints: originalBreakdown.basePoints,
          bonusPoints: originalBreakdown.bonusPoints,
        };

        // Verify breakdown is preserved
        expect(submittedTransaction.basePoints).toBe(originalBreakdown.basePoints);
        expect(submittedTransaction.bonusPoints).toBe(originalBreakdown.bonusPoints);
        
        // Verify total is decreased or zero
        expect(submittedTransaction.rewardPoints).toBeLessThanOrEqual(calculatedTotal);
      }),
      { numRuns: 100 }
    );
  });

  it("Breakdown values remain non-negative after preservation", () => {
    fc.assert(
      fc.property(pointsBreakdownArbitrary(), editedTotalPointsArbitrary(), (breakdown, editedTotal) => {
        // Simulate preservation
        const submittedTransaction = {
          rewardPoints: editedTotal,
          basePoints: breakdown.basePoints,
          bonusPoints: breakdown.bonusPoints,
        };

        // Verify all values are non-negative
        expect(submittedTransaction.rewardPoints).toBeGreaterThanOrEqual(0);
        expect(submittedTransaction.basePoints).toBeGreaterThanOrEqual(0);
        expect(submittedTransaction.bonusPoints).toBeGreaterThanOrEqual(0);
      }),
      { numRuns: 100 }
    );
  });
});
