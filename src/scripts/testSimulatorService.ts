/**
 * Test script to verify SimulatorService functionality
 * Run with: npx tsx src/scripts/testSimulatorService.ts
 */

import { SimulatorService, SimulationInput } from "@/core/currency/SimulatorService";
import { ConversionService } from "@/core/currency/ConversionService";
import { RewardService } from "@/core/rewards/RewardService";
import { getRuleRepository } from "@/core/rewards/RuleRepository";
import { MonthlySpendingTracker } from "@/core/rewards/MonthlySpendingTracker";
import { PaymentMethod } from "@/types";

async function testSimulatorService() {
  console.log("🧪 Testing SimulatorService...\n");

  try {
    // Initialize services
    const ruleRepository = getRuleRepository();
    const rewardService = new RewardService(ruleRepository);
    const conversionService = ConversionService.getInstance();
    const monthlySpendingTracker = MonthlySpendingTracker.getInstance();

    const simulatorService = new SimulatorService(
      rewardService,
      conversionService,
      monthlySpendingTracker
    );

    console.log("✅ SimulatorService initialized successfully\n");

    // Create test payment methods
    const testPaymentMethods: PaymentMethod[] = [
      {
        id: "test-card-1",
        name: "Test Card 1",
        type: "credit_card",
        issuer: "Test Bank",
        currency: "USD",
        pointsCurrency: "Test Points",
        active: true,
      },
      {
        id: "test-card-2",
        name: "Test Card 2",
        type: "credit_card",
        issuer: "Another Bank",
        currency: "USD",
        pointsCurrency: "Reward Points",
        active: true,
      },
      {
        id: "test-card-3",
        name: "Inactive Card",
        type: "credit_card",
        issuer: "Test Bank",
        currency: "USD",
        pointsCurrency: "Points",
        active: false, // This should be filtered out
      },
    ];

    // Create test simulation input
    const simulationInput: SimulationInput = {
      merchantName: "Test Merchant",
      mcc: "5411", // Grocery stores
      isOnline: false,
      amount: 100,
      currency: "USD",
      isContactless: true,
      date: new Date(),
    };

    console.log("📊 Test Input:");
    console.log(`  Merchant: ${simulationInput.merchantName}`);
    console.log(`  Amount: $${simulationInput.amount}`);
    console.log(`  MCC: ${simulationInput.mcc}`);
    console.log(`  Online: ${simulationInput.isOnline}`);
    console.log(`  Contactless: ${simulationInput.isContactless}\n`);

    // Test simulateAllCards
    console.log("🔄 Running simulateAllCards...");
    const results = await simulatorService.simulateAllCards(
      simulationInput,
      testPaymentMethods,
      "KrisFlyer"
    );

    console.log(`✅ Received ${results.length} results\n`);

    // Verify active card filtering (Requirement 2.1)
    const activeCardsCount = testPaymentMethods.filter(pm => pm.active).length;
    if (results.length === activeCardsCount) {
      console.log("✅ Active card filtering works correctly");
      console.log(`   Expected: ${activeCardsCount}, Got: ${results.length}\n`);
    } else {
      console.log("❌ Active card filtering failed");
      console.log(`   Expected: ${activeCardsCount}, Got: ${results.length}\n`);
    }

    // Display results
    console.log("📈 Results:");
    results.forEach((result, index) => {
      console.log(`\n${index + 1}. ${result.paymentMethod.name}`);
      console.log(`   Rank: ${result.rank}`);
      console.log(`   Total Points: ${result.calculation.totalPoints} ${result.calculation.pointsCurrency}`);
      console.log(`   Base Points: ${result.calculation.basePoints}`);
      console.log(`   Bonus Points: ${result.calculation.bonusPoints}`);
      console.log(`   Converted Miles: ${result.convertedMiles !== null ? result.convertedMiles : 'N/A'}`);
      console.log(`   Conversion Rate: ${result.conversionRate !== null ? result.conversionRate : 'N/A'}`);
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
    });

    // Test ranking
    console.log("\n🏆 Testing ranking logic...");
    const withConversion = results.filter(r => r.convertedMiles !== null);
    const withoutConversion = results.filter(r => r.convertedMiles === null);
    
    console.log(`   Cards with conversion: ${withConversion.length}`);
    console.log(`   Cards without conversion: ${withoutConversion.length}`);
    
    // Verify ranking order (Requirement 4.1)
    let rankingCorrect = true;
    for (let i = 0; i < withConversion.length - 1; i++) {
      const current = withConversion[i];
      const next = withConversion[i + 1];
      if (current.convertedMiles! < next.convertedMiles!) {
        rankingCorrect = false;
        console.log(`   ❌ Ranking error: ${current.paymentMethod.name} (${current.convertedMiles}) ranked before ${next.paymentMethod.name} (${next.convertedMiles})`);
      }
    }
    
    if (rankingCorrect) {
      console.log("   ✅ Ranking is correct (descending order by miles)");
    }

    // Verify cards without conversion are at the end (Requirement 4.3)
    if (withoutConversion.length > 0) {
      const lastWithConversion = withConversion[withConversion.length - 1];
      const firstWithoutConversion = withoutConversion[0];
      if (lastWithConversion.rank < firstWithoutConversion.rank) {
        console.log("   ✅ Cards without conversion are ranked after cards with conversion");
      } else {
        console.log("   ❌ Cards without conversion should be ranked last");
      }
    }

    console.log("\n✅ All tests completed successfully!");

  } catch (error) {
    console.error("❌ Error during testing:", error);
    throw error;
  }
}

// Run the test
testSimulatorService()
  .then(() => {
    console.log("\n🎉 Test script completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Test script failed:", error);
    process.exit(1);
  });
