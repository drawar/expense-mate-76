import { supabase } from "@/integrations/supabase/client";
import {
  Transaction,
  Currency,
  PaymentMethod,
  Insight,
  DbInsight,
  RenderedInsight,
  InsightCategory,
  InsightSeverity,
  InsightConditionType,
} from "@/types";
import { getEffectiveCategory } from "@/utils/categoryMapping";
import {
  getSpendingTier,
  getBehavioralCategory,
} from "@/utils/constants/categories";
import { CurrencyService } from "@/core/currency";
import { rewardService } from "@/core/rewards";
import { CalculationInput } from "@/core/rewards/types";
import { InsightContext, EvaluationResult, ConditionEvaluator } from "./types";
import {
  startOfMonth,
  endOfMonth,
  subMonths,
  getDaysInMonth,
  differenceInDays,
  getHours,
  isWeekend,
  parseISO,
} from "date-fns";
import { DateTime } from "luxon";

/**
 * Service for evaluating and rendering financial insights
 */
export class InsightService {
  private insights: Insight[] = [];
  private dismissals: Set<string> = new Set();
  private lastFetchTime: number = 0;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Load insight templates from database
   */
  async loadInsights(): Promise<Insight[]> {
    // Return cached if fresh
    if (
      this.insights.length > 0 &&
      Date.now() - this.lastFetchTime < this.CACHE_TTL
    ) {
      return this.insights;
    }

    const { data, error } = await supabase
      .from("insights")
      .select("*")
      .eq("is_active", true)
      .order("priority", { ascending: false });

    if (error) {
      console.error("Failed to load insights:", error);
      return this.insights; // Return cached on error
    }

    this.insights = (data as DbInsight[]).map(this.mapDbInsight);
    this.lastFetchTime = Date.now();
    return this.insights;
  }

  /**
   * Load user's dismissed insights
   */
  async loadDismissals(): Promise<void> {
    const { data: authData } = await supabase.auth.getSession();
    if (!authData?.session?.user) return;

    const { data, error } = await supabase
      .from("user_insight_dismissals")
      .select("insight_id, dismissed_at");

    if (error) {
      console.error("Failed to load dismissals:", error);
      return;
    }

    this.dismissals = new Set(data?.map((d) => d.insight_id) || []);
  }

  /**
   * Dismiss an insight for the current user
   */
  async dismissInsight(insightId: string): Promise<boolean> {
    const { data: authData } = await supabase.auth.getSession();
    if (!authData?.session?.user) return false;

    const { error } = await supabase.from("user_insight_dismissals").upsert({
      user_id: authData.session.user.id,
      insight_id: insightId,
    });

    if (error) {
      console.error("Failed to dismiss insight:", error);
      return false;
    }

    this.dismissals.add(insightId);
    return true;
  }

  /**
   * Clear a dismissal (show insight again)
   */
  async clearDismissal(insightId: string): Promise<boolean> {
    const { data: authData } = await supabase.auth.getSession();
    if (!authData?.session?.user) return false;

    const { error } = await supabase
      .from("user_insight_dismissals")
      .delete()
      .eq("user_id", authData.session.user.id)
      .eq("insight_id", insightId);

    if (error) {
      console.error("Failed to clear dismissal:", error);
      return false;
    }

    this.dismissals.delete(insightId);
    return true;
  }

  /**
   * Evaluate all insights against the given context and return rendered results
   */
  async evaluateInsights(
    transactions: Transaction[],
    options: {
      monthlyBudget?: number;
      currency?: Currency;
      paymentMethods?: PaymentMethod[];
      includeDismissed?: boolean;
      maxResults?: number;
      categories?: InsightCategory[];
    } = {}
  ): Promise<RenderedInsight[]> {
    // Load insights and dismissals
    await Promise.all([this.loadInsights(), this.loadDismissals()]);

    const {
      monthlyBudget = 0,
      currency = "SGD",
      paymentMethods = [],
      includeDismissed = false,
      maxResults = 10,
      categories,
    } = options;

    // Build context
    const context = this.buildContext(
      transactions,
      monthlyBudget,
      currency,
      paymentMethods
    );

    // Evaluate each insight
    const results: RenderedInsight[] = [];

    for (const insight of this.insights) {
      // Skip dismissed unless requested
      if (!includeDismissed && this.dismissals.has(insight.id)) {
        continue;
      }

      // Filter by category if specified
      if (categories && !categories.includes(insight.category)) {
        continue;
      }

      // Evaluate condition
      const evaluator = this.getEvaluator(insight.conditionType);
      if (!evaluator) continue;

      // Await the evaluator result (supports both sync and async evaluators)
      const result = await Promise.resolve(
        evaluator(context, insight.conditionParams)
      );

      if (result.triggered) {
        const rendered = this.renderInsight(insight, result.data, context);
        results.push(rendered);
      }
    }

    // Sort by priority and limit
    return results.sort((a, b) => b.priority - a.priority).slice(0, maxResults);
  }

