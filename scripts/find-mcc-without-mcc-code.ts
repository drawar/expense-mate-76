import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

async function main() {
  const { data, error } = await supabase
    .from("merchants")
    .select("id, name, mcc, mcc_code")
    .not("mcc", "is", null)
    .is("mcc_code", null)
    .order("name");

  if (error) {
    console.error("Error:", error);
    return;
  }

  console.log(`Found ${data?.length || 0} merchants with mcc but no mcc_code:\n`);

  for (const m of data || []) {
    let mccInfo = "";
    try {
      const parsed = typeof m.mcc === "string" ? JSON.parse(m.mcc) : m.mcc;
      mccInfo = `${parsed.code} - ${parsed.description}`;
    } catch {
      mccInfo = String(m.mcc);
    }
    console.log(`${m.name}: ${mccInfo}`);
  }
}

main();
