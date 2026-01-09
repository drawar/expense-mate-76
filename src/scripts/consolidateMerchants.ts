/**
 * Consolidate duplicate merchants (Compass, Lyft, Uber, Uber Eats)
 * Run with: npx tsx src/scripts/consolidateMerchants.ts
 * Add --execute to actually make changes
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { join } from "path";

const envPath = join(process.cwd(), ".env");
const envContent = readFileSync(envPath, "utf-8");
const envVars: Record<string, string> = {};
for (const line of envContent.split("\n")) {
  const match = line.match(/^([^=]+)="?([^"]*)"?$/);
  if (match) {
    envVars[match[1]] = match[2];
  }
}

const supabase = createClient(envVars.VITE_SUPABASE_URL, envVars.SUPABASE_SERVICE_ROLE_KEY);

const dryRun = !process.argv.includes("--execute");

interface MerchantGroup {
  canonicalName: string;
  mccCode: string;
  mccDescription: string;
  isOnline: boolean;
  searchPatterns: string[];
}

const MERCHANT_GROUPS: MerchantGroup[] = [
  {
    canonicalName: "Compass",
    mccCode: "4111",
    mccDescription: "Transit",
    isOnline: false,
    searchPatterns: ["compass%"],
  },
  {
    canonicalName: "Presto",
    mccCode: "4111",
    mccDescription: "Transit",
    isOnline: false,
    searchPatterns: ["presto%"],
  },
  {
    canonicalName: "Caltrain",
    mccCode: "4111",
    mccDescription: "Transit",
    isOnline: false,
    searchPatterns: ["caltrain%"],
  },
  {
    canonicalName: "Lyft",
    mccCode: "4121",
    mccDescription: "Ride Share",
    isOnline: true,
    searchPatterns: ["lyft"],
  },
  {
    canonicalName: "Uber",
    mccCode: "4121",
    mccDescription: "Ride Share",
    isOnline: true,
    searchPatterns: ["uber"],
  },
  {
    canonicalName: "Uber Eats",
    mccCode: "5812",
    mccDescription: "Food Delivery",
    isOnline: true,
    searchPatterns: ["uber eats%"],
  },
];

async function findMerchants(patterns: string[], excludePatterns: string[] = []): Promise<Array<{ id: string; name: string; mcc_code: string | null }>> {
  // Build OR condition for patterns
  const orConditions = patterns.map(p => `name.ilike.${p}`).join(",");

  const { data, error } = await supabase
    .from("merchants")
    .select("id, name, mcc_code")
    .or(orConditions)
    .eq("is_deleted", false);

  if (error) {
    console.error("Error finding merchants:", error);
    return [];
  }

  // Filter out excluded patterns
  let filtered = data || [];
  for (const exclude of excludePatterns) {
    const regex = new RegExp(exclude.replace("%", ".*"), "i");
    filtered = filtered.filter(m => !regex.test(m.name));
  }

  return filtered;
}

async function consolidateGroup(group: MerchantGroup, excludePatterns: string[] = []): Promise<void> {
  console.log(`\n${"=".repeat(50)}`);
  console.log(`Processing: ${group.canonicalName}`);
  console.log("=".repeat(50));

  const merchants = await findMerchants(group.searchPatterns, excludePatterns);

  if (merchants.length === 0) {
    console.log("No merchants found.");
    return;
  }

  console.log(`Found ${merchants.length} merchant(s):`);
  for (const m of merchants) {
    console.log(`  - ${m.name} (MCC: ${m.mcc_code || "N/A"}) [${m.id}]`);
  }

  if (merchants.length === 1 && merchants[0].name === group.canonicalName && merchants[0].mcc_code === group.mccCode) {
    console.log("✓ Already consolidated and correct.");
    return;
  }

  // Find or create canonical merchant
  let canonicalId: string;
  const existing = merchants.find(m => m.name === group.canonicalName);

  if (existing) {
    canonicalId = existing.id;
    console.log(`\nUsing existing "${group.canonicalName}" as canonical (${canonicalId})`);
  } else {
    // Use the first merchant as canonical and rename it
    canonicalId = merchants[0].id;
    console.log(`\nWill rename "${merchants[0].name}" to "${group.canonicalName}" as canonical`);
  }

  // Get transaction counts for each merchant
  const duplicateIds = merchants.filter(m => m.id !== canonicalId).map(m => m.id);

  if (duplicateIds.length > 0) {
    const { count } = await supabase
      .from("transactions")
      .select("*", { count: "exact", head: true })
      .in("merchant_id", duplicateIds);

    console.log(`\nTransactions to migrate: ${count || 0}`);
  }

  if (dryRun) {
    console.log("\n[DRY RUN] Would perform:");
    console.log(`  1. Update canonical merchant to name="${group.canonicalName}", mcc_code="${group.mccCode}"`);
    if (duplicateIds.length > 0) {
      console.log(`  2. Migrate transactions from ${duplicateIds.length} duplicate(s) to canonical`);
      console.log(`  3. Soft-delete ${duplicateIds.length} duplicate merchant(s)`);
    }
    return;
  }

  // Execute changes
  console.log("\nExecuting changes...");

  // 1. Update canonical merchant
  const { error: updateError } = await supabase
    .from("merchants")
    .update({
      name: group.canonicalName,
      mcc_code: group.mccCode,
      mcc: { code: group.mccCode, description: group.mccDescription },
      is_online: group.isOnline,
    })
    .eq("id", canonicalId);

  if (updateError) {
    console.error("Error updating canonical merchant:", updateError);
    return;
  }
  console.log(`✓ Updated canonical merchant`);

  // 2. Migrate transactions
  if (duplicateIds.length > 0) {
    const { error: migrateError } = await supabase
      .from("transactions")
      .update({ merchant_id: canonicalId })
      .in("merchant_id", duplicateIds);

    if (migrateError) {
      console.error("Error migrating transactions:", migrateError);
      return;
    }
    console.log(`✓ Migrated transactions`);

    // 3. Soft-delete duplicates
    const { error: deleteError } = await supabase
      .from("merchants")
      .update({ is_deleted: true })
      .in("id", duplicateIds);

    if (deleteError) {
      console.error("Error deleting duplicates:", deleteError);
      return;
    }
    console.log(`✓ Soft-deleted ${duplicateIds.length} duplicate(s)`);
  }

  console.log(`✓ Done consolidating ${group.canonicalName}`);
}

async function main() {
  console.log("╔════════════════════════════════════════════════════════╗");
  console.log("║         MERCHANT CONSOLIDATION SCRIPT                  ║");
  console.log("╚════════════════════════════════════════════════════════╝");

  if (dryRun) {
    console.log("\n🔍 DRY RUN MODE - No changes will be made");
    console.log("   Run with --execute to apply changes\n");
  } else {
    console.log("\n⚠️  EXECUTE MODE - Changes will be applied!\n");
  }

  // Process Uber Eats first (before Uber, since "uber eats" contains "uber")
  await consolidateGroup(MERCHANT_GROUPS.find(g => g.canonicalName === "Uber Eats")!);

  // Process Uber (excluding "uber eats")
  await consolidateGroup(MERCHANT_GROUPS.find(g => g.canonicalName === "Uber")!, ["uber eats%", "uber one%"]);

  // Process Uber One separately if needed
  // await consolidateGroup({ canonicalName: "Uber One", ... });

  // Process other groups
  for (const group of MERCHANT_GROUPS) {
    if (group.canonicalName === "Uber" || group.canonicalName === "Uber Eats") continue;
    await consolidateGroup(group);
  }

  console.log("\n" + "=".repeat(50));
  if (dryRun) {
    console.log("DRY RUN COMPLETE");
    console.log("Run with --execute to apply these changes");
  } else {
    console.log("CONSOLIDATION COMPLETE");
  }
  console.log("=".repeat(50));
}

main();
