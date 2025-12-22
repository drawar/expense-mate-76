/**
 * Migration Script: Auto-categorize existing transactions
 *
 * This script runs the categorization engine on all existing transactions
 * to populate auto_category_confidence, needs_review, and category_suggestion_reason fields.
 *
 * Usage:
 *   npx tsx scripts/migrate-categorize-transactions.ts
 *
 * Options:
 *   --dry-run    Show what would be updated without making changes
 *   --batch=N    Process N transactions at a time (default: 100)
 */

import { createClient } from "@supabase/supabase-js";
import {
  getCategoryResultFromMCC,
  getCategoryFromMerchantName,
  getMultiCategoryMerchant,
  applyAmountHeuristics,
  CategoryResult,
} from "../src/utils/categoryMapping";

// Get Supabase credentials from environment
const supabaseUrl = process.env.VITE_SUPABASE_URL;
// Prefer service role key for migrations (bypasses RLS), fall back to anon key
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error(
    "Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables"
  );
  process.exit(1);
}

const usingServiceRole = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
console.log(
  `Using ${usingServiceRole ? "service role key" : "anon key"} for database access`
);

const supabase = createClient(supabaseUrl, supabaseKey);

// Parse command line arguments
const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const batchArg = args.find((a) => a.startsWith("--batch="));
const batchSize = batchArg ? parseInt(batchArg.split("=")[1], 10) : 100;

interface TransactionRow {
  id: string;
  amount: number;
  date: string;
  user_category: string | null;
  is_recategorized: boolean | null;
  auto_category_confidence: number | null;
  needs_review: boolean | null;
  category_suggestion_reason: string | null;
  merchants: {
    name: string;
    mcc_code: string | null;
  } | null;
}

/**
 * Categorize a single transaction using multi-factor scoring
 */
function categorizeTransaction(row: TransactionRow): CategoryResult {
  const merchantName = row.merchants?.name || "";
  const mccCode = row.merchants?.mcc_code || undefined;
  const amount = row.amount;
  const date = new Date(row.date);

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
  const timeResult = applyTimeHeuristics(date, result.category, merchantName);
  result = {
    ...result,
    confidence: result.confidence * timeResult.confidenceMultiplier,
  };

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
function applyTimeHeuristics(
  date: Date,
  currentCategory: string,
  merchantName: string
): { confidenceMultiplier: number; reason?: string } {
  const hour = date.getHours();
  const dayOfWeek = date.getDay();
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
      return { confidenceMultiplier: 1.1, reason: "Weekend grocery shopping" };
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

async function main() {
  console.log("=== Transaction Categorization Migration ===");
  console.log(`Mode: ${dryRun ? "DRY RUN (no changes will be made)" : "LIVE"}`);
  console.log(`Batch size: ${batchSize}`);
  console.log("");

  // Count total transactions
  const { count: totalCount, error: countError } = await supabase
    .from("transactions")
    .select("*", { count: "exact", head: true })
    .or("is_deleted.is.false,is_deleted.is.null");

  if (countError) {
    console.error("Error counting transactions:", countError);
    process.exit(1);
  }

  console.log(`Total transactions to process: ${totalCount}`);
  console.log("");

  let processed = 0;
  let updated = 0;
  let skipped = 0;
  let errors = 0;
  let needsReviewCount = 0;

  const stats = {
    highConfidence: 0, // >= 0.85
    mediumConfidence: 0, // 0.75 - 0.84
    lowConfidence: 0, // < 0.75
    multiCategory: 0,
    categoryChanges: 0,
  };

  // Process in batches
  let offset = 0;
  while (offset < (totalCount || 0)) {
    const { data: transactions, error: fetchError } = await supabase
      .from("transactions")
      .select(
        `
        id,
        amount,
        date,
        user_category,
        is_recategorized,
        auto_category_confidence,
        needs_review,
        category_suggestion_reason,
        merchants:merchant_id(name, mcc_code)
      `
      )
      .or("is_deleted.is.false,is_deleted.is.null")
      .order("created_at", { ascending: true })
      .range(offset, offset + batchSize - 1);

    if (fetchError) {
      console.error(`Error fetching batch at offset ${offset}:`, fetchError);
      errors++;
      offset += batchSize;
      continue;
    }

    if (!transactions || transactions.length === 0) {
      break;
    }

    for (const row of transactions as unknown as TransactionRow[]) {
      processed++;

      // Skip if already user-recategorized (preserve user's choice)
      if (row.is_recategorized && row.user_category) {
        skipped++;
        continue;
      }

      // Run categorization
      const result = categorizeTransaction(row);

      // Track statistics
      if (result.confidence >= 0.85) {
        stats.highConfidence++;
      } else if (result.confidence >= 0.75) {
        stats.mediumConfidence++;
      } else {
        stats.lowConfidence++;
      }

      if (result.isMultiCategory) {
        stats.multiCategory++;
      }

      if (result.requiresReview) {
        needsReviewCount++;
      }

      // Check if category changed from current
      if (row.user_category && row.user_category !== result.category) {
        stats.categoryChanges++;
      }

      // Update the transaction
      if (!dryRun) {
        const updateData: Record<string, unknown> = {
          auto_category_confidence: result.confidence,
          needs_review: result.requiresReview,
          category_suggestion_reason: result.reason,
          // Always update user_category with the new category system
          // (since we already skipped user-recategorized transactions)
          user_category: result.category,
          category: result.category, // Sync legacy field too
        };

        const { error: updateError } = await supabase
          .from("transactions")
          .update(updateData)
          .eq("id", row.id);

        if (updateError) {
          console.error(`Error updating transaction ${row.id}:`, updateError);
          errors++;
        } else {
          updated++;
        }
      } else {
        updated++;
      }

      // Progress indicator
      if (processed % 50 === 0) {
        process.stdout.write(`\rProcessed: ${processed}/${totalCount}`);
      }
    }

    offset += batchSize;
  }

  console.log("\n");
  console.log("=== Migration Complete ===");
  console.log(`Processed: ${processed}`);
  console.log(`Updated: ${updated}`);
  console.log(`Skipped (user-categorized): ${skipped}`);
  console.log(`Errors: ${errors}`);
  console.log("");
  console.log("=== Confidence Distribution ===");
  console.log(`High confidence (≥0.85): ${stats.highConfidence}`);
  console.log(`Medium confidence (0.75-0.84): ${stats.mediumConfidence}`);
  console.log(`Low confidence (<0.75): ${stats.lowConfidence}`);
  console.log("");
  console.log(`Multi-category merchants: ${stats.multiCategory}`);
  console.log(`Transactions needing review: ${needsReviewCount}`);
  console.log(`Category changes suggested: ${stats.categoryChanges}`);

  if (dryRun) {
    console.log("");
    console.log("This was a dry run. Run without --dry-run to apply changes.");
  }
}

main().catch(console.error);
