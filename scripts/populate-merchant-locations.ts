/**
 * Populate merchant location fields (display_location, google_maps_url, coordinates)
 * Uses OpenStreetMap Nominatim API for free geocoding (rate limited to 1 req/sec)
 */
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

// Rate limiter - Nominatim requires max 1 request per second
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
}

/**
 * Geocode an address using OpenStreetMap Nominatim API
 */
async function geocodeAddress(
  query: string
): Promise<{ lat: number; lng: number } | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`;
    const response = await fetch(url, {
      headers: {
        "User-Agent": "ExpenseMate/1.0 (expense tracking app)",
      },
    });

    if (!response.ok) {
      console.error(`Nominatim error: ${response.status}`);
      return null;
    }

    const data: NominatimResult[] = await response.json();
    if (data.length === 0) {
      return null;
    }

    return {
      lat: parseFloat(data[0].lat),
      lng: parseFloat(data[0].lon),
    };
  } catch (error) {
    console.error("Geocoding error:", error);
    return null;
  }
}

/**
 * Generate a Google Maps search URL
 */
function generateGoogleMapsUrl(merchantName: string, address: string): string {
  const query = `${merchantName}, ${address}`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

/**
 * Simplify a detailed address to a short display location
 * e.g., "58 Rue des Écoles, 75005 Paris, France" -> "Latin Quarter, Paris"
 * e.g., "La Vallée Village, 3 Cours de la Garonne, 77700 Serris, France" -> "La Vallée Village"
 */
function simplifyAddress(address: string, merchantName: string): string {
  // If address is already simple (no commas, short), keep it
  if (!address.includes(",") && address.length < 30) {
    return address;
  }

  // Check for known location patterns
  const knownSimplifications: Record<string, string> = {
    "La Vallée Village": "La Vallée Village",
    "Val d'Europe": "Val d'Europe",
    "Paris Charles de Gaulle": "CDG Airport, Paris",
    "Centre Commercial": address.split(",")[0], // Keep the mall name
    "Gare RER": address.split(",")[0], // Keep the station name
  };

  for (const [pattern, simplified] of Object.entries(knownSimplifications)) {
    if (address.includes(pattern)) {
      return simplified;
    }
  }

  // Parse address parts
  const parts = address.split(",").map((p) => p.trim());

  // If it's a full address with street, postal code, city, country
  if (parts.length >= 3) {
    // Extract city (usually second-to-last or contains postal code)
    const cityPart = parts.find((p) => /\d{5}/.test(p)) || parts[parts.length - 2];
    const country = parts[parts.length - 1];

    // Extract just the city name (remove postal code)
    const cityMatch = cityPart?.match(/\d{5}\s*(.+)/) || cityPart?.match(/(.+)\s*\d{5}/);
    const city = cityMatch ? cityMatch[1].trim() : cityPart?.replace(/\d{5}/g, "").trim();

    if (city) {
      // For international locations, include country
      if (country && !["Canada", "USA", "United States"].includes(country)) {
        return `${city}, ${country}`;
      }
      return city;
    }
  }

  // Fallback: return first meaningful part
  return parts[0] || address;
}

async function main() {
  console.log("Fetching merchants with addresses...\n");

  const { data: merchants, error } = await supabase
    .from("merchants")
    .select("id, name, address, display_location, google_maps_url, coordinates")
    .not("address", "is", null)
    .neq("address", "")
    .order("name");

  if (error) {
    console.error("Error fetching merchants:", error);
    return;
  }

  console.log(`Found ${merchants.length} merchants with addresses\n`);

  let updated = 0;
  let geocoded = 0;

  for (const merchant of merchants) {
    const updates: Record<string, unknown> = {};
    let needsUpdate = false;

    // 1. Simplify display_location if it's the same as the full address
    if (
      merchant.display_location === merchant.address &&
      merchant.address.includes(",")
    ) {
      const simplified = simplifyAddress(merchant.address, merchant.name);
      if (simplified !== merchant.display_location) {
        updates.display_location = simplified;
        needsUpdate = true;
        console.log(`📍 ${merchant.name}: "${merchant.address}" -> "${simplified}"`);
      }
    }

    // 2. Generate Google Maps URL if missing
    if (!merchant.google_maps_url) {
      updates.google_maps_url = generateGoogleMapsUrl(
        merchant.name,
        merchant.address
      );
      needsUpdate = true;
    }

    // 3. Geocode if coordinates missing
    if (!merchant.coordinates) {
      // Rate limit: wait 1 second between requests
      await sleep(1100);

      const searchQuery = `${merchant.name}, ${merchant.address}`;
      const coords = await geocodeAddress(searchQuery);

      if (coords) {
        updates.coordinates = coords;
        geocoded++;
        console.log(`🌍 ${merchant.name}: ${coords.lat}, ${coords.lng}`);
      } else {
        // Try with just the address
        await sleep(1100);
        const coordsFromAddress = await geocodeAddress(merchant.address);
        if (coordsFromAddress) {
          updates.coordinates = coordsFromAddress;
          geocoded++;
          console.log(`🌍 ${merchant.name}: ${coordsFromAddress.lat}, ${coordsFromAddress.lng} (from address only)`);
        } else {
          console.log(`❌ ${merchant.name}: Could not geocode`);
        }
      }
    }

    // Apply updates
    if (needsUpdate || Object.keys(updates).length > 0) {
      const { error: updateError } = await supabase
        .from("merchants")
        .update(updates)
        .eq("id", merchant.id);

      if (updateError) {
        console.error(`Error updating ${merchant.name}:`, updateError);
      } else {
        updated++;
      }
    }
  }

  console.log("\n" + "=".repeat(50));
  console.log(`Updated: ${updated} merchants`);
  console.log(`Geocoded: ${geocoded} locations`);
}

main();
