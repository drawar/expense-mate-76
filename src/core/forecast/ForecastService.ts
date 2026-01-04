// src/core/forecast/ForecastService.ts
import { Transaction, Currency } from "@/types";
import {
  ForecastResult,
  ForecastOptions,
  DailyForecast,
  SpendingPattern,
  ForecastCacheEntry,
  FixedExpense,
} from "./types";
import { ExpenseClassifier, expenseClassifier } from "./ExpenseClassifier";
import {
  SpendingPatternAnalyzer,
  spendingPatternAnalyzer,
} from "./SpendingPatternAnalyzer";
import { SpenderProfiler, spenderProfiler } from "./SpenderProfiler";
import {
  CACHE_CONFIG,
  DATA_CONFIDENCE_LEVELS,
  CONFIDENCE_WEIGHTS,
} from "./constants";
import { CurrencyService } from "@/core/currency";
import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  format,
  subMonths,
  getDay,
  getDaysInMonth,
  isWeekend,
  isBefore,
  startOfDay,
} from "date-fns";

/**
 * Main forecasting service that orchestrates all forecasting components
 * to generate sophisticated spending predictions.
 */
export class ForecastService {
  private patternAnalyzer: SpendingPatternAnalyzer;
  private expenseClassifier: ExpenseClassifier;
  private spenderProfiler: SpenderProfiler;
  private cache: Map<string, ForecastCacheEntry> = new Map();

  constructor(
    patternAnalyzer?: SpendingPatternAnalyzer,
    classifier?: ExpenseClassifier,
    profiler?: SpenderProfiler
  ) {
    this.patternAnalyzer = patternAnalyzer || spendingPatternAnalyzer;
    this.expenseClassifier = classifier || expenseClassifier;
    this.spenderProfiler = profiler || spenderProfiler;
  }

  /**
   * Generate a forecast for the target month
   */
  generateForecast(
    transactions: Transaction[],
    options: ForecastOptions
  ): ForecastResult {
    // Check cache first
    const cacheKey = this.getCacheKey(transactions, options);
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      return cached;
    }

    const targetDate = options.targetMonth || new Date();
    const forecastMonth = format(targetDate, "yyyy-MM");

    // Filter transactions to historical data only (before target month)
    const monthStart = startOfMonth(targetDate);
    const historicalCutoff = subMonths(monthStart, options.historicalMonths);
    const historicalTransactions = transactions.filter((tx) => {
      const txDate = new Date(tx.date);
      return txDate >= historicalCutoff && txDate < monthStart;
    });

    // Get current month transactions (for actual vs forecast comparison)
    const monthEnd = endOfMonth(targetDate);
    const currentMonthTransactions = transactions.filter((tx) => {
      const txDate = new Date(tx.date);
      return txDate >= monthStart && txDate <= monthEnd;
    });

    // Check if this is the first month (insufficient history)
    const isFirstMonth = this.hasInsufficientHistory(historicalTransactions);

    if (isFirstMonth) {
      const result = this.generateUniformForecast(
        options,
        targetDate,
        currentMonthTransactions
      );
      this.saveToCache(cacheKey, result);
      return result;
    }

    // Classify fixed vs variable expenses
    const classification = this.expenseClassifier.classify(
      historicalTransactions
    );

    // Analyze spending patterns
    const patterns = this.patternAnalyzer.analyze(historicalTransactions);

    // Determine spender profile
    const profile = this.spenderProfiler.classify(historicalTransactions);

    // Generate daily forecasts
    const dailyForecasts = this.buildDailyForecasts(
      classification.fixed,
      patterns,
      profile,
      classification.variableAverage,
      options,
      targetDate,
      currentMonthTransactions
    );

    // Normalize to budget if available
    const normalizedForecasts = options.budget
      ? this.normalizeTobudget(dailyForecasts, options.budget)
      : dailyForecasts;

    // Calculate monthly projection
    const monthlyProjection = normalizedForecasts.reduce(
      (sum, d) => sum + d.forecastAmount,
      0
    );

    // Calculate variance from budget
    const variance = options.budget ? monthlyProjection - options.budget : null;

    // Calculate confidence
    const confidence = this.calculateConfidence(
      historicalTransactions.length,
      patterns,
      classification.fixed.length,
      profile
    );

    const result: ForecastResult = {
      dailyForecasts: normalizedForecasts,
      monthlyProjection,
      budget: options.budget || null,
      variance,
      spenderProfile: profile,
      fixedExpenses: classification.fixed,
      variableAverage:
        classification.variableAverage / getDaysInMonth(targetDate),
      confidence,
      isFirstMonth: false,
      currency: options.currency,
      forecastMonth,
      patterns,
    };

