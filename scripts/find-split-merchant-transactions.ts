import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

async function main() {
  // Find merchant IDs
  const { data: merchants } = await supabase
    .from("merchants")
    .select("id, name")
    .in("name", ["Horin Ramen", "Nemesis Coffee"]);

  if (!merchants || merchants.length === 0) {
    console.log("No original merchants found");
    return;
  }

  console.log("Original merchants:");
  merchants.forEach((m) => console.log(`  ${m.name}: ${m.id}`));

  // Find new split merchants
  const { data: newMerchants } = await supabase
    .from("merchants")
    .select("id, name, display_location")
    .or("name.ilike.%Horin Ramen%,name.ilike.%Nemesis Coffee%");

  console.log("\nAll related merchants:");
  newMerchants?.forEach((m) => console.log(`  ${m.name} (${m.display_location || "no location"}): ${m.id}`));

  // Find transactions for original merchants
  const merchantIds = merchants.map((m) => m.id);

  const { data: transactions, error } = await supabase
    .from("transactions")
    .select("id, date, amount, currency, merchant_id, notes")
    .in("merchant_id", merchantIds)
    .order("date", { ascending: true });

  if (error) {
    console.error("Error:", error);
    return;
  }

  console.log(`\n${"=".repeat(60)}`);
  console.log("TRANSACTIONS TO REASSIGN");
  console.log("=".repeat(60));

  if (!transactions || transactions.length === 0) {
    console.log("No transactions found for these merchants.");
    return;
  }

  // Group by merchant
  const merchantMap = new Map(merchants.map((m) => [m.id, m.name]));

  for (const txn of transactions) {
    const merchantName = merchantMap.get(txn.merchant_id);
    console.log(`\n${merchantName}:`);
    console.log(`  ID: ${txn.id}`);
    console.log(`  Date: ${txn.date}`);
    console.log(`  Amount: ${txn.amount} ${txn.currency}`);
    if (txn.notes) console.log(`  Notes: ${txn.notes}`);
  }

  console.log(`\n${"=".repeat(60)}`);
  console.log(`Total: ${transactions.length} transactions`);
}

main();
