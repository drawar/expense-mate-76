/**
 * Fix Missing Bonus Points (Browser version)
 *
 * This script updates transactions that have 0 bonus_points with calculated values.
 * Run after backfillBonusPointsTracking if you want the database to have correct values.
 *
 * Run from browser console after logging into the app:
 *   (await import('/src/scripts/fixMissingBonusPoints.browser.ts')).fixMissingBonusPoints()
 */

import { supabase } from "@/integrations/supabase/client";
import { rewardService } from "@/core/rewards/RewardService";
import type { PaymentMethod } from "@/types";

interface TransactionRow {
  id: string;
  date: string;
  amount: number;
  currency: string;
  payment_amount: number | null;
  payment_currency: string | null;
  bonus_points: number;
  base_points: number;
  total_points: number;
  payment_method_id: string;
  mcc_code: string | null;
  is_contactless: boolean | null;
  merchants: {
    id: string;
    name: string;
    is_online: boolean | null;
    mcc_code: string | null;
  } | null;
}

interface PaymentMethodRow {
  id: string;
  name: string;
  card_catalog_id: string | null;
  statement_start_day: number | null;
  issuer: string | null;
  currency: string | null;
  points_currency: string | null;
  card_catalog?: {
    card_type_id: string;
  } | null;
}

export async function fixMissingBonusPoints() {
  console.log("=== Fix Missing Bonus Points (Browser) ===\n");

  // Check authentication
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    console.error("❌ Not authenticated. Please log in first.");
    return;
  }

  const userId = session.user.id;
  console.log("✅ Authenticated as:", session.user.email, "\n");

  // Fetch transactions with 0 bonus_points (or null)
  console.log("Fetching transactions with missing bonus points...");
  const { data: transactions, error: txError } = await supabase
    .from("transactions")
    .select(
      `
      id,
      date,
      amount,
      currency,
      payment_amount,
      payment_currency,
      bonus_points,
      base_points,
      total_points,
      payment_method_id,
      mcc_code,
      is_contactless,
      merchants (
        id,
        name,
        is_online,
        mcc_code
      )
    `
    )
    .eq("user_id", userId)
    .or("bonus_points.is.null,bonus_points.eq.0")
    .order("date", { ascending: true });

  if (txError) {
    console.error("❌ Error fetching transactions:", txError);
    return;
  }

  if (!transactions || transactions.length === 0) {
    console.log("No transactions with missing bonus points found. All good!");
    return;
  }

  console.log(`Found ${transactions.length} transactions to check\n`);

  // Fetch payment methods
  const { data: paymentMethods, error: pmError } = await supabase
    .from("payment_methods")
    .select(
      "id, name, card_catalog_id, statement_start_day, issuer, currency, points_currency, card_catalog(card_type_id)"
    )
    .eq("user_id", userId);

  if (pmError) {
    console.error("❌ Error fetching payment methods:", pmError);
    return;
  }

  const paymentMethodMap = new Map<string, PaymentMethodRow>();
  paymentMethods?.forEach((pm) => {
    paymentMethodMap.set(pm.id, pm as PaymentMethodRow);
  });

  let updated = 0;
  let skipped = 0;
  const updates: Array<{
    id: string;
    bonus_points: number;
    base_points: number;
    total_points: number;
  }> = [];

  for (const tx of transactions as TransactionRow[]) {
    const paymentMethodRow = paymentMethodMap.get(tx.payment_method_id);
    if (!paymentMethodRow) {
      skipped++;
      continue;
    }

    const cardCatalog = paymentMethodRow.card_catalog as {
      card_type_id: string;
    } | null;
    if (!cardCatalog?.card_type_id) {
      skipped++;
      continue;
    }

    // Build PaymentMethod object for RewardService
    const paymentMethod: PaymentMethod = {
      id: paymentMethodRow.id,
      name: paymentMethodRow.name,
      issuer: paymentMethodRow.issuer || "",
      currency: (paymentMethodRow.currency || "SGD") as "SGD" | "CAD" | "USD",
      pointsCurrency: paymentMethodRow.points_currency || undefined,
      cardCatalogId: paymentMethodRow.card_catalog_id || undefined,
      statementStartDay: paymentMethodRow.statement_start_day || undefined,
      isMonthlyStatement: paymentMethodRow.statement_start_day ? true : false,
    };

    try {
      const isOnline = tx.merchants?.is_online ?? false;
      const isContactless = tx.is_contactless ?? false;
      const transactionType = isOnline
        ? "online"
        : isContactless
          ? "contactless"
          : "in_store";

      const result = await rewardService.calculateRewards({
        amount: tx.amount,
        currency: tx.currency,
        convertedAmount: tx.payment_amount ?? undefined,
        convertedCurrency: tx.payment_currency ?? undefined,
        paymentMethod,
        mcc: tx.mcc_code || tx.merchants?.mcc_code || undefined,
        merchantName: tx.merchants?.name,
        isOnline,
        isContactless,
        date: new Date(tx.date),
        transactionType: transactionType as
          | "online"
          | "contactless"
          | "in_store",
        usedBonusPoints: 0,
      });

      // Only update if we calculated non-zero bonus points
      if (result.bonusPoints > 0) {
        updates.push({
          id: tx.id,
          bonus_points: result.bonusPoints,
          base_points: result.basePoints,
          total_points: result.totalPoints,
        });

        const merchant = tx.merchants?.name || "Unknown";
        console.log(
          `📝 ${tx.date.substring(0, 10)} | ${merchant.substring(0, 25).padEnd(25)} | ` +
            `+${result.bonusPoints} bonus pts (was ${tx.bonus_points || 0})`
        );
        updated++;
      } else {
        skipped++;
      }
    } catch (error) {
      console.log(`⚠️ Error calculating for tx ${tx.id}:`, error);
      skipped++;
    }
  }

  // Apply updates
  if (updates.length > 0) {
    console.log(`\nUpdating ${updates.length} transactions...`);

    for (const update of updates) {
      const { error } = await supabase
        .from("transactions")
        .update({
          bonus_points: update.bonus_points,
          base_points: update.base_points,
          total_points: update.total_points,
        })
        .eq("id", update.id);

      if (error) {
        console.error(`❌ Error updating tx ${update.id}:`, error);
      }
    }

    console.log(`✅ Updated ${updates.length} transactions`);
  }

  console.log("\n=== Summary ===");
  console.log(`✅ Updated: ${updated}`);
  console.log(`⚠️ Skipped: ${skipped}`);
  console.log("\n✅ Fix complete! Refresh the app to see updated points.");
}

// Make available globally
if (typeof window !== "undefined") {
  (
    window as Window & {
      fixMissingBonusPoints?: typeof fixMissingBonusPoints;
    }
  ).fixMissingBonusPoints = fixMissingBonusPoints;
}

export default fixMissingBonusPoints;
