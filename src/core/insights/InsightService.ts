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

      const result = evaluator(context, insight.conditionParams);

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

    // Calculate totals
    const totalSpent = currentMonthTransactions.reduce(
      (sum, tx) => sum + tx.amount,
      0
    );

    const previousMonthTotal = previousMonthTransactions.reduce(
      (sum, tx) => sum + tx.amount,
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
      const category = getEffectiveCategory(tx);
      categoryTotals[category] = (categoryTotals[category] || 0) + tx.amount;

      const tier = getSpendingTier(category);
      tierTotals[tier] = (tierTotals[tier] || 0) + tx.amount;

      const behavior = getBehavioralCategory(category);
      behaviorTotals[behavior] = (behaviorTotals[behavior] || 0) + tx.amount;

      const merchantName = tx.merchant.name;
      if (!merchantTotals[merchantName]) {
        merchantTotals[merchantName] = { total: 0, count: 0 };
      }
      merchantTotals[merchantName].total += tx.amount;
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
    } = params as {
      categories_a: string[];
      categories_b: string[];
      label_a?: string;
      label_b?: string;
      cost_multiplier?: number;
      min_transactions?: number;
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

    // Scale to weekly average (7 days)
    const weeksInPeriod = daysInPeriod / 7;
    const weeklyA = weeksInPeriod > 0 ? totalA / weeksInPeriod : 0;
    const weeklyB = weeksInPeriod > 0 ? totalB / weeksInPeriod : 0;

    // Calculate estimated savings
    // Assumption: If you replaced dining out with groceries, you'd save the difference
    // But groceries for same meals would cost ~1/cost_multiplier of dining out
    const equivalentGroceryCost = totalB / cost_multiplier;
    const potentialSavingsFromB = totalB - equivalentGroceryCost;

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
        weekly_b: Math.round(weeklyB * 100) / 100,
        label_a,
        label_b,
        days_tracked: daysInPeriod,
        potential_savings: Math.round(potentialSavingsFromB),
        weekly_savings:
          Math.round((potentialSavingsFromB / weeksInPeriod) * 100) / 100,
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
      let weekendCount = 0;
      let weekdayCount = 0;

      transactions.forEach((tx) => {
        const date = parseISO(tx.date);
        if (isWeekend(date)) {
          weekendTotal += tx.amount;
          weekendCount += 1;
        } else {
          weekdayTotal += tx.amount;
          weekdayCount += 1;
        }
      });

      // Normalize by number of weekend vs weekday days
      const avgWeekend = weekendCount > 0 ? weekendTotal / 8 : 0; // ~8 weekend days/month
      const avgWeekday = weekdayCount > 0 ? weekdayTotal / 22 : 0; // ~22 weekday days/month
      const ratio = avgWeekday > 0 ? avgWeekend / avgWeekday : 0;

      triggered = ratio >= (weekend_vs_weekday_ratio as number);
      data.percentage = Math.round((ratio - 1) * 100);
      data.weekend_amount = weekendTotal;
      data.weekday_amount = weekdayTotal;
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
   * Evaluate reward optimization conditions
   */
  private evaluateRewardOptimization(
    context: InsightContext,
    params: Record<string, unknown>
  ): EvaluationResult {
    const { optimization_type, min_amount } = params as {
      optimization_type: string;
      min_amount?: number;
    };

    // Simplified - real implementation would analyze card reward rules
    const data: Record<string, unknown> = {};
    let triggered = false;

    switch (optimization_type) {
      case "category_mismatch":
        // Would need to compare actual card used vs optimal card for category
        // Simplified: just check if user has multiple cards
        triggered = context.paymentMethods.length > 1;
        data.card_used = "Current Card";
        data.better_card = "Another Card";
        data.category = "Dining";
        data.amount = 100;
        data.multiplier = 4;
        break;

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

      if (key.includes("percentage") || key.includes("ratio")) {
        return `${value}%`;
      }

      if (key.includes("points")) {
        return (value as number).toLocaleString();
      }

      return String(value);
    });

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
      actionTarget: insight.actionTarget,
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
