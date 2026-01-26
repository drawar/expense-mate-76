-- Add Ancora Waterfront Dining and Patio (False Creek location)
-- Peruvian-Japanese fusion restaurant on Vancouver's False Creek seawall

INSERT INTO merchants (
  name,
  address,
  display_location,
  mcc_code,
  is_online,
  coordinates,
  google_maps_url
) VALUES (
  'Ancora Waterfront Dining',
  '1600 Howe Street, Vancouver, BC V6Z 2L9, Canada',
  'False Creek, Vancouver',
  '5812',
  FALSE,
  '{"lat": 49.2735, "lng": -123.1222}',
  'https://maps.google.com/?q=Ancora+Waterfront+Dining+1600+Howe+Street+Vancouver'
)
ON CONFLICT DO NOTHING;