  /**
   * Build evaluation context from transactions
   */
  private buildContext(
    transactions: Transaction[],
    monthlyBudget: number,
    currency: Currency,
    paymentMethods: PaymentMethod[]
  ): InsightContext {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    const prevMonthStart = startOfMonth(subMonths(now, 1));
    const prevMonthEnd = endOfMonth(subMonths(now, 1));

    // Filter transactions by period
    const currentMonthTransactions = transactions.filter((tx) => {
      const date = new Date(tx.date);
      return date >= monthStart && date <= monthEnd;
    });

    const previousMonthTransactions = transactions.filter((tx) => {
      const date = new Date(tx.date);
      return date >= prevMonthStart && date <= prevMonthEnd;
    });

    // Helper to convert transaction amount to display currency
    const getConvertedAmount = (tx: Transaction): number => {
      try {
        return CurrencyService.convert(
          tx.amount,
          tx.currency as Currency,
          currency,
          tx.paymentMethod
        );
      } catch {
        return tx.amount;
      }
    };

    // Calculate totals with currency conversion
    const totalSpent = currentMonthTransactions.reduce(
      (sum, tx) => sum + getConvertedAmount(tx),
      0
    );

    const previousMonthTotal = previousMonthTransactions.reduce(
      (sum, tx) => sum + getConvertedAmount(tx),
      0
    );

    // Category totals
    const categoryTotals: Record<string, number> = {};
    const tierTotals: Record<string, number> = {
      Essentials: 0,
      Lifestyle: 0,
      Other: 0,
    };
    const behaviorTotals: Record<string, number> = {
      Convenience: 0,
      Social: 0,
      Planned: 0,
      Investment: 0,
    };
    const merchantTotals: Record<string, { total: number; count: number }> = {};

    currentMonthTransactions.forEach((tx) => {
      const convertedAmount = getConvertedAmount(tx);
      const category = getEffectiveCategory(tx);
      categoryTotals[category] =
        (categoryTotals[category] || 0) + convertedAmount;

      const tier = getSpendingTier(category);
      tierTotals[tier] = (tierTotals[tier] || 0) + convertedAmount;

      const behavior = getBehavioralCategory(category);
      behaviorTotals[behavior] =
        (behaviorTotals[behavior] || 0) + convertedAmount;

      const merchantName = tx.merchant.name;
      if (!merchantTotals[merchantName]) {
        merchantTotals[merchantName] = { total: 0, count: 0 };
      }
      merchantTotals[merchantName].total += convertedAmount;
      merchantTotals[merchantName].count += 1;
    });

    const daysInMonth = getDaysInMonth(now);
    const dayOfMonth = now.getDate();

    return {
      transactions,
      currentMonthTransactions,
      previousMonthTransactions,
      monthlyBudget,
      totalSpent,
      currency,
      paymentMethods,
      currentDate: now,
      dayOfMonth,
      daysInMonth,
      daysRemaining: daysInMonth - dayOfMonth,
      categoryTotals,
      tierTotals,
      behaviorTotals,
      merchantTotals,
      previousMonthTotal,
      averageTransaction:
        currentMonthTransactions.length > 0
          ? totalSpent / currentMonthTransactions.length
          : 0,
    };
  }

  /**
   * Get the evaluator function for a condition type
   */
  private getEvaluator(
    conditionType: InsightConditionType
  ): ConditionEvaluator | null {
    const evaluators: Record<string, ConditionEvaluator> = {
      category_ratio: this.evaluateCategoryRatio.bind(this),
      category_amount: this.evaluateCategoryAmount.bind(this),
      category_comparison: this.evaluateCategoryComparison.bind(this),
      tier_ratio: this.evaluateTierRatio.bind(this),
      spending_trend: this.evaluateSpendingTrend.bind(this),
      budget_status: this.evaluateBudgetStatus.bind(this),
      transaction_pattern: this.evaluateTransactionPattern.bind(this),
      merchant_pattern: this.evaluateMerchantPattern.bind(this),
      merchant_anomaly: this.evaluateMerchantAnomaly.bind(this),
      reward_optimization: this.evaluateRewardOptimization.bind(this),
      savings_rate: this.evaluateSavingsRate.bind(this),
      milestone: this.evaluateMilestone.bind(this),
      time_based: this.evaluateTimeBased.bind(this),
    };

    return evaluators[conditionType] || null;
  }

  // ==========================================================================
  // CONDITION EVALUATORS
  // ==========================================================================

  /**
   * Evaluate category ratio conditions
   * Params: { category: string, threshold: number, operator: ">" | "<" | ">=" | "<=" }
   */
  private evaluateCategoryRatio(
    context: InsightContext,
    params: Record<string, unknown>
  ): EvaluationResult {
    const {
      category,
      threshold,
      operator = ">",
    } = params as {
      category: string;
      threshold: number;
      operator?: string;
    };

    const categoryTotal = context.categoryTotals?.[category] || 0;
    const ratio =
      context.totalSpent > 0 ? categoryTotal / context.totalSpent : 0;

    const triggered = this.compareValues(ratio, threshold, operator);

    return {
      triggered,
      data: {
        category,
        amount: categoryTotal,
        percentage: Math.round(ratio * 100),
        threshold: Math.round(threshold * 100),
      },
    };
  }

  /**
   * Evaluate category amount conditions
   * Params: { category?: string, merchants_like?: string[], threshold: number }
   */
  private evaluateCategoryAmount(
    context: InsightContext,
    params: Record<string, unknown>
  ): EvaluationResult {
    const { category, merchants_like, threshold } = params as {
      category?: string;
      merchants_like?: string[];
      threshold: number;
    };

    let total = 0;
    let count = 0;

    if (merchants_like && merchants_like.length > 0) {
      // Sum transactions matching merchant patterns
      context.currentMonthTransactions.forEach((tx) => {
        const merchantLower = tx.merchant.name.toLowerCase();
        if (
          merchants_like.some((m) => merchantLower.includes(m.toLowerCase()))
        ) {
          total += tx.amount;
          count += 1;
        }
      });
    } else if (category) {
      total = context.categoryTotals?.[category] || 0;
      count = context.currentMonthTransactions.filter(
        (tx) => getEffectiveCategory(tx) === category
      ).length;
    }

    const triggered = total >= threshold;
    const yearlyProjection = total * 12;

    return {
      triggered,
      data: {
        amount: total,
        count,
        yearly_projection: yearlyProjection,
        savings_estimate: Math.round(total * 0.5), // Estimate 50% savings
      },
    };
  }

