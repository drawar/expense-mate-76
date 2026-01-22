/**
 * Fix remaining merchant locations - batch update script
 * Updates locations, renames, creates split merchants, and marks online merchants
 */
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

interface MerchantUpdate {
  name: string;
  display_location?: string;
  address?: string;
  coordinates?: { lat: number; lng: number };
  google_maps_url?: string;
  is_online?: boolean;
  newName?: string; // For renames
}

// Merchants to update with location data
const merchantUpdates: MerchantUpdate[] = [
  // Single location merchants
  {
    name: "Alchemy Kitchen and Bar",
    display_location: "Yaletown, Vancouver",
    address: "1068 Mainland St, Vancouver, BC",
    coordinates: { lat: 49.275, lng: -123.121 },
    google_maps_url:
      "https://www.google.com/maps/search/?api=1&query=Alchemy+Kitchen+and+Bar+1068+Mainland+St+Vancouver",
  },
  {
    name: "AMA",
    display_location: "Fraserhood, Vancouver",
    address: "3438 Fraser St, Vancouver, BC",
    coordinates: { lat: 49.245, lng: -123.089 },
    google_maps_url:
      "https://www.google.com/maps/search/?api=1&query=AMA+3438+Fraser+St+Vancouver",
  },
  {
    name: "Barra Gitano",
    display_location: "Davie Village, Vancouver",
    address: "1150 Davie St, Vancouver, BC",
    coordinates: { lat: 49.286, lng: -123.131 },
    google_maps_url:
      "https://www.google.com/maps/search/?api=1&query=Barra+Gitano+1150+Davie+St+Vancouver",
  },
  {
    name: "Bodega On Main",
    display_location: "Strathcona, Vancouver",
    address: "1014 Main St, Vancouver, BC",
    coordinates: { lat: 49.273, lng: -123.0995 },
    google_maps_url:
      "https://www.google.com/maps/search/?api=1&query=Bodega+On+Main+1014+Main+St+Vancouver",
  },
  {
    name: "Bonsor Recreation Complex",
    display_location: "Metrotown, Burnaby",
    address: "6550 Bonsor Ave, Burnaby, BC",
    coordinates: { lat: 49.227, lng: -123.004 },
    google_maps_url:
      "https://www.google.com/maps/search/?api=1&query=Bonsor+Recreation+Complex+6550+Bonsor+Ave+Burnaby",
  },
  {
    name: "Good Thief",
    display_location: "Mount Pleasant, Vancouver",
    address: "3336 Main St, Vancouver, BC",
    coordinates: { lat: 49.259, lng: -123.101 },
    google_maps_url:
      "https://www.google.com/maps/search/?api=1&query=Good+Thief+3336+Main+St+Vancouver",
  },
  {
    name: "Grouse Mountain",
    display_location: "North Vancouver",
    address: "6400 Nancy Greene Way, North Vancouver, BC",
    coordinates: { lat: 49.3794, lng: -123.0836 },
    google_maps_url:
      "https://www.google.com/maps/search/?api=1&query=Grouse+Mountain+6400+Nancy+Greene+Way+North+Vancouver",
  },
  {
    name: "Mangos Kitchen Bar",
    display_location: "Downtown, Vancouver",
    address: "1180 Howe St, Vancouver, BC",
    coordinates: { lat: 49.276, lng: -123.127 },
    google_maps_url:
      "https://www.google.com/maps/search/?api=1&query=Mangos+Kitchen+Bar+1180+Howe+St+Vancouver",
  },
  {
    name: "Matcha Cafe Maiko",
    display_location: "Richmond",
    address: "8279 Saba Rd, Richmond, BC",
    coordinates: { lat: 49.189, lng: -123.136 },
    google_maps_url:
      "https://www.google.com/maps/search/?api=1&query=Matcha+Cafe+Maiko+8279+Saba+Rd+Richmond",
  },
  {
    name: "Salon De Nuvida",
    display_location: "Yaletown, Vancouver",
    address: "880 Homer St, Vancouver, BC",
    coordinates: { lat: 49.277, lng: -123.121 },
    google_maps_url:
      "https://www.google.com/maps/search/?api=1&query=Salon+De+Nuvida+880+Homer+St+Vancouver",
  },
  {
    name: "Solo Karaoke",
    display_location: "Kingsway, Burnaby",
    address: "6462 Kingsway, Burnaby, BC",
    coordinates: { lat: 49.226, lng: -122.951 },
    google_maps_url:
      "https://www.google.com/maps/search/?api=1&query=Solo+Karaoke+6462+Kingsway+Burnaby",
  },
  {
    name: "The Fountainhead Pub",
    display_location: "Davie Village, Vancouver",
    address: "1025 Davie St, Vancouver, BC",
    coordinates: { lat: 49.281, lng: -123.128 },
    google_maps_url:
      "https://www.google.com/maps/search/?api=1&query=The+Fountainhead+Pub+1025+Davie+St+Vancouver",
  },
  {
    name: "Zab Bite",
    display_location: "Kensington-Cedar Cottage, Vancouver",
    address: "4197 Fraser St, Vancouver, BC",
    coordinates: { lat: 49.247, lng: -123.089 },
    google_maps_url:
      "https://www.google.com/maps/search/?api=1&query=Zab+Bite+4197+Fraser+St+Vancouver",
  },
  {
    name: "Breka Bakery",
    display_location: "Downtown, Vancouver",
    address: "740 W Hastings St, Vancouver, BC",
    coordinates: { lat: 49.287, lng: -123.117 },
    google_maps_url:
      "https://www.google.com/maps/search/?api=1&query=Breka+Bakery+740+W+Hastings+St+Vancouver",
  },
  // User-selected locations
  {
    name: "Chong Lee Market",
    display_location: "Renfrew-Collingwood, Vancouver",
    address: "3818 Rupert St, Vancouver, BC",
    coordinates: { lat: 49.249, lng: -123.034 },
    google_maps_url:
      "https://www.google.com/maps/search/?api=1&query=Chong+Lee+Market+3818+Rupert+St+Vancouver",
  },
  {
    name: "Earnest Ice Cream",
    display_location: "Olympic Village, Vancouver",
    address: "1829 Quebec St, Vancouver, BC",
    coordinates: { lat: 49.268, lng: -123.103 },
    google_maps_url:
      "https://www.google.com/maps/search/?api=1&query=Earnest+Ice+Cream+1829+Quebec+St+Vancouver",
  },
  {
    name: "Galbi Korean BBQ",
    display_location: "Metrotown, Burnaby",
    address: "4300 Kingsway, Burnaby, BC",
    coordinates: { lat: 49.228, lng: -123.002 },
    google_maps_url:
      "https://www.google.com/maps/search/?api=1&query=Galbi+Korean+BBQ+4300+Kingsway+Burnaby",
  },
  {
    name: "Juice Truck",
    display_location: "Cambie, Vancouver",
    address: "510 W 8th Ave, Vancouver, BC (Whole Foods)",
    coordinates: { lat: 49.264, lng: -123.115 },
    google_maps_url:
      "https://www.google.com/maps/search/?api=1&query=Juice+Truck+Whole+Foods+510+W+8th+Ave+Vancouver",
  },
  {
    name: "Lucky Supermarket",
    display_location: "Surrey",
    address: "10628 King George Blvd, Surrey, BC",
    coordinates: { lat: 49.187, lng: -122.848 },
    google_maps_url:
      "https://www.google.com/maps/search/?api=1&query=Lucky+Supermarket+10628+King+George+Blvd+Surrey",
  },
  {
    name: "Small Victory Bakery",
    display_location: "Brentwood, Burnaby",
    address: "4580 Brentwood Blvd #1214, Burnaby, BC",
    coordinates: { lat: 49.266, lng: -123.001 },
    google_maps_url:
      "https://www.google.com/maps/search/?api=1&query=Small+Victory+Bakery+4580+Brentwood+Blvd+Burnaby",
  },
  {
    name: "Walmart",
    display_location: "Metrotown, Burnaby",
    address: "4545 Central Blvd, Burnaby, BC",
    coordinates: { lat: 49.226, lng: -122.999 },
    google_maps_url:
      "https://www.google.com/maps/search/?api=1&query=Walmart+Metrotown+4545+Central+Blvd+Burnaby",
  },
  {
    name: "Sheng Siong",
    display_location: "Tanjong Katong, Singapore",
    address: "11 Tanjong Katong Rd, Singapore",
    coordinates: { lat: 1.314, lng: 103.894 },
    google_maps_url:
      "https://www.google.com/maps/search/?api=1&query=Sheng+Siong+Kinex+11+Tanjong+Katong+Rd+Singapore",
  },
  // Renames with location updates
  {
    name: "Broadview Storage",
    newName: "Broadview",
    display_location: "Central Park, Burnaby",
    address: "5980 Kathleen Ave, Burnaby, BC",
    coordinates: { lat: 49.229, lng: -123.013 },
    google_maps_url:
      "https://www.google.com/maps/search/?api=1&query=Broadview+Bosa+Properties+5980+Kathleen+Ave+Burnaby",
  },
  {
    name: "Eliza Sweet's Studio C",
    newName: "Eliza Sweets",
    display_location: "Kingsway, Vancouver",
    address: "3393 Kingsway, Vancouver, BC",
    coordinates: { lat: 49.238, lng: -123.028 },
    google_maps_url:
      "https://www.google.com/maps/search/?api=1&query=Eliza+Sweets+3393+Kingsway+Vancouver",
  },
  {
    name: "Hong Phat",
    newName: "Hủ Tiếu Hồng Phát",
    display_location: "Killarney, Vancouver",
    address: "5076 Victoria Dr, Vancouver, BC",
    coordinates: { lat: 49.227, lng: -123.025 },
    google_maps_url:
      "https://www.google.com/maps/search/?api=1&query=Hu+Tieu+Hong+Phat+5076+Victoria+Dr+Vancouver",
  },
];

