/**
 * Merchant name to MCC mappings for airlines and hotels.
 * These mappings enable auto-population of MCC when a known airline/hotel
 * merchant name is entered, without requiring historical transaction data.
 */

import { MerchantCategoryCode } from "@/types";

/**
 * Airline merchant name patterns -> MCC mappings
 * Keys are lowercase for case-insensitive matching
 */
export const AIRLINE_MERCHANT_MCC_MAP: Record<
  string,
  { code: string; description: string }
> = {
  // Major US carriers
  "united airlines": { code: "3000", description: "United Airlines" },
  united: { code: "3000", description: "United Airlines" },
  "american airlines": { code: "3001", description: "American Airlines" },
  "british airways": { code: "3005", description: "British Airways" },
  "japan airlines": { code: "3006", description: "Japan Airlines" },
  jal: { code: "3006", description: "Japan Airlines" },
  "air france": { code: "3007", description: "Air France" },
  lufthansa: { code: "3008", description: "Lufthansa" },
  "air canada": { code: "3009", description: "Air Canada" },
  klm: { code: "3010", description: "KLM Royal Dutch Airlines" },
  "royal dutch airlines": {
    code: "3010",
    description: "KLM Royal Dutch Airlines",
  },
  aeroflot: { code: "3011", description: "Aeroflot" },
  qantas: { code: "3012", description: "Qantas" },
  alitalia: { code: "3013", description: "Alitalia" },
  "saudi arabian airlines": {
    code: "3014",
    description: "Saudi Arabian Airlines",
  },
  saudia: { code: "3043", description: "Saudia" },
  swiss: { code: "3015", description: "Swiss International Air Lines" },
  "swiss international": {
    code: "3015",
    description: "Swiss International Air Lines",
  },
  sas: { code: "3016", description: "SAS Scandinavian Airlines" },
  "scandinavian airlines": {
    code: "3016",
    description: "SAS Scandinavian Airlines",
  },
  "south african airways": {
    code: "3017",
    description: "South African Airways",
  },
  "air india": { code: "3020", description: "Air India" },
  "philippine airlines": { code: "3022", description: "Philippine Airlines" },
  pal: { code: "3022", description: "Philippine Airlines" },
  "air new zealand": { code: "3025", description: "Air New Zealand" },
  emirates: { code: "3026", description: "Emirates" },
  "aer lingus": { code: "3030", description: "Aer Lingus" },
  "malaysia airlines": { code: "3032", description: "Malaysia Airlines" },
  mas: { code: "3032", description: "Malaysia Airlines" },
  etihad: { code: "3034", description: "Etihad Airways" },
  "etihad airways": { code: "3034", description: "Etihad Airways" },
  "el al": { code: "3035", description: "El Al" },
  avianca: { code: "3036", description: "AVIANCA" },
  finnair: { code: "3039", description: "Finnair" },
  "gulf air": { code: "3040", description: "Gulf Air Bahrain" },
  garuda: { code: "3041", description: "Garuda Indonesia" },
  "garuda indonesia": { code: "3041", description: "Garuda Indonesia" },
  "tap portugal": { code: "3048", description: "TAP Air Portugal" },
  tap: { code: "3048", description: "TAP Air Portugal" },
  "austrian airlines": { code: "3053", description: "Austrian Airlines" },
  delta: { code: "3058", description: "Delta Air Lines" },
  "delta air lines": { code: "3058", description: "Delta Air Lines" },
  "delta airlines": { code: "3058", description: "Delta Air Lines" },
  "middle east airlines": { code: "3063", description: "Middle East Airlines" },
  mea: { code: "3063", description: "Middle East Airlines" },
  "tiger airways": { code: "3065", description: "Tiger Airways" },
  tigerair: { code: "3065", description: "Tiger Airways" },
  southwest: { code: "3067", description: "Southwest Airlines" },
  "southwest airlines": { code: "3067", description: "Southwest Airlines" },
  "srilankan airlines": { code: "3073", description: "Srilankan Airlines" },
  icelandair: { code: "3074", description: "Icelandair" },
  "kenya airways": { code: "3081", description: "Kenya Airways" },
  "korean air": { code: "3082", description: "Korean Air" },
  ana: { code: "3083", description: "ANA All Nippon Airways" },
  "all nippon airways": { code: "3083", description: "ANA All Nippon Airways" },
  "all nippon": { code: "3083", description: "ANA All Nippon Airways" },
  copa: { code: "3085", description: "COPA Panama" },
  "copa airlines": { code: "3085", description: "COPA Panama" },
  "aerolineas argentinas": {
    code: "3086",
    description: "Aerolineas Argentinas",
  },
  "jet airways": { code: "3087", description: "Jet Airways" },
  "china eastern": { code: "3090", description: "China Eastern Airlines" },
  egyptair: { code: "3091", description: "Egyptair" },
  "china southern": { code: "3092", description: "China Southern Airlines" },
  "air china": { code: "3093", description: "Air China" },
  "cathay pacific": { code: "3099", description: "Cathay Pacific" },
  cathay: { code: "3099", description: "Cathay Pacific" },
  cx: { code: "3099", description: "Cathay Pacific" },
  "lot polish": { code: "3102", description: "LOT Polish Airlines" },
  "eva airways": { code: "3112", description: "EVA Airways" },
  "eva air": { code: "3174", description: "EVA Air" },
  eva: { code: "3174", description: "EVA Air" },
  tam: { code: "3125", description: "TAM Linhas Aéreas" },
  "sun country": { code: "3129", description: "SunCountry Airlines" },
  frontier: { code: "3130", description: "Frontier Airlines" },
  "frontier airlines": { code: "3130", description: "Frontier Airlines" },
  spirit: { code: "3131", description: "Spirit Airlines" },
  "spirit airlines": { code: "3131", description: "Spirit Airlines" },
  "virgin america": { code: "3132", description: "Virgin America" },
  "alaska airlines": { code: "3133", description: "Alaska Airlines" },
  alaska: { code: "3133", description: "Alaska Airlines" },
  "thai airways": { code: "3135", description: "Thai Airways" },
  thai: { code: "3135", description: "Thai Airways" },
  "turkish airlines": { code: "3136", description: "Turkish Airlines" },
  turkish: { code: "3136", description: "Turkish Airlines" },
  transavia: { code: "3137", description: "Transavia Holland" },
  westjet: { code: "3138", description: "WestJet" },
  "singapore airlines": { code: "3144", description: "Singapore Airlines" },
  sq: { code: "3144", description: "Singapore Airlines" },
  sia: { code: "3144", description: "Singapore Airlines" },
  scoot: { code: "3145", description: "Scoot" },
  volaris: { code: "3146", description: "Volaris" },
  jetblue: { code: "3148", description: "JetBlue Airways" },
  "jetblue airways": { code: "3148", description: "JetBlue Airways" },
  "air transat": { code: "3151", description: "Air Transat" },
  indigo: { code: "3156", description: "IndiGo Airlines" },
  "indigo airlines": { code: "3156", description: "IndiGo Airlines" },
  spicejet: { code: "3159", description: "SpiceJet" },
  vietjet: { code: "3161", description: "VietJet Air" },
  "vietjet air": { code: "3161", description: "VietJet Air" },
  "bamboo airways": { code: "3163", description: "Bamboo Airways" },
  "vietnam airlines": { code: "3171", description: "Vietnam Airlines" },
  "cebu pacific": { code: "3175", description: "Cebu Pacific" },
  airasia: { code: "3176", description: "AirAsia" },
  "air asia": { code: "3176", description: "AirAsia" },
  "airasia x": { code: "3177", description: "AirAsia X" },
  jetstar: { code: "3180", description: "Jetstar" },
  "lion air": { code: "3181", description: "Lion Air" },
  "batik air": { code: "3182", description: "Batik Air" },
  starlux: { code: "3184", description: "Starlux Airlines" },
  "starlux airlines": { code: "3184", description: "Starlux Airlines" },
  peach: { code: "3196", description: "Peach Aviation" },
  "peach aviation": { code: "3196", description: "Peach Aviation" },
  norwegian: { code: "3211", description: "Norwegian Air Shuttle" },
  "norwegian air": { code: "3211", description: "Norwegian Air Shuttle" },
  hawaiian: { code: "3212", description: "Hawaiian Airlines" },
  "hawaiian airlines": { code: "3212", description: "Hawaiian Airlines" },
  "china airlines": { code: "3215", description: "China Airlines" },
  "spring airlines": { code: "3217", description: "Spring Airlines" },
  "hk express": { code: "3230", description: "HK Express" },
  "hong kong express": { code: "3220", description: "Hong Kong Express" },
  "virgin atlantic": { code: "3246", description: "Virgin Atlantic" },
  virgin: { code: "3246", description: "Virgin Atlantic" },
  ryanair: { code: "3251", description: "Ryanair" },
  easyjet: { code: "3252", description: "easyJet" },
  "wizz air": { code: "3253", description: "Wizz Air" },
  wizzair: { code: "3253", description: "Wizz Air" },
  pegasus: { code: "3254", description: "Pegasus Airlines" },
  "pegasus airlines": { code: "3254", description: "Pegasus Airlines" },
  vueling: { code: "3256", description: "Vueling" },
  condor: { code: "3260", description: "Condor" },
  eurowings: { code: "3261", description: "Eurowings" },
  "air serbia": { code: "3266", description: "Air Serbia" },
  iberia: { code: "3267", description: "Iberia" },
  "air baltic": { code: "3282", description: "Air Baltic" },
  azul: { code: "3285", description: "Azul Brazilian Airlines" },
  "azul airlines": { code: "3285", description: "Azul Brazilian Airlines" },
  "sichuan airlines": { code: "3292", description: "Sichuan Airlines" },
  "hainan airlines": { code: "3295", description: "Hainan Airlines" },
  "xiamen airlines": { code: "3298", description: "Xiamen Airlines" },
  "air macau": { code: "3299", description: "Air Macau" },
};

