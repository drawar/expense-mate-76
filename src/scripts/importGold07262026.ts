/**
 * Import Amex Gold Rewards (CA) statement, Jun 27 – Jul 26, 2026.
 *
 * Card: 512bbe30-d956-4c82-993f-0ce5335858b1 (CAD, last4=1003)
 * User: e215b298-6ea8-44b0-b7b9-8b0b0bbaeb91
 *
 * Skipped: Jul 17 Payment received -$1,553.64.
 *
 * Transactions (7 rows to insert):
 *   - 5 real card transactions (1 refund + 4 charges, incl. +$10 Instacart offer reversal)
 *   - 2 standalone bonus-point rows (Chexy Offer 250, unlabelled Bonus 5000) as amount=0
 *
 * Rewards (Gold Rewards CA): 2× on grocery/gas/drugstore/travel, 1× otherwise.
 *   Rounding = round half away from zero per-tx (matches statement).
 *   Points formula: total = pointRound(amount × rate); split base = pointRound(amount), bonus = total − base.
 *
 * Special items:
 *   +$10 INSTACART "Offre Instacart" (Jun 27): interpreted as Amex Offer reversal
 *     tied to the Jun 25 IC*Costco charge that was refunded on Jun 27. Tagged amex-offer.
 *     Statement shows +20 pts earned for this — we honor that.
 *   Chexy Offer 250 pts: standalone row linked to Chexy (Trong Dong Nguyen), tag amex-offer.
 *   Bonus Points 5,000 pts: standalone row linked to American Express, source uncertain.
 *
 * Run with: npx tsx src/scripts/importGold07262026.ts
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
const GOLD_PM = "512bbe30-d956-4c82-993f-0ce5335858b1";

const M = {
  costco: "20763341-2fc9-43fc-a1bb-4866bcee1a0c",
  instacart: "0e8d7ee3-f9da-4cd3-ab39-4e7f4ffe53ea",
  chexyTn: "f29b5a7b-1c26-4574-bda2-fadbc7dd7d35",
  amex: "139b8bfe-b14f-4e9e-ae7c-5787be863494",
  rexall7163: null as string | null,
};

async function ensureRexall7163() {
  const name = "Rexall Pharmacy #7163 (Station Square)";
  const { data: existing } = await supabase
    .from("merchants")
    .select("id")
    .ilike("name", name)
    .limit(1);
  if (existing && existing.length > 0) {
    M.rexall7163 = existing[0].id;
    console.log(`Reusing merchant: ${name} → ${existing[0].id}`);
    return;
  }
  const newId = crypto.randomUUID();
  const { error } = await supabase.from("merchants").insert({
    id: newId,
    name,
    address: "140-6200 McKay Ave, Burnaby, BC V5H 4L7",
    display_location: "Station Square, Burnaby",
    mcc: { code: "5912", description: "Drug Stores and Pharmacies" },
    is_online: false,
    coordinates: { lat: 49.2265738, lng: -123.0036755 },
    google_maps_url:
      "https://www.google.com/maps/search/?api=1&query=Rexall+Pharmacy%2C+140-6200+McKay+Ave%2C+Burnaby%2C+BC",
  });
  if (error) throw error;
  M.rexall7163 = newId;
  console.log(`Created merchant: ${name} → ${newId}`);
}

function pointRound(x: number): number {
  return x >= 0 ? Math.floor(x + 0.5) : -Math.floor(-x + 0.5);
}

type RuleType = "2x" | "1x" | "bonus";

interface Tx {
  date: string;
  merchantKey: keyof typeof M;
  amount: number; // 0 for standalone bonus rows
  mccCode: string | null;
  rule: RuleType;
  totalPoints?: number; // for standalone bonus rows
  tags?: string;
  notes: string;
}

const transactions: Tx[] = [
  // Real card transactions
  {
    date: "2026-06-27",
    merchantKey: "costco",
    amount: -43.13,
    mccCode: "5411",
    rule: "2x",
    notes: "IC* Costco by Instacart Halifax Mid-Har — REFUND of Jun 25 charge",
  },
  {
    date: "2026-06-27",
    merchantKey: "instacart",
    amount: 10.0,
    mccCode: "5411",
    rule: "2x",
    tags: "amex-offer",
    notes:
      "INSTACART Offre Instacart — Amex Offer reversal tied to Jun 25 IC*Costco refund",
  },
  {
    date: "2026-07-01",
    merchantKey: "rexall7163",
    amount: 40.92,
    mccCode: "5912",
    rule: "2x",
    notes: "Rexall Pharmacy #7163 Burnaby (Station Square)",
  },
  {
    date: "2026-07-02",
    merchantKey: "chexyTn",
    amount: 1221.0,
    mccCode: "6513",
    rule: "1x",
    notes: "Chexy*Trong Dong Nguyen Burnaby (rent payment)",
  },
  {
    date: "2026-07-03",
    merchantKey: "rexall7163",
    amount: 35.14,
    mccCode: "5912",
    rule: "2x",
    notes: "Rexall Pharmacy #7163 Burnaby (Station Square)",
  },
  // Standalone bonus point rows (amount = 0)
  {
    date: "2026-07-26",
    merchantKey: "chexyTn",
    amount: 0,
    mccCode: null,
    rule: "bonus",
    totalPoints: 250,
    tags: "amex-offer",
    notes: "Chexy Offer bonus points (Amex Offer, 250 MR pts)",
  },
  {
    date: "2026-07-26",
    merchantKey: "amex",
    amount: 0,
    mccCode: null,
    rule: "bonus",
    totalPoints: 5000,
    notes:
      "Amex Gold Rewards bonus points — 5,000 MR pts credited (source not specified on statement)",
  },
];

function pointsFor(t: Tx): { total: number; base: number; bonus: number } {
  if (t.rule === "bonus") {
    const total = t.totalPoints ?? 0;
    return { total, base: total, bonus: 0 };
  }
  const mult = t.rule === "2x" ? 2 : 1;
  const total = pointRound(t.amount * mult);
  const base = pointRound(t.amount);
  const bonus = total - base;
  return { total, base, bonus };
}

async function main() {
  console.log(
    `Importing ${transactions.length} Gold Rewards transactions...\n`
  );
  console.log("Step 1: ensure Rexall #7163 merchant");
  await ensureRexall7163();

  console.log("\nStep 2: insert transactions");
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
    totalDollars += t.amount;

    const { error } = await supabase.from("transactions").insert({
      id: crypto.randomUUID(),
      user_id: USER_ID,
      date: t.date,
      merchant_id: merchantId,
      amount: t.amount,
      currency: "CAD",
      payment_method_id: GOLD_PM,
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
      console.error(`✗ ${t.date} ${t.merchantKey}:`, error.message);
      continue;
    }
    const amtStr =
      t.amount === 0
        ? "  (bonus)  "
        : t.amount < 0
          ? `-$${Math.abs(t.amount).toFixed(2)}`
          : `$${t.amount.toFixed(2)}`;
    console.log(
      `✓ ${t.date} ${t.merchantKey.padEnd(11)} ${amtStr.padStart(11)} mcc=${t.mccCode ?? "  -"} ${t.rule.padEnd(5)} → ${pts.total} pts (base ${pts.base} + bonus ${pts.bonus})`
    );
    successCount++;
  }

  console.log(`\nDone! ${successCount}/${transactions.length} imported.`);
  console.log(
    `Real charges + refund: $${totalDollars.toFixed(2)}  Points: ${totalPoints}`
  );
  console.log(`Statement: Points earned 1,307 + Bonus 5,250 = 6,557 total`);
  console.log(
    `Verify: 1,307 (regular) + 250 (Chexy offer) + 5,000 (bonus) = ${totalPoints === 6557 ? "6,557 ✓" : `${totalPoints} ✗ MISMATCH`}`
  );
}

main();
