import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

async function main() {
  const { data, error } = await supabase.from("merchants").select("*").limit(1);
  if (error) {
    console.error("Error:", error);
  } else {
    console.log("Sample merchant keys:", Object.keys(data?.[0] || {}));
    console.log("Sample merchant:", JSON.stringify(data, null, 2));
  }
}

main();
