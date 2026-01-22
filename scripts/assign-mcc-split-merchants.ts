import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

const assignments = [
  {
    name: "Horin Ramen (Crystal Mall)",
    mcc_code: "5812",
    mcc: { code: "5812", description: "Restaurants & Eating Places" },
  },
  {
    name: "Horin Ramen (Robson)",
    mcc_code: "5812",
    mcc: { code: "5812", description: "Restaurants & Eating Places" },
  },
  {
    name: "Nemesis Coffee (Gastown)",
    mcc_code: "5814",
    mcc: { code: "5814", description: "Fast Food Restaurants" },
  },
  {
    name: "Nemesis Coffee (Great Northern Way)",
    mcc_code: "5814",
    mcc: { code: "5814", description: "Fast Food Restaurants" },
  },
];

async function main() {
  console.log("Assigning MCC codes to split merchants...\n");

  let updated = 0;
  let errors = 0;

  for (const a of assignments) {
    const { error } = await supabase
      .from("merchants")
      .update({ mcc_code: a.mcc_code, mcc: a.mcc })
      .eq("name", a.name);

    if (error) {
      console.error(`❌ ${a.name}: ${error.message}`);
      errors++;
    } else {
      console.log(`✓ ${a.name}: ${a.mcc_code} - ${a.mcc.description}`);
      updated++;
    }
  }

  console.log(`\n${"=".repeat(50)}`);
  console.log(`Updated: ${updated} merchants`);
  console.log(`Errors: ${errors}`);
}

main();
