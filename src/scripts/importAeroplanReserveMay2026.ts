/**
 * Import missing May 2026 transactions for Amex Aeroplan Reserve Card
 * Statement period: May 02, 2026 - Jun 01, 2026
 *
 * Already in DB:
 *   May 6/8 Uniqlo Canada $66.74 (83 pts, 1.25x)
 *   May 7/8 Instacart $36.54 (46 pts, 1.25x)
 *
 * Run with: npx tsx src/scripts/importAeroplanReserveMay2026.ts
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
// 1.25x Other: total = round(amount * 1.25), base = round(amount), bonus = total - base
// 2x Dining: total = round(amount * 2), base = round(amount), bonus = total - base
// 3x Air Canada: total = round(amount * 3), base = round(amount), bonus = total - base
const transactions: Transaction[] = [
  // Thinking Canada (1.25x, education/college)
  {
    date: "2026-05-11",
    merchant: "Thinking Canada",
    amount: 84.0,
    currency: "CAD",
    mcc: "8299",
    totalPoints: 105,
    basePoints: 84,
    bonusPoints: 21,
    notes: "Richmond",
  },

  // Air Canada (3x, MCC 3009)
  {
    date: "2026-05-13",
    merchant: "Air Canada",
    amount: 755.2,
    currency: "CAD",
    mcc: "3009",
    totalPoints: 2266,
    basePoints: 755,
    bonusPoints: 1511,
    notes: "FCO-AMS-YUL, ticket 0142327520396",
  },

  // Seoul, Korea transactions (1.25x, all in KRW converted to CAD)
  {
    date: "2026-05-14",
    merchant: "Joseon Hotel Seoul",
    amount: 1930.17,
    currency: "CAD",
    mcc: "7011",
    totalPoints: 2413,
    basePoints: 1930,
    bonusPoints: 483,
    notes: "Seoul, KRW 2,047,320 @ 0.00094",
  },
  {
    date: "2026-05-16",
    merchant: "Optima Wellness Museum",
    amount: 132.32,
    currency: "CAD",
    mcc: "7298",
    totalPoints: 165,
    basePoints: 132,
    bonusPoints: 33,
    notes: "Seoul, KRW 141,000 @ 0.00094",
  },
  {
    date: "2026-05-16",
    merchant: "Optima Wellness Museum",
    amount: 82.59,
    currency: "CAD",
    mcc: "7298",
    totalPoints: 103,
    basePoints: 83,
    bonusPoints: 20,
    notes: "Seoul, KRW 88,000 @ 0.00094",
  },
  {
    date: "2026-05-16",
    merchant: "Olive Young",
    amount: 53.11,
    currency: "CAD",
    mcc: "5912",
    totalPoints: 66,
    basePoints: 53,
    bonusPoints: 13,
    notes: "Seoul, KRW 56,600 @ 0.00094",
  },
  {
    date: "2026-05-16",
    merchant: "Olive Young",
    amount: 153.99,
    currency: "CAD",
    mcc: "5912",
    totalPoints: 192,
    basePoints: 154,
    bonusPoints: 38,
    notes: "Seoul, KRW 164,100 @ 0.00094",
  },
  {
    date: "2026-05-17",
    merchant: "MIX",
    amount: 16.89,
    currency: "CAD",
    mcc: "5812",
    totalPoints: 21,
    basePoints: 17,
    bonusPoints: 4,
    notes: "Seoul, KRW 18,000 @ 0.00094",
  },
  {
    date: "2026-05-17",
    merchant: "Damggot",
    amount: 15.76,
    currency: "CAD",
    mcc: "5812",
    totalPoints: 20,
    basePoints: 16,
    bonusPoints: 4,
    notes: "Seoul, KRW 16,800 @ 0.00094",
  },
  {
    date: "2026-05-17",
    merchant: "Myeongdong Town Ready Y",
    amount: 26.28,
    currency: "CAD",
    mcc: "5812",
    totalPoints: 33,
    basePoints: 26,
    bonusPoints: 7,
    notes: "Seoul, KRW 28,000 @ 0.00094",
  },
  {
    date: "2026-05-18",
    merchant: "Cellin Clinic",
    amount: 1735.36,
    currency: "CAD",
    mcc: "8099",
    totalPoints: 2169,
    basePoints: 1735,
    bonusPoints: 434,
    notes: "Myeongdong, Seoul, KRW 1,848,000 @ 0.00094",
  },
  {
    date: "2026-05-18",
    merchant: "Daiso",
    amount: 8.91,
    currency: "CAD",
    mcc: "5331",
    totalPoints: 11,
    basePoints: 9,
    bonusPoints: 2,
    notes: "Seoul, KRW 9,500 @ 0.00094",
  },
  {
    date: "2026-05-18",
    merchant: "GS25",
    amount: 5.45,
    currency: "CAD",
    mcc: "5499",
    totalPoints: 7,
    basePoints: 5,
    bonusPoints: 2,
    notes: "Seoul, KRW 5,800 @ 0.00094",
  },
  {
    date: "2026-05-18",
    merchant: "Segyeo Pharmacy",
    amount: 22.48,
    currency: "CAD",
    mcc: "5912",
    totalPoints: 28,
    basePoints: 22,
    bonusPoints: 6,
    notes: "Seoul, KRW 23,950 @ 0.00094",
  },
  {
    date: "2026-05-18",
    merchant: "Broadway Driving School",
    amount: 544.0,
    currency: "CAD",
    mcc: "8299",
    totalPoints: 680,
    basePoints: 544,
    bonusPoints: 136,
    notes: "Young Drivers of Canada, Woodbridge",
  },
  {
    date: "2026-05-18",
    merchant: "Olive Young",
    amount: 18.55,
    currency: "CAD",
    mcc: "5912",
    totalPoints: 23,
    basePoints: 19,
    bonusPoints: 4,
    notes: "Seoul, KRW 19,850 @ 0.00093",
  },

  // Taipei transaction
  {
    date: "2026-05-27",
    merchant: "Shangri-La Far Eastern Taipei",
    amount: 410.5,
    currency: "CAD",
    mcc: "7011",
    totalPoints: 513,
    basePoints: 411,
    bonusPoints: 102,
    notes: "Taipei City, TWD 9,119 @ 0.04502",
  },

  // Desserts Artisanaux (2x Dining, MCC 5462)
  {
    date: "2026-05-31",
    merchant: "Desserts Artisanaux",
    amount: 25.58,
    currency: "CAD",
    mcc: "5462",
    totalPoints: 51,
    basePoints: 26,
    bonusPoints: 25,
    notes: "Vancouver",
  },

  // Offer credits (0 pts)
  {
    date: "2026-05-07",
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
    date: "2026-05-09",
    merchant: "Uniqlo Canada",
    amount: -10.0,
    currency: "CAD",
    mcc: "5691",
    totalPoints: 0,
    basePoints: 0,
    bonusPoints: 0,
    notes: "Uniqlo offer credit",
  },
];

async function main() {
  console.log("Importing missing May 2026 Aeroplan Reserve transactions...\n");

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
