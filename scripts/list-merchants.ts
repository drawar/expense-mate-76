import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || "",
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY || ""
);

async function main() {
  const { data, error } = await supabase
    .from("merchants")
    .select("name, address, display_location, coordinates, is_online")
    .not("address", "is", null)
    .order("name");

  if (error) {
    console.error("Error:", error);
    return;
  }

  console.log("Merchants with addresses:\n");
  for (const m of data || []) {
    console.log(`- ${m.name}`);
    console.log(`  Address: ${m.address}`);
    console.log(`  Display: ${m.display_location || "(none)"}`);
    console.log(`  Coords: ${m.coordinates ? JSON.stringify(m.coordinates) : "(none)"}`);
    console.log(`  Online: ${m.is_online}`);
    console.log("");
  }
  console.log(`Total: ${data?.length || 0} merchants`);
}

main();
