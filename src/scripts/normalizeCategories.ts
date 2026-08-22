/**
 * Normalize non-standard user_category values to the canonical Clairo set.
 *
 * Canonical categories (matches the category-system skill):
 *   Essentials:   Groceries, Housing, Utilities, Transportation, Healthcare
 *   Lifestyle:    Dining Out, Fast Food & Takeout, Food Delivery,
 *                 Entertainment, Hobbies & Recreation, Travel & Vacation
 *   Home&Living:  Home Essentials, Furniture & Decor, Home Improvement, Pet Care
 *   Personal:     Clothing & Shoes, Beauty & Personal Care, Gym & Fitness
 *   Work/Edu:     Professional Development, Work Expenses, Education
 *   Financial:    Subscriptions & Memberships, Financial Services, Insurance,
 *                 Gifts & Donations, Cash & ATM, Fees & Charges, Shopping
 *
 * Run with: npx tsx src/scripts/normalizeCategories.ts
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

// Bulk category → canonical category renames.
// Applied via a single UPDATE per source category.
const CATEGORY_RENAMES: Record<string, string> = {
  "Ride Share": "Transportation",
  Restaurants: "Dining Out",
  "Restaurants & Eating Places": "Dining Out",
  "Grocery Stores & Supermarkets": "Groceries",
  Transit: "Transportation",
  Streaming: "Subscriptions & Memberships",
  Subscriptions: "Subscriptions & Memberships",
  Subscription: "Subscriptions & Memberships",
  Phone: "Utilities",
  Rent: "Housing",
  "Drug Stores & Pharmacies": "Healthcare",
  "Air France": "Travel & Vacation",
  "Department Store": "Shopping",
  Liquor: "Groceries", // BC Liquor Store — treat as Groceries
  "Food & Drink": "Fast Food & Takeout", // sole tx is Bubble Tasty Tea (MCC 5814)
};

// Per-merchant overrides for the "Home" category (10 tx across furniture vs cleaning appliance).
interface MerchantOverride {
  merchantName: string;
  fromCategory: string;
  toCategory: string;
}
const MERCHANT_OVERRIDES: MerchantOverride[] = [
  {
    merchantName: "Fable Home",
    fromCategory: "Home",
    toCategory: "Furniture & Decor",
  },
  {
    merchantName: "Urban Barn",
    fromCategory: "Home",
    toCategory: "Furniture & Decor",
  },
  {
    merchantName: "West Elm",
    fromCategory: "Home",
    toCategory: "Furniture & Decor",
  },
  {
    merchantName: "Dupray",
    fromCategory: "Home",
    toCategory: "Home Essentials",
  },
  {
    merchantName: "Sonos",
    fromCategory: "Electronics",
    toCategory: "Home Essentials",
  },
  {
    merchantName: "Immigration Canada",
    fromCategory: "Government",
    toCategory: "Fees & Charges",
  },
  {
    merchantName: "Rexall Post Office",
    fromCategory: "Other",
    toCategory: "Healthcare",
  },
];

async function main() {
  console.log("Step 1: bulk category renames\n");
  for (const [from, to] of Object.entries(CATEGORY_RENAMES)) {
    const { count: before } = await supabase
      .from("transactions")
      .select("*", { count: "exact", head: true })
      .eq("user_category", from);
    if (!before) {
      console.log(`  (skip) "${from}" → "${to}" (no rows)`);
      continue;
    }
    const { error } = await supabase
      .from("transactions")
      .update({ user_category: to })
      .eq("user_category", from);
    if (error) {
      console.error(`  ✗ "${from}" → "${to}": ${error.message}`);
      continue;
    }
    console.log(`  ✓ ${before.toString().padStart(4)}x  "${from}" → "${to}"`);
  }

  console.log("\nStep 2: per-merchant overrides\n");
  for (const o of MERCHANT_OVERRIDES) {
    // Look up merchant id
    const { data: merchant } = await supabase
      .from("merchants")
      .select("id")
      .eq("name", o.merchantName)
      .single();
    if (!merchant) {
      console.log(`  (skip) ${o.merchantName} — merchant not found`);
      continue;
    }

    const { count: before } = await supabase
      .from("transactions")
      .select("*", { count: "exact", head: true })
      .eq("merchant_id", merchant.id)
      .eq("user_category", o.fromCategory);
    if (!before) {
      console.log(
        `  (skip) ${o.merchantName} (${o.fromCategory}→${o.toCategory}) — 0 matching`
      );
      continue;
    }
    const { error } = await supabase
      .from("transactions")
      .update({ user_category: o.toCategory })
      .eq("merchant_id", merchant.id)
      .eq("user_category", o.fromCategory);
    if (error) {
      console.error(`  ✗ ${o.merchantName}: ${error.message}`);
      continue;
    }
    console.log(
      `  ✓ ${before.toString().padStart(4)}x  ${o.merchantName}: "${o.fromCategory}" → "${o.toCategory}"`
    );
  }

  // Final distribution
  console.log("\nFinal category distribution:");
  const { data } = await supabase.from("transactions").select("user_category");
  const counts: Record<string, number> = {};
  for (const t of data ?? [])
    counts[t.user_category ?? "(null)"] =
      (counts[t.user_category ?? "(null)"] || 0) + 1;
  for (const [cat, c] of Object.entries(counts).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${c.toString().padStart(4)}  ${cat}`);
  }
}

main();
