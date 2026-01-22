/**
 * Create new merchants for split locations (Horin Ramen, Nemesis Coffee)
 */
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

const newMerchants = [
  {
    name: "Horin Ramen (Robson)",
    display_location: "Downtown, Vancouver",
    address: "1226 Robson St, Vancouver, BC",
    coordinates: { lat: 49.284, lng: -123.123 },
    google_maps_url:
      "https://www.google.com/maps/search/?api=1&query=Horin+Ramen+1226+Robson+St+Vancouver",
    is_online: false,
  },
  {
    name: "Horin Ramen (Crystal Mall)",
    display_location: "Metrotown, Burnaby",
    address: "4500 Kingsway #1687, Burnaby, BC",
    coordinates: { lat: 49.227, lng: -123.003 },
    google_maps_url:
      "https://www.google.com/maps/search/?api=1&query=Horin+Ramen+Crystal+Mall+4500+Kingsway+Burnaby",
    is_online: false,
  },
  {
    name: "Nemesis Coffee (Gastown)",
    display_location: "Gastown, Vancouver",
    address: "302 W Hastings St, Vancouver, BC",
    coordinates: { lat: 49.283, lng: -123.11 },
    google_maps_url:
      "https://www.google.com/maps/search/?api=1&query=Nemesis+Coffee+302+W+Hastings+St+Vancouver",
    is_online: false,
  },
  {
    name: "Nemesis Coffee (Great Northern Way)",
    display_location: "Mount Pleasant, Vancouver",
    address: "555 Great Northern Way, Vancouver, BC",
    coordinates: { lat: 49.267, lng: -123.089 },
    google_maps_url:
      "https://www.google.com/maps/search/?api=1&query=Nemesis+Coffee+555+Great+Northern+Way+Vancouver",
    is_online: false,
  },
];

async function main() {
  console.log("Creating split location merchants...\n");

  let created = 0;
  let errors = 0;

  for (const merchant of newMerchants) {
    const { error } = await supabase.from("merchants").insert(merchant);

    if (error) {
      if (error.code === "23505") {
        console.log(`⚠ Already exists: ${merchant.name}`);
      } else {
        console.error(`❌ Error creating ${merchant.name}: ${error.message}`);
        errors++;
      }
    } else {
      console.log(`✓ Created: ${merchant.name} (${merchant.display_location})`);
      created++;
    }
  }

  console.log("\n" + "=".repeat(50));
  console.log(`Created: ${created} merchants`);
  console.log(`Errors: ${errors}`);
  console.log(
    "\nNote: Original 'Horin Ramen' and 'Nemesis Coffee' merchants still exist."
  );
  console.log("You may want to reassign transactions manually if needed.");
}

main();