/**
 * Hotel merchant name patterns -> MCC mappings
 * Keys are lowercase for case-insensitive matching
 */
export const HOTEL_MERCHANT_MCC_MAP: Record<
  string,
  { code: string; description: string }
> = {
  // Major hotel chains
  "holiday inn": { code: "3501", description: "Holiday Inn" },
  "holiday inn express": { code: "3694", description: "Holiday Inn Express" },
  "best western": { code: "3502", description: "Best Western" },
  sheraton: { code: "3503", description: "Sheraton" },
  hilton: { code: "3504", description: "Hilton" },
  "hilton international": { code: "3535", description: "Hilton International" },
  "hilton garden inn": { code: "3504", description: "Hilton" },
  "quality inn": { code: "3508", description: "Quality Inn" },
  marriott: { code: "3509", description: "Marriott" },
  "jw marriott": { code: "3596", description: "JW Marriott" },
  "days inn": { code: "3510", description: "Days Inn" },
  intercontinental: { code: "3512", description: "InterContinental" },
  ihg: { code: "3512", description: "InterContinental" },
  westin: { code: "3513", description: "Westin" },
  "la quinta": { code: "3516", description: "La Quinta" },
  pullman: { code: "3519", description: "Pullman Hotels" },
  meridien: { code: "3520", description: "Meridien" },
  "le meridien": { code: "3598", description: "Le Méridien" },
  peninsula: { code: "3523", description: "Peninsula Hotels" },
  "the peninsula": { code: "3523", description: "Peninsula Hotels" },
  doubletree: { code: "3527", description: "DoubleTree" },
  "red lion": { code: "3528", description: "Red Lion Hotels" },
  renaissance: { code: "3530", description: "Renaissance Hotels" },
  kempinski: { code: "3531", description: "Kempinski Hotels" },
  movenpick: { code: "3536", description: "Mövenpick Hotels" },
  scandic: { code: "3537", description: "Scandic Hotels" },
  "leading hotels": {
    code: "3540",
    description: "Leading Hotels of the World",
  },
  ibis: { code: "3541", description: "Ibis Hotels" },
  hyatt: { code: "3542", description: "Hyatt" },
  "hyatt regency": { code: "3641", description: "Hyatt Regency" },
  "park hyatt": { code: "3571", description: "Park Hyatt" },
  "grand hyatt": { code: "3572", description: "Grand Hyatt" },
  andaz: { code: "3573", description: "Andaz" },
  "hyatt place": { code: "3642", description: "Hyatt Place" },
  "hyatt house": { code: "3643", description: "Hyatt House" },
  "hyatt centric": { code: "3644", description: "Hyatt Centric" },
  "shangri-la": { code: "3544", description: "Shangri-La Hotels" },
  "shangri la": { code: "3544", description: "Shangri-La Hotels" },
  sofitel: { code: "3546", description: "Sofitel" },
  radisson: { code: "3558", description: "Radisson" },
  "radisson blu": { code: "3558", description: "Radisson" },
  langham: { code: "3551", description: "Langham Hotels" },
  "the langham": { code: "3551", description: "Langham Hotels" },
  swissotel: { code: "3552", description: "Swissôtel" },
  ascott: { code: "3554", description: "Ascott Serviced Residences" },
  "marco polo": { code: "3556", description: "Marco Polo Hotels" },
  nikko: { code: "3559", description: "Nikko Hotels" },
  okura: { code: "3560", description: "Okura Hotels" },
  "mandarin oriental": { code: "3561", description: "Mandarin Oriental" },
  "comfort inn": { code: "3562", description: "Comfort Inn" },
  clarion: { code: "3563", description: "Clarion Hotels" },
  "sleep inn": { code: "3564", description: "Sleep Inn" },
  "hampton inn": { code: "3566", description: "Hampton Inn" },
  hampton: { code: "3566", description: "Hampton Inn" },
  "ritz-carlton": { code: "3567", description: "Ritz-Carlton" },
  "ritz carlton": { code: "3567", description: "Ritz-Carlton" },
  "the ritz": { code: "3567", description: "Ritz-Carlton" },
  taj: { code: "3568", description: "Taj Hotels" },
  "taj hotels": { code: "3568", description: "Taj Hotels" },
  oberoi: { code: "3569", description: "Oberoi Hotels" },
  fairmont: { code: "3574", description: "Fairmont" },
  raffles: { code: "3575", description: "Raffles" },
  dusit: { code: "3577", description: "Dusit Hotels" },
  aman: { code: "3578", description: "Aman Resorts" },
  amanresorts: { code: "3578", description: "Aman Resorts" },
  "six senses": { code: "3579", description: "Six Senses" },
  anantara: { code: "3580", description: "Anantara" },
  capella: { code: "3581", description: "Capella Hotels" },
  como: { code: "3582", description: "Como Hotels" },
  rosewood: { code: "3583", description: "Rosewood Hotels" },
  edition: { code: "3584", description: "Edition Hotels" },
  melia: { code: "3585", description: "Melia Hotels" },
  novotel: { code: "3586", description: "Novotel" },
  mercure: { code: "3587", description: "Mercure Hotels" },
  "banyan tree": { code: "3588", description: "Banyan Tree" },
  "one&only": { code: "3589", description: "One&Only Resorts" },
  "one and only": { code: "3589", description: "One&Only Resorts" },
  "four seasons": { code: "3590", description: "Four Seasons" },
  "pan pacific": { code: "3592", description: "Pan Pacific Hotels" },
  parkroyal: { code: "3593", description: "Parkroyal Hotels" },
  regent: { code: "3594", description: "Regent Hotels" },
  "w hotel": { code: "3597", description: "W Hotels" },
  "w hotels": { code: "3597", description: "W Hotels" },
  "st regis": { code: "3600", description: "St. Regis" },
  "st. regis": { code: "3600", description: "St. Regis" },
  "luxury collection": { code: "3601", description: "Luxury Collection" },
  "autograph collection": { code: "3604", description: "Autograph Collection" },
  "delta hotels": { code: "3605", description: "Delta Hotels" },
  "ac hotels": { code: "3606", description: "AC Hotels" },
  aloft: { code: "3607", description: "Aloft Hotels" },
  element: { code: "3608", description: "Element Hotels" },
  "four points": { code: "3609", description: "Four Points" },
  moxy: { code: "3611", description: "Moxy Hotels" },
  courtyard: { code: "3613", description: "Courtyard by Marriott" },
  "courtyard by marriott": {
    code: "3613",
    description: "Courtyard by Marriott",
  },
  fairfield: { code: "3614", description: "Fairfield by Marriott" },
  "fairfield inn": { code: "3623", description: "Fairfield Inn" },
  "kerry hotels": { code: "3616", description: "Kerry Hotels" },
  kerry: { code: "3616", description: "Kerry Hotels" },
  jen: { code: "3617", description: "Jen by Shangri-La" },
  conrad: { code: "3618", description: "Conrad Hotels" },
  curio: { code: "3619", description: "Curio Collection" },
  canopy: { code: "3620", description: "Canopy by Hilton" },
  tapestry: { code: "3621", description: "Tapestry Collection" },
  "embassy suites": { code: "3622", description: "Embassy Suites" },
  home2: { code: "3624", description: "Home2 Suites" },
  "home2 suites": { code: "3624", description: "Home2 Suites" },
  homewood: { code: "3625", description: "Homewood Suites" },
  "homewood suites": { code: "3625", description: "Homewood Suites" },
  tru: { code: "3626", description: "Tru by Hilton" },
  "waldorf astoria": { code: "3627", description: "Waldorf Astoria" },
  waldorf: { code: "3627", description: "Waldorf Astoria" },
  lxr: { code: "3628", description: "LXR Hotels" },
  "springhill suites": { code: "3632", description: "SpringHill Suites" },
  "towneplace suites": { code: "3633", description: "TownePlace Suites" },
  "residence inn": { code: "3634", description: "Residence Inn" },
  gaylord: { code: "3635", description: "Gaylord Hotels" },
  bulgari: { code: "3636", description: "Bulgari Hotels" },
  accor: { code: "3654", description: "Accor Hotels" },
  mgallery: { code: "3656", description: "MGallery" },
  "mama shelter": { code: "3657", description: "Mama Shelter" },
  "25hours": { code: "3658", description: "25hours Hotels" },
  sls: { code: "3659", description: "SLS Hotels" },
  mondrian: { code: "3660", description: "Mondrian" },
  delano: { code: "3661", description: "Delano" },
  lotte: { code: "3676", description: "Lotte Hotels" },
  "lotte hotels": { code: "3676", description: "Lotte Hotels" },
  signiel: { code: "3677", description: "Signiel Hotels" },
  "far east": { code: "3680", description: "Far East Hotels" },
  oasia: { code: "3681", description: "Oasia Hotels" },
  quincy: { code: "3682", description: "Quincy Hotels" },
  yotel: { code: "3685", description: "Yotel" },
  citizenm: { code: "3686", description: "citizenM" },
  "citizen m": { code: "3686", description: "citizenM" },
  selina: { code: "3688", description: "Selina Hotels" },
  graduate: { code: "3690", description: "Graduate Hotels" },
  kimpton: { code: "3691", description: "Kimpton" },
  "hotel indigo": { code: "3692", description: "Hotel Indigo" },
  "crowne plaza": { code: "3693", description: "Crowne Plaza" },
  staybridge: { code: "3695", description: "Staybridge Suites" },
  candlewood: { code: "3696", description: "Candlewood Suites" },
  "even hotels": { code: "3697", description: "Even Hotels" },
  voco: { code: "3699", description: "Voco Hotels" },
  millennium: { code: "3672", description: "Millennium Hotels" },
  copthorne: { code: "3673", description: "Copthorne Hotels" },
  "m social": { code: "3674", description: "M Social" },
  thompson: { code: "3647", description: "Thompson Hotels" },
  "thompson hotels": { code: "3647", description: "Thompson Hotels" },
};

