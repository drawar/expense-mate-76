import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

// Transaction reassignments
const reassignments = [
  {
    transactionId: "4b40e7e3-88e6-435e-ad61-99e37f8d8c81",
    newMerchantId: "64b5fffc-6a93-4531-a057-c8181b726d1f", // Crystal Mall
    description: "Horin Ramen (2025-10-12) → Crystal Mall",
  },
  {
    transactionId: "7ea6ef61-8349-4eba-9a4f-809d2ff701b9",
    newMerchantId: "a311643a-d6da-4d76-a543-82650cd00b51", // Robson
    description: "Horin Ramen (2025-10-17) → Robson",
  },
  {
    transactionId: "49879da7-77aa-40e9-b2b6-08eeab5e6d99",
    newMerchantId: "f493ea1b-3247-4d9f-ae71-ebb4f519b515", // Gastown
    description: "Nemesis Coffee (2025-10-17) → Gastown",
  },
  {
    transactionId: "4495527f-a424-4e3f-b3f9-3dfa008b69ab",
    newMerchantId: "d57a8e51-5d27-43c6-80da-9b3061569182", // Great Northern Way
    description: "Nemesis Coffee (2026-01-11) → Great Northern Way",
  },
];

async function main() {
  console.log("Reassigning transactions...\n");

  let updated = 0;
  let errors = 0;

  for (const r of reassignments) {
    const { error } = await supabase
      .from("transactions")
      .update({ merchant_id: r.newMerchantId })
      .eq("id", r.transactionId);

    if (error) {
      console.error(`❌ ${r.description}: ${error.message}`);
      errors++;
    } else {
      console.log(`✓ ${r.description}`);
      updated++;
    }
  }

  console.log(`\n${"=".repeat(50)}`);
  console.log(`Updated: ${updated} transactions`);
  console.log(`Errors: ${errors}`);

  // Now delete the original merchants (they should have no transactions)
  console.log("\nChecking if original merchants can be deleted...");

  const originalMerchants = [
    { id: "e3247320-8518-4846-bd63-cce196a25733", name: "Horin Ramen" },
    { id: "39bbfb2c-b828-4461-8325-55bd3af161e7", name: "Nemesis Coffee" },
  ];

  for (const m of originalMerchants) {
    // Check for remaining transactions
    const { count } = await supabase
      .from("transactions")
      .select("id", { count: "exact", head: true })
      .eq("merchant_id", m.id);

    if (count === 0) {
      // Safe to delete
      const { error } = await supabase
        .from("merchants")
        .delete()
        .eq("id", m.id);

      if (error) {
        console.log(`⚠ Could not delete ${m.name}: ${error.message}`);
      } else {
        console.log(`✓ Deleted original merchant: ${m.name}`);
      }
    } else {
      console.log(`⚠ ${m.name} still has ${count} transactions, not deleting`);
    }
  }
}

main();
