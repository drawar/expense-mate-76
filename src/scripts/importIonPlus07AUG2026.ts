/**
 * Import RBC ION+ Visa statement, Jul 04 - Aug 03, 2026 (closing 2026-08-03).
 *
 * Card: 5cb1d8fb-b9dc-4700-901f-b19639284a5b (CAD, last4=9737)
 * User: e215b298-6ea8-44b0-b7b9-8b0b0bbaeb91
 *
 * 13 purchases totaling $348.04. Statement: 349 base + 678 bonus = 1027 pts.
 * Per-transaction floor rounding (matches QuickSetupService config); DB total
 * will be 341 base + 671 bonus = 1012 — see notes on RBC aggregate ceiling.
 *
 * Existing merchants enriched:
 *   - T&T Supermarket: add Metrotown address/coords/display_location
 *   - STM (Montreal Transit): add MCC 4111
 *
 * New merchants:
 *   - No Ne Kitchen and Bar (Vancouver)
 *   - Metro Plus ETS #2416 (Montreal grocery)
 *   - La Belle Tonki (Montreal)
 *   - LuggageHero (online-only, no fixed storefront)
 *
 * Run with: npx tsx src/scripts/importIonPlus07AUG2026.ts
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
const ION_PLUS_PM = "5cb1d8fb-b9dc-4700-901f-b19639284a5b";

const M = {
  tt: "dff6b7a6-e8fc-465a-8faa-964d347c1647",
  lyft: "9a7d2feb-1f69-489e-a396-b001685441da",
  uber: "2e30aa7b-2105-4364-8e44-f6db882be6a1",
  stm: "8f8e78ff-fa05-46f8-9086-b268559cba71",
  noNe: null as string | null,
  metroEts: null as string | null,
  laBelleTonki: null as string | null,
  luggageHero: null as string | null,
};

interface NewMerchant {
  key: "noNe" | "metroEts" | "laBelleTonki" | "luggageHero";
  name: string;
  address: string | null;
  displayLocation: string | null;
  mcc: { code: string; description: string };
  isOnline: boolean;
  coordinates: { lat: number; lng: number } | null;
  googleMapsUrl: string | null;
}

const NEW_MERCHANTS: NewMerchant[] = [
  {
    key: "noNe",
    name: "No Ne Kitchen and Bar",
    address: "867 Denman St, Vancouver, BC V6G 1M6",
    displayLocation: "West End, Vancouver",
    mcc: { code: "5812", description: "Eating Places, Restaurants" },
    isOnline: false,
    coordinates: { lat: 49.2906257, lng: -123.136971 },
    googleMapsUrl:
      "https://www.google.com/maps/search/?api=1&query=No+Ne+Kitchen+and+Bar%2C+867+Denman+St%2C+Vancouver%2C+BC",
  },
  {
    key: "metroEts",
    name: "Metro Plus ETS",
    address: "1230 Rue Notre-Dame Ouest, Montréal, QC H3C 6S3",
    displayLocation: "Griffintown, Montréal",
    mcc: { code: "5411", description: "Grocery Stores & Supermarkets" },
    isOnline: false,
    coordinates: { lat: 45.4931153, lng: -73.5644522 },
    googleMapsUrl:
      "https://www.google.com/maps/search/?api=1&query=Metro+Plus%2C+1230+Rue+Notre-Dame+Ouest%2C+Montreal%2C+QC",
  },
  {
    key: "laBelleTonki",
    name: "La Belle Tonki",
    address: "1335 Rue Beaubien Est, Montréal, QC H2G 1K7",
    displayLocation: "La Petite-Patrie, Montréal",
    mcc: { code: "5812", description: "Eating Places, Restaurants" },
    isOnline: false,
    coordinates: { lat: 45.5405517, lng: -73.5993224 },
    googleMapsUrl:
      "https://www.google.com/maps/search/?api=1&query=La+Belle+Tonki%2C+1335+Rue+Beaubien+Est%2C+Montreal%2C+QC",
  },
  {
    key: "luggageHero",
    name: "LuggageHero",
    address: null,
    displayLocation: null,
    // NOTE: 7299 in the DB seed table is labelled "Miscellaneous Recreation Services";
    // Visa/Mastercard's actual MCC 7299 is "Services—Miscellaneous Personal Services",
    // which fits a luggage-storage service. Using the correct definition here.
    mcc: { code: "7299", description: "Miscellaneous Personal Services" },
    isOnline: true,
    coordinates: null,
    googleMapsUrl: null,
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
    date: "2026-07-03",
    merchantKey: "noNe",
    amount: 43.42,
    mccCode: "5812",
    category: "3x",
    notes: "No Ne Kitchen and Bar Vancouver (restaurant)",
  },
  {
    date: "2026-07-05",
    merchantKey: "tt",
    amount: 56.72,
    mccCode: "5411",
    category: "3x",
    notes: "T&T Supermarket #001 Burnaby / Metrotown (grocery)",
  },
  {
    date: "2026-07-07",
    merchantKey: "tt",
    amount: 15.85,
    mccCode: "5411",
    category: "3x",
    notes: "T&T Supermarket #001 Burnaby / Metrotown (grocery)",
  },
  {
    date: "2026-07-20",
    merchantKey: "lyft",
    amount: 7.92,
    mccCode: "4121",
    category: "3x",
    notes: "Lyft Standard 07-19 Vancouver (rideshare)",
  },
  {
    date: "2026-07-28",
    merchantKey: "uber",
    amount: 10.3,
    mccCode: "4121",
    category: "3x",
    notes: "Uber Canada/UberTrip (rideshare)",
  },
  {
    date: "2026-07-28",
    merchantKey: "uber",
    amount: 14.25,
    mccCode: "4121",
    category: "3x",
    notes: "Uber Canada/UberTrip (rideshare)",
  },
  {
    date: "2026-07-28",
    merchantKey: "uber",
    amount: 42.09,
    mccCode: "4121",
    category: "3x",
    notes: "Uber Canada/UberTrip (rideshare)",
  },
  {
    date: "2026-07-28",
    merchantKey: "lyft",
    amount: 42.98,
    mccCode: "4121",
    category: "3x",
    notes: "Lyft Airport 07-26 Vancouver (rideshare)",
  },
  {
    date: "2026-07-29",
    merchantKey: "metroEts",
    amount: 26.65,
    mccCode: "5411",
    category: "3x",
    notes: "Metro ETS #2416 Montreal (grocery)",
  },
  {
    date: "2026-07-31",
    merchantKey: "stm",
    amount: 11.25,
    mccCode: "4111",
    category: "3x",
    notes: "STM Lucien-L'Allier SIN10 Montreal (transit)",
  },
  {
    date: "2026-08-01",
    merchantKey: "laBelleTonki",
    amount: 38.56,
    mccCode: "5812",
    category: "3x",
    notes: "La Belle Tonki Montreal (restaurant)",
  },
  {
    date: "2026-08-01",
    merchantKey: "luggageHero",
    amount: 9.38,
    mccCode: "7299",
    category: "1x",
    notes: "LuggageHero Nordhavn, Copenhagen (luggage storage)",
  },
  {
    date: "2026-08-02",
    merchantKey: "uber",
    amount: 28.67,
    mccCode: "4121",
    category: "3x",
    notes: "Uber Canada/UberTrip (rideshare)",
  },
];

function pointsFor(
  amount: number,
  cat: "3x" | "1x"
): { total: number; base: number; bonus: number } {
  const base = Math.floor(amount);
  const bonus = cat === "3x" ? Math.floor(amount * 2) : 0;
  return { total: base + bonus, base, bonus };
}

async function enrichExisting() {
  // T&T Supermarket → add Metrotown address
  const { error: ttErr } = await supabase
    .from("merchants")
    .update({
      address: "4800 Kingsway, Burnaby, BC V5H 2C3",
      display_location: "Metrotown, Burnaby",
      coordinates: { lat: 49.2249256, lng: -122.999969 },
      google_maps_url:
        "https://www.google.com/maps/search/?api=1&query=T%26T+Supermarket%2C+4800+Kingsway%2C+Burnaby%2C+BC",
    })
    .eq("id", M.tt);
  if (ttErr) throw ttErr;
  console.log(`Enriched T&T Supermarket (${M.tt}) with Metrotown address`);

  // STM → add MCC 4111
  const { error: stmErr } = await supabase
    .from("merchants")
    .update({
      mcc: {
        code: "4111",
        description: "Transportation—Suburban & Local Commuter",
      },
    })
    .eq("id", M.stm);
  if (stmErr) throw stmErr;
  console.log(`Enriched STM (${M.stm}) with MCC 4111`);
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
  console.log(`Importing ${transactions.length} RBC ION+ transactions...\n`);

  console.log("Step 1: enrich existing merchants (T&T, STM)");
  await enrichExisting();

  console.log("\nStep 2: ensure new merchants exist");
  await ensureMerchants();

  console.log("\nStep 3: insert transactions");
  let successCount = 0;
  let totalBase = 0;
  let totalBonus = 0;
  let totalDollars = 0;
  for (const t of transactions) {
    const merchantId = M[t.merchantKey];
    if (!merchantId) {
      console.error(`✗ merchantKey ${t.merchantKey} not resolved`);
      continue;
    }

    const pts = pointsFor(t.amount, t.category);
    totalBase += pts.base;
    totalBonus += pts.bonus;
    totalDollars += t.amount;

    const { error } = await supabase.from("transactions").insert({
      id: crypto.randomUUID(),
      user_id: USER_ID,
      date: t.date,
      merchant_id: merchantId,
      amount: t.amount,
      currency: "CAD",
      payment_method_id: ION_PLUS_PM,
      payment_amount: t.amount,
      payment_currency: "CAD",
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
        `✓ ${t.date} ${t.merchantKey.padEnd(14)} $${t.amount.toFixed(2).padStart(7)} mcc=${t.mccCode} ${t.category} → base ${pts.base} + bonus ${pts.bonus} = ${pts.total}`
      );
      successCount++;
    }
  }

  console.log(`\nDone! ${successCount}/${transactions.length} imported.`);
  console.log(
    `Total: $${totalDollars.toFixed(2)}  Points: base ${totalBase} + bonus ${totalBonus} = ${totalBase + totalBonus}`
  );
  console.log(
    `Statement:                            base 349 + bonus 678 = 1027`
  );
  console.log(
    `(Difference expected — RBC aggregates then ceilings; DB stores per-transaction floor.)`
  );
}

main();