/**
 * Travel agency and tour operator patterns
 */
export const TRAVEL_AGENCY_MERCHANT_MAP: Record<
  string,
  { code: string; description: string }
> = {
  expedia: { code: "4722", description: "Travel Agencies" },
  booking: { code: "4722", description: "Travel Agencies" },
  "booking.com": { code: "4722", description: "Travel Agencies" },
  agoda: { code: "4722", description: "Travel Agencies" },
  hotels: { code: "4722", description: "Travel Agencies" },
  "hotels.com": { code: "4722", description: "Travel Agencies" },
  kayak: { code: "4722", description: "Travel Agencies" },
  priceline: { code: "4722", description: "Travel Agencies" },
  trivago: { code: "4722", description: "Travel Agencies" },
  trip: { code: "4722", description: "Travel Agencies" },
  "trip.com": { code: "4722", description: "Travel Agencies" },
  traveloka: { code: "4722", description: "Travel Agencies" },
  klook: { code: "4722", description: "Travel Agencies" },
  skyscanner: { code: "4722", description: "Travel Agencies" },
  momondo: { code: "4722", description: "Travel Agencies" },
  orbitz: { code: "4722", description: "Travel Agencies" },
  travelocity: { code: "4722", description: "Travel Agencies" },
  hotwire: { code: "4722", description: "Travel Agencies" },
  cheaptickets: { code: "4722", description: "Travel Agencies" },
  airbnb: { code: "4722", description: "Travel Agencies" },
  vrbo: { code: "4722", description: "Travel Agencies" },
};

