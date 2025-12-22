import { useState, useEffect, useCallback, useMemo } from "react";
import { insightService } from "@/core/insights";
import {
  Transaction,
  Currency,
  PaymentMethod,
  RenderedInsight,
  InsightCategory,
} from "@/types";

interface UseInsightsOptions {
  /** Monthly budget amount */
  monthlyBudget?: number;
  /** Display currency */
  currency?: Currency;
  /** Available payment methods for optimization insights */
  paymentMethods?: PaymentMethod[];
  /** Include dismissed insights */
  includeDismissed?: boolean;
  /** Maximum number of insights to return */
  maxResults?: number;
  /** Filter by insight categories */
  categories?: InsightCategory[];
  /** Auto-refresh interval in milliseconds (0 to disable) */
  refreshInterval?: number;
}

interface UseInsightsResult {
  /** List of rendered insights */
  insights: RenderedInsight[];
  /** Loading state */
  isLoading: boolean;
  /** Error message if any */
  error: string | null;
  /** Dismiss an insight */
  dismissInsight: (insightId: string) => Promise<void>;
  /** Clear a dismissal */
  clearDismissal: (insightId: string) => Promise<void>;
  /** Manually refresh insights */
  refresh: () => Promise<void>;
  /** Insights grouped by category */
  insightsByCategory: Record<InsightCategory, RenderedInsight[]>;
  /** Insights grouped by severity */
  insightsBySeverity: Record<string, RenderedInsight[]>;
  /** Count of high-priority insights (warnings/dangers) */
  urgentCount: number;
}

/**
 * Hook for evaluating and managing financial insights
 *
 * @example
 * ```tsx
 * const { insights, dismissInsight, urgentCount } = useInsights(
 *   transactions,
 *   { monthlyBudget: 3000, currency: "SGD" }
 * );
 *
 * return (
 *   <div>
 *     {urgentCount > 0 && <Badge>{urgentCount} alerts</Badge>}
 *     {insights.map(insight => (
 *       <InsightCard
 *         key={insight.id}
 *         insight={insight}
 *         onDismiss={() => dismissInsight(insight.insightId)}
 *       />
 *     ))}
 *   </div>
 * );
 * ```
 */
export function useInsights(
  transactions: Transaction[],
  options: UseInsightsOptions = {}
): UseInsightsResult {
  const {
    monthlyBudget = 0,
    currency = "SGD",
    paymentMethods = [],
    includeDismissed = false,
    maxResults = 10,
    categories,
    refreshInterval = 0,
  } = options;

  const [insights, setInsights] = useState<RenderedInsight[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch and evaluate insights
   */
  const fetchInsights = useCallback(async () => {
    if (transactions.length === 0) {
      setInsights([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await insightService.evaluateInsights(transactions, {
        monthlyBudget,
        currency,
        paymentMethods,
        includeDismissed,
        maxResults,
        categories,
      });

      setInsights(result);
    } catch (err) {
      console.error("Failed to evaluate insights:", err);
      setError(err instanceof Error ? err.message : "Failed to load insights");
    } finally {
      setIsLoading(false);
    }
  }, [
    transactions,
    monthlyBudget,
    currency,
    paymentMethods,
    includeDismissed,
    maxResults,
    categories,
  ]);

  /**
   * Initial fetch and refresh on dependency changes
   */
  useEffect(() => {
    fetchInsights();
  }, [fetchInsights]);

  /**
   * Auto-refresh interval
   */
  useEffect(() => {
    if (refreshInterval <= 0) return;

    const interval = setInterval(fetchInsights, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchInsights, refreshInterval]);

  /**
   * Dismiss an insight
   */
  const dismissInsight = useCallback(async (insightId: string) => {
    const success = await insightService.dismissInsight(insightId);
    if (success) {
      // Remove from local state immediately
      setInsights((prev) => prev.filter((i) => i.insightId !== insightId));
    }
  }, []);

  /**
   * Clear a dismissal
   */
  const clearDismissal = useCallback(
    async (insightId: string) => {
      const success = await insightService.clearDismissal(insightId);
      if (success) {
        // Re-fetch to include the insight again
        fetchInsights();
      }
    },
    [fetchInsights]
  );

  /**
   * Group insights by category
   */
  const insightsByCategory = useMemo(() => {
    const groups: Record<InsightCategory, RenderedInsight[]> = {
      spending: [],
      budget: [],
      savings: [],
      behavior: [],
      optimization: [],
      milestone: [],
      warning: [],
    };

    insights.forEach((insight) => {
      groups[insight.category].push(insight);
    });

    return groups;
  }, [insights]);

  /**
   * Group insights by severity
   */
  const insightsBySeverity = useMemo(() => {
    const groups: Record<string, RenderedInsight[]> = {
      danger: [],
      warning: [],
      success: [],
      info: [],
    };

    insights.forEach((insight) => {
      groups[insight.severity].push(insight);
    });

    return groups;
  }, [insights]);

  /**
   * Count urgent insights (warnings and dangers)
   */
  const urgentCount = useMemo(() => {
    return insights.filter(
      (i) => i.severity === "danger" || i.severity === "warning"
    ).length;
  }, [insights]);

  return {
    insights,
    isLoading,
    error,
    dismissInsight,
    clearDismissal,
    refresh: fetchInsights,
    insightsByCategory,
    insightsBySeverity,
    urgentCount,
  };
}

/**
 * Hook for getting a single category of insights
 */
export function useInsightsByCategory(
  transactions: Transaction[],
  category: InsightCategory,
  options: Omit<UseInsightsOptions, "categories"> = {}
): UseInsightsResult {
  return useInsights(transactions, {
    ...options,
    categories: [category],
  });
}

/**
 * Hook for getting only urgent insights (warnings and dangers)
 */
export function useUrgentInsights(
  transactions: Transaction[],
  options: Omit<UseInsightsOptions, "categories"> = {}
): UseInsightsResult {
  return useInsights(transactions, {
    ...options,
    categories: ["warning", "budget"],
    maxResults: options.maxResults || 5,
  });
}
