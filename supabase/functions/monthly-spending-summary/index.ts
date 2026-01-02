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

interface Transaction {
  id: string;
  date: string;
  amount: number;
  currency: string;
  payment_amount: number;
  payment_currency: string;
  total_points: number;
  category: string;
  merchant_id: string;
  payment_method_id: string;
  merchants?: { name: string };
  payment_methods?: {
    name: string;
    type: string;
    points_currency: string;
    total_loaded: number;
    currency: string;
  };
}

interface CategorySpending {
  category: string;
  amount: number;
  count: number;
}

interface MerchantData {
  name: string;
  amount: number;
  count: number;
}

interface PointsData {
  currency: string;
  points: number;
  spending: number;
  earnRate: number;
}

interface PrepaidCardBalance {
  name: string;
  balance: number;
  currency: string;
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

/**
 * Get the previous month's date range
 */
function getPreviousMonthRange(): {
  start: string;
  end: string;
  monthName: string;
  year: number;
} {
  const now = new Date();
  const firstOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastOfPrevMonth = new Date(firstOfThisMonth.getTime() - 1);
  const firstOfPrevMonth = new Date(
    lastOfPrevMonth.getFullYear(),
    lastOfPrevMonth.getMonth(),
    1
  );

  const monthName = firstOfPrevMonth.toLocaleString("en-US", { month: "long" });
  const year = firstOfPrevMonth.getFullYear();

  return {
    start: firstOfPrevMonth.toISOString().split("T")[0],
    end: lastOfPrevMonth.toISOString().split("T")[0],
    monthName,
    year,
  };
}

/**
 * Calculate spending breakdown by category
 */
function calculateCategorySpending(
  transactions: Transaction[],
  displayCurrency: string
): CategorySpending[] {
  const categoryMap = new Map<string, { amount: number; count: number }>();

  transactions.forEach((tx) => {
    // Use payment_amount if available (converted to card currency), otherwise amount
    const amount = tx.payment_amount || tx.amount;
    const category = tx.category || "Uncategorized";

    const existing = categoryMap.get(category) || { amount: 0, count: 0 };
    categoryMap.set(category, {
      amount: existing.amount + amount,
      count: existing.count + 1,
    });
  });

  return Array.from(categoryMap.entries())
    .map(([category, data]) => ({
      category,
      amount: data.amount,
      count: data.count,
    }))
    .sort((a, b) => b.amount - a.amount);
}

/**
 * Get top merchants by frequency
 */
function getFrequentMerchants(
  transactions: Transaction[],
  limit = 5
): MerchantData[] {
  const merchantMap = new Map<string, { amount: number; count: number }>();

  transactions.forEach((tx) => {
    const merchantName = tx.merchants?.name || "Unknown";
    const amount = tx.payment_amount || tx.amount;

    const existing = merchantMap.get(merchantName) || { amount: 0, count: 0 };
    merchantMap.set(merchantName, {
      amount: existing.amount + amount,
      count: existing.count + 1,
    });
  });

  return Array.from(merchantMap.entries())
    .map(([name, data]) => ({
      name,
      amount: data.amount,
      count: data.count,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

/**
 * Get top merchants by spending amount
 */
function getHighestSpendingMerchants(
  transactions: Transaction[],
  limit = 5
): MerchantData[] {
  const merchantMap = new Map<string, { amount: number; count: number }>();

  transactions.forEach((tx) => {
    const merchantName = tx.merchants?.name || "Unknown";
    const amount = tx.payment_amount || tx.amount;

    const existing = merchantMap.get(merchantName) || { amount: 0, count: 0 };
    merchantMap.set(merchantName, {
      amount: existing.amount + amount,
      count: existing.count + 1,
    });
  });

  return Array.from(merchantMap.entries())
    .map(([name, data]) => ({
      name,
      amount: data.amount,
      count: data.count,
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, limit);
}

/**
 * Calculate points earned by currency
 */
function calculatePointsEarned(transactions: Transaction[]): PointsData[] {
  const pointsMap = new Map<string, { points: number; spending: number }>();

  transactions.forEach((tx) => {
    if (tx.total_points <= 0) return;

    const pointsCurrency = tx.payment_methods?.points_currency || "Points";
    const spending = tx.payment_amount || tx.amount;

    const existing = pointsMap.get(pointsCurrency) || {
      points: 0,
      spending: 0,
    };
    pointsMap.set(pointsCurrency, {
      points: existing.points + tx.total_points,
      spending: existing.spending + spending,
    });
  });

  return Array.from(pointsMap.entries())
    .map(([currency, data]) => ({
      currency,
      points: data.points,
      spending: data.spending,
      earnRate: data.spending > 0 ? data.points / data.spending : 0,
    }))
    .sort((a, b) => b.points - a.points);
}

/**
 * Generate the HTML email content
 */
function generateEmailHtml(
  monthName: string,
  year: number,
  totalSpending: number,
  displayCurrency: string,
  categorySpending: CategorySpending[],
  frequentMerchants: MerchantData[],
  highestSpendingMerchants: MerchantData[],
  pointsEarned: PointsData[],
  prepaidBalances: PrepaidCardBalance[]
): string {
  const formattedTotal = formatCurrency(totalSpending, displayCurrency);

  // Category spending table rows
  const categoryRows = categorySpending
    .map(
      (cat) => `
      <tr>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e9ecef;">${cat.category}</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e9ecef; text-align: right;">${formatCurrency(cat.amount, displayCurrency)}</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e9ecef; text-align: center;">${cat.count}</td>
      </tr>
    `
    )
    .join("");

  // Frequent merchants table rows
  const frequentMerchantRows = frequentMerchants
    .map(
      (m, i) => `
      <tr>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e9ecef;">${i + 1}. ${m.name}</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e9ecef; text-align: center;">${m.count} visits</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e9ecef; text-align: right;">${formatCurrency(m.amount, displayCurrency)}</td>
      </tr>
    `
    )
    .join("");

  // Highest spending merchants table rows
  const highSpendingRows = highestSpendingMerchants
    .map(
      (m, i) => `
      <tr>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e9ecef;">${i + 1}. ${m.name}</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e9ecef; text-align: right;">${formatCurrency(m.amount, displayCurrency)}</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e9ecef; text-align: center;">${m.count} txns</td>
      </tr>
    `
    )
    .join("");

  // Points earned table rows
  const pointsRows =
    pointsEarned.length > 0
      ? pointsEarned
          .map(
            (p) => `
          <tr>
            <td style="padding: 8px 12px; border-bottom: 1px solid #e9ecef;">${p.currency}</td>
            <td style="padding: 8px 12px; border-bottom: 1px solid #e9ecef; text-align: right; font-weight: 600; color: #2d5a27;">+${p.points.toLocaleString()}</td>
            <td style="padding: 8px 12px; border-bottom: 1px solid #e9ecef; text-align: right;">${p.earnRate.toFixed(2)} pts/$</td>
          </tr>
        `
          )
          .join("")
      : `<tr><td colspan="3" style="padding: 12px; text-align: center; color: #6c757d;">No points earned this month</td></tr>`;

  // Prepaid card balances table rows
  const prepaidRows =
    prepaidBalances.length > 0
      ? prepaidBalances
          .map(
            (card) => `
          <tr>
            <td style="padding: 8px 12px; border-bottom: 1px solid #e9ecef;">${card.name}</td>
            <td style="padding: 8px 12px; border-bottom: 1px solid #e9ecef; text-align: right; font-weight: 600;">${formatCurrency(card.balance, card.currency)}</td>
          </tr>
        `
          )
          .join("")
      : `<tr><td colspan="2" style="padding: 12px; text-align: center; color: #6c757d;">No prepaid cards</td></tr>`;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${monthName} ${year} Spending Summary</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; background-color: #f5f5f5;">
  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">

    <!-- Header -->
    <tr>
      <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 32px 24px; text-align: center;">
        <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">${monthName} ${year}</h1>
        <p style="margin: 8px 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">Monthly Spending Summary</p>
      </td>
    </tr>

    <!-- Total Spending -->
    <tr>
      <td style="padding: 24px;">
        <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; text-align: center;">
          <p style="margin: 0 0 8px; color: #6c757d; font-size: 14px;">Total Spending</p>
          <p style="margin: 0; font-size: 32px; font-weight: 700; color: #1a1a1a;">${formattedTotal}</p>
        </div>
      </td>
    </tr>

    <!-- Spending by Category -->
    <tr>
      <td style="padding: 0 24px 24px;">
        <h2 style="margin: 0 0 16px; font-size: 18px; color: #1a1a1a; border-bottom: 2px solid #667eea; padding-bottom: 8px;">Spending by Category</h2>
        <table cellpadding="0" cellspacing="0" border="0" width="100%" style="font-size: 14px;">
          <thead>
            <tr style="background: #f8f9fa;">
              <th style="padding: 10px 12px; text-align: left; font-weight: 600; color: #495057;">Category</th>
              <th style="padding: 10px 12px; text-align: right; font-weight: 600; color: #495057;">Amount</th>
              <th style="padding: 10px 12px; text-align: center; font-weight: 600; color: #495057;">Txns</th>
            </tr>
          </thead>
          <tbody>
            ${categoryRows}
          </tbody>
        </table>
      </td>
    </tr>

    <!-- Top 5 Frequent Merchants -->
    <tr>
      <td style="padding: 0 24px 24px;">
        <h2 style="margin: 0 0 16px; font-size: 18px; color: #1a1a1a; border-bottom: 2px solid #667eea; padding-bottom: 8px;">Top 5 Frequent Merchants</h2>
        <table cellpadding="0" cellspacing="0" border="0" width="100%" style="font-size: 14px;">
          <thead>
            <tr style="background: #f8f9fa;">
              <th style="padding: 10px 12px; text-align: left; font-weight: 600; color: #495057;">Merchant</th>
              <th style="padding: 10px 12px; text-align: center; font-weight: 600; color: #495057;">Visits</th>
              <th style="padding: 10px 12px; text-align: right; font-weight: 600; color: #495057;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${frequentMerchantRows}
          </tbody>
        </table>
      </td>
    </tr>

    <!-- Top 5 Highest Spending Merchants -->
    <tr>
      <td style="padding: 0 24px 24px;">
        <h2 style="margin: 0 0 16px; font-size: 18px; color: #1a1a1a; border-bottom: 2px solid #667eea; padding-bottom: 8px;">Top 5 Highest Spending</h2>
        <table cellpadding="0" cellspacing="0" border="0" width="100%" style="font-size: 14px;">
          <thead>
            <tr style="background: #f8f9fa;">
              <th style="padding: 10px 12px; text-align: left; font-weight: 600; color: #495057;">Merchant</th>
              <th style="padding: 10px 12px; text-align: right; font-weight: 600; color: #495057;">Amount</th>
              <th style="padding: 10px 12px; text-align: center; font-weight: 600; color: #495057;">Txns</th>
            </tr>
          </thead>
          <tbody>
            ${highSpendingRows}
          </tbody>
        </table>
      </td>
    </tr>

    <!-- Points Earned -->
    <tr>
      <td style="padding: 0 24px 24px;">
        <h2 style="margin: 0 0 16px; font-size: 18px; color: #1a1a1a; border-bottom: 2px solid #667eea; padding-bottom: 8px;">Points Earned</h2>
        <table cellpadding="0" cellspacing="0" border="0" width="100%" style="font-size: 14px;">
          <thead>
            <tr style="background: #f8f9fa;">
              <th style="padding: 10px 12px; text-align: left; font-weight: 600; color: #495057;">Program</th>
              <th style="padding: 10px 12px; text-align: right; font-weight: 600; color: #495057;">Points</th>
              <th style="padding: 10px 12px; text-align: right; font-weight: 600; color: #495057;">Earn Rate</th>
            </tr>
          </thead>
          <tbody>
            ${pointsRows}
          </tbody>
        </table>
      </td>
    </tr>

    <!-- Prepaid Card Balances -->
    <tr>
      <td style="padding: 0 24px 24px;">
        <h2 style="margin: 0 0 16px; font-size: 18px; color: #1a1a1a; border-bottom: 2px solid #667eea; padding-bottom: 8px;">Prepaid Card Balances</h2>
        <table cellpadding="0" cellspacing="0" border="0" width="100%" style="font-size: 14px;">
          <thead>
            <tr style="background: #f8f9fa;">
              <th style="padding: 10px 12px; text-align: left; font-weight: 600; color: #495057;">Card</th>
              <th style="padding: 10px 12px; text-align: right; font-weight: 600; color: #495057;">Balance</th>
            </tr>
          </thead>
          <tbody>
            ${prepaidRows}
          </tbody>
        </table>
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
  monthName: string,
  year: number,
  totalSpending: number,
  displayCurrency: string,
  categorySpending: CategorySpending[],
  frequentMerchants: MerchantData[],
  highestSpendingMerchants: MerchantData[],
  pointsEarned: PointsData[],
  prepaidBalances: PrepaidCardBalance[]
): string {
  const formattedTotal = formatCurrency(totalSpending, displayCurrency);

  let text = `${monthName} ${year} - Monthly Spending Summary\n`;
  text += `${"=".repeat(50)}\n\n`;
  text += `Total Spending: ${formattedTotal}\n\n`;

  text += `SPENDING BY CATEGORY\n${"-".repeat(30)}\n`;
  categorySpending.forEach((cat) => {
    text += `${cat.category}: ${formatCurrency(cat.amount, displayCurrency)} (${cat.count} txns)\n`;
  });

  text += `\nTOP 5 FREQUENT MERCHANTS\n${"-".repeat(30)}\n`;
  frequentMerchants.forEach((m, i) => {
    text += `${i + 1}. ${m.name}: ${m.count} visits, ${formatCurrency(m.amount, displayCurrency)}\n`;
  });

  text += `\nTOP 5 HIGHEST SPENDING\n${"-".repeat(30)}\n`;
  highestSpendingMerchants.forEach((m, i) => {
    text += `${i + 1}. ${m.name}: ${formatCurrency(m.amount, displayCurrency)} (${m.count} txns)\n`;
  });

  text += `\nPOINTS EARNED\n${"-".repeat(30)}\n`;
  if (pointsEarned.length > 0) {
    pointsEarned.forEach((p) => {
      text += `${p.currency}: +${p.points.toLocaleString()} (${p.earnRate.toFixed(2)} pts/$)\n`;
    });
  } else {
    text += `No points earned this month\n`;
  }

  text += `\nPREPAID CARD BALANCES\n${"-".repeat(30)}\n`;
  if (prepaidBalances.length > 0) {
    prepaidBalances.forEach((card) => {
      text += `${card.name}: ${formatCurrency(card.balance, card.currency)}\n`;
    });
  } else {
    text += `No prepaid cards\n`;
  }

  text += `\n---\nSent by Clairo - Your expense tracking assistant\n`;

  return text;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get date range for previous month
    const { start, end, monthName, year } = getPreviousMonthRange();
    console.log(
      `Generating summary for ${monthName} ${year} (${start} to ${end})`
    );

    // Get all users
    const { data: usersData, error: usersError } =
      await supabase.auth.admin.listUsers();
    if (usersError) throw usersError;

    const results: { email: string; status: string; error?: string }[] = [];

    for (const user of usersData.users) {
      if (!user.email) continue;

      try {
        console.log(`Processing user: ${user.email}`);

        // Get transactions for this user in the previous month
        const { data: transactions, error: txError } = await supabase
          .from("transactions")
          .select(
            `
            *,
            merchants (name),
            payment_methods (name, type, points_currency, total_loaded, currency)
          `
          )
          .eq("user_id", user.id)
          .eq("is_deleted", false)
          .gte("date", start)
          .lte("date", end)
          .order("date", { ascending: false });

        if (txError) throw txError;

        if (!transactions || transactions.length === 0) {
          console.log(
            `No transactions for ${user.email} in ${monthName} ${year}`
          );
          results.push({
            email: user.email,
            status: "skipped",
            error: "No transactions",
          });
          continue;
        }

        // Get prepaid card balances
        const { data: prepaidCards, error: prepaidError } = await supabase
          .from("payment_methods")
          .select("name, total_loaded, currency")
          .eq("user_id", user.id)
          .eq("type", "prepaid_card")
          .eq("is_active", true);

        if (prepaidError) throw prepaidError;

        // Determine display currency (use most common payment currency)
        const currencyCounts = new Map<string, number>();
        transactions.forEach((tx: Transaction) => {
          const curr = tx.payment_currency || tx.currency || "CAD";
          currencyCounts.set(curr, (currencyCounts.get(curr) || 0) + 1);
        });
        const displayCurrency =
          Array.from(currencyCounts.entries()).sort(
            (a, b) => b[1] - a[1]
          )[0]?.[0] || "CAD";

        // Calculate all metrics
        const totalSpending = transactions.reduce(
          (sum: number, tx: Transaction) =>
            sum + (tx.payment_amount || tx.amount),
          0
        );
        const categorySpending = calculateCategorySpending(
          transactions,
          displayCurrency
        );
        const frequentMerchants = getFrequentMerchants(transactions, 5);
        const highestSpendingMerchants = getHighestSpendingMerchants(
          transactions,
          5
        );
        const pointsEarned = calculatePointsEarned(transactions);

        const prepaidBalances: PrepaidCardBalance[] = (prepaidCards || []).map(
          (card) => ({
            name: card.name,
            balance: card.total_loaded || 0,
            currency: card.currency || "CAD",
          })
        );

        // Generate email content
        const htmlContent = generateEmailHtml(
          monthName,
          year,
          totalSpending,
          displayCurrency,
          categorySpending,
          frequentMerchants,
          highestSpendingMerchants,
          pointsEarned,
          prepaidBalances
        );

        const textContent = generateEmailText(
          monthName,
          year,
          totalSpending,
          displayCurrency,
          categorySpending,
          frequentMerchants,
          highestSpendingMerchants,
          pointsEarned,
          prepaidBalances
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
            subject: `Your ${monthName} ${year} Spending Summary`,
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

        const result = await response.json();
        console.log(`Email sent to ${user.email}, ID: ${result.id}`);
        results.push({ email: user.email, status: "sent" });

        // Add delay to avoid Resend rate limit (2 requests/second)
        await new Promise((resolve) => setTimeout(resolve, 600));
      } catch (userError) {
        console.error(`Error processing ${user.email}:`, userError);
        results.push({
          email: user.email,
          status: "failed",
          error: String(userError),
        });
      }
    }

    return new Response(JSON.stringify({ success: true, results }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in monthly-spending-summary:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
