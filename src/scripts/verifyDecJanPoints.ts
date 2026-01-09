/**
 * Verify Dec-Jan statement points total
 * Run with: npx tsx src/scripts/verifyDecJanPoints.ts
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

interface TransactionWithMerchant {
  date: string;
  payment_amount: number;
  total_points: number;
  merchants: { name: string } | null;
}

// Transactions that belong to another user (not on this statement)
const OTHER_USER_AMOUNTS = [1.0, 3000.0];

async function main() {
  const { data: pm } = await supabase
    .from("payment_methods")
    .select("id")
    .ilike("name", "%cobalt%")
    .single();

  if (!pm) {
    console.error("Cobalt not found");
    return;
  }

  const { data: txns } = await supabase
    .from("transactions")
    .select("date, payment_amount, total_points, merchants(name)")
    .eq("payment_method_id", pm.id)
    .gte("date", "2025-12-04")
    .lte("date", "2026-01-03")
    .order("date", { ascending: true }) as { data: TransactionWithMerchant[] | null };

  // Filter out other user's transactions
  const myTxns = txns?.filter(
    (t) => !OTHER_USER_AMOUNTS.includes(t.payment_amount)
  ) || [];

  console.log("Amex Cobalt Points Verification (Dec 4 2025 - Jan 3 2026)\n");
  console.log("Date       | Merchant                  | Amount  | Points");
  console.log("-".repeat(65));

  let total = 0;
  for (const t of myTxns) {
    const merchant = t.merchants?.name || "Unknown";
    console.log(
      `${t.date.slice(0, 10)} | ${merchant.padEnd(25)} | $${t.payment_amount.toFixed(2).padStart(7)} | ${String(t.total_points).padStart(5)}`
    );
    total += t.total_points || 0;
  }

  console.log("-".repeat(65));
  console.log(`\nTransaction count: ${myTxns.length}`);
  console.log(`Database total:    ${total.toLocaleString()} pts`);
  console.log(`Statement total:   8,098 pts`);
  console.log(`\nMatch: ${total === 8098 ? "✓ YES" : "✗ NO (diff: " + (8098 - total) + ")"}`);
}

main();
