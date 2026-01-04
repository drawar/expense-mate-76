// src/core/forecast/SpendingPatternAnalyzer.ts
import { Transaction } from "@/types";
import { SpendingPattern, HolidayConfig } from "./types";
import { HOLIDAYS, DEFAULT_DAY_OF_WEEK_FACTORS } from "./constants";

/**
 * Analyzes historical transactions to extract spending patterns
 * including day-of-week factors, weekend vs weekday patterns, and holiday effects.
 */
export class SpendingPatternAnalyzer {
  /**
   * Analyze transactions to extract spending patterns
   */
  analyze(transactions: Transaction[]): SpendingPattern {
    if (transactions.length === 0) {
      return this.getDefaultPattern();
    }

    // Calculate day of week factors
    const dayOfWeekFactors = this.calculateDayOfWeekFactors(transactions);

    // Calculate weekend vs weekday averages
    const { weekendAverage, weekdayAverage } =
      this.calculateWeekendWeekdayAverages(transactions);

    // Detect holiday effects
    const holidayMultipliers = this.detectHolidayEffects(transactions);

    // Calculate overall daily average
    const dailyAverage = this.calculateDailyAverage(transactions);

    return {
      dayOfWeekFactors,
      weekendAverage,
      weekdayAverage,
      weekendToWeekdayRatio:
        weekdayAverage > 0 ? weekendAverage / weekdayAverage : 1,
      holidayMultipliers,
      dailyAverage,
    };
  }

  /**
   * Calculate spending factor for each day of week (0=Sunday to 6=Saturday)
   * Returns multipliers relative to overall daily average
   */
  private calculateDayOfWeekFactors(transactions: Transaction[]): number[] {
    // Group transactions by day of week
    const dayTotals: number[] = [0, 0, 0, 0, 0, 0, 0];
    const dayCounts: number[] = [0, 0, 0, 0, 0, 0, 0];

    // Group spending by actual calendar date first to avoid double-counting
    const dateSpending = new Map<
      string,
      { dayOfWeek: number; amount: number }
    >();

    transactions.forEach((tx) => {
      const date = new Date(tx.date);
      const dateKey = tx.date.substring(0, 10); // YYYY-MM-DD
      const dayOfWeek = date.getDay();
      const amount = this.getAmount(tx);

      const existing = dateSpending.get(dateKey);
      if (existing) {
        existing.amount += amount;
      } else {
        dateSpending.set(dateKey, { dayOfWeek, amount });
      }
    });

    // Aggregate by day of week
    dateSpending.forEach(({ dayOfWeek, amount }) => {
      dayTotals[dayOfWeek] += amount;
      dayCounts[dayOfWeek] += 1;
    });

    // Calculate averages for each day
    const dayAverages = dayTotals.map((total, i) =>
      dayCounts[i] > 0 ? total / dayCounts[i] : 0
    );

    // Calculate overall average
    const totalSpending = dayTotals.reduce((a, b) => a + b, 0);
    const totalDays = dayCounts.reduce((a, b) => a + b, 0);
    const overallAverage = totalDays > 0 ? totalSpending / totalDays : 0;

    // Calculate factors relative to overall average
    if (overallAverage <= 0) {
      return DEFAULT_DAY_OF_WEEK_FACTORS;
    }

    const factors = dayAverages.map((avg) =>
      avg > 0
        ? avg / overallAverage
        : DEFAULT_DAY_OF_WEEK_FACTORS[dayAverages.indexOf(avg)]
    );

    // Normalize to ensure average factor is 1.0
    const avgFactor = factors.reduce((a, b) => a + b, 0) / 7;
    return factors.map((f) => (avgFactor > 0 ? f / avgFactor : 1));
  }

  /**
   * Calculate average daily spending for weekends vs weekdays
   */
  private calculateWeekendWeekdayAverages(transactions: Transaction[]): {
    weekendAverage: number;
    weekdayAverage: number;
  } {
    // Group by date and classify as weekend/weekday
    const dateSpending = new Map<
      string,
      { isWeekend: boolean; amount: number }
    >();

    transactions.forEach((tx) => {
      const date = new Date(tx.date);
      const dateKey = tx.date.substring(0, 10);
      const dayOfWeek = date.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const amount = this.getAmount(tx);

      const existing = dateSpending.get(dateKey);
      if (existing) {
        existing.amount += amount;
      } else {
        dateSpending.set(dateKey, { isWeekend, amount });
      }
    });

    let weekendTotal = 0;
    let weekendDays = 0;
    let weekdayTotal = 0;
    let weekdayDays = 0;

    dateSpending.forEach(({ isWeekend, amount }) => {
      if (isWeekend) {
        weekendTotal += amount;
        weekendDays += 1;
      } else {
        weekdayTotal += amount;
        weekdayDays += 1;
      }
    });

    return {
      weekendAverage: weekendDays > 0 ? weekendTotal / weekendDays : 0,
      weekdayAverage: weekdayDays > 0 ? weekdayTotal / weekdayDays : 0,
    };
  }