  /**
   * Evaluate category comparison conditions (e.g., groceries vs dining out)
   * Params: {
   *   categories_a: string[],      // First group (e.g., ["Groceries"])
   *   categories_b: string[],      // Second group (e.g., ["Dining Out", "Fast Food & Takeout", "Food Delivery"])
   *   label_a?: string,            // Label for first group (e.g., "groceries")
   *   label_b?: string,            // Label for second group (e.g., "dining out")
   *   cost_multiplier?: number,    // Estimated cost multiplier (dining typically costs 2-3x groceries per meal)
   *   min_transactions?: number,   // Minimum transactions to trigger
   *   meals_per_week?: number,     // Meals to project per week for category B (default 7 = daily dinner)
   * }
   */
  private evaluateCategoryComparison(
    context: InsightContext,
    params: Record<string, unknown>
  ): EvaluationResult {
    const {
      categories_a = [],
      categories_b = [],
      label_a = "Category A",
      label_b = "Category B",
      cost_multiplier = 2.5,
      min_transactions = 3,
      meals_per_week = 7,
    } = params as {
      categories_a: string[];
      categories_b: string[];
      label_a?: string;
      label_b?: string;
      cost_multiplier?: number;
      min_transactions?: number;
      meals_per_week?: number;
    };

    // Calculate totals for each category group
    let totalA = 0;
    let countA = 0;
    let totalB = 0;
    let countB = 0;

    context.currentMonthTransactions.forEach((tx) => {
      const category = getEffectiveCategory(tx);
      if (categories_a.includes(category)) {
        totalA += tx.amount;
        countA += 1;
      }
      if (categories_b.includes(category)) {
        totalB += tx.amount;
        countB += 1;
      }
    });

    // Calculate number of days in the current period
    const daysInPeriod = Math.max(
      1,
      differenceInDays(new Date(), startOfMonth(new Date())) + 1
    );

    // Scale groceries to weekly average (by days)
    const weeksInPeriod = daysInPeriod / 7;
    const weeklyA = weeksInPeriod > 0 ? totalA / weeksInPeriod : 0;

    // For dining out: calculate average cost per meal, then project if dining out every lunch + dinner
    // This answers: "What would it cost if I dined out for lunch and dinner every day?"
    const avgMealCost = countB > 0 ? totalB / countB : 0;
    const projectedWeeklyDining = avgMealCost * meals_per_week;

    // Calculate savings: projected dining cost vs actual weekly grocery spending
    // Savings = what dining out would cost - what you actually spend on groceries
    const weeklySavings = projectedWeeklyDining - weeklyA;

    // Monthly projection (scaled by actual days tracked)
    const monthlyProjectedSavings = weeklySavings * weeksInPeriod;

    // Trigger if there's meaningful activity in both categories
    const triggered = countA >= min_transactions || countB >= min_transactions;

    return {
      triggered,
      data: {
        total_a: totalA,
        total_b: totalB,
        count_a: countA,
        count_b: countB,
        weekly_a: Math.round(weeklyA * 100) / 100,
        weekly_b: Math.round((totalB / weeksInPeriod) * 100) / 100, // Actual weekly dining spend
        avg_meal_cost: Math.round(avgMealCost * 100) / 100,
        projected_weekly_dining: Math.round(projectedWeeklyDining * 100) / 100,
        label_a,
        label_b,
        days_tracked: daysInPeriod,
        meals_per_week,
        potential_savings: Math.round(monthlyProjectedSavings),
        weekly_savings: Math.round(weeklySavings * 100) / 100,
        ratio: totalA > 0 ? Math.round((totalB / totalA) * 100) / 100 : 0,
      },
    };
  }

  /**
   * Evaluate spending tier ratio conditions
   * Params: { tier?: string, behavior?: string, threshold: number, trend?: "up" | "down" }
   */
  private evaluateTierRatio(
    context: InsightContext,
    params: Record<string, unknown>
  ): EvaluationResult {
    const { tier, behavior, threshold, trend } = params as {
      tier?: string;
      behavior?: string;
      threshold: number;
      trend?: string;
    };

    let currentValue = 0;
    let previousValue = 0;

    if (tier && context.tierTotals) {
      currentValue = context.tierTotals[tier] / (context.totalSpent || 1);

      // Calculate previous month tier value if checking trend
      if (trend && context.previousMonthTransactions.length > 0) {
        const prevTotal = context.previousMonthTotal || 1;
        const prevTierTotal = context.previousMonthTransactions
          .filter((tx) => getSpendingTier(getEffectiveCategory(tx)) === tier)
          .reduce((sum, tx) => sum + tx.amount, 0);
        previousValue = prevTierTotal / prevTotal;
      }
    } else if (behavior && context.behaviorTotals) {
      currentValue =
        context.behaviorTotals[behavior] / (context.totalSpent || 1);
    }

    let triggered = false;
    let changeAmount = 0;

    if (trend) {
      const change =
        previousValue > 0 ? (currentValue - previousValue) / previousValue : 0;
      if (trend === "down") {
        triggered = change <= -threshold;
        changeAmount = Math.abs(
          (context.tierTotals?.[tier || ""] || 0) -
            (context.previousMonthTotal || 0) * previousValue
        );
      } else {
        triggered = change >= threshold;
      }
    } else {
      triggered = currentValue >= threshold;
    }

    return {
      triggered,
      data: {
        tier,
        behavior,
        percentage: Math.round(currentValue * 100),
        amount: changeAmount,
      },
    };
  }

