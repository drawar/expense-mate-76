/**
 * Debug script to check simulator display values
 * Run with: npx tsx src/scripts/debugSimulatorDisplay.ts
 */

import {
  SimulatorService,
  SimulationInput,
} from "@/core/currency/SimulatorService";
import { ConversionService } from "@/core/currency/ConversionService";
import { initializeRewardSystem } from "@/core/rewards";
import { rewardService } from "@/core/rewards/RewardService";
import { MonthlySpendingTracker } from "@/core/rewards/MonthlySpendingTracker";
import { supabase } from "@/integrations/supabase/client";

async function debugSimulatorDisplay() {
  console.log("🔍 Debugging Simulator Display Issue...\n");

  try {
    // Initialize reward system
    await initializeRewardSystem();
    console.log("✅ Reward system initialized\n");

    // Get payment methods from database
    const { data: paymentMethods, error } = await supabase
      .from("payment_methods")
      .select("*")
      .eq("active", true);

    if (error) {
      throw new Error(`Failed to fetch payment methods: ${error.message}`);
    }

    if (!paymentMethods || paymentMethods.length === 0) {
      console.log("❌ No active payment methods found");
      return;
    }

    console.log(`📋 Found ${paymentMethods.length} active payment methods\n`);

    // Create simulator service
    const conversionService = ConversionService.getInstance();
    const monthlySpendingTracker = MonthlySpendingTracker.getInstance();
    const simulatorService = new SimulatorService(
      rewardService,
      conversionService,
      monthlySpendingTracker
    );

    // Test with a grocery purchase (like in your screenshot)
    const simulationInput: SimulationInput = {
      merchantName: "Test Grocery Store",
      mcc: "5411", // Grocery stores
      isOnline: false,
      amount: 22.78,
      currency: "CAD",
      isContactless: false,
      date: new Date(),
    };

    console.log("📊 Test Transaction:");
    console.log(`  Merchant: ${simulationInput.merchantName}`);
    console.log(
      `  Amount: $${simulationInput.amount} ${simulationInput.currency}`
    );
    console.log(`  MCC: ${simulationInput.mcc}`);
    console.log(`  Date: ${simulationInput.date.toISOString()}\n`);

    // Run simulation
    console.log("🔄 Running simulation...\n");
    const results = await simulatorService.simulateAllCards(
      simulationInput,
      paymentMethods,
      "Aeroplan"
    );

    // Display detailed results
    console.log("=".repeat(80));
    console.log("DETAILED RESULTS");
    console.log("=".repeat(80));

    results.forEach((result, index) => {
      console.log(
        `\n${index + 1}. ${result.paymentMethod.name} (${result.paymentMethod.issuer})`
      );
      console.log(`   Rank: #${result.rank}`);
      console.log(`   ---`);
      console.log(`   Base Points: ${result.calculation.basePoints}`);
      console.log(`   Bonus Points: ${result.calculation.bonusPoints}`);
      console.log(
        `   TOTAL POINTS: ${result.calculation.totalPoints} ${result.calculation.pointsCurrency}`
      );
      console.log(`   ---`);
      console.log(
        `   Conversion Rate: ${result.conversionRate !== null ? result.conversionRate.toFixed(2) : "N/A"}`
      );
      console.log(
        `   CONVERTED MILES: ${result.convertedMiles !== null ? Math.round(result.convertedMiles).toLocaleString() : "N/A"} Aeroplan`
      );

      if (result.calculation.appliedTier) {
        console.log(
          `   Applied Tier: ${JSON.stringify(result.calculation.appliedTier)}`
        );
      }

      if (
        result.calculation.messages &&
        result.calculation.messages.length > 0
      ) {
        console.log(`   Messages: ${result.calculation.messages.join(", ")}`);
      }

      if (result.error) {
        console.log(`   ❌ Error: ${result.error}`);
      }

      console.log(`   ---`);
      console.log(
        `   What UI should show: ${result.convertedMiles !== null ? Math.round(result.convertedMiles).toLocaleString() : "N/A"} Aeroplan miles`
      );
    });

    console.log("\n" + "=".repeat(80));
    console.log("\n✅ Debug complete!");
  } catch (error) {
    console.error("❌ Error during debugging:", error);
    throw error;
  }
}

// Run the debug script
debugSimulatorDisplay()
  .then(() => {
    console.log("\n🎉 Debug script completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Debug script failed:", error);
    process.exit(1);
  });
