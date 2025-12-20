/**
 * Script to seed initial conversion rates
 *
 * This script populates conversion rates between reward currencies
 * and miles programs based on actual transfer partner ratios.
 *
 * Sources:
 * - Singapore cards: https://milelion.com/credit-cards/points-transfer-partners/
 * - Citi SG partners: https://www.citibank.com.sg/credit-cards/privileges-programs/credit-card-rewards-redemption/points-transfer.html
 * - Canadian cards: https://princeoftravel.com/points-programs/american-express-membership-rewards/
 *
 * IMPORTANT: Only include actual verified transfer partners.
 * - Aeroplan Points & Asia Miles are direct miles currencies, NOT reward points
 * - Different banks have different transfer partners
 *
 * Last updated: December 2024
 *
 * Usage:
 *   npx tsx src/scripts/seedConversionRates.ts
 */

import { createClient } from "@supabase/supabase-js";

// Create a Node.js compatible Supabase client (no localStorage)
const SUPABASE_URL = "https://yulueezoyjxobhureuxj.supabase.co";
const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl1bHVlZXpveWp4b2JodXJldXhqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIwMjM1MTEsImV4cCI6MjA3NzU5OTUxMX0.QpTFICkI0IWYdq2Me4Rp3DFrCAs_QiVZEmUywACnqAE";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

type MilesCurrency =
  | "KrisFlyer"
  | "AsiaMiles"
  | "Avios"
  | "FlyingBlue"
  | "Aeroplan"
  | "Velocity";

/**
 * Conversion rates based on actual transfer partner ratios
 *
 * Note: Rates represent how many miles you receive per reward point.
 * E.g., 0.4 means 25,000 points = 10,000 miles (10,000/25,000 = 0.4)
 *
 * ONLY include verified transfer partners for each program!
 */
const INITIAL_CONVERSION_RATES: Array<{
  rewardCurrency: string;
  rates: Partial<Record<MilesCurrency, number>>;
}> = [
  // ============================================
  // SINGAPORE CARDS
  // ============================================

  // Citi ThankYou Points (Singapore)
  // Source: https://www.citibank.com.sg/credit-cards/privileges-programs/credit-card-rewards-redemption/points-transfer.html
  // Partners: KrisFlyer, Asia Miles, Avios, Flying Blue, Etihad, EVA, Qantas, Thai, Turkish
  // NOT partners: Aeroplan, Velocity
  // All partners: 25,000 points = 10,000 miles (0.4 ratio)
  // Transfer fee: S$27.25 per transfer
  {
    rewardCurrency: "Citi ThankYou Points",
    rates: {
      KrisFlyer: 0.4, // 25,000:10,000
      AsiaMiles: 0.4, // 25,000:10,000
      Avios: 0.4, // 25,000:10,000 (British Airways & Qatar)
      FlyingBlue: 0.4, // 25,000:10,000
      // NO Aeroplan - not a Citi SG partner
      // NO Velocity - not a Citi SG partner
    },
  },

  // HSBC Rewards Points (Singapore)
  // Source: https://milelion.com/2024/12/16/hsbc-devalues-points-transfers-to-singapore-airlines-krisflyer-by-20/
  // Has 21 partners including Aeroplan (unlike Citi SG)
  // KrisFlyer devalued to 30,000:10,000 from Jan 16, 2025
  // No transfer fees (waived indefinitely)
  {
    rewardCurrency: "HSBC Rewards Points",
    rates: {
      KrisFlyer: 0.3333, // 30,000:10,000 (devalued Jan 2025)
      AsiaMiles: 0.4, // 25,000:10,000
      Avios: 0.4, // 25,000:10,000
      FlyingBlue: 0.4, // 25,000:10,000
      Aeroplan: 0.2857, // 35,000:10,000
      // Velocity - not confirmed as HSBC SG partner
    },
  },

  // DBS Points (Singapore)
  // Limited partners: mainly KrisFlyer and Asia Miles
  // 2.5:1 transfer ratio
  {
    rewardCurrency: "DBS Points",
    rates: {
      KrisFlyer: 0.4, // 2.5:1 ratio (2,500 points = 1,000 miles)
      AsiaMiles: 0.4, // 2.5:1 ratio
      // Limited partners - no Avios, Flying Blue, Aeroplan, Velocity
    },
  },

  // UOB PRVI Miles (Singapore)
  // 1:1 transfer to limited airline partners
  {
    rewardCurrency: "UOB PRVI Miles",
    rates: {
      KrisFlyer: 1.0, // 1:1 transfer
      AsiaMiles: 1.0, // 1:1 transfer
      // Limited partners - verify others before adding
    },
  },

  // ============================================
  // CANADIAN CARDS
  // ============================================

  // American Express Membership Rewards (Canada)
  // Source: https://princeoftravel.com/points-programs/american-express-membership-rewards/
  // Partners: Aeroplan (1:1), Avios (1:1), Asia Miles (1:0.75), Flying Blue (1:0.75)
  // NOT a direct partner: KrisFlyer, Velocity
  {
    rewardCurrency: "Membership Rewards Points (CA)",
    rates: {
      Aeroplan: 1.0, // 1:1 transfer - best value
      Avios: 1.0, // 1:1 transfer (British Airways)
      AsiaMiles: 0.75, // 1:0.75 transfer
      FlyingBlue: 0.75, // 1:0.75 transfer
      // NO KrisFlyer - not a direct CA Amex partner
      // NO Velocity - not a direct CA Amex partner
    },
  },

  // RBC Avion Points (Canada)
  // Partners: Avios, Asia Miles, WestJet
  // NOT partners: KrisFlyer, Aeroplan (directly)
  {
    rewardCurrency: "RBC Avion Points",
    rates: {
      Avios: 1.0, // 1:1 transfer
      AsiaMiles: 1.0, // 1:1 transfer
      // Limited partners - verify others before adding
    },
  },

  // ============================================
  // HOTEL POINTS
  // ============================================

  // Marriott Bonvoy Points (Global)
  // 3:1 transfer ratio to most airlines (60,000 = 20,000, with 5,000 bonus for 60k transfers)
  {
    rewardCurrency: "Marriott Bonvoy Points",
    rates: {
      KrisFlyer: 0.3333, // 3:1 base ratio
      AsiaMiles: 0.3333,
      Avios: 0.3333,
      FlyingBlue: 0.3333,
      Aeroplan: 0.3333,
      // Velocity - verify if Marriott partner
    },
  },
];

