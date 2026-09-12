import { computePeriodEnd } from "../src/utils/budget/computePeriodEnd";

describe("computePeriodEnd", () => {
  describe("biweekly", () => {
    it("adds 14 days to a mid-month start", () => {
      expect(computePeriodEnd("2026-09-05", "biweekly")).toBe("2026-09-19");
    });

    it("crosses month boundaries", () => {
      expect(computePeriodEnd("2026-08-25", "biweekly")).toBe("2026-09-08");
    });

    it("crosses year boundaries", () => {
      expect(computePeriodEnd("2026-12-25", "biweekly")).toBe("2027-01-08");
    });
  });

  describe("monthly", () => {
    it("adds one calendar month to a mid-month start", () => {
      expect(computePeriodEnd("2026-03-15", "monthly")).toBe("2026-04-15");
    });

    it("clamps to shorter target month (Jan 31 → Feb 28 in non-leap year)", () => {
      expect(computePeriodEnd("2026-01-31", "monthly")).toBe("2026-02-28");
    });

    it("clamps to shorter target month (Jan 31 → Feb 29 in leap year)", () => {
      expect(computePeriodEnd("2024-01-31", "monthly")).toBe("2024-02-29");
    });

    it("crosses year boundary", () => {
      expect(computePeriodEnd("2026-12-15", "monthly")).toBe("2027-01-15");
    });
  });

  describe("semi_monthly", () => {
    it("start on 1st → last day of same month", () => {
      expect(computePeriodEnd("2026-09-01", "semi_monthly")).toBe("2026-09-30");
    });

    it("start on 14th → last day of same month", () => {
      expect(computePeriodEnd("2026-09-14", "semi_monthly")).toBe("2026-09-30");
    });

    it("start on 15th → last day of same month", () => {
      expect(computePeriodEnd("2026-09-15", "semi_monthly")).toBe("2026-09-30");
    });

    it("start on 16th → 15th of next month", () => {
      expect(computePeriodEnd("2026-08-16", "semi_monthly")).toBe("2026-09-15");
    });

    it("start on 28th → 15th of next month", () => {
      expect(computePeriodEnd("2026-08-28", "semi_monthly")).toBe("2026-09-15");
    });

    it("start on last day of Feb (non-leap) → 15th of March", () => {
      expect(computePeriodEnd("2026-02-28", "semi_monthly")).toBe("2026-03-15");
    });

    it("crosses year boundary", () => {
      expect(computePeriodEnd("2026-12-28", "semi_monthly")).toBe("2027-01-15");
    });
  });
});
