/**
 * Fix merchant location data issues
 * - Correct coordinates that were geocoded to wrong locations
 * - Update display_location to more specific neighborhoods
 * - Fix online status for merchants
 * - Rename merchants as needed
 * - Merge duplicate merchants
 */
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

interface MerchantUpdate {
  name?: string;
  address?: string | null;
  display_location?: string | null;
  google_maps_url?: string | null;
  coordinates?: { lat: number; lng: number } | null;
  is_online?: boolean;
}

const updates: Record<string, MerchantUpdate> = {
  // === RENAMES ===
  Semilla: {
    name: "Freddy's",
    address: "54 Rue de Seine, 75006 Paris, France",
    display_location: "Saint-Germain-des-Prés, Paris",
    google_maps_url:
      "https://www.google.com/maps/search/?api=1&query=Freddy%27s%2C+54+Rue+de+Seine%2C+Paris",
    coordinates: { lat: 48.8538, lng: 2.3377 },
  },
  "TST-Eggbomb": {
    name: "EGGBOMB+",
    address: "3778 Grande Promenade #560, Burnaby, BC V3J 1N4",
    display_location: "Lougheed Mall, Burnaby",
    google_maps_url:
      "https://www.google.com/maps/search/?api=1&query=EGGBOMB%2B%2C+3778+Grande+Promenade%2C+Burnaby",
    coordinates: { lat: 49.2488, lng: -122.897 },
  },

  // === ONLINE MERCHANTS (clear location) ===
  "AZGA Service Canada": {
    address: null,
    display_location: null,
    google_maps_url: null,
    coordinates: null,
    is_online: true,
  },
  Presto: {
    address: null,
    display_location: null,
    google_maps_url: null,
    coordinates: null,
    is_online: true,
  },
  Ticketmaster: {
    address: null,
    display_location: null,
    google_maps_url: null,
    coordinates: null,
    is_online: true,
  },
  Oddbunch: {
    address: null,
    display_location: null,
    google_maps_url: null,
    coordinates: null,
    is_online: true,
  },

  // === FIX WRONG COORDINATES ===
  "2025 Cafe": {
    address: "4919 Kingsway, Burnaby, BC V5H 2E5",
    display_location: "Kingsway, Burnaby",
    google_maps_url:
      "https://www.google.com/maps/search/?api=1&query=2025+Cafe%2C+4919+Kingsway%2C+Burnaby",
    coordinates: { lat: 49.2269, lng: -123.0038 },
  },
  "Green Leaf Sushi": {
    address: "5181 Joyce St, Vancouver, BC V5R 4H1",
    display_location: "Collingwood, Vancouver",
    google_maps_url:
      "https://www.google.com/maps/search/?api=1&query=Green+Leaf+Sushi%2C+5181+Joyce+St%2C+Vancouver",
    coordinates: { lat: 49.234, lng: -123.0285 },
  },
  Safeway: {
    address: "3410 Kingsway, Vancouver, BC V5R 5L4",
    display_location: "Collingwood, Vancouver",
    google_maps_url:
      "https://www.google.com/maps/search/?api=1&query=Safeway%2C+3410+Kingsway%2C+Vancouver",
    coordinates: { lat: 49.2387, lng: -123.0327 },
  },
  "Save-On-Foods": {
    address: "4469 Kingsway, Burnaby, BC V5H 1Z9",
    display_location: "Kingsway, Burnaby",
    google_maps_url:
      "https://www.google.com/maps/search/?api=1&query=Save-On-Foods%2C+4469+Kingsway%2C+Burnaby",
    coordinates: { lat: 49.2276, lng: -123.0045 },
  },
  Superbaba: {
    address: "2419 Main St, Vancouver, BC V5T 3E1",
    display_location: "Mount Pleasant, Vancouver",
    google_maps_url:
      "https://www.google.com/maps/search/?api=1&query=Superbaba%2C+2419+Main+St%2C+Vancouver",
    coordinates: { lat: 49.267, lng: -123.101 },
  },
  "Bubble Tasty Tea": {
    address: "33677 King Rd #120, Abbotsford, BC V2S 0L3",
    display_location: "Abbotsford",
    google_maps_url:
      "https://www.google.com/maps/search/?api=1&query=Bubble+Tasty+Tea%2C+33677+King+Rd%2C+Abbotsford",
    coordinates: { lat: 49.0503, lng: -122.3125 },
  },

  // === FIX ONLINE STATUS (should be physical) ===
  "Trader Joe's": {
    address: "2410 James St, Bellingham, WA 98225",
    display_location: "Bellingham, WA",
    google_maps_url:
      "https://www.google.com/maps/search/?api=1&query=Trader+Joe%27s%2C+2410+James+St%2C+Bellingham%2C+WA",
    coordinates: { lat: 48.7565, lng: -122.4685 },
    is_online: false,
  },
  "Winners/HomeSense": {
    address: "4720 Kingsway, Burnaby, BC V5H 4M1",
    display_location: "Metrotown, Burnaby",
    google_maps_url:
      "https://www.google.com/maps/search/?api=1&query=Winners+HomeSense%2C+4720+Kingsway%2C+Burnaby",
    coordinates: { lat: 49.227, lng: -123.003 },
    is_online: false,
  },
  Papparoti: {
    address: "179 Keefer Place, Vancouver, BC V6B 6C1",
    display_location: "Chinatown, Vancouver",
    google_maps_url:
      "https://www.google.com/maps/search/?api=1&query=Papparoti%2C+179+Keefer+Place%2C+Vancouver",
    coordinates: { lat: 49.2795, lng: -123.105 },
    is_online: false,
  },

  // === ADD MISSING COORDINATES ===
  "Extime Duty Free Paris": {
    display_location: "CDG Airport, Paris",
    google_maps_url:
      "https://www.google.com/maps/search/?api=1&query=Extime+Duty+Free%2C+Paris+Charles+de+Gaulle+Airport",
    coordinates: { lat: 49.0097, lng: 2.5479 },
  },
  Fnac: {
    display_location: "Val d'Europe, Serris",
    google_maps_url:
      "https://www.google.com/maps/search/?api=1&query=Fnac%2C+Val+d%27Europe%2C+Serris",
    coordinates: { lat: 48.8534, lng: 2.7846 },
  },
  "Monop'": {
    display_location: "Opéra, Paris",
    google_maps_url:
      "https://www.google.com/maps/search/?api=1&query=Monop%27%2C+Gare+RER+Auber%2C+Paris",
    coordinates: { lat: 48.873, lng: 2.329 },
  },
  "Ralph Lauren": {
    display_location: "La Vallée Village, Serris",
    google_maps_url:
      "https://www.google.com/maps/search/?api=1&query=Polo+Ralph+Lauren+Outlet%2C+La+Vall%C3%A9e+Village%2C+Serris",
    coordinates: { lat: 48.8534, lng: 2.7846 },
  },
  Sandro: {
    display_location: "La Vallée Village, Serris",
    google_maps_url:
      "https://www.google.com/maps/search/?api=1&query=Sandro+Outlet%2C+La+Vall%C3%A9e+Village%2C+Serris",
    coordinates: { lat: 48.8534, lng: 2.7846 },
  },

  // === UPDATE DISPLAY LOCATIONS TO NEIGHBORHOODS ===
  "Anh And Chi": {
    address: "3388 Main Street, Vancouver, BC V5V 3M7",
    display_location: "Main Street, Vancouver",
    google_maps_url:
      "https://www.google.com/maps/search/?api=1&query=Anh+And+Chi%2C+3388+Main+Street%2C+Vancouver",
    coordinates: { lat: 49.2576, lng: -123.1012 },
  },
  "Bar Nouveau": {
    display_location: "Le Marais, Paris",
    google_maps_url:
      "https://www.google.com/maps/search/?api=1&query=Bar+Nouveau%2C+5+Rue+des+Haudriettes%2C+Paris",
    coordinates: { lat: 48.863, lng: 2.3575 },
  },
  "Bar Vendetta": {
    address: "928 Dundas St W, Toronto, ON M6J 1W3",
    display_location: "Little Italy, Toronto",
    google_maps_url:
      "https://www.google.com/maps/search/?api=1&query=Bar+Vendetta%2C+928+Dundas+St+W%2C+Toronto",
    coordinates: { lat: 43.651, lng: -79.4133 },
  },
  "BC Liquor Store": {
    address: "4700 Kingsway, Burnaby, BC V5H 4M1",
    display_location: "Metrotown, Burnaby",
    google_maps_url:
      "https://www.google.com/maps/search/?api=1&query=BC+Liquor+Store%2C+4700+Kingsway%2C+Burnaby",
    coordinates: { lat: 49.2262, lng: -123.0026 },
  },
  "Big Way Hot Pot": {
    address: "4300 Kingsway #7, Burnaby, BC V5H 1Z8",
    display_location: "Kingsway, Burnaby",
    google_maps_url:
      "https://www.google.com/maps/search/?api=1&query=Big+Way+Hot+Pot%2C+4300+Kingsway%2C+Burnaby",
    coordinates: { lat: 49.229, lng: -123.006 },
  },
  "City Avenue Market": {
    address: "810 Quayside Dr #130, New Westminster, BC V3M 6B9",
    display_location: "River Market, New Westminster",
    google_maps_url:
      "https://www.google.com/maps/search/?api=1&query=City+Avenue+Market%2C+810+Quayside+Dr%2C+New+Westminster",
    coordinates: { lat: 49.2003, lng: -122.9115 },
  },
  Costco: {
    address: "4500 Still Creek Dr, Burnaby, BC V5C 0E5",
    display_location: "Still Creek, Burnaby",
    google_maps_url:
      "https://www.google.com/maps/search/?api=1&query=Costco%2C+4500+Still+Creek+Dr%2C+Burnaby",
    coordinates: { lat: 49.2604, lng: -122.9992 },
  },
  Diptyque: {
    address: "701 W Georgia St G044, Vancouver, BC V7Y 1G5",
    display_location: "CF Pacific Centre, Vancouver",
    google_maps_url:
      "https://www.google.com/maps/search/?api=1&query=Diptyque%2C+CF+Pacific+Centre%2C+Vancouver",
    coordinates: { lat: 49.2834, lng: -123.1175 },
  },
  "Driver Service Centre": {
    address: "4820 Kingsway #232, Burnaby, BC V5H 2C2",
    display_location: "Metrotown, Burnaby",
    google_maps_url:
      "https://www.google.com/maps/search/?api=1&query=ICBC+Driver+Licensing%2C+Metrotown%2C+Burnaby",
    coordinates: { lat: 49.2262, lng: -123.0026 },
  },
  "El Rey Mezcal Bar": {
    address: "2A Kensington Ave, Toronto, ON M5T 2J7",
    display_location: "Kensington Market, Toronto",
    google_maps_url:
      "https://www.google.com/maps/search/?api=1&query=El+Rey+Mezcal+Bar%2C+2A+Kensington+Ave%2C+Toronto",
    coordinates: { lat: 43.6547, lng: -79.4008 },
  },
  "Fox Cabaret": {
    address: "2321 Main St, Vancouver, BC V5T 3C9",
    display_location: "Mount Pleasant, Vancouver",
    google_maps_url:
      "https://www.google.com/maps/search/?api=1&query=Fox+Cabaret%2C+2321+Main+St%2C+Vancouver",
    coordinates: { lat: 49.2665, lng: -123.1012 },
  },
  "Goldchild Coffee Roasters": {
    address: "915 J St, San Diego, CA 92101",
    display_location: "Downtown San Diego",
    google_maps_url:
      "https://www.google.com/maps/search/?api=1&query=Goldchild+Coffee+Roasters%2C+915+J+St%2C+San+Diego",
    coordinates: { lat: 32.7148, lng: -117.1607 },
  },
  IKEA: {
    address: "1000 Lougheed Hwy, Coquitlam, BC V3K 3T3",
    display_location: "Coquitlam",
    google_maps_url:
      "https://www.google.com/maps/search/?api=1&query=IKEA%2C+1000+Lougheed+Hwy%2C+Coquitlam",
    coordinates: { lat: 49.274, lng: -122.798 },
  },
  "Jack Astor's": {
    address: "144 Front St W, Toronto, ON M5J 2L7",
    display_location: "Downtown Toronto",
    google_maps_url:
      "https://www.google.com/maps/search/?api=1&query=Jack+Astor%27s%2C+144+Front+St+W%2C+Toronto",
    coordinates: { lat: 43.645, lng: -79.386 },
  },
  Joey: {
    address: "1 King St W, Toronto, ON M5H 1A1",
    display_location: "King Street, Toronto",
    google_maps_url:
      "https://www.google.com/maps/search/?api=1&query=Joey%2C+1+King+St+W%2C+Toronto",
    coordinates: { lat: 43.6488, lng: -79.3793 },
  },
  "La Cevicheria Bar & Grill": {
    address: "176 Baldwin St, Toronto, ON M5T 1L8",
    display_location: "Kensington Market, Toronto",
    google_maps_url:
      "https://www.google.com/maps/search/?api=1&query=La+Cevicheria+Bar+%26+Grill%2C+176+Baldwin+St%2C+Toronto",
    coordinates: { lat: 43.655, lng: -79.402 },
  },
  Laowai: {
    address: "222 Keefer St, Vancouver, BC V6A 1X6",
    display_location: "Chinatown, Vancouver",
    google_maps_url:
      "https://www.google.com/maps/search/?api=1&query=Laowai%2C+222+Keefer+St%2C+Vancouver",
    coordinates: { lat: 49.279, lng: -123.099 },
  },
  "Librairie Compagnie": {
    display_location: "Latin Quarter, Paris",
    google_maps_url:
      "https://www.google.com/maps/search/?api=1&query=Librairie+Compagnie%2C+58+Rue+des+%C3%89coles%2C+Paris",
    coordinates: { lat: 48.8488, lng: 2.3477 },
  },
  Lululemon: {
    address: "660 Stanford Shopping Center, Palo Alto, CA 94304",
    display_location: "Stanford Shopping Center, Palo Alto",
    google_maps_url:
      "https://www.google.com/maps/search/?api=1&query=Lululemon%2C+Stanford+Shopping+Center%2C+Palo+Alto",
    coordinates: { lat: 37.4432, lng: -122.1713 },
  },
  Metro: {
    address: "555 Yonge St, Toronto, ON M4Y 1Y5",
    display_location: "Downtown Toronto",
    google_maps_url:
      "https://www.google.com/maps/search/?api=1&query=Metro%2C+555+Yonge+St%2C+Toronto",
    coordinates: { lat: 43.664, lng: -79.384 },
  },
  "Momentum Specialty Coffees": {
    address: "39 Rue Mazarine, 75006 Paris, France",
    display_location: "Saint-Germain-des-Prés, Paris",
    google_maps_url:
      "https://www.google.com/maps/search/?api=1&query=Momentum+Specialty+Coffees%2C+39+Rue+Mazarine%2C+Paris",
    coordinates: { lat: 48.8545, lng: 2.338 },
  },
  Paul: {
    address: "77 Rue de Seine, 75006 Paris, France",
    display_location: "Saint-Germain-des-Prés, Paris",
    google_maps_url:
      "https://www.google.com/maps/search/?api=1&query=Paul%2C+77+Rue+de+Seine%2C+Paris",
    coordinates: { lat: 48.8535, lng: 2.337 },
  },
  "Paupers Pub": {
    address: "539 Bloor St W, Toronto, ON M5S 1Y5",
    display_location: "The Annex, Toronto",
    google_maps_url:
      "https://www.google.com/maps/search/?api=1&query=Paupers+Pub%2C+539+Bloor+St+W%2C+Toronto",
    coordinates: { lat: 43.6652, lng: -79.4101 },
  },
  "Pharmacie Avenue de l'Opera": {
    display_location: "Opéra, Paris",
    google_maps_url:
      "https://www.google.com/maps/search/?api=1&query=Pharmacie+Avenue+de+l%27Op%C3%A9ra%2C+20+Avenue+de+l%27Op%C3%A9ra%2C+75001+Paris",
    coordinates: { lat: 48.867, lng: 2.3336 },
  },
  "Pho Anh Vu": {
    address: "577 Yonge St, Toronto, ON M4Y 1Z2",
    display_location: "Downtown Toronto",
    google_maps_url:
      "https://www.google.com/maps/search/?api=1&query=Pho+Anh+Vu%2C+577+Yonge+Street%2C+Toronto",
    coordinates: { lat: 43.665, lng: -79.3835 },
  },
  "PriceSmart Foods": {
    address: "4650 Kingsway #110, Burnaby, BC V5H 4L9",
    display_location: "Station Square, Burnaby",
    google_maps_url:
      "https://www.google.com/maps/search/?api=1&query=PriceSmart+Foods%2C+4650+Kingsway%2C+Burnaby",
    coordinates: { lat: 49.2271, lng: -123.0039 },
  },
  "Real Canadian Superstore": {
    address: "4700 Kingsway #1105, Burnaby, BC V5H 4N2",
    display_location: "Metrotown, Burnaby",
    google_maps_url:
      "https://www.google.com/maps/search/?api=1&query=Real+Canadian+Superstore%2C+4700+Kingsway%2C+Burnaby",
    coordinates: { lat: 49.2262, lng: -123.0026 },
  },
  "Shin Izakaya": {
    address: "6 Rue des Ciseaux, 75006 Paris, France",
    display_location: "Saint-Germain-des-Prés, Paris",
    google_maps_url:
      "https://www.google.com/maps/search/?api=1&query=Shin+Izakaya%2C+6+Rue+des+Ciseaux%2C+Paris",
    coordinates: { lat: 48.853, lng: 2.335 },
  },
  "Shoppers Drug Mart": {
    address: "4429 Kingsway #30, Burnaby, BC V5H 2A1",
    display_location: "Kingsway, Burnaby",
    google_maps_url:
      "https://www.google.com/maps/search/?api=1&query=Shoppers+Drug+Mart%2C+4429+Kingsway%2C+Burnaby",
    coordinates: { lat: 49.228, lng: -123.005 },
  },
  "Si Lom Thai Bistro": {
    address: "534 Church St, Toronto, ON M4Y 2E1",
    display_location: "The Village, Toronto",
    google_maps_url:
      "https://www.google.com/maps/search/?api=1&query=Si+Lom+Thai+Bistro%2C+534+Church+Street%2C+Toronto",
    coordinates: { lat: 43.666, lng: -79.381 },
  },
  "Suyo Modern Peruvian": {
    address: "3475 Main St, Vancouver, BC V5V 3M9",
    display_location: "Mount Pleasant, Vancouver",
    google_maps_url:
      "https://www.google.com/maps/search/?api=1&query=Suyo+Modern+Peruvian%2C+3475+Main+Street%2C+Vancouver",
    coordinates: { lat: 49.256, lng: -123.101 },
  },
  "T&T Supermarket": {
    address: "4800 Kingsway #147, Burnaby, BC V5H 4J2",
    display_location: "Metrotown, Burnaby",
    google_maps_url:
      "https://www.google.com/maps/search/?api=1&query=T%26T+Supermarket%2C+4800+Kingsway%2C+Burnaby",
    coordinates: { lat: 49.227, lng: -123.003 },
  },
  "New Shanghai Barbershop": {
    address: "439 Columbia St, Vancouver, BC V6A 1S9",
    display_location: "Chinatown, Vancouver",
    google_maps_url:
      "https://www.google.com/maps/search/?api=1&query=New+Shanghai+Barbershop%2C+439+Columbia+St%2C+Vancouver",
    coordinates: { lat: 49.282, lng: -123.097 },
    is_online: false,
  },
};

