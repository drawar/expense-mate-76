// src/core/forecast/SpenderProfiler.ts
import { Transaction } from "@/types";
import { SpenderProfile, IntraMonthDistribution } from "./types";
import { PROFILE_THRESHOLDS, PROFILE_CURVES } from "./constants";

/**
 * Classifies users into spending behavior profiles based on their
 * intra-month spending distribution.
 */
export class SpenderProfiler {
  /**
   * Classify user's spending behavior profile
   */
  classify(transactions: Transaction[]): SpenderProfile {
    if (transactions.length < PROFILE_THRESHOLDS.MIN_TRANSACTIONS) {
      return "variable"; // Not enough data
    }

    const distribution = this.calculateIntraMonthDistribution(transactions);
    const paydaySpikes = this.detectPaydaySpikes(transactions);

    // Check for payday spiker first (most distinctive pattern)
    if (paydaySpikes.detected) {
      return "payday-spiker";
    }

    // Check for front-loader
    if (
      distribution.total > 0 &&
      distribution.firstThird / distribution.total >
        PROFILE_THRESHOLDS.FRONT_LOADER_THRESHOLD
    ) {
      return "front-loader";
    }

    // Check for back-loader
    if (
      distribution.total > 0 &&
      distribution.lastThird / distribution.total >
        PROFILE_THRESHOLDS.BACK_LOADER_THRESHOLD
    ) {
      return "back-loader";
    }

    // Check for steady spender
    if (this.isUniformDistribution(distribution)) {
      return "steady";
    }

    return "variable";
  }

  /**
   * Calculate intra-month spending distribution
   * Divides month into thirds: days 1-10, 11-20, 21-31
   */
  calculateIntraMonthDistribution(
    transactions: Transaction[]
  ): IntraMonthDistribution {
    let firstThird = 0;
    let middleThird = 0;
    let lastThird = 0;

    transactions.forEach((tx) => {
      const dayOfMonth = new Date(tx.date).getDate();
      const amount = this.getAmount(tx);

      if (dayOfMonth <= 10) {
        firstThird += amount;
      } else if (dayOfMonth <= 20) {
        middleThird += amount;
      } else {
        lastThird += amount;
      }
    });

    return {
      firstThird,
      middleThird,
      lastThird,
      total: firstThird + middleThird + lastThird,
    };
  }

  /**
   * Detect payday spending spikes (around 1st and 15th)
   */
  private detectPaydaySpikes(transactions: Transaction[]): {
    detected: boolean;
    days: number[];
  } {
    // Group daily spending
    const dailyTotals = new Map<number, number>();
    const dailyCounts = new Map<number, number>();

    transactions.forEach((tx) => {
      const dayOfMonth = new Date(tx.date).getDate();
      const amount = this.getAmount(tx);

      dailyTotals.set(dayOfMonth, (dailyTotals.get(dayOfMonth) || 0) + amount);
      dailyCounts.set(dayOfMonth, (dailyCounts.get(dayOfMonth) || 0) + 1);
    });

    // Calculate average for each day
    const dailyAverages = new Map<number, number>();
    dailyTotals.forEach((total, day) => {
      const count = dailyCounts.get(day) || 1;
      dailyAverages.set(day, total / count);
    });

    // Calculate overall daily average
    const allAverages = Array.from(dailyAverages.values());
    const overallAverage =
      allAverages.length > 0
        ? allAverages.reduce((a, b) => a + b, 0) / allAverages.length
        : 0;

    if (overallAverage <= 0) {
      return { detected: false, days: [] };
    }

    // Check for spikes around common paydays
    const paydayRanges = [
      { center: 1, range: 3 }, // Around 1st
      { center: 15, range: 3 }, // Around 15th
    ];

    let spikesDetected = 0;
    const spikeDays: number[] = [];

    paydayRanges.forEach(({ center, range }) => {
      let maxSpending = 0;
      let maxDay = center;

      for (let day = center - range; day <= center + range; day++) {
        const normalizedDay = day <= 0 ? day + 31 : day > 31 ? day - 31 : day;
        const avg = dailyAverages.get(normalizedDay) || 0;
        if (avg > maxSpending) {
          maxSpending = avg;
          maxDay = normalizedDay;
        }
      }

      if (
        maxSpending >
        overallAverage * PROFILE_THRESHOLDS.PAYDAY_SPIKE_MULTIPLIER
      ) {
        spikesDetected++;
        spikeDays.push(maxDay);
      }
    });

    return {
      detected: spikesDetected >= 1, // At least one payday spike
      days: spikeDays,
    };
  }

  /**
   * Check if distribution is approximately uniform
   */
  private isUniformDistribution(distribution: IntraMonthDistribution): boolean {
    if (distribution.total <= 0) return true;

    const ratios = [
      distribution.firstThird / distribution.total,
      distribution.middleThird / distribution.total,
      distribution.lastThird / distribution.total,
    ];

    // For uniform, each third should have ~33%
    // Allow for STEADY_MAX_VARIANCE (15%) deviation
    const idealRatio = 1 / 3;
    const maxDeviation = PROFILE_THRESHOLDS.STEADY_MAX_VARIANCE;

    return ratios.every(
      (ratio) => Math.abs(ratio - idealRatio) <= maxDeviation
    );
  }

  /**
   * Get distribution curve weights for a profile
   * Returns array of 31 weights (day 1 to day 31)
   */
  getDistributionCurve(profile: SpenderProfile): number[] {
    const curve = PROFILE_CURVES[profile] || PROFILE_CURVES.variable;

    // Normalize curve so sum = 31 (average weight of 1 per day)
    const sum = curve.reduce((a, b) => a + b, 0);
    const normalizedCurve = curve.map((w) => (w * 31) / sum);

    return normalizedCurve;
  }

  /**
   * Get weight for a specific day based on profile
   */
  getWeightForDay(profile: SpenderProfile, dayOfMonth: number): number {
    const curve = this.getDistributionCurve(profile);
    const index = Math.max(0, Math.min(30, dayOfMonth - 1));
    return curve[index];
  }

  /**
   * Get a human-readable description of the profile
   */
  getProfileDescription(profile: SpenderProfile): string {
    switch (profile) {
      case "front-loader":
        return "You tend to spend more at the beginning of the month";
      case "back-loader":
        return "You tend to spend more towards the end of the month";
      case "payday-spiker":
        return "Your spending spikes around typical paydays (1st/15th)";
      case "steady":
        return "Your spending is evenly distributed throughout the month";
      case "variable":
      default:
        return "Your spending pattern varies from month to month";
    }
  }

  /**
   * Get emoji for profile
   */
  getProfileEmoji(profile: SpenderProfile): string {
    switch (profile) {
      case "front-loader":
        return "\u{1F3C3}"; // Running person
      case "back-loader":
        return "\u{1F422}"; // Turtle
      case "payday-spiker":
        return "\u{1F4B5}"; // Money
      case "steady":
        return "\u{2696}"; // Balance scale
      case "variable":
      default:
        return "\u{1F3B2}"; // Dice
    }
  }

  /**
   * Get the effective amount for a transaction (accounting for reimbursements)
   */
  private getAmount(tx: Transaction): number {
    const base = tx.paymentAmount || tx.amount;
    const reimbursement = tx.reimbursementAmount || 0;
    return base - reimbursement;
  }
}

// Export singleton instance
export const spenderProfiler = new SpenderProfiler();
