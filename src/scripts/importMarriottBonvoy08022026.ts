/**
 * Import Amex Marriott Bonvoy (CA) statement, Jul 03 – Aug 02, 2026.
 *
 * Card: 1313a61d-cbdd-4af7-a413-b2dced1a35f6 (CAD, last4=1005)
 * User: e215b298-6ea8-44b0-b7b9-8b0b0bbaeb91
 *
 * 2 purchases totaling $478.50. Statement: 957 Marriott Bonvoy points.
 *
 * Rewards:
 *   - 5x on hotels (MCC 3501-3999, 7011): (n/a this statement)
 *   - 2x everything else: total = floor(amount × 2), base = floor(amount), bonus = total − base
 *
 * Skipped: 3 payments (incl. -$643.01 CREDIT BALANCE TRANSFERRED, mirror of the
 * Aeroplan Reserve card's DEBIT BALANCE TRANSFERRED last statement).
 *
 * Merchants:
 *   Enriched: Equinox (add West Georgia Vancouver address/coords)
 *   New: Ticketpro.ca (online)
 *
 * Run with: npx tsx src/scripts/importMarriottBonvoy08022026.ts
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
const MARRIOTT_PM = "1313a61d-cbdd-4af7-a413-b2dced1a35f6";

const M = {
  equinox: "96699e98-acf4-4dd1-b043-3ad2e856b0a4",
  ticketpro: null as string | null,
};

async function enrichEquinox() {
  const { error } = await supabase
    .from("merchants")
    .update({
      address: "1131 W Georgia St, Vancouver, BC V6E 4T9",
      display_location: "Coal Harbour, Vancouver",
      coordinates: { lat: 49.2862881, lng: -123.123574 },
      google_maps_url:
        "https://www.google.com/maps/search/?api=1&query=Equinox%2C+1131+W+Georgia+St%2C+Vancouver%2C+BC",
    })
    .eq("id", M.equinox);
  if (error) throw error;
  console.log(
    `Enriched Equinox (${M.equinox}) with West Georgia Vancouver address`
  );
}

async function ensureTicketpro() {
  const { data: existing } = await supabase
    .from("merchants")
    .select("id, name")
    .ilike("name", "Ticketpro%")
    .limit(1);
  if (existing && existing.length > 0) {
    M.ticketpro = existing[0].id;
    console.log(`Reusing merchant: Ticketpro.ca → ${existing[0].id}`);
    return;
  }
  const newId = crypto.randomUUID();
  const { error } = await supabase.from("merchants").insert({
    id: newId,
    name: "Ticketpro.ca",
    address: null,
    display_location: null,
    mcc: {
      code: "7922",
      description: "Theatrical Producers & Ticket Agencies",
    },
    is_online: true,
    coordinates: null,
    google_maps_url: null,
  });
  if (error) throw error;
  M.ticketpro = newId;
  console.log(`Created merchant: Ticketpro.ca → ${newId}`);
}

interface Tx {
  date: string;
  merchantKey: keyof typeof M;
  amount: number;
  mccCode: string;
  notes: string;
}

const transactions: Tx[] = [
  {
    date: "2026-07-23",
    merchantKey: "equinox",
    amount: 304.5,
    mccCode: "7997",
    notes: "Equinox #860 Vancouver (West Georgia)",
  },
  {
    date: "2026-07-31",
    merchantKey: "ticketpro",
    amount: 174.0,
    mccCode: "7922",
    notes: "Ticketpro.ca Montreal (ticketing)",
  },
];

function pointsFor2x(amount: number): {
  total: number;
  base: number;
  bonus: number;
} {
  const total = Math.floor(amount * 2);
  const base = Math.floor(amount);
  const bonus = total - base;
  return { total, base, bonus };
}

async function main() {
  console.log(
    `Importing ${transactions.length} Marriott Bonvoy transactions...\n`
  );

  console.log("Step 1: enrich Equinox merchant");
  await enrichEquinox();

  console.log("\nStep 2: ensure Ticketpro merchant");
  await ensureTicketpro();

  console.log("\nStep 3: insert transactions");
  let successCount = 0;
  let totalPoints = 0;
  let totalDollars = 0;
  for (const t of transactions) {
    const merchantId = M[t.merchantKey];
    if (!merchantId) {
      console.error(`✗ merchantKey ${t.merchantKey} not resolved`);
      continue;
    }
    const pts = pointsFor2x(t.amount);
    totalPoints += pts.total;
    totalDollars += t.amount;

    const { error } = await supabase.from("transactions").insert({
      id: crypto.randomUUID(),
      user_id: USER_ID,
      date: t.date,
      merchant_id: merchantId,
      amount: t.amount,
      currency: "CAD",
      payment_method_id: MARRIOTT_PM,
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
      console.error(`✗ ${t.date} ${t.merchantKey}:`, error.message);
    } else {
      console.log(
        `✓ ${t.date} ${t.merchantKey.padEnd(10)} $${t.amount.toFixed(2).padStart(7)} mcc=${t.mccCode} 2x → base ${pts.base} + bonus ${pts.bonus} = ${pts.total}`
      );
      successCount++;
    }
  }

  console.log(`\nDone! ${successCount}/${transactions.length} imported.`);
  console.log(`Total: $${totalDollars.toFixed(2)}  Points: ${totalPoints}`);
  console.log(
    `Statement: 957 (matches ${totalPoints === 957 ? "✓" : "✗ MISMATCH"})`
  );
}

main();
