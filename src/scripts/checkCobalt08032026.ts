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
  "compass",
  "analog coffee",
  "goodfood",
  "social corner",
  "tst-social",
  "honolulu coffee",
  "body energy",
  "49th parallel",
  "good earth",
  "slo coffee",
  "joyeaux",
  "trees organic",
  "passione gelato",
  "bisou",
  "netflix",
  "uber trip",
  "uber eats",
  "hyatt",
  "sford",
  "metro ets",
  "cafe des habitudes",
  "ryu",
  "cafe eclair",
  "no ne kitchen",
  "american express",
];

async function main() {
  const COBALT_PM = "a0c0608d-2009-49cc-976d-d9381a436dd2";
  console.log("=== Existing merchants ===");
  for (const t of terms) {
    const { data } = await supabase
      .from("merchants")
      .select(
        "id, name, mcc, is_online, address, display_location, coordinates"
      )
      .ilike("name", `%${t}%`)
      .limit(4);
    if (data && data.length > 0) {
      console.log(`\n[${t}]:`);
      for (const m of data)
        console.log(
          `  ${m.id} | ${m.name} | mcc=${JSON.stringify(m.mcc)} | online=${m.is_online} | addr=${m.address ?? "-"} | coords=${JSON.stringify(m.coordinates)}`
        );
    }
  }

  console.log("\n=== Cobalt transactions in date range (dedup check) ===");
  const { data: txs } = await supabase
    .from("transactions")
    .select("id, date, amount, notes, merchants(name)")
    .eq("payment_method_id", COBALT_PM)
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
