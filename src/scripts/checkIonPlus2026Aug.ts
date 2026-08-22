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

const merchantTerms = [
  "no ne",
  "none kitchen",
  "kitchen and bar",
  "t&t",
  "supermarket",
  "lyft",
  "uber",
  "metro ets",
  "metro 2416",
  "stm",
  "lucien",
  "la belle tonki",
  "tonki",
  "luggagehero",
  "luggage hero",
];

async function main() {
  console.log("=== Existing merchants ===");
  for (const t of merchantTerms) {
    const { data } = await supabase
      .from("merchants")
      .select("id, name, address, mcc, is_online")
      .ilike("name", `%${t}%`)
      .limit(5);
    if (data && data.length > 0) {
      console.log(`\n[${t}]:`);
      for (const m of data)
        console.log(
          `  ${m.id} | ${m.name} | mcc=${JSON.stringify(m.mcc)} | addr=${m.address ?? "-"}`
        );
    }
  }

  console.log("\n=== RBC ION+ payment method(s) ===");
  const { data: pms } = await supabase
    .from("payment_methods")
    .select("id, name, issuer, last_four_digits, currency, is_active, user_id")
    .or("name.ilike.%ION%,name.ilike.%RBC%")
    .limit(20);
  for (const p of pms ?? []) {
    console.log(
      `  ${p.id} | ${p.name} | issuer=${p.issuer} | last4=${p.last_four_digits} | ccy=${p.currency} | active=${p.is_active} | user=${p.user_id}`
    );
  }

  console.log(
    "\n=== ION+ transactions in Jul-Aug 2026 range (dedup check) ==="
  );
  const ionPlusId = "5cb1d8fb-b9dc-4700-901f-b19639284a5b";
  const { data: txs } = await supabase
    .from("transactions")
    .select("id, date, amount, currency, notes, merchant_id, merchants(name)")
    .eq("payment_method_id", ionPlusId)
    .gte("date", "2026-07-01")
    .lte("date", "2026-08-05")
    .order("date");
  for (const t of txs ?? []) {
    const m = (t.merchants as { name?: string } | null)?.name ?? "?";
    console.log(`  ${t.date} | ${m} | $${t.amount} | ${t.notes ?? ""}`);
  }
}

main();
