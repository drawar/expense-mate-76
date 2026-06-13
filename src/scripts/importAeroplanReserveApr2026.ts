/**
 * Import missing April 2026 transactions for Amex Aeroplan Reserve Card
 * Statement period: Apr 02, 2026 - May 01, 2026
 *
 * Already in DB:
 *   Apr 16 Air Canada $574.75 (1724 pts, 3x)
 *   Apr 16 ITIN Service (Frugal Flyer) $147 (184 pts, 1.25x)
 *   Apr 18 Broadway Driving School (Young Drivers) $544 (680 pts, 1.25x)
 *   Apr 27 Apollo Insurance $22.45 (28 pts, 1.25x)
 *
 * Run with: npx tsx src/scripts/importAeroplanReserveApr2026.ts
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { join } from "path";

const envPath = join(process.cwd(), ".env");
const envContent = readFileSync(envPath, "utf-8");
const envVars: Record<string, string> = {};
for (const line of envContent.split("\n")) {
  const match = line.match(/^([^=]+)="?([^"]*)"?$/);
  if (match) envVars[match[1]] = match[2];
}

const supabase = createClient(
  envVars.VITE_SUPABASE_URL,
  envVars.SUPABASE_SERVICE_ROLE_KEY
);

const USER_ID = "e215b298-6ea8-44b0-b7b9-8b0b0bbaeb91";
const PM_ID = "d7c8b577-ce6a-4355-9402-c3a1ae432d53";

interface Transaction {
  date: string;
  merchant: string;
  amount: number;
  currency: string;
  mcc: string;
  totalPoints: number;
  basePoints: number;
  bonusPoints: number;
  notes?: string;
}

// Points from statement page 6:
// 3x Air Canada: total = round(amount * 3), base = round(amount), bonus = total - base
// 1.25x Other: total = round(amount * 1.25), base = round(amount), bonus = total - base
const transactions: Transaction[] = [
  // Air Canada flights (3x, MCC 3009)
  {
    date: "2026-04-05",
    merchant: "Air Canada",
    amount: 103.41,
    currency: "CAD",
    mcc: "3009",
    totalPoints: 310,
    basePoints: 103,
    bonusPoints: 207,
    notes: "YVR-YYZ-YUL-YVR, ticket 0142324780498",
  },
  {
    date: "2026-04-16",
    merchant: "Air Canada",
    amount: 7.71,
    currency: "CAD",
    mcc: "3009",
    totalPoints: 23,
    basePoints: 8,
    bonusPoints: 15,
    notes: "YVR-EWR-YVR, ticket 0142325579881",
  },
  {
    date: "2026-04-18",
    merchant: "Air Canada",
    amount: 157.5,
    currency: "CAD",
    mcc: "3009",
    totalPoints: 473,
    basePoints: 158,
    bonusPoints: 315,
    notes: "YVR-YYZ-YUL-YVR, ticket 0144106827197",
  },
  {
    date: "2026-04-19",
    merchant: "Air Canada",
    amount: -103.41,
    currency: "CAD",
    mcc: "3009",
    totalPoints: -310,
    basePoints: -103,
    bonusPoints: -207,
    notes: "Refund, ticket 0142324780498",
  },

  // Instacart / Costco groceries (1.25x, MCC 5411)
  {
    date: "2026-04-16",
    merchant: "Instacart",
    amount: 35.21,
    currency: "CAD",
    mcc: "5411",
    totalPoints: 44,
    basePoints: 35,
    bonusPoints: 9,
    notes: "Costco by Instacart, Halifax",
  },
  {
    date: "2026-04-17",
    merchant: "Instacart",
    amount: 2.0,
    currency: "CAD",
    mcc: "5411",
    totalPoints: 3,
    basePoints: 2,
    bonusPoints: 1,
    notes: "Costco by Instacart, Halifax",
  },
  {
    date: "2026-04-19",
    merchant: "Instacart",
    amount: 38.01,
    currency: "CAD",
    mcc: "5411",
    totalPoints: 48,
    basePoints: 38,
    bonusPoints: 10,
    notes: "Costco by Instacart, Halifax",
  },

  // Instacart offer credits (0 pts - promotional credits)
  {
    date: "2026-04-18",
    merchant: "Instacart",
    amount: -10.0,
    currency: "CAD",
    mcc: "5411",
    totalPoints: 0,
    basePoints: 0,
    bonusPoints: 0,
    notes: "Instacart offer credit",
  },
  {
    date: "2026-04-19",
    merchant: "Instacart",
    amount: -10.0,
    currency: "CAD",
    mcc: "5411",
    totalPoints: 0,
    basePoints: 0,
    bonusPoints: 0,
    notes: "Instacart offer credit",
  },

  // Librairie Bertrand (1.25x, MCC 5942 bookstore)
  {
    date: "2026-04-25",
    merchant: "Librairie Bertrand",
    amount: 28.3,
    currency: "CAD",
    mcc: "5942",
    totalPoints: 35,
    basePoints: 28,
    bonusPoints: 7,
    notes: "Montreal",
  },

  // Hyatt Centric Montreal (1.25x, MCC 7011 hotel)
  {
    date: "2026-04-26",
    merchant: "Hyatt Centric Montreal",
    amount: 536.69,
    currency: "CAD",
    mcc: "7011",
    totalPoints: 671,
    basePoints: 537,
    bonusPoints: 134,
    notes: "Stay 04/21-04/26",
  },
  {
    date: "2026-04-26",
    merchant: "Hyatt Centric Montreal",
    amount: 760.41,
    currency: "CAD",
    mcc: "7011",
    totalPoints: 951,
    basePoints: 760,
    bonusPoints: 191,
    notes: "Stay 04/21-04/26",
  },
];

async function main() {
  console.log(
    "Importing missing April 2026 Aeroplan Reserve transactions...\n"
  );

  // Get or create merchants
  const merchantNames = [...new Set(transactions.map((t) => t.merchant))];
  const merchantMap = new Map<string, string>();

  for (const name of merchantNames) {
    const { data: existing } = await supabase
      .from("merchants")
      .select("id, name")
      .ilike("name", name)
      .eq("is_deleted", false)
      .limit(1);

    if (existing && existing.length > 0) {
      merchantMap.set(name, existing[0].id);
      console.log(`Found merchant: ${name} → ${existing[0].id}`);
    } else {
      const newId = crypto.randomUUID();
      const { error } = await supabase.from("merchants").insert({
        id: newId,
        name,
        is_deleted: false,
      });
      if (error) {
        console.error(`Error creating merchant ${name}:`, error.message);
        return;
      }
      merchantMap.set(name, newId);
      console.log(`Created merchant: ${name} → ${newId}`);
    }
  }

  console.log("");

  // Insert transactions
  let successCount = 0;
  for (const t of transactions) {
    const merchantId = merchantMap.get(t.merchant);
    if (!merchantId) {
      console.error(`Merchant not found: ${t.merchant}`);
      continue;
    }

    const { error } = await supabase.from("transactions").insert({
      id: crypto.randomUUID(),
      user_id: USER_ID,
      date: t.date,
      merchant_id: merchantId,
      amount: t.amount,
      currency: t.currency,
      payment_method_id: PM_ID,
      payment_amount: t.amount,
      payment_currency: "CAD",
      total_points: t.totalPoints,
      base_points: t.basePoints,
      bonus_points: t.bonusPoints,
      is_contactless: false,
      mcc_code: t.mcc,
      notes: t.notes || null,
    });

    if (error) {
      console.error(
        `Error: ${t.date} ${t.merchant} $${t.amount}:`,
        error.message
      );
    } else {
      console.log(
        `✓ ${t.date} ${t.merchant} $${t.amount} → ${t.totalPoints} pts`
      );
      successCount++;
    }
  }

  console.log(`\nDone! ${successCount}/${transactions.length} imported.`);
}

main();
