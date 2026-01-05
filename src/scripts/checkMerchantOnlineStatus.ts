/**
 * Check merchant online status for transactions with bonus points
 *
 * Run with: source .env && npx tsx src/scripts/checkMerchantOnlineStatus.ts
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

async function checkMerchantOnlineStatus() {
  console.log("=== Check Merchant Online Status ===\n");

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

  const userId = authData.session.user.id;
  console.log("✅ Authenticated as:", authData.session.user.email, "\n");

  // Find Citibank payment method
  const { data: paymentMethods } = await supabase
    .from("payment_methods")
    .select("id, name, card_catalog_id")
    .eq("user_id", userId)
    .ilike("name", "%citi%");

  if (!paymentMethods || paymentMethods.length === 0) {
    console.log(
      "No Citibank payment methods found. Checking all payment methods...\n"
    );
  } else {
    console.log("Found Citibank payment methods:");
    paymentMethods.forEach((pm) => console.log(`  - ${pm.name} (${pm.id})`));
    console.log();
  }

  // Get transactions with bonus points
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
    .order("date", { ascending: false })
    .limit(50);

  if (txError) {
    console.error("❌ Error fetching transactions:", txError);
    process.exit(1);
  }

  if (!transactions || transactions.length === 0) {
    console.log("No transactions with bonus points found.");
    return;
  }

  console.log(`Found ${transactions.length} transactions with bonus points:\n`);

  // Group by payment method
  const byPaymentMethod = new Map<string, typeof transactions>();
  for (const tx of transactions) {
    const pmId = tx.payment_method_id;
    if (!byPaymentMethod.has(pmId)) {
      byPaymentMethod.set(pmId, []);
    }
    byPaymentMethod.get(pmId)!.push(tx);
  }

  // Get payment method names
  const { data: allPMs } = await supabase
    .from("payment_methods")
    .select("id, name")
    .eq("user_id", userId);

  const pmNameMap = new Map<string, string>();
  allPMs?.forEach((pm) => pmNameMap.set(pm.id, pm.name));

  // Display results
  let onlineCount = 0;
  let offlineCount = 0;
  let nullCount = 0;

  for (const [pmId, txList] of byPaymentMethod) {
    const pmName = pmNameMap.get(pmId) || pmId;
    console.log(`\n📱 ${pmName}`);
    console.log("─".repeat(80));
    console.log(
      "Date       | Merchant                    | Amount     | Bonus Pts | is_online"
    );
    console.log("─".repeat(80));

    for (const tx of txList) {
      const merchant = tx.merchants as {
        name: string;
        is_online: boolean | null;
      } | null;
      const merchantName = (merchant?.name || "Unknown")
        .substring(0, 27)
        .padEnd(27);
      const isOnline = merchant?.is_online;
      const isOnlineStr =
        isOnline === true
          ? "✅ true"
          : isOnline === false
            ? "❌ false"
            : "⚠️ null";

      if (isOnline === true) onlineCount++;
      else if (isOnline === false) offlineCount++;
      else nullCount++;

      const amount = tx.payment_amount || tx.amount;
      const currency = tx.payment_currency || tx.currency;

      console.log(
        `${tx.date.substring(0, 10)} | ${merchantName} | ${currency} ${amount.toFixed(2).padStart(7)} | ${String(tx.bonus_points).padStart(9)} | ${isOnlineStr}`
      );
    }
  }

  console.log("\n" + "═".repeat(80));
  console.log("=== Summary ===");
  console.log(`✅ Online (is_online=true):  ${onlineCount}`);
  console.log(`❌ Offline (is_online=false): ${offlineCount}`);
  console.log(`⚠️ Unknown (is_online=null):  ${nullCount}`);
  console.log("═".repeat(80));

  if (offlineCount > 0 || nullCount > 0) {
    console.log(
      "\n⚠️ WARNING: Some transactions have is_online=false or null."
    );
    console.log(
      "   These will NOT match the '10x Points on Online Transactions' rule."
    );
    console.log(
      "   The bonus points they have may be from the Fashion/Department Store rule instead."
    );
  }

  if (onlineCount === 0) {
    console.log("\n❌ PROBLEM: No transactions have is_online=true!");
    console.log(
      "   This is why the progress bar shows 0 for online transactions."
    );
    console.log(
      "   The merchants need to have is_online=true to match the online rule."
    );
  }
}

checkMerchantOnlineStatus().catch(console.error);
