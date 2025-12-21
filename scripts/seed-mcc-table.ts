/**
 * Script to seed the MCC table with all MCC codes from constants
 *
 * Usage: npx tsx scripts/seed-mcc-table.ts
 *
 * Environment variables:
 *   VITE_SUPABASE_URL - Supabase project URL
 *   VITE_SUPABASE_PUBLISHABLE_KEY - Supabase anon key
 */

import { createClient } from "@supabase/supabase-js";
import { MCC_CODES } from "../src/utils/constants/mcc";

const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL || "https://yulueezoyjxobhureuxj.supabase.co";
const SUPABASE_KEY =
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl1bHVlZXpveWp4b2JodXJldXhqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIwMjM1MTEsImV4cCI6MjA3NzU5OTUxMX0.QpTFICkI0IWYdq2Me4Rp3DFrCAs_QiVZEmUywACnqAE";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function seedMccTable() {
  console.log(`Seeding MCC table with ${MCC_CODES.length} codes...`);

  // Transform to database format
  const mccData = MCC_CODES.map((mcc) => ({
    code: mcc.code,
    description: mcc.description,
  }));

  // Insert in batches of 100 to avoid request size limits
  const batchSize = 100;
  let inserted = 0;
  const skipped = 0;

  for (let i = 0; i < mccData.length; i += batchSize) {
    const batch = mccData.slice(i, i + batchSize);

    const { data, error } = await supabase
      .from("mcc")
      .upsert(batch, { onConflict: "code", ignoreDuplicates: false })
      .select();

    if (error) {
      console.error(`Error inserting batch ${i / batchSize + 1}:`, error);
      throw error;
    }

    inserted += data?.length || 0;
    console.log(
      `Batch ${i / batchSize + 1}: Upserted ${data?.length || 0} codes`
    );
  }

  console.log(`\nDone! Total codes in database: ${inserted}`);

  // Verify count
  const { count, error: countError } = await supabase
    .from("mcc")
    .select("*", { count: "exact", head: true });

  if (!countError) {
    console.log(`Verified: ${count} MCC codes in table`);
  }
}

seedMccTable().catch((err) => {
  console.error("Failed to seed MCC table:", err);
  process.exit(1);
});
