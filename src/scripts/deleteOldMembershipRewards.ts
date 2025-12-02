import { supabase } from "@/integrations/supabase/client";

/**
 * Delete all conversion rates for "Membership Rewards" (without "Points")
 */
async function deleteOldMembershipRewards() {
  console.log("Deleting old 'Membership Rewards' conversion rates...");

  try {
    const { data, error } = await supabase
      .from("conversion_rates")
      .delete()
      .eq("reward_currency", "Membership Rewards");

    if (error) {
      console.error("Error deleting conversion rates:", error);
      throw error;
    }

    console.log("✓ Successfully deleted 'Membership Rewards' conversion rates");
    console.log(`  Deleted ${data?.length || 0} entries`);
  } catch (error) {
    console.error("✗ Failed to delete conversion rates:", error);
    throw error;
  }
}

// Run in browser console
if (typeof window !== "undefined") {
  (window as any).deleteOldMembershipRewards = deleteOldMembershipRewards;
  console.log("Run: deleteOldMembershipRewards()");
}

export { deleteOldMembershipRewards };