  /**
   * Evaluate spending trend conditions
   * Params: { direction: "up" | "down", threshold: number, by_category?: boolean, consecutive_over_budget?: number }
   */
  private evaluateSpendingTrend(
    context: InsightContext,
    params: Record<string, unknown>
  ): EvaluationResult {
    const { direction, threshold, by_category, consecutive_over_budget } =
      params as {
        direction?: string;
        threshold?: number;
        by_category?: boolean;
        consecutive_over_budget?: number;
      };

    if (consecutive_over_budget) {
      // This would need historical data - simplified for now
      const isOverBudget =
        context.monthlyBudget > 0 && context.totalSpent > context.monthlyBudget;
      return {
        triggered: isOverBudget, // Simplified - real impl would check history
        data: { months: consecutive_over_budget },
      };
    }

    // Handle per-category spending trends
    if (by_category) {
      // Calculate previous month category totals
      const prevCategoryTotals: Record<string, number> = {};
      context.previousMonthTransactions.forEach((tx) => {
        const category = getEffectiveCategory(tx);
        prevCategoryTotals[category] =
          (prevCategoryTotals[category] || 0) + tx.amount;
      });

      // Find categories with the biggest change in the specified direction
      let bestMatch: {
        category: string;
        change: number;
        currentAmount: number;
        prevAmount: number;
      } | null = null;

      for (const [category, currentAmount] of Object.entries(
        context.categoryTotals || {}
      )) {
        const prevAmount = prevCategoryTotals[category] || 0;
        if (prevAmount === 0) continue; // Can't calculate % change from 0

        const change = (currentAmount - prevAmount) / prevAmount;

        const meetsThreshold =
          direction === "down"
            ? change <= -(threshold || 0)
            : change >= (threshold || 0);

        if (meetsThreshold) {
          const absChange = Math.abs(change);
          // Pick the category with the largest change
          if (!bestMatch || absChange > Math.abs(bestMatch.change)) {
            bestMatch = { category, change, currentAmount, prevAmount };
          }
        }
      }

      if (bestMatch) {
        return {
          triggered: true,
          data: {
            category: bestMatch.category,
            percentage: Math.round(Math.abs(bestMatch.change) * 100),
            amount: Math.abs(bestMatch.currentAmount - bestMatch.prevAmount),
          },
        };
      }

      return { triggered: false, data: {} };
    }

    // Overall spending trend (not by category)
    const prevTotal = context.previousMonthTotal || 0;
    if (prevTotal === 0) {
      return { triggered: false, data: {} };
    }

    const change = (context.totalSpent - prevTotal) / prevTotal;
    const absChange = Math.abs(change);

    const triggered =
      direction === "down"
        ? change <= -(threshold || 0)
        : change >= (threshold || 0);

    return {
      triggered,
      data: {
        percentage: Math.round(absChange * 100),
        amount: Math.abs(context.totalSpent - prevTotal),
        last_month_total: prevTotal,
      },
    };
  }

  /**
   * Evaluate budget status conditions
   * Params: { status: "over" | "under" | "near" | "on_track", threshold?: number }
   */
  private evaluateBudgetStatus(
    context: InsightContext,
    params: Record<string, unknown>
  ): EvaluationResult {
    const {
      status,
      threshold = 0,
      threshold_min,
      threshold_max,
    } = params as {
      status: string;
      threshold?: number;
      threshold_min?: number;
      threshold_max?: number;
    };

    if (context.monthlyBudget <= 0) {
      // No budget set
      return {
        triggered: status === "near", // Trigger "set a budget" message
        data: { status_message: "Set a budget to track your spending" },
      };
    }

    const ratio = context.totalSpent / context.monthlyBudget;
    const remaining = context.monthlyBudget - context.totalSpent;
    let triggered = false;
    let statusMessage = "";

    switch (status) {
      case "over":
        triggered = ratio > 1 + threshold;
        statusMessage = "You've exceeded your budget";
        break;
      case "near":
        triggered = ratio >= (threshold || 0.9) && ratio <= 1;
        statusMessage = "You're approaching your budget limit";
        break;
      case "under":
        triggered = ratio <= 1 - (threshold || 0.2);
        statusMessage = "Great job staying under budget!";
        break;
      case "on_track":
        triggered =
          ratio >= (threshold_min || 0.5) && ratio <= (threshold_max || 0.8);
        statusMessage = "You're on track with your budget";
        break;
    }

    return {
      triggered,
      data: {
        percentage: Math.round(ratio * 100),
        remaining: Math.max(0, remaining),
        overage_amount: Math.max(0, -remaining),
        overage_percentage: Math.max(0, Math.round((ratio - 1) * 100)),
        surplus_amount: Math.max(0, remaining),
        days_remaining: context.daysRemaining,
        status_message: statusMessage,
      },
    };
  }