/**
 * Seed conversion rates into the database
 */
async function seedConversionRates() {
  console.log("Starting conversion rate seeding...");
  console.log("Sources: MileLion (SG), Citi SG, Prince of Travel (CA)");
  console.log(
    "\nNote: Only verified transfer partners are included for each program."
  );

  try {
    // Collect all updates
    const upsertData: Array<{
      reward_currency: string;
      miles_currency: string;
      conversion_rate: number;
    }> = [];

    for (const { rewardCurrency, rates } of INITIAL_CONVERSION_RATES) {
      for (const [milesCurrency, rate] of Object.entries(rates)) {
        if (rate !== undefined) {
          upsertData.push({
            reward_currency: rewardCurrency,
            miles_currency: milesCurrency,
            conversion_rate: rate,
          });
        }
      }
    }

    console.log(`\nSeeding ${upsertData.length} conversion rates...`);

    // Batch upsert all rates
    const { error } = await supabase
      .from("conversion_rates")
      .upsert(upsertData, { onConflict: "reward_currency,miles_currency" });

    if (error) {
      throw new Error(`Failed to upsert conversion rates: ${error.message}`);
    }

    console.log("\n✓ Conversion rates seeded successfully!");
    console.log(`  - ${INITIAL_CONVERSION_RATES.length} reward currencies`);
    console.log(`  - ${upsertData.length} total conversion rates`);

    // Verify by loading all rates
    const { data: allRates, error: fetchError } = await supabase
      .from("conversion_rates")
      .select("reward_currency, miles_currency, conversion_rate");

    if (fetchError) {
      console.error("Error fetching rates for verification:", fetchError);
    } else if (allRates) {
      // Group by reward currency
      const grouped: Record<string, string[]> = {};
      for (const rate of allRates) {
        if (!grouped[rate.reward_currency]) {
          grouped[rate.reward_currency] = [];
        }
        grouped[rate.reward_currency].push(rate.miles_currency);
      }

      console.log("\nVerification:");
      console.log(
        `  - Loaded ${Object.keys(grouped).length} reward currencies from database`
      );

      console.log("\nReward currencies and partners:");
      for (const currency of Object.keys(grouped).sort()) {
        const partners = grouped[currency].join(", ");
        console.log(`  - ${currency}: ${partners}`);
      }
    }
  } catch (error) {
    console.error("✗ Error seeding conversion rates:", error);
    throw error;
  }
}

// Run the seeding function
seedConversionRates()
  .then(() => {
    console.log("\nSeeding complete!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\nSeeding failed:", error);
    process.exit(1);
  });
