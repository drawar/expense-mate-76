/**
 * Diagnostic script to check what payment method data exists
 * 
 * This script helps identify if the payment method has the correct issuer/name
 */

import { supabase } from "@/integrations/supabase/client";
import { cardTypeIdService } from "@/core/rewards/CardTypeIdService";

async function diagnosePaymentMethodData() {
  console.log("=== Payment Method Data Diagnostic ===\n");

  // Check authentication
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    console.error("❌ Not authenticated. Please log in first.");
    return;
  }
  console.log("✅ Authenticated as:", session.user.email, "\n");

  // Query all payment methods
  console.log("🔍 Querying all payment methods...");
  const { data: paymentMethods, error } = await supabase
    .from("payment_methods")
    .select("*");

  if (error) {
    console.error("❌ Error querying payment methods:", error);
    return;
  }

  console.log(`\n📊 Found ${paymentMethods?.length || 0} payment methods:\n`);

  if (paymentMethods && paymentMethods.length > 0) {
    paymentMethods.forEach((pm) => {
      console.log(`\nPayment Method: ${pm.name}`);
      console.log(`  ID: ${pm.id}`);
      console.log(`  Issuer: "${pm.issuer}"`);
      console.log(`  Name: "${pm.name}"`);
      console.log(`  Currency: ${pm.currency}`);
      console.log(`  Active: ${pm.active}`);
      
      // Generate card type ID for this payment method
      const cardTypeId = cardTypeIdService.generateCardTypeId(
        pm.issuer,
        pm.name
      );
      console.log(`  Generated Card Type ID: "${cardTypeId}"`);
      
      // Check if this matches Citibank Rewards
      if (pm.issuer === "Citibank" && pm.name === "Rewards Visa Signature") {
        console.log(`  ✅ THIS IS THE CITIBANK REWARDS CARD`);
      }
    });
  } else {
    console.log("  (No payment methods found)");
  }

  console.log("\n=== Diagnostic Complete ===");
}

// Run the diagnostic
diagnosePaymentMethodData().catch(console.error);
