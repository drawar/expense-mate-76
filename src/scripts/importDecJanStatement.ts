/**
 * Import Amex Cobalt Dec 4 2025 - Jan 3 2026 statement
 * Run with: npx tsx src/scripts/importDecJanStatement.ts
 * Add --import to actually insert transactions
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { join } from "path";

const envPath = join(process.cwd(), ".env");
const envContent = readFileSync(envPath, "utf-8");
const envVars: Record<string, string> = {};
for (const line of envContent.split("\n")) {
  const match = line.match(/^([^=]+)="?([^"]*)"?$/);
  if (match) {
    envVars[match[1]] = match[2];
  }
}

const supabase = createClient(envVars.VITE_SUPABASE_URL, envVars.SUPABASE_SERVICE_ROLE_KEY);

const USER_ID = "00000000-0000-0000-0000-000000000000";

// Statement transactions from Dec 4 2025 - Jan 3 2026
const statementTransactions = [
  { date: "2025-12-04", merchant: "Green Leaf Sushi", amount: 41.66, currency: "CAD", mcc: "5812", mccDesc: "Restaurant", isOnline: false },
  { date: "2025-12-04", merchant: "Good Thief", amount: 79.14, currency: "CAD", mcc: "5812", mccDesc: "Restaurant", isOnline: false },
  { date: "2025-12-04", merchant: "Lyft", amount: 15.24, currency: "CAD", mcc: "4121", mccDesc: "Ride Share", isOnline: true },
  { date: "2025-12-05", merchant: "Uber Eats", amount: 53.93, currency: "CAD", mcc: "5812", mccDesc: "Food Delivery", isOnline: true }, // UBER HOLDINGS = Uber Eats
  { date: "2025-12-09", merchant: "PriceSmart", amount: 40.72, currency: "CAD", mcc: "5411", mccDesc: "Grocery", isOnline: false },
  { date: "2025-12-11", merchant: "Uber", amount: 34.93, currency: "CAD", mcc: "4121", mccDesc: "Ride Share", isOnline: true },
  { date: "2025-12-11", merchant: "Lyft", amountUsd: 8.52, amount: 12.11, currency: "USD", mcc: "4121", mccDesc: "Ride Share", isOnline: true },
  { date: "2025-12-12", merchant: "Lyft", amountUsd: 2.40, amount: 3.40, currency: "USD", mcc: "4121", mccDesc: "Ride Share", isOnline: true },
  { date: "2025-12-12", merchant: "Lyft", amountUsd: 1.00, amount: 1.41, currency: "USD", mcc: "4121", mccDesc: "Ride Share", isOnline: true },
  { date: "2025-12-13", merchant: "Uber", amount: 39.21, currency: "CAD", mcc: "4121", mccDesc: "Ride Share", isOnline: true },
  { date: "2025-12-13", merchant: "Uber", amountUsd: 45.91, amount: 64.88, currency: "USD", mcc: "4121", mccDesc: "Ride Share", isOnline: true },
  { date: "2025-12-15", merchant: "Uber Eats", amount: 146.92, currency: "CAD", mcc: "5812", mccDesc: "Food Delivery", isOnline: true },
  { date: "2025-12-15", merchant: "PriceSmart", amount: 145.08, currency: "CAD", mcc: "5411", mccDesc: "Grocery", isOnline: false },
  { date: "2025-12-22", merchant: "Bell Mobility", amount: 71.28, currency: "CAD", mcc: "4814", mccDesc: "Telecom", isOnline: true },
  { date: "2025-12-22", merchant: "Save-On-Foods", amount: 30.25, currency: "CAD", mcc: "5411", mccDesc: "Grocery", isOnline: false },
  { date: "2025-12-23", merchant: "Uber", amount: 10.49, currency: "CAD", mcc: "4121", mccDesc: "Subscription", isOnline: true, notes: "Uber One Membership" },
  { date: "2025-12-23", merchant: "Compass", amount: 80.00, currency: "CAD", mcc: "4111", mccDesc: "Transit", isOnline: false },
  { date: "2025-12-23", merchant: "Alchemy Kitchen and Bar", amount: 30.62, currency: "CAD", mcc: "5812", mccDesc: "Restaurant", isOnline: false },
  { date: "2025-12-24", merchant: "PriceSmart", amount: 228.04, currency: "CAD", mcc: "5411", mccDesc: "Grocery", isOnline: false },
  { date: "2025-12-26", merchant: "Safeway", amount: 50.88, currency: "CAD", mcc: "5411", mccDesc: "Grocery", isOnline: false },
  { date: "2025-12-27", merchant: "PriceSmart", amount: 12.47, currency: "CAD", mcc: "5411", mccDesc: "Grocery", isOnline: false },
  { date: "2025-12-28", merchant: "Lyft", amount: 7.14, currency: "CAD", mcc: "4121", mccDesc: "Ride Share", isOnline: true },
  { date: "2025-12-28", merchant: "Uber Eats", amount: 67.17, currency: "CAD", mcc: "5812", mccDesc: "Food Delivery", isOnline: true },
  { date: "2025-12-29", merchant: "PriceSmart", amount: 519.18, currency: "CAD", mcc: "5411", mccDesc: "Grocery", isOnline: false },
  { date: "2025-12-30", merchant: "Safeway", amount: 28.87, currency: "CAD", mcc: "5411", mccDesc: "Grocery", isOnline: false },
  { date: "2025-12-31", merchant: "Grouse Mountain", amount: 10.48, currency: "CAD", mcc: "7999", mccDesc: "Recreation", isOnline: false, notes: "Cafe" },
  { date: "2026-01-01", merchant: "Netflix", amount: 21.46, currency: "CAD", mcc: "5968", mccDesc: "Streaming", isOnline: true },
];

// MCC to multiplier mapping
const TRANSIT_MCCS = ["4011", "4111", "4121", "4131", "4789", "5541", "5542"];
const FOOD_MCCS = ["5411", "5422", "5441", "5451", "5499", "5811", "5812", "5813", "5814"];
const STREAMING_MERCHANTS = ["Netflix", "Spotify", "Apple Music", "Disney+", "Crave", "YouTube Premium"];

function calculatePoints(paymentAmount: number, mccCode: string, currency: string, merchantName: string) {
  let multiplier = 1;

  if (TRANSIT_MCCS.includes(mccCode)) {
    multiplier = 2; // Transit: 2x for any currency
  } else if (currency === "CAD" && FOOD_MCCS.includes(mccCode)) {
    multiplier = 5; // Food/Grocery: 5x CAD only
  } else if (currency === "CAD" && STREAMING_MERCHANTS.some(s => merchantName.toLowerCase().includes(s.toLowerCase()))) {
    multiplier = 3; // Streaming: 3x CAD only
  }

  const totalPoints = Math.round(paymentAmount * multiplier);
  const basePoints = Math.round(paymentAmount * 1);
  const bonusPoints = totalPoints - basePoints;

  return { basePoints, bonusPoints, totalPoints, multiplier };
}

// Merchant cache
const merchantCache: Map<string, string> = new Map();

async function findOrCreateMerchant(
  name: string,
  mccCode: string,
  mccDescription: string,
  isOnline: boolean
): Promise<string | null> {
  const cacheKey = name.toLowerCase();
  if (merchantCache.has(cacheKey)) {
    return merchantCache.get(cacheKey)!;
  }

  const { data: existing } = await supabase
    .from("merchants")
    .select("id, name")
    .eq("name", name)
    .eq("is_deleted", false)
    .limit(1);

  if (existing && existing.length > 0) {
    merchantCache.set(cacheKey, existing[0].id);
    return existing[0].id;
  }

  const merchantId = crypto.randomUUID();
  const { error } = await supabase.from("merchants").insert([
    {
      id: merchantId,
      name: name,
      mcc: { code: mccCode, description: mccDescription },
      mcc_code: mccCode,
      is_online: isOnline,
    },
  ]);

  if (error) {
    console.error(`Error creating merchant ${name}:`, error);
    return null;
  }

  merchantCache.set(cacheKey, merchantId);
  return merchantId;
}

async function main() {
  const doImport = process.argv.includes("--import");

  // Get Amex Cobalt payment method
  const { data: pm } = await supabase
    .from("payment_methods")
    .select("id, name")
    .ilike("name", "%cobalt%")
    .single();

  if (!pm) {
    console.error("Amex Cobalt payment method not found");
    return;
  }
  console.log("Payment Method:", pm.name, "(", pm.id, ")");

  // Get existing Cobalt transactions in this period
  const { data: existing } = await supabase
    .from("transactions")
    .select("date, amount, payment_amount, currency, merchants(name)")
    .eq("payment_method_id", pm.id)
    .gte("date", "2025-12-04")
    .lte("date", "2026-01-03");

  const existingSet = new Set(
    (existing || []).map((t: any) => {
      const amt = t.payment_amount || t.amount;
      return `${t.date.slice(0, 10)}_${t.merchants?.name}_${amt.toFixed(2)}`;
    })
  );

  console.log("\nExisting Cobalt transactions in period:", existing?.length || 0);

  // Find new transactions
  const newTransactions: typeof statementTransactions = [];
  const duplicates: typeof statementTransactions = [];

  for (const t of statementTransactions) {
    const key = `${t.date}_${t.merchant}_${t.amount.toFixed(2)}`;
    if (existingSet.has(key)) {
      duplicates.push(t);
    } else {
      newTransactions.push(t);
    }
  }

  console.log("Statement transactions:", statementTransactions.length);
  console.log("Already imported:", duplicates.length);
  console.log("New to import:", newTransactions.length);

  if (newTransactions.length === 0) {
    console.log("\nNo new transactions to import!");
    return;
  }

  // Group by category for review
  const food5x: typeof statementTransactions = [];
  const streaming3x: typeof statementTransactions = [];
  const transit2x: typeof statementTransactions = [];
  const other1x: typeof statementTransactions = [];

  for (const t of newTransactions) {
    const { multiplier } = calculatePoints(t.amount, t.mcc, t.currency, t.merchant);
    if (multiplier === 5) food5x.push(t);
    else if (multiplier === 3) streaming3x.push(t);
    else if (multiplier === 2) transit2x.push(t);
    else other1x.push(t);
  }

  console.log("\n" + "=".repeat(90));
  console.log("TRANSACTIONS TO IMPORT - REVIEW");
  console.log("=".repeat(90));

  const printCategory = (title: string, items: typeof statementTransactions) => {
    if (items.length === 0) return;
    console.log(`\n${title}`);
    console.log("-".repeat(90));
    let totalAmt = 0;
    let totalPts = 0;
    for (const t of items) {
      const pts = calculatePoints(t.amount, t.mcc, t.currency, t.merchant);
      const usdNote = (t as any).amountUsd ? ` (USD $${(t as any).amountUsd})` : "";
      console.log(
        `${t.date} | ${t.merchant.padEnd(25)} | $${t.amount.toFixed(2).padStart(7)}${usdNote.padEnd(15)} | ${pts.totalPoints} pts`
      );
      totalAmt += t.amount;
      totalPts += pts.totalPoints;
    }
    console.log("-".repeat(90));
    console.log(`Subtotal: $${totalAmt.toFixed(2)} → ${totalPts} pts`);
  };

  printCategory("5x Food & Grocery (CAD only)", food5x);
  printCategory("3x Streaming (CAD only)", streaming3x);
  printCategory("2x Gas/Transit/Ride Share (any currency)", transit2x);
  printCategory("1x Other", other1x);

  // Grand totals
  let grandTotal = 0;
  let grandPoints = 0;
  for (const t of newTransactions) {
    const pts = calculatePoints(t.amount, t.mcc, t.currency, t.merchant);
    grandTotal += t.amount;
    grandPoints += pts.totalPoints;
  }

  console.log("\n" + "=".repeat(90));
  console.log(`GRAND TOTAL: $${grandTotal.toFixed(2)} → ${grandPoints} pts`);
  console.log("=".repeat(90));

  if (!doImport) {
    console.log("\nRun with --import to insert these transactions");
    return;
  }

  // Import transactions
  console.log("\nImporting transactions...");
  let imported = 0;
  let failed = 0;

  for (const t of newTransactions) {
    const merchantId = await findOrCreateMerchant(t.merchant, t.mcc, t.mccDesc, t.isOnline);
    if (!merchantId) {
      console.error(`Failed to get merchant ID for ${t.merchant}`);
      failed++;
      continue;
    }

    const pts = calculatePoints(t.amount, t.mcc, t.currency, t.merchant);
    const originalAmount = (t as any).amountUsd || t.amount;
    const originalCurrency = t.currency;

    const { error } = await supabase.from("transactions").insert([
      {
        id: crypto.randomUUID(),
        user_id: USER_ID,
        date: t.date,
        merchant_id: merchantId,
        amount: originalAmount,
        currency: originalCurrency,
        payment_method_id: pm.id,
        payment_amount: t.amount,
        payment_currency: "CAD",
        total_points: pts.totalPoints,
        base_points: pts.basePoints,
        bonus_points: pts.bonusPoints,
        is_contactless: false,
        mcc_code: t.mcc,
        notes: (t as any).notes || null,
      },
    ]);

    if (error) {
      console.error(`Error inserting ${t.merchant}:`, error.message);
      failed++;
    } else {
      console.log(`✓ ${t.date} ${t.merchant} $${t.amount} → ${pts.totalPoints} pts`);
      imported++;
    }
  }

  console.log(`\nImport complete: ${imported} imported, ${failed} failed`);
}

main();
