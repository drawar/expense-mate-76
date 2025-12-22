import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function showReviewTransactions() {
  const { data, error } = await supabase
    .from("transactions")
    .select(
      `
      id,
      date,
      amount,
      currency,
      user_category,
      auto_category_confidence,
      category_suggestion_reason,
      merchants:merchant_id(name)
    `
    )
    .eq("needs_review", true)
    .or("is_deleted.is.false,is_deleted.is.null")
    .order("date", { ascending: false });

  if (error) {
    console.error("Error:", error);
    return;
  }

  console.log(`\n=== Transactions Needing Review (${data.length}) ===\n`);
  console.log(
    "Date       | Merchant                  | Amount       | Category             | Conf | Reason"
  );
  console.log("-".repeat(120));

  for (const t of data) {
    const merchant = (
      (t.merchants as { name: string } | null)?.name || "Unknown"
    ).substring(0, 25);
    const confidence = t.auto_category_confidence
      ? (t.auto_category_confidence * 100).toFixed(0) + "%"
      : "N/A";
    const amount = `${t.currency} ${t.amount.toFixed(2)}`;
    const category = (t.user_category || "Uncategorized").substring(0, 20);
    const reason = (t.category_suggestion_reason || "").substring(0, 40);

    console.log(
      `${t.date} | ${merchant.padEnd(25)} | ${amount.padStart(12)} | ${category.padEnd(20)} | ${confidence.padStart(4)} | ${reason}`
    );
  }
}

showReviewTransactions();
