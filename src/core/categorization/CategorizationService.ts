import { Transaction } from "@/types";
import {
  getCategoryResultFromMCC,
  getCategoryFromMerchantName,
  getMultiCategoryMerchant,
  applyAmountHeuristics,
  CategoryResult,
} from "@/utils/categoryMapping";
import { supabase } from "@/integrations/supabase/client";

/**
 * CategorizationService - Smart auto-categorization for transactions
 *
 * Combines multiple factors to determine the best category:
 * 1. MCC code (base confidence)
 * 2. Merchant name patterns
 * 3. Amount heuristics
 * 4. Time/date patterns
 * 5. Historical user corrections (learning)
 */
export class CategorizationService {
  private historicalPatterns: Map<string, HistoricalPattern> = new Map();
  private patternsLoaded: boolean = false;

  /**
   * Main entry point - categorize a transaction with all factors
   */
  async categorizeTransaction(
    transaction: Omit<Transaction, "id"> | Transaction
  ): Promise<CategoryResult> {
    const merchantName = transaction.merchant?.name || "";
    const mccCode =
      (transaction as Transaction).mccCode || transaction.merchant?.mcc?.code;
    const amount = transaction.amount;
    const date = new Date(transaction.date);

    // Factor 1: MCC-based categorization (base)
    let result = getCategoryResultFromMCC(mccCode);

    // Factor 2: Multi-category merchant check
    const multiCatMerchant = getMultiCategoryMerchant(merchantName);
    if (multiCatMerchant) {
      result = {
        ...result,
        category: multiCatMerchant.defaultCategory,
        confidence: Math.min(result.confidence, 0.6),
        requiresReview: true,
        isMultiCategory: true,
        suggestedCategories: multiCatMerchant.suggestedCategories,
        reason: `Multi-category merchant: ${multiCatMerchant.name}`,
      };
    }

    // Factor 3: Merchant name pattern override
    const merchantCategory = getCategoryFromMerchantName(merchantName);
    if (merchantCategory && merchantCategory !== result.category) {
      result = {
        ...result,
        category: merchantCategory,
        confidence: Math.max(result.confidence, 0.8),
        reason: `Merchant name: ${merchantName}`,
        // Clear multi-category flag when we have a specific merchant match
        // (unless the merchant itself is a known multi-category merchant)
        isMultiCategory: getMultiCategoryMerchant(merchantName) !== null,
      };
    }

    // Factor 4: Amount heuristics
    const amountResult = applyAmountHeuristics(
      amount,
      result.category,
      merchantName
    );
    if (amountResult.category !== result.category) {
      result = {
        ...result,
        category: amountResult.category,
        confidence: result.confidence * amountResult.confidenceMultiplier,
        reason: amountResult.reason || result.reason,
      };
    }

    // Factor 5: Time/date heuristics
    const timeResult = this.applyTimeHeuristics(
      date,
      result.category,
      merchantName
    );
    result = {
      ...result,
      confidence: result.confidence * timeResult.confidenceMultiplier,
    };

    // Factor 6: Historical patterns (user learning)
    const historicalResult = await this.applyHistoricalPatterns(
      merchantName,
      amount
    );
    if (historicalResult) {
      // Historical patterns have high weight if consistent
      if (historicalResult.confidence > result.confidence) {
        result = {
          ...result,
          category: historicalResult.category,
          confidence: historicalResult.confidence,
          reason: `You usually categorize "${merchantName}" as ${historicalResult.category}`,
          requiresReview: false,
        };
      }
    }

    // Cap confidence at 1.0
    result.confidence = Math.min(result.confidence, 1.0);

    // Determine if review is needed:
    // - Low confidence (<75%) always needs review
    // - Multi-category merchants need review only if confidence is below 85%
    //   (high confidence multi-category = confident about the default category)
    if (
      result.confidence < 0.75 ||
      (result.isMultiCategory && result.confidence < 0.85)
    ) {
      result.requiresReview = true;
    } else {
      result.requiresReview = false;
    }

    return result;
  }

