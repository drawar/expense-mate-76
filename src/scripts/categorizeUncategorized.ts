/**
 * Categorize all transactions where user_category IS NULL.
 *
 * Uses merchant name + web research to map each merchant to a standard category
 * aligned with the Clairo category system:
 *   Essentials: Groceries, Housing, Utilities, Transportation, Healthcare
 *   Lifestyle: Dining Out, Fast Food & Takeout, Food Delivery, Entertainment,
 *              Hobbies & Recreation, Travel & Vacation
 *   Home & Living: Home Essentials, Furniture & Decor, Home Improvement
 *   Personal Care: Clothing & Shoes, Beauty & Personal Care, Gym & Fitness
 *   Work & Education: Education, Professional Development
 *   Financial & Other: Subscriptions & Memberships, Financial Services,
 *                      Insurance, Gifts & Donations, Fees & Charges, Shopping
 *
 * Run with: npx tsx src/scripts/categorizeUncategorized.ts
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

// Merchant name → category. Grouped by category for readability.
const MERCHANT_CATEGORIES: Record<string, string> = {
  // ────────────── GROCERIES ──────────────
  // Grocery stores + convenience + meal kits (all ingredient-level food)
  "PriceSmart Foods": "Groceries",
  "T&T Supermarket": "Groceries",
  "Save-On-Foods": "Groceries",
  "Lucky Supermarket": "Groceries",
  Safeway: "Groceries",
  Costco: "Groceries",
  "Metro Plus ETS": "Groceries",
  Instacart: "Groceries",
  Goodfood: "Groceries",
  HelloFresh: "Groceries",
  "Chefs Plate": "Groceries",
  Oddbunch: "Groceries",
  "Toko Bersama": "Groceries",
  "Épicerie Pumpui": "Groceries",
  "FamilyMart Taiwan (Zhongshan)": "Groceries",
  GS25: "Groceries",
  "Body Energy Club": "Groceries", // per MCC 5411 (smoothies/health foods)

  // ────────────── DINING OUT (sit-down restaurants, bars, cafes) ──────────────
  "Joyeaux Cafe & Restaurant": "Dining Out",
  "La Belle Tonki": "Dining Out",
  "No Ne Kitchen and Bar": "Dining Out",
  "No 1. Beef Noodle House": "Dining Out",
  "Ryu ADM (YUL Airport)": "Dining Out",
  "per se Social Corner": "Dining Out",
  Mijoté: "Dining Out",
  "Café Myriade": "Dining Out",
  "Café Le Falco": "Dining Out",
  Sameeatery: "Dining Out",
  "Giovane Cafe": "Dining Out",
  "Shingen Shabu (Da'an)": "Dining Out",
  "Wanke Shabu (Taichung Guo'an)": "Dining Out",
  "Din Tai Fung (Taipei 101)": "Dining Out",
  Modavie: "Dining Out",
  "Mangos Kitchen Bar": "Dining Out",
  "Nen Authentic Vietnam": "Dining Out",
  "B&D Authentic Vietnamese": "Dining Out",
  "Pho Quynh Express": "Dining Out",
  "Mai Xiang Dumpling": "Dining Out",
  "Le Red Tiger": "Dining Out",
  Damggot: "Dining Out",
  "Galbi Korean BBQ": "Dining Out",
  Krapow: "Dining Out",
  "Green Leaf Sushi": "Dining Out",
  "Big Way Hot Pot": "Dining Out",
  Joey: "Dining Out",
  "Zab Bite": "Dining Out",
  "Wander Kitchen & Bar (YYC)": "Dining Out",
  "The George at Columbia": "Dining Out",
  Ibéricos: "Dining Out",
  "Yokato Yokabai": "Dining Out",
  "The Fountainhead Pub": "Dining Out",
  "Pasta Pooks": "Dining Out",
  MIX: "Dining Out",
  Ellipsis: "Dining Out",
  "Barra Gitano": "Dining Out",
  "Bodega On Main": "Dining Out",
  "La Tortilleria": "Dining Out",
  "La Graine Brûlée": "Dining Out",
  "Desserts Artisanaux": "Dining Out",

  // ────────────── FAST FOOD & TAKEOUT (quick-service coffee shops, bakeries) ──────────────
  "Café Éclair": "Fast Food & Takeout",
  "49th Parallel Coffee": "Fast Food & Takeout",
  "49th Parallel Coffee (Montréal)": "Fast Food & Takeout",
  "Analog Coffee Yaletown": "Fast Food & Takeout",
  "Good Earth Coffeehouse (Robson)": "Fast Food & Takeout",
  "Honolulu Coffee (Olympic Village)": "Fast Food & Takeout",
  "Passione Gelato": "Fast Food & Takeout",
  "Trees Organic Coffee (450 Granville)": "Fast Food & Takeout",
  "Café des Habitudes": "Fast Food & Takeout",
  "CHICHA San Chen (Taichung Flagship)": "Fast Food & Takeout",
  "Bam Bam": "Fast Food & Takeout",
  "Slo Coffee Granville": "Fast Food & Takeout",
  "Poke Bowl": "Fast Food & Takeout",
  "Bisou Bakehouse (Robson)": "Fast Food & Takeout",
  "Breka Bakery": "Fast Food & Takeout",
  "Small Victory Bakery": "Fast Food & Takeout",
  "Nemesis Coffee (Gastown)": "Fast Food & Takeout",
  "Matcha Cafe Maiko": "Fast Food & Takeout",
  "Earnest Ice Cream": "Fast Food & Takeout",

  // ────────────── FOOD DELIVERY ──────────────
  "Uber Eats": "Food Delivery",

  // ────────────── TRANSPORTATION (transit + rideshare — matches user's most common convention) ──────────────
  Uber: "Transportation",
  Lyft: "Transportation",
  Grab: "Transportation",
  Bolt: "Transportation",
  Compass: "Transportation",
  "STM (Montreal Transit)": "Transportation",
  Caltrain: "Transportation",
  "OVpay (Amsterdam Transit)": "Transportation",
  "Service Navigo": "Transportation",
  RENFE: "Transportation",

  // ────────────── TRAVEL & VACATION ──────────────
  "Air Canada": "Travel & Vacation",
  "United Airlines": "Travel & Vacation",
  "EVA Air": "Travel & Vacation",
  "Qatar Airways": "Travel & Vacation",
  "Hyatt Centric Montreal": "Travel & Vacation",
  "Hyatt Regency San Francisco Downtown SOMA": "Travel & Vacation",
  "Shangri-La Far Eastern Taipei": "Travel & Vacation",
  "Four Points by Sheraton Josun, Seoul Myeongdong": "Travel & Vacation",
  "Hotels.ca": "Travel & Vacation",
  Expedia: "Travel & Vacation",
  "Extime Duty Free Paris": "Travel & Vacation", // airport duty free while traveling
  "American Express Travel": "Travel & Vacation",

  // ────────────── ENTERTAINMENT ──────────────
  TodayTix: "Entertainment",
  "Ticketpro.ca": "Entertainment",
  "Ryan Beatty (Concert)": "Entertainment",
  "Basilique Notre-Dame de Montréal": "Entertainment", // tourist attraction ticket
  "Hyrox Singapore": "Entertainment", // sports event

  // ────────────── HOBBIES & RECREATION ──────────────
  "Neptoon Records": "Hobbies & Recreation",
  "Librairie Bertrand": "Hobbies & Recreation",

  // ────────────── CLOTHING & SHOES ──────────────
  Lululemon: "Clothing & Shoes",
  "Lululemon Canada": "Clothing & Shoes",
  "Zara Robson St": "Clothing & Shoes",
  "Abercrombie & Fitch (Pacific Centre)": "Clothing & Shoes",
  "Uniqlo Canada": "Clothing & Shoes",
  "Browns Shoes": "Clothing & Shoes",

  // ────────────── BEAUTY & PERSONAL CARE ──────────────
  "YùYù Perfumer": "Beauty & Personal Care",
  "Olive Young": "Beauty & Personal Care",
  "Salon De Nuvida": "Beauty & Personal Care",
  "New Shanghai Barbershop": "Beauty & Personal Care",
  "Optima Wellness Museum": "Beauty & Personal Care",
  "Cellin Clinic Myeongdong": "Beauty & Personal Care",

  // ────────────── GYM & FITNESS ──────────────
  Equinox: "Gym & Fitness",

  // ────────────── HEALTHCARE ──────────────
  "Rexall Pharmacy #7163 (Station Square)": "Healthcare",
  "Segyeo Pharmacy": "Healthcare",
  "Ready Young Pharmacy": "Healthcare",
  "Pharmacie Avenue de l'Opera": "Healthcare",

  // ────────────── UTILITIES ──────────────
  Airalo: "Utilities", // eSIM (telecom)
  "Bell Mobility": "Utilities", // phone
  "Chexy (BC Hydro)": "Utilities",
  "Chexy Utility": "Utilities",

  // ────────────── HOUSING ──────────────
  "Chexy (Trong Dong Nguyen)": "Housing", // rent
  "Chexy (Broadview)": "Housing", // rent via Chexy
  "Chexy (Enerpro Systems)": "Housing", // rent via Chexy

  // ────────────── SUBSCRIPTIONS & MEMBERSHIPS ──────────────
  Netflix: "Subscriptions & Memberships",
  Audible: "Subscriptions & Memberships",
  "Amazon.ca Prime Membership": "Subscriptions & Memberships",
  Adobe: "Subscriptions & Memberships",
  "Apple iCloud Subscription": "Subscriptions & Memberships",
  "Uber One Membership": "Subscriptions & Memberships",
  AMA: "Subscriptions & Memberships", // Alberta Motor Association membership

  // ────────────── FINANCIAL SERVICES ──────────────
  "American Express": "Financial Services", // annual fees, membership fees
  "Amaze (Instarem)": "Financial Services", // Amaze processing fee
  "DBS Overseas Shop & Dine Promotion": "Financial Services",
  "Points Development US": "Financial Services", // Amex MR points adjustments
  "Thinking Canada": "Financial Services", // collections/subscription — unclear, financial catchall

  // ────────────── FEES & CHARGES ──────────────
  RBC: "Fees & Charges", // Purchase Interest

  // ────────────── SHOPPING (department stores, marketplaces) ──────────────
  Amazon: "Shopping",
  Walmart: "Shopping",
  "Best Buy Marketplace": "Shopping",
  "Pacific SOGO Zhongxiao": "Shopping",
  Shippsy: "Shopping", // cross-border courier for shopping

  // ────────────── FURNITURE & DECOR / HOME ESSENTIALS / HOME IMPROVEMENT ──────────────
  IKEA: "Furniture & Decor",
  "Zwilling J.A. Henckels": "Home Essentials", // knives/cookware
  Daiso: "Home Essentials", // variety/household
  TaskRabbit: "Home Improvement", // hired help for home tasks

  // ────────────── GIFTS & DONATIONS ──────────────
  "VVG Village (National Taichung Theater)": "Gifts & Donations", // MCC 5947 gift shop

  // ────────────── EDUCATION ──────────────
  "Broadway Driving School": "Education",
};

async function main() {
  // Fetch all null user_category transactions with merchant names
  const { data: uncategorized, error } = await supabase
    .from("transactions")
    .select("id, merchant_id, merchants(name)")
    .is("user_category", null);
  if (error) throw error;
  console.log(
    `Found ${uncategorized?.length ?? 0} transactions with null user_category.\n`
  );

  const stats: Record<string, number> = {};
  const missingMerchants = new Set<string>();
  const updates: { id: string; category: string }[] = [];

  for (const t of uncategorized ?? []) {
    const merchant = t.merchants as { name?: string | null } | null | undefined;
    const merchantName = merchant?.name;
    if (!merchantName) {
      missingMerchants.add("(no merchant)");
      continue;
    }
    const category = MERCHANT_CATEGORIES[merchantName];
    if (!category) {
      missingMerchants.add(merchantName);
      continue;
    }
    updates.push({ id: t.id, category });
    stats[category] = (stats[category] || 0) + 1;
  }

  console.log(
    `Prepared ${updates.length} updates across ${Object.keys(stats).length} categories:`
  );
  for (const [cat, count] of Object.entries(stats).sort(
    (a, b) => b[1] - a[1]
  )) {
    console.log(`  ${count.toString().padStart(4)}  ${cat}`);
  }

  if (missingMerchants.size > 0) {
    console.log(
      `\n⚠️  ${missingMerchants.size} merchants NOT in mapping — will be left as null:`
    );
    for (const m of [...missingMerchants].sort()) console.log(`  - ${m}`);
  }

  console.log(`\nApplying ${updates.length} updates...`);
  let success = 0,
    errors = 0;
  // Batch updates in groups of 50
  for (let i = 0; i < updates.length; i += 50) {
    const batch = updates.slice(i, i + 50);
    for (const u of batch) {
      const { error: e } = await supabase
        .from("transactions")
        .update({ user_category: u.category })
        .eq("id", u.id);
      if (e) {
        errors++;
        console.error(`  ✗ ${u.id}: ${e.message}`);
      } else success++;
    }
    if (i + 50 < updates.length) process.stdout.write(`  ...${i + 50} done\r`);
  }
  console.log(
    `\nDone! ${success}/${updates.length} updated. ${errors} errors.`
  );
}

main();
