/**
 * Import Amex Cobalt (CA) statement, Jul 04 – Aug 03, 2026.
 *
 * Card: a0c0608d-2009-49cc-976d-d9381a436dd2 (CAD, last4=1002)
 * User: e215b298-6ea8-44b0-b7b9-8b0b0bbaeb91
 *
 * 34 purchases + 1 refund + 1 membership-fee installment = 36 transactions.
 * Skipped: Jul 24 Payment received -$603.66.
 *
 * Rewards (Cobalt CA — verified against statement's per-tx points table):
 *   - 5× on Food/Drink (grocery 5411, restaurants 5811-5814, bakery 5462): total = pointRound(amount × 5)
 *     split: base = pointRound(amount), bonus = total − base
 *   - 3× on Streaming (Netflix, MCC 4899)
 *   - 2× on Transit/Rideshare (MCC 4111 transit, 4121 taxi)
 *   - 1× everything else (Hyatt FB @ MCC 3641)
 *   - Fee: 0 pts
 * Rounding = round half away from zero per-tx (statement matches exactly at 3,381 pts).
 *
 * The Hyatt SFORD FB is a foreign currency charge: USD 1.29 → CAD 1.86 @ 1.44186.
 * Per CLAUDE.md, points are computed on the CAD payment_amount, not USD amount.
 *
 * Run with: npx tsx src/scripts/importCobalt08032026.ts
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
const COBALT_PM = "a0c0608d-2009-49cc-976d-d9381a436dd2";

const M = {
  // Existing to reuse
  compass: "9db149df-8b7f-433b-b29f-a5c258760549",
  goodfood: "214bfc2a-9f5c-4ae6-96c4-6701aef24af0",
  netflix: "aca2c8b2-43ca-4184-bb14-fe90b3451e72",
  uber: "2e30aa7b-2105-4364-8e44-f6db882be6a1",
  uberEats: "e7353ee6-26e3-462a-be98-612d14601669",
  metroEts: "5b3ef99f-794f-4ad5-bf3d-4c226a068882",
  noNe: "07b47b3a-bf32-481d-9ce6-cc9aea46c978",
  amex: "139b8bfe-b14f-4e9e-ae7c-5787be863494",
  // Existing to enrich
  bodyEnergy: "8ae7c322-3368-4bdd-94ab-fe4744991c04",
  parallel49Van: "4d817077-18dc-4c0a-b403-12cce62af202", // will be Vancouver Thurlow
  joyeaux: "6e5d7c22-573d-46b6-b5d0-c398032985e9",
  // New
  analogCoffee: null as string | null,
  socialCorner: null as string | null,
  honoluluCoffee: null as string | null,
  goodEarth: null as string | null,
  sloCoffee: null as string | null,
  treesOrganic: null as string | null,
  passioneGelato: null as string | null,
  bisouBakehouse: null as string | null,
  cafeHabitudes: null as string | null,
  cafeEclair: null as string | null,
  ryuAdm: null as string | null,
  parallel49Mtl: null as string | null,
  hyattSoma: null as string | null,
};

interface NewMerchant {
  key: keyof typeof M;
  name: string;
  address: string | null;
  displayLocation: string | null;
  mcc: { code: string; description: string };
  isOnline: boolean;
  coordinates: { lat: number; lng: number } | null;
  googleMapsUrl: string | null;
}

const gmaps = (q: string) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;

const NEW_MERCHANTS: NewMerchant[] = [
  {
    key: "analogCoffee",
    name: "Analog Coffee Yaletown",
    address: "338 Helmcken St, Vancouver, BC V6B 6C5",
    displayLocation: "Yaletown, Vancouver",
    mcc: { code: "5814", description: "Fast Food Restaurants" },
    isOnline: false,
    coordinates: { lat: 49.2757856, lng: -123.121109 },
    googleMapsUrl: gmaps("Analog Coffee, 338 Helmcken St, Vancouver, BC"),
  },
  {
    key: "socialCorner",
    name: "per se Social Corner",
    address: "891 Homer St, Vancouver, BC V6B 2W5",
    displayLocation: "Yaletown, Vancouver",
    mcc: { code: "5812", description: "Eating Places, Restaurants" },
    isOnline: false,
    coordinates: { lat: 49.2786045, lng: -123.118459 },
    googleMapsUrl: gmaps("per se Social Corner, 891 Homer St, Vancouver, BC"),
  },
  {
    key: "honoluluCoffee",
    name: "Honolulu Coffee (Olympic Village)",
    address: "97 W 2nd Ave, Vancouver, BC V5Y 1B3",
    displayLocation: "Olympic Village, Vancouver",
    mcc: { code: "5814", description: "Fast Food Restaurants" },
    isOnline: false,
    coordinates: { lat: 49.2694693, lng: -123.1063672 },
    googleMapsUrl: gmaps("Honolulu Coffee, 97 W 2nd Ave, Vancouver, BC"),
  },
  {
    key: "goodEarth",
    name: "Good Earth Coffeehouse (Robson)",
    address: "1033 Robson St, Vancouver, BC V6E 1A9",
    displayLocation: "West End, Vancouver",
    mcc: { code: "5814", description: "Fast Food Restaurants" },
    isOnline: false,
    coordinates: { lat: 49.2840399, lng: -123.123561 },
    googleMapsUrl: gmaps(
      "Good Earth Coffeehouse, 1033 Robson St, Vancouver, BC"
    ),
  },
  {
    key: "sloCoffee",
    name: "Slo Coffee Granville",
    address: "609 Granville St #102, Vancouver, BC V7Y 1H2",
    displayLocation: "Downtown, Vancouver",
    mcc: { code: "5814", description: "Fast Food Restaurants" },
    isOnline: false,
    coordinates: { lat: 49.2833899, lng: -123.117124 },
    googleMapsUrl: gmaps("Slo Coffee, 609 Granville St, Vancouver, BC"),
  },
  {
    key: "treesOrganic",
    name: "Trees Organic Coffee (450 Granville)",
    address: "450 Granville St, Vancouver, BC V6C 1T2",
    displayLocation: "Downtown, Vancouver",
    mcc: { code: "5814", description: "Fast Food Restaurants" },
    isOnline: false,
    coordinates: { lat: 49.2848589, lng: -123.1143085 },
    googleMapsUrl: gmaps(
      "Trees Organic Coffee, 450 Granville St, Vancouver, BC"
    ),
  },
  {
    key: "passioneGelato",
    name: "Passione Gelato",
    address: "55 Smithe St, Vancouver, BC V6B 0R3",
    displayLocation: "Downtown, Vancouver",
    mcc: { code: "5814", description: "Fast Food Restaurants" },
    isOnline: false,
    coordinates: { lat: 49.2757259, lng: -123.1140556 },
    googleMapsUrl: gmaps("Passione Gelato, 55 Smithe St, Vancouver, BC"),
  },
  {
    key: "bisouBakehouse",
    name: "Bisou Bakehouse (Robson)",
    address: "1201 Robson St, Vancouver, BC V6E 1Y4",
    displayLocation: "West End, Vancouver",
    mcc: { code: "5462", description: "Bakeries" },
    isOnline: false,
    coordinates: { lat: 49.2861774, lng: -123.126971 },
    googleMapsUrl: gmaps("Bisou Bakehouse, 1201 Robson St, Vancouver, BC"),
  },
  {
    key: "cafeHabitudes",
    name: "Café des Habitudes",
    address: "1104 Rue Saint-Zotique E, Montréal, QC H2S 2H1",
    displayLocation: "La Petite-Patrie, Montréal",
    mcc: { code: "5814", description: "Fast Food Restaurants" },
    isOnline: false,
    // Nominatim returned street segments only for 1104 St-Zotique; use nearby segment approx
    coordinates: { lat: 45.537343, lng: -73.6068594 },
    googleMapsUrl: gmaps(
      "Cafe des Habitudes, 1104 Rue Saint-Zotique Est, Montreal"
    ),
  },
  {
    key: "cafeEclair",
    name: "Café Éclair",
    address: "12 Rue Maguire, Montréal, QC H2T 1B8",
    displayLocation: "Mile-End, Montréal",
    mcc: { code: "5814", description: "Fast Food Restaurants" },
    isOnline: false,
    coordinates: { lat: 45.5246486, lng: -73.5955399 },
    googleMapsUrl: gmaps("Cafe Eclair, 12 Rue Maguire, Montreal"),
  },
  {
    key: "ryuAdm",
    name: "Ryu ADM (YUL Airport)",
    address: "975 Bd Roméo-Vachon N, Gate 79, Dorval, QC H4Y 1K3",
    displayLocation: "YUL Airport, Dorval",
    mcc: { code: "5812", description: "Eating Places, Restaurants" },
    isOnline: false,
    coordinates: { lat: 45.4647437, lng: -73.7504712 },
    googleMapsUrl: gmaps("Ryu ADM, Montreal Trudeau Airport"),
  },
  {
    key: "parallel49Mtl",
    name: "49th Parallel Coffee (Montréal)",
    address: "488 Rue McGill, Montréal, QC H2Y 2H4",
    displayLocation: "Vieux-Montréal, Montréal",
    mcc: { code: "5814", description: "Fast Food Restaurants" },
    isOnline: false,
    coordinates: { lat: 45.5008022, lng: -73.5594858 },
    googleMapsUrl: gmaps("49th Parallel Coffee, 488 Rue McGill, Montreal"),
  },
  {
    key: "hyattSoma",
    name: "Hyatt Regency San Francisco Downtown SOMA",
    address: "50 3rd St, San Francisco, CA 94103",
    displayLocation: "SOMA, San Francisco",
    mcc: { code: "3641", description: "Hyatt Regency" },
    isOnline: false,
    coordinates: { lat: 37.7865463, lng: -122.4030879 },
    googleMapsUrl: gmaps(
      "Hyatt Regency San Francisco Downtown SOMA, 50 3rd St"
    ),
  },
];

interface Enrichment {
  id: string;
  update: Record<string, unknown>;
  label: string;
}

const ENRICHMENTS: Enrichment[] = [
  {
    id: M.bodyEnergy,
    label: "Body Energy Club (W Georgia @ Equinox)",
    update: {
      address: "1131 W Georgia St, Vancouver, BC V6E 4T9",
      display_location: "Coal Harbour (inside Equinox), Vancouver",
      mcc: { code: "5499", description: "Miscellaneous Food Stores" },
      // Smoothie/juice bar/supplement shop. Statement charges may still arrive as 5411 (that's Amex's per-tx coding, kept as-is on the transaction rows); the merchant-level MCC reflects the store's true category. Both 5411 and 5499 earn 5x on Cobalt.
      coordinates: { lat: 49.2862881, lng: -123.123574 },
      google_maps_url: gmaps(
        "Body Energy Club, 1131 W Georgia St, Vancouver, BC"
      ),
    },
  },
  {
    id: M.parallel49Van,
    label: "49th Parallel Coffee (Thurlow / Vancouver downtown)",
    update: {
      address: "689 Thurlow St, Vancouver, BC V6E 4A6",
      display_location: "Coal Harbour, Vancouver",
      mcc: { code: "5814", description: "Fast Food Restaurants" },
      coordinates: { lat: 49.2860362, lng: -123.1230296 },
      google_maps_url: gmaps(
        "49th Parallel Coffee, 689 Thurlow St, Vancouver, BC"
      ),
    },
  },
  {
    id: M.joyeaux,
    label: "Joyeaux Cafe & Restaurant",
    update: {
      address: "551 Howe St, Vancouver, BC V6C 2C2",
      display_location: "Downtown, Vancouver",
      mcc: { code: "5812", description: "Eating Places, Restaurants" },
      coordinates: { lat: 49.2848786, lng: -123.1170112 },
      google_maps_url: gmaps(
        "Joyeaux Cafe & Restaurant, 551 Howe St, Vancouver, BC"
      ),
    },
  },
];

// Round half away from zero (matches Amex statement rounding for negatives too).
function pointRound(x: number): number {
  return x >= 0 ? Math.floor(x + 0.5) : -Math.floor(-x + 0.5);
}

type RuleType = "5x-food" | "3x-stream" | "2x-transit" | "1x" | "fee";

interface Tx {
  date: string;
  merchantKey: keyof typeof M;
  amount: number; // in transaction currency
  paymentAmount?: number; // CAD if different from amount
  currency?: string; // default CAD
  mccCode: string;
  rule: RuleType;
  notes: string;
}

const transactions: Tx[] = [
  {
    date: "2026-07-03",
    merchantKey: "compass",
    amount: 100.0,
    mccCode: "4111",
    rule: "2x-transit",
    notes: "Compass Vending BURN Burnaby (transit fare load)",
  },
  {
    date: "2026-07-04",
    merchantKey: "analogCoffee",
    amount: 14.97,
    mccCode: "5814",
    rule: "5x-food",
    notes: "Analog Coffee Yaletown Vancouver",
  },
  {
    date: "2026-07-06",
    merchantKey: "goodfood",
    amount: 115.99,
    mccCode: "5411",
    rule: "5x-food",
    notes: "Goodfood* Marche Goodfood Saint-Laurent (meal kit / grocery)",
  },
  {
    date: "2026-07-08",
    merchantKey: "socialCorner",
    amount: 63.18,
    mccCode: "5812",
    rule: "5x-food",
    notes: "TST-Social Corner Vancouver (per se Social Corner)",
  },
  {
    date: "2026-07-09",
    merchantKey: "honoluluCoffee",
    amount: 18.75,
    mccCode: "5814",
    rule: "5x-food",
    notes: "Honolulu Coffee Vancouver (Olympic Village)",
  },
  {
    date: "2026-07-09",
    merchantKey: "bodyEnergy",
    amount: 11.54,
    mccCode: "5411",
    rule: "5x-food",
    notes: "Body Energy Club LTD 21 Vancouver (W Georgia @ Equinox)",
  },
  {
    date: "2026-07-11",
    merchantKey: "parallel49Van",
    amount: 5.13,
    mccCode: "5814",
    rule: "5x-food",
    notes: "LS 49th Parallel Coffee Vancouver (Thurlow)",
  },
  {
    date: "2026-07-11",
    merchantKey: "bodyEnergy",
    amount: 11.54,
    mccCode: "5411",
    rule: "5x-food",
    notes: "Body Energy Club LTD 21 Vancouver",
  },
  {
    date: "2026-07-11",
    merchantKey: "goodEarth",
    amount: 11.97,
    mccCode: "5814",
    rule: "5x-food",
    notes: "Good Earth Coffee House Vancouver (Robson)",
  },
  {
    date: "2026-07-12",
    merchantKey: "sloCoffee",
    amount: 8.81,
    mccCode: "5814",
    rule: "5x-food",
    notes: "Slo Coffee Granville St Vancouver",
  },
  {
    date: "2026-07-13",
    merchantKey: "goodfood",
    amount: -115.99,
    mccCode: "5411",
    rule: "5x-food",
    notes: "Goodfood* Marche Goodfood Saint-Laurent — REFUND",
  },
  {
    date: "2026-07-14",
    merchantKey: "bodyEnergy",
    amount: 12.59,
    mccCode: "5411",
    rule: "5x-food",
    notes: "Body Energy Club LTD 21 Vancouver",
  },
  {
    date: "2026-07-15",
    merchantKey: "joyeaux",
    amount: 10.0,
    mccCode: "5812",
    rule: "5x-food",
    notes: "Joyeaux Cafe & Restaurant Vancouver",
  },
  {
    date: "2026-07-16",
    merchantKey: "bodyEnergy",
    amount: 12.59,
    mccCode: "5411",
    rule: "5x-food",
    notes: "Body Energy Club LTD 21 Vancouver",
  },
  {
    date: "2026-07-16",
    merchantKey: "compass",
    amount: 100.0,
    mccCode: "4111",
    rule: "2x-transit",
    notes: "Compass Vending BURN Burnaby (transit fare load)",
  },
  {
    date: "2026-07-17",
    merchantKey: "joyeaux",
    amount: 10.0,
    mccCode: "5812",
    rule: "5x-food",
    notes: "Joyeaux Cafe & Restaurant Vancouver",
  },
  {
    date: "2026-07-17",
    merchantKey: "treesOrganic",
    amount: 8.03,
    mccCode: "5814",
    rule: "5x-food",
    notes: "Trees Organic Coffee 00 Vancouver (450 Granville)",
  },
  {
    date: "2026-07-17",
    merchantKey: "passioneGelato",
    amount: 10.5,
    mccCode: "5814",
    rule: "5x-food",
    notes: "Passione Gelato 001 Vancouver (Smithe)",
  },
  {
    date: "2026-07-18",
    merchantKey: "bisouBakehouse",
    amount: 7.34,
    mccCode: "5462",
    rule: "5x-food",
    notes: "Bisou Bake House Robson Vancouver",
  },
  {
    date: "2026-07-19",
    merchantKey: "sloCoffee",
    amount: 8.45,
    mccCode: "5814",
    rule: "5x-food",
    notes: "Slo Coffee Granville St Vancouver",
  },
  {
    date: "2026-07-19",
    merchantKey: "netflix",
    amount: 8.95,
    mccCode: "4899",
    rule: "3x-stream",
    notes: "Netflix.com",
  },
  {
    date: "2026-07-19",
    merchantKey: "bodyEnergy",
    amount: 11.54,
    mccCode: "5411",
    rule: "5x-food",
    notes: "Body Energy Club LTD 21 Vancouver",
  },
  {
    date: "2026-07-20",
    merchantKey: "uber",
    amount: 32.41,
    mccCode: "4121",
    rule: "2x-transit",
    notes: "Uber Trip Toronto (rideshare)",
  },
  {
    date: "2026-07-20",
    merchantKey: "uberEats",
    amount: 57.2,
    mccCode: "5812",
    rule: "5x-food",
    notes: "Uber Eats Toronto",
  },
  {
    date: "2026-07-20",
    merchantKey: "uber",
    amount: 4.86,
    mccCode: "4121",
    rule: "2x-transit",
    notes: "Uber Trip Toronto (rideshare)",
  },
  {
    date: "2026-07-21",
    merchantKey: "hyattSoma",
    amount: 1.29,
    paymentAmount: 1.86,
    currency: "USD",
    mccCode: "3641",
    rule: "1x",
    notes:
      "SFORD - FB - Hyatt Regency San Francisco Downtown SOMA — USD 1.29 @ 1.44186 = CAD 1.86",
  },
  {
    date: "2026-07-27",
    merchantKey: "uberEats",
    amount: 44.56,
    mccCode: "5812",
    rule: "5x-food",
    notes: "Uber Eats Toronto",
  },
  {
    date: "2026-07-29",
    merchantKey: "metroEts",
    amount: 51.23,
    mccCode: "5411",
    rule: "5x-food",
    notes: "Metro ETS #2416 Montreal (grocery)",
  },
  {
    date: "2026-07-31",
    merchantKey: "uberEats",
    amount: 33.56,
    mccCode: "5812",
    rule: "5x-food",
    notes: "Uber Eats Toronto",
  },
  {
    date: "2026-07-31",
    merchantKey: "cafeHabitudes",
    amount: 7.16,
    mccCode: "5814",
    rule: "5x-food",
    notes: "Cafe des Habitudes 001 Montreal",
  },
  {
    date: "2026-08-01",
    merchantKey: "ryuAdm",
    amount: 33.34,
    mccCode: "5812",
    rule: "5x-food",
    notes: "Ryu ADM 1 001 Dorval (YUL Airport Gate 79)",
  },
  {
    date: "2026-08-01",
    merchantKey: "cafeEclair",
    amount: 5.46,
    mccCode: "5814",
    rule: "5x-food",
    notes: "Cafe Eclair 001 Montreal (Mile-End)",
  },
  {
    date: "2026-08-01",
    merchantKey: "parallel49Mtl",
    amount: 24.0,
    mccCode: "5814",
    rule: "5x-food",
    notes: "LS 49th Parallel Coffee Montreal (488 Rue McGill)",
  },
  {
    date: "2026-08-02",
    merchantKey: "noNe",
    amount: 45.84,
    mccCode: "5812",
    rule: "5x-food",
    notes: "No Ne Kitchen and Bar Vancouver",
  },
  {
    date: "2026-08-03",
    merchantKey: "joyeaux",
    amount: 35.56,
    mccCode: "5812",
    rule: "5x-food",
    notes: "Joyeaux Cafe & Restaurant Vancouver",
  },
  {
    date: "2026-08-03",
    merchantKey: "amex",
    amount: 15.99,
    mccCode: "6012",
    rule: "fee",
    notes: "Cobalt monthly membership fee installment",
  },
];

function pointsFor(t: Tx): { total: number; base: number; bonus: number } {
  const calcAmount = t.paymentAmount ?? t.amount; // CLAUDE.md rule: convertedAmount for FX
  if (t.rule === "fee") return { total: 0, base: 0, bonus: 0 };
  const mult =
    t.rule === "5x-food"
      ? 5
      : t.rule === "3x-stream"
        ? 3
        : t.rule === "2x-transit"
          ? 2
          : 1;
  const total = pointRound(calcAmount * mult);
  const base = pointRound(calcAmount);
  const bonus = total - base;
  return { total, base, bonus };
}

async function enrichExisting() {
  for (const e of ENRICHMENTS) {
    const { error } = await supabase
      .from("merchants")
      .update(e.update)
      .eq("id", e.id);
    if (error) throw error;
    console.log(`Enriched ${e.label} (${e.id})`);
  }
}

async function ensureNewMerchants() {
  for (const m of NEW_MERCHANTS) {
    const { data: existing } = await supabase
      .from("merchants")
      .select("id")
      .ilike("name", m.name)
      .limit(1);
    if (existing && existing.length > 0) {
      (M as Record<string, string | null>)[m.key] = existing[0].id;
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
      console.error(`Error creating ${m.name}:`, error.message);
      throw error;
    }
    (M as Record<string, string | null>)[m.key] = newId;
    console.log(`Created merchant: ${m.name} → ${newId}`);
  }
}

async function main() {
  console.log(`Importing ${transactions.length} Cobalt transactions...\n`);
  console.log(
    "Step 1: enrich existing merchants (BEC, 49th Parallel Van, Joyeaux)"
  );
  await enrichExisting();
  console.log("\nStep 2: ensure new merchants exist");
  await ensureNewMerchants();
  console.log("\nStep 3: insert transactions");

  let successCount = 0,
    totalPoints = 0,
    totalDollars = 0;
  for (const t of transactions) {
    const merchantId = (M as Record<string, string | null>)[t.merchantKey];
    if (!merchantId) {
      console.error(`✗ ${t.merchantKey} unresolved`);
      continue;
    }
    const pts = pointsFor(t);
    totalPoints += pts.total;
    totalDollars += t.paymentAmount ?? t.amount;

    const { error } = await supabase.from("transactions").insert({
      id: crypto.randomUUID(),
      user_id: USER_ID,
      date: t.date,
      merchant_id: merchantId,
      amount: t.amount,
      currency: t.currency ?? "CAD",
      payment_method_id: COBALT_PM,
      payment_amount: t.paymentAmount ?? t.amount,
      payment_currency: "CAD",
      total_points: pts.total,
      base_points: pts.base,
      bonus_points: pts.bonus,
      mcc_code: t.mccCode,
      is_contactless: false,
      notes: t.notes,
    });
    if (error) {
      console.error(`✗ ${t.date} ${t.merchantKey}:`, error.message);
      continue;
    }
    const amt = t.paymentAmount ?? t.amount;
    const amtStr =
      amt < 0 ? `-$${Math.abs(amt).toFixed(2)}` : `$${amt.toFixed(2)}`;
    console.log(
      `✓ ${t.date} ${t.merchantKey.padEnd(15)} ${amtStr.padStart(9)} mcc=${t.mccCode} ${t.rule.padEnd(11)} → ${pts.total} pts (base ${pts.base} + bonus ${pts.bonus})`
    );
    successCount++;
  }
  console.log(`\nDone! ${successCount}/${transactions.length} imported.`);
  console.log(
    `Total (payment_amount CAD): $${totalDollars.toFixed(2)}  Points: ${totalPoints}`
  );
  console.log(
    `Statement: 3,381 (matches ${totalPoints === 3381 ? "✓" : "✗ MISMATCH"})`
  );
}

main();
