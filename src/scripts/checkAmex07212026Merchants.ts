import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { join } from "path";

const envPath = join(process.cwd(), ".env");
const envContent = readFileSync(envPath, "utf-8");
const envVars: Record<string, string> = {};
for (const line of envContent.split("\n")) {
  const match = line.match(/^([^=]+)="?([^"]*)"?$/);
  if (match) envVars[match[1]] = match[2];
}

const supabase = createClient(
  envVars.VITE_SUPABASE_URL,
  envVars.SUPABASE_SERVICE_ROLE_KEY
);

const searchTerms = [
  "united airlines",
  "united",
  "poke bowl",
  "poke",
  "lyft",
  "uber trip",
  "uber",
  "mijote",
  "mijoté",
];

async function main() {
  for (const term of searchTerms) {
    const { data, error } = await supabase
      .from("merchants")
      .select(
        "id, name, address, mcc, is_online, coordinates, display_location, google_maps_url"
      )
      .ilike("name", `%${term}%`)
      .limit(10);

    if (error) {
      console.error(`  Error for ${term}: ${error.message}`);
      continue;
    }

    if (data && data.length > 0) {
      console.log(`\n[${term}]:`);
      for (const m of data) {
        console.log(`  ${m.id} | ${m.name}`);
        console.log(
          `    mcc=${m.mcc ?? "-"}  online=${m.is_online}  loc="${m.display_location ?? "-"}"`
        );
        console.log(`    address="${m.address ?? "-"}"`);
        console.log(`    coords=${JSON.stringify(m.coordinates)}`);
        console.log(`    maps=${m.google_maps_url ?? "-"}`);
      }
    } else {
      console.log(`\n[${term}]: (no matches)`);
    }
  }
}

main();
