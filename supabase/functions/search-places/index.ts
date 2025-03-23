
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const GOOGLE_MAPS_API_KEY = Deno.env.get('GOOGLE_MAPS_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Check if API key is available
    if (!GOOGLE_MAPS_API_KEY) {
      console.error('No Google Maps API key available');
      return new Response(
        JSON.stringify({ 
          error: 'Configuration error: Google Maps API key not available',
          places: [] 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const { query } = await req.json();
    
    if (!query || query.trim() === '') {
      return new Response(
        JSON.stringify({ error: 'Search query is required', places: [] }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Call Google Places API to find places based on the query
    const url = new URL('https://maps.googleapis.com/maps/api/place/textsearch/json');
    url.searchParams.append('query', query);
    url.searchParams.append('key', GOOGLE_MAPS_API_KEY);
    
    const response = await fetch(url.toString());
    const data = await response.json();
    
    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      console.error('Google Places API error:', data.status, data.error_message);
      // Return an empty array with the error message
      return new Response(
        JSON.stringify({ 
          error: `Google Places API error: ${data.status}`,
          places: [] 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    // Extract relevant information from the results
    const places = data.results?.map((place: any) => ({
      name: place.name,
      address: place.formatted_address,
      location: place.geometry?.location,
      placeId: place.place_id,
    })) || [];
    
    return new Response(
      JSON.stringify({ places }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in search-places function:', error);
    return new Response(
      JSON.stringify({ error: error.message, places: [] }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