  /**
   * Evaluate transaction pattern conditions
   * Params: various pattern-specific parameters
   */
  private evaluateTransactionPattern(
    context: InsightContext,
    params: Record<string, unknown>
  ): EvaluationResult {
    const {
      category,
      amount_max,
      amount_vs_average_ratio,
      min_count,
      period,
      hour_start,
      hour_end,
      weekend_vs_weekday_ratio,
      post_payday_spike,
      daily_spike_ratio,
      contactless,
      in_store,
    } = params as Record<string, unknown>;

    let transactions = context.currentMonthTransactions;
    let triggered = false;
    const data: Record<string, unknown> = {};

    // Filter by category
    if (category) {
      transactions = transactions.filter(
        (tx) => getEffectiveCategory(tx) === category
      );
    }

    // Small transaction pattern
    if (amount_max !== undefined && min_count !== undefined) {
      const smallTxs = transactions.filter(
        (tx) => tx.amount <= (amount_max as number)
      );
      const total = smallTxs.reduce((sum, tx) => sum + tx.amount, 0);
      triggered = smallTxs.length >= (min_count as number);
      data.count = smallTxs.length;
      data.amount = total;
    }

    // Late night pattern
    if (hour_start !== undefined && hour_end !== undefined) {
      const lateNightTxs = transactions.filter((tx) => {
        const hour = getHours(parseISO(tx.date));
        return hour >= (hour_start as number) || hour <= (hour_end as number);
      });
      triggered = lateNightTxs.length >= ((min_count as number) || 5);
      data.count = lateNightTxs.length;
    }

    // Weekend vs weekday pattern
    if (weekend_vs_weekday_ratio !== undefined) {
      let weekendTotal = 0;
      let weekdayTotal = 0;

      // Count actual weekend and weekday days in the period
      const monthStart = startOfMonth(context.currentDate);
      let weekendDays = 0;
      let weekdayDays = 0;

      const d = new Date(monthStart);
      while (d <= context.currentDate) {
        if (isWeekend(d)) {
          weekendDays++;
        } else {
          weekdayDays++;
        }
        d.setDate(d.getDate() + 1);
      }

      transactions.forEach((tx) => {
        const date = parseISO(tx.date);
        if (isWeekend(date)) {
          weekendTotal += tx.amount;
        } else {
          weekdayTotal += tx.amount;
        }
      });

      // Calculate daily averages based on actual days in period
      const avgWeekendDaily = weekendDays > 0 ? weekendTotal / weekendDays : 0;
      const avgWeekdayDaily = weekdayDays > 0 ? weekdayTotal / weekdayDays : 0;
      const ratio = avgWeekdayDaily > 0 ? avgWeekendDaily / avgWeekdayDaily : 0;

      triggered = ratio >= (weekend_vs_weekday_ratio as number);
      data.percentage = Math.round((ratio - 1) * 100);
      // Show daily averages for fair comparison
      data.weekend_amount = Math.round(avgWeekendDaily * 100) / 100;
      data.weekday_amount = Math.round(avgWeekdayDaily * 100) / 100;
    }

    // Large transaction pattern
    if (amount_vs_average_ratio !== undefined && context.averageTransaction) {
      const largeTxs = transactions.filter(
        (tx) =>
          tx.amount >=
          context.averageTransaction! * (amount_vs_average_ratio as number)
      );
      if (largeTxs.length > 0) {
        const largest = largeTxs.sort((a, b) => b.amount - a.amount)[0];
        triggered = true;
        data.amount = largest.amount;
        data.merchant = largest.merchant.name;
        data.multiplier = Math.round(
          largest.amount / context.averageTransaction!
        );
        data.transactionId = largest.id;
      }
    }

    // Contactless pattern
    if (contactless !== undefined && in_store !== undefined) {
      const nonContactlessTxs = transactions.filter(
        (tx) =>
          tx.isContactless === (contactless as boolean) &&
          tx.merchant.isOnline !== (in_store as boolean)
      );
      triggered = nonContactlessTxs.length >= ((min_count as number) || 10);
      data.count = nonContactlessTxs.length;
    }

    return { triggered, data };
  }

  /**
   * Evaluate merchant pattern conditions
   */
  private evaluateMerchantPattern(
    context: InsightContext,
    params: Record<string, unknown>
  ): EvaluationResult {
    const {
      merchants_like,
      min_count,
      recurring,
      new_merchants,
      single_merchant_ratio,
      min_amount,
    } = params as Record<string, unknown>;

    const data: Record<string, unknown> = {};
    let triggered = false;

    // Merchant pattern matching
    if (merchants_like && Array.isArray(merchants_like)) {
      let total = 0;
      let count = 0;

      context.currentMonthTransactions.forEach((tx) => {
        const merchantLower = tx.merchant.name.toLowerCase();
        if (
          (merchants_like as string[]).some((m) =>
            merchantLower.includes(m.toLowerCase())
          )
        ) {
          total += tx.amount;
          count += 1;
        }
      });

      triggered = count >= ((min_count as number) || 1);
      data.count = count;
      data.amount = total;
      data.savings_estimate = Math.round(total * 0.4);
    }

    // Single merchant concentration
    if (single_merchant_ratio !== undefined && context.merchantTotals) {
      const entries = Object.entries(context.merchantTotals);
      if (entries.length > 0) {
        const [topMerchant, topData] = entries.sort(
          (a, b) => b[1].total - a[1].total
        )[0];
        const ratio = topData.total / (context.totalSpent || 1);

        triggered =
          ratio >= (single_merchant_ratio as number) &&
          topData.total >= ((min_amount as number) || 0);
        data.merchant = topMerchant;
        data.amount = topData.total;
        data.percentage = Math.round(ratio * 100);
      }
    }

    // New merchants detection (simplified)
    if (new_merchants && context.previousMonthTransactions.length > 0) {
      const prevMerchants = new Set(
        context.previousMonthTransactions.map((tx) => tx.merchant.name)
      );
      const newMerchantCount = context.currentMonthTransactions.filter(
        (tx) => !prevMerchants.has(tx.merchant.name)
      ).length;

      triggered = newMerchantCount >= ((min_count as number) || 10);
      data.count = newMerchantCount;
    }

    // Recurring charges (simplified - detect same merchant, similar amounts)
    if (recurring) {
      const merchantCounts = new Map<string, number>();
      context.currentMonthTransactions.forEach((tx) => {
        merchantCounts.set(
          tx.merchant.name,
          (merchantCounts.get(tx.merchant.name) || 0) + 1
        );
      });

      const recurringMerchants = Array.from(merchantCounts.entries()).filter(
        ([_, count]) => count >= 2
      );
      const recurringTotal = recurringMerchants.reduce((sum, [name]) => {
        return (
          sum +
          (context.merchantTotals?.[name]?.total || 0) /
            (context.merchantTotals?.[name]?.count || 1)
        );
      }, 0);

      triggered = recurringMerchants.length >= ((min_count as number) || 5);
      data.count = recurringMerchants.length;
      data.amount = recurringTotal;
    }

    return { triggered, data };
  }