/**
 * Sort patterns by length (longest first) to ensure more specific matches
 * take precedence over shorter, more general patterns.
 */
function getSortedPatterns(
  map: Record<string, { code: string; description: string }>
): Array<[string, { code: string; description: string }]> {
  return Object.entries(map).sort((a, b) => b[0].length - a[0].length);
}

// Pre-sorted pattern arrays for efficient lookup
const SORTED_AIRLINE_PATTERNS = getSortedPatterns(AIRLINE_MERCHANT_MCC_MAP);
const SORTED_HOTEL_PATTERNS = getSortedPatterns(HOTEL_MERCHANT_MCC_MAP);
const SORTED_TRAVEL_AGENCY_PATTERNS = getSortedPatterns(
  TRAVEL_AGENCY_MERCHANT_MAP
);

/**
 * Look up MCC from merchant name using substring matching.
 * Returns the MCC if the merchant name contains any of the known patterns.
 * Patterns are checked longest-first to ensure more specific matches win.
 *
 * @param merchantName - The merchant name to look up
 * @returns The matching MCC or null if no match found
 */
export function getMCCFromMerchantName(
  merchantName: string
): MerchantCategoryCode | null {
  if (!merchantName || merchantName.trim().length < 3) {
    return null;
  }

  const normalizedName = merchantName.toLowerCase().trim();

  // Check airlines first (sorted by pattern length, longest first)
  for (const [pattern, mcc] of SORTED_AIRLINE_PATTERNS) {
    if (normalizedName.includes(pattern)) {
      return mcc;
    }
  }

  // Check hotels (sorted by pattern length, longest first)
  for (const [pattern, mcc] of SORTED_HOTEL_PATTERNS) {
    if (normalizedName.includes(pattern)) {
      return mcc;
    }
  }

  // Check travel agencies (sorted by pattern length, longest first)
  for (const [pattern, mcc] of SORTED_TRAVEL_AGENCY_PATTERNS) {
    if (normalizedName.includes(pattern)) {
      return mcc;
    }
  }

  return null;
}

