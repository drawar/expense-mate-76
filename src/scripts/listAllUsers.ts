/**
 * List all users and their payment methods
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
  // Get all users from auth.users
  const { data: users, error: usersError } = await supabase.auth.admin.listUsers();

  if (usersError) {
    console.error("Error fetching users:", usersError);
    return;
  }

  console.log("All users in the system:\n");
  console.log("=".repeat(80));

  for (const user of users.users || []) {
    console.log(`\nUser ID: ${user.id}`);
    console.log(`  Email: ${user.email}`);
    console.log(`  Created: ${user.created_at}`);
    console.log(`  Last Sign In: ${user.last_sign_in_at}`);

    // Get payment methods count for this user
    const { count } = await supabase
      .from("payment_methods")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id);

    console.log(`  Payment Methods: ${count || 0}`);

    // Get transactions count for this user
    const { count: txCount } = await supabase
      .from("transactions")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id);

    console.log(`  Transactions: ${txCount || 0}`);
  }

  console.log("\n" + "=".repeat(80));
  console.log(`\nTotal users: ${users.users?.length || 0}`);

  // Also check for orphaned records (user_ids in payment_methods that don't exist in auth.users)
  const userIds = new Set((users.users || []).map(u => u.id));

  const { data: allPMs } = await supabase
    .from("payment_methods")
    .select("user_id")
    .order("user_id");

  const pmUserIds = new Set((allPMs || []).map(pm => pm.user_id));

  const orphanedUserIds = [...pmUserIds].filter(id => !userIds.has(id));

  if (orphanedUserIds.length > 0) {
    console.log("\n⚠️ Orphaned user_ids in payment_methods (not in auth.users):");
    for (const id of orphanedUserIds) {
      const { count } = await supabase
        .from("payment_methods")
        .select("*", { count: "exact", head: true })
        .eq("user_id", id);
      console.log(`  ${id}: ${count} payment methods`);
    }
  }
}

main();
