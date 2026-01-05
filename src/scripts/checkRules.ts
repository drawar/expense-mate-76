import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  // Get ALL rules for Platinum and Cobalt
  const { data: rules, error } = await supabase
    .from("reward_rules")
    .select(
      "name, conditions, base_multiplier, bonus_multiplier, enabled, card_type_id"
    )
    .in("card_type_id", [
      "american-express-platinum",
      "american-express-cobalt",
    ]);

  console.log("Error:", error);
  console.log("Total rules:", rules?.length);

  rules?.forEach((rule) => {
    let conditions: { type: string; value?: string[] }[] = [];
    if (typeof rule.conditions === "string") {
      try {
        conditions = JSON.parse(rule.conditions);
      } catch {
        /* ignore parse errors */
      }
    } else if (Array.isArray(rule.conditions)) {
      conditions = rule.conditions;
    }
    const mccCondition = conditions?.find((c) => c.type === "mcc");
    const mccs = mccCondition?.value || [];
    console.log(
      `${rule.card_type_id} | ${rule.name}: ${rule.base_multiplier}x + ${rule.bonus_multiplier || 0}x bonus (enabled: ${rule.enabled})`
    );
    console.log(
      `  Raw conditions: ${JSON.stringify(conditions).slice(0, 200)}`
    );
    if (mccs.length > 0) {
      console.log(
        `  MCCs: ${mccs.slice(0, 5).join(", ")}${mccs.length > 5 ? "..." : ""} (${mccs.length} total)`
      );
    }
  });

  // Check for MCC 3007 (Air France)
  console.log("\n=== Checking MCC 3007 (Airlines) ===");
  const airlineMcc = "3007";

  if (rules) {
    for (const rule of rules) {
      let conditions: { type: string; value?: string[] }[] = [];
      if (typeof rule.conditions === "string") {
        try {
          conditions = JSON.parse(rule.conditions);
        } catch {
          /* ignore parse errors */
        }
      } else if (Array.isArray(rule.conditions)) {
        conditions = rule.conditions;
      }
      const mccCondition = conditions?.find((c) => c.type === "mcc");
      const mccs = mccCondition?.value || [];

      if (mccs.length === 0 || mccs.includes(airlineMcc)) {
        console.log(
          `MATCH: ${rule.card_type_id} - ${rule.name}: ${rule.base_multiplier}x`
        );
      }
    }
  }
}

main();
