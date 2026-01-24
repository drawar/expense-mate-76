import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

interface Merchant {
  id: string;
  name: string;
  address: string | null;
  mcc: string | null;
  is_online: boolean;
  created_at: string;
  txCount: number;
}

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
  const nameGroups = new Map<string, Merchant[]>();
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

  console.log(`Processing ${duplicates.length} duplicate merchant groups...\n`);

  let totalTransactionsReassigned = 0;
  let totalMerchantsDeleted = 0;

  for (const [normalizedName, group] of duplicates) {
    // Sort by transaction count (desc), then by created_at (asc) to get the primary
    group.sort((a, b) => {
      if (b.txCount !== a.txCount) return b.txCount - a.txCount;
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });

    const primary = group[0];
    const duplicatesToRemove = group.slice(1);
    const duplicateIds = duplicatesToRemove.map(d => d.id);

    console.log(`\n"${primary.name}":`);
    console.log(`  Primary: ${primary.id} (${primary.txCount} transactions, address: ${primary.address || "none"})`);

    // Reassign transactions from duplicates to primary
    if (duplicateIds.length > 0) {
      const { data: updatedTxs, error: updateError } = await supabase
        .from("transactions")
        .update({ merchant_id: primary.id })
        .in("merchant_id", duplicateIds)
        .select("id");

      if (updateError) {
        console.error(`  ❌ Error reassigning transactions:`, updateError.message);
        continue;
      }

      const reassignedCount = updatedTxs?.length || 0;
      if (reassignedCount > 0) {
        console.log(`  ✓ Reassigned ${reassignedCount} transactions to primary`);
        totalTransactionsReassigned += reassignedCount;
      }

      // Delete duplicate merchants
      const { error: deleteError } = await supabase
        .from("merchants")
        .delete()
        .in("id", duplicateIds);

      if (deleteError) {
        console.error(`  ❌ Error deleting duplicates:`, deleteError.message);
        continue;
      }

      console.log(`  ✓ Deleted ${duplicateIds.length} duplicate merchant(s)`);
      totalMerchantsDeleted += duplicateIds.length;
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log("SUMMARY:");
  console.log(`  Duplicate groups processed: ${duplicates.length}`);
  console.log(`  Transactions reassigned: ${totalTransactionsReassigned}`);
  console.log(`  Duplicate merchants deleted: ${totalMerchantsDeleted}`);

  // Verify no more duplicates
  const { data: remainingMerchants } = await supabase
    .from("merchants")
    .select("name");

  const remainingNames = new Set<string>();
  const remainingDuplicates: string[] = [];
  for (const m of remainingMerchants || []) {
    const normalized = m.name.toLowerCase().trim();
    if (remainingNames.has(normalized)) {
      remainingDuplicates.push(m.name);
    }
    remainingNames.add(normalized);
  }

  if (remainingDuplicates.length > 0) {
    console.log(`\n⚠ Remaining duplicates: ${remainingDuplicates.join(", ")}`);
  } else {
    console.log("\n🎉 All duplicates have been merged!");
  }
}

main();
