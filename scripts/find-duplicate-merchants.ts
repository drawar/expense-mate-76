import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

async function main() {
  // Get all merchants
  const { data: merchants, error } = await supabase
    .from("merchants")
    .select("id, name, address, mcc, is_online, created_at")
    .order("name");

  if (error) {
    console.error("Error fetching merchants:", error);
    return;
  }

  // Get transaction counts per merchant
  const { data: transactions } = await supabase
    .from("transactions")
    .select("merchant_id");

  const txCountMap = new Map<string, number>();
  for (const tx of transactions || []) {
    if (tx.merchant_id) {
      txCountMap.set(tx.merchant_id, (txCountMap.get(tx.merchant_id) || 0) + 1);
    }
  }

  // Group by normalized name (lowercase, trimmed)
  const nameGroups = new Map<string, typeof merchants>();
  for (const m of merchants || []) {
    const normalizedName = m.name.toLowerCase().trim();
    if (!nameGroups.has(normalizedName)) {
      nameGroups.set(normalizedName, []);
    }
    nameGroups.get(normalizedName)!.push({
      ...m,
      txCount: txCountMap.get(m.id) || 0
    });
  }

  // Find duplicates
  const duplicates = [...nameGroups.entries()].filter(([_, group]) => group.length > 1);

  if (duplicates.length === 0) {
    console.log("No duplicate merchants found!");
    return;
  }

  console.log(`Found ${duplicates.length} duplicate merchant groups:\n`);

  for (const [name, group] of duplicates) {
    console.log(`\n"${group[0].name}" (${group.length} duplicates):`);
    console.log("-".repeat(60));
    for (const m of group) {
      console.log(`  ID: ${m.id}`);
      console.log(`    Name: ${m.name}`);
      console.log(`    Address: ${m.address || "(none)"}`);
      console.log(`    MCC: ${m.mcc || "(none)"}`);
      console.log(`    Online: ${m.is_online}`);
      console.log(`    Transactions: ${m.txCount}`);
      console.log(`    Created: ${m.created_at}`);
      console.log("");
    }
  }

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("SUMMARY:");
  console.log(`Total duplicate groups: ${duplicates.length}`);
  console.log(`Total duplicate records to remove: ${duplicates.reduce((acc, [_, g]) => acc + g.length - 1, 0)}`);
}

main();
