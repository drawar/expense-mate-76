import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Helper to get effective category
function getEffectiveCategory(tx: {
  user_category?: string;
  category?: string;
}): string {
  return tx.user_category || tx.category || "Uncategorized";
}

async function debug() {
  // Get payment methods
  const { data: paymentMethods } = await supabase
    .from("payment_methods")
    .select("id, name, type, is_active, points_currency, reward_rules")
    .eq("is_active", true);

  console.log("\n=== Active Payment Methods ===");
  const creditCards =
    paymentMethods?.filter(
      (pm) => pm.type === "credit" || pm.type === "credit_card"
    ) || [];
  creditCards.forEach((pm) => {
    console.log(
      `- ${pm.name} (type: ${pm.type}, points: ${pm.points_currency})`
    );
  });
  console.log(`\nTotal credit cards: ${creditCards.length}`);

  if (creditCards.length < 2) {
    console.log("ERROR: Need at least 2 credit cards for comparison");
    return;
  }

  // Get ALL transactions (for historical rates)
  const { data: allTransactions, error: txError } = await supabase
    .from("transactions")
    .select(
      "id, merchant_id, category, user_category, amount, total_points, payment_method_id, date"
    )
    .eq("is_deleted", false)
    .order("date", { ascending: false });

  if (txError) {
    console.log("Transaction fetch error:", txError);
  }

  // Get current month transactions
  const startOfMonth = new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    1
  );
  const currentMonthTxs =
    allTransactions?.filter((tx) => new Date(tx.date) >= startOfMonth) || [];

  console.log(`\n=== Transaction Counts ===`);
  console.log(`All transactions: ${allTransactions?.length}`);
  console.log(`Current month: ${currentMonthTxs.length}`);

  // Build card ID to card map
  const cardMap = new Map(creditCards.map((pm) => [pm.id, pm]));

  // Build earning rates from historical data
  console.log("\n=== Building Historical Earning Rates ===");
  const cardCategoryStats = new Map<
    string,
    { totalPoints: number; totalAmount: number; pointsCurrency: string }
  >();

  allTransactions?.forEach((tx) => {
    const card = cardMap.get(tx.payment_method_id);
    if (!card) return; // Not a credit card or not active
    if (!tx.total_points || tx.amount <= 0) return;

    const category = getEffectiveCategory(tx);
    const cardName = card.name;
    const pointsCurrency = card.points_currency || "points";
    const key = `${cardName}|${category}`;

    let stats = cardCategoryStats.get(key);
    if (!stats) {
      stats = { totalPoints: 0, totalAmount: 0, pointsCurrency };
      cardCategoryStats.set(key, stats);
    }
    stats.totalPoints += tx.total_points;
    stats.totalAmount += tx.amount;
  });

  // Calculate points-per-dollar rates
  const cardRates = new Map<
    string,
    { pointsCurrency: string; categoryRates: Map<string, number> }
  >();

  cardCategoryStats.forEach((stats, key) => {
    const [cardName, category] = key.split("|");
    if (stats.totalAmount <= 0) return;

    const rate = stats.totalPoints / stats.totalAmount;

    let cardData = cardRates.get(cardName);
    if (!cardData) {
      cardData = {
        pointsCurrency: stats.pointsCurrency,
        categoryRates: new Map(),
      };
      cardRates.set(cardName, cardData);
    }
    cardData.categoryRates.set(category, rate);
  });

  console.log("\nCard earning rates by category:");
  cardRates.forEach((cardData, cardName) => {
    console.log(`\n${cardName} (${cardData.pointsCurrency}):`);
    cardData.categoryRates.forEach((rate, category) => {
      console.log(`  ${category}: ${rate.toFixed(2)} pts/$`);
    });
  });

  // Analyze current month usage
  console.log("\n=== Current Month Analysis ===");
  const categoryUsage = new Map<
    string,
    Map<string, { amount: number; points: number; pointsCurrency: string }>
  >();

  currentMonthTxs.forEach((tx) => {
    const card = cardMap.get(tx.payment_method_id);
    if (!card) return;

    const category = getEffectiveCategory(tx);
    const cardName = card.name;
    const pointsCurrency = card.points_currency || "points";

    let catUsage = categoryUsage.get(category);
    if (!catUsage) {
      catUsage = new Map();
      categoryUsage.set(category, catUsage);
    }

    let cardUsage = catUsage.get(cardName);
    if (!cardUsage) {
      cardUsage = { amount: 0, points: 0, pointsCurrency };
      catUsage.set(cardName, cardUsage);
    }
    cardUsage.amount += tx.amount;
    cardUsage.points += tx.total_points || 0;
  });

  console.log("\nCurrent month spending by category and card:");
  categoryUsage.forEach((cardUsageMap, category) => {
    console.log(`\n${category}:`);
    cardUsageMap.forEach((usage, cardName) => {
      const rate = usage.amount > 0 ? usage.points / usage.amount : 0;
      console.log(
        `  ${cardName}: $${usage.amount.toFixed(2)} spent, ${usage.points} pts (${rate.toFixed(2)} pts/$)`
      );
    });
  });

  // Find mismatches
  console.log("\n=== Mismatch Analysis ===");
  let bestMismatch: {
    currentCard: string;
    betterCard: string;
    category: string;
    amount: number;
    pointsLost: number;
    multiplier: number;
  } | null = null;
  const MIN_POINTS_LOST = 100;

  categoryUsage.forEach((cardUsageMap, category) => {
    // Find dominant card
    let dominantCard = "";
    let dominantAmount = 0;
    let dominantPointsCurrency = "points";
    let dominantPoints = 0;

    cardUsageMap.forEach((usage, cardName) => {
      if (usage.amount > dominantAmount) {
        dominantCard = cardName;
        dominantAmount = usage.amount;
        dominantPointsCurrency = usage.pointsCurrency;
        dominantPoints = usage.points;
      }
    });

    if (!dominantCard || dominantAmount < 10) return;

    const currentRate =
      dominantAmount > 0 ? dominantPoints / dominantAmount : 0;

    console.log(`\n${category}: Dominant card is ${dominantCard}`);
    console.log(
      `  Spent: $${dominantAmount.toFixed(2)}, Earned: ${dominantPoints} pts, Rate: ${currentRate.toFixed(2)} pts/$`
    );

    // Find best alternative with same points currency
    let bestAltCard = "";
    let bestAltRate = currentRate;

    cardRates.forEach((cardData, cardName) => {
      if (cardName === dominantCard) return;
      // Only compare cards with same points currency
      if (cardData.pointsCurrency !== dominantPointsCurrency) {
        console.log(
          `  Skipping ${cardName}: different currency (${cardData.pointsCurrency} vs ${dominantPointsCurrency})`
        );
        return;
      }

      const altRate = cardData.categoryRates.get(category);
      console.log(
        `  ${cardName} historical rate for ${category}: ${altRate?.toFixed(2) || "no data"} pts/$`
      );

      if (altRate && altRate > bestAltRate) {
        bestAltRate = altRate;
        bestAltCard = cardName;
      }
    });

    if (bestAltCard && bestAltRate > currentRate) {
      const potentialPoints = Math.round(dominantAmount * bestAltRate);
      const actualPoints = dominantPoints;
      const pointsLost = potentialPoints - actualPoints;
      const multiplier =
        currentRate > 0
          ? Math.round((bestAltRate / currentRate) * 10) / 10
          : bestAltRate;

      console.log(
        `  >>> MISMATCH FOUND: ${bestAltCard} would earn ${potentialPoints} pts vs ${actualPoints} pts`
      );
      console.log(
        `  >>> Points lost: ${pointsLost}, Multiplier: ${multiplier}x`
      );

      if (pointsLost >= MIN_POINTS_LOST) {
        if (!bestMismatch || pointsLost > bestMismatch.pointsLost) {
          bestMismatch = {
            currentCard: dominantCard,
            betterCard: bestAltCard,
            category,
            amount: dominantAmount,
            pointsLost,
            multiplier,
          };
        }
      }
    }
  });

  console.log("\n=== RESULT ===");
  if (bestMismatch) {
    console.log("Best mismatch found:", bestMismatch);
  } else {
    console.log(
      "No significant mismatch found (min points lost:",
      MIN_POINTS_LOST,
      ")"
    );
  }
}

debug().catch(console.error);
