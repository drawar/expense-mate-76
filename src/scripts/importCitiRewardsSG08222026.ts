/**
 * Import Citi Rewards World Mastercard (SG) statement, closing 2026-08-22.
 *
 * Card: 605c94ab-1792-48c1-91ad-d1a67663d29a (SGD, last4=7048)
 * User: e215b298-6ea8-44b0-b7b9-8b0b0bbaeb91
 *
 * 21 AMAZE* transactions. AMAZE converts all charges to look like SG online
 * purchases (which is why Citi grants 10x TYP on non-travel). Per user directive:
 *   - Merchant names have AMAZE* prefix stripped
 *   - All merchants marked is_online=true
 *   - Original amounts and currencies provided by user (Amaze masks as SGD)
 *   - All transactions tagged "amaze"
 *
 * Points (verified against statement 921 base + 8289 bonus = 9210 total):
 *   base = floor(payment_amount_SGD)
 *   bonus = base × 9 (10x TYP total)
 *
 * The AMAZE FEE 0.50 SGD is tied to Adobe (Amaze charges fee on same-currency txs).
 *
 * Run with: npx tsx src/scripts/importCitiRewardsSG08222026.ts
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
const CITI_PM = "605c94ab-1792-48c1-91ad-d1a67663d29a";

const M = {
  // Existing to reuse
  airalo: "70674f85-9687-4e73-9c32-b2532609766f",
  grab: "acaa9f16-8365-4008-9968-855ae18bbeff",
  uber: "2e30aa7b-2105-4364-8e44-f6db882be6a1",
  // New
  hyroxSg: null as string | null,
  adobe: null as string | null,
  amazeFee: null as string | null,
  yuyu: null as string | null,
  taiwanFamilyMart: null as string | null,
  dinTaiFungT101: null as string | null,
  wankeShabu: null as string | null,
  vvgVillage: null as string | null,
  chichaSanchen: null as string | null,
  shingenShabu: null as string | null,
  pacificSogo: null as string | null,
};

const gmaps = (q: string) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;

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

const NEW_MERCHANTS: NewMerchant[] = [
  {
    key: "hyroxSg",
    name: "Hyrox Singapore",
    address: "Singapore National Stadium, 1 Stadium Dr, Singapore 397629",
    displayLocation: "Kallang, Singapore",
    mcc: { code: "7941", description: "Commercial Sports, Athletic Fields" },
    isOnline: true,
    coordinates: { lat: 1.304491, lng: 103.8743437 },
    googleMapsUrl: gmaps("Singapore National Stadium, 1 Stadium Drive"),
  },
  {
    key: "adobe",
    name: "Adobe",
    address: null,
    displayLocation: null,
    mcc: { code: "5817", description: "Digital Goods – Applications" },
    isOnline: true,
    coordinates: null,
    googleMapsUrl: null,
  },
  {
    key: "amazeFee",
    name: "Amaze (Instarem)",
    address: null,
    displayLocation: null,
    mcc: {
      code: "6012",
      description: "Financial Institutions - Merchandise & Services",
    },
    isOnline: true,
    coordinates: null,
    googleMapsUrl: null,
  },
  {
    key: "yuyu",
    name: "YùYù Perfumer",
    address: null,
    displayLocation: "Zhongshan, Taipei",
    mcc: { code: "5977", description: "Cosmetic Stores" },
    isOnline: true,
    coordinates: null,
    googleMapsUrl: null,
  },
  {
    key: "taiwanFamilyMart",
    name: "FamilyMart Taiwan (Zhongshan)",
    address: null,
    displayLocation: "Zhongshan, Taipei",
    mcc: { code: "5411", description: "Grocery Stores & Supermarkets" },
    isOnline: true,
    coordinates: null,
    googleMapsUrl: null,
  },
  {
    key: "dinTaiFungT101",
    name: "Din Tai Fung (Taipei 101)",
    address:
      "No. 45 Shifu Rd, B1, Taipei 101, Xinyi District, Taipei 110, Taiwan",
    displayLocation: "Taipei 101, Xinyi, Taipei",
    mcc: { code: "5812", description: "Eating Places, Restaurants" },
    isOnline: true,
    coordinates: { lat: 25.0338352, lng: 121.5644995 },
    googleMapsUrl: gmaps(
      "Din Tai Fung, Taipei 101, B1, 45 Shifu Rd, Xinyi, Taipei"
    ),
  },
  {
    key: "wankeShabu",
    name: "Wanke Shabu (Taichung Guo'an)",
    address:
      "B1-5, No. 168 Guo'an 1st Rd, Xitun District, Taichung 407, Taiwan",
    displayLocation: "Xitun, Taichung",
    mcc: { code: "5812", description: "Eating Places, Restaurants" },
    isOnline: true,
    coordinates: { lat: 24.19061, lng: 120.61472 },
    googleMapsUrl: gmaps("Wanke Hot Pot Guoan, Xitun, Taichung"),
  },
  {
    key: "vvgVillage",
    name: "VVG Village (National Taichung Theater)",
    address: "No. 101 Sec 2 Huilai Rd, Xitun District, Taichung 407, Taiwan",
    displayLocation: "National Taichung Theater, Xitun, Taichung",
    mcc: { code: "5947", description: "Gift, Card, Novelty & Souvenir Shops" },
    isOnline: true,
    coordinates: { lat: 24.1629259, lng: 120.6405172 },
    googleMapsUrl: gmaps("VVG Village, National Taichung Theater"),
  },
  {
    key: "chichaSanchen",
    name: "CHICHA San Chen (Taichung Flagship)",
    address: "No. 607 Daying St, Nantun District, Taichung 408, Taiwan",
    displayLocation: "Nantun, Taichung",
    mcc: { code: "5814", description: "Fast Food Restaurants" },
    isOnline: true,
    coordinates: { lat: 24.1545113, lng: 120.6485055 },
    googleMapsUrl: gmaps(
      "CHICHA San Chen Flagship, 607 Daying St, Nantun, Taichung"
    ),
  },
  {
    key: "shingenShabu",
    name: "Shingen Shabu (Da'an)",
    address: null,
    displayLocation: "Da'an, Taipei",
    mcc: { code: "5812", description: "Eating Places, Restaurants" },
    isOnline: true,
    coordinates: null,
    googleMapsUrl: null,
  },
  {
    key: "pacificSogo",
    name: "Pacific SOGO Zhongxiao",
    address: "No. 45 Sec 4 Zhongxiao E Rd, Da'an District, Taipei 106, Taiwan",
    displayLocation: "Da'an, Taipei",
    mcc: { code: "5311", description: "Department Stores" },
    isOnline: true,
    coordinates: { lat: 25.0410121, lng: 121.5431409 },
    googleMapsUrl: gmaps(
      "SOGO Zhongxiao, 45 Sec 4 Zhongxiao E Rd, Da'an, Taipei"
    ),
  },
];

async function enrichGrab() {
  const { error } = await supabase
    .from("merchants")
    .update({
      mcc: { code: "4121", description: "Taxi & Limousines" },
      is_online: true,
    })
    .eq("id", M.grab);
  if (error) throw error;
  console.log(`Enriched Grab (${M.grab}) with MCC 4121, is_online=true`);
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

async function ensureAmazeTag() {
  const { data: existing } = await supabase
    .from("tags")
    .select("id")
    .eq("user_id", USER_ID)
    .eq("slug", "amaze")
    .limit(1);
  if (existing && existing.length > 0) {
    console.log(`Reusing tag: amaze → ${existing[0].id}`);
    return;
  }
  const { error } = await supabase.from("tags").insert({
    id: crypto.randomUUID(),
    slug: "amaze",
    display_name: "Amaze",
    user_id: USER_ID,
  });
  if (error) throw error;
  console.log(`Created tag: amaze`);
}

interface Tx {
  date: string;
  merchantKey: keyof typeof M;
  amount: number;
  currency: string;
  paymentAmount: number; // SGD
  mccCode: string;
  notes: string;
}

const transactions: Tx[] = [
  {
    date: "2026-07-24",
    merchantKey: "hyroxSg",
    amount: 391.39,
    currency: "CAD",
    paymentAmount: 367.85,
    mccCode: "7941",
    notes: "Hyrox Singapore event registration — CAD 391.39 via AMAZE",
  },
  {
    date: "2026-08-06",
    merchantKey: "airalo",
    amount: 4.0,
    currency: "USD",
    paymentAmount: 5.24,
    mccCode: "4814",
    notes: "Airalo eSIM — USD 4.00 via AMAZE",
  },
  {
    date: "2026-08-06",
    merchantKey: "airalo",
    amount: 11.5,
    currency: "USD",
    paymentAmount: 15.07,
    mccCode: "4814",
    notes: "Airalo eSIM — USD 11.50 via AMAZE",
  },
  {
    date: "2026-08-06",
    merchantKey: "grab",
    amount: 126880,
    currency: "VND",
    paymentAmount: 6.33,
    mccCode: "4121",
    notes: "Grab A-9M5AC — VND 126,880 via AMAZE (Vietnam)",
  },
  {
    date: "2026-08-09",
    merchantKey: "grab",
    amount: 9360,
    currency: "VND",
    paymentAmount: 0.47,
    mccCode: "4121",
    notes: "Grab A-9M5AC (adjustment) — VND 9,360 via AMAZE",
  },
  {
    date: "2026-08-09",
    merchantKey: "grab",
    amount: 88400,
    currency: "VND",
    paymentAmount: 4.43,
    mccCode: "4121",
    notes: "Grab A-9MH49 — VND 88,400 via AMAZE (Vietnam)",
  },
  {
    date: "2026-08-09",
    merchantKey: "grab",
    amount: 9360,
    currency: "VND",
    paymentAmount: 0.47,
    mccCode: "4121",
    notes: "Grab A-9MH49 (adjustment) — VND 9,360 via AMAZE",
  },
  {
    date: "2026-08-12",
    merchantKey: "airalo",
    amount: 19.0,
    currency: "USD",
    paymentAmount: 24.87,
    mccCode: "4814",
    notes: "Airalo eSIM — USD 19.00 via AMAZE",
  },
  {
    date: "2026-08-12",
    merchantKey: "adobe",
    amount: 16.07,
    currency: "SGD",
    paymentAmount: 16.07,
    mccCode: "5817",
    notes: "Adobe subscription — SGD native via AMAZE",
  },
  {
    date: "2026-08-12",
    merchantKey: "amazeFee",
    amount: 0.5,
    currency: "SGD",
    paymentAmount: 0.5,
    mccCode: "6012",
    notes:
      "AMAZE fee (SGD-currency transaction fee tied to same-day Adobe SGD charge)",
  },
  {
    date: "2026-08-13",
    merchantKey: "yuyu",
    amount: 2200,
    currency: "TWD",
    paymentAmount: 89.39,
    mccCode: "5977",
    notes: "YùYù Perfumer Zhongshan Taipei — TWD 2,200 via AMAZE",
  },
  {
    date: "2026-08-13",
    merchantKey: "taiwanFamilyMart",
    amount: 499,
    currency: "TWD",
    paymentAmount: 20.28,
    mccCode: "5411",
    notes: "FamilyMart Taiwan (Zhongshan Taipei) — TWD 499 via AMAZE",
  },
  {
    date: "2026-08-13",
    merchantKey: "dinTaiFungT101",
    amount: 2260,
    currency: "TWD",
    paymentAmount: 91.83,
    mccCode: "5812",
    notes: "Din Tai Fung (Taipei 101 B1) — TWD 2,260 via AMAZE",
  },
  {
    date: "2026-08-14",
    merchantKey: "uber",
    amount: 264,
    currency: "TWD",
    paymentAmount: 10.77,
    mccCode: "4121",
    notes: "Uber Formosa (Taiwan rideshare) — TWD 264 via AMAZE",
  },
  {
    date: "2026-08-14",
    merchantKey: "uber",
    amount: 266,
    currency: "TWD",
    paymentAmount: 10.85,
    mccCode: "4121",
    notes: "Uber Formosa (Taiwan rideshare) — TWD 266 via AMAZE",
  },
  {
    date: "2026-08-15",
    merchantKey: "wankeShabu",
    amount: 1139,
    currency: "TWD",
    paymentAmount: 46.64,
    mccCode: "5812",
    notes: "Wanke Shabu (Taichung Guo'an) — TWD 1,139 via AMAZE",
  },
  {
    date: "2026-08-15",
    merchantKey: "vvgVillage",
    amount: 358,
    currency: "TWD",
    paymentAmount: 14.66,
    mccCode: "5947",
    notes:
      "VVG Village giftshop (National Taichung Theater) — TWD 358 via AMAZE",
  },
  {
    date: "2026-08-15",
    merchantKey: "uber",
    amount: 209,
    currency: "TWD",
    paymentAmount: 8.56,
    mccCode: "4121",
    notes: "Uber Formosa (Taiwan rideshare) — TWD 209 via AMAZE",
  },
  {
    date: "2026-08-16",
    merchantKey: "chichaSanchen",
    amount: 1670,
    currency: "TWD",
    paymentAmount: 68.39,
    mccCode: "5814",
    notes: "CHICHA San Chen (Taichung Flagship, Nantun) — TWD 1,670 via AMAZE",
  },
  {
    date: "2026-08-16",
    merchantKey: "shingenShabu",
    amount: 1271,
    currency: "TWD",
    paymentAmount: 52.04,
    mccCode: "5812",
    notes: "Shingen Shabu (Da'an Taipei) — TWD 1,271 via AMAZE",
  },
  {
    date: "2026-08-16",
    merchantKey: "pacificSogo",
    amount: 1880,
    currency: "TWD",
    paymentAmount: 76.98,
    mccCode: "5311",
    notes: "Pacific SOGO Zhongxiao (Da'an Taipei) — TWD 1,880 via AMAZE",
  },
];

function pointsFor(paymentAmountSgd: number): {
  total: number;
  base: number;
  bonus: number;
} {
  const base = Math.floor(paymentAmountSgd);
  const bonus = base * 9; // 10x TYP total; per-tx: base×9 = bonus (matches statement)
  return { total: base + bonus, base, bonus };
}

async function main() {
  console.log(
    `Importing ${transactions.length} Citi Rewards (SG) transactions...\n`
  );
  console.log("Step 1: enrich Grab merchant");
  await enrichGrab();
  console.log("\nStep 2: ensure new merchants exist");
  await ensureNewMerchants();
  console.log("\nStep 3: ensure amaze tag exists");
  await ensureAmazeTag();

  console.log("\nStep 4: insert transactions");
  let successCount = 0,
    totalBase = 0,
    totalBonus = 0,
    totalSgd = 0;
  for (const t of transactions) {
    const merchantId = (M as Record<string, string | null>)[t.merchantKey];
    if (!merchantId) {
      console.error(`✗ ${t.merchantKey} unresolved`);
      continue;
    }
    const pts = pointsFor(t.paymentAmount);
    totalBase += pts.base;
    totalBonus += pts.bonus;
    totalSgd += t.paymentAmount;

    const { error } = await supabase.from("transactions").insert({
      id: crypto.randomUUID(),
      user_id: USER_ID,
      date: t.date,
      merchant_id: merchantId,
      amount: t.amount,
      currency: t.currency,
      payment_method_id: CITI_PM,
      payment_amount: t.paymentAmount,
      payment_currency: "SGD",
      total_points: pts.total,
      base_points: pts.base,
      bonus_points: pts.bonus,
      mcc_code: t.mccCode,
      is_contactless: false,
      tags: "amaze",
      notes: t.notes,
    });
    if (error) {
      console.error(`✗ ${t.date} ${t.merchantKey}:`, error.message);
      continue;
    }
    console.log(
      `✓ ${t.date} ${t.merchantKey.padEnd(17)} ${t.amount.toString().padStart(9)} ${t.currency} → SGD ${t.paymentAmount.toFixed(2).padStart(7)} mcc=${t.mccCode} → ${pts.total} pts`
    );
    successCount++;
  }
  console.log(`\nDone! ${successCount}/${transactions.length} imported.`);
  console.log(
    `Total (SGD): $${totalSgd.toFixed(2)}  Points: base ${totalBase} + bonus ${totalBonus} = ${totalBase + totalBonus}`
  );
  console.log(
    `Statement: 921 base + 8,289 bonus = 9,210 total ${totalBase === 921 && totalBonus === 8289 ? "✓" : "✗ MISMATCH"}`
  );
}

main();
