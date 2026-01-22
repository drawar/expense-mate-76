/**
 * Fix MCC field format - convert code-only strings to proper JSON object
 * Some merchants have MCC stored as just '5812' instead of {"code":"5812","description":"..."}
 */
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

// MCC code to description mapping
const mccDescriptions: Record<string, string> = {
  "4111": "Transportation—Suburban & Local Commuter",
  "4121": "Taxi & Limousines",
  "4814": "Telecommunication Services",
  "5309": "Duty Free Stores",
  "5651": "Family Clothing Stores",
  "5732": "Electronics Stores",
  "5812": "Restaurants & Eating Places",
  "5813": "Drinking Places (Bars, Taverns, Night Clubs)",
  "5912": "Drug Stores & Pharmacies",
  "5942": "Book Stores",
  "6012": "Financial Institutions - Merchandise & Services",
};

async function main() {
  console.log("Fetching merchants with MCC...\n");

  const { data: merchants, error } = await supabase
    .from("merchants")
    .select("id, name, mcc")
    .not("mcc", "is", null);

  if (error) {
    console.error("Error fetching merchants:", error);
    return;
  }

  let fixed = 0;
  let errors = 0;

  for (const m of merchants || []) {
    const mcc = m.mcc;

    // Only fix merchants where mcc is a simple code string (not a JSON string)
    if (typeof mcc === "string" && !mcc.startsWith("{")) {
      const code = mcc.trim();
      const description = mccDescriptions[code] || "Unknown";
      const newMcc = { code, description };

      console.log(`Fixing ${m.name}: "${mcc}" -> ${JSON.stringify(newMcc)}`);

      const { error: updateError } = await supabase
        .from("merchants")
        .update({ mcc: newMcc })
        .eq("id", m.id);

      if (updateError) {
        console.error(`  ❌ Error: ${updateError.message}`);
        errors++;
      } else {
        fixed++;
      }
    }
  }

  console.log("\n" + "=".repeat(50));
  console.log(`Fixed: ${fixed} merchants`);
  console.log(`Errors: ${errors}`);
}

main();
