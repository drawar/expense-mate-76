import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

async function main() {
  console.log("Running split payment migrations...\n");

  // Migration 1: Create split_groups table
  const migration1 = `
    -- Create split_groups table for linking split payment transactions
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

    -- Enable RLS
    ALTER TABLE split_groups ENABLE ROW LEVEL SECURITY;

    -- Users can only access their own split groups
    DROP POLICY IF EXISTS "Users can manage own split groups" ON split_groups;
    CREATE POLICY "Users can manage own split groups" ON split_groups
      FOR ALL USING (auth.uid() = user_id);

    -- Index for efficient querying by user and date
    CREATE INDEX IF NOT EXISTS idx_split_groups_user_date ON split_groups(user_id, date DESC);
  `;

  console.log("Creating split_groups table...");
  const { error: error1 } = await supabase.rpc("exec_sql", { sql: migration1 });

  if (error1) {
    // Try direct SQL if RPC doesn't exist
    const { error: directError1 } = await supabase.from("split_groups").select("id").limit(1);
    if (directError1 && directError1.code === "42P01") {
      // Table doesn't exist, need to create it via dashboard
      console.log("Table doesn't exist. Please run this SQL in Supabase Dashboard > SQL Editor:");
      console.log(migration1);
    } else if (!directError1) {
      console.log("✓ split_groups table already exists");
    } else {
      console.log("Error checking split_groups:", directError1.message);
    }
  } else {
    console.log("✓ split_groups table created");
  }

  // Migration 2: Add split_group_id to transactions
  console.log("\nChecking transactions.split_group_id column...");

  // Check if column exists by trying to select it
  const { data, error: checkError } = await supabase
    .from("transactions")
    .select("id, split_group_id")
    .limit(1);

  if (checkError && checkError.message.includes("split_group_id")) {
    console.log("Column doesn't exist. Please run this SQL in Supabase Dashboard > SQL Editor:");
    console.log(`
    -- Add split_group_id column to transactions for linking split payments
    ALTER TABLE transactions
      ADD COLUMN split_group_id UUID REFERENCES split_groups(id) ON DELETE SET NULL;

    -- Partial index for efficient lookup of split transactions
    CREATE INDEX idx_transactions_split_group ON transactions(split_group_id)
      WHERE split_group_id IS NOT NULL;
    `);
  } else {
    console.log("✓ split_group_id column exists on transactions");
  }

  console.log("\nMigration check complete!");
}

main();
