/**
 * Backfill Bonus Points Tracking (Node.js version)
 *
 * This script recalculates and tracks bonus points for existing transactions.
 * Use this when:
 * - Transactions were created before cap tracking was implemented
 * - Cap progress bar shows 0 despite having eligible transactions
 * - Tracking data needs to be recalculated
 *
 * Run with: source .env && npx tsx src/scripts/backfillBonusPointsTracking.ts
 */

import { createClient } from "@supabase/supabase-js";

// Create Supabase client for Node.js
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error(
    "❌ Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY"
  );
  console.error(
    "   Run with: source .env && npx tsx src/scripts/backfillBonusPointsTracking.ts"
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

interface TransactionRow {
  id: string;
  date: string;
  amount: number;
  currency: string;
  payment_amount: number | null;
  payment_currency: string | null;
  bonus_points: number;
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
  // Joined from card_catalog
  card_catalog?: {
    card_type_id: string;
  } | null;
}

interface RewardRuleRow {
  id: string;
  name: string;
  card_type_id: string;
  priority: number;
  conditions: unknown;
  monthly_cap: number | null;
  monthly_cap_type: string | null;
  cap_duration: string | null;
  cap_group_id: string | null;
  promo_start_date: string | null;
  enabled: boolean;
}

interface TrackingRecord {
  user_id: string;
  rule_id: string;
  payment_method_id: string;
  period_type: string;
  period_year: number;
  period_month: number;
  statement_day: number;
  used_bonus_points: number;
}

// Helper to determine which period a date falls into
// IMPORTANT: Must match BonusPointsTracker behavior
function getPeriodKey(
  date: Date,
  periodType: string,
  statementDay: number,
  promoStartDate?: Date
): { year: number; month: number; statementDay: number } {
  // For promotional periods, use promoStartDate for period identification
  if (periodType === "promotional_period" && promoStartDate) {
    return {
      year: promoStartDate.getFullYear(),
      month: promoStartDate.getMonth() + 1,
      statementDay: 1,
    };
  }

  // For calendar periods, use statementDay=1 (resets on 1st of month)
  if (periodType === "calendar_month") {
    return {
      year: date.getFullYear(),
      month: date.getMonth() + 1,
      statementDay: 1,
    };
  }

  // For statement_month periods, calculate which statement period the date falls into
  // Statement period runs from statementDay of one month to (statementDay-1) of next month
  // e.g., statement_day=19 means periods are: Dec 19 - Jan 18, Jan 19 - Feb 18, etc.
  const txDay = date.getDate();
  let periodYear = date.getFullYear();
  let periodMonth = date.getMonth() + 1; // 1-indexed

  // If transaction is BEFORE the statement day, it belongs to the PREVIOUS month's period
  // e.g., Jan 5 with statement_day=19 → belongs to Dec period (Dec 19 - Jan 18)
  if (txDay < statementDay) {
    periodMonth -= 1;
    if (periodMonth === 0) {
      periodMonth = 12;
      periodYear -= 1;
    }
  }

  return { year: periodYear, month: periodMonth, statementDay };
}

// Check if a transaction matches a rule's conditions
function matchesRule(
  tx: TransactionRow,
  rule: RewardRuleRow,
  cardCatalogId: string | null
): boolean {
  // Check if rule applies to this card type
  if (rule.card_type_id !== cardCatalogId) {
    return false;
  }

  if (!rule.enabled) {
    return false;
  }

  // Handle conditions - may be stored as JSON string or already parsed array
  let conditions: Array<{
    type: string;
    operation: string;
    values: string[];
  }>;

  if (typeof rule.conditions === "string") {
    try {
      conditions = JSON.parse(rule.conditions);
    } catch {
      conditions = [];
    }
  } else {
    conditions = (rule.conditions as typeof conditions) || [];
  }

  if (!conditions || conditions.length === 0) {
    // Base rule - matches everything
    return true;
  }

  const merchant = tx.merchants;
  const mcc = tx.mcc_code || merchant?.mcc_code || "";
  const merchantName = (merchant?.name || "").toLowerCase();
  const isOnline = merchant?.is_online ?? false;

  for (const condition of conditions) {
    let matches = false;

    if (condition.type === "transaction_type") {
      if (condition.values.includes("online")) {
        matches = isOnline;
      } else if (condition.values.includes("in_store")) {
        matches = !isOnline;
      } else {
        matches = true; // Other transaction types always match
      }

      if (
        condition.operation === "exclude" ||
        condition.operation === "not_equals"
      ) {
        matches = !matches;
      }
    } else if (condition.type === "mcc") {
      const mccMatches = condition.values.includes(mcc);
      if (
        condition.operation === "include" ||
        condition.operation === "equals"
      ) {
        matches = mccMatches;
      } else {
        matches = !mccMatches;
      }
    } else if (condition.type === "merchant") {
      const merchantMatches = condition.values.some(
        (v) =>
          merchantName.includes(v.toLowerCase()) ||
          v.toLowerCase().includes(merchantName)
      );
      if (
        condition.operation === "include" ||
        condition.operation === "equals"
      ) {
        matches = merchantMatches;
      } else {
        matches = !merchantMatches;
      }
    } else {
      // Unknown condition type - assume match
      matches = true;
    }

    if (!matches) {
      return false;
    }
  }

  return true;
}

async function backfillBonusPointsTracking() {
  console.log("=== Backfill Bonus Points Tracking ===\n");

  // Sign in - read credentials from environment
  const userEmail = process.env.SUPABASE_USER_EMAIL;
  const userPassword = process.env.SUPABASE_USER_PASSWORD;

  if (!userEmail || !userPassword) {
    console.error("❌ Missing SUPABASE_USER_EMAIL or SUPABASE_USER_PASSWORD");
    console.error(
      "   Set these environment variables before running the script"
    );
    process.exit(1);
  }

  console.log("Signing in...");
  const { data: authData, error: authError } =
    await supabase.auth.signInWithPassword({
      email: userEmail,
      password: userPassword,
    });

  if (authError || !authData.session) {
    console.error("❌ Authentication failed:", authError?.message);
    process.exit(1);
  }

  const userId = authData.session.user.id;
  console.log("✅ Authenticated as:", authData.session.user.email, "\n");

  // Fetch all transactions with bonus points
  console.log("Fetching transactions with bonus points...");
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
    .gt("bonus_points", 0)
    .order("date", { ascending: true });

  if (txError) {
    console.error("❌ Error fetching transactions:", txError);
    process.exit(1);
  }

  if (!transactions || transactions.length === 0) {
    console.log("No transactions with bonus points found.");
    return;
  }

  console.log(`Found ${transactions.length} transactions with bonus points\n`);

  // Fetch payment methods with card_catalog join to get card_type_id
  const { data: paymentMethods, error: pmError } = await supabase
    .from("payment_methods")
    .select(
      "id, name, card_catalog_id, statement_start_day, card_catalog(card_type_id)"
    )
    .eq("user_id", userId);

  if (pmError) {
    console.error("❌ Error fetching payment methods:", pmError);
    process.exit(1);
  }

  const paymentMethodMap = new Map<string, PaymentMethodRow>();
  paymentMethods?.forEach((pm) => {
    paymentMethodMap.set(pm.id, pm as PaymentMethodRow);
  });

  // Fetch all reward rules
  const { data: allRules, error: rulesError } = await supabase
    .from("reward_rules")
    .select("*")
    .order("priority", { ascending: false });

  if (rulesError) {
    console.error("❌ Error fetching reward rules:", rulesError);
    process.exit(1);
  }

  console.log(`Loaded ${allRules?.length || 0} reward rules\n`);

  // Build tracking records by accumulating values for each unique key
  const trackingMap = new Map<string, TrackingRecord>();

  let processed = 0;
  let skipped = 0;

  for (const tx of transactions as TransactionRow[]) {
    const paymentMethod = paymentMethodMap.get(tx.payment_method_id);
    if (!paymentMethod) {
      console.log(`⚠️ Skipping tx ${tx.id}: Payment method not found`);
      skipped++;
      continue;
    }

    // Find matching rules for this transaction's card type
    // card_type_id comes from the joined card_catalog table
    const cardCatalog = paymentMethod.card_catalog as {
      card_type_id: string;
    } | null;
    const cardTypeId = cardCatalog?.card_type_id;
    if (!cardTypeId) {
      console.log(
        `⚠️ Skipping tx ${tx.id}: No card_type_id for payment method (card_catalog not linked)`
      );
      skipped++;
      continue;
    }

    // Find the highest priority matching rule with a cap
    const matchingRules = (allRules as RewardRuleRow[])
      .filter((rule) => matchesRule(tx, rule, cardTypeId))
      .filter((rule) => rule.monthly_cap && rule.monthly_cap > 0);

    if (matchingRules.length === 0) {
      console.log(
        `⚠️ Skipping tx ${tx.id} (${tx.merchants?.name || "Unknown"}): No capped rule matched`
      );
      skipped++;
      continue;
    }

    // Debug: show all matching rules for this transaction
    const merchantObj = tx.merchants;
    const debugMcc = tx.mcc_code || merchantObj?.mcc_code || "";
    const debugIsOnline = merchantObj?.is_online ?? false;
    const debugMerchantName = (merchantObj?.name || "").toLowerCase();
    const shouldDebug =
      matchingRules.length > 1 ||
      debugMcc === "4814" ||
      debugMerchantName.includes("singtel") ||
      debugMerchantName.includes("made in");
    if (shouldDebug) {
      console.log(
        `\n  DEBUG tx ${tx.id} (${merchantObj?.name}): MCC=${debugMcc}, isOnline=${debugIsOnline}`
      );
      console.log(`  Matched ${matchingRules.length} rules:`);
      matchingRules.forEach((r, i) =>
        console.log(`    ${i + 1}. ${r.name} (priority ${r.priority})`)
      );
    }

    // Take highest priority rule (already sorted by priority desc)
    const rule = matchingRules[0];
    const capType = rule.monthly_cap_type || "bonus_points";
    const periodType = rule.cap_duration || "calendar_month";
    const statementDay = paymentMethod.statement_start_day ?? 1;
    const promoStartDate = rule.promo_start_date
      ? new Date(rule.promo_start_date)
      : undefined;

    // Get period key for this transaction
    const txDate = new Date(tx.date);
    const period = getPeriodKey(
      txDate,
      periodType,
      statementDay,
      promoStartDate
    );

    // Value to track
    const valueToTrack =
      capType === "spend_amount"
        ? (tx.payment_amount ?? tx.amount)
        : tx.bonus_points;

    // Create tracking key
    const trackingId = rule.cap_group_id
      ? capType === "spend_amount"
        ? `${rule.cap_group_id}:spend`
        : rule.cap_group_id
      : capType === "spend_amount"
        ? `${rule.id}:spend`
        : rule.id;

    const key = `${trackingId}-${tx.payment_method_id}-${periodType}-${period.year}-${period.month}-${period.statementDay}`;

    // Accumulate to existing or create new record
    // Round to integer since database column is integer type
    const roundedValue = Math.round(valueToTrack);
    const existing = trackingMap.get(key);
    if (existing) {
      existing.used_bonus_points += roundedValue;
    } else {
      trackingMap.set(key, {
        user_id: userId,
        rule_id: trackingId,
        payment_method_id: tx.payment_method_id,
        period_type: periodType,
        period_year: period.year,
        period_month: period.month,
        statement_day: period.statementDay,
        used_bonus_points: roundedValue,
      });
    }

    const merchant = tx.merchants?.name || "Unknown";
    console.log(
      `📝 ${tx.date.substring(0, 10)} | ${merchant.substring(0, 25).padEnd(25)} | ` +
        `${capType === "spend_amount" ? "$" + valueToTrack.toFixed(2) : valueToTrack + " pts"} | ` +
        `Rule: ${rule.name.substring(0, 30)}`
    );

    processed++;
  }

  // Upsert all tracking records
  console.log("\nUpserting tracking records...");
  const records = Array.from(trackingMap.values());

  if (records.length === 0) {
    console.log("No records to upsert.");
    return;
  }

  // Delete existing records for this user first (to avoid partial data)
  console.log("Clearing existing tracking data...");
  const { error: deleteError } = await supabase
    .from("bonus_points_tracking")
    .delete()
    .eq("user_id", userId);

  if (deleteError) {
    console.error("❌ Error clearing existing data:", deleteError);
  }

  // Insert new records
  const { error: upsertError } = await supabase
    .from("bonus_points_tracking")
    .upsert(records, {
      onConflict:
        "user_id,rule_id,payment_method_id,period_type,period_year,period_month,statement_day",
    });

  if (upsertError) {
    console.error("❌ Error upserting records:", upsertError);
    process.exit(1);
  }

  console.log(`✅ Upserted ${records.length} tracking records`);

  console.log("\n=== Summary ===");
  console.log(`✅ Transactions processed: ${processed}`);
  console.log(`⚠️ Transactions skipped: ${skipped}`);
  console.log(`📊 Unique tracking records: ${records.length}`);

  // Display the tracking records
  console.log("\n=== Tracking Records ===");
  for (const record of records) {
    const pm = paymentMethodMap.get(record.payment_method_id);
    console.log(
      `${pm?.name || record.payment_method_id}: ${record.period_year}-${String(record.period_month).padStart(2, "0")} (${record.period_type}) = ${record.used_bonus_points}`
    );
  }

  console.log(
    "\n✅ Backfill complete! Refresh the app to see updated cap progress."
  );
}

// Run the backfill
backfillBonusPointsTracking().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
