/**
 * Assign payment methods to correct users based on user input
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

const USERS = {
  1: "a533a06e-b483-4baf-a8c5-365edde3ba34", // arioputr@gmail.com
  2: "de4ceea4-51c3-4ee6-b0df-6066b284e45b", // vincelhvan@gmail.com
  3: "e215b298-6ea8-44b0-b7b9-8b0b0bbaeb91", // van.lehoang32@gmail.com
};

// User-provided mapping:
// 4->2, 6->1, 7->1, rest to 3
const ASSIGNMENTS: { id: string; name: string; user: 1 | 2 | 3 }[] = [
  { id: "d7c8b577-ce6a-4355-9402-c3a1ae432d53", name: "Aeroplan Reserve (Amex) - 1003", user: 3 },
  { id: "a0c0608d-2009-49cc-976d-d9381a436dd2", name: "Cobalt (Amex) - 1002", user: 3 },
  { id: "ba9bc402-18aa-44b9-9b5a-a733808a3472", name: "Rewards Visa Signature (Citi) - 0860", user: 3 },
  { id: "4ce46e6f-4d6a-41f5-9ecc-1ba25b556eda", name: "Platinum (Amex) - N/A", user: 2 },
  { id: "eee547db-2649-491c-82f8-dd1f8494c470", name: "Cathay World Elite (Neo) - 8318", user: 3 },
  { id: "29d2bfac-6116-4c13-ae0a-57b4fc4f0d08", name: "Rewards Visa Signature (Citi) - 1234", user: 1 },
  { id: "a3ae521d-72ba-4019-afe4-dd19b749fdd1", name: "Cathay World Elite (Neo) - 1234", user: 1 },
];

async function main() {
  console.log("Assigning payment methods to correct users...\n");

  for (const assignment of ASSIGNMENTS) {
    const userId = USERS[assignment.user];
    const { error } = await supabase
      .from("payment_methods")
      .update({ user_id: userId })
      .eq("id", assignment.id);

    if (error) {
      console.error(`❌ Error assigning ${assignment.name}:`, error);
    } else {
      console.log(`✅ ${assignment.name} → User ${assignment.user}`);
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log("Verifying...\n");

  // Verify
  const { data: users } = await supabase.auth.admin.listUsers();

  for (const user of users.users || []) {
    const { count } = await supabase
      .from("payment_methods")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id);

    console.log(`${user.email}: ${count} payment methods`);
  }
}

main();