/**
 * Get a list of all merchant name patterns for airlines.
 * Useful for building exclusion rules.
 */
export function getAirlineMerchantPatterns(): string[] {
  return Object.keys(AIRLINE_MERCHANT_MCC_MAP);
}

/**
 * Get a list of all merchant name patterns for hotels.
 * Useful for building exclusion rules.
 */
export function getHotelMerchantPatterns(): string[] {
  return Object.keys(HOTEL_MERCHANT_MCC_MAP);
}

/**
 * Check if a merchant name matches an airline pattern.
 */
export function isAirlineMerchant(merchantName: string): boolean {
  if (!merchantName) return false;
  const normalized = merchantName.toLowerCase().trim();
  return Object.keys(AIRLINE_MERCHANT_MCC_MAP).some((pattern) =>
    normalized.includes(pattern)
  );
}

/**
 * Check if a merchant name matches a hotel pattern.
 */
export function isHotelMerchant(merchantName: string): boolean {
  if (!merchantName) return false;
  const normalized = merchantName.toLowerCase().trim();
  return Object.keys(HOTEL_MERCHANT_MCC_MAP).some((pattern) =>
    normalized.includes(pattern)
  );
}

/**
 * Check if a merchant name matches a travel-related pattern (airlines, hotels, or travel agencies).
 */
