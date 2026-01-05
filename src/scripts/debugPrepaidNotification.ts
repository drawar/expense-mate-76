import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.VITE_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
);

async function main() {
  // Get prepaid cards with full info
  const { data: prepaidCards } = await supabase
    .from("payment_methods")
    .select("id, name, type, is_active, total_loaded, currency")
    .eq("type", "prepaid_card");

  console.log("\n=== Prepaid Cards ===");
  for (const card of prepaidCards || []) {
    console.log(
      `- ${card.name}: total_loaded=${card.total_loaded}, is_active=${card.is_active}, currency=${card.currency}`
    );
  }

  const prepaidIds = prepaidCards?.map((p) => p.id) || [];

  // Get transactions from last 3 days on prepaid cards
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

  const { data: transactions, error } = await supabase
    .from("transactions")
    .select(
      "id, date, payment_method_id, merchant_id, amount, payment_amount, currency, payment_currency, merchants(name)"
    )
    .in("payment_method_id", prepaidIds)
    .gte("date", threeDaysAgo.toISOString().split("T")[0])
    .order("date", { ascending: false });

  if (error) {
    console.error("Error:", error);
    return;
  }

  console.log("\n=== Recent prepaid transactions (last 3 days) ===");
  for (const t of transactions || []) {
    const card = prepaidCards?.find((p) => p.id === t.payment_method_id);
    const merchantName =
      (t as unknown as { merchants?: { name: string } }).merchants?.name ||
      "Unknown";
    console.log(
      `- ${t.date}: ${merchantName} - ${t.payment_currency} ${t.payment_amount} on ${card?.name}`
    );

    // Simulate the balance calculation
    if (card?.total_loaded) {
      // Get all transactions for this card
      const { data: allCardTx } = await supabase
        .from("transactions")
        .select("payment_amount, amount")
        .eq("payment_method_id", card.id);

      const totalSpent =
        allCardTx?.reduce(
          (sum, tx) => sum + (tx.payment_amount || tx.amount),
          0
        ) || 0;
      const balance = card.total_loaded - totalSpent;
      console.log(
        `  -> Card balance: ${card.total_loaded} - ${totalSpent} = ${balance}`
      );
    }
  }

  if (!transactions || transactions.length === 0) {
    console.log("No transactions found on prepaid cards in the last 3 days.");
  }

  // Test the notification endpoint with a dry run
  console.log("\n=== Testing notification endpoint ===");
  const testPayload = {
    userEmail: "test@example.com",
    cardName: "Test Card",
    merchantName: "Test Merchant",
    transactionAmount: 100,
    transactionCurrency: "CAD",
    previousBalance: 200,
    newBalance: 100,
    cardCurrency: "CAD",
  };

  console.log(
    "Would send notification with payload:",
    JSON.stringify(testPayload, null, 2)
  );
}

main();
