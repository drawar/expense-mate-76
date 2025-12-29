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
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .card {
      background: #f8f9fa;
      border-radius: 12px;
      padding: 24px;
      margin: 20px 0;
    }
    .card-name {
      font-size: 18px;
      font-weight: 600;
      color: #1a1a1a;
      margin-bottom: 16px;
    }
    .balance-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #e9ecef;
    }
    .balance-row:last-child {
      border-bottom: none;
    }
    .label {
      color: #6c757d;
    }
    .value {
      font-weight: 500;
    }
    .new-balance {
      font-size: 24px;
      font-weight: 700;
      color: #2d5a27;
    }
    .transaction {
      color: #dc3545;
    }
    .merchant {
      font-style: italic;
      color: #6c757d;
      font-size: 14px;
      margin-top: 12px;
    }
    .footer {
      font-size: 12px;
      color: #6c757d;
      margin-top: 24px;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="card-name">${cardName}</div>

    <div class="balance-row">
      <span class="label">Previous Balance</span>
      <span class="value">${formattedPrevBalance}</span>
    </div>

    <div class="balance-row">
      <span class="label">Transaction</span>
      <span class="value transaction">-${formattedTxAmount}</span>
    </div>

    <div class="balance-row">
      <span class="label">New Balance</span>
      <span class="value new-balance">${formattedNewBalance}</span>
    </div>

    <div class="merchant">at ${merchantName}</div>
  </div>

  <div class="footer">
    Sent by Clairo - Your expense tracking assistant
  </div>
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
        from: "noreply@clairoapp.com",
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