export function isTravelMerchant(merchantName: string): boolean {
  return getMCCFromMerchantName(merchantName) !== null;
}

/**
 * Grocery and supermarket merchant name patterns -> MCC mappings
 * Keys are lowercase for case-insensitive matching
 */
export const GROCERY_MERCHANT_MCC_MAP: Record<
  string,
  { code: string; description: string }
> = {
  // Canadian supermarkets
  "t&t supermarket": { code: "5411", description: "Grocery Stores" },
  "t&t": { code: "5411", description: "Grocery Stores" },
  pricesmart: { code: "5411", description: "Grocery Stores" },
  "pricesmart foods": { code: "5411", description: "Grocery Stores" },
  loblaws: { code: "5411", description: "Grocery Stores" },
  "no frills": { code: "5411", description: "Grocery Stores" },
  "real canadian superstore": { code: "5411", description: "Grocery Stores" },
  superstore: { code: "5411", description: "Grocery Stores" },
  sobeys: { code: "5411", description: "Grocery Stores" },
  safeway: { code: "5411", description: "Grocery Stores" },
  "save-on-foods": { code: "5411", description: "Grocery Stores" },
  "save on foods": { code: "5411", description: "Grocery Stores" },
  "whole foods": { code: "5411", description: "Grocery Stores" },
  "metro grocery": { code: "5411", description: "Grocery Stores" },
  "food basics": { code: "5411", description: "Grocery Stores" },
  freshco: { code: "5411", description: "Grocery Stores" },
  "farm boy": { code: "5411", description: "Grocery Stores" },
  longos: { code: "5411", description: "Grocery Stores" },
  fortinos: { code: "5411", description: "Grocery Stores" },
  zehrs: { code: "5411", description: "Grocery Stores" },
  "atlantic superstore": { code: "5411", description: "Grocery Stores" },
  "maxi & cie": { code: "5411", description: "Grocery Stores" },
  maxi: { code: "5411", description: "Grocery Stores" },
  provigo: { code: "5411", description: "Grocery Stores" },
  iga: { code: "5411", description: "Grocery Stores" },
  "price chopper": { code: "5411", description: "Grocery Stores" },
  // US supermarkets
  walmart: { code: "5411", description: "Grocery Stores" },
  kroger: { code: "5411", description: "Grocery Stores" },
  albertsons: { code: "5411", description: "Grocery Stores" },
  publix: { code: "5411", description: "Grocery Stores" },
  "trader joe": { code: "5411", description: "Grocery Stores" },
  "trader joes": { code: "5411", description: "Grocery Stores" },
  aldi: { code: "5411", description: "Grocery Stores" },
  "h-e-b": { code: "5411", description: "Grocery Stores" },
  heb: { code: "5411", description: "Grocery Stores" },
  meijer: { code: "5411", description: "Grocery Stores" },
  "food lion": { code: "5411", description: "Grocery Stores" },
  "stop & shop": { code: "5411", description: "Grocery Stores" },
  "giant eagle": { code: "5411", description: "Grocery Stores" },
  wegmans: { code: "5411", description: "Grocery Stores" },
  "harris teeter": { code: "5411", description: "Grocery Stores" },
  sprouts: { code: "5411", description: "Grocery Stores" },
  "piggly wiggly": { code: "5411", description: "Grocery Stores" },
  "winco foods": { code: "5411", description: "Grocery Stores" },
  // Asian supermarkets
  "99 ranch": { code: "5411", description: "Grocery Stores" },
  "ranch 99": { code: "5411", description: "Grocery Stores" },
  "h mart": { code: "5411", description: "Grocery Stores" },
  hmart: { code: "5411", description: "Grocery Stores" },
  "mitsuwa marketplace": { code: "5411", description: "Grocery Stores" },
  mitsuwa: { code: "5411", description: "Grocery Stores" },
  uwajimaya: { code: "5411", description: "Grocery Stores" },
  "patel brothers": { code: "5411", description: "Grocery Stores" },
  // UK supermarkets
  tesco: { code: "5411", description: "Grocery Stores" },
  sainsbury: { code: "5411", description: "Grocery Stores" },
  asda: { code: "5411", description: "Grocery Stores" },
  morrisons: { code: "5411", description: "Grocery Stores" },
  waitrose: { code: "5411", description: "Grocery Stores" },
  lidl: { code: "5411", description: "Grocery Stores" },
  // Australian supermarkets
  woolworths: { code: "5411", description: "Grocery Stores" },
  coles: { code: "5411", description: "Grocery Stores" },
  // Warehouse clubs
  costco: { code: "5411", description: "Grocery Stores" },
  "sam's club": { code: "5411", description: "Grocery Stores" },
  "bj's wholesale": { code: "5411", description: "Grocery Stores" },
};
