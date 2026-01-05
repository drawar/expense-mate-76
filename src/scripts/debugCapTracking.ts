/**
 * Debug why specific transactions aren't matching capped rules
 *
 * Run with: source .env && npx tsx src/scripts/debugCapTracking.ts
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error(
    "❌ Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY"
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Transactions to debug
const targetTxIds = [
  "64291d2c-ed8c-4c70-86da-732ea86668e6", // Singtel
  "19c757ff-9145-4865-a683-3f62fa3d347a", // Singtel
  "5e531328-963e-4444-96fa-dd27869dce29", // Made In Cookware
];

async function debugCapTracking() {
  console.log("=== Debug Cap Tracking ===\n");

  const userEmail = process.env.SUPABASE_USER_EMAIL;
  const userPassword = process.env.SUPABASE_USER_PASSWORD;

  if (!userEmail || !userPassword) {
    console.error("❌ Missing SUPABASE_USER_EMAIL or SUPABASE_USER_PASSWORD");
    process.exit(1);
  }

  const { data: authData, error: authError } =
    await supabase.auth.signInWithPassword({
      email: userEmail,
      password: userPassword,
    });

  if (authError || !authData.session) {
    console.error("❌ Authentication failed:", authError?.message);
    process.exit(1);
  }

  console.log("✅ Authenticated\n");

  // Fetch the specific transactions
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
      merchants (
        id,
        name,
        is_online,
        mcc_code
      )
    `
    )
    .in("id", targetTxIds);

  if (txError) {
    console.error("❌ Error fetching transactions:", txError);
    process.exit(1);
  }

  console.log(`Found ${transactions?.length || 0} target transactions\n`);

  // Fetch payment methods
  const { data: paymentMethods } = await supabase
    .from("payment_methods")
    .select("id, name, card_catalog_id, statement_start_day");

  const pmMap = new Map();
  paymentMethods?.forEach((pm) => pmMap.set(pm.id, pm));

  // Fetch all reward rules
  const { data: allRules } = await supabase
    .from("reward_rules")
    .select("*")
    .order("priority", { ascending: false });

  console.log(`Loaded ${allRules?.length || 0} reward rules\n`);

  // Find Citibank rules specifically
  const citiRules = allRules?.filter(
    (r) =>
      r.name?.toLowerCase().includes("10x") ||
      r.card_type_id?.toLowerCase().includes("citi")
  );

  console.log("=== Citibank-related rules ===");
  citiRules?.forEach((r) => {
    console.log(`  - ${r.name}`);
    console.log(`    card_type_id: ${r.card_type_id}`);
    console.log(`    monthly_cap: ${r.monthly_cap}`);
    console.log(`    enabled: ${r.enabled}`);
    console.log(
      `    conditions: ${JSON.stringify(r.conditions).substring(0, 100)}...`
    );
    console.log();
  });

  // Debug each transaction
  for (const tx of transactions || []) {
    console.log("═".repeat(80));
    const merchant = tx.merchants as {
      name: string;
      is_online: boolean | null;
      mcc_code: string | null;
    } | null;
    console.log(`Transaction: ${tx.id}`);
    console.log(`  Merchant: ${merchant?.name}`);
    console.log(`  is_online: ${merchant?.is_online}`);
    console.log(`  MCC: ${tx.mcc_code || merchant?.mcc_code || "none"}`);
    console.log(`  bonus_points: ${tx.bonus_points}`);
    console.log(`  payment_method_id: ${tx.payment_method_id}`);

    const pm = pmMap.get(tx.payment_method_id);
    console.log(`  Payment Method: ${pm?.name || "NOT FOUND"}`);
    console.log(`  card_catalog_id: ${pm?.card_catalog_id || "MISSING"}`);

    if (!pm?.card_catalog_id) {
      console.log(`  ❌ PROBLEM: No card_catalog_id on payment method`);
      continue;
    }

    // Find matching rules
    console.log(`\n  Checking rules for card_type_id: ${pm.card_catalog_id}`);

    const matchingCardRules =
      allRules?.filter((r) => r.card_type_id === pm.card_catalog_id) || [];
    console.log(`  Found ${matchingCardRules.length} rules for this card type`);

    for (const rule of matchingCardRules) {
      console.log(`\n  Checking rule: ${rule.name}`);
      console.log(`    monthly_cap: ${rule.monthly_cap}`);
      console.log(`    enabled: ${rule.enabled}`);

      if (!rule.enabled) {
        console.log(`    ❌ Rule is disabled`);
        continue;
      }

      if (!rule.monthly_cap) {
        console.log(`    ⚠️ No monthly cap - skipping for cap tracking`);
        continue;
      }

      const conditions =
        (rule.conditions as Array<{
          type: string;
          operation: string;
          values: string[];
        }>) || [];

      if (conditions.length === 0) {
        console.log(`    ✅ No conditions - matches everything`);
        continue;
      }

      let allMatch = true;
      for (const cond of conditions) {
        console.log(
          `    Condition: ${cond.type} ${cond.operation} [${cond.values?.length || 0} values]`
        );

        const mcc = tx.mcc_code || merchant?.mcc_code || "";
        const merchantName = (merchant?.name || "").toLowerCase();
        const isOnline = merchant?.is_online ?? false;

        let matches = false;

        if (cond.type === "transaction_type") {
          if (cond.values.includes("online")) {
            matches = isOnline;
            console.log(
              `      isOnline=${isOnline}, looking for "online" → base match=${matches}`
            );
          } else if (cond.values.includes("in_store")) {
            matches = !isOnline;
          } else {
            matches = true;
          }

          if (cond.operation === "exclude" || cond.operation === "not_equals") {
            matches = !matches;
          }
          console.log(
            `      After operation "${cond.operation}": matches=${matches}`
          );
        } else if (cond.type === "mcc") {
          const mccInList = cond.values.includes(mcc);
          console.log(`      MCC "${mcc}" in exclusion list: ${mccInList}`);
          if (cond.operation === "include" || cond.operation === "equals") {
            matches = mccInList;
          } else {
            matches = !mccInList;
          }
          console.log(
            `      After operation "${cond.operation}": matches=${matches}`
          );
        } else if (cond.type === "merchant") {
          const merchantInList = cond.values.some(
            (v) =>
              merchantName.includes(v.toLowerCase()) ||
              v.toLowerCase().includes(merchantName)
          );
          console.log(
            `      Merchant "${merchantName}" in exclusion list: ${merchantInList}`
          );
          if (cond.operation === "include" || cond.operation === "equals") {
            matches = merchantInList;
          } else {
            matches = !merchantInList;
          }
          console.log(
            `      After operation "${cond.operation}": matches=${matches}`
          );
        } else {
          matches = true;
          console.log(`      Unknown condition type, assuming match`);
        }

        if (!matches) {
          console.log(`    ❌ Condition FAILED`);
          allMatch = false;
          break;
        } else {
          console.log(`    ✅ Condition PASSED`);
        }
      }

      if (allMatch) {
        console.log(`  ✅ RULE MATCHES: ${rule.name}`);
      } else {
        console.log(`  ❌ Rule does not match`);
      }
    }
  }
}

debugCapTracking().catch(console.error);
