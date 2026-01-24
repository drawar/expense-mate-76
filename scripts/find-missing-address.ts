import { createClient } from "@supabase/supabase-js";
const supabase = createClient(
  process.env.VITE_SUPABASE_URL || "",
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY || ""
);

async function main() {
  const { data, error } = await supabase
    .from("merchants")
    .select("name, address, display_location, is_online")
    .eq("is_deleted", false)
    .eq("is_online", false)
    .or("address.is.null,address.eq.")
    .order("name");

  if (error) {
    console.error("Error:", error);
    return;
  }

  console.log(`Found ${data?.length || 0} physical merchants without address:\n`);
  for (const m of data || []) {
    const loc = m.display_location ? ` (has display_location: ${m.display_location})` : "";
    console.log(`  ${m.name}${loc}`);
  }
}
main();
