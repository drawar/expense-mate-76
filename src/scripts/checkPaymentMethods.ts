import { supabase } from "@/integrations/supabase/client";

async function checkPaymentMethods() {
  console.log("Checking payment methods in database...\n");

  // Check auth status
  const { data: authData } = await supabase.auth.getSession();
  console.log(
    "Auth status:",
    authData.session ? "Authenticated" : "Not authenticated"
  );
  console.log("User ID:", authData.session?.user?.id || "None");
  console.log();

  // Get all payment methods (without filter)
  const { data: allMethods, error: allError } = await supabase
    .from("payment_methods")
    .select("*")
    .order("name");

  if (allError) {
    console.error("Error fetching all payment methods:", allError);
    return;
  }

  console.log(`Total payment methods in database: ${allMethods?.length || 0}`);
  console.log();

  if (allMethods && allMethods.length > 0) {
    console.log("Payment methods details:");
    allMethods.forEach((pm, index) => {
      console.log(`\n${index + 1}. ${pm.name}`);
      console.log(`   ID: ${pm.id}`);
      console.log(`   Type: ${pm.type}`);
      console.log(`   is_active: ${pm.is_active}`);
      console.log(`   user_id: ${pm.user_id}`);
    });
  }

  console.log("\n---\n");

  // Get only active payment methods (what the app uses)
  const { data: activeMethods, error: activeError } = await supabase
    .from("payment_methods")
    .select("*")
    .eq("is_active", true)
    .order("name");

  if (activeError) {
    console.error("Error fetching active payment methods:", activeError);
    return;
  }

  console.log(
    `Active payment methods (is_active = true): ${activeMethods?.length || 0}`
  );

  if (activeMethods && activeMethods.length > 0) {
    activeMethods.forEach((pm, index) => {
      console.log(`${index + 1}. ${pm.name}`);
    });
  }

  // Check localStorage as fallback
  console.log("\n---\n");
  console.log("Checking localStorage...");

  const localStorageKey1 = "expense-tracker-payment-methods";
  const localStorageKey2 = "paymentMethods";

  const stored1 = localStorage.getItem(localStorageKey1);
  const stored2 = localStorage.getItem(localStorageKey2);

  if (stored1) {
    const methods = JSON.parse(stored1);
    console.log(
      `Found ${methods.length} payment methods in localStorage (${localStorageKey1})`
    );
    methods.forEach((pm: { name: string; active: boolean }, index: number) => {
      console.log(`${index + 1}. ${pm.name} (active: ${pm.active})`);
    });
  } else {
    console.log(`No payment methods in localStorage (${localStorageKey1})`);
  }

  if (stored2) {
    const methods = JSON.parse(stored2);
    console.log(
      `Found ${methods.length} payment methods in localStorage (${localStorageKey2})`
    );
  } else {
    console.log(`No payment methods in localStorage (${localStorageKey2})`);
  }
}

checkPaymentMethods().catch(console.error);
