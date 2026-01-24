import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

const updates = [
  {
    name: "Grouse Mountain Altitude Bistro",
    address: "6400 Nancy Greene Way, North Vancouver, BC V7R 4K9, Canada",
    display_location: "Grouse Mountain, North Vancouver",
    coordinates: { lat: 49.3802, lng: -123.0818 },
    google_maps_url: "https://maps.google.com/?q=Grouse+Mountain+Altitude+Bistro",
  },
  {
    name: "Grouse Mountain Cafe",
    address: "6400 Nancy Greene Way, North Vancouver, BC V7R 4K9, Canada",
    display_location: "Grouse Mountain, North Vancouver",
    coordinates: { lat: 49.3802, lng: -123.0818 },
    google_maps_url: "https://maps.google.com/?q=Grouse+Mountain+Cafe",
  },
  {
    name: "Grouse Mountain Shop",
    address: "6400 Nancy Greene Way, North Vancouver, BC V7R 4K9, Canada",
    display_location: "Grouse Mountain, North Vancouver",
    coordinates: { lat: 49.3802, lng: -123.0818 },
    google_maps_url: "https://maps.google.com/?q=Grouse+Mountain+Shop",
  },
  {
    name: "Grouse Mountain Ski Rentals",
    address: "6400 Nancy Greene Way, North Vancouver, BC V7R 4K9, Canada",
    display_location: "Grouse Mountain, North Vancouver",
    coordinates: { lat: 49.3802, lng: -123.0818 },
    google_maps_url: "https://maps.google.com/?q=Grouse+Mountain+Ski+Rentals",
  },
  {
    name: "Sheng Shiong",
    address: "1 Joo Koon Circle, Singapore 629117",
    display_location: "Joo Koon, Singapore",
    coordinates: { lat: 1.3271, lng: 103.6784 },
    google_maps_url: "https://maps.google.com/?q=Sheng+Siong+Joo+Koon",
  },
];

async function main() {
  console.log("Adding missing addresses...\n");

  let updated = 0;
  let errors = 0;

  for (const u of updates) {
    const { error } = await supabase
      .from("merchants")
      .update({
        address: u.address,
        display_location: u.display_location,
        coordinates: u.coordinates,
        google_maps_url: u.google_maps_url,
      })
      .eq("name", u.name);

    if (error) {
      console.error(`❌ ${u.name}: ${error.message}`);
      errors++;
    } else {
      console.log(`✓ ${u.name}: ${u.display_location}`);
      updated++;
    }
  }

  console.log(`\n${"=".repeat(50)}`);
  console.log(`Updated: ${updated} merchants`);
  console.log(`Errors: ${errors}`);
}

main();
