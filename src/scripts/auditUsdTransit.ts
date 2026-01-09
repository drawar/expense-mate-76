/**
 * Audit USD Uber/Lyft transactions for points verification
 * Run with: npx tsx src/scripts/auditUsdTransit.ts
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
  // Get Uber and Lyft merchant IDs
  const { data: merchants } = await supabase
    .from("merchants")
    .select("id, name")
    .in("name", ["Uber", "Lyft"])
    .eq("is_deleted", false);

  if (!merchants || merchants.length === 0) {
    console.log("No Uber/Lyft merchants found");
    return;
  }

  const merchantIds = merchants.map((m) => m.id);
  const merchantMap = new Map(merchants.map((m) => [m.id, m.name]));

  // Get USD transactions for these merchants
  const { data: transactions, error } = await supabase
    .from("transactions")
    .select(
      "id, date, merchant_id, amount, currency, payment_amount, payment_currency, total_points, base_points, bonus_points, mcc_code"
    )
    .in("merchant_id", merchantIds)
    .eq("currency", "USD")
    .order("date", { ascending: true });

  if (error) {
    console.error("Error:", error);
    return;
  }

  if (!transactions || transactions.length === 0) {
    console.log("No USD Uber/Lyft transactions found");
    return;
  }

  console.log("USD Uber/Lyft Transactions Audit");
  console.log("=".repeat(100));
  console.log("");
  console.log(
    "Date       | Merchant | USD Amt | CAD Amt | MCC  | Base | Bonus | Total | Expected (2x) | Status"
  );
  console.log("-".repeat(100));

  let totalDiff = 0;
  const needsUpdate: Array<{
    id: string;
    date: string;
    merchant: string;
    current: number;
    expected: number;
    expectedBase: number;
    expectedBonus: number;
    diff: number;
  }> = [];

  for (const t of transactions) {
    const merchant = merchantMap.get(t.merchant_id) || "Unknown";
    const paymentAmt = t.payment_amount || t.amount;
    const expectedTotal = Math.round(paymentAmt * 2);
    const expectedBase = Math.round(paymentAmt * 1);
    const expectedBonus = expectedTotal - expectedBase;

    const status = t.total_points === expectedTotal ? "✓ OK" : "⚠ DIFF";
    const diff = expectedTotal - t.total_points;

    if (diff !== 0) {
      totalDiff += diff;
      needsUpdate.push({
        id: t.id,
        date: t.date,
        merchant,
        current: t.total_points,
        expected: expectedTotal,
        expectedBase,
        expectedBonus,
        diff,
      });
    }

    console.log(
      t.date.padEnd(10) +
        " | " +
        merchant.padEnd(8) +
        " | " +
        ("$" + t.amount.toFixed(2)).padStart(7) +
        " | " +
        ("$" + paymentAmt.toFixed(2)).padStart(7) +
        " | " +
        (t.mcc_code || "N/A").padEnd(4) +
        " | " +
        String(t.base_points).padStart(4) +
        " | " +
        String(t.bonus_points).padStart(5) +
        " | " +
        String(t.total_points).padStart(5) +
        " | " +
        String(expectedTotal).padStart(13) +
        " | " +
        status
    );
  }

  console.log("-".repeat(100));
  console.log("");
  console.log("Summary:");
  console.log("Total USD Uber/Lyft transactions:", transactions.length);
  console.log("Transactions needing update:", needsUpdate.length);
  console.log("Total points difference:", totalDiff);

  if (needsUpdate.length > 0) {
    console.log("");
    console.log("Transactions that need points correction:");
    for (const t of needsUpdate) {
      console.log(
        "  " +
          t.date +
          " " +
          t.merchant +
          ": " +
          t.current +
          " → " +
          t.expected +
          " (diff: +" +
          t.diff +
          ")"
      );
    }
    console.log("");
    console.log("Run with --fix to update these transactions");
  }

  // Fix mode
  if (process.argv.includes("--fix") && needsUpdate.length > 0) {
    console.log("");
    console.log("Fixing transactions...");

    for (const t of needsUpdate) {
      const { error: updateError } = await supabase
        .from("transactions")
        .update({
          total_points: t.expected,
          base_points: t.expectedBase,
          bonus_points: t.expectedBonus,
        })
        .eq("id", t.id);

      if (updateError) {
        console.error(`Error updating ${t.id}:`, updateError);
      } else {
        console.log(`✓ Updated ${t.date} ${t.merchant}: ${t.current} → ${t.expected}`);
      }
    }

    console.log("Done!");
  }
}

main();
