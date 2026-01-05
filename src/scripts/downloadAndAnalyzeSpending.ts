import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

interface TransactionRow {
  id: string;
  date: string;
  amount: number;
  currency: string;
  payment_amount: number | null;
  payment_currency: string | null;
  total_points: number | null;
  base_points: number | null;
  bonus_points: number | null;
  is_contactless: boolean | null;
  notes: string | null;
  mcc_code: string | null;
  user_category: string | null;
  category: string | null;
  reimbursement_amount: number | null;
  payment_methods: {
    id: string;
    name: string;
    type: string;
    currency: string | null;
  } | null;
  merchants: {
    id: string;
    name: string;
    mcc_code: string | null;
    is_online: boolean | null;
  } | null;
}

async function main() {
  // Get current month date range
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const startDate = startOfMonth.toISOString().split("T")[0];
  const endDate = endOfMonth.toISOString().split("T")[0];

  console.log(`\nFetching transactions from ${startDate} to ${endDate}...\n`);

  // Filter to specific user (your account)
  const USER_ID = "e215b298-6ea8-44b0-b7b9-8b0b0bbaeb91";

  // Query transactions for current month
  const { data: transactions, error } = await supabase
    .from("transactions")
    .select(
      `
      id,
      date,
      amount,
      currency,
      payment_amount,
      payment_currency,
      total_points,
      base_points,
      bonus_points,
      is_contactless,
      notes,
      mcc_code,
      user_category,
      category,
      reimbursement_amount,
      payment_methods(id, name, type, currency),
      merchants(id, name, mcc_code, is_online)
    `
    )
    .eq("user_id", USER_ID)
    .gte("date", startDate)
    .lte("date", endDate)
    .or("is_deleted.is.null,is_deleted.eq.false")
    .order("date", { ascending: false });

  if (error) {
    console.error("Error fetching transactions:", error);
    process.exit(1);
  }

  if (!transactions || transactions.length === 0) {
    console.log("No transactions found for the current month.");
    process.exit(0);
  }

  const txData = transactions as unknown as TransactionRow[];

  // Generate CSV
  const csvHeaders = [
    "Date",
    "Merchant",
    "Category",
    "Amount",
    "Currency",
    "Payment Amount",
    "Payment Currency",
    "Payment Method",
    "Payment Type",
    "Points Earned",
    "Is Online",
    "Is Contactless",
    "Notes",
  ].join(",");

  const csvRows = txData.map((tx) => {
    const effectiveCategory =
      tx.user_category || tx.category || "Uncategorized";
    return [
      tx.date,
      `"${(tx.merchants?.name || "Unknown").replace(/"/g, '""')}"`,
      effectiveCategory,
      tx.amount.toFixed(2),
      tx.currency,
      (tx.payment_amount ?? tx.amount).toFixed(2),
      tx.payment_currency || tx.currency,
      `"${(tx.payment_methods?.name || "Unknown").replace(/"/g, '""')}"`,
      tx.payment_methods?.type || "Unknown",
      tx.total_points ?? 0,
      tx.merchants?.is_online ?? false,
      tx.is_contactless ?? false,
      `"${(tx.notes || "").replace(/"/g, '""')}"`,
    ].join(",");
  });

  const csvContent = [csvHeaders, ...csvRows].join("\n");
  const csvPath = `/Users/vle/Downloads/transactions_${startDate}_to_${endDate}.csv`;
  fs.writeFileSync(csvPath, csvContent);
  console.log(`✅ CSV exported to: ${csvPath}\n`);

  // Analyze spending
  console.log("=".repeat(60));
  console.log("           SPENDING SUMMARY FOR DECEMBER 2025");
  console.log("=".repeat(60));

  // Total spending
  const totalSpending = txData.reduce((sum, tx) => {
    const amount = tx.payment_amount ?? tx.amount;
    return sum + amount - (tx.reimbursement_amount || 0);
  }, 0);

  const totalPoints = txData.reduce(
    (sum, tx) => sum + (tx.total_points || 0),
    0
  );
  const transactionCount = txData.length;

  console.log(`\n📊 OVERVIEW`);
  console.log(`   Total Transactions: ${transactionCount}`);
  console.log(`   Total Spending: $${totalSpending.toFixed(2)}`);
  console.log(`   Total Points Earned: ${totalPoints.toLocaleString()}`);
  console.log(
    `   Avg Points/Dollar: ${(totalPoints / totalSpending).toFixed(2)}`
  );

  // Spending by category
  const categorySpending: Record<
    string,
    { amount: number; count: number; points: number }
  > = {};
  txData.forEach((tx) => {
    const category = tx.user_category || tx.category || "Uncategorized";
    const amount =
      (tx.payment_amount ?? tx.amount) - (tx.reimbursement_amount || 0);
    if (!categorySpending[category]) {
      categorySpending[category] = { amount: 0, count: 0, points: 0 };
    }
    categorySpending[category].amount += amount;
    categorySpending[category].count++;
    categorySpending[category].points += tx.total_points || 0;
  });

  const sortedCategories = Object.entries(categorySpending).sort(
    (a, b) => b[1].amount - a[1].amount
  );

  console.log(`\n📁 SPENDING BY CATEGORY`);
  console.log("-".repeat(60));
  sortedCategories.forEach(([cat, data]) => {
    const pct = ((data.amount / totalSpending) * 100).toFixed(1);
    const pointsPerDollar =
      data.amount > 0 ? (data.points / data.amount).toFixed(2) : "0.00";
    console.log(
      `   ${cat.padEnd(20)} $${data.amount.toFixed(2).padStart(10)} (${pct.padStart(5)}%) | ${data.count} txns | ${pointsPerDollar} pts/$`
    );
  });

  // Spending by payment method
  const methodSpending: Record<
    string,
    { amount: number; count: number; points: number }
  > = {};
  txData.forEach((tx) => {
    const method = tx.payment_methods?.name || "Unknown";
    const amount =
      (tx.payment_amount ?? tx.amount) - (tx.reimbursement_amount || 0);
    if (!methodSpending[method]) {
      methodSpending[method] = { amount: 0, count: 0, points: 0 };
    }
    methodSpending[method].amount += amount;
    methodSpending[method].count++;
    methodSpending[method].points += tx.total_points || 0;
  });

  const sortedMethods = Object.entries(methodSpending).sort(
    (a, b) => b[1].amount - a[1].amount
  );

  console.log(`\n💳 SPENDING BY PAYMENT METHOD`);
  console.log("-".repeat(60));
  sortedMethods.forEach(([method, data]) => {
    const pct = ((data.amount / totalSpending) * 100).toFixed(1);
    const pointsPerDollar =
      data.amount > 0 ? (data.points / data.amount).toFixed(2) : "0.00";
    console.log(
      `   ${method.substring(0, 30).padEnd(30)} $${data.amount.toFixed(2).padStart(10)} (${pct.padStart(5)}%) | ${data.points.toLocaleString().padStart(6)} pts`
    );
  });

  // Top merchants
  const merchantSpending: Record<string, { amount: number; count: number }> =
    {};
  txData.forEach((tx) => {
    const merchant = tx.merchants?.name || "Unknown";
    const amount =
      (tx.payment_amount ?? tx.amount) - (tx.reimbursement_amount || 0);
    if (!merchantSpending[merchant]) {
      merchantSpending[merchant] = { amount: 0, count: 0 };
    }
    merchantSpending[merchant].amount += amount;
    merchantSpending[merchant].count++;
  });

  const topMerchants = Object.entries(merchantSpending)
    .sort((a, b) => b[1].amount - a[1].amount)
    .slice(0, 10);

  console.log(`\n🏪 TOP 10 MERCHANTS`);
  console.log("-".repeat(60));
  topMerchants.forEach(([merchant, data], i) => {
    const pct = ((data.amount / totalSpending) * 100).toFixed(1);
    console.log(
      `   ${(i + 1).toString().padStart(2)}. ${merchant.substring(0, 28).padEnd(28)} $${data.amount.toFixed(2).padStart(10)} (${pct.padStart(5)}%) | ${data.count} visits`
    );
  });

  // Recommendations
  console.log(`\n💡 SAVINGS RECOMMENDATIONS`);
  console.log("=".repeat(60));

  const recommendations: string[] = [];

  // 1. Identify high-spend categories
  const highSpendCategories = sortedCategories.filter(
    ([_, data]) => data.amount / totalSpending > 0.15
  );

  highSpendCategories.forEach(([cat, data]) => {
    const pct = ((data.amount / totalSpending) * 100).toFixed(0);
    recommendations.push(
      `🔴 ${cat} represents ${pct}% of spending ($${data.amount.toFixed(2)}). Consider setting a budget or finding alternatives.`
    );
  });

  // 2. Check for dining/food spending
  const diningCategories = sortedCategories.filter(
    ([cat]) =>
      cat.toLowerCase().includes("dining") ||
      cat.toLowerCase().includes("restaurant") ||
      cat.toLowerCase().includes("food")
  );
  const totalDining = diningCategories.reduce(
    (sum, [_, data]) => sum + data.amount,
    0
  );
  if (totalDining > totalSpending * 0.2) {
    recommendations.push(
      `🍽️  Food/Dining spending is high ($${totalDining.toFixed(2)}). Try meal prepping or cooking at home more often to save 30-50%.`
    );
  }

  // 3. Check for subscription patterns (recurring same merchant)
  const frequentMerchants = Object.entries(merchantSpending).filter(
    ([_, data]) => data.count >= 3
  );
  if (frequentMerchants.length > 0) {
    recommendations.push(
      `🔄 Review recurring expenses at: ${frequentMerchants
        .map(([m]) => m)
        .slice(0, 3)
        .join(", ")}. Cancel unused subscriptions.`
    );
  }

  // 4. Points optimization
  const lowPointsCards = sortedMethods.filter(([_, data]) => {
    const ptsPerDollar = data.amount > 0 ? data.points / data.amount : 0;
    return ptsPerDollar < 1 && data.amount > 100;
  });
  if (lowPointsCards.length > 0) {
    recommendations.push(
      `💳 Low rewards on: ${lowPointsCards
        .map(([m]) => m)
        .slice(0, 2)
        .join(", ")}. Consider using higher-reward cards for these purchases.`
    );
  }

  // 5. Online shopping check
  const onlineTransactions = txData.filter((tx) => tx.merchants?.is_online);
  const onlineSpending = onlineTransactions.reduce(
    (sum, tx) => sum + (tx.payment_amount ?? tx.amount),
    0
  );
  if (onlineSpending > totalSpending * 0.3) {
    recommendations.push(
      `🛒 ${((onlineSpending / totalSpending) * 100).toFixed(0)}% of spending is online. Use browser extensions like Honey or Rakuten for cashback.`
    );
  }

  // 6. General savings tips based on amount
  if (totalSpending > 5000) {
    recommendations.push(
      `📈 High monthly spend detected. Review discretionary purchases and set category limits.`
    );
  }

  // 7. Check for small frequent purchases
  const smallPurchases = txData.filter(
    (tx) => (tx.payment_amount ?? tx.amount) < 20
  );
  if (smallPurchases.length > 10) {
    const smallTotal = smallPurchases.reduce(
      (sum, tx) => sum + (tx.payment_amount ?? tx.amount),
      0
    );
    recommendations.push(
      `☕ ${smallPurchases.length} small purchases (<$20) totaling $${smallTotal.toFixed(2)}. These "latte factors" add up - consider reducing.`
    );
  }

  if (recommendations.length === 0) {
    recommendations.push(
      `✅ Your spending looks well-managed! Keep tracking to maintain good habits.`
    );
  }

  recommendations.forEach((rec, i) => {
    console.log(`\n${i + 1}. ${rec}`);
  });

  // Potential savings estimate
  console.log(`\n📉 POTENTIAL MONTHLY SAVINGS`);
  console.log("-".repeat(60));

  let potentialSavings = 0;

  if (totalDining > 0) {
    const diningSavings = totalDining * 0.3;
    potentialSavings += diningSavings;
    console.log(
      `   Reduce dining out by 30%:           $${diningSavings.toFixed(2)}`
    );
  }

  const subscriptionEstimate = frequentMerchants.length * 15;
  if (subscriptionEstimate > 0) {
    potentialSavings += subscriptionEstimate;
    console.log(
      `   Cancel 1-2 unused subscriptions:    $${subscriptionEstimate.toFixed(2)}`
    );
  }

  if (smallPurchases.length > 10) {
    const smallSavings =
      smallPurchases.reduce(
        (sum, tx) => sum + (tx.payment_amount ?? tx.amount),
        0
      ) * 0.4;
    potentialSavings += smallSavings;
    console.log(
      `   Reduce small impulse purchases:     $${smallSavings.toFixed(2)}`
    );
  }

  console.log("-".repeat(60));
  console.log(
    `   💰 ESTIMATED POTENTIAL SAVINGS:     $${potentialSavings.toFixed(2)}/month`
  );
  console.log(
    `                                       $${(potentialSavings * 12).toFixed(2)}/year`
  );

  console.log("\n");
}

main().catch(console.error);