  /**
   * Apply time/date heuristics to adjust categorization
   */
  private applyTimeHeuristics(
    date: Date,
    currentCategory: string,
    merchantName: string
  ): { confidenceMultiplier: number; reason?: string } {
    const hour = date.getHours();
    const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const name = merchantName.toLowerCase();

    // Late night purchases (10pm - 2am) - likely food delivery or entertainment
    if (hour >= 22 || hour <= 2) {
      if (
        name.includes("uber") ||
        name.includes("doordash") ||
        name.includes("skip") ||
        name.includes("delivery")
      ) {
        return { confidenceMultiplier: 1.1, reason: "Late night order" };
      }
      if (
        currentCategory === "Dining Out" ||
        currentCategory === "Fast Food & Takeout"
      ) {
        return { confidenceMultiplier: 1.05, reason: "Late night dining" };
      }
    }

    // Weekday morning (6am - 9am) - coffee runs
    if (!isWeekend && hour >= 6 && hour <= 9) {
      if (
        name.includes("coffee") ||
        name.includes("cafe") ||
        name.includes("starbucks") ||
        name.includes("tim horton")
      ) {
        return { confidenceMultiplier: 1.1, reason: "Morning coffee run" };
      }
    }

    // Weekend morning grocery shopping (8am - 11am)
    if (isWeekend && hour >= 8 && hour <= 11) {
      if (currentCategory === "Groceries") {
        return {
          confidenceMultiplier: 1.1,
          reason: "Weekend grocery shopping",
        };
      }
    }

    // Friday/Saturday evening dining (5pm - 10pm)
    if ((dayOfWeek === 5 || dayOfWeek === 6) && hour >= 17 && hour <= 22) {
      if (
        currentCategory === "Dining Out" ||
        currentCategory === "Entertainment"
      ) {
        return { confidenceMultiplier: 1.1, reason: "Weekend evening outing" };
      }
    }

    // Weekday lunch (11am - 2pm)
    if (!isWeekend && hour >= 11 && hour <= 14) {
      if (
        currentCategory === "Fast Food & Takeout" ||
        currentCategory === "Dining Out"
      ) {
        return { confidenceMultiplier: 1.05, reason: "Lunch time" };
      }
    }

    return { confidenceMultiplier: 1.0 };
  }

  /**
   * Apply historical patterns from user corrections
   */
  private async applyHistoricalPatterns(
    merchantName: string,
    amount: number
  ): Promise<{ category: string; confidence: number } | null> {
    // Ensure patterns are loaded
    if (!this.patternsLoaded) {
      await this.loadHistoricalPatterns();
    }

    // Normalize merchant name for lookup
    const normalizedName = this.normalizeMerchantName(merchantName);
    const pattern = this.historicalPatterns.get(normalizedName);

    if (!pattern || pattern.count < 3) {
      return null; // Not enough data
    }

    // Check if current amount is within typical range
    const isTypicalAmount =
      amount >= pattern.minAmount * 0.7 && amount <= pattern.maxAmount * 1.3;

    // Calculate confidence based on consistency and amount similarity
    let confidence = pattern.consistency;
    if (isTypicalAmount) {
      confidence = Math.min(1.0, confidence * 1.2);
    } else {
      confidence = confidence * 0.8;
    }

    // Require at least 70% consistency
    if (pattern.consistency < 0.7) {
      return null;
    }

    return {
      category: pattern.category,
      confidence,
    };
  }

  /**
   * Load historical patterns from database
   */
  async loadHistoricalPatterns(): Promise<void> {
    try {
      const { data: authData } = await supabase.auth.getSession();
      if (!authData?.session?.user) {
        this.patternsLoaded = true;
        return;
      }

      // Query transactions that have been manually recategorized
      const { data, error } = await supabase
        .from("transactions")
        .select(
          `
          user_category,
          amount,
          merchants:merchant_id(name)
        `
        )
        .eq("is_recategorized", true)
        .not("user_category", "is", null)
        .order("created_at", { ascending: false })
        .limit(500);

      if (error || !data) {
        console.error("Error loading historical patterns:", error);
        this.patternsLoaded = true;
        return;
      }

      // Build patterns from data
      const patternMap = new Map<
        string,
        { categories: Map<string, number>; amounts: number[] }
      >();

      for (const row of data) {
        const merchantName = (row.merchants as { name: string } | null)?.name;
        if (!merchantName || !row.user_category) continue;

        const normalizedName = this.normalizeMerchantName(merchantName);

        if (!patternMap.has(normalizedName)) {
          patternMap.set(normalizedName, {
            categories: new Map(),
            amounts: [],
          });
        }

        const entry = patternMap.get(normalizedName)!;
        entry.categories.set(
          row.user_category,
          (entry.categories.get(row.user_category) || 0) + 1
        );
        entry.amounts.push(row.amount);
      }

      // Convert to historical patterns
      for (const [merchantName, entry] of patternMap) {
        const totalCount = Array.from(entry.categories.values()).reduce(
          (a, b) => a + b,
          0
        );
        if (totalCount < 3) continue;

        // Find most common category
        let maxCount = 0;
        let topCategory = "";
        for (const [category, count] of entry.categories) {
          if (count > maxCount) {
            maxCount = count;
            topCategory = category;
          }
        }

        const consistency = maxCount / totalCount;
        const amounts = entry.amounts;
        const avgAmount = amounts.reduce((a, b) => a + b, 0) / amounts.length;

        this.historicalPatterns.set(merchantName, {
          category: topCategory,
          count: totalCount,
          consistency,
          avgAmount,
          minAmount: Math.min(...amounts),
          maxAmount: Math.max(...amounts),
        });
      }

      this.patternsLoaded = true;
      console.log(`Loaded ${this.historicalPatterns.size} historical patterns`);
    } catch (error) {
      console.error("Error loading historical patterns:", error);
      this.patternsLoaded = true;
    }
  }