    this.saveToCache(cacheKey, result);
    return result;
  }

  /**
   * Check if there's insufficient historical data
   */
  private hasInsufficientHistory(transactions: Transaction[]): boolean {
    if (transactions.length < 10) return true;

    // Check date range
    const dates = transactions.map((t) => new Date(t.date).getTime());
    const minDate = Math.min(...dates);
    const maxDate = Math.max(...dates);
    const dayRange = (maxDate - minDate) / (1000 * 60 * 60 * 24);

    // Need at least 14 days of history
    return dayRange < 14;
  }

  /**
   * Generate uniform forecast for first month (no history)
   */
  private generateUniformForecast(
    options: ForecastOptions,
    targetDate: Date,
    currentMonthTransactions: Transaction[]
  ): ForecastResult {
    const daysInMonth = getDaysInMonth(targetDate);
    const budget = options.budget || 0;
    const dailyAmount = budget / daysInMonth;

    const monthStart = startOfMonth(targetDate);
    const monthEnd = endOfMonth(targetDate);
    const today = startOfDay(new Date());

    // Build daily actual spending map (convert to target currency)
    const actualByDay = this.buildActualSpendingMap(
      currentMonthTransactions,
      options.currency
    );

    let cumulativeForecast = 0;
    let cumulativeActual = 0;

    const dailyForecasts: DailyForecast[] = eachDayOfInterval({
      start: monthStart,
      end: monthEnd,
    }).map((date) => {
      const dateKey = format(date, "yyyy-MM-dd");
      const dayOfMonth = date.getDate();
      const dayOfWeek = getDay(date);
      const isPast =
        isBefore(date, today) ||
        format(date, "yyyy-MM-dd") === format(today, "yyyy-MM-dd");

      const actualAmount = actualByDay.get(dateKey) || 0;
      cumulativeForecast += dailyAmount;
      if (isPast) {
        cumulativeActual += actualAmount;
      }

      const holiday = this.patternAnalyzer.getHolidayForDate(date);

      return {
        date: dateKey,
        dayOfMonth,
        dayOfWeek,
        forecastAmount: dailyAmount,
        actualAmount: isPast ? actualAmount : undefined,
        cumulativeForecast,
        cumulativeActual: isPast ? cumulativeActual : undefined,
        isHoliday: !!holiday,
        holidayName: holiday?.name,
        fixedExpenses: [],
        isWeekend: isWeekend(date),
        confidence: DATA_CONFIDENCE_LEVELS.NO_HISTORY,
      };
    });

    const defaultPatterns: SpendingPattern = {
      dayOfWeekFactors: [1, 1, 1, 1, 1, 1, 1],
      weekendAverage: 0,
      weekdayAverage: 0,
      weekendToWeekdayRatio: 1,
      holidayMultipliers: {},
      dailyAverage: dailyAmount,
    };

    return {
      dailyForecasts,
      monthlyProjection: budget,
      budget: options.budget || null,
      variance: null,
      spenderProfile: "variable",
      fixedExpenses: [],
      variableAverage: dailyAmount,
      confidence: DATA_CONFIDENCE_LEVELS.NO_HISTORY,
      isFirstMonth: true,
      currency: options.currency,
      forecastMonth: format(targetDate, "yyyy-MM"),
      patterns: defaultPatterns,
    };
  }

  /**
   * Build daily forecasts using all analysis components
   */
  private buildDailyForecasts(
    fixedExpenses: FixedExpense[],
    patterns: SpendingPattern,
    profile: string,
    monthlyVariableAverage: number,
    options: ForecastOptions,
    targetDate: Date,
    currentMonthTransactions: Transaction[]
  ): DailyForecast[] {
    const monthStart = startOfMonth(targetDate);
    const monthEnd = endOfMonth(targetDate);
    const daysInMonth = getDaysInMonth(targetDate);
    const today = startOfDay(new Date());

    // Get profile distribution curve
    const profileCurve = this.spenderProfiler.getDistributionCurve(
      profile as import("./types").SpenderProfile
    );

    // Build fixed expense map by day
    const fixedByDay = new Map<number, FixedExpense[]>();
    fixedExpenses.forEach((fe) => {
      const day = fe.expectedDay;
      const existing = fixedByDay.get(day) || [];
      existing.push(fe);
      fixedByDay.set(day, existing);
    });

    // Build actual spending map (convert to target currency)
    const actualByDay = this.buildActualSpendingMap(
      currentMonthTransactions,
      options.currency
    );

    // Calculate daily variable budget
    const dailyVariableAverage = monthlyVariableAverage / daysInMonth;

    let cumulativeForecast = 0;
    let cumulativeActual = 0;

    const forecasts: DailyForecast[] = eachDayOfInterval({
      start: monthStart,
      end: monthEnd,
    }).map((date) => {
      const dateKey = format(date, "yyyy-MM-dd");
      const dayOfMonth = date.getDate();
      const dayOfWeek = getDay(date);
      const isPast =
        isBefore(date, today) || dateKey === format(today, "yyyy-MM-dd");

      // Get fixed expenses for this day
      const dayFixedExpenses = fixedByDay.get(dayOfMonth) || [];
      const fixedTotal = dayFixedExpenses.reduce(
        (sum, fe) => sum + fe.expectedAmount,
        0
      );

      // Calculate variable forecast
      const dayOfWeekFactor = patterns.dayOfWeekFactors[dayOfWeek] || 1;
      const profileWeight = profileCurve[dayOfMonth - 1] || 1;

      // Check for holiday
      const holiday = this.patternAnalyzer.getHolidayForDate(date);
      const holidayFactor = holiday
        ? patterns.holidayMultipliers[holiday.name] || holiday.multiplier
        : 1;

      // Calculate variable amount for this day
      let variableAmount =
        dailyVariableAverage * dayOfWeekFactor * profileWeight;

      // Apply holiday multiplier if enabled
      if (options.includeHolidays && holidayFactor > 1) {
        variableAmount *= holidayFactor;
      }

      const forecastAmount = fixedTotal + variableAmount;

      // Get actual spending
      const actualAmount = actualByDay.get(dateKey) || 0;

      cumulativeForecast += forecastAmount;
      if (isPast) {
        cumulativeActual += actualAmount;
      }

      return {
        date: dateKey,
        dayOfMonth,
        dayOfWeek,
        forecastAmount,
        actualAmount: isPast ? actualAmount : undefined,
        cumulativeForecast,
        cumulativeActual: isPast ? cumulativeActual : undefined,
        isHoliday: !!holiday,
        holidayName: holiday?.name,
        fixedExpenses: dayFixedExpenses,
        isWeekend: isWeekend(date),
        confidence: this.getDayConfidence(dayFixedExpenses, patterns),
      };
    });

    return forecasts;
  }

  /**
   * Normalize forecast values to sum to budget
   * Fixed expenses are preserved at their original amounts,
   * only variable spending is scaled to fit remaining budget.
   */
  private normalizeTobudget(
    forecasts: DailyForecast[],
    budget: number
  ): DailyForecast[] {
    // Calculate total fixed and variable amounts
    let totalFixed = 0;
    let totalVariable = 0;

    forecasts.forEach((f) => {
      const fixedAmount = f.fixedExpenses.reduce(
        (sum, fe) => sum + fe.expectedAmount,
        0
      );
      const variableAmount = f.forecastAmount - fixedAmount;
      totalFixed += fixedAmount;
      totalVariable += Math.max(0, variableAmount);
    });

    const rawTotal = totalFixed + totalVariable;

    if (rawTotal <= 0) {
      // If no forecast, distribute budget uniformly
      const dailyAmount = budget / forecasts.length;
      let cumulative = 0;
      return forecasts.map((f) => {
        cumulative += dailyAmount;
        return {
          ...f,
          forecastAmount: dailyAmount,
          cumulativeForecast: cumulative,
        };
      });
    }

    // Calculate remaining budget after fixed expenses
    const remainingBudget = Math.max(0, budget - totalFixed);

    // Scale factor for variable spending only
    const variableScaleFactor =
      totalVariable > 0 ? remainingBudget / totalVariable : 0;

    let cumulative = 0;

    return forecasts.map((f) => {
      // Calculate fixed amount for this day
      const fixedAmount = f.fixedExpenses.reduce(
        (sum, fe) => sum + fe.expectedAmount,
        0
      );

      // Calculate variable amount for this day
      const originalVariable = Math.max(0, f.forecastAmount - fixedAmount);

      // New amount = fixed (unchanged) + scaled variable
      const newAmount = fixedAmount + originalVariable * variableScaleFactor;

      cumulative += newAmount;
      return {
        ...f,
        forecastAmount: newAmount,
        cumulativeForecast: cumulative,
      };
    });
  }

  /**
   * Build a map of actual spending by date, converted to target currency
   */
  private buildActualSpendingMap(
    transactions: Transaction[],
    targetCurrency: Currency
  ): Map<string, number> {
    const map = new Map<string, number>();

    transactions.forEach((tx) => {
      // Use local date instead of UTC substring to respect user's timezone
      const dateKey = format(new Date(tx.date), "yyyy-MM-dd");
      const amount = this.getAmount(tx, targetCurrency);
      const existing = map.get(dateKey) || 0;
      map.set(dateKey, existing + amount);
    });

    return map;
  }

  /**
   * Calculate overall confidence score
   */
  private calculateConfidence(
    transactionCount: number,
    patterns: SpendingPattern,
    fixedExpenseCount: number,
    profile: string
  ): number {
    // Data quantity confidence
    let dataConfidence: number;
    if (transactionCount < 10) {
      dataConfidence = DATA_CONFIDENCE_LEVELS.NO_HISTORY;
    } else if (transactionCount < 30) {
      dataConfidence = DATA_CONFIDENCE_LEVELS.LESS_THAN_ONE_MONTH;
    } else if (transactionCount < 60) {
      dataConfidence = DATA_CONFIDENCE_LEVELS.ONE_TO_TWO_MONTHS;
    } else if (transactionCount < 90) {
      dataConfidence = DATA_CONFIDENCE_LEVELS.TWO_TO_THREE_MONTHS;
    } else {
      dataConfidence = DATA_CONFIDENCE_LEVELS.THREE_PLUS_MONTHS;
    }

    // Pattern consistency confidence
    const patternConfidence =
      patterns.dailyAverage > 0
        ? Math.min(1, patterns.weekendToWeekdayRatio > 0 ? 0.8 : 0.5)
        : 0.3;

    // Fixed expense confidence
    const fixedConfidence = Math.min(1, fixedExpenseCount * 0.15 + 0.3);

    // Profile clarity confidence
    const profileConfidence = profile === "variable" ? 0.5 : 0.8;

    // Weighted average
    return (
      dataConfidence * CONFIDENCE_WEIGHTS.DATA_QUANTITY +
      patternConfidence * CONFIDENCE_WEIGHTS.PATTERN_CONSISTENCY +
      fixedConfidence * CONFIDENCE_WEIGHTS.FIXED_EXPENSE_DETECTION +
      profileConfidence * CONFIDENCE_WEIGHTS.PROFILE_CLARITY
    );
  }

  /**
   * Get confidence for a specific day
   */
  private getDayConfidence(
    fixedExpenses: FixedExpense[],
    patterns: SpendingPattern
  ): number {
    // Higher confidence if we have fixed expenses for this day
    const fixedBoost = fixedExpenses.length > 0 ? 0.2 : 0;

    // Base confidence from pattern quality
    const baseConfidence =
      patterns.dailyAverage > 0 ? 0.6 : DATA_CONFIDENCE_LEVELS.NO_HISTORY;

    return Math.min(1, baseConfidence + fixedBoost);
  }

  /**
   * Get the effective amount for a transaction, converted to target currency
   */
  private getAmount(tx: Transaction, targetCurrency: Currency): number {
    const base = tx.paymentAmount || tx.amount;
    const reimbursement = tx.reimbursementAmount || 0;
    const netAmount = base - reimbursement;

    // Get the currency the amount is in (payment currency or transaction currency)
    const sourceCurrency = (tx.paymentCurrency || tx.currency) as Currency;

    // Convert to target currency if different
    if (sourceCurrency && sourceCurrency !== targetCurrency) {
      return CurrencyService.convert(netAmount, sourceCurrency, targetCurrency);
    }

    return netAmount;
  }

  /**
   * Generate cache key
   */
  private getCacheKey(
    transactions: Transaction[],
    options: ForecastOptions
  ): string {
    const latestTx =
      transactions.length > 0
        ? transactions.reduce((a, b) =>
            new Date(a.date) > new Date(b.date) ? a : b
          ).date
        : "";
    const targetMonth = options.targetMonth
      ? format(options.targetMonth, "yyyy-MM")
      : format(new Date(), "yyyy-MM");

    return `${transactions.length}-${latestTx}-${options.currency}-${options.budget || "none"}-${targetMonth}`;
  }

  /**
   * Get cached result if valid
   */
  private getFromCache(key: string): ForecastResult | null {
    const entry = this.cache.get(key);
    if (entry && Date.now() - entry.timestamp < CACHE_CONFIG.TTL_MS) {
      return entry.result;
    }
    return null;
  }

  /**
   * Save result to cache
   */
  private saveToCache(key: string, result: ForecastResult): void {
    // Clean up old entries if needed
    if (this.cache.size >= CACHE_CONFIG.MAX_ENTRIES) {
      const oldestKey = Array.from(this.cache.entries()).sort(
        (a, b) => a[1].timestamp - b[1].timestamp
      )[0]?.[0];
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, {
      result,
      timestamp: Date.now(),
      key,
    });
  }

  /**
   * Clear the cache
   */
  clearCache(): void {
    this.cache.clear();
  }
}

// Export singleton instance
export const forecastService = new ForecastService();
