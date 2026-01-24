import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || "",
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY || ""
);

async function main() {
  const { data, error } = await supabase
    .from("merchants")
    .select("name, mcc")
    .not("mcc", "is", null);

  if (error) {
    console.error("Error:", error);
    return;
  }

  console.log("Merchants with just MCC code (no description):\n");
  const justCodes: { name: string; mcc: unknown }[] = [];

  for (const m of data || []) {
    const mcc = m.mcc;
    // Check if mcc is just a code string like "5812" (not a JSON string)
    if (typeof mcc === "string" && !mcc.startsWith("{")) {
      console.log(`${m.name}: "${mcc}"`);
      justCodes.push(m);
    }
  }

  console.log(`\nTotal: ${justCodes.length}`);
}

main();