async function main() {
  console.log("Starting merchant location fixes...\n");

  let updated = 0;
  let errors = 0;

  for (const [merchantName, updateData] of Object.entries(updates)) {
    console.log(`Updating: ${merchantName}`);

    const { error } = await supabase
      .from("merchants")
      .update(updateData)
      .eq("name", merchantName);

    if (error) {
      console.error(`  ❌ Error: ${error.message}`);
      errors++;
    } else {
      console.log(`  ✓ Updated`);
      if (updateData.name) {
        console.log(`    Renamed to: ${updateData.name}`);
      }
      updated++;
    }
  }

  // Delete PriceSmart (merge into PriceSmart Foods)
  console.log("\nMerging PriceSmart into PriceSmart Foods...");

  // First, get both merchant IDs
  const { data: priceSmartData } = await supabase
    .from("merchants")
    .select("id")
    .eq("name", "PriceSmart")
    .single();

  const { data: priceSmartFoodsData } = await supabase
    .from("merchants")
    .select("id")
    .eq("name", "PriceSmart Foods")
    .single();

  if (priceSmartData && priceSmartFoodsData) {
    // Reassign transactions from PriceSmart to PriceSmart Foods
    const { data: reassigned, error: reassignError } = await supabase
      .from("transactions")
      .update({ merchant_id: priceSmartFoodsData.id })
      .eq("merchant_id", priceSmartData.id)
      .select("id");

    if (reassignError) {
      console.error(
        `  ❌ Error reassigning transactions: ${reassignError.message}`
      );
    } else {
      console.log(`  ✓ Reassigned ${reassigned?.length || 0} transactions`);
    }

    // Delete PriceSmart
    const { error: deleteError } = await supabase
      .from("merchants")
      .delete()
      .eq("id", priceSmartData.id);

    if (deleteError) {
      console.error(`  ❌ Error deleting PriceSmart: ${deleteError.message}`);
    } else {
      console.log(`  ✓ Deleted duplicate PriceSmart merchant`);
    }
  } else {
    console.log("  ⚠ Could not find PriceSmart or PriceSmart Foods");
  }

  console.log("\n" + "=".repeat(50));
  console.log(`Updated: ${updated} merchants`);
  console.log(`Errors: ${errors}`);
}

main();
