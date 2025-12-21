import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Anthropic from "https://esm.sh/@anthropic-ai/sdk@0.30.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, svix-id, svix-signature, svix-timestamp",
};

// Valid categories from the app
const VALID_CATEGORIES = [
  "Groceries",
  "Food & Drinks",
  "Travel",
  "Shopping",
  "Entertainment",
  "Health & Personal Care",
  "Services",
  "Utilities",
  "Education",
  "Financial Services",
  "Home & Rent",
  "Government",
  "Automotive",
  "Uncategorized",
];

// Valid currencies from the app
const VALID_CURRENCIES = [
  "USD",
  "EUR",
  "GBP",
  "JPY",
  "CAD",
  "AUD",
  "CNY",
  "INR",
  "SGD",
  "TWD",
  "VND",
  "IDR",
  "THB",
  "MYR",
];

// Resend inbound email webhook payload
interface ResendInboundEmail {
  from: string;
  to: string;
  subject: string;
  text: string;
  html: string;
  attachments?: Array<{
    filename: string;
    content_type: string;
    content: string; // base64 encoded
  }>;
}

// Parsed expense data from Claude
interface ParsedExpense {
  merchant: string;
  amount: number;
  currency: string;
  date: string;
  category: string;
  notes?: string;
  confidence: number;
  error?: string;
}

/**
 * Extract email address from "Name <email@domain.com>" format
 */
function extractEmail(fromHeader: string): string | null {
  const emailMatch = fromHeader.match(/<(.+)>/) || [null, fromHeader];
  const email = emailMatch[1]?.toLowerCase().trim();

  // Basic email validation
  if (email && email.includes("@")) {
    return email;
  }
  return null;
}

/**
 * Parse expense data from email content using Claude API
 */