  /**
   * Evaluate per-merchant anomaly conditions
   * Detects transactions that are unusually high compared to the merchant's historical average
   * Params: {
   *   lookback_days?: number,      // Days to look back for recent transactions (default: 7)
   *   min_history?: number,        // Minimum historical transactions needed (default: 3)
   *   threshold_multiplier?: number // Standard deviations above mean to trigger (default: 1.5)
   * }
   */
  private evaluateMerchantAnomaly(
    context: InsightContext,
    params: Record<string, unknown>
  ): EvaluationResult {
    const {
      lookback_days = 7,
      min_history = 3,
      threshold_multiplier = 1.5,
    } = params as {
      lookback_days?: number;
      min_history?: number;
      threshold_multiplier?: number;
    };

    const now = new Date();
    const lookbackDate = new Date(
      now.getTime() - lookback_days * 24 * 60 * 60 * 1000
    );
    const historyDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // Historical baseline excludes last 7 days

    // Get recent transactions (within lookback period)
    const recentTransactions = context.transactions.filter((tx) => {
      const txDate = new Date(tx.date);
      return txDate >= lookbackDate && txDate <= now;
    });

    // Get historical transactions (before the lookback period) for baseline
    const historicalTransactions = context.transactions.filter((tx) => {
      const txDate = new Date(tx.date);
      return txDate < historyDate;
    });

    // Build merchant stats from historical transactions
    const merchantStats = new Map<
      string,
      { avgAmount: number; stdDev: number; count: number }
    >();

    // Group historical transactions by merchant
    const merchantGroups = new Map<string, number[]>();
    historicalTransactions.forEach((tx) => {
      const name = tx.merchant.name;
      if (!merchantGroups.has(name)) {
        merchantGroups.set(name, []);
      }
      merchantGroups.get(name)!.push(tx.amount);
    });

    // Calculate stats for each merchant
    merchantGroups.forEach((amounts, merchantName) => {
      if (amounts.length < min_history) return;

      const avg = amounts.reduce((sum, a) => sum + a, 0) / amounts.length;
      const squareDiffs = amounts.map((a) => Math.pow(a - avg, 2));
      const avgSquareDiff =
        squareDiffs.reduce((sum, d) => sum + d, 0) / squareDiffs.length;
      const stdDev = Math.sqrt(avgSquareDiff);

      merchantStats.set(merchantName, {
        avgAmount: avg,
        stdDev,
        count: amounts.length,
      });
    });

    // Find anomalies in recent transactions
    let triggered = false;
    const data: Record<string, unknown> = {};

    // Sort recent transactions by amount (highest first) to find the biggest anomaly
    const sortedRecent = [...recentTransactions].sort(
      (a, b) => b.amount - a.amount
    );

    for (const tx of sortedRecent) {
      const stats = merchantStats.get(tx.merchant.name);
      if (!stats) continue;

      const threshold = stats.avgAmount + stats.stdDev * threshold_multiplier;
      if (tx.amount > threshold && stats.avgAmount > 0) {
        const multiplier = Math.round((tx.amount / stats.avgAmount) * 10) / 10;

        triggered = true;
        data.amount = tx.amount;
        data.merchant = tx.merchant.name;
        data.multiplier = multiplier;
        data.transactionId = tx.id;
        data.merchant_avg = Math.round(stats.avgAmount * 100) / 100;
        break; // Only report the largest anomaly
      }
    }

    return { triggered, data };
  }

  /**
   * Evaluate reward optimization conditions
   */
  private async evaluateRewardOptimization(
    context: InsightContext,
    params: Record<string, unknown>
  ): Promise<EvaluationResult> {
    const { optimization_type, min_amount, min_points_lost } = params as {
      optimization_type: string;
      min_amount?: number;
      min_points_lost?: number;
    };

    const data: Record<string, unknown> = {};
    let triggered = false;

    switch (optimization_type) {
      case "category_mismatch": {
        // Find transactions where a better card could have been used
        const mismatch = await this.findCardMismatch(
          context,
          min_points_lost || 100
        );
        if (mismatch) {
          triggered = true;
          data.card_used = mismatch.currentCard;
          data.better_card = mismatch.betterCard;
          data.category = mismatch.category;
          data.amount = mismatch.amount;
          data.points_lost = mismatch.pointsLost;
          data.multiplier = mismatch.multiplier;
        }
        break;
      }

      case "fcf_fees": {
        // Check for foreign currency transactions
        const fcfTxs = context.currentMonthTransactions.filter(
          (tx) => tx.currency !== tx.paymentCurrency
        );
        const fcfTotal = fcfTxs.reduce((sum, tx) => sum + tx.amount, 0);
        triggered = fcfTotal >= (min_amount || 100);
        data.amount = fcfTotal;
        data.fee_percentage = 3.5;
        data.savings = Math.round(fcfTotal * 0.035);
        break;
      }

      case "zero_earn": {
        // Check for transactions that earned 0 points
        const zeroPointTxs = context.currentMonthTransactions.filter(
          (tx) => tx.rewardPoints === 0
        );
        const zeroTotal = zeroPointTxs.reduce((sum, tx) => sum + tx.amount, 0);
        triggered = zeroTotal >= (min_amount || 200);
        data.amount = zeroTotal;
        data.category = "Various";
        data.points_missed = Math.round(zeroTotal * 4);
        break;
      }
    }

    return { triggered, data };
  }

