import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function test() {
  // Get payment methods
  const { data: paymentMethods } = await supabase
    .from("payment_methods")
    .select("id, name, type, issuer, is_active, points_currency")
    .eq("is_active", true);

  const creditCards =
    paymentMethods?.filter(
      (pm) => pm.type === "credit" || pm.type === "credit_card"
    ) || [];
  console.log(
    "Active credit cards:",
    creditCards.map((c) => `${c.name} (${c.points_currency})`)
  );

  // Get current month transactions
  const startOfMonth = new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    1
  );
  const { data: transactions } = await supabase
    .from("transactions")
    .select(
      `
      id, amount, currency, payment_amount, payment_currency,
      total_points, base_points, bonus_points,
      category, user_category, mcc_code, is_contactless, date,
      payment_method_id,
      merchants:merchant_id(id, name, address, is_online, mcc_code)
    `
    )
    .eq("is_deleted", false)
    .gte("date", startOfMonth.toISOString())
    .order("date", { ascending: false });

  console.log(`\nCurrent month transactions: ${transactions?.length}`);

  // Build card ID map
  const cardMap = new Map(creditCards.map((pm) => [pm.id, pm]));

  // Get reward rules for each card
  console.log("\n=== Checking reward rules for each card ===");
  for (const card of creditCards) {
    // Generate card type ID (issuer-name format)
    const cardTypeId = `${card.issuer?.toLowerCase().replace(/\s+/g, "-")}-${card.name.toLowerCase().replace(/\s+/g, "-")}`;

    const { data: rules } = await supabase
      .from("reward_rules")
      .select("id, name, mcc_codes, conditions, reward")
      .eq("card_type_id", cardTypeId)
      .eq("enabled", true);

    console.log(`\n${card.name} (cardTypeId: ${cardTypeId})`);
    if (rules && rules.length > 0) {
      console.log(`  Found ${rules.length} rules:`);
      rules.forEach((rule) => {
        const reward = rule.reward as { baseMultiplier?: number } | null;
        console.log(
          `    - ${rule.name}: ${reward?.baseMultiplier || 1}x (MCCs: ${rule.mcc_codes?.slice(0, 3).join(", ") || "all"}...)`
        );
      });
    } else {
      console.log("  No rules found");
    }
  }

  // Find Air France transaction
  console.log("\n=== Looking for Air France transaction ===");
  type MerchantData = { name?: string; mcc_code?: string } | null;
  const airFranceTx = transactions?.find((tx) => {
    const merchant = tx.merchants as MerchantData;
    return merchant?.name?.toLowerCase().includes("air france");
  });

  if (airFranceTx) {
    const card = cardMap.get(airFranceTx.payment_method_id);
    const merchant = airFranceTx.merchants as MerchantData;
    console.log(`Found: ${merchant?.name}`);
    console.log(`  Amount: $${airFranceTx.amount} ${airFranceTx.currency}`);
    console.log(`  Card used: ${card?.name}`);
    console.log(`  Points earned: ${airFranceTx.total_points}`);
    console.log(
      `  MCC: ${airFranceTx.mcc_code || merchant?.mcc_code || "unknown"}`
    );

    // Check what other cards with same points currency would earn
    const samePointsCards = creditCards.filter(
      (c) => c.id !== card?.id && c.points_currency === card?.points_currency
    );
    console.log(`\n  Alternative cards with ${card?.points_currency}:`);
    for (const altCard of samePointsCards) {
      const cardTypeId = `${altCard.issuer?.toLowerCase().replace(/\s+/g, "-")}-${altCard.name.toLowerCase().replace(/\s+/g, "-")}`;

      // Get rules that match this MCC
      const mcc = airFranceTx.mcc_code || merchant?.mcc_code;
      const { data: matchingRules } = await supabase
        .from("reward_rules")
        .select("name, mcc_codes, reward")
        .eq("card_type_id", cardTypeId)
        .eq("enabled", true);

      // Find best matching rule
      let bestMultiplier = 1;
      let matchedRule = "Base rate";

      if (matchingRules) {
        for (const rule of matchingRules) {
          const mccCodes = rule.mcc_codes as string[] | null;
          const reward = rule.reward as { baseMultiplier?: number } | null;
          const multiplier = reward?.baseMultiplier || 1;

          // Check if this rule matches the MCC
          if (
            !mccCodes ||
            mccCodes.length === 0 ||
            (mcc && mccCodes.includes(mcc))
          ) {
            if (multiplier > bestMultiplier) {
              bestMultiplier = multiplier;
              matchedRule = rule.name;
            }
          }
        }
      }

      const potentialPoints = Math.round(airFranceTx.amount * bestMultiplier);
      const pointsDiff = potentialPoints - airFranceTx.total_points;
      console.log(
        `    ${altCard.name}: ${bestMultiplier}x (${matchedRule}) = ${potentialPoints} pts (${pointsDiff > 0 ? "+" : ""}${pointsDiff})`
      );
    }
  } else {
    console.log("No Air France transaction found");
  }
}

test().catch(console.error);
