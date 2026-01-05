import { createClient } from "@supabase/supabase-js";
import { insightService } from "../core/insights";
import { storageService } from "../core/storage/StorageService";
import { initializeRewardSystem } from "../core/rewards";

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function test() {
  console.log("Initializing reward system...");
  await initializeRewardSystem();

  console.log("Fetching transactions...");
  const transactions = await storageService.getTransactions();
  console.log(`Found ${transactions.length} transactions`);

  console.log("Fetching payment methods...");
  const paymentMethods = await storageService.getPaymentMethods();
  console.log(`Found ${paymentMethods.length} payment methods`);

  // Filter to credit cards
  const creditCards = paymentMethods.filter(
    (pm) => pm.active && (pm.type === "credit" || pm.type === "credit_card")
  );
  console.log(
    `Active credit cards: ${creditCards.map((c) => c.name).join(", ")}`
  );

  console.log("\nEvaluating insights...");
  const insights = await insightService.evaluateInsights(transactions, {
    monthlyBudget: 5000,
    currency: "CAD",
    paymentMethods,
    maxResults: 20,
  });

  console.log(`\nGenerated ${insights.length} insights:`);
  insights.forEach((insight, i) => {
    console.log(`\n${i + 1}. ${insight.title}`);
    console.log(`   Message: ${insight.message}`);
    console.log(`   Severity: ${insight.severity}`);
    console.log(`   Action: ${insight.actionText || "none"}`);
  });

  // Look specifically for card mismatch insight
  const cardMismatch = insights.find(
    (i) => i.title === "Wrong Card for Category"
  );
  if (cardMismatch) {
    console.log("\n=== CARD MISMATCH INSIGHT FOUND ===");
    console.log(cardMismatch);
  } else {
    console.log("\n=== NO CARD MISMATCH INSIGHT FOUND ===");
    console.log("This could mean all transactions used optimal cards");
  }
}

test().catch(console.error);
