import { supabase } from "@/integrations/supabase/client";
import { PaymentMethod } from "@/types";
import { toast } from "sonner";

const PAYMENT_METHODS_KEY = "expense-tracker-payment-methods";
const LEGACY_KEY = "paymentMethods";
const SYNC_INTERVAL_MS = 5 * 60 * 1000; // Sync every 5 minutes

let syncIntervalId: NodeJS.Timeout | null = null;

/**
 * Syncs payment methods from localStorage to Supabase after login
 */
export async function syncPaymentMethodsToSupabase(
  userId: string
): Promise<void> {
  try {
    console.log(
      "🔄 Starting sync of localStorage payment methods to Supabase..."
    );

    // Get payment methods from localStorage (check both keys)
    let localStorageData = localStorage.getItem(PAYMENT_METHODS_KEY);
    if (!localStorageData) {
      localStorageData = localStorage.getItem(LEGACY_KEY);
    }

    if (!localStorageData) {
      console.log("✅ No localStorage payment methods to sync");
      return;
    }

    const rawPaymentMethods: PaymentMethod[] = JSON.parse(localStorageData);

    // Filter out invalid payment methods (missing required fields)
    const localPaymentMethods = rawPaymentMethods.filter((pm) => {
      if (!pm.id || !pm.name) {
        console.warn(
          "⚠️ Skipping invalid payment method (missing id or name):",
          pm
        );
        return false;
      }
      return true;
    });

    if (localPaymentMethods.length === 0) {
      console.log("✅ No valid payment methods in localStorage to sync");
      return;
    }

    console.log(
      `📦 Found ${localPaymentMethods.length} valid payment methods in localStorage`
    );

    // Fetch existing payment methods from database to preserve fields set by quick setup
    const localIds = localPaymentMethods.map((pm) => pm.id);
    const { data: existingMethods } = await supabase
      .from("payment_methods")
      .select(
        "id, points_currency, reward_currency_id, statement_start_day, is_monthly_statement"
      )
      .in("id", localIds);

    // Create a map of existing database values
    const existingMap = new Map((existingMethods || []).map((m) => [m.id, m]));

    // Prepare payment methods for Supabase with correct column names
    // PaymentMethod uses camelCase but database uses snake_case
    // IMPORTANT: ALWAYS preserve points_currency and reward_currency_id from database
    // These are set by Quick Setup and should NOT be overwritten by stale localStorage data
    const paymentMethodsToSync = localPaymentMethods.map((pm) => {
      const existing = existingMap.get(pm.id);
      return {
        id: pm.id,
        name: pm.name,
        type: pm.type,
        issuer: pm.issuer,
        last_four_digits: pm.lastFourDigits,
        currency: pm.currency,
        icon: pm.icon,
        color: pm.color,
        image_url: pm.imageUrl,
        // ALWAYS prefer database values - Quick Setup updates DB directly
        // Only use localStorage value if DB doesn't have one
        points_currency: existing?.points_currency ?? pm.pointsCurrency ?? null,
        reward_currency_id:
          existing?.reward_currency_id ?? pm.rewardCurrencyId ?? null,
        is_active: pm.active ?? true,
        reward_rules: pm.rewardRules || [],
        selected_categories: pm.selectedCategories || [],
        // Use nullish coalescing for fields that can be explicitly set to falsy values
        statement_start_day:
          pm.statementStartDay ?? existing?.statement_start_day,
        is_monthly_statement:
          pm.isMonthlyStatement ?? existing?.is_monthly_statement,
        conversion_rate: pm.conversionRate || null,
        user_id: userId,
        updated_at: new Date().toISOString(),
      };
    });

    // Upsert to Supabase
    const { error } = await supabase
      .from("payment_methods")
      .upsert(paymentMethodsToSync, {
        onConflict: "id",
        ignoreDuplicates: false,
      });

    if (error) {
      console.error("❌ Error syncing payment methods to Supabase:", error);
      throw error;
    }

    console.log("✅ Successfully synced payment methods to Supabase");

    // Clear localStorage after successful sync (both keys)
    localStorage.removeItem(PAYMENT_METHODS_KEY);
    localStorage.removeItem(LEGACY_KEY);
    console.log("🗑️ Cleared payment methods from localStorage");

    toast.success("Payment methods synced to cloud");
  } catch (error) {
    console.error("Error in syncPaymentMethodsToSupabase:", error);
    toast.error("Failed to sync payment methods");
  }
}

/**
 * Starts periodic sync of localStorage to Supabase
 */
export function startPeriodicSync(userId: string): void {
  // Clear any existing interval
  stopPeriodicSync();

  console.log("🔄 Starting periodic sync (every 5 minutes)...");

  // Run sync immediately
  syncPaymentMethodsToSupabase(userId);

  // Then set up interval
  syncIntervalId = setInterval(() => {
    console.log("⏰ Running scheduled sync...");
    syncPaymentMethodsToSupabase(userId);
  }, SYNC_INTERVAL_MS);
}

/**
 * Stops periodic sync
 */
export function stopPeriodicSync(): void {
  if (syncIntervalId) {
    console.log("⏹️ Stopping periodic sync");
    clearInterval(syncIntervalId);
    syncIntervalId = null;
  }
}
