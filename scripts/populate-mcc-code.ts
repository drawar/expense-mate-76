import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

async function main() {
  // Find merchants with mcc but no mcc_code
  const { data, error } = await supabase
    .from("merchants")
    .select("id, name, mcc")
    .not("mcc", "is", null)
    .is("mcc_code", null);

  if (error) {
    console.error("Error fetching merchants:", error);
    return;
  }

  console.log(`Populating mcc_code for ${data?.length || 0} merchants...\n`);

  let updated = 0;
  let errors = 0;

  for (const m of data || []) {
    let mccCode: string | null = null;

    try {
      const parsed = typeof m.mcc === "string" ? JSON.parse(m.mcc) : m.mcc;
      mccCode = parsed.code;
    } catch {
      console.error(`❌ Could not parse mcc for ${m.name}: ${m.mcc}`);
      errors++;
      continue;
    }

    if (!mccCode) {
      console.error(`❌ No code found in mcc for ${m.name}`);
      errors++;
      continue;
    }

    const { error: updateError } = await supabase
      .from("merchants")
      .update({ mcc_code: mccCode })
      .eq("id", m.id);

    if (updateError) {
      console.error(`❌ Error updating ${m.name}: ${updateError.message}`);
      errors++;
    } else {
      console.log(`✓ ${m.name}: ${mccCode}`);
      updated++;
    }
  }

  console.log(`\n${"=".repeat(50)}`);
  console.log(`Updated: ${updated} merchants`);
  console.log(`Errors: ${errors}`);
}

main();