  /**
   * Record a user correction to learn from
   */
  async recordUserCorrection(
    merchantName: string,
    amount: number,
    newCategory: string
  ): Promise<void> {
    const normalizedName = this.normalizeMerchantName(merchantName);
    const pattern = this.historicalPatterns.get(normalizedName);

    if (pattern) {
      // Update existing pattern
      const newCount = pattern.count + 1;
      const isMatchingCategory = pattern.category === newCategory;

      if (isMatchingCategory) {
        // Reinforce existing pattern
        pattern.count = newCount;
        pattern.consistency = Math.min(
          1.0,
          pattern.consistency + 0.1 / newCount
        );
        pattern.avgAmount =
          (pattern.avgAmount * (newCount - 1) + amount) / newCount;
        pattern.minAmount = Math.min(pattern.minAmount, amount);
        pattern.maxAmount = Math.max(pattern.maxAmount, amount);
      } else {
        // Different category - reduce consistency or switch
        const newConsistency = pattern.consistency - 0.1 / newCount;
        if (newConsistency < 0.5) {
          // Switch to new category
          pattern.category = newCategory;
          pattern.count = 1;
          pattern.consistency = 0.7;
          pattern.avgAmount = amount;
          pattern.minAmount = amount;
          pattern.maxAmount = amount;
        } else {
          pattern.consistency = newConsistency;
        }
      }
    } else {
      // Create new pattern
      this.historicalPatterns.set(normalizedName, {
        category: newCategory,
        count: 1,
        consistency: 0.7,
        avgAmount: amount,
        minAmount: amount,
        maxAmount: amount,
      });
    }
  }

  /**
   * Normalize merchant name for consistent lookup
   */
  private normalizeMerchantName(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "")
      .trim();
  }

  /**
   * Get category suggestions for a transaction
   * Returns multiple options ranked by confidence
   */
  async getCategorySuggestions(
    transaction: Omit<Transaction, "id"> | Transaction,
    limit: number = 4
  ): Promise<Array<{ category: string; confidence: number; reason: string }>> {
    const result = await this.categorizeTransaction(transaction);
    const suggestions: Array<{
      category: string;
      confidence: number;
      reason: string;
    }> = [];

    // Add primary suggestion
    suggestions.push({
      category: result.category,
      confidence: result.confidence,
      reason: result.reason,
    });

    // Add multi-category suggestions if applicable
    if (result.suggestedCategories) {
      for (const category of result.suggestedCategories) {
        if (category !== result.category && suggestions.length < limit) {
          suggestions.push({
            category,
            confidence: result.confidence * 0.7,
            reason: "Alternative for multi-category merchant",
          });
        }
      }
    }

    // Add MCC-derived category if different
    const merchantName = transaction.merchant?.name || "";
    const mccCode =
      (transaction as Transaction).mccCode || transaction.merchant?.mcc?.code;
    const mccResult = getCategoryResultFromMCC(mccCode);

    if (
      mccResult.category !== result.category &&
      !suggestions.find((s) => s.category === mccResult.category) &&
      suggestions.length < limit
    ) {
      suggestions.push({
        category: mccResult.category,
        confidence: mccResult.confidence * 0.6,
        reason: `Merchant type: ${mccResult.reason}`,
      });
    }

    return suggestions.slice(0, limit);
  }

  /**
   * Batch categorize multiple transactions
   */
  async batchCategorize(
    transactions: Array<Omit<Transaction, "id"> | Transaction>
  ): Promise<Map<string, CategoryResult>> {
    const results = new Map<string, CategoryResult>();

    // Load patterns once for batch
    if (!this.patternsLoaded) {
      await this.loadHistoricalPatterns();
    }

    for (const transaction of transactions) {
      const id = (transaction as Transaction).id || crypto.randomUUID();
      const result = await this.categorizeTransaction(transaction);
      results.set(id, result);
    }

    return results;
  }

  /**
   * Get transactions that need review
   */
  async getTransactionsNeedingReview(): Promise<Transaction[]> {
    try {
      const { data: authData } = await supabase.auth.getSession();
      if (!authData?.session?.user) {
        return [];
      }

      const { data, error } = await supabase
        .from("transactions")
        .select(
          `
          *,
          merchants:merchant_id(id, name, mcc, mcc_code, is_online),
          payment_methods:payment_method_id(id, name, type, issuer)
        `
        )
        .eq("needs_review", true)
        .or("is_deleted.is.false,is_deleted.is.null")
        .order("date", { ascending: false })
        .limit(50);

      if (error) {
        console.error("Error fetching transactions needing review:", error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error("Error in getTransactionsNeedingReview:", error);
      return [];
    }
  }

  /**
   * Clear cached patterns (for testing or refresh)
   */
  clearCache(): void {
    this.historicalPatterns.clear();
    this.patternsLoaded = false;
  }
}

// Types
interface HistoricalPattern {
  category: string;
  count: number;
  consistency: number; // 0.0 to 1.0
  avgAmount: number;
  minAmount: number;
  maxAmount: number;
}

// Singleton instance
export const categorizationService = new CategorizationService();
