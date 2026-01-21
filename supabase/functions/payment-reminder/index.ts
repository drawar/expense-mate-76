import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface PaymentMethod {
  id: string;
  name: string;
  type: string;
  user_id: string;
  statement_start_day: number | null;
  is_monthly_statement: boolean | null;
  currency: string;
}

/**
 * Get the statement period for a payment method
 * Returns the start and end dates, plus a period identifier (YYYY-MM)
 */
function getStatementPeriod(
  paymentMethod: PaymentMethod,
  date: Date = new Date()
): { start: Date; end: Date; periodId: string } {
  // If no statement configuration, default to calendar month
  if (
    !paymentMethod.statement_start_day ||
    !paymentMethod.is_monthly_statement
  ) {
    const year = date.getFullYear();
    const month = date.getMonth();
    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 0); // Last day of month
    const periodId = `${year}-${String(month + 1).padStart(2, "0")}`;
    return { start, end, periodId };
  }

  const statementDay = paymentMethod.statement_start_day;
  const txDay = date.getDate();

  // Calculate which period this date belongs to
  let periodYear = date.getFullYear();
  let periodMonth = date.getMonth() + 1; // 1-indexed

  // If date is BEFORE the statement day, it belongs to the PREVIOUS month's period
  if (txDay < statementDay) {
    periodMonth -= 1;
    if (periodMonth === 0) {
      periodMonth = 12;
      periodYear -= 1;
    }
  }

  // Statement start is the statementDay of that period's month
  const statementStart = new Date(periodYear, periodMonth - 1, statementDay);

  // Statement end is one day before the next statement start
  const statementEnd = new Date(statementStart);
  statementEnd.setMonth(statementEnd.getMonth() + 1);
  statementEnd.setDate(statementEnd.getDate() - 1);

  const periodId = `${periodYear}-${String(periodMonth).padStart(2, "0")}`;

  return { start: statementStart, end: statementEnd, periodId };
}

/**
 * Check if 10 days have passed since statement period started
 */
function isDueForReminder(
  statementStart: Date,
  today: Date = new Date()
): boolean {
  const diffTime = today.getTime() - statementStart.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return diffDays >= 10;
}

/**
 * Format date for display
 */
function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Generate the HTML email content for payment reminder
 */
function generateEmailHtml(
  cardName: string,
  statementStart: Date,
  statementEnd: Date
): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Reminder</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; background-color: #f5f5f5;">
  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">

    <!-- Header -->
    <tr>
      <td style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 32px 24px; text-align: center;">
        <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">Payment Reminder</h1>
        <p style="margin: 8px 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">Time to pay your credit card</p>
      </td>
    </tr>

    <!-- Content -->
    <tr>
      <td style="padding: 32px 24px;">
        <div style="background: #fffbeb; border-left: 4px solid #f59e0b; border-radius: 4px; padding: 16px; margin-bottom: 24px;">
          <p style="margin: 0; font-size: 16px; color: #92400e;">
            <strong>Friendly reminder:</strong> Your credit card statement period has started, and payment may be due soon.
          </p>
        </div>

        <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom: 24px;">
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
              <span style="color: #6b7280; font-size: 14px;">Credit Card</span><br>
              <span style="font-size: 18px; font-weight: 600; color: #1f2937;">${cardName}</span>
            </td>
          </tr>
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
              <span style="color: #6b7280; font-size: 14px;">Statement Period</span><br>
              <span style="font-size: 16px; color: #1f2937;">${formatDate(statementStart)} - ${formatDate(statementEnd)}</span>
            </td>
          </tr>
        </table>

        <p style="margin: 0 0 16px; color: #4b5563; font-size: 15px;">
          Please check your statement and make sure to pay at least the minimum amount due to avoid late fees and interest charges.
        </p>

        <p style="margin: 0; color: #4b5563; font-size: 15px;">
          If you've already made a payment, you can safely ignore this reminder.
        </p>
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="background: #f8f9fa; padding: 20px 24px; text-align: center;">
        <p style="margin: 0; font-size: 12px; color: #6c757d;">
          Sent by Clairo - Your expense tracking assistant
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
`;
}

/**
 * Generate plain text version of the email
 */
function generateEmailText(
  cardName: string,
  statementStart: Date,
  statementEnd: Date
): string {
  return `Payment Reminder - ${cardName}
