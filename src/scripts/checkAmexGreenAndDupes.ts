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

async function main() {
  console.log("=== Payment methods matching Amex Green ===");
  const { data: pms } = await supabase
    .from("payment_methods")
    .select(
      "id, name, issuer, last_four_digits, currency, network, is_active, user_id"
    )
    .or("name.ilike.%green%,issuer.ilike.%american express%")
    .limit(30);
  for (const p of pms ?? []) {
    console.log(
      `  ${p.id} | ${p.name} | issuer=${p.issuer} | last4=${p.last_four_digits} | ccy=${p.currency} | net=${p.network} | active=${p.is_active} | user=${p.user_id}`
    );
  }

  console.log("\n=== All columns present on transactions (sample row) ===");
  const { data: sample } = await supabase
    .from("transactions")
    .select("*")
    .limit(1);
  if (sample && sample.length) console.log(Object.keys(sample[0]).join(", "));

  console.log(
    "\n=== Existing transactions on Green card in date range 2026-07-10..2026-07-22 (dedup check) ==="
  );
  // First find Green Card PM id, if any
  const greenPmIds = (pms ?? [])
    .filter((p) => /green/i.test(p.name))
    .map((p) => p.id);
  console.log(`  Green candidate PM IDs: ${JSON.stringify(greenPmIds)}`);
  if (greenPmIds.length > 0) {
    const { data: txs } = await supabase
      .from("transactions")
      .select(
        "id, date, amount, currency, payment_amount, payment_currency, notes, merchant_id, merchants(name)"
      )
      .in("payment_method_id", greenPmIds)
      .gte("date", "2026-07-10")
      .lte("date", "2026-07-25")
      .order("date");
    for (const t of txs ?? []) {
      const m = (t.merchants as { name?: string } | null)?.name ?? "?";
      console.log(
        `  ${t.date} | ${m} | ${t.amount} ${t.currency} → ${t.payment_amount} ${t.payment_currency} | ${t.notes ?? ""}`
      );
    }
    if (!txs || txs.length === 0) console.log("  (none — no dupes)");
  }
}

main();
