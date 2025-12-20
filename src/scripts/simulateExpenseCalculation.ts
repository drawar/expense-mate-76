/**
 * Diagnostic script to simulate the exact expense calculation flow
 *
 * This simulates what happens when you add an expense with the Citibank card
 */

import { supabase } from "@/integrations/supabase/client";
import { rewardService } from "@/core/rewards/RewardService";

async function simulateExpenseCalculation() {
  console.log("=== Simulating Expense Calculation ===\n");

  // Check authentication
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    console.error("❌ Not authenticated. Please log in first.");
    return;
  }
  console.log("✅ Authenticated as:", session.user.email, "\n");

  // Get the Citibank payment method
  const { data: paymentMethods, error } = await supabase
    .from("payment_methods")
    .select("*")
    .eq("issuer", "Citibank")
    .eq("name", "Rewards Visa Signature")
    .single();

  if (error || !paymentMethods) {
    console.error("❌ Error fetching payment method:", error);
    return;
  }

  console.log("📝 Payment Method Found:");
  console.log(`  ID: ${paymentMethods.id}`);
  console.log(`  Issuer: "${paymentMethods.issuer}"`);
  console.log(`  Name: "${paymentMethods.name}"`);
  console.log(`  Currency: ${paymentMethods.currency}`);
  console.log(
    `  Points Currency: ${paymentMethods.points_currency || "N/A"}\n`
  );

  // Simulate the exact transaction from your error log
  const transactionData = {
    amount: 70,
    currency: "CAD",
    paymentMethod: {
      id: paymentMethods.id,
      issuer: paymentMethods.issuer,
      name: paymentMethods.name,
      currency: paymentMethods.currency,
      pointsCurrency: paymentMethods.points_currency,
      type: paymentMethods.type,
      active: paymentMethods.active,
    },
    mcc: "4814",
    merchantName: "ffff",
    isOnline: true,
    isContactless: false,
    convertedAmount: 650, // From your log
    convertedCurrency: "SGD", // From your log
  };

  console.log("🔄 Simulating reward calculation with:");
  console.log(
    `  Amount: ${transactionData.amount} ${transactionData.currency}`
  );
  console.log(
    `  Converted: ${transactionData.convertedAmount} ${transactionData.convertedCurrency}`
  );
  console.log(`  Merchant: ${transactionData.merchantName}`);
  console.log(`  MCC: ${transactionData.mcc}`);
  console.log(`  Online: ${transactionData.isOnline}`);
  console.log(
    `  Payment Method: ${transactionData.paymentMethod.issuer} ${transactionData.paymentMethod.name}`
  );
  console.log(
    `  Payment Method Issuer (raw): "${transactionData.paymentMethod.issuer}"`
  );
  console.log(
    `  Payment Method Name (raw): "${transactionData.paymentMethod.name}"\n`
  );

  try {
    // First, let's manually check if the repository can find rules
    console.log("🔍 Manual Repository Check:");
    const { getRuleRepository } = await import("@/core/rewards/RuleRepository");
    const { cardTypeIdService } = await import(
      "@/core/rewards/CardTypeIdService"
    );

    const repository = getRuleRepository();
    const cardTypeId = cardTypeIdService.generateCardTypeId(
      transactionData.paymentMethod.issuer,
      transactionData.paymentMethod.name
    );

    console.log(`  Generated Card Type ID: "${cardTypeId}"`);

    const manualRules = await repository.getRulesForCardType(cardTypeId);
    console.log(`  Rules found by repository: ${manualRules.length}`);
    if (manualRules.length > 0) {
      manualRules.forEach((rule) => {
        console.log(
          `    - ${rule.name} (Priority: ${rule.priority}, Enabled: ${rule.enabled})`
        );
      });
    }
    console.log();

    console.log("🔍 Now calling rewardService.simulateRewards...\n");

    const result = await rewardService.simulateRewards(
      transactionData.amount,
      transactionData.currency,
      transactionData.paymentMethod,
      transactionData.mcc,
      transactionData.merchantName,
      transactionData.isOnline,
      transactionData.isContactless,
      transactionData.convertedAmount,
      transactionData.convertedCurrency
    );

    console.log("✅ Calculation Result:");
    console.log(`  Total Points: ${result.totalPoints}`);
    console.log(`  Base Points: ${result.basePoints}`);
    console.log(`  Bonus Points: ${result.bonusPoints}`);
    console.log(`  Points Currency: ${result.pointsCurrency}`);
    console.log(`  Min Spend Met: ${result.minSpendMet}`);

    if (result.appliedRule) {
      console.log(
        `  Applied Rule: ${result.appliedRule.name} (Priority: ${result.appliedRule.priority})`
      );
    } else {
      console.log(`  Applied Rule: None`);
    }

    if (result.messages && result.messages.length > 0) {
      console.log(`  Messages:`);
      result.messages.forEach((msg) => console.log(`    - ${msg}`));
    }

    if (result.totalPoints === 0) {
      console.log("\n⚠️  WARNING: No points calculated!");
      console.log(
        "This suggests the rules aren't being found or applied correctly."
      );
    }
  } catch (error) {
    console.error("❌ Error calculating rewards:", error);
    if (error instanceof Error) {
      console.error("   Error message:", error.message);
      console.error("   Stack:", error.stack);
    }
  }

  console.log("\n=== Simulation Complete ===");
}

// Run the simulation
simulateExpenseCalculation().catch(console.error);