${"=".repeat(50)}

Friendly reminder: Your credit card statement period has started, and payment may be due soon.

Credit Card: ${cardName}
Statement Period: ${formatDate(statementStart)} - ${formatDate(statementEnd)}

Please check your statement and make sure to pay at least the minimum amount due to avoid late fees and interest charges.

If you've already made a payment, you can safely ignore this reminder.

---
Sent by Clairo - Your expense tracking assistant
`;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the user's JWT from the Authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Create a client with the user's JWT for RLS
    const supabaseUser = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    // Get the user from the JWT
    const {
      data: { user },
      error: userError,
    } = await supabaseUser.auth.getUser(authHeader.replace("Bearer ", ""));

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Invalid user token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!user.email) {
      return new Response(JSON.stringify({ error: "User has no email" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use service role client for database operations
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get all active credit card payment methods for the user
    const { data: creditCards, error: cardsError } = await supabase
      .from("payment_methods")
      .select(
        "id, name, type, user_id, statement_start_day, is_monthly_statement, currency"
      )
      .eq("user_id", user.id)
      .eq("type", "credit_card")
      .eq("is_active", true);

    if (cardsError) {
      throw cardsError;
    }

    if (!creditCards || creditCards.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "No credit cards found",
          reminders_sent: 0,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const today = new Date();
    const results: { cardName: string; status: string; error?: string }[] = [];
    let remindersSent = 0;

    for (const card of creditCards) {
      try {
        // Get statement period for this card
        const {
          start: statementStart,
          end: statementEnd,
          periodId,
        } = getStatementPeriod(card, today);

        // Check if 10 days have passed since statement started
        if (!isDueForReminder(statementStart, today)) {
          results.push({
            cardName: card.name,
            status: "skipped",
            error: "Not yet 10 days since statement started",
          });
          continue;
        }

        // Check if reminder was already sent for this period
        const { data: existingReminder, error: reminderCheckError } =
          await supabase
            .from("payment_reminders")
            .select("id")
            .eq("user_id", user.id)
            .eq("payment_method_id", card.id)
            .eq("statement_period", periodId)
            .single();

        if (reminderCheckError && reminderCheckError.code !== "PGRST116") {
          // PGRST116 is "no rows returned" which is expected
          throw reminderCheckError;
        }

        if (existingReminder) {
          results.push({
            cardName: card.name,
            status: "skipped",
            error: "Reminder already sent for this period",
          });
          continue;
        }

        // Generate email content
        const htmlContent = generateEmailHtml(
          card.name,
          statementStart,
          statementEnd
        );
        const textContent = generateEmailText(
          card.name,
          statementStart,
          statementEnd
        );

        // Send email via Resend
        const response = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: "Clairo <noreply@clairoapp.com>",
            to: user.email,
            subject: `Payment Reminder: ${card.name}`,
            html: htmlContent,
            text: textContent,
          }),
        });

        if (!response.ok) {
          const errorBody = await response.text();
          throw new Error(
            `Resend API error: ${response.status} - ${errorBody}`
          );
        }

        const emailResult = await response.json();
        console.log(
          `Payment reminder sent to ${user.email} for ${card.name}, ID: ${emailResult.id}`
        );

        // Record the sent reminder
        const { error: insertError } = await supabase
          .from("payment_reminders")
          .insert({
            user_id: user.id,
            payment_method_id: card.id,
            statement_period: periodId,
            sent_to_email: user.email,
          });

        if (insertError) {
          console.error(
            `Failed to record reminder for ${card.name}:`,
            insertError
          );
          // Don't throw - email was sent successfully
        }

        results.push({ cardName: card.name, status: "sent" });
        remindersSent++;

        // Add delay to avoid Resend rate limit (2 requests/second)
        await new Promise((resolve) => setTimeout(resolve, 600));
      } catch (cardError) {
        console.error(`Error processing ${card.name}:`, cardError);
        results.push({
          cardName: card.name,
          status: "failed",
          error: String(cardError),
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        reminders_sent: remindersSent,
        results,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in payment-reminder:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
