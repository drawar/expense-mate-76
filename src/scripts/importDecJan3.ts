/**
 * Import 3 missing Dec-Jan Amex Cobalt transactions
 * Run with: npx tsx src/scripts/importDecJan3.ts
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

const USER_ID = "00000000-0000-0000-0000-000000000000";

async function main() {
  // Get Amex Cobalt payment method
  const { data: pm } = await supabase
    .from("payment_methods")
    .select("id")
    .ilike("name", "%cobalt%")
    .single();

  if (!pm) {
    console.error("Amex Cobalt not found");
    return;
  }

  // Get existing merchants
  const { data: merchants } = await supabase
    .from("merchants")
    .select("id, name")
    .in("name", ["Lyft", "Uber Eats", "PriceSmart"])
    .eq("is_deleted", false);

  const merchantMap = new Map(merchants?.map((m) => [m.name, m.id]) || []);

  const transactions = [
    {
      date: "2025-12-04",
      merchant: "Lyft",
      amount: 15.24,
      currency: "CAD",
      mcc: "4121",
      multiplier: 2,
    },
    {
      date: "2025-12-05",
      merchant: "Uber Eats",
      amount: 53.93,
      currency: "CAD",
      mcc: "5812",
      multiplier: 5,
    },
    {
      date: "2025-12-09",
      merchant: "PriceSmart",
      amount: 40.72,
      currency: "CAD",
      mcc: "5411",
      multiplier: 5,
    },
  ];

  console.log("Importing 3 transactions to Amex Cobalt...\n");

  for (const t of transactions) {
    const merchantId = merchantMap.get(t.merchant);
    if (!merchantId) {
      console.error(`Merchant not found: ${t.merchant}`);
      continue;
    }

    const totalPoints = Math.round(t.amount * t.multiplier);
    const basePoints = Math.round(t.amount);
    const bonusPoints = totalPoints - basePoints;

    const { error } = await supabase.from("transactions").insert([
      {
        id: crypto.randomUUID(),
        user_id: USER_ID,
        date: t.date,
        merchant_id: merchantId,
        amount: t.amount,
        currency: t.currency,
        payment_method_id: pm.id,
        payment_amount: t.amount,
        payment_currency: "CAD",
        total_points: totalPoints,
        base_points: basePoints,
        bonus_points: bonusPoints,
        is_contactless: false,
        mcc_code: t.mcc,
      },
    ]);

    if (error) {
      console.error(`Error: ${t.merchant}:`, error.message);
    } else {
      console.log(`✓ ${t.date} ${t.merchant} $${t.amount} → ${totalPoints} pts (${t.multiplier}x)`);
    }
  }

  console.log("\nDone!");
}

main();
