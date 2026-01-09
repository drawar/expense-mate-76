/**
 * Import Amex Cobalt Statement (Sep 4 - Oct 3, 2025)
 * Run with: npx tsx src/scripts/importAmexCobaltSepOct.ts
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

const supabaseUrl = envVars.VITE_SUPABASE_URL;
const supabaseKey = envVars.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const MCC_CODES = {
  GROCERY: "5411",
  RESTAURANT: "5812",
  FAST_FOOD: "5814",
  DRINKING_PLACES: "5813",
  STREAMING: "5968",
  RIDE_SHARE: "4121",
  GOVT_SERVICES: "9399",
  ENTERTAINMENT: "7922",
  DEPT_STORE: "5311",
  MISC: "5999",
};

interface TransactionInput {
  date: string;
  merchant: string;
  amount: number;
  currency: string;
  paymentAmount: number;
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

// Transactions from Sep 4 - Oct 3, 2025 statement
const transactions: TransactionInput[] = [
  // 5x Food & Drink
  { date: "2025-09-03", merchant: "Save-On-Foods", amount: 27.28, currency: "CAD", paymentAmount: 27.28, paymentCurrency: "CAD", mccCode: MCC_CODES.GROCERY, category: "Groceries", multiplier: 5, totalPoints: 136, basePoints: 27, bonusPoints: 109, isOnline: false, address: "Burnaby" },
  { date: "2025-09-05", merchant: "Uber Eats", amount: 26.24, currency: "CAD", paymentAmount: 26.24, paymentCurrency: "CAD", mccCode: MCC_CODES.RESTAURANT, category: "Food Delivery", multiplier: 5, totalPoints: 131, basePoints: 26, bonusPoints: 105, isOnline: true },
  { date: "2025-09-06", merchant: "Laowai", amount: 65.13, currency: "CAD", paymentAmount: 65.13, paymentCurrency: "CAD", mccCode: MCC_CODES.RESTAURANT, category: "Restaurants", multiplier: 5, totalPoints: 326, basePoints: 65, bonusPoints: 261, isOnline: false, address: "Vancouver" },
  { date: "2025-09-07", merchant: "Suyo Modern Peruvian", amount: 181.13, currency: "CAD", paymentAmount: 181.13, paymentCurrency: "CAD", mccCode: MCC_CODES.RESTAURANT, category: "Restaurants", multiplier: 5, totalPoints: 906, basePoints: 181, bonusPoints: 725, isOnline: false, address: "Vancouver" },
  { date: "2025-09-14", merchant: "Anh And Chi", amount: 39.12, currency: "CAD", paymentAmount: 39.12, paymentCurrency: "CAD", mccCode: MCC_CODES.RESTAURANT, category: "Restaurants", multiplier: 5, totalPoints: 196, basePoints: 39, bonusPoints: 157, isOnline: false, address: "Vancouver" },
  { date: "2025-09-15", merchant: "Uber Eats", amount: 27.57, currency: "CAD", paymentAmount: 27.57, paymentCurrency: "CAD", mccCode: MCC_CODES.RESTAURANT, category: "Food Delivery", multiplier: 5, totalPoints: 138, basePoints: 28, bonusPoints: 110, isOnline: true },
  { date: "2025-09-15", merchant: "Big Way Hot Pot", amount: 34.50, currency: "CAD", paymentAmount: 34.50, paymentCurrency: "CAD", mccCode: MCC_CODES.RESTAURANT, category: "Restaurants", multiplier: 5, totalPoints: 173, basePoints: 35, bonusPoints: 138, isOnline: false, address: "Burnaby" },
  { date: "2025-09-16", merchant: "PriceSmart Foods", amount: 64.56, currency: "CAD", paymentAmount: 64.56, paymentCurrency: "CAD", mccCode: MCC_CODES.GROCERY, category: "Groceries", multiplier: 5, totalPoints: 323, basePoints: 65, bonusPoints: 258, isOnline: false, address: "Burnaby" },
  { date: "2025-09-17", merchant: "Oddbunch", amount: 25.99, currency: "CAD", paymentAmount: 25.99, paymentCurrency: "CAD", mccCode: MCC_CODES.GROCERY, category: "Groceries", multiplier: 5, totalPoints: 130, basePoints: 26, bonusPoints: 104, isOnline: true, address: "London" },
  { date: "2025-09-19", merchant: "PriceSmart Foods", amount: 42.64, currency: "CAD", paymentAmount: 42.64, paymentCurrency: "CAD", mccCode: MCC_CODES.GROCERY, category: "Groceries", multiplier: 5, totalPoints: 213, basePoints: 43, bonusPoints: 170, isOnline: false, address: "Burnaby" },
  { date: "2025-09-23", merchant: "Oddbunch", amount: 25.99, currency: "CAD", paymentAmount: 25.99, paymentCurrency: "CAD", mccCode: MCC_CODES.GROCERY, category: "Groceries", multiplier: 5, totalPoints: 130, basePoints: 26, bonusPoints: 104, isOnline: true, address: "London" },
  { date: "2025-09-23", merchant: "Fox Cabaret", amount: 18.15, currency: "CAD", paymentAmount: 18.15, paymentCurrency: "CAD", mccCode: MCC_CODES.DRINKING_PLACES, category: "Restaurants", multiplier: 5, totalPoints: 91, basePoints: 18, bonusPoints: 73, isOnline: false, address: "Vancouver" },
  { date: "2025-09-23", merchant: "PriceSmart Foods", amount: 40.60, currency: "CAD", paymentAmount: 40.60, paymentCurrency: "CAD", mccCode: MCC_CODES.GROCERY, category: "Groceries", multiplier: 5, totalPoints: 203, basePoints: 41, bonusPoints: 162, isOnline: false, address: "Burnaby" },
  { date: "2025-09-24", merchant: "Superbaba", amount: 17.05, currency: "CAD", paymentAmount: 17.05, paymentCurrency: "CAD", mccCode: MCC_CODES.RESTAURANT, category: "Restaurants", multiplier: 5, totalPoints: 85, basePoints: 17, bonusPoints: 68, isOnline: false, address: "Calgary" },
  { date: "2025-09-24", merchant: "Save-On-Foods", amount: 22.17, currency: "CAD", paymentAmount: 22.17, paymentCurrency: "CAD", mccCode: MCC_CODES.GROCERY, category: "Groceries", multiplier: 5, totalPoints: 111, basePoints: 22, bonusPoints: 89, isOnline: false, address: "Burnaby" },
  { date: "2025-09-26", merchant: "DoorDash", amount: 29.67, currency: "CAD", paymentAmount: 29.67, paymentCurrency: "CAD", mccCode: MCC_CODES.RESTAURANT, category: "Food Delivery", multiplier: 5, totalPoints: 148, basePoints: 30, bonusPoints: 118, isOnline: true },
  { date: "2025-09-26", merchant: "Safeway", amount: 10.26, currency: "CAD", paymentAmount: 10.26, paymentCurrency: "CAD", mccCode: MCC_CODES.GROCERY, category: "Groceries", multiplier: 5, totalPoints: 51, basePoints: 10, bonusPoints: 41, isOnline: false, address: "Vancouver" },
  { date: "2025-09-26", merchant: "Save-On-Foods", amount: 10.27, currency: "CAD", paymentAmount: 10.27, paymentCurrency: "CAD", mccCode: MCC_CODES.GROCERY, category: "Groceries", multiplier: 5, totalPoints: 51, basePoints: 10, bonusPoints: 41, isOnline: false, address: "Burnaby" },
  { date: "2025-09-27", merchant: "PriceSmart Foods", amount: 16.43, currency: "CAD", paymentAmount: 16.43, paymentCurrency: "CAD", mccCode: MCC_CODES.GROCERY, category: "Groceries", multiplier: 5, totalPoints: 82, basePoints: 16, bonusPoints: 66, isOnline: false, address: "Burnaby" },
  { date: "2025-09-30", merchant: "Oddbunch", amount: 25.99, currency: "CAD", paymentAmount: 25.99, paymentCurrency: "CAD", mccCode: MCC_CODES.GROCERY, category: "Groceries", multiplier: 5, totalPoints: 130, basePoints: 26, bonusPoints: 104, isOnline: true, address: "London" },
  { date: "2025-09-30", merchant: "PriceSmart Foods", amount: 41.92, currency: "CAD", paymentAmount: 41.92, paymentCurrency: "CAD", mccCode: MCC_CODES.GROCERY, category: "Groceries", multiplier: 5, totalPoints: 210, basePoints: 42, bonusPoints: 168, isOnline: false, address: "Burnaby" },
  { date: "2025-09-30", merchant: "PriceSmart Foods", amount: 34.12, currency: "CAD", paymentAmount: 34.12, paymentCurrency: "CAD", mccCode: MCC_CODES.GROCERY, category: "Groceries", multiplier: 5, totalPoints: 171, basePoints: 34, bonusPoints: 137, isOnline: false, address: "Burnaby" },

  // 3x Streaming
  { date: "2025-09-16", merchant: "Netflix", amount: 21.46, currency: "CAD", paymentAmount: 21.46, paymentCurrency: "CAD", mccCode: MCC_CODES.STREAMING, category: "Streaming", multiplier: 3, totalPoints: 64, basePoints: 21, bonusPoints: 43, isOnline: true },

  // 2x Ride Share (applies to all currencies per statement)
  { date: "2025-09-03", merchant: "Lyft", amount: 29.87, currency: "CAD", paymentAmount: 29.87, paymentCurrency: "CAD", mccCode: MCC_CODES.RIDE_SHARE, category: "Ride Share", multiplier: 2, totalPoints: 60, basePoints: 30, bonusPoints: 30, isOnline: true, address: "Vancouver" },
  { date: "2025-09-05", merchant: "Lyft", amount: 8.95, currency: "CAD", paymentAmount: 8.95, paymentCurrency: "CAD", mccCode: MCC_CODES.RIDE_SHARE, category: "Ride Share", multiplier: 2, totalPoints: 18, basePoints: 9, bonusPoints: 9, isOnline: true, address: "Vancouver" },
  { date: "2025-09-05", merchant: "Lyft", amount: 17.10, currency: "CAD", paymentAmount: 17.10, paymentCurrency: "CAD", mccCode: MCC_CODES.RIDE_SHARE, category: "Ride Share", multiplier: 2, totalPoints: 34, basePoints: 17, bonusPoints: 17, isOnline: true, address: "Vancouver" },
  { date: "2025-09-09", merchant: "Uber", amount: 20.47, currency: "USD", paymentAmount: 29.01, paymentCurrency: "CAD", mccCode: MCC_CODES.RIDE_SHARE, category: "Ride Share", multiplier: 2, totalPoints: 58, basePoints: 29, bonusPoints: 29, isOnline: true },
  { date: "2025-09-14", merchant: "Uber", amount: 36.91, currency: "CAD", paymentAmount: 36.91, paymentCurrency: "CAD", mccCode: MCC_CODES.RIDE_SHARE, category: "Ride Share", multiplier: 2, totalPoints: 74, basePoints: 37, bonusPoints: 37, isOnline: true },
  { date: "2025-09-24", merchant: "Lyft", amount: 18.40, currency: "CAD", paymentAmount: 18.40, paymentCurrency: "CAD", mccCode: MCC_CODES.RIDE_SHARE, category: "Ride Share", multiplier: 2, totalPoints: 37, basePoints: 18, bonusPoints: 19, isOnline: true, address: "Vancouver" },

  // 1x Other
  { date: "2025-09-09", merchant: "Goldchild Coffee Roasters", amount: 17.25, currency: "USD", paymentAmount: 24.45, paymentCurrency: "CAD", mccCode: MCC_CODES.RESTAURANT, category: "Coffee", multiplier: 1, totalPoints: 24, basePoints: 24, bonusPoints: 0, isOnline: false, address: "San Diego" },
  { date: "2025-09-09", merchant: "AZGA Service Canada", amount: 50.00, currency: "CAD", paymentAmount: 50.00, paymentCurrency: "CAD", mccCode: MCC_CODES.GOVT_SERVICES, category: "Government", multiplier: 1, totalPoints: 50, basePoints: 50, bonusPoints: 0, isOnline: false, address: "Cambridge" },
  { date: "2025-09-10", merchant: "AZGA Service Canada", amount: 8.00, currency: "CAD", paymentAmount: 8.00, paymentCurrency: "CAD", mccCode: MCC_CODES.GOVT_SERVICES, category: "Government", multiplier: 1, totalPoints: 8, basePoints: 8, bonusPoints: 0, isOnline: false, address: "Cambridge" },
  { date: "2025-09-10", merchant: "Ticketmaster", amount: 536.70, currency: "CAD", paymentAmount: 536.70, paymentCurrency: "CAD", mccCode: MCC_CODES.ENTERTAINMENT, category: "Entertainment", multiplier: 1, totalPoints: 537, basePoints: 537, bonusPoints: 0, isOnline: true, address: "Toronto" },
  { date: "2025-09-25", merchant: "Walmart", amount: 16.77, currency: "CAD", paymentAmount: 16.77, paymentCurrency: "CAD", mccCode: MCC_CODES.DEPT_STORE, category: "Department Store", multiplier: 1, totalPoints: 17, basePoints: 17, bonusPoints: 0, isOnline: false, address: "Burnaby" },
];

// Merchant cache
const merchantCache: Map<string, string> = new Map();

async function findOrCreateMerchant(tx: TransactionInput): Promise<string | null> {
  const cacheKey = tx.merchant.toLowerCase();
  if (merchantCache.has(cacheKey)) {
    return merchantCache.get(cacheKey)!;
  }

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

  const merchantId = crypto.randomUUID();
  const { error } = await supabase
    .from("merchants")
    .insert([{
      id: merchantId,
      name: tx.merchant,
      address: tx.address || null,
      mcc: { code: tx.mccCode, description: tx.category },
      mcc_code: tx.mccCode,
      is_online: tx.isOnline,
    }]);

  if (error) {
    console.error(`Error creating merchant ${tx.merchant}:`, error);
    return null;
  }

  merchantCache.set(cacheKey, merchantId);
  return merchantId;
}

async function main() {
  console.log("=".repeat(60));
  console.log("AMEX COBALT STATEMENT IMPORT");
  console.log("Statement Period: Sep 4 - Oct 3, 2025");
  console.log("=".repeat(60));

  // Find Amex Cobalt payment method
  const { data: cobalt, error: pmError } = await supabase
    .from("payment_methods")
    .select("id, name")
    .ilike("name", "%cobalt%")
    .eq("issuer", "American Express")
    .single();

  if (pmError || !cobalt) {
    console.error("❌ Amex Cobalt payment method not found!");
    return;
  }
  console.log(`✅ Found payment method: ${cobalt.name} (${cobalt.id})`);

  // Summary
  const totalAmount = transactions.reduce((sum, t) => sum + t.paymentAmount, 0);
  const totalPoints = transactions.reduce((sum, t) => sum + t.totalPoints, 0);
  console.log(`\n📊 Transactions: ${transactions.length}`);
  console.log(`💰 Total: $${totalAmount.toFixed(2)}`);
  console.log(`⭐ Points: ${totalPoints}`);

  // Import
  console.log("\n🚀 Starting import...\n");

  let imported = 0;
  let failed = 0;

  for (const tx of transactions) {
    const merchantId = await findOrCreateMerchant(tx);
    if (!merchantId) {
      failed++;
      continue;
    }

    const { error } = await supabase
      .from("transactions")
      .insert([{
        date: tx.date,
        merchant_id: merchantId,
        amount: tx.amount,
        currency: tx.currency,
        payment_method_id: cobalt.id,
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
      }]);

    if (error) {
      console.error(`❌ ${tx.date}: ${tx.merchant} - ${error.message}`);
      failed++;
    } else {
      console.log(`✅ ${tx.date}: ${tx.merchant} - $${tx.paymentAmount} (${tx.totalPoints} pts)`);
      imported++;
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log(`Import complete: ${imported} imported, ${failed} failed`);
  console.log("=".repeat(60));
}

main();