  /**
   * Find the biggest card mismatch opportunity
   * Uses RewardService to calculate what points would have been earned with different cards
   */
  private async findCardMismatch(
    context: InsightContext,
    minPointsLost: number
  ): Promise<{
    currentCard: string;
    betterCard: string;
    category: string;
    amount: number;
    pointsLost: number;
    multiplier: number;
  } | null> {
    // Need at least 2 active credit cards
    const activeCreditCards = context.paymentMethods.filter(
      (pm) => pm.active && (pm.type === "credit" || pm.type === "credit_card")
    );
    if (activeCreditCards.length < 2) {
      return null;
    }

    // Use the reward service singleton for calculating potential points

    // Track best mismatch found
    let bestMismatch: {
      currentCard: string;
      betterCard: string;
      category: string;
      amount: number;
      pointsLost: number;
      multiplier: number;
    } | null = null;

    // Analyze each current month transaction
    for (const tx of context.currentMonthTransactions) {
      // Skip non-credit card transactions
      if (
        tx.paymentMethod?.type !== "credit" &&
        tx.paymentMethod?.type !== "credit_card"
      )
        continue;
      if (!tx.paymentMethod || tx.amount <= 0) continue;

      const currentCard = tx.paymentMethod;
      const actualPoints = tx.rewardPoints || 0;
      const category = getEffectiveCategory(tx);

      // Calculate potential points for each alternative card with same points currency
      for (const altCard of activeCreditCards) {
        // Skip same card
        if (altCard.id === currentCard.id) continue;

        // Only compare cards with same points currency (fair comparison)
        if (altCard.pointsCurrency !== currentCard.pointsCurrency) continue;

        try {
          // Build calculation input exactly like SimulatorService does
          const calculationInput: CalculationInput = {
            amount: tx.amount,
            currency: tx.currency,
            convertedAmount: tx.paymentAmount,
            convertedCurrency: tx.paymentCurrency,
            paymentMethod: {
              id: altCard.id,
              issuer: altCard.issuer,
              name: altCard.name,
              pointsCurrency: altCard.pointsCurrency,
            },
            mcc: tx.mccCode || tx.merchant?.mcc?.code,
            merchantName: tx.merchant?.name || "",
            transactionType: "purchase",
            isOnline: tx.merchant?.isOnline || false,
            isContactless: tx.isContactless,
            date: DateTime.fromISO(tx.date),
          };

          // Calculate what points would have been earned with the alternative card
          const altResult =
            await rewardService.calculateRewards(calculationInput);

          const altPoints = altResult.totalPoints;
          const pointsDiff = altPoints - actualPoints;

          // Check if alternative card would earn significantly more
          if (pointsDiff >= minPointsLost) {
            const multiplier =
              actualPoints > 0
                ? Math.round((altPoints / actualPoints) * 10) / 10
                : altPoints;

            // Update best mismatch if this is bigger
            if (!bestMismatch || pointsDiff > bestMismatch.pointsLost) {
              bestMismatch = {
                currentCard: currentCard.name,
                betterCard: altCard.name,
                category,
                amount: tx.amount,
                pointsLost: pointsDiff,
                multiplier,
              };
            }
          }
        } catch (error) {
          // Skip cards that fail to calculate (e.g., missing rules)
          console.warn(
            `[findCardMismatch] Failed to calculate for ${altCard.name}:`,
            error
          );
        }
      }
    }

    return bestMismatch;
  }

  /**
   * Evaluate savings rate conditions
   */
  private evaluateSavingsRate(
    context: InsightContext,
    params: Record<string, unknown>
  ): EvaluationResult {
    const {
      threshold,
      operator = "<",
      emergency_months,
    } = params as {
      threshold: number;
      operator?: string;
      emergency_months?: number;
    };

    // Simplified - would need income data for real savings rate
    // Using budget as proxy for income
    const income = context.monthlyBudget > 0 ? context.monthlyBudget * 1.25 : 0;
    const savings = Math.max(0, income - context.totalSpent);
    const savingsRate = income > 0 ? savings / income : 0;

    const triggered = this.compareValues(savingsRate, threshold, operator);

    return {
      triggered,
      data: {
        percentage: Math.round(savingsRate * 100),
        amount: savings,
        shortfall: Math.max(0, income * 0.2 - savings),
        emergency_fund_target: context.totalSpent * (emergency_months || 3),
        current_savings: savings,
        recommended_amount: Math.round(income * 0.2),
      },
    };
  }

