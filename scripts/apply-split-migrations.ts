import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.VITE_SUPABASE_URL || "";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

// Use service role to execute DDL
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  db: { schema: "public" },
  auth: { persistSession: false },
});

async function runSQL(sql: string, description: string) {
  console.log(`\n${description}...`);

  // Use the REST API directly for DDL statements
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": serviceRoleKey,
      "Authorization": `Bearer ${serviceRoleKey}`,
      "Prefer": "return=minimal",
    },
    body: JSON.stringify({
      // This won't work for DDL - need to use Management API
    }),
  });

  // For DDL, we need to use the Supabase Management API
  // Since we can't use that directly, let's output the SQL for manual execution
  console.log("SQL to run:");
  console.log(sql);
}

async function main() {
  console.log("=== Split Payment Migrations ===\n");
  console.log("Please run the following SQL statements in Supabase Dashboard > SQL Editor:\n");

  console.log("-- Migration 1: Create split_groups table");
  console.log(`
CREATE TABLE IF NOT EXISTS split_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  total_amount NUMERIC(10, 2) NOT NULL,
  total_currency TEXT NOT NULL,
  merchant_id UUID REFERENCES merchants(id),
  date TIMESTAMPTZ NOT NULL,
  notes TEXT,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE split_groups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own split groups" ON split_groups;
CREATE POLICY "Users can manage own split groups" ON split_groups
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_split_groups_user_date ON split_groups(user_id, date DESC);
`);

  console.log("\n-- Migration 2: Add split_group_id to transactions");
  console.log(`
ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS split_group_id UUID REFERENCES split_groups(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_transactions_split_group ON transactions(split_group_id)
  WHERE split_group_id IS NOT NULL;
`);

  console.log("\n=== End of migrations ===");
  console.log("\nAfter running these in the SQL Editor, the split payment feature will be ready to use.");
}

main();
