/**
 * Find payment methods that should belong to other users based on their transactions
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

const supabaseUrl = envVars.VITE_SUPABASE_URL;
const supabaseKey = envVars.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

const OTHER_USERS = [
  { id: "a533a06e-b483-4baf-a8c5-365edde3ba34", email: "arioputr@gmail.com" },
  { id: "de4ceea4-51c3-4ee6-b0df-6066b284e45b", email: "vincelhvan@gmail.com" },
];

async function main() {
  console.log("Finding payment methods that should belong to other users...\n");

  for (const user of OTHER_USERS) {
    console.log(`\n${"=".repeat(60)}`);
    console.log(`User: ${user.email} (${user.id})`);
    console.log("=".repeat(60));

    // Get transactions for this user
    const { data: transactions, error } = await supabase
      .from("transactions")
      .select("id, date, payment_method_id, amount, currency")
      .eq("user_id", user.id)
      .order("date");

    if (error) {
      console.error("Error:", error);
      continue;
    }

    if (!transactions || transactions.length === 0) {
      console.log("  No transactions found");
      continue;
    }

    console.log(`  Transactions: ${transactions.length}`);

    // Get unique payment_method_ids
    const pmIds = [...new Set(transactions.map(t => t.payment_method_id))];
    console.log(`  Unique payment_method_ids used: ${pmIds.length}`);

    // Get details of these payment methods
    const { data: pms } = await supabase
      .from("payment_methods")
      .select("id, name, issuer, user_id")
      .in("id", pmIds);

    console.log("\n  Payment methods used by this user's transactions:");
    for (const pm of pms || []) {
      const wrongUser = pm.user_id !== user.id;
      console.log(`    - ${pm.name} (${pm.issuer})`);
      console.log(`      ID: ${pm.id}`);
      console.log(`      Current user_id: ${pm.user_id}`);
      if (wrongUser) {
        console.log(`      ⚠️  WRONG USER - should be ${user.id}`);
      }
    }
  }

  // Generate fix SQL
  console.log("\n\n" + "=".repeat(60));
  console.log("FIX SQL (run with --fix to execute)");
  console.log("=".repeat(60));

  for (const user of OTHER_USERS) {
    const { data: transactions } = await supabase
      .from("transactions")
      .select("payment_method_id")
      .eq("user_id", user.id);

    const pmIds = [...new Set((transactions || []).map(t => t.payment_method_id))];

    if (pmIds.length > 0) {
      console.log(`\n-- Fix for ${user.email}`);
      console.log(`UPDATE payment_methods`);
      console.log(`SET user_id = '${user.id}'`);
      console.log(`WHERE id IN (`);
      console.log(`  '${pmIds.join("',\n  '")}'`);
      console.log(`);`);
    }
  }

  // Execute fix if --fix flag is passed
  if (process.argv.includes("--fix")) {
    console.log("\n\nExecuting fix...");

    for (const user of OTHER_USERS) {
      const { data: transactions } = await supabase
        .from("transactions")
        .select("payment_method_id")
        .eq("user_id", user.id);

      const pmIds = [...new Set((transactions || []).map(t => t.payment_method_id))];

      if (pmIds.length > 0) {
        const { error } = await supabase
          .from("payment_methods")
          .update({ user_id: user.id })
          .in("id", pmIds);

        if (error) {
          console.error(`Error updating for ${user.email}:`, error);
        } else {
          console.log(`✅ Fixed ${pmIds.length} payment methods for ${user.email}`);
        }
      }
    }
  }
}

main();
