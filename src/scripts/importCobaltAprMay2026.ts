/**
 * Import missing Apr-May 2026 transactions for Amex Cobalt Card
 * Statement 1: Apr 04 - May 03, 2026 (2,914 pts)
 * Statement 2: May 04 - Jun 03, 2026 (1,882 pts)
 *
 * Run with: npx tsx src/scripts/importCobaltAprMay2026.ts
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
const PM_ID = "a0c0608d-2009-49cc-976d-d9381a436dd2"; // Cobalt

// Known merchant IDs
const KNOWN: Record<string, string> = {
  Uber: "2e30aa7b-2105-4364-8e44-f6db882be6a1",
  Lyft: "9a7d2feb-1f69-489e-a396-b001685441da",
  "Big Way Hot Pot": "a1bda74c-42ee-44c5-8903-04c6de5e41b9",
  Netflix: "aca2c8b2-43ca-4184-bb14-fe90b3451e72",
  "Uber Eats": "e7353ee6-26e3-462a-be98-612d14601669",
  "Restaurant Modavie": "edf0c734-d5db-438d-8a7a-8be78355eb5d",
  "PriceSmart Foods": "695fc9dd-02ac-4255-85ad-9978594ce10d",
  "American Express": "139b8bfe-b14f-4e9e-ae7c-5787be863494",
};

interface Txn {
  date: string;
  merchant: string;
  amount: number;
  mcc: string;
  totalPoints: number;
  basePoints: number;
  bonusPoints: number;
  notes?: string;
}

// Cobalt earn rates from statement:
// 5x Food/Drink (grocery 5411, restaurants 5812/5814, food delivery)
// 3x Streaming (4899)
// 2x Gas/Transit/Ride Share (4121)
// 1x Everything else
const transactions: Txn[] = [
  // === APRIL STATEMENT (Apr 4 - May 3) — 16 missing ===

  // 2x Transit/Ride Share
  {
    date: "2026-04-09",
    merchant: "Uber",
    amount: 38.05,
    mcc: "4121",
    totalPoints: 76,
    basePoints: 38,
    bonusPoints: 38,
    notes: "Toronto",
  },
  {
    date: "2026-04-25",
    merchant: "Lyft",
    amount: 7.97,
    mcc: "4121",
    totalPoints: 16,
    basePoints: 8,
    bonusPoints: 8,
    notes: "Vancouver",
  },
  {
    date: "2026-04-26",
    merchant: "Lyft",
    amount: 34.94,
    mcc: "4121",
    totalPoints: 70,
    basePoints: 35,
    bonusPoints: 35,
    notes: "Vancouver",
  },

  // 5x Food/Drink (grocery)
  {
    date: "2026-04-09",
    merchant: "PriceSmart Foods",
    amount: 14.36,
    mcc: "5411",
    totalPoints: 72,
    basePoints: 14,
    bonusPoints: 58,
    notes: "Burnaby",
  },

  // 5x Food/Drink (food delivery)
  {
    date: "2026-04-18",
    merchant: "Uber Eats",
    amount: 50.04,
    mcc: "5812",
    totalPoints: 250,
    basePoints: 50,
    bonusPoints: 200,
    notes: "Toronto",
  },

  // 5x Food/Drink (restaurants)
  {
    date: "2026-04-22",
    merchant: "Yokato Yokabai",
    amount: 29.89,
    mcc: "5812",
    totalPoints: 149,
    basePoints: 30,
    bonusPoints: 119,
    notes: "Montreal",
  },
  {
    date: "2026-04-22",
    merchant: "Krapow",
    amount: 36.97,
    mcc: "5812",
    totalPoints: 185,
    basePoints: 37,
    bonusPoints: 148,
    notes: "Montreal",
  },
  {
    date: "2026-04-23",
    merchant: "Cafe Myriade",
    amount: 10.73,
    mcc: "5812",
    totalPoints: 54,
    basePoints: 11,
    bonusPoints: 43,
    notes: "Montreal, Le Plateau",
  },
  {
    date: "2026-04-23",
    merchant: "Restaurant Ibericos",
    amount: 44.19,
    mcc: "5812",
    totalPoints: 221,
    basePoints: 44,
    bonusPoints: 177,
    notes: "Montreal",
  },
  {
    date: "2026-04-24",
    merchant: "Cafe Myriade",
    amount: 6.77,
    mcc: "5812",
    totalPoints: 34,
    basePoints: 7,
    bonusPoints: 27,
    notes: "Montreal, Le Plateau",
  },
  {
    date: "2026-04-24",
    merchant: "Epicerie Pumpui",
    amount: 60.82,
    mcc: "5812",
    totalPoints: 304,
    basePoints: 61,
    bonusPoints: 243,
    notes: "Montreal",
  },
  {
    date: "2026-04-24",
    merchant: "Cafe Le Falco",
    amount: 11.9,
    mcc: "5812",
    totalPoints: 60,
    basePoints: 12,
    bonusPoints: 48,
    notes: "Montreal",
  },
  {
    date: "2026-04-24",
    merchant: "Cafe Le Falco",
    amount: 5.22,
    mcc: "5812",
    totalPoints: 26,
    basePoints: 5,
    bonusPoints: 21,
    notes: "Montreal",
  },
  {
    date: "2026-04-25",
    merchant: "Restaurant Modavie",
    amount: 62.39,
    mcc: "5812",
    totalPoints: 312,
    basePoints: 62,
    bonusPoints: 250,
    notes: "Montreal",
  },
  {
    date: "2026-04-26",
    merchant: "Pasta Pooks",
    amount: 58.49,
    mcc: "5812",
    totalPoints: 292,
    basePoints: 58,
    bonusPoints: 234,
    notes: "Montréal",
  },
  {
    date: "2026-04-26",
    merchant: "YYC Wander Kitchen",
    amount: 25.83,
    mcc: "5812",
    totalPoints: 129,
    basePoints: 26,
    bonusPoints: 103,
    notes: "Calgary",
  },

  // === MAY STATEMENT (May 4 - Jun 3) — 8 purchases + 1 fee ===

  // 5x Food/Drink (restaurants)
  {
    date: "2026-05-08",
    merchant: "No 1. Beef Noodle House",
    amount: 26.47,
    mcc: "5812",
    totalPoints: 132,
    basePoints: 26,
    bonusPoints: 106,
    notes: "Burnaby",
  },
  {
    date: "2026-05-09",
    merchant: "Ellipsis",
    amount: 19.07,
    mcc: "5812",
    totalPoints: 95,
    basePoints: 19,
    bonusPoints: 76,
    notes: "Vancouver",
  },
  {
    date: "2026-05-09",
    merchant: "La Tortilleria",
    amount: 11.55,
    mcc: "5812",
    totalPoints: 58,
    basePoints: 12,
    bonusPoints: 46,
    notes: "Vancouver",
  },
  {
    date: "2026-05-30",
    merchant: "No 1. Beef Noodle House",
    amount: 46.48,
    mcc: "5812",
    totalPoints: 232,
    basePoints: 46,
    bonusPoints: 186,
    notes: "Burnaby",
  },
  {
    date: "2026-05-30",
    merchant: "Big Way Hot Pot",
    amount: 28.65,
    mcc: "5812",
    totalPoints: 143,
    basePoints: 29,
    bonusPoints: 114,
    notes: "Kingsway, Burnaby",
  },

  // 5x Food/Drink (food delivery)
  {
    date: "2026-06-01",
    merchant: "Uber Eats",
    amount: 77.29,
    mcc: "5812",
    totalPoints: 386,
    basePoints: 77,
    bonusPoints: 309,
    notes: "Toronto",
  },
  {
    date: "2026-06-01",
    merchant: "Uber Eats",
    amount: 34.48,
    mcc: "5812",
    totalPoints: 172,
    basePoints: 34,
    bonusPoints: 138,
    notes: "Toronto",
  },

  // 3x Streaming
  {
    date: "2026-05-19",
    merchant: "Netflix",
    amount: 9.03,
    mcc: "4899",
    totalPoints: 27,
    basePoints: 9,
    bonusPoints: 18,
    notes: "Vancouver",
  },

  // Membership fee (0 pts)
  {
    date: "2026-06-03",
    merchant: "American Express",
    amount: 15.99,
    mcc: "6012",
    totalPoints: 0,
    basePoints: 0,
    bonusPoints: 0,
    notes: "Cobalt monthly fee",
  },
];

async function main() {
  console.log("Importing missing Cobalt Apr-May 2026 transactions...\n");

  const merchantMap = new Map<string, string>(Object.entries(KNOWN));

  // Create missing merchants
  const needed = [...new Set(transactions.map((t) => t.merchant))].filter(
    (n) => !merchantMap.has(n)
  );
  for (const name of needed) {
    const { data: existing } = await supabase
      .from("merchants")
      .select("id")
      .ilike("name", name)
      .eq("is_deleted", false)
      .limit(1);
    if (existing?.length) {
      merchantMap.set(name, existing[0].id);
      console.log(`Found merchant: ${name} → ${existing[0].id}`);
    } else {
      const newId = crypto.randomUUID();
      const { error } = await supabase
        .from("merchants")
        .insert({ id: newId, name, is_deleted: false });
      if (error) {
        console.error(`Error creating ${name}:`, error.message);
        return;
      }
      merchantMap.set(name, newId);
      console.log(`Created merchant: ${name} → ${newId}`);
    }
  }

  console.log("");
  let ok = 0;
  for (const t of transactions) {
    const merchantId = merchantMap.get(t.merchant);
    if (!merchantId) {
      console.error(`No merchant: ${t.merchant}`);
      continue;
    }

    const { error } = await supabase.from("transactions").insert({
      id: crypto.randomUUID(),
      user_id: USER_ID,
      date: t.date,
      merchant_id: merchantId,
      amount: t.amount,
      currency: "CAD",
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
      ok++;
    }
  }
  console.log(`\nDone! ${ok}/${transactions.length} imported.`);
}

main();
