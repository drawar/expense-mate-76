/**
 * Import Amex Aeroplan Reserve (CA) statement, Jul 02 – Aug 01, 2026.
 *
 * Card: d7c8b577-ce6a-4355-9402-c3a1ae432d53 (CAD, last4=1003)
 * User: e215b298-6ea8-44b0-b7b9-8b0b0bbaeb91
 *
 * 15 purchases + 4 Amex Offer credits + 1 membership fee = 20 transactions.
 * Skipped: Jul 22 Payment (-$6,354.34), Jul 24 Debit Balance Transferred ($643.01).
 *
 * Rewards (verified against statement per-tx points):
 *   - 3x Air Canada: total = round(amount × 3), split base = round(amount) / bonus = total − base
 *   - 1.25x everything else: base = round(amount × 1.25), bonus = 0
 *   - Statement credits (tagged amex-offer): 0 points
 *   - Membership fee: 0 points
 * Rounding = round half AWAY FROM ZERO (matches statement's negative values, e.g., -$3373.20 → -4217 pts).
 *
 * Merchants:
 *   Enriched: Expedia (add MCC 4722)
 *   Reused: Instacart, Amazon Prime CA, Audible, Amazon, Air Canada, American Express
 *   New: Best Buy Marketplace, Hotels.ca, Zara Robson St, Abercrombie Pacific Centre, Lululemon (CA)
 *
 * Run with: npx tsx src/scripts/importAeroplan08012026.ts
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
const AEROPLAN_PM = "d7c8b577-ce6a-4355-9402-c3a1ae432d53";

const M = {
  instacart: "0e8d7ee3-f9da-4cd3-ab39-4e7f4ffe53ea",
  amazonPrime: "d54d4a19-9fd9-408b-9c50-5b49e3dcfb05",
  audible: "03a62a66-6c98-4eb9-8b64-0281be93126b",
  expedia: "2a9fd827-73ee-49e2-b964-e6a8fc4cc040",
  amazon: "2e68cd8d-3938-481f-8751-3bad60379a93",
  airCanada: "e2507365-29ca-4b36-ae31-dbd98d5382fd",
  amex: "139b8bfe-b14f-4e9e-ae7c-5787be863494",
  bestBuyMarket: null as string | null,
  hotelsCa: null as string | null,
  zaraRobson: null as string | null,
  abercrombie: null as string | null,
  lululemonCa: null as string | null,
};

interface NewMerchant {
  key:
    | "bestBuyMarket"
    | "hotelsCa"
    | "zaraRobson"
    | "abercrombie"
    | "lululemonCa";
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
    key: "bestBuyMarket",
    name: "Best Buy Marketplace",
    address: null,
    displayLocation: null,
    mcc: { code: "5732", description: "Consumer Electronics Stores" },
    isOnline: true,
    coordinates: null,
    googleMapsUrl: null,
  },
  {
    key: "hotelsCa",
    name: "Hotels.ca",
    address: null,
    displayLocation: null,
    mcc: { code: "4722", description: "Travel Agencies & Tour Operators" },
    isOnline: true,
    coordinates: null,
    googleMapsUrl: null,
  },
  {
    key: "zaraRobson",
    name: "Zara Robson St",
    address: "1056 Robson St, Vancouver, BC V6E 1A7",
    displayLocation: "Robson, Vancouver",
    mcc: { code: "5651", description: "Family Clothing Stores" },
    isOnline: false,
    coordinates: { lat: 49.2839926, lng: -123.124212 },
    googleMapsUrl:
      "https://www.google.com/maps/search/?api=1&query=Zara%2C+1056+Robson+St%2C+Vancouver%2C+BC",
  },
  {
    key: "abercrombie",
    name: "Abercrombie & Fitch (Pacific Centre)",
    address: "701 W Georgia St, Vancouver, BC V7Y 1G5",
    displayLocation: "CF Pacific Centre, Vancouver",
    mcc: { code: "5651", description: "Family Clothing Stores" },
    isOnline: false,
    // Mall centroid — Nominatim did not have the specific storefront node
    coordinates: { lat: 49.2822466, lng: -123.119484 },
    googleMapsUrl:
      "https://www.google.com/maps/search/?api=1&query=Abercrombie+%26+Fitch%2C+CF+Pacific+Centre%2C+Vancouver%2C+BC",
  },
  {
    key: "lululemonCa",
    name: "Lululemon Canada",
    address: null,
    displayLocation: null,
    mcc: { code: "5651", description: "Family Clothing Stores" },
    isOnline: true,
    coordinates: null,
    googleMapsUrl: null,
  },
];

// Round half away from zero (matches Amex statement's per-tx points, incl. negatives).
function pointRound(x: number): number {
  return x >= 0 ? Math.floor(x + 0.5) : -Math.floor(-x + 0.5);
}

interface Tx {
  date: string;
  merchantKey: keyof typeof M;
  amount: number;
  mccCode: string;
  ruleType: "3x-ac" | "1.25x" | "offer" | "fee";
  tags?: string;
  notes: string;
}

const transactions: Tx[] = [
  // Purchases
  {
    date: "2026-07-05",
    merchantKey: "instacart",
    amount: 37.06,
    mccCode: "5411",
    ruleType: "1.25x",
    notes: "IC* Costco by Instacart Halifax Mid-Har",
  },
  {
    date: "2026-07-07",
    merchantKey: "bestBuyMarket",
    amount: 732.48,
    mccCode: "5732",
    ruleType: "1.25x",
    notes: "BBYMarketplace*16050557 Brampton (Best Buy Marketplace)",
  },
  {
    date: "2026-07-08",
    merchantKey: "instacart",
    amount: 50.55,
    mccCode: "5411",
    ruleType: "1.25x",
    notes: "IC* Costco by Instacart Halifax Mid-Har",
  },
  {
    date: "2026-07-09",
    merchantKey: "amazonPrime",
    amount: 11.19,
    mccCode: "5968",
    ruleType: "1.25x",
    notes: "Amazon.ca Prime Member (monthly)",
  },
  {
    date: "2026-07-11",
    merchantKey: "audible",
    amount: 16.74,
    mccCode: "5968",
    ruleType: "1.25x",
    notes: "Audible, Inc *4T0ZB7ND3",
  },
  {
    date: "2026-07-12",
    merchantKey: "hotelsCa",
    amount: 1785.76,
    mccCode: "4722",
    ruleType: "1.25x",
    notes: "Hotels.ca (HOTELSCAAO)",
  },
  {
    date: "2026-07-12",
    merchantKey: "zaraRobson",
    amount: 33.49,
    mccCode: "5651",
    ruleType: "1.25x",
    notes: "Zara Robson St #3083 Vancouver",
  },
  {
    date: "2026-07-12",
    merchantKey: "expedia",
    amount: -3373.2,
    mccCode: "4722",
    ruleType: "1.25x",
    notes: "Expedia 73482492367603 Expedia.ca — REFUND",
  },
  {
    date: "2026-07-19",
    merchantKey: "zaraRobson",
    amount: 33.49,
    mccCode: "5651",
    ruleType: "1.25x",
    notes: "Zara Robson St #3083 Vancouver",
  },
  {
    date: "2026-07-19",
    merchantKey: "abercrombie",
    amount: 32.48,
    mccCode: "5651",
    ruleType: "1.25x",
    notes: "Abercrombie & Fitch Vancouver (Pacific Centre)",
  },
  {
    date: "2026-07-20",
    merchantKey: "lululemonCa",
    amount: 163.52,
    mccCode: "5651",
    ruleType: "1.25x",
    notes: "Lululemon CA B TO C Vancouver (ecommerce)",
  },
  {
    date: "2026-07-20",
    merchantKey: "amazon",
    amount: 13.43,
    mccCode: "5331",
    ruleType: "1.25x",
    notes: "Amazon.com.ca Inc Amazon.ca",
  },
  {
    date: "2026-07-25",
    merchantKey: "airCanada",
    amount: 693.98,
    mccCode: "3009",
    ruleType: "3x-ac",
    notes:
      "Air Canada — ticket 0142332528477, YVR→SFO (H) / return YVR (W), pax LE/HOANG VAN",
  },
  {
    date: "2026-07-28",
    merchantKey: "lululemonCa",
    amount: -87.36,
    mccCode: "5651",
    ruleType: "1.25x",
    notes: "Robson St Vancouver — Lululemon refund",
  },
  {
    date: "2026-07-31",
    merchantKey: "airCanada",
    amount: 57.2,
    mccCode: "3009",
    ruleType: "3x-ac",
    notes: "Air Canada — ticket 0142333300237, KIX→YVR (I), pax LE/HOANG VAN",
  },

  // Amex Offer statement credits (tag: amex-offer, 0 points)
  {
    date: "2026-07-05",
    merchantKey: "instacart",
    amount: -10.0,
    mccCode: "5411",
    ruleType: "offer",
    tags: "amex-offer",
    notes: "Amex Offer credit — Instacart",
  },
  {
    date: "2026-07-09",
    merchantKey: "instacart",
    amount: -10.0,
    mccCode: "5411",
    ruleType: "offer",
    tags: "amex-offer",
    notes: "Amex Offer credit — Instacart",
  },
  {
    date: "2026-07-12",
    merchantKey: "expedia",
    amount: -140.0,
    mccCode: "4722",
    ruleType: "offer",
    tags: "amex-offer",
    notes: "Amex Offer credit — Expedia (OffreHotels)",
  },
  {
    date: "2026-07-20",
    merchantKey: "lululemonCa",
    amount: -20.0,
    mccCode: "5651",
    ruleType: "offer",
    tags: "amex-offer",
    notes: "Amex Offer credit — Lululemon",
  },

  // Annual fee
  {
    date: "2026-08-01",
    merchantKey: "amex",
    amount: 599.0,
    mccCode: "6012",
    ruleType: "fee",
    notes: "Aeroplan Reserve annual membership fee",
  },
];

function pointsFor(t: Tx): { total: number; base: number; bonus: number } {
  if (t.ruleType === "offer" || t.ruleType === "fee") {
    return { total: 0, base: 0, bonus: 0 };
  }
  if (t.ruleType === "3x-ac") {
    const total = pointRound(t.amount * 3);
    const base = pointRound(t.amount);
    const bonus = total - base;
    return { total, base, bonus };
  }
  // 1.25x
  const base = pointRound(t.amount * 1.25);
  return { total: base, base, bonus: 0 };
}

async function enrichExisting() {
  const { error } = await supabase
    .from("merchants")
    .update({
      mcc: { code: "4722", description: "Travel Agencies & Tour Operators" },
    })
    .eq("id", M.expedia);
  if (error) throw error;
  console.log(`Enriched Expedia (${M.expedia}) with MCC 4722`);
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

async function ensureTag() {
  const { data: existing } = await supabase
    .from("tags")
    .select("id, slug")
    .eq("user_id", USER_ID)
    .eq("slug", "amex-offer")
    .limit(1);
  if (existing && existing.length > 0) {
    console.log(`Reusing tag: amex-offer → ${existing[0].id}`);
    return;
  }
  const { error } = await supabase.from("tags").insert({
    id: crypto.randomUUID(),
    slug: "amex-offer",
    display_name: "Amex Offer",
    user_id: USER_ID,
  });
  if (error) throw error;
  console.log(`Created tag: amex-offer`);
}

async function main() {
  console.log(
    `Importing ${transactions.length} Aeroplan Reserve transactions...\n`
  );

  console.log("Step 1: enrich existing merchants (Expedia)");
  await enrichExisting();

  console.log("\nStep 2: ensure new merchants exist");
  await ensureMerchants();

  console.log("\nStep 3: ensure amex-offer tag exists");
  await ensureTag();

  console.log("\nStep 4: insert transactions");
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

    const pts = pointsFor(t);
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
      payment_method_id: AEROPLAN_PM,
      payment_amount: t.amount,
      payment_currency: "CAD",
      total_points: pts.total,
      base_points: pts.base,
      bonus_points: pts.bonus,
      mcc_code: t.mccCode,
      is_contactless: false,
      tags: t.tags ?? null,
      notes: t.notes,
    });

    if (error) {
      console.error(
        `✗ ${t.date} ${t.merchantKey} $${t.amount}:`,
        error.message
      );
    } else {
      const amt = t.amount.toFixed(2);
      const amtStr =
        t.amount < 0 ? `-$${Math.abs(t.amount).toFixed(2)}` : `$${amt}`;
      console.log(
        `✓ ${t.date} ${t.merchantKey.padEnd(14)} ${amtStr.padStart(11)} mcc=${t.mccCode} ${t.ruleType.padEnd(6)} → base ${pts.base} + bonus ${pts.bonus} = ${pts.total}`
      );
      successCount++;
    }
  }

  console.log(`\nDone! ${successCount}/${transactions.length} imported.`);
  console.log(
    `Total: $${totalDollars.toFixed(2)}  Points: base ${totalBase} + bonus ${totalBonus} = ${totalBase + totalBonus}`
  );
  console.log(
    `Statement: Points earned this month = 1566 (-688 Other + 2254 Air Canada)`
  );
}

main();