  /**
   * Detect elevated spending during holiday periods compared to baseline
   */
  private detectHolidayEffects(
    transactions: Transaction[]
  ): Record<string, number> {
    const results: Record<string, number> = {};

    // Calculate baseline daily average (excluding holidays)
    const nonHolidaySpending = new Map<string, number>();
    const holidaySpending = new Map<string, Map<string, number>>();

    transactions.forEach((tx) => {
      const date = new Date(tx.date);
      const dateKey = tx.date.substring(0, 10);
      const amount = this.getAmount(tx);

      const holiday = this.getHolidayForDate(date);

      if (holiday) {
        if (!holidaySpending.has(holiday.name)) {
          holidaySpending.set(holiday.name, new Map());
        }
        const holidayDays = holidaySpending.get(holiday.name)!;
        const existing = holidayDays.get(dateKey) || 0;
        holidayDays.set(dateKey, existing + amount);
      } else {
        const existing = nonHolidaySpending.get(dateKey) || 0;
        nonHolidaySpending.set(dateKey, existing + amount);
      }
    });

    // Calculate baseline daily average
    const baselineTotal = Array.from(nonHolidaySpending.values()).reduce(
      (a, b) => a + b,
      0
    );
    const baselineDays = nonHolidaySpending.size;
    const baselineAverage = baselineDays > 0 ? baselineTotal / baselineDays : 0;

    if (baselineAverage <= 0) {
      // Use default multipliers from constants
      HOLIDAYS.forEach((h) => {
        results[h.name] = h.multiplier;
      });
      return results;
    }

    // Calculate multiplier for each holiday
    holidaySpending.forEach((days, holidayName) => {
      const holidayTotal = Array.from(days.values()).reduce((a, b) => a + b, 0);
      const holidayDays = days.size;
      const holidayAverage = holidayDays > 0 ? holidayTotal / holidayDays : 0;

      if (holidayAverage > 0 && holidayDays >= 2) {
        // Need at least 2 days of data to be meaningful
        results[holidayName] = holidayAverage / baselineAverage;
      } else {
        // Use default from constants
        const holidayConfig = HOLIDAYS.find((h) => h.name === holidayName);
        results[holidayName] = holidayConfig?.multiplier || 1.0;
      }
    });

    // Fill in defaults for holidays without data
    HOLIDAYS.forEach((h) => {
      if (!(h.name in results)) {
        results[h.name] = h.multiplier;
      }
    });

    return results;
  }

  /**
   * Get holiday config if date falls within a holiday period
   */
  getHolidayForDate(date: Date): HolidayConfig | null {
    const month = date.getMonth() + 1; // 1-12
    const day = date.getDate();

    for (const holiday of HOLIDAYS) {
      if (
        holiday.month === month &&
        day >= holiday.startDay &&
        day <= holiday.endDay
      ) {
        return holiday;
      }
    }

    return null;
  }

  /**
   * Calculate overall daily average spending
   */
  private calculateDailyAverage(transactions: Transaction[]): number {
    // Group by date to get daily totals
    const dailyTotals = new Map<string, number>();

    transactions.forEach((tx) => {
      const dateKey = tx.date.substring(0, 10);
      const amount = this.getAmount(tx);
      const existing = dailyTotals.get(dateKey) || 0;
      dailyTotals.set(dateKey, existing + amount);
    });

    const totalSpending = Array.from(dailyTotals.values()).reduce(
      (a, b) => a + b,
      0
    );
    const totalDays = dailyTotals.size;

    return totalDays > 0 ? totalSpending / totalDays : 0;
  }

  /**
   * Get default pattern when no historical data is available
   */
  private getDefaultPattern(): SpendingPattern {
    const defaultMultipliers: Record<string, number> = {};
    HOLIDAYS.forEach((h) => {
      defaultMultipliers[h.name] = h.multiplier;
    });

    return {
      dayOfWeekFactors: DEFAULT_DAY_OF_WEEK_FACTORS,
      weekendAverage: 0,
      weekdayAverage: 0,
      weekendToWeekdayRatio: 1,
      holidayMultipliers: defaultMultipliers,
      dailyAverage: 0,
    };
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
export const spendingPatternAnalyzer = new SpendingPatternAnalyzer();
