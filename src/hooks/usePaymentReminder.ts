/**
 * usePaymentReminder Hook
 *
 * Triggers payment reminder check on app load for credit card payment methods.
 * The Edge Function will determine which reminders to send based on:
 * - Statement period start date (10 days must have passed)
 * - Whether a reminder has already been sent for this period
 *
 * Usage: Call this hook once at app startup after user authentication.
 */

import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface PaymentReminderResult {
  success: boolean;
  reminders_sent: number;
  results?: Array<{
    cardName: string;
    status: string;
    error?: string;
  }>;
  error?: string;
}

/**
 * Hook that triggers payment reminder check on app load.
 * Only runs once per session when user is authenticated.
 */
export function usePaymentReminder(): void {
  const { user, session } = useAuth();
  const hasChecked = useRef(false);

  useEffect(() => {
    // Only run once per session, when user is authenticated
    if (!user || !session?.access_token || hasChecked.current) {
      return;
    }

    const checkPaymentReminders = async () => {
      try {
        hasChecked.current = true;
        console.log("Checking payment reminders...");

        const { data, error } =
          await supabase.functions.invoke<PaymentReminderResult>(
            "payment-reminder",
            {
              headers: {
                Authorization: `Bearer ${session.access_token}`,
              },
            }
          );

        if (error) {
          console.error("Payment reminder check failed:", error);
          return;
        }

        if (data?.reminders_sent && data.reminders_sent > 0) {
          console.log(`Payment reminders sent: ${data.reminders_sent}`);
          // Log individual results for debugging
          data.results?.forEach((result) => {
            console.log(
              `  ${result.cardName}: ${result.status}${result.error ? ` (${result.error})` : ""}`
            );
          });
        } else {
          console.log("No payment reminders needed");
        }
      } catch (error) {
        console.error("Error checking payment reminders:", error);
      }
    };

    // Small delay to not block initial app load
    const timeoutId = setTimeout(checkPaymentReminders, 2000);

    return () => clearTimeout(timeoutId);
  }, [user, session]);
}

export default usePaymentReminder;