// Merchants to mark as online (clear location data)
const onlineMerchants = [
  "BMO",
  "Browns Shoes",
  "Caltrain",
  "Scotiabank",
  "Target",
];

// New merchants to create (for split locations)
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
  console.log("Starting merchant location updates...\n");

  let updated = 0;
  let created = 0;
  let markedOnline = 0;
  let errors = 0;

  // 1. Update existing merchants with location data
  console.log("=".repeat(60));
  console.log("UPDATING EXISTING MERCHANTS");
  console.log("=".repeat(60));

  for (const update of merchantUpdates) {
    const updateData: Record<string, unknown> = {
      display_location: update.display_location,
      address: update.address,
      coordinates: update.coordinates,
      google_maps_url: update.google_maps_url,
    };

    // Handle renames
    if (update.newName) {
      updateData.name = update.newName;
    }

    const { error } = await supabase
      .from("merchants")
      .update(updateData)
      .eq("name", update.name);

    if (error) {
      console.error(`❌ Error updating ${update.name}: ${error.message}`);
      errors++;
    } else {
      const renameNote = update.newName ? ` -> ${update.newName}` : "";
      console.log(
        `✓ Updated: ${update.name}${renameNote} (${update.display_location})`
      );
      updated++;
    }
  }

  // 2. Mark merchants as online
  console.log("\n" + "=".repeat(60));
  console.log("MARKING MERCHANTS AS ONLINE");
  console.log("=".repeat(60));

  for (const name of onlineMerchants) {
    const { error } = await supabase
      .from("merchants")
      .update({
        is_online: true,
        display_location: null,
        address: null,
        coordinates: null,
        google_maps_url: null,
      })
      .eq("name", name);

    if (error) {
      console.error(`❌ Error marking ${name} as online: ${error.message}`);
      errors++;
    } else {
      console.log(`✓ Marked as online: ${name}`);
      markedOnline++;
    }
  }

  // 3. Create new merchants for split locations
  console.log("\n" + "=".repeat(60));
  console.log("CREATING NEW MERCHANTS (SPLIT LOCATIONS)");
  console.log("=".repeat(60));

  // First, get user_id from an existing merchant
  const { data: existingMerchant } = await supabase
    .from("merchants")
    .select("user_id")
    .limit(1)
    .single();

  const userId = existingMerchant?.user_id;

  if (!userId) {
    console.error("❌ Could not find user_id from existing merchants");
    return;
  }

  for (const merchant of newMerchants) {
    const { error } = await supabase.from("merchants").insert({
      name: merchant.name,
      display_location: merchant.display_location,
      address: merchant.address,
      coordinates: merchant.coordinates,
      google_maps_url: merchant.google_maps_url,
      is_online: merchant.is_online,
      user_id: userId,
    });

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

  // 4. Handle transaction reassignment for split merchants
  console.log("\n" + "=".repeat(60));
  console.log("TRANSACTION REASSIGNMENT NOTES");
  console.log("=".repeat(60));
  console.log("The following merchants were split into multiple locations:");
  console.log(
    "- Horin Ramen -> Horin Ramen (Robson) + Horin Ramen (Crystal Mall)"
  );
  console.log(
    "- Nemesis Coffee -> Nemesis Coffee (Gastown) + Nemesis Coffee (Great Northern Way)"
  );
  console.log(
    "\nYou may need to manually reassign transactions to the correct location."
  );
  console.log(
    "The original 'Horin Ramen' and 'Nemesis Coffee' merchants still exist."
  );

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("SUMMARY");
  console.log("=".repeat(60));
  console.log(`Updated: ${updated} merchants`);
  console.log(`Created: ${created} new merchants`);
  console.log(`Marked online: ${markedOnline} merchants`);
  console.log(`Errors: ${errors}`);
}

main();
