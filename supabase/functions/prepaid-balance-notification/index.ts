import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface PrepaidBalanceNotificationRequest {
  userEmail: string;
  cardName: string;
  merchantName: string;
  transactionAmount: number;
  transactionCurrency: string;
  previousBalance: number;
  newBalance: number;
  cardCurrency: string;
}

/**
 * Format currency amount for display
 */
function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload: PrepaidBalanceNotificationRequest = await req.json();

    const {
      userEmail,
      cardName,
      merchantName,
      transactionAmount,
      transactionCurrency,
      previousBalance,
      newBalance,
      cardCurrency,
    } = payload;

    // Validate required fields
    if (!userEmail || !cardName) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const formattedTxAmount = formatCurrency(
      transactionAmount,
      transactionCurrency
    );
    const formattedPrevBalance = formatCurrency(previousBalance, cardCurrency);
    const formattedNewBalance = formatCurrency(newBalance, cardCurrency);

    // Build email content
    const subject = `${cardName} Balance Update: ${formattedNewBalance} remaining`;

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.5; color: #333; margin: 0; padding: 20px; background-color: #ffffff;">
  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width: 480px; margin: 0 auto;">
    <tr>
      <td style="background: #f8f9fa; border-radius: 12px; padding: 24px;">
        <!-- Card Name -->
        <table cellpadding="0" cellspacing="0" border="0" width="100%">
          <tr>
            <td style="font-size: 16px; font-weight: 600; color: #1a1a1a; padding-bottom: 16px;">
              ${cardName}
            </td>
          </tr>
        </table>

        <!-- Balance Rows -->
        <table cellpadding="0" cellspacing="0" border="0" width="100%" style="font-size: 14px;">
          <tr>
            <td style="color: #6c757d; padding: 10px 0; border-bottom: 1px solid #e9ecef;">Previous Balance</td>
            <td style="text-align: right; font-weight: 500; color: #333; padding: 10px 0; border-bottom: 1px solid #e9ecef;">${formattedPrevBalance}</td>
          </tr>
          <tr>
            <td style="color: #6c757d; padding: 10px 0; border-bottom: 1px solid #e9ecef;">Transaction</td>
            <td style="text-align: right; font-weight: 500; color: #dc3545; padding: 10px 0; border-bottom: 1px solid #e9ecef;">-${formattedTxAmount}</td>
          </tr>
          <tr>
            <td style="color: #6c757d; padding: 10px 0;">New Balance</td>
            <td style="text-align: right; font-weight: 600; color: #2d5a27; padding: 10px 0;">${formattedNewBalance}</td>
          </tr>
        </table>

        <!-- Merchant -->
        <table cellpadding="0" cellspacing="0" border="0" width="100%">
          <tr>
            <td style="font-size: 13px; font-style: italic; color: #6c757d; padding-top: 16px;">
              at ${merchantName}
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="font-size: 12px; color: #6c757d; text-align: center; padding-top: 24px;">
        Sent by Clairo - Your expense tracking assistant
      </td>
    </tr>
  </table>
</body>
</html>
`;

    const textContent = `${cardName} Balance Update

Previous Balance: ${formattedPrevBalance}
Transaction: -${formattedTxAmount}
New Balance: ${formattedNewBalance}

at ${merchantName}

---
Sent by Clairo - Your expense tracking assistant
`;

    // Send email via Resend
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Clairo <noreply@clairoapp.com>",
        to: userEmail,
        subject,
        html: htmlContent,
        text: textContent,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("Resend API error:", errorBody);
      throw new Error(`Resend API error: ${response.status}`);
    }

    const result = await response.json();
    console.log(`Email sent successfully to ${userEmail}, ID: ${result.id}`);

    return new Response(JSON.stringify({ success: true, emailId: result.id }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error sending prepaid balance notification:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
