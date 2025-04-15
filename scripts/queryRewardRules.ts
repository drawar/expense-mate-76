import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import { mapDbRuleToRewardRule } from "../src/core/rewards/RuleMapper"; // adjust path
import { DbRewardRule } from "../src/core/rewards/types";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY!;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OUTPUT_PATH = path.resolve(__dirname, "../output/reward_rules.json");

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function main() {
  const { data, error } = await supabase
    .from<"reward_rules", DbRewardRule>("reward_rules")
    .select("*");

  if (error || !data) {
    console.error("❌ Failed to query Supabase:", error);
    return;
  }
  console.log("Raw Supabase response:", data);

  console.log(`✅ Retrieved ${data.length} rules`);

  const mapped = data.map(mapDbRuleToRewardRule);
  const serializable = mapped.map((rule) => ({
    ...rule,
    createdAt: rule.createdAt.toISO(),
    updatedAt: rule.updatedAt.toISO(),
  }));

  // Ensure output directory exists
  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(serializable, null, 2));
  console.log(`✅ Saved to ${OUTPUT_PATH}`);
}

main();
