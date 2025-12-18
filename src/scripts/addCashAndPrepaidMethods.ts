/**
 * Script to add two new payment methods:
 * 1. Cash (CAD)
 * 2. Prepaid Card (CAD)
 * 
 * USAGE:
 * This script must be run in the browser console while logged into the app.
 * 
 * 1. Open your app in the browser and log in
 * 2. Open the browser console (F12 or Cmd+Option+I)
 * 3. Copy and paste this entire file into the console
 * 4. The script will automatically run and add the payment methods
 */

import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from "uuid";

export async function addPaymentMethods() {
  console.log("=== Adding Cash and Prepaid Card Payment Methods ===\n");

  // Check authentication
  const {
    data: { session },
  } = await supabase.auth.getSession();
  
  if (!session) {
    console.error("❌ Not authenticated. Please log in first.");
    return;
  }
  
  console.log("✅ Authenticated as:", session.user.email, "\n");

  const userId = session.user.id;

  // Payment Method 1: Cash (CAD)
  console.log("1. Adding Cash (CAD)...");
  const cashMethod = {
    id: uuidv4(),
    user_id: userId,
    name: "Cash",
    type: "cash",
    issuer: "Cash",
    currency: "CAD",
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  try {
    const { error: cashError } = await supabase
      .from("payment_methods")
      .insert(cashMethod);

    if (cashError) {
      console.error("❌ Failed to add Cash method:", cashError.message);
    } else {
      console.log("✅ Cash (CAD) added successfully");
      console.log("   ID:", cashMethod.id);
    }
  } catch (error) {
    console.error("❌ Error adding Cash method:", error);
  }

  console.log();

  // Payment Method 2: Prepaid Card (CAD)
  console.log("2. Adding Prepaid Card (CAD)...");
  const prepaidMethod = {
    id: uuidv4(),
    user_id: userId,
    name: "Prepaid Card",
    type: "prepaid_card",
    issuer: "Generic",
    currency: "CAD",
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  try {
    const { error: prepaidError } = await supabase
      .from("payment_methods")
      .insert(prepaidMethod);

    if (prepaidError) {
      console.error("❌ Failed to add Prepaid Card method:", prepaidError.message);
    } else {
      console.log("✅ Prepaid Card (CAD) added successfully");
      console.log("   ID:", prepaidMethod.id);
    }
  } catch (error) {
    console.error("❌ Error adding Prepaid Card method:", error);
  }

  console.log("\n=== Setup Complete ===");
  console.log("\nThe payment methods have been added to your account.");
  console.log("You can now view them in the Payment Methods page.");
  console.log("\nRefresh the Payment Methods page to see the new methods.");
}

// Auto-run if in browser environment
if (typeof window !== 'undefined') {
  addPaymentMethods().catch(console.error);
}
