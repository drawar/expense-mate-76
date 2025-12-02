/**
 * Script to seed initial conversion rates
 * 
 * This script populates common conversion rates between reward currencies
 * and miles programs to enable the Card Optimizer Simulator.
 * 
 * Conversion rates are based on actual transfer partner ratios as of 2024.
 * These rates represent how many miles you receive per reward point.
 * 
 * Usage:
 *   npm run tsx src/scripts/seedConversionRates.ts
 */

import { ConversionService, MilesCurrency } from "@/core/currency/ConversionService";

/**
 * Common reward currencies and their conversion rates to various miles programs
 * 
 * Note: Most premium credit card programs offer 1:1 transfers to airline partners.
 * Some programs may have promotional bonuses (e.g., 1:1.25) but we use standard rates here.
 */
const INITIAL_CONVERSION_RATES: Array<{
  rewardCurrency: string;
  rates: Partial<Record<MilesCurrency, number>>;
}> = [
  // Citi ThankYou Points (US & Singapore)
  {
    rewardCurrency: "Citi ThankYou Points",
    rates: {
      KrisFlyer: 1.0,      // 1:1 transfer to Singapore Airlines KrisFlyer
      AsiaMiles: 1.0,      // 1:1 transfer to Cathay Pacific Asia Miles
      Avios: 1.0,          // 1:1 transfer to British Airways Avios
      FlyingBlue: 1.0,     // 1:1 transfer to Air France-KLM Flying Blue
      Aeroplan: 1.0,       // 1:1 transfer to Air Canada Aeroplan
      Velocity: 1.0,       // 1:1 transfer to Virgin Australia Velocity
    },
  },
  
  // American Express Membership Rewards (US, Canada, Singapore)
  {
    rewardCurrency: "Membership Rewards",
    rates: {
      KrisFlyer: 1.0,      // 1:1 transfer to Singapore Airlines KrisFlyer
      AsiaMiles: 1.0,      // 1:1 transfer to Cathay Pacific Asia Miles
      Avios: 1.0,          // 1:1 transfer to British Airways Avios
      FlyingBlue: 1.0,     // 1:1 transfer to Air France-KLM Flying Blue
      Aeroplan: 1.0,       // 1:1 transfer to Air Canada Aeroplan
      Velocity: 1.0,       // 1:1 transfer to Virgin Australia Velocity
    },
  },
  
  // Chase Ultimate Rewards (US)
  {
    rewardCurrency: "Chase Ultimate Rewards",
    rates: {
      KrisFlyer: 1.0,      // 1:1 transfer to Singapore Airlines KrisFlyer
      AsiaMiles: 1.0,      // 1:1 transfer to Cathay Pacific Asia Miles
      Avios: 1.0,          // 1:1 transfer to British Airways Avios
      FlyingBlue: 1.0,     // 1:1 transfer to Air France-KLM Flying Blue
      Aeroplan: 1.0,       // 1:1 transfer to Air Canada Aeroplan
      Velocity: 1.0,       // 1:1 transfer to Virgin Australia Velocity
    },
  },
  
  // Capital One Miles (US, Canada)
  {
    rewardCurrency: "Capital One Miles",
    rates: {
      KrisFlyer: 1.0,      // 1:1 transfer to Singapore Airlines KrisFlyer
      AsiaMiles: 1.0,      // 1:1 transfer to Cathay Pacific Asia Miles
      Avios: 1.0,          // 1:1 transfer to British Airways Avios
      FlyingBlue: 1.0,     // 1:1 transfer to Air France-KLM Flying Blue
      Aeroplan: 1.0,       // 1:1 transfer to Air Canada Aeroplan
      Velocity: 1.0,       // 1:1 transfer to Virgin Australia Velocity
    },
  },
  
  // Bilt Rewards Points (US)
  {
    rewardCurrency: "Bilt Rewards Points",
    rates: {
      KrisFlyer: 1.0,      // 1:1 transfer to Singapore Airlines KrisFlyer
      AsiaMiles: 1.0,      // 1:1 transfer to Cathay Pacific Asia Miles
      Avios: 1.0,          // 1:1 transfer to British Airways Avios
      FlyingBlue: 1.0,     // 1:1 transfer to Air France-KLM Flying Blue
      Aeroplan: 1.0,       // 1:1 transfer to Air Canada Aeroplan
      Velocity: 1.0,       // 1:1 transfer to Virgin Australia Velocity
    },
  },
  
  // Wells Fargo Autograph Points (US)
  {
    rewardCurrency: "Wells Fargo Autograph Points",
    rates: {
      KrisFlyer: 1.0,      // 1:1 transfer to Singapore Airlines KrisFlyer
      AsiaMiles: 1.0,      // 1:1 transfer to Cathay Pacific Asia Miles
      Avios: 1.0,          // 1:1 transfer to British Airways Avios
      FlyingBlue: 1.0,     // 1:1 transfer to Air France-KLM Flying Blue
      Aeroplan: 1.0,       // 1:1 transfer to Air Canada Aeroplan
      Velocity: 1.0,       // 1:1 transfer to Virgin Australia Velocity
    },
  },
  
  // Marriott Bonvoy Points (Global)
  // Note: Marriott has a 3:1 transfer ratio to most airlines
  {
    rewardCurrency: "Marriott Bonvoy Points",
    rates: {
      KrisFlyer: 0.3333,   // 3:1 transfer ratio (3 Bonvoy = 1 KrisFlyer mile)
      AsiaMiles: 0.3333,   // 3:1 transfer ratio
      Avios: 0.3333,       // 3:1 transfer ratio
      FlyingBlue: 0.3333,  // 3:1 transfer ratio
      Aeroplan: 0.3333,    // 3:1 transfer ratio
      Velocity: 0.3333,    // 3:1 transfer ratio
    },
  },
  
  // Hilton Honors Points (Global)
  // Note: Hilton has a 10:1 transfer ratio to most airlines
  {
    rewardCurrency: "Hilton Honors Points",
    rates: {
      KrisFlyer: 0.1,      // 10:1 transfer ratio (10 Honors = 1 KrisFlyer mile)
      AsiaMiles: 0.1,      // 10:1 transfer ratio
      Avios: 0.1,          // 10:1 transfer ratio
      FlyingBlue: 0.1,     // 10:1 transfer ratio
      Aeroplan: 0.1,       // 10:1 transfer ratio
      Velocity: 0.1,       // 10:1 transfer ratio
    },
  },
  
  // IHG One Rewards Points (Global)
  // Note: IHG typically doesn't transfer to airlines, but if they did it would be poor value
  // Omitting IHG as they don't have airline transfer partners
  
  // Discover Cashback Bonus (US)
  // Note: Discover doesn't transfer to airlines - cashback only
  // Omitting Discover as it's a cashback program
  
  // Bank of America Premium Rewards Points (US)
  {
    rewardCurrency: "Bank of America Premium Rewards Points",
    rates: {
      KrisFlyer: 1.0,      // 1:1 transfer to Singapore Airlines KrisFlyer
      AsiaMiles: 1.0,      // 1:1 transfer to Cathay Pacific Asia Miles
      Avios: 1.0,          // 1:1 transfer to British Airways Avios
      FlyingBlue: 1.0,     // 1:1 transfer to Air France-KLM Flying Blue
      Aeroplan: 1.0,       // 1:1 transfer to Air Canada Aeroplan
      Velocity: 1.0,       // 1:1 transfer to Virgin Australia Velocity
    },
  },
  
  // TD Rewards Points (Canada)
  // Note: TD has varying transfer ratios depending on the program
  {
    rewardCurrency: "TD Rewards Points",
    rates: {
      KrisFlyer: 1.0,      // 1:1 transfer (TD First Class Travel)
      AsiaMiles: 1.0,      // 1:1 transfer
      Avios: 1.0,          // 1:1 transfer
      FlyingBlue: 1.0,     // 1:1 transfer
      Aeroplan: 1.0,       // 1:1 transfer
      Velocity: 1.0,       // 1:1 transfer
    },
  },
  
  // RBC Avion Points (Canada)
  {
    rewardCurrency: "RBC Avion Points",
    rates: {
      KrisFlyer: 1.0,      // 1:1 transfer to Singapore Airlines KrisFlyer
      AsiaMiles: 1.0,      // 1:1 transfer to Cathay Pacific Asia Miles
      Avios: 1.0,          // 1:1 transfer to British Airways Avios
      FlyingBlue: 1.0,     // 1:1 transfer to Air France-KLM Flying Blue
      Aeroplan: 1.0,       // 1:1 transfer to Air Canada Aeroplan
      Velocity: 1.0,       // 1:1 transfer to Virgin Australia Velocity
    },
  },
  
  // HSBC Rewards Points (Global)
  {
    rewardCurrency: "HSBC Rewards Points",
    rates: {
      KrisFlyer: 1.0,      // 1:1 transfer to Singapore Airlines KrisFlyer
      AsiaMiles: 1.0,      // 1:1 transfer to Cathay Pacific Asia Miles
      Avios: 1.0,          // 1:1 transfer to British Airways Avios
      FlyingBlue: 1.0,     // 1:1 transfer to Air France-KLM Flying Blue
      Aeroplan: 1.0,       // 1:1 transfer to Air Canada Aeroplan
      Velocity: 1.0,       // 1:1 transfer to Virgin Australia Velocity
    },
  },
  
  // DBS Points (Singapore)
  {
    rewardCurrency: "DBS Points",
    rates: {
      KrisFlyer: 0.4,      // 2.5:1 transfer ratio (2.5 DBS = 1 KrisFlyer mile)
      AsiaMiles: 0.4,      // 2.5:1 transfer ratio
      Avios: 0.4,          // 2.5:1 transfer ratio
      FlyingBlue: 0.4,     // 2.5:1 transfer ratio
      Aeroplan: 0.4,       // 2.5:1 transfer ratio
      Velocity: 0.4,       // 2.5:1 transfer ratio
    },
  },
  
  // OCBC$ (Singapore)
  {
    rewardCurrency: "OCBC$",
    rates: {
      KrisFlyer: 0.4,      // 2.5:1 transfer ratio (S$2.50 OCBC$ = 1 KrisFlyer mile)
      AsiaMiles: 0.4,      // 2.5:1 transfer ratio
      Avios: 0.4,          // 2.5:1 transfer ratio
      FlyingBlue: 0.4,     // 2.5:1 transfer ratio
      Aeroplan: 0.4,       // 2.5:1 transfer ratio
      Velocity: 0.4,       // 2.5:1 transfer ratio
    },
  },
  
  // UOB PRVI Miles (Singapore)
  {
    rewardCurrency: "UOB PRVI Miles",
    rates: {
      KrisFlyer: 1.0,      // 1:1 transfer to Singapore Airlines KrisFlyer
      AsiaMiles: 1.0,      // 1:1 transfer to Cathay Pacific Asia Miles
      Avios: 1.0,          // 1:1 transfer to British Airways Avios
      FlyingBlue: 1.0,     // 1:1 transfer to Air France-KLM Flying Blue
      Aeroplan: 1.0,       // 1:1 transfer to Air Canada Aeroplan
      Velocity: 1.0,       // 1:1 transfer to Virgin Australia Velocity
    },
  },
];

/**
 * Seed conversion rates into the database
 */
async function seedConversionRates() {
  console.log("Starting conversion rate seeding...");
  
  const conversionService = ConversionService.getInstance();
  
  try {
    // Collect all updates
    const updates: Array<{
      rewardCurrency: string;
      milesCurrency: MilesCurrency;
      rate: number;
    }> = [];

    for (const { rewardCurrency, rates } of INITIAL_CONVERSION_RATES) {
      for (const [milesCurrency, rate] of Object.entries(rates)) {
        if (rate !== undefined) {
          updates.push({
            rewardCurrency,
            milesCurrency: milesCurrency as MilesCurrency,
            rate,
          });
        }
      }
    }

    console.log(`Seeding ${updates.length} conversion rates...`);
    
    // Batch update all rates
    await conversionService.batchUpdateConversionRates(updates);
    
    console.log("✓ Conversion rates seeded successfully!");
    console.log(`  - ${INITIAL_CONVERSION_RATES.length} reward currencies`);
    console.log(`  - ${updates.length} total conversion rates`);
    
    // Verify by loading all rates
    const allRates = await conversionService.getAllConversionRates();
    console.log("\nVerification:");
    console.log(`  - Loaded ${Object.keys(allRates).length} reward currencies from database`);
    
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
