/**
 * BROWSER CONSOLE SCRIPT - American Express Platinum Card (Canada)
 *
 * Instructions:
 * 1. Log into the expense tracking app
 * 2. Open browser Developer Tools (F12 or Cmd+Opt+I)
 * 3. Go to Console tab
 * 4. Copy and paste this entire script
 * 5. Press Enter to run
 */

(async function setupAmexPlatinumCard() {
  console.log("=== Setting Up American Express Platinum Card (Canada) ===\n");

  // Get supabase client from the app
  const { supabase } = await import("/src/integrations/supabase/client.ts");
  const { initializeRuleRepository, getRuleRepository } = await import(
    "/src/core/rewards/RuleRepository.ts"
  );
  const { cardTypeIdService } = await import(
    "/src/core/rewards/CardTypeIdService.ts"
  );

  // Initialize repository
  try {
    initializeRuleRepository(supabase);
    console.log("✅ RuleRepository initialized\n");
  } catch (error) {
    console.error("❌ Failed to initialize repository:", error);
    return;
  }

  const repository = getRuleRepository();

  // Check authentication
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    console.error("❌ Not authenticated. Please log in first.");
    return;
  }
  console.log("✅ Authenticated as:", session.user.email, "\n");

  // Generate card type ID
  const cardTypeId = cardTypeIdService.generateCardTypeId(
    "American Express",
    "Platinum"
  );
  console.log("Card Type ID:", cardTypeId, "\n");

  // Check if Amex Platinum already exists for this user
  console.log("Checking for existing Amex Platinum card...");
  const { data: existingCard } = await supabase
    .from("payment_methods")
    .select("id")
    .eq("issuer", "American Express")
    .eq("name", "Platinum")
    .eq("user_id", session.user.id)
    .single();

  const paymentMethodId = existingCard?.id || crypto.randomUUID();
  const isUpdate = !!existingCard;

  console.log(
    isUpdate
      ? "Found existing card, updating..."
      : "Creating new payment method..."
  );

  const { error: pmError } = await supabase.from("payment_methods").upsert(
    {
      id: paymentMethodId,
      name: "Platinum",
      type: "credit_card",
      issuer: "American Express",
      currency: "CAD",
      points_currency: "Membership Rewards",
      is_active: true,
      statement_start_day: 8,
      is_monthly_statement: false,
      user_id: session.user.id,
    },
    { onConflict: "id" }
  );

  if (pmError) {
    console.error("❌ Failed to create payment method:", pmError);
    return;
  }
  console.log(
    "✅ Payment method",
    isUpdate ? "updated" : "created",
    "with ID:",
    paymentMethodId,
    "\n"
  );

  // Delete existing rules for this card
  console.log("Cleaning up existing rules...");
  const { data: existingRules } = await supabase
    .from("reward_rules")
    .select("id")
    .eq("card_type_id", cardTypeId);

  if (existingRules && existingRules.length > 0) {
    for (const rule of existingRules) {
      await repository.deleteRule(rule.id);
    }
    console.log("✅ Deleted", existingRules.length, "existing rule(s)\n");
  }

  try {
    // MCCs for restaurants, quick service restaurants, coffee shops, and drinking establishments
    const diningMCCs = ["5811", "5812", "5813", "5814"];
    const foodDeliveryMCCs = ["5499"];
    const diningCADMCCs = [...diningMCCs, ...foodDeliveryMCCs];

    // MCCs for travel services (worldwide 2x)
    const travelMCCs = [
      // Airlines (3000-3299)
      ...Array.from({ length: 300 }, (_, i) => String(3000 + i)),
      "4511", // Airlines
      // Hotels (3501-3799)
      ...Array.from({ length: 299 }, (_, i) => String(3501 + i)),
      "7011", // Hotels and Motels
      // Car Rentals (3351-3441)
      ...Array.from({ length: 91 }, (_, i) => String(3351 + i)),
      "7512", // Car Rental
      // Rail and Water Transport
      "4011",
      "4112",
      "4411",
      "4457",
      // Travel Agencies and Tour Operators
      "4722",
      "4723",
      // Other Travel
      "7032",
      "7033",
      "7513",
      "7519",
    ];

    // Rule 1: 2x on Dining in Canada (CAD only)
    console.log("Creating Rule 1: 2x on Dining in Canada (CAD only)...");
    await repository.createRule({
      cardTypeId: cardTypeId,
      name: "2x Points on Dining in Canada",
      description:
        "Earn 2 points per $1 CAD at restaurants, coffee shops, bars, and food delivery (excludes groceries)",
      enabled: true,
      priority: 30,
      conditions: [
        { type: "mcc", operation: "include", values: diningCADMCCs },
        { type: "currency", operation: "equals", values: ["CAD"] },
      ],
      reward: {
        calculationMethod: "standard",
        baseMultiplier: 1,
        bonusMultiplier: 1,
        pointsCurrency: "Membership Rewards",
        pointsRoundingStrategy: "nearest",
        amountRoundingStrategy: "none",
        blockSize: 1,
        monthlyCap: null,
        bonusTiers: [],
      },
    });
    console.log("✅ Rule 1 created\n");

    // Rule 2: 2x on Travel Worldwide (all currencies)
    console.log("Creating Rule 2: 2x on Travel Worldwide...");
    await repository.createRule({
      cardTypeId: cardTypeId,
      name: "2x Points on Travel",
      description:
        "Earn 2 points per $1 on travel services including airlines, hotels, rail, car rental, and tour operators (worldwide)",
      enabled: true,
      priority: 20,
      conditions: [{ type: "mcc", operation: "include", values: travelMCCs }],
      reward: {
        calculationMethod: "standard",
        baseMultiplier: 1,
        bonusMultiplier: 1,
        pointsCurrency: "Membership Rewards",
        pointsRoundingStrategy: "nearest",
        amountRoundingStrategy: "none",
        blockSize: 1,
        monthlyCap: null,
        bonusTiers: [],
      },
    });
    console.log("✅ Rule 2 created\n");

    // Rule 3: 1x on Everything Else
    console.log("Creating Rule 3: 1x on All Other Purchases...");
    await repository.createRule({
      cardTypeId: cardTypeId,
      name: "1x Points on All Other Purchases",
      description: "Earn 1 point per $1 on all other eligible purchases",
      enabled: true,
      priority: 1,
      conditions: [],
      reward: {
        calculationMethod: "standard",
        baseMultiplier: 1,
        bonusMultiplier: 0,
        pointsCurrency: "Membership Rewards",
        pointsRoundingStrategy: "nearest",
        amountRoundingStrategy: "none",
        blockSize: 1,
        monthlyCap: null,
        bonusTiers: [],
      },
    });
    console.log("✅ Rule 3 created\n");

    console.log("=== Setup Complete ===\n");
    console.log(
      "✅ American Express Platinum Card (Canada) configured successfully!\n"
    );
    console.log("Summary:");
    console.log("- Payment Method ID:", paymentMethodId);
    console.log("- Card Type ID:", cardTypeId);
    console.log("- Priority 30: 2x on dining in Canada (CAD only)");
    console.log("- Priority 20: 2x on travel worldwide");
    console.log("- Priority 1:  1x on everything else");
    console.log(
      "\nRefresh the page to see the new card in your payment methods."
    );
  } catch (error) {
    console.error("❌ Failed to create rules:", error);
  }
})();
