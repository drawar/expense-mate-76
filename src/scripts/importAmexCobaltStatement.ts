/**
 * Import Amex Cobalt Statement (Aug 4 - Sep 3, 2025)
 * Run with: npx tsx src/scripts/importAmexCobaltStatement.ts
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { join } from "path";

// Load env file manually
const envPath = join(process.cwd(), ".env");
const envContent = readFileSync(envPath, "utf-8");
const envVars: Record<string, string> = {};
for (const line of envContent.split("\n")) {
  const match = line.match(/^([^=]+)="?([^"]*)"?$/);
  if (match) {
    envVars[match[1]] = match[2];
  }
}

const supabaseUrl = envVars.VITE_SUPABASE_URL;
const supabaseKey = envVars.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

// MCC codes for Amex Cobalt categories
const MCC_CODES = {
  // Food & Grocery (5x)
  GROCERY: "5411",
  RESTAURANT: "5812",
  FAST_FOOD: "5814",
  BAKERY: "5462",
  DRINKING_PLACES: "5813",
  // Streaming (3x)
  STREAMING: "5968",
  // Gas & Transit (2x)
  TRANSIT: "4111",
  RIDE_SHARE: "4121",
  GAS: "5541",
  // Other (1x)
  LIQUOR: "5921",
  CLOTHING: "5651",
  MISC: "5999",
};

interface TransactionInput {
  date: string;
  merchant: string;
  amount: number;
  currency: string;
  paymentAmount: number; // CAD amount after conversion
  paymentCurrency: string;
  mccCode: string;
  category: string;
  multiplier: number;
  totalPoints: number;
  basePoints: number;
  bonusPoints: number;
  isOnline: boolean;
  address?: string;
}

// All transactions extracted from statement (Aug 4 - Sep 3, 2025)
// Points verified against statement pages 7-8
const transactions: TransactionInput[] = [
  // 5x Food/Drink - Uber Eats ($89.46 → 447 pts)
  { date: "2025-08-13", merchant: "Uber Eats", amount: 48.48, currency: "CAD", paymentAmount: 48.48, paymentCurrency: "CAD", mccCode: MCC_CODES.RESTAURANT, category: "Food Delivery", multiplier: 5, totalPoints: 242, basePoints: 48, bonusPoints: 194, isOnline: true },
  { date: "2025-08-20", merchant: "Uber Eats", amount: 40.98, currency: "CAD", paymentAmount: 40.98, paymentCurrency: "CAD", mccCode: MCC_CODES.RESTAURANT, category: "Food Delivery", multiplier: 5, totalPoints: 205, basePoints: 41, bonusPoints: 164, isOnline: true },

  // 5x Food/Drink - Restaurants & Groceries ($917.64 → 4,589 pts)
  { date: "2025-08-03", merchant: "Si Lom Thai Bistro", amount: 50.61, currency: "CAD", paymentAmount: 50.61, paymentCurrency: "CAD", mccCode: MCC_CODES.RESTAURANT, category: "Restaurants", multiplier: 5, totalPoints: 253, basePoints: 51, bonusPoints: 202, isOnline: false, address: "Toronto" },
  { date: "2025-08-03", merchant: "Pho Anh Vu", amount: 28.51, currency: "CAD", paymentAmount: 28.51, paymentCurrency: "CAD", mccCode: MCC_CODES.RESTAURANT, category: "Restaurants", multiplier: 5, totalPoints: 143, basePoints: 29, bonusPoints: 114, isOnline: false, address: "Toronto" },
  { date: "2025-08-03", merchant: "Metro", amount: 28.99, currency: "CAD", paymentAmount: 28.99, paymentCurrency: "CAD", mccCode: MCC_CODES.GROCERY, category: "Groceries", multiplier: 5, totalPoints: 145, basePoints: 29, bonusPoints: 116, isOnline: false, address: "Toronto" },
  { date: "2025-08-04", merchant: "Paupers Pub", amount: 119.77, currency: "CAD", paymentAmount: 119.77, paymentCurrency: "CAD", mccCode: MCC_CODES.DRINKING_PLACES, category: "Restaurants", multiplier: 5, totalPoints: 599, basePoints: 120, bonusPoints: 479, isOnline: false, address: "Toronto" },
  { date: "2025-08-05", merchant: "El Rey Mezcal Bar", amount: 21.21, currency: "CAD", paymentAmount: 21.21, paymentCurrency: "CAD", mccCode: MCC_CODES.DRINKING_PLACES, category: "Restaurants", multiplier: 5, totalPoints: 106, basePoints: 21, bonusPoints: 85, isOnline: false, address: "Toronto" },
  { date: "2025-08-06", merchant: "SP Oddbunch", amount: 25.99, currency: "CAD", paymentAmount: 25.99, paymentCurrency: "CAD", mccCode: MCC_CODES.GROCERY, category: "Groceries", multiplier: 5, totalPoints: 130, basePoints: 26, bonusPoints: 104, isOnline: true, address: "London" },
  { date: "2025-08-04", merchant: "Jack Astor's", amount: 52.54, currency: "CAD", paymentAmount: 52.54, paymentCurrency: "CAD", mccCode: MCC_CODES.RESTAURANT, category: "Restaurants", multiplier: 5, totalPoints: 263, basePoints: 53, bonusPoints: 210, isOnline: false, address: "Toronto" },
  { date: "2025-08-05", merchant: "La Cevicheria Bar & Grill", amount: 35.34, currency: "CAD", paymentAmount: 35.34, paymentCurrency: "CAD", mccCode: MCC_CODES.RESTAURANT, category: "Restaurants", multiplier: 5, totalPoints: 177, basePoints: 35, bonusPoints: 142, isOnline: false, address: "Toronto" },
  { date: "2025-08-05", merchant: "Bar Vendetta", amount: 78.67, currency: "CAD", paymentAmount: 78.67, paymentCurrency: "CAD", mccCode: MCC_CODES.DRINKING_PLACES, category: "Restaurants", multiplier: 5, totalPoints: 393, basePoints: 79, bonusPoints: 314, isOnline: false, address: "Toronto" },
  { date: "2025-08-10", merchant: "Bubble Tasty Tea", amount: 6.46, currency: "CAD", paymentAmount: 6.46, paymentCurrency: "CAD", mccCode: MCC_CODES.FAST_FOOD, category: "Food & Drink", multiplier: 5, totalPoints: 32, basePoints: 6, bonusPoints: 26, isOnline: false, address: "Chilliwack" },
  { date: "2025-08-09", merchant: "PriceSmart Foods", amount: 23.96, currency: "CAD", paymentAmount: 23.96, paymentCurrency: "CAD", mccCode: MCC_CODES.GROCERY, category: "Groceries", multiplier: 5, totalPoints: 120, basePoints: 24, bonusPoints: 96, isOnline: false, address: "Burnaby" },
  { date: "2025-08-10", merchant: "TST-Eggbomb", amount: 30.11, currency: "CAD", paymentAmount: 30.11, paymentCurrency: "CAD", mccCode: MCC_CODES.RESTAURANT, category: "Restaurants", multiplier: 5, totalPoints: 151, basePoints: 30, bonusPoints: 121, isOnline: false, address: "Burnaby" },
  { date: "2025-08-11", merchant: "Goodfood", amount: 171.86, currency: "CAD", paymentAmount: 171.86, paymentCurrency: "CAD", mccCode: MCC_CODES.GROCERY, category: "Groceries", multiplier: 5, totalPoints: 859, basePoints: 172, bonusPoints: 687, isOnline: true, address: "Saint-Laurent" },
  { date: "2025-08-13", merchant: "SP Oddbunch", amount: 25.99, currency: "CAD", paymentAmount: 25.99, paymentCurrency: "CAD", mccCode: MCC_CODES.GROCERY, category: "Groceries", multiplier: 5, totalPoints: 130, basePoints: 26, bonusPoints: 104, isOnline: true, address: "London" },
  { date: "2025-08-12", merchant: "Save-On-Foods", amount: 14.97, currency: "CAD", paymentAmount: 14.97, paymentCurrency: "CAD", mccCode: MCC_CODES.GROCERY, category: "Groceries", multiplier: 5, totalPoints: 75, basePoints: 15, bonusPoints: 60, isOnline: false, address: "Burnaby" },
  { date: "2025-08-14", merchant: "PriceSmart Foods", amount: 20.68, currency: "CAD", paymentAmount: 20.68, paymentCurrency: "CAD", mccCode: MCC_CODES.GROCERY, category: "Groceries", multiplier: 5, totalPoints: 103, basePoints: 21, bonusPoints: 82, isOnline: false, address: "Burnaby" },
  { date: "2025-08-14", merchant: "Save-On-Foods", amount: 10.48, currency: "CAD", paymentAmount: 10.48, paymentCurrency: "CAD", mccCode: MCC_CODES.GROCERY, category: "Groceries", multiplier: 5, totalPoints: 52, basePoints: 10, bonusPoints: 42, isOnline: false, address: "Burnaby" },
  { date: "2025-08-15", merchant: "Save-On-Foods", amount: 41.18, currency: "CAD", paymentAmount: 41.18, paymentCurrency: "CAD", mccCode: MCC_CODES.GROCERY, category: "Groceries", multiplier: 5, totalPoints: 206, basePoints: 41, bonusPoints: 165, isOnline: false, address: "Burnaby" },
  { date: "2025-09-01", merchant: "Goodfood", amount: 104.33, currency: "CAD", paymentAmount: 104.33, paymentCurrency: "CAD", mccCode: MCC_CODES.GROCERY, category: "Groceries", multiplier: 5, totalPoints: 522, basePoints: 104, bonusPoints: 418, isOnline: true, address: "Saint-Laurent" },
  { date: "2025-09-03", merchant: "SP Oddbunch", amount: 25.99, currency: "CAD", paymentAmount: 25.99, paymentCurrency: "CAD", mccCode: MCC_CODES.GROCERY, category: "Groceries", multiplier: 5, totalPoints: 130, basePoints: 26, bonusPoints: 104, isOnline: true, address: "London" },

  // 3x Streaming ($37.76 → 113 pts)
  { date: "2025-08-10", merchant: "Audible", amount: 16.30, currency: "CAD", paymentAmount: 16.30, paymentCurrency: "CAD", mccCode: MCC_CODES.STREAMING, category: "Streaming", multiplier: 3, totalPoints: 49, basePoints: 16, bonusPoints: 33, isOnline: true },
  { date: "2025-08-16", merchant: "Netflix", amount: 21.46, currency: "CAD", paymentAmount: 21.46, paymentCurrency: "CAD", mccCode: MCC_CODES.STREAMING, category: "Streaming", multiplier: 3, totalPoints: 64, basePoints: 21, bonusPoints: 43, isOnline: true, address: "Vancouver" },

  // 2x Transit ($123.15 → 246 pts)
  { date: "2025-08-02", merchant: "Presto", amount: 6.60, currency: "CAD", paymentAmount: 6.60, paymentCurrency: "CAD", mccCode: MCC_CODES.TRANSIT, category: "Transit", multiplier: 2, totalPoints: 13, basePoints: 7, bonusPoints: 6, isOnline: false, address: "Toronto" },
  { date: "2025-08-03", merchant: "Presto", amount: 6.60, currency: "CAD", paymentAmount: 6.60, paymentCurrency: "CAD", mccCode: MCC_CODES.TRANSIT, category: "Transit", multiplier: 2, totalPoints: 13, basePoints: 7, bonusPoints: 6, isOnline: false, address: "Toronto" },
  { date: "2025-08-05", merchant: "Presto", amount: 6.60, currency: "CAD", paymentAmount: 6.60, paymentCurrency: "CAD", mccCode: MCC_CODES.TRANSIT, category: "Transit", multiplier: 2, totalPoints: 13, basePoints: 7, bonusPoints: 6, isOnline: false, address: "Toronto" },
  { date: "2025-08-16", merchant: "Compass", amount: 3.35, currency: "CAD", paymentAmount: 3.35, paymentCurrency: "CAD", mccCode: MCC_CODES.TRANSIT, category: "Transit", multiplier: 2, totalPoints: 7, basePoints: 3, bonusPoints: 4, isOnline: false, address: "Burnaby" },
  { date: "2025-08-16", merchant: "Compass", amount: 100.00, currency: "CAD", paymentAmount: 100.00, paymentCurrency: "CAD", mccCode: MCC_CODES.TRANSIT, category: "Transit", multiplier: 2, totalPoints: 200, basePoints: 100, bonusPoints: 100, isOnline: false, address: "Burnaby" },

  // 2x Ride Share ($207.78 → 416 pts)
  { date: "2025-08-04", merchant: "Uber", amount: 10.62, currency: "CAD", paymentAmount: 10.62, paymentCurrency: "CAD", mccCode: MCC_CODES.RIDE_SHARE, category: "Ride Share", multiplier: 2, totalPoints: 21, basePoints: 11, bonusPoints: 10, isOnline: true },
  { date: "2025-08-04", merchant: "Lyft", amount: 7.76, currency: "CAD", paymentAmount: 7.76, paymentCurrency: "CAD", mccCode: MCC_CODES.RIDE_SHARE, category: "Ride Share", multiplier: 2, totalPoints: 16, basePoints: 8, bonusPoints: 8, isOnline: true, address: "Vancouver" },
  { date: "2025-08-04", merchant: "Lyft", amount: 9.90, currency: "CAD", paymentAmount: 9.90, paymentCurrency: "CAD", mccCode: MCC_CODES.RIDE_SHARE, category: "Ride Share", multiplier: 2, totalPoints: 20, basePoints: 10, bonusPoints: 10, isOnline: true, address: "Vancouver" },
  { date: "2025-08-05", merchant: "Lyft", amount: 14.35, currency: "CAD", paymentAmount: 14.35, paymentCurrency: "CAD", mccCode: MCC_CODES.RIDE_SHARE, category: "Ride Share", multiplier: 2, totalPoints: 29, basePoints: 14, bonusPoints: 15, isOnline: true, address: "Vancouver" },
  { date: "2025-08-05", merchant: "Lyft", amount: 9.00, currency: "CAD", paymentAmount: 9.00, paymentCurrency: "CAD", mccCode: MCC_CODES.RIDE_SHARE, category: "Ride Share", multiplier: 2, totalPoints: 18, basePoints: 9, bonusPoints: 9, isOnline: true, address: "Vancouver" },
  { date: "2025-08-06", merchant: "Lyft", amount: 46.74, currency: "CAD", paymentAmount: 46.74, paymentCurrency: "CAD", mccCode: MCC_CODES.RIDE_SHARE, category: "Ride Share", multiplier: 2, totalPoints: 93, basePoints: 47, bonusPoints: 46, isOnline: true, address: "Vancouver" },
  { date: "2025-08-07", merchant: "Lyft", amount: 36.79, currency: "CAD", paymentAmount: 36.79, paymentCurrency: "CAD", mccCode: MCC_CODES.RIDE_SHARE, category: "Ride Share", multiplier: 2, totalPoints: 74, basePoints: 37, bonusPoints: 37, isOnline: true, address: "Vancouver" },
  { date: "2025-08-16", merchant: "Lyft", amount: 8.10, currency: "CAD", paymentAmount: 8.10, paymentCurrency: "CAD", mccCode: MCC_CODES.RIDE_SHARE, category: "Ride Share", multiplier: 2, totalPoints: 16, basePoints: 8, bonusPoints: 8, isOnline: true, address: "Vancouver" },
  { date: "2025-08-21", merchant: "Lyft", amount: 32.29, currency: "CAD", paymentAmount: 32.29, paymentCurrency: "CAD", mccCode: MCC_CODES.RIDE_SHARE, category: "Ride Share", multiplier: 2, totalPoints: 65, basePoints: 32, bonusPoints: 33, isOnline: true, address: "Vancouver" },
  // USD transactions - still get 2x per statement
  { date: "2025-08-22", merchant: "Uber", amount: 5.00, currency: "USD", paymentAmount: 7.12, paymentCurrency: "CAD", mccCode: MCC_CODES.RIDE_SHARE, category: "Ride Share", multiplier: 2, totalPoints: 14, basePoints: 7, bonusPoints: 7, isOnline: true },
  { date: "2025-08-22", merchant: "Lyft", amount: 17.62, currency: "USD", paymentAmount: 25.11, paymentCurrency: "CAD", mccCode: MCC_CODES.RIDE_SHARE, category: "Ride Share", multiplier: 2, totalPoints: 50, basePoints: 25, bonusPoints: 25, isOnline: true, address: "San Francisco" },

  // 1x Other ($176.50 → 177 pts base only)
  { date: "2025-08-03", merchant: "Lululemon", amount: 154.56, currency: "CAD", paymentAmount: 154.56, paymentCurrency: "CAD", mccCode: MCC_CODES.CLOTHING, category: "Shopping", multiplier: 1, totalPoints: 155, basePoints: 155, bonusPoints: 0, isOnline: true },
  { date: "2025-08-14", merchant: "BC Liquor Store", amount: 21.94, currency: "CAD", paymentAmount: 21.94, paymentCurrency: "CAD", mccCode: MCC_CODES.LIQUOR, category: "Liquor", multiplier: 1, totalPoints: 22, basePoints: 22, bonusPoints: 0, isOnline: false, address: "Burnaby" },
];

async function findAmexCobaltPaymentMethod() {
  const { data, error } = await supabase
    .from("payment_methods")
    .select("id, name, issuer, currency")
    .ilike("name", "%cobalt%")
    .eq("issuer", "American Express")
    .single();

  if (error) {
    console.error("Error finding Amex Cobalt:", error);
    return null;
  }
  return data;
}

async function checkExistingTransactions(paymentMethodId: string, startDate: string, endDate: string) {
  const { data, error } = await supabase
    .from("transactions")
    .select(`
      id, date, amount, payment_amount,
      merchants!inner(name)
    `)
    .eq("payment_method_id", paymentMethodId)
    .gte("date", startDate)
    .lte("date", endDate)
    .or("is_deleted.is.null,is_deleted.eq.false");

  if (error) {
    console.error("Error checking existing transactions:", error);
    return [];
  }
  return data || [];
}

async function main() {
  console.log("=".repeat(60));
  console.log("AMEX COBALT STATEMENT IMPORT");
  console.log("Statement Period: Aug 4, 2025 - Sep 3, 2025");
  console.log("=".repeat(60));

  // Find Amex Cobalt payment method
  const cobalt = await findAmexCobaltPaymentMethod();
  if (!cobalt) {
    console.error("\n❌ Amex Cobalt payment method not found!");
    console.log("Please add an Amex Cobalt card first.");
    return;
  }
  console.log(`\n✅ Found payment method: ${cobalt.name} (${cobalt.id})`);

  // Check for existing transactions
  const existing = await checkExistingTransactions(cobalt.id, "2025-08-02", "2025-09-03");
  console.log(`\n📊 Existing transactions in date range: ${existing.length}`);

  if (existing.length > 0) {
    console.log("\nExisting transactions:");
    for (const tx of existing) {
      const merchant = (tx.merchants as { name: string })?.name || "Unknown";
      console.log(`  - ${tx.date}: ${merchant} - $${tx.payment_amount || tx.amount}`);
    }
  }

  // Summary of transactions to import
  console.log("\n" + "=".repeat(60));
  console.log("TRANSACTIONS TO IMPORT");
  console.log("=".repeat(60));

  // Group by category for summary
  const byCategory: Record<string, { count: number; amount: number; points: number }> = {};
  for (const tx of transactions) {
    if (!byCategory[tx.category]) {
      byCategory[tx.category] = { count: 0, amount: 0, points: 0 };
    }
    byCategory[tx.category].count++;
    byCategory[tx.category].amount += tx.paymentAmount;
    byCategory[tx.category].points += tx.totalPoints;
  }

  console.log("\nBy Category:");
  for (const [cat, data] of Object.entries(byCategory)) {
    console.log(`  ${cat}: ${data.count} txns, $${data.amount.toFixed(2)}, ${data.points} pts`);
  }

  const totalAmount = transactions.reduce((sum, t) => sum + t.paymentAmount, 0);
  const totalPoints = transactions.reduce((sum, t) => sum + t.totalPoints, 0);
  const totalBase = transactions.reduce((sum, t) => sum + t.basePoints, 0);
  const totalBonus = transactions.reduce((sum, t) => sum + t.bonusPoints, 0);

  console.log("\n" + "-".repeat(40));
  console.log(`Total: ${transactions.length} transactions`);
  console.log(`Amount: $${totalAmount.toFixed(2)}`);
  console.log(`Points: ${totalPoints} (Base: ${totalBase}, Bonus: ${totalBonus})`);

  // Statement verification
  console.log("\n" + "=".repeat(60));
  console.log("STATEMENT VERIFICATION");
  console.log("=".repeat(60));
  console.log("Statement says:");
  console.log("  - Points Earned: 5,988");
  console.log("  - Bonus Points: 1,250");
  console.log("  - Total Purchases: $1,552.29");
  console.log("\nCalculated:");
  console.log(`  - Points Earned: ${totalPoints}`);
  console.log(`  - Bonus Points: ${totalBonus}`);
  console.log(`  - Total Purchases: $${totalAmount.toFixed(2)}`);

  const pointsMatch = totalPoints === 5988;
  const amountMatch = Math.abs(totalAmount - 1552.29) < 0.01;

  if (pointsMatch && amountMatch) {
    console.log("\n✅ VERIFIED - Numbers match the statement!");
  } else {
    console.log("\n⚠️ Discrepancy detected:");
    if (!pointsMatch) console.log(`  Points: ${totalPoints} vs 5,988 (diff: ${totalPoints - 5988})`);
    if (!amountMatch) console.log(`  Amount: $${totalAmount.toFixed(2)} vs $1,552.29 (diff: $${(totalAmount - 1552.29).toFixed(2)})`);
  }

  // Detailed transaction list
  console.log("\n" + "=".repeat(60));
  console.log("DETAILED TRANSACTIONS");
  console.log("=".repeat(60));

  for (const tx of transactions) {
    const currencyNote = tx.currency !== "CAD" ? ` (${tx.amount} ${tx.currency})` : "";
    console.log(`${tx.date} | ${tx.merchant.padEnd(25)} | $${tx.paymentAmount.toFixed(2).padStart(7)}${currencyNote} | ${tx.multiplier}x | ${tx.totalPoints} pts`);
  }

  // Check for potential duplicates
  const potentialDuplicates: TransactionInput[] = [];
  for (const tx of transactions) {
    const match = existing.find(e => {
      const merchant = (e.merchants as { name: string })?.name || "";
      const amount = parseFloat((e.payment_amount || e.amount).toString());
      return e.date === tx.date &&
             Math.abs(amount - tx.paymentAmount) < 0.01 &&
             merchant.toLowerCase().includes(tx.merchant.toLowerCase().substring(0, 5));
    });
    if (match) {
      potentialDuplicates.push(tx);
    }
  }

  if (potentialDuplicates.length > 0) {
    console.log("\n⚠️ POTENTIAL DUPLICATES (already in database):");
    for (const dup of potentialDuplicates) {
      console.log(`  - ${dup.date}: ${dup.merchant} - $${dup.paymentAmount}`);
    }
    console.log("\nThese will be skipped during import.");
  }

  const toImport = transactions.filter(tx => !potentialDuplicates.includes(tx));
  console.log(`\n📥 Transactions to import: ${toImport.length}`);

  // Ask for confirmation
  console.log("\n" + "=".repeat(60));
  console.log("To proceed with import, run:");
  console.log("  npx tsx src/scripts/importAmexCobaltStatement.ts --import");
  console.log("=".repeat(60));

  // Check if --import flag is passed
  if (process.argv.includes("--import")) {
    console.log("\n🚀 Starting import...\n");
    await importTransactions(cobalt.id, toImport);
  }
}

// Cache for merchant lookups
const merchantCache: Map<string, string> = new Map();

async function findOrCreateMerchant(tx: TransactionInput): Promise<string | null> {
  // Check cache first
  const cacheKey = tx.merchant.toLowerCase();
  if (merchantCache.has(cacheKey)) {
    return merchantCache.get(cacheKey)!;
  }

  // Look for existing merchant by exact name match
  const { data: existing } = await supabase
    .from("merchants")
    .select("id, name")
    .eq("name", tx.merchant)
    .eq("is_deleted", false)
    .limit(1);

  if (existing && existing.length > 0) {
    merchantCache.set(cacheKey, existing[0].id);
    return existing[0].id;
  }

  // Create new merchant
  const merchantId = crypto.randomUUID();
  const merchantData = {
    id: merchantId,
    name: tx.merchant,
    address: tx.address || null,
    mcc: { code: tx.mccCode, description: tx.category },
    mcc_code: tx.mccCode,
    is_online: tx.isOnline,
  };

  const { error } = await supabase
    .from("merchants")
    .insert([merchantData]);

  if (error) {
    console.error(`Error creating merchant ${tx.merchant}:`, error);
    return null;
  }

  merchantCache.set(cacheKey, merchantId);
  return merchantId;
}

async function importTransactions(paymentMethodId: string, txns: TransactionInput[]) {
  let imported = 0;
  let failed = 0;

  for (const tx of txns) {
    try {
      // Find or create merchant (reuses existing consolidated merchants)
      const merchantId = await findOrCreateMerchant(tx);

      if (!merchantId) {
        failed++;
        continue;
      }

      // Create transaction
      const transactionData = {
        date: tx.date,
        merchant_id: merchantId,
        amount: tx.amount,
        currency: tx.currency,
        payment_method_id: paymentMethodId,
        payment_amount: tx.paymentAmount,
        payment_currency: tx.paymentCurrency,
        total_points: tx.totalPoints,
        base_points: tx.basePoints,
        bonus_points: tx.bonusPoints,
        is_contactless: false,
        mcc_code: tx.mccCode,
        user_category: tx.category,
        category: tx.category,
        user_id: "00000000-0000-0000-0000-000000000000",
      };

      const { error: txError } = await supabase
        .from("transactions")
        .insert([transactionData]);

      if (txError) {
        console.error(`Error creating transaction:`, txError);
        failed++;
        continue;
      }

      console.log(`✅ ${tx.date}: ${tx.merchant} - $${tx.paymentAmount} (${tx.totalPoints} pts)`);
      imported++;
    } catch (error) {
      console.error(`Error importing ${tx.merchant}:`, error);
      failed++;
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log(`Import complete: ${imported} imported, ${failed} failed`);
  console.log("=".repeat(60));
}

main();
