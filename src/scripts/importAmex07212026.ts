/**
 * Import Amex Green Card (US) statement, closing date 2026-07-21.
 *
 * Card: 56f2f4dd-8d8e-42cd-b557-2d0dbe77e6c5 (USD, last4=1003)
 * User: e215b298-6ea8-44b0-b7b9-8b0b0bbaeb91
 *
 * 6 new charges, $283.11 total, 849 MR points earned.
 * All 6 qualify for 3x (restaurant / airline / transit) per Amex Green US rules.
 * Points rule: round amount to nearest integer, then base = rounded, bonus = rounded * 2.
 *
 * Existing merchants reused (verified via checkAmex07212026Merchants.ts):
 *   - United Airlines: cbc842d1-dc51-4d6f-afee-f08343b07ced
 *   - Lyft: 9a7d2feb-1f69-489e-a396-b001685441da
 *   - Uber: 2e30aa7b-2105-4364-8e44-f6db882be6a1
 * New merchants: Mijoté (2400 Harrison St SF), Poke Bowl (33 Kearny St SF).
 *
 * Run with: npx tsx src/scripts/importAmex07212026.ts
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
const GREEN_PM_ID = "56f2f4dd-8d8e-42cd-b557-2d0dbe77e6c5";

const M = {
  united: "cbc842d1-dc51-4d6f-afee-f08343b07ced",
  lyft: "9a7d2feb-1f69-489e-a396-b001685441da",
  uber: "2e30aa7b-2105-4364-8e44-f6db882be6a1",
  mijote: null as string | null,
  pokeBowl: null as string | null,
};

interface NewMerchant {
  key: "mijote" | "pokeBowl";
  name: string;
  address: string;
  displayLocation: string;
  mcc: { code: string; description: string };
  isOnline: boolean;
  coordinates: { lat: number; lng: number };
  googleMapsUrl: string;
}

const NEW_MERCHANTS: NewMerchant[] = [
  {
    key: "mijote",
    name: "Mijoté",
    address: "2400 Harrison St, San Francisco, CA 94110",
    displayLocation: "Mission, San Francisco",
    mcc: { code: "5812", description: "Eating Places, Restaurants" },
    isOnline: false,
    coordinates: { lat: 37.7588943, lng: -122.4127457 },
    googleMapsUrl:
      "https://www.google.com/maps/search/?api=1&query=Mijot%C3%A9%2C+2400+Harrison+St%2C+San+Francisco%2C+CA+94110",
  },
  {
    key: "pokeBowl",
    name: "Poke Bowl",
    address: "33 Kearny St, San Francisco, CA 94108",
    displayLocation: "Union Square, San Francisco",
    mcc: { code: "5814", description: "Fast Food Restaurants" },
    isOnline: false,
    coordinates: { lat: 37.7882695, lng: -122.4037001 },
    googleMapsUrl:
      "https://www.google.com/maps/search/?api=1&query=Poke+Bowl%2C+33+Kearny+St%2C+San+Francisco%2C+CA+94108",
  },
];

interface Tx {
  date: string;
  merchantKey: keyof typeof M;
  amount: number;
  mccCode: string;
  category: "3x" | "1x";
  notes: string;
}

const transactions: Tx[] = [
  {
    date: "2026-07-14",
    merchantKey: "united",
    amount: 33.83,
    mccCode: "3000",
    category: "3x",
    notes:
      "AplPay United Airlines — ticket 01621207030774, TPE→SFO UA, depart 2026-08-16, pax LE/HOANGVAN",
  },
  {
    date: "2026-07-20",
    merchantKey: "pokeBowl",
    amount: 17.11,
    mccCode: "5814",
    category: "3x",
    notes: "AplPay Poke Bowl SF (33 Kearny St) — Square receipt",
  },
  {
    date: "2026-07-20",
    merchantKey: "lyft",
    amount: 15.01,
    mccCode: "4121",
    category: "3x",
    notes: "AplPay Lyft rideshare",
  },
  {
    date: "2026-07-21",
    merchantKey: "uber",
    amount: 63.19,
    mccCode: "4121",
    category: "3x",
    notes: "Uber Trip ref Z46JJ5B6",
  },
  {
    date: "2026-07-21",
    merchantKey: "uber",
    amount: 15.95,
    mccCode: "4121",
    category: "3x",
    notes: "Uber Trip ref TL6Y2CKG",
  },
  {
    date: "2026-07-21",
    merchantKey: "mijote",
    amount: 138.02,
    mccCode: "5812",
    category: "3x",
    notes: "Mijoté SF (2400 Harrison St) — Square receipt",
  },
];

function pointsFor(
  amount: number,
  cat: "3x" | "1x"
): { total: number; base: number; bonus: number } {
  const rounded = Math.round(amount);
  const base = rounded;
  const bonus = cat === "3x" ? rounded * 2 : 0;
  return { total: base + bonus, base, bonus };
}

async function ensureMerchants() {
  for (const m of NEW_MERCHANTS) {
    const { data: existing } = await supabase
      .from("merchants")
      .select("id, name")
      .ilike("name", m.name)
      .limit(1);

    if (existing && existing.length > 0) {
      M[m.key] = existing[0].id;
      console.log(`Reusing merchant: ${m.name} → ${existing[0].id}`);
      continue;
    }

    const newId = crypto.randomUUID();
    const { error } = await supabase.from("merchants").insert({
      id: newId,
      name: m.name,
      address: m.address,
      display_location: m.displayLocation,
      mcc: m.mcc,
      is_online: m.isOnline,
      coordinates: m.coordinates,
      google_maps_url: m.googleMapsUrl,
    });
    if (error) {
      console.error(`Error creating merchant ${m.name}:`, error.message);
      throw error;
    }
    M[m.key] = newId;
    console.log(`Created merchant: ${m.name} → ${newId}`);
  }
}

async function main() {
  console.log(
    `Importing ${transactions.length} Amex Green US transactions...\n`
  );

  console.log("Step 1: ensure new merchants exist");
  await ensureMerchants();

  console.log("\nStep 2: insert transactions");
  let successCount = 0;
  let totalPoints = 0;
  let totalDollars = 0;
  for (const t of transactions) {
    const merchantId = M[t.merchantKey];
    if (!merchantId) {
      console.error(`✗ merchantKey ${t.merchantKey} not resolved`);
      continue;
    }

    const pts = pointsFor(t.amount, t.category);
    totalPoints += pts.total;
    totalDollars += t.amount;

    const { error } = await supabase.from("transactions").insert({
      id: crypto.randomUUID(),
      user_id: USER_ID,
      date: t.date,
      merchant_id: merchantId,
      amount: t.amount,
      currency: "USD",
      payment_method_id: GREEN_PM_ID,
      payment_amount: t.amount,
      payment_currency: "USD",
      total_points: pts.total,
      base_points: pts.base,
      bonus_points: pts.bonus,
      mcc_code: t.mccCode,
      is_contactless: false,
      notes: t.notes,
    });

    if (error) {
      console.error(
        `✗ ${t.date} ${t.merchantKey} $${t.amount}:`,
        error.message
      );
    } else {
      console.log(
        `✓ ${t.date} ${t.merchantKey.padEnd(10)} $${t.amount.toFixed(2).padStart(7)} mcc=${t.mccCode} ${t.category} → ${pts.total} pts`
      );
      successCount++;
    }
  }

  console.log(`\nDone! ${successCount}/${transactions.length} imported.`);
  console.log(
    `Total: $${totalDollars.toFixed(2)}  Points earned: ${totalPoints}`
  );
}

main();
