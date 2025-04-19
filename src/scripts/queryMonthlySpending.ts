// scripts/queryMonthlySpending.ts

import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { DateTime } from "luxon";

import { MonthlySpendingRepository } from "src/core/analytics/MonthlySpendingRepository";
import { MonthlyTransactionRow } from "src/core/rewards/types";

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY!;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OUTPUT_PATH = path.resolve(__dirname, "../output/monthly_spending.json");
const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function main() {
  const repo = new MonthlySpendingRepository(supabase);
  const start = DateTime.now().startOf("month");
  const end = DateTime.now().endOf("month").plus({ days: 1 });

  const transactions: MonthlyTransactionRow[] =
    await repo.getMonthlyTransactions(start, end);

  console.log(`✅ Retrieved ${transactions.length} transactions`);

  const serializable = transactions.map((tx) => ({
    ...tx,
    date: DateTime.fromISO(tx.date).toISO(),
  }));

  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(serializable, null, 2));
  console.log(`✅ Saved to ${OUTPUT_PATH}`);
}

main().catch((err) => {
  console.error("❌ Error querying transactions:", err);
  process.exit(1);
});
