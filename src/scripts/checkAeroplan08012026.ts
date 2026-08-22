import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { join } from "path";

const envPath = join(process.cwd(), ".env");
const envContent = readFileSync(envPath, "utf-8");
const envVars: Record<string, string> = {};
for (const line of envContent.split("\n")) {
  const match = line.match(/^([^=]+)="?([^"]*)"?$/);
  if (match) envVars[match[1]] = match[2];
}

const supabase = createClient(
  envVars.VITE_SUPABASE_URL,
  envVars.SUPABASE_SERVICE_ROLE_KEY
);

const terms = [
  "costco",
  "instacart",
  "best buy",
  "bby",
  "amazon",
  "prime",
  "audible",
  "hotels",
  "hotels.ca",
  "zara",
  "expedia",
  "abercrombie",
  "lululemon",
  "air canada",
  "aircanada",
];

async function main() {
  console.log("=== Existing merchants ===");
  for (const t of terms) {
    const { data } = await supabase
      .from("merchants")
      .select("id, name, address, mcc, is_online")
      .ilike("name", `%${t}%`)
      .limit(4);
    if (data && data.length > 0) {
      console.log(`\n[${t}]:`);
      for (const m of data)
        console.log(
          `  ${m.id} | ${m.name} | mcc=${JSON.stringify(m.mcc)} | online=${m.is_online} | addr=${m.address ?? "-"}`
        );
    }
  }

  console.log(
    "\n=== Aeroplan Reserve transactions in date range (dedup check) ==="
  );
  const AEROPLAN_PM = "d7c8b577-ce6a-4355-9402-c3a1ae432d53";
  const { data: txs } = await supabase
    .from("transactions")
    .select("id, date, amount, notes, merchant_id, merchants(name)")
    .eq("payment_method_id", AEROPLAN_PM)
    .gte("date", "2026-07-01")
    .lte("date", "2026-08-05")
    .order("date");
  for (const t of txs ?? []) {
    const m = (t.merchants as { name?: string } | null)?.name ?? "?";
    console.log(`  ${t.date} | ${m} | $${t.amount} | ${t.notes ?? ""}`);
  }
  if (!txs || txs.length === 0) console.log("  (none)");
}

main();
