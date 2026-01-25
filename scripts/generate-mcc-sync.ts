import { MCC_MAPPINGS } from "../src/utils/categoryMapping";

// Generate SQL UPSERT statements
const statements: string[] = [];

// Start transaction
statements.push("-- MCC Table Sync from categoryMapping.ts");
statements.push("-- Generated: " + new Date().toISOString());
statements.push("BEGIN;");
statements.push("");

// Generate upsert for each MCC
for (const [code, mapping] of Object.entries(MCC_MAPPINGS)) {
  const escapedDesc = mapping.description.replace(/'/g, "''");
  statements.push(
    `INSERT INTO mcc (code, description) VALUES ('${code}', '${escapedDesc}') ON CONFLICT (code) DO UPDATE SET description = EXCLUDED.description;`
  );
}

statements.push("");
statements.push("COMMIT;");

console.log(statements.join("\n"));
