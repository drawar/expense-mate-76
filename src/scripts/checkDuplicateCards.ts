/**
 * Check for duplicate DBS Woman's World cards and find which one to delete
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { join } from "path";

// Load env file manually
const envPath = join(process.cwd(), ".env");
const envContent = readFileSync(envPath, "utf-8");
const envVars: Record<string, string> = {};
for (const line of envContent.split("\n")) {
  const match = line.match(/^([^=]+)="?([^"]*)"?$/);
  if (match) {
    envVars[match[1]] = match[2];
  }
}

const supabaseUrl = envVars.VITE_SUPABASE_URL;
const supabaseKey = envVars.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  // Find all DBS Woman's World cards
  const { data: cards, error: cardError } = await supabase
    .from("card_catalog")
    .select("id, card_type_id, name, created_at")
    .eq("issuer", "DBS")
    .ilike("name", "%Woman%")
    .order("created_at");

  if (cardError) {
    console.error("Error fetching cards:", cardError);
    return;
  }

  console.log("DBS Woman's World cards in catalog:\n");

  const toDelete: string[] = [];
  const toKeep: string[] = [];

  for (const card of cards || []) {
    // Check for linked payment methods
    const { data: pms } = await supabase
      .from("payment_methods")
      .select("id, name")
      .eq("card_catalog_id", card.id);

    // Check for linked reward rules
    const { data: rules } = await supabase
      .from("reward_rules")
      .select("id, name")
      .eq("card_catalog_id", card.id);

    console.log("Card:", card.card_type_id);
    console.log("  ID:", card.id);
    console.log("  Created:", card.created_at);
    console.log("  Linked payment methods:", pms?.length || 0);
    if (pms && pms.length > 0) {
      for (const pm of pms) {
        console.log("    -", pm.name, "(", pm.id, ")");
      }
    }
    console.log("  Linked reward rules:", rules?.length || 0);
    if (rules && rules.length > 0) {
      for (const rule of rules) {
        console.log("    -", rule.name);
      }
    }
    console.log("");

    if ((pms?.length || 0) > 0 || (rules?.length || 0) > 0) {
      toKeep.push(card.id);
    } else {
      toDelete.push(card.id);
    }
  }

  console.log("=".repeat(60));
  console.log("RECOMMENDATION:");
  console.log("  Keep:", toKeep.length, "card(s)");
  console.log("  Delete:", toDelete.length, "card(s)");

  if (toDelete.length > 0) {
    console.log("\nCards to delete (no linked payment methods or rules):");
    for (const id of toDelete) {
      console.log("  -", id);
    }

    // Delete if --delete flag is passed
    if (process.argv.includes("--delete")) {
      console.log("\nDeleting unused cards...");
      for (const id of toDelete) {
        const { error } = await supabase
          .from("card_catalog")
          .delete()
          .eq("id", id);
        if (error) {
          console.error("  Error deleting", id, ":", error);
        } else {
          console.log("  Deleted:", id);
        }
      }
    } else {
      console.log("\nRun with --delete flag to delete unused cards");
    }
  }
}

main();