async function parseExpenseWithClaude(
  anthropic: Anthropic,
  subject: string,
  text: string,
  html: string,
  attachments: Array<{
    filename: string;
    content_type: string;
    content: string;
  }>
): Promise<ParsedExpense> {
  const today = new Date().toISOString().split("T")[0];

  const systemPrompt = `You are an expense parsing assistant. Extract expense information from forwarded receipt emails.

Return ONLY a valid JSON object with these exact fields:
{
  "merchant": "string - business/store name",
  "amount": number - total amount (numeric only, no currency symbols),
  "currency": "string - ISO 4217 code (USD, EUR, SGD, GBP, JPY, etc.)",
  "date": "string - YYYY-MM-DD format",
  "category": "string - one of: Groceries, Food & Drinks, Travel, Shopping, Entertainment, Health & Personal Care, Services, Utilities, Education, Financial Services, Home & Rent, Government, Automotive, Uncategorized",
  "notes": "string - brief description of the purchase",
  "confidence": number between 0 and 1
}

If parsing fails or you cannot extract meaningful expense data, return:
{"error": "reason", "confidence": 0}

Important:
- For dates, use the receipt/transaction date, not the email forwarding date
- If date is unclear, use today: ${today}
- Extract the final/total amount, not subtotals or individual items
- Identify currency from symbols ($, S$, EUR, RM, etc.) or context
- Look for total, amount due, grand total, or similar indicators
- For Singapore receipts, assume SGD unless otherwise indicated`;

  const content: Anthropic.ContentBlockParam[] = [];

  // Add text content
  const emailContent = text || html || "";
  content.push({
    type: "text",
    text: `Parse this forwarded receipt email:\n\nSubject: ${subject}\n\nContent:\n${emailContent.slice(0, 15000)}`,
  });

  // Add image attachments (receipts)
  for (const attachment of attachments) {
    const supportedTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
    ];
    if (supportedTypes.includes(attachment.content_type)) {
      content.push({
        type: "image",
        source: {
          type: "base64",
          media_type: attachment.content_type as
            | "image/jpeg"
            | "image/png"
            | "image/gif"
            | "image/webp",
          data: attachment.content,
        },
      });
    }
  }

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: "user", content }],
    });

    const textContent = response.content.find((c) => c.type === "text");
    if (!textContent || textContent.type !== "text") {
      return { error: "No response from AI", confidence: 0 } as ParsedExpense;
    }

    // Extract JSON from response (handle markdown code blocks)
    let jsonStr = textContent.text;
    const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1];
    }
    return JSON.parse(jsonStr.trim());
  } catch (err) {
    console.error("Claude API error:", err);
    return {
      error: `AI parsing failed: ${err.message}`,
      confidence: 0,
    } as ParsedExpense;
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Initialize Supabase client with service role (bypasses RLS)
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  // Initialize Anthropic client
  const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

  let emailLogId: string | null = null;

  try {
    // 1. Verify webhook headers exist (Resend uses Svix for webhooks)
    const svixId = req.headers.get("svix-id");
    const svixTimestamp = req.headers.get("svix-timestamp");
    const svixSignature = req.headers.get("svix-signature");

    // Note: For production, implement full Svix signature verification
    // https://docs.svix.com/receiving/verifying-payloads/how
    if (!svixId || !svixTimestamp || !svixSignature) {
      console.warn("Missing Svix headers - webhook signature not verified");
      // Continue processing but log the warning
      // In production, you may want to reject unsigned requests
    }

    // 2. Parse request body
    const rawBody = await req.text();
    let payload: ResendInboundEmail;

    try {
      payload = JSON.parse(rawBody);
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON payload" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 3. Extract sender email
    const senderEmail = extractEmail(payload.from);
    if (!senderEmail) {
      return new Response(
        JSON.stringify({ error: "Could not parse sender email" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`Processing inbound email from: ${senderEmail}`);

    // 4. Look up user by email in Supabase Auth
    const { data: userData, error: userError } =
      await supabase.auth.admin.listUsers();

    if (userError) {
      console.error("Error listing users:", userError);
      throw new Error("Failed to look up users");
    }

    const user = userData.users.find(
      (u) => u.email?.toLowerCase() === senderEmail
    );

    if (!user) {
      // Log rejected email (no user_id since user not found)
      await supabase.from("email_expense_log").insert({
        from_email: senderEmail,
        subject: payload.subject,
        status: "rejected",
        error_message: "Sender email not registered",
        raw_email_data: {
          from: payload.from,
          to: payload.to,
          subject: payload.subject,
        },
      });

      console.log(`Rejected email from unregistered sender: ${senderEmail}`);

      return new Response(
        JSON.stringify({
          error: "Sender not registered",
          email: senderEmail,
        }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`Found user: ${user.id} for email: ${senderEmail}`);

    // 5. Create pending log entry
    const { data: logEntry, error: logError } = await supabase
      .from("email_expense_log")
      .insert({
        user_id: user.id,
        from_email: senderEmail,
        subject: payload.subject,
        status: "pending",
        raw_email_data: payload,
      })
      .select()
      .single();

    if (logError) {
      console.error("Error creating log entry:", logError);
    } else {
      emailLogId = logEntry.id;
    }

    // 6. Parse expense with Claude
    console.log("Parsing expense with Claude API...");
    let parsedExpense = await parseExpenseWithClaude(
      anthropic,
      payload.subject,
      payload.text,
      payload.html,
      payload.attachments || []
    );

    // 7. Handle low confidence or error responses
    if (parsedExpense.error || parsedExpense.confidence < 0.3) {
      console.log(
        `Low confidence (${parsedExpense.confidence}) or error: ${parsedExpense.error}`
      );

      // Create transaction with defaults for manual review
      const notes = parsedExpense.error
        ? `[Email parsing failed] ${parsedExpense.error}\n\nOriginal subject: ${payload.subject}`
        : `[Low confidence: ${parsedExpense.confidence}] Please review\n\nOriginal: ${payload.text?.slice(0, 500) || payload.subject}`;

      parsedExpense = {
        merchant: parsedExpense.merchant || "Unknown (from email)",
        amount: parsedExpense.amount || 0,
        currency: parsedExpense.currency || "USD",
        date: parsedExpense.date || new Date().toISOString().split("T")[0],
        category: "Uncategorized",
        notes: notes,
        confidence: parsedExpense.confidence || 0,
      };
    }

    // 8. Validate and sanitize parsed data
    if (!VALID_CURRENCIES.includes(parsedExpense.currency)) {
      console.log(
        `Invalid currency "${parsedExpense.currency}", defaulting to USD`
      );
      parsedExpense.currency = "USD";
    }

    if (!VALID_CATEGORIES.includes(parsedExpense.category)) {
      console.log(
        `Invalid category "${parsedExpense.category}", defaulting to Uncategorized`
      );
      parsedExpense.category = "Uncategorized";
    }

    // Ensure amount is positive
    parsedExpense.amount = Math.abs(parsedExpense.amount);

    // 9. Create merchant record
    const merchantId = crypto.randomUUID();
    const { error: merchantError } = await supabase.from("merchants").upsert(
      {
        id: merchantId,
        name: parsedExpense.merchant,
        is_online: false,
        is_deleted: false,
      },
      { onConflict: "id" }
    );

    if (merchantError) {
      console.error("Merchant upsert error:", merchantError);
    }

    // 10. Insert transaction
    const transactionData = {
      date: parsedExpense.date,
      merchant_id: merchantId,
      amount: parsedExpense.amount,
      currency: parsedExpense.currency,
      payment_method_id: null, // Unknown - user can update later
      payment_amount: parsedExpense.amount,
      payment_currency: parsedExpense.currency,
      total_points: 0,
      base_points: 0,
      bonus_points: 0,
      is_contactless: false,
      notes: `[Via Email] ${parsedExpense.notes || ""}`.trim(),
      category: parsedExpense.category,
      user_id: user.id,
    };

    const { data: transaction, error: txError } = await supabase
      .from("transactions")
      .insert(transactionData)
      .select()
      .single();

    if (txError) {
      throw new Error(`Transaction insert failed: ${txError.message}`);
    }

    console.log(`Transaction created: ${transaction.id}`);

    // 11. Update log entry with success
    if (emailLogId) {
      await supabase
        .from("email_expense_log")
        .update({
          status: "processed",
          transaction_id: transaction.id,
        })
        .eq("id", emailLogId);
    }

    return new Response(
      JSON.stringify({
        success: true,
        transactionId: transaction.id,
        parsed: {
          merchant: parsedExpense.merchant,
          amount: parsedExpense.amount,
          currency: parsedExpense.currency,
          date: parsedExpense.date,
          category: parsedExpense.category,
          confidence: parsedExpense.confidence,
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error processing inbound email:", error);

    // Update log entry with failure
    if (emailLogId) {
      await supabase
        .from("email_expense_log")
        .update({
          status: "failed",
          error_message: error.message,
        })
        .eq("id", emailLogId);
    }

    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
