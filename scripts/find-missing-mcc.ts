import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

async function main() {
  const { data, error } = await supabase
    .from("merchants")
    .select("id, name, is_online, display_location")
    .is("mcc", null)
    .is("mcc_code", null)
    .eq("is_deleted", false)
    .order("name");

  if (error) {
    console.error("Error:", error);
    return;
  }

  const online = data?.filter(m => m.is_online) || [];
  const physical = data?.filter(m => !m.is_online) || [];

  console.log(`Found ${data?.length || 0} merchants with no MCC data:\n`);

  if (physical.length > 0) {
    console.log("PHYSICAL MERCHANTS:");
    console.log("=".repeat(50));
    for (const m of physical) {
      const loc = m.display_location ? ` (${m.display_location})` : "";
      console.log(`  ${m.name}${loc}`);
    }
  }

  if (online.length > 0) {
    console.log("\nONLINE MERCHANTS:");
    console.log("=".repeat(50));
    for (const m of online) {
      console.log(`  ${m.name}`);
    }
  }

  console.log(`\nTotal: ${physical.length} physical, ${online.length} online`);
}

main();
