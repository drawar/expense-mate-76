import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || "",
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY || ""
);

async function main() {
  // Get credit cards from payment_methods
  const { data: paymentMethods, error: pmError } = await supabase
    .from("payment_methods")
    .select("issuer, name, currency, points_currency")
    .eq("type", "credit_card")
    .order("issuer")
    .order("name");

  if (pmError) {
    console.error("Error fetching payment_methods:", pmError);
    return;
  }

  // Get unique combinations
  const uniqueCards = new Map<
    string,
    {
      issuer: string;
      name: string;
      currency: string;
      points_currency: string | null;
    }
  >();
  paymentMethods?.forEach((pm) => {
    const key = `${pm.issuer}|${pm.name}`;
    if (!uniqueCards.has(key)) {
      uniqueCards.set(key, pm);
    }
  });

  console.log("Credit cards in payment_methods:");
  console.log("================================");
  for (const [key, card] of uniqueCards) {
    console.log(
      `  ${card.issuer} - ${card.name} (${card.currency}) [${card.points_currency || "no points"}]`
    );
  }

  // Get distinct card_type_ids from reward_rules
  const { data: rules, error: rulesError } = await supabase
    .from("reward_rules")
    .select("card_type_id, name")
    .order("card_type_id");

  if (rulesError) {
    console.error("Error fetching reward_rules:", rulesError);
    return;
  }

  const uniqueCardTypes = new Map<string, string>();
  rules?.forEach((r) => {
    if (!uniqueCardTypes.has(r.card_type_id)) {
      uniqueCardTypes.set(r.card_type_id, r.name);
    }
  });

  console.log("\nCard types in reward_rules:");
  console.log("===========================");
  for (const [cardTypeId, ruleName] of uniqueCardTypes) {
    console.log(`  ${cardTypeId}`);
  }

  // Get cards in catalog
  const { data: catalog, error: catError } = await supabase
    .from("card_catalog")
    .select("card_type_id, name, issuer, region")
    .order("region")
    .order("issuer")
    .order("name");

  if (catError) {
    console.error("Error fetching card_catalog:", catError);
    return;
  }

  console.log("\nCards in catalog:");
  console.log("=================");
  catalog?.forEach((c) => {
    console.log(`  [${c.region}] ${c.issuer} - ${c.name} (${c.card_type_id})`);
  });

  // Find card_type_ids in rules but not in catalog
  const catalogIds = new Set(catalog?.map((c) => c.card_type_id) || []);
  const missingFromCatalog: string[] = [];
  for (const cardTypeId of uniqueCardTypes.keys()) {
    if (!catalogIds.has(cardTypeId)) {
      missingFromCatalog.push(cardTypeId);
    }
  }

  console.log("\nCard types with rules but NOT in catalog:");
  console.log("==========================================");
  if (missingFromCatalog.length === 0) {
    console.log("  (none)");
  } else {
    missingFromCatalog.forEach((m) => console.log(`  ${m}`));
  }
}

main();
