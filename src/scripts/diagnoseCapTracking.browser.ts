/**
 * Diagnostic Script for Cap Tracking Issues
 *
 * Run from browser console after logging in:
 *   (await import('/src/scripts/diagnoseCapTracking.browser.ts')).diagnoseCapTracking()
 */

import { supabase } from "@/integrations/supabase/client";

export async function diagnoseCapTracking() {
  console.log("=== Cap Tracking Diagnostic ===\n");

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    console.error("❌ Not authenticated. Please log in first.");
    return;
  }

  const userId = session.user.id;
  console.log("✅ Authenticated as:", session.user.email, "\n");

  // Get transactions with bonus points in current period (Dec 19 onwards)
  console.log("=== Transactions with bonus points (Dec 19+) ===");
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
      payment_method_id,
      mcc_code,
      merchants (name, is_online, mcc_code),
      payment_methods!inner (name, card_catalog_id, statement_start_day, card_catalog(card_type_id, name))
    `
    )
    .eq("user_id", userId)
    .gt("bonus_points", 0)
    .gte("date", "2025-12-19")
    .order("date", { ascending: false });

  if (txError) {
    console.error("Error fetching transactions:", txError);
    return;
  }

  console.log(`Found ${transactions?.length || 0} transactions:\n`);
  for (const tx of transactions || []) {
    const pm = tx.payment_methods as {
      name: string;
      card_catalog_id: string | null;
      statement_start_day: number | null;
      card_catalog: { card_type_id: string; name: string } | null;
    };
    const merchant = tx.merchants as {
      name: string;
      is_online: boolean | null;
      mcc_code: string | null;
    } | null;
    console.log(`  ${tx.date} | ${merchant?.name || "Unknown"}`);
    console.log(
      `    Card: ${pm?.name} (card_type_id: ${pm?.card_catalog?.card_type_id})`
    );
    console.log(
      `    Amount: ${tx.payment_amount ?? tx.amount} ${tx.payment_currency ?? tx.currency}`
    );
    console.log(`    Bonus Points: ${tx.bonus_points}`);
    console.log(`    MCC: ${tx.mcc_code || merchant?.mcc_code || "N/A"}`);
    console.log(`    Statement Day: ${pm?.statement_start_day || "N/A"}\n`);
  }

  // Get unique card_type_ids from these transactions
  const cardTypeIds = new Set<string>();
  for (const tx of transactions || []) {
    const pm = tx.payment_methods as {
      card_catalog: { card_type_id: string } | null;
    };
    if (pm?.card_catalog?.card_type_id) {
      cardTypeIds.add(pm.card_catalog.card_type_id);
    }
  }

  // Get reward rules for these cards
  console.log("=== Reward Rules with Caps ===");
  const { data: rules, error: rulesError } = await supabase
    .from("reward_rules")
    .select("*")
    .in("card_type_id", Array.from(cardTypeIds))
    .gt("monthly_cap", 0)
    .order("priority", { ascending: false });

  if (rulesError) {
    console.error("Error fetching rules:", rulesError);
    return;
  }

  console.log(`Found ${rules?.length || 0} capped rules:\n`);
  for (const rule of rules || []) {
    console.log(`  Rule: ${rule.name}`);
    console.log(`    card_type_id: ${rule.card_type_id}`);
    console.log(
      `    monthly_cap: ${rule.monthly_cap} (${rule.monthly_cap_type || "bonus_points"})`
    );
    console.log(
      `    period_type: ${rule.monthly_spend_period_type || "calendar"}`
    );
    console.log(`    cap_group_id: ${rule.cap_group_id || "none"}`);
    console.log(`    priority: ${rule.priority}`);
    console.log(`    conditions: ${JSON.stringify(rule.conditions)}\n`);
  }

  // Get current tracking records
  console.log("=== Current Tracking Records ===");
  const { data: tracking, error: trackError } = await supabase
    .from("bonus_points_tracking")
    .select("*")
    .eq("user_id", userId)
    .gte("period_year", 2025);

  if (trackError) {
    console.error("Error fetching tracking:", trackError);
    return;
  }

  console.log(`Found ${tracking?.length || 0} tracking records:\n`);
  for (const rec of tracking || []) {
    console.log(`  rule_id: ${rec.rule_id}`);
    console.log(
      `  period: ${rec.period_year}-${String(rec.period_month).padStart(2, "0")} (${rec.period_type})`
    );
    console.log(`  statement_day: ${rec.statement_day}`);
    console.log(`  used_bonus_points: ${rec.used_bonus_points}\n`);
  }

  console.log("=== Analysis ===");

  // Check if rules have consistent period types
  const periodTypes = new Set(
    rules?.map((r) => r.monthly_spend_period_type || "calendar")
  );
  if (periodTypes.size > 1) {
    console.log(
      "⚠️ WARNING: Rules have inconsistent period types:",
      Array.from(periodTypes)
    );
    console.log(
      "   This could cause transactions to track against different periods!"
    );
  }

  // Check if rules that should share caps have cap_group_id
  const rulesWithCaps =
    rules?.filter((r) => r.monthly_cap && r.monthly_cap > 0) || [];
  const rulesWithoutCapGroup = rulesWithCaps.filter((r) => !r.cap_group_id);
  if (rulesWithoutCapGroup.length > 1) {
    console.log("⚠️ WARNING: Multiple capped rules without cap_group_id:");
    rulesWithoutCapGroup.forEach((r) => console.log(`   - ${r.name}`));
    console.log("   These rules will track caps separately!");
  }

  console.log("\n✅ Diagnostic complete");
}

if (typeof window !== "undefined") {
  (
    window as Window & { diagnoseCapTracking?: typeof diagnoseCapTracking }
  ).diagnoseCapTracking = diagnoseCapTracking;
}

export default diagnoseCapTracking;
