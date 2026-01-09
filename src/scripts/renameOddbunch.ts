/**
 * Rename SP Oddbunch to Oddbunch
 * Run with: npx tsx src/scripts/renameOddbunch.ts
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

async function main() {
  // Find Oddbunch merchants
  const { data: merchants, error: findError } = await supabase
    .from("merchants")
    .select("id, name")
    .ilike("name", "%oddbunch%")
    .eq("is_deleted", false);

  if (findError) {
    console.error("Error:", findError);
    return;
  }

  console.log("Found merchants:", merchants?.map(m => m.name));

  if (!merchants || merchants.length === 0) {
    console.log("No Oddbunch merchants found");
    return;
  }

  // Pick canonical (first one) and rename to Oddbunch
  const canonicalId = merchants[0].id;

  const { error: renameError } = await supabase
    .from("merchants")
    .update({ name: "Oddbunch" })
    .eq("id", canonicalId);

  if (renameError) {
    console.error("Error renaming:", renameError);
    return;
  }
  console.log(`✓ Renamed "${merchants[0].name}" to "Oddbunch"`);

  // If multiple, consolidate
  if (merchants.length > 1) {
    const duplicateIds = merchants.slice(1).map(m => m.id);

    // Migrate transactions
    const { error: migrateError } = await supabase
      .from("transactions")
      .update({ merchant_id: canonicalId })
      .in("merchant_id", duplicateIds);

    if (migrateError) {
      console.error("Error migrating:", migrateError);
      return;
    }
    console.log(`✓ Migrated transactions from ${duplicateIds.length} duplicate(s)`);

    // Soft delete duplicates
    const { error: deleteError } = await supabase
      .from("merchants")
      .update({ is_deleted: true })
      .in("id", duplicateIds);

    if (deleteError) {
      console.error("Error deleting:", deleteError);
      return;
    }
    console.log(`✓ Soft-deleted ${duplicateIds.length} duplicate(s)`);
  }

  console.log("Done!");
}

main();
