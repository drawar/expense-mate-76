import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

// MCC assignments approved by user
const mccUpdates: { name: string; mcc: string; newName?: string }[] = [
  { name: "Service Navigo", mcc: "4111" },
  { name: "Airalo", mcc: "4814" },
  { name: "Amex Cobalt Monthly Fee", mcc: "6012" },
  { name: "Bar Nouveau", mcc: "5813" },
  { name: "Bolt", mcc: "4121" },
  { name: "DBS Overseas Shop & Dine Promotion", mcc: "6012" },
  { name: "Extime Duty Free Paris", mcc: "5309" },
  { name: "Fnac", mcc: "5732" },
  { name: "Librairie Compagnie", mcc: "5942" },
  { name: "Momentum Special", mcc: "5812", newName: "Momentum Specialty Coffees" },
  { name: "Monop'", mcc: "5411" },
  { name: "Paul", mcc: "5812" },
  { name: "Pharmacie Avenue de l'Opera", mcc: "5912" },
  { name: "Ralph Lauren", mcc: "5651" },
  { name: "Sandro", mcc: "5651" },
  { name: "Semilla", mcc: "5812" },
  { name: "Shin Izakaya", mcc: "5812" },
  { name: "Uber", mcc: "4121" },
];

async function main() {
  console.log("Updating merchants with MCC codes...\n");

  let successCount = 0;
  let errorCount = 0;

  for (const update of mccUpdates) {
    const updateData: { mcc: string; name?: string } = { mcc: update.mcc };
    if (update.newName) {
      updateData.name = update.newName;
    }

    const { data, error } = await supabase
      .from("merchants")
      .update(updateData)
      .eq("name", update.name)
      .select("id, name, mcc");

    if (error) {
      console.error(`❌ Error updating "${update.name}":`, error.message);
      errorCount++;
    } else if (data && data.length > 0) {
      const displayName = update.newName ? `${update.name} → ${update.newName}` : update.name;
      console.log(`✓ Updated "${displayName}" with MCC ${update.mcc} (${data.length} record(s))`);
      successCount += data.length;
    } else {
      console.log(`⚠ No merchant found with name "${update.name}"`);
    }
  }

  console.log(`\n✅ Successfully updated: ${successCount} merchants`);
  if (errorCount > 0) {
    console.log(`❌ Errors: ${errorCount}`);
  }

  // Verify remaining merchants without MCC
  const { data: remaining } = await supabase
    .from("merchants")
    .select("name, mcc")
    .or("mcc.is.null,mcc.eq.");

  if (remaining && remaining.length > 0) {
    console.log(`\n⚠ Remaining merchants without MCC: ${remaining.length}`);
    for (const m of remaining) {
      console.log(`  - ${m.name}`);
    }
  } else {
    console.log("\n🎉 All merchants now have MCC codes!");
  }
}

main();