  /**
   * Evaluate milestone conditions
   */
  private evaluateMilestone(
    context: InsightContext,
    params: Record<string, unknown>
  ): EvaluationResult {
    const { type, days, months } = params as {
      type: string;
      days?: number;
      months?: number;
    };

    let triggered = false;
    const data: Record<string, unknown> = {};

    switch (type) {
      case "tracking_streak":
        // Check if user has transactions for consecutive days
        if (days) {
          const uniqueDates = new Set(
            context.transactions.map((tx) => tx.date.split("T")[0])
          );
          triggered = uniqueDates.size >= days;
          data.days = uniqueDates.size;
        }
        break;

      case "under_budget_streak":
        // Simplified - would need historical budget data
        triggered =
          context.monthlyBudget > 0 &&
          context.totalSpent <= context.monthlyBudget;
        data.months = months || 1;
        break;

      case "points_record": {
        const totalPoints = context.currentMonthTransactions.reduce(
          (sum, tx) => sum + tx.rewardPoints,
          0
        );
        // Would need historical data to compare
        triggered = totalPoints > 0;
        data.points = totalPoints;
        break;
      }
    }

    return { triggered, data };
  }

  /**
   * Evaluate time-based conditions
   */
  private evaluateTimeBased(
    context: InsightContext,
    params: Record<string, unknown>
  ): EvaluationResult {
    const { day_of_month, day_of_month_min, day_of_month_range, event } =
      params as Record<string, unknown>;

    let triggered = false;
    const data: Record<string, unknown> = {
      days: context.daysRemaining,
      remaining: Math.max(0, context.monthlyBudget - context.totalSpent),
      last_month_total: context.previousMonthTotal,
      amount: context.totalSpent,
      percentage: context.monthlyBudget
        ? Math.round((context.totalSpent / context.monthlyBudget) * 100)
        : 0,
    };

    if (day_of_month !== undefined) {
      triggered = context.dayOfMonth === (day_of_month as number);
    } else if (day_of_month_min !== undefined) {
      triggered = context.dayOfMonth >= (day_of_month_min as number);
    } else if (day_of_month_range && Array.isArray(day_of_month_range)) {
      const [min, max] = day_of_month_range as number[];
      triggered = context.dayOfMonth >= min && context.dayOfMonth <= max;

      // Add status message for mid-month review
      if (triggered) {
        const ratio = context.monthlyBudget
          ? context.totalSpent / context.monthlyBudget
          : 0;
        if (ratio < 0.4) {
          data.status_message = "You're well under pace - great job!";
        } else if (ratio < 0.6) {
          data.status_message = "You're right on track.";
        } else {
          data.status_message = "Consider slowing down spending.";
        }
      }
    }

    return { triggered, data };
  }

  // ==========================================================================
  // HELPER METHODS
  // ==========================================================================

  /**
   * Compare values with given operator
   */
  private compareValues(
    value: number,
    threshold: number,
    operator: string
  ): boolean {
    switch (operator) {
      case ">":
        return value > threshold;
      case ">=":
        return value >= threshold;
      case "<":
        return value < threshold;
      case "<=":
        return value <= threshold;
      case "=":
      case "==":
        return value === threshold;
      default:
        return value > threshold;
    }
  }

  /**
   * Map database insight to app insight type
   */
  private mapDbInsight(db: DbInsight): Insight {
    return {
      id: db.id,
      category: db.category as InsightCategory,
      title: db.title,
      messageTemplate: db.message_template,
      icon: db.icon || undefined,
      severity: db.severity as InsightSeverity,
      conditionType: db.condition_type as InsightConditionType,
      conditionParams: db.condition_params,
      actionText: db.action_text || undefined,
      actionType: db.action_type as Insight["actionType"],
      actionTarget: db.action_target || undefined,
      priority: db.priority,
      isActive: db.is_active,
      isDismissible: db.is_dismissible,
      cooldownDays: db.cooldown_days || undefined,
      createdAt: db.created_at,
      updatedAt: db.updated_at,
    };
  }

  /**
   * Render an insight by filling in template placeholders
   */
  private renderInsight(
    insight: Insight,
    data: Record<string, unknown>,
    context: InsightContext
  ): RenderedInsight {
    let message = insight.messageTemplate;

    // Replace all {{placeholders}} with actual values
    const placeholderRegex = /\{\{(\w+)\}\}/g;
    message = message.replace(placeholderRegex, (match, key) => {
      const value = data[key];

      if (value === undefined || value === null) {
        return match; // Keep placeholder if no value
      }

      // Format based on key name
      // Check percentage/ratio FIRST since keys like "overage_percentage" would match "overage" otherwise
      // Don't add % here - templates include the % symbol after the placeholder
      if (key.includes("percentage") || key.includes("ratio")) {
        return String(value);
      }

      if (
        key.includes("amount") ||
        key.includes("total") ||
        key.includes("savings") ||
        key.includes("shortfall") ||
        key.includes("overage") ||
        key.includes("surplus") ||
        key.includes("remaining") ||
        key.includes("projection")
      ) {
        return CurrencyService.format(value as number, context.currency);
      }

      if (key.includes("points")) {
        return (value as number).toLocaleString();
      }

      return String(value);
    });

    // Use transactionId from data as actionTarget if available (for review transaction actions)
    const actionTarget = (data.transactionId as string) || insight.actionTarget;

    return {
      id: `${insight.id}-${Date.now()}`,
      insightId: insight.id,
      category: insight.category,
      title: insight.title,
      message,
      icon: insight.icon,
      severity: insight.severity,
      actionText: insight.actionText,
      actionType: insight.actionType,
      actionTarget,
      priority: insight.priority,
      isDismissible: insight.isDismissible,
      dismissedAt: this.dismissals.has(insight.id)
        ? new Date().toISOString()
        : undefined,
    };
  }
}

// Export singleton instance
export const insightService = new InsightService();
