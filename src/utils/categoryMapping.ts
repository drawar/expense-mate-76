import { Transaction } from "@/types";

// =============================================================================
// MCC Mapping with Confidence Scores
// =============================================================================

export interface MCCMapping {
  mccCode: string;
  description: string;
  defaultCategory: string;
  confidence: number; // 0.0 to 1.0
  requiresReview: boolean;
  multiCategory: boolean;
}

/**
 * Comprehensive MCC to category mapping with confidence scores.
 * Confidence thresholds:
 * - 0.90-1.00: Auto-assign, no review needed
 * - 0.75-0.89: Auto-assign, flag for review
 * - 0.60-0.74: Auto-assign, prompt user
 * - 0.00-0.59: Force user selection
 */
export const MCC_MAPPINGS: Record<string, MCCMapping> = {
  // ==========================================================================
  // ESSENTIALS - Groceries
  // ==========================================================================
  "5411": {
    mccCode: "5411",
    description: "Grocery Stores, Supermarkets",
    defaultCategory: "Groceries",
    confidence: 0.85,
    requiresReview: false,
    multiCategory: true, // May include non-food items
  },
  "5422": {
    mccCode: "5422",
    description: "Freezer and Locker Meat Provisioners",
    defaultCategory: "Groceries",
    confidence: 0.95,
    requiresReview: false,
    multiCategory: false,
  },
  "5441": {
    mccCode: "5441",
    description: "Candy, Nut, and Confectionery Stores",
    defaultCategory: "Groceries",
    confidence: 0.9,
    requiresReview: false,
    multiCategory: false,
  },
  "5451": {
    mccCode: "5451",
    description: "Dairy Products Stores",
    defaultCategory: "Groceries",
    confidence: 0.95,
    requiresReview: false,
    multiCategory: false,
  },
  "5462": {
    mccCode: "5462",
    description: "Bakeries",
    defaultCategory: "Groceries",
    confidence: 0.9,
    requiresReview: false,
    multiCategory: false,
  },
  "5499": {
    mccCode: "5499",
    description: "Miscellaneous Food Stores",
    defaultCategory: "Groceries",
    confidence: 0.8,
    requiresReview: true,
    multiCategory: false,
  },
  "9751": {
    mccCode: "9751",
    description: "UK Supermarkets",
    defaultCategory: "Groceries",
    confidence: 0.85,
    requiresReview: false,
    multiCategory: true,
  },

  // ==========================================================================
  // ESSENTIALS - Utilities
  // ==========================================================================
  "4814": {
    mccCode: "4814",
    description: "Telecommunication Services",
    defaultCategory: "Utilities",
    confidence: 0.95,
    requiresReview: false,
    multiCategory: false,
  },
  "4816": {
    mccCode: "4816",
    description: "Computer Network/Information Services",
    defaultCategory: "Utilities",
    confidence: 0.85,
    requiresReview: false,
    multiCategory: false,
  },
  "4899": {
    mccCode: "4899",
    description: "Cable, Satellite, and Other Pay Television",
    defaultCategory: "Subscriptions & Memberships",
    confidence: 0.9,
    requiresReview: false,
    multiCategory: false,
  },
  "4900": {
    mccCode: "4900",
    description: "Electric, Gas, Sanitary and Water Utilities",
    defaultCategory: "Utilities",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },

  // ==========================================================================
  // ESSENTIALS - Transportation
  // ==========================================================================
  "4111": {
    mccCode: "4111",
    description: "Local and Suburban Commuter Passenger Transportation",
    defaultCategory: "Transportation",
    confidence: 0.95,
    requiresReview: false,
    multiCategory: false,
  },
  "4112": {
    mccCode: "4112",
    description: "Passenger Railways",
    defaultCategory: "Transportation",
    confidence: 0.95,
    requiresReview: false,
    multiCategory: false,
  },
  "4121": {
    mccCode: "4121",
    description: "Taxicabs and Limousines",
    defaultCategory: "Transportation",
    confidence: 0.85,
    requiresReview: false,
    multiCategory: false,
  },
  "4131": {
    mccCode: "4131",
    description: "Bus Lines",
    defaultCategory: "Transportation",
    confidence: 0.95,
    requiresReview: false,
    multiCategory: false,
  },
  "4784": {
    mccCode: "4784",
    description: "Tolls and Bridge Fees",
    defaultCategory: "Transportation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "4789": {
    mccCode: "4789",
    description: "Transportation Services - Not elsewhere classified",
    defaultCategory: "Transportation",
    confidence: 0.7,
    requiresReview: true,
    multiCategory: false,
  },
  "5013": {
    mccCode: "5013",
    description: "Motor Vehicle Supplies and New Parts",
    defaultCategory: "Transportation",
    confidence: 0.8,
    requiresReview: false,
    multiCategory: false,
  },
  "5531": {
    mccCode: "5531",
    description: "Auto and Home Supply Stores",
    defaultCategory: "Transportation",
    confidence: 0.7,
    requiresReview: true,
    multiCategory: true,
  },
  "5532": {
    mccCode: "5532",
    description: "Automotive Tire Stores",
    defaultCategory: "Transportation",
    confidence: 0.9,
    requiresReview: false,
    multiCategory: false,
  },
  "5533": {
    mccCode: "5533",
    description: "Automotive Parts and Accessories Stores",
    defaultCategory: "Transportation",
    confidence: 0.85,
    requiresReview: false,
    multiCategory: false,
  },
  "5541": {
    mccCode: "5541",
    description: "Service Stations - With or Without Ancillary Services",
    defaultCategory: "Transportation",
    confidence: 0.75,
    requiresReview: true,
    multiCategory: true, // Could be gas or convenience store
  },
  "5542": {
    mccCode: "5542",
    description: "Automated Fuel Dispensers",
    defaultCategory: "Transportation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "7511": {
    mccCode: "7511",
    description: "Truck and Utility Trailer Rentals",
    defaultCategory: "Transportation",
    confidence: 0.85,
    requiresReview: false,
    multiCategory: false,
  },
  "7512": {
    mccCode: "7512",
    description: "Automobile Rental Agency",
    defaultCategory: "Travel & Vacation",
    confidence: 0.9,
    requiresReview: false,
    multiCategory: false,
  },
  "7523": {
    mccCode: "7523",
    description: "Parking Lots, Parking Meters, Garages",
    defaultCategory: "Transportation",
    confidence: 0.95,
    requiresReview: false,
    multiCategory: false,
  },
  "7531": {
    mccCode: "7531",
    description: "Automotive Body Repair Shops",
    defaultCategory: "Transportation",
    confidence: 0.9,
    requiresReview: false,
    multiCategory: false,
  },
  "7534": {
    mccCode: "7534",
    description: "Tire Retreading and Repair Shops",
    defaultCategory: "Transportation",
    confidence: 0.9,
    requiresReview: false,
    multiCategory: false,
  },
  "7535": {
    mccCode: "7535",
    description: "Paint Shops - Automotive",
    defaultCategory: "Transportation",
    confidence: 0.9,
    requiresReview: false,
    multiCategory: false,
  },
  "7538": {
    mccCode: "7538",
    description: "Automotive Service Shops",
    defaultCategory: "Transportation",
    confidence: 0.9,
    requiresReview: false,
    multiCategory: false,
  },
  "7542": {
    mccCode: "7542",
    description: "Car Washes",
    defaultCategory: "Transportation",
    confidence: 0.95,
    requiresReview: false,
    multiCategory: false,
  },
  "7549": {
    mccCode: "7549",
    description: "Towing Services",
    defaultCategory: "Transportation",
    confidence: 0.95,
    requiresReview: false,
    multiCategory: false,
  },

  // ==========================================================================
  // ESSENTIALS - Healthcare
  // ==========================================================================
  "5122": {
    mccCode: "5122",
    description: "Drugs, Drug Proprietors",
    defaultCategory: "Healthcare",
    confidence: 0.75,
    requiresReview: true,
    multiCategory: true, // Could be pharmacy or beauty
  },
  "5912": {
    mccCode: "5912",
    description: "Drug Stores and Pharmacies",
    defaultCategory: "Healthcare",
    confidence: 0.7,
    requiresReview: true,
    multiCategory: true, // Sell many things
  },
  "5975": {
    mccCode: "5975",
    description: "Hearing Aids - Sales, Service, and Supply",
    defaultCategory: "Healthcare",
    confidence: 0.95,
    requiresReview: false,
    multiCategory: false,
  },
  "5976": {
    mccCode: "5976",
    description: "Orthopedic Goods - Prosthetic Devices",
    defaultCategory: "Healthcare",
    confidence: 0.95,
    requiresReview: false,
    multiCategory: false,
  },
  "8011": {
    mccCode: "8011",
    description: "Doctors and Physicians",
    defaultCategory: "Healthcare",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "8021": {
    mccCode: "8021",
    description: "Dentists and Orthodontists",
    defaultCategory: "Healthcare",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "8031": {
    mccCode: "8031",
    description: "Osteopaths",
    defaultCategory: "Healthcare",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "8041": {
    mccCode: "8041",
    description: "Chiropractors",
    defaultCategory: "Healthcare",
    confidence: 0.95,
    requiresReview: false,
    multiCategory: false,
  },
  "8042": {
    mccCode: "8042",
    description: "Optometrists and Ophthalmologists",
    defaultCategory: "Healthcare",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "8043": {
    mccCode: "8043",
    description: "Opticians, Optical Goods, and Eyeglasses",
    defaultCategory: "Healthcare",
    confidence: 0.9,
    requiresReview: false,
    multiCategory: false,
  },
  "8049": {
    mccCode: "8049",
    description: "Podiatrists and Chiropodists",
    defaultCategory: "Healthcare",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "8050": {
    mccCode: "8050",
    description: "Nursing and Personal Care Facilities",
    defaultCategory: "Healthcare",
    confidence: 0.95,
    requiresReview: false,
    multiCategory: false,
  },
  "8062": {
    mccCode: "8062",
    description: "Hospitals",
    defaultCategory: "Healthcare",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "8071": {
    mccCode: "8071",
    description: "Medical and Dental Laboratories",
    defaultCategory: "Healthcare",
    confidence: 0.95,
    requiresReview: false,
    multiCategory: false,
  },
  "8099": {
    mccCode: "8099",
    description: "Medical Services - Not Elsewhere Classified",
    defaultCategory: "Healthcare",
    confidence: 0.9,
    requiresReview: false,
    multiCategory: false,
  },

  // ==========================================================================
  // LIFESTYLE - Dining
  // ==========================================================================
  "5811": {
    mccCode: "5811",
    description: "Caterers",
    defaultCategory: "Dining Out",
    confidence: 0.8,
    requiresReview: false,
    multiCategory: false,
  },
  "5812": {
    mccCode: "5812",
    description: "Eating Places and Restaurants",
    defaultCategory: "Dining Out",
    confidence: 0.9,
    requiresReview: false,
    multiCategory: false,
  },
  "5813": {
    mccCode: "5813",
    description: "Drinking Places - Bars, Taverns, Nightclubs",
    defaultCategory: "Dining Out",
    confidence: 0.95,
    requiresReview: false,
    multiCategory: false,
  },
  "5814": {
    mccCode: "5814",
    description: "Fast Food Restaurants",
    defaultCategory: "Fast Food & Takeout",
    confidence: 0.85,
    requiresReview: false,
    multiCategory: false, // Could be delivery but check merchant name
  },

  // ==========================================================================
  // LIFESTYLE - Travel
  // ==========================================================================
  "4411": {
    mccCode: "4411",
    description: "Cruise Lines",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "4457": {
    mccCode: "4457",
    description: "Boat Rentals and Leases",
    defaultCategory: "Travel & Vacation",
    confidence: 0.9,
    requiresReview: false,
    multiCategory: false,
  },
  "4511": {
    mccCode: "4511",
    description: "Airlines, Air Carriers",
    defaultCategory: "Travel & Vacation",
    confidence: 0.95,
    requiresReview: false,
    multiCategory: false,
  },
  "4582": {
    mccCode: "4582",
    description: "Airports, Flying Fields, and Airport Terminals",
    defaultCategory: "Travel & Vacation",
    confidence: 0.9,
    requiresReview: false,
    multiCategory: false,
  },
  "4722": {
    mccCode: "4722",
    description: "Travel Agencies and Tour Operators",
    defaultCategory: "Travel & Vacation",
    confidence: 0.95,
    requiresReview: false,
    multiCategory: false,
  },
  "7011": {
    mccCode: "7011",
    description: "Lodging - Hotels, Motels, Resorts",
    defaultCategory: "Travel & Vacation",
    confidence: 0.95,
    requiresReview: false,
    multiCategory: false,
  },
  "7012": {
    mccCode: "7012",
    description: "Timeshares",
    defaultCategory: "Travel & Vacation",
    confidence: 0.9,
    requiresReview: false,
    multiCategory: false,
  },
  "7032": {
    mccCode: "7032",
    description: "Sporting and Recreational Camps",
    defaultCategory: "Travel & Vacation",
    confidence: 0.9,
    requiresReview: false,
    multiCategory: false,
  },
  "7033": {
    mccCode: "7033",
    description: "Trailer Parks and Camp Grounds",
    defaultCategory: "Travel & Vacation",
    confidence: 0.9,
    requiresReview: false,
    multiCategory: false,
  },
  "7519": {
    mccCode: "7519",
    description: "Motor Home and Recreational Vehicle Rentals",
    defaultCategory: "Travel & Vacation",
    confidence: 0.85,
    requiresReview: false,
    multiCategory: false,
  },

  // ==========================================================================
  // LIFESTYLE - Travel: Specific Airlines (MCC 3000-3299)
  // ==========================================================================
  "3000": {
    mccCode: "3000",
    description: "United Airlines",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3001": {
    mccCode: "3001",
    description: "American Airlines",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3005": {
    mccCode: "3005",
    description: "British Airways",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3006": {
    mccCode: "3006",
    description: "Japan Airlines",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3007": {
    mccCode: "3007",
    description: "Air France",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3008": {
    mccCode: "3008",
    description: "Lufthansa",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3009": {
    mccCode: "3009",
    description: "Air Canada",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3010": {
    mccCode: "3010",
    description: "KLM Royal Dutch Airlines",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3011": {
    mccCode: "3011",
    description: "Aeroflot",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3012": {
    mccCode: "3012",
    description: "Qantas",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3013": {
    mccCode: "3013",
    description: "Alitalia",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3014": {
    mccCode: "3014",
    description: "Saudi Arabian Airlines",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3015": {
    mccCode: "3015",
    description: "Swiss International Air Lines",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3016": {
    mccCode: "3016",
    description: "SAS Scandinavian Airlines",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3017": {
    mccCode: "3017",
    description: "South African Airways",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3020": {
    mccCode: "3020",
    description: "Air India",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3022": {
    mccCode: "3022",
    description: "Philippine Airlines",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3025": {
    mccCode: "3025",
    description: "Air New Zealand",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3026": {
    mccCode: "3026",
    description: "Emirates",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3030": {
    mccCode: "3030",
    description: "Aer Lingus",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3032": {
    mccCode: "3032",
    description: "Malaysia Airlines",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3034": {
    mccCode: "3034",
    description: "Etihad Airways",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3035": {
    mccCode: "3035",
    description: "El Al",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3036": {
    mccCode: "3036",
    description: "AVIANCA",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3039": {
    mccCode: "3039",
    description: "Finnair",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3040": {
    mccCode: "3040",
    description: "Gulf Air Bahrain",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3041": {
    mccCode: "3041",
    description: "Garuda Indonesia",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3043": {
    mccCode: "3043",
    description: "Saudia",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3048": {
    mccCode: "3048",
    description: "TAP Air Portugal",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3053": {
    mccCode: "3053",
    description: "Austrian Airlines",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3058": {
    mccCode: "3058",
    description: "Delta Air Lines",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3063": {
    mccCode: "3063",
    description: "Middle East Airlines",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3065": {
    mccCode: "3065",
    description: "Tiger Airways",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3067": {
    mccCode: "3067",
    description: "Southwest Airlines",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3073": {
    mccCode: "3073",
    description: "Srilankan Airlines",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3074": {
    mccCode: "3074",
    description: "Icelandair",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3081": {
    mccCode: "3081",
    description: "Kenya Airways",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3082": {
    mccCode: "3082",
    description: "Korean Air",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3083": {
    mccCode: "3083",
    description: "ANA All Nippon Airways",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3085": {
    mccCode: "3085",
    description: "COPA Panama",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3086": {
    mccCode: "3086",
    description: "Aerolineas Argentinas",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3087": {
    mccCode: "3087",
    description: "Jet Airways",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3090": {
    mccCode: "3090",
    description: "China Eastern Airlines",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3091": {
    mccCode: "3091",
    description: "Egyptair",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3092": {
    mccCode: "3092",
    description: "China Southern Airlines",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3093": {
    mccCode: "3093",
    description: "Air China",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3097": {
    mccCode: "3097",
    description: "Cathay Pacific",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3102": {
    mccCode: "3102",
    description: "LOT Polish Airlines",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3112": {
    mccCode: "3112",
    description: "EVA Airways",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3125": {
    mccCode: "3125",
    description: "TAM Linhas Aéreas",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3129": {
    mccCode: "3129",
    description: "SunCountry Airlines",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3130": {
    mccCode: "3130",
    description: "Frontier Airlines",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3131": {
    mccCode: "3131",
    description: "Spirit Airlines",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3132": {
    mccCode: "3132",
    description: "Virgin America",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3133": {
    mccCode: "3133",
    description: "Alaska Airlines",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3135": {
    mccCode: "3135",
    description: "Thai Airways",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3136": {
    mccCode: "3136",
    description: "Turkish Airlines",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3137": {
    mccCode: "3137",
    description: "Transavia Holland",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3138": {
    mccCode: "3138",
    description: "WestJet",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3144": {
    mccCode: "3144",
    description: "Singapore Airlines",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3145": {
    mccCode: "3145",
    description: "Scoot",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3146": {
    mccCode: "3146",
    description: "Volaris",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3148": {
    mccCode: "3148",
    description: "JetBlue Airways",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3151": {
    mccCode: "3151",
    description: "Air Transat",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3156": {
    mccCode: "3156",
    description: "IndiGo Airlines",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3159": {
    mccCode: "3159",
    description: "SpiceJet",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3161": {
    mccCode: "3161",
    description: "VietJet Air",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3163": {
    mccCode: "3163",
    description: "Bamboo Airways",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3171": {
    mccCode: "3171",
    description: "Vietnam Airlines",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3174": {
    mccCode: "3174",
    description: "EVA Air",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3175": {
    mccCode: "3175",
    description: "Cebu Pacific",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3176": {
    mccCode: "3176",
    description: "AirAsia",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3177": {
    mccCode: "3177",
    description: "AirAsia X",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3180": {
    mccCode: "3180",
    description: "Jetstar",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3181": {
    mccCode: "3181",
    description: "Lion Air",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3182": {
    mccCode: "3182",
    description: "Batik Air",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3184": {
    mccCode: "3184",
    description: "Starlux Airlines",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3196": {
    mccCode: "3196",
    description: "Peach Aviation",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3211": {
    mccCode: "3211",
    description: "Norwegian Air Shuttle",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3212": {
    mccCode: "3212",
    description: "Hawaiian Airlines",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3215": {
    mccCode: "3215",
    description: "China Airlines",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3217": {
    mccCode: "3217",
    description: "Spring Airlines",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3220": {
    mccCode: "3220",
    description: "Hong Kong Express",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3230": {
    mccCode: "3230",
    description: "HK Express",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3246": {
    mccCode: "3246",
    description: "Virgin Atlantic",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3251": {
    mccCode: "3251",
    description: "Ryanair",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3252": {
    mccCode: "3252",
    description: "easyJet",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3253": {
    mccCode: "3253",
    description: "Wizz Air",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3254": {
    mccCode: "3254",
    description: "Pegasus Airlines",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3256": {
    mccCode: "3256",
    description: "Vueling",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3260": {
    mccCode: "3260",
    description: "Condor",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3261": {
    mccCode: "3261",
    description: "Eurowings",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3266": {
    mccCode: "3266",
    description: "Air Serbia",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3267": {
    mccCode: "3267",
    description: "Iberia",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3282": {
    mccCode: "3282",
    description: "Air Baltic",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3285": {
    mccCode: "3285",
    description: "Azul Brazilian Airlines",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3292": {
    mccCode: "3292",
    description: "Sichuan Airlines",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3295": {
    mccCode: "3295",
    description: "Hainan Airlines",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3298": {
    mccCode: "3298",
    description: "Xiamen Airlines",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3299": {
    mccCode: "3299",
    description: "Air Macau",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },

  // ==========================================================================
  // LIFESTYLE - Travel: Specific Hotels (MCC 3500-3699)
  // ==========================================================================
  "3501": {
    mccCode: "3501",
    description: "Holiday Inn",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3502": {
    mccCode: "3502",
    description: "Best Western",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3503": {
    mccCode: "3503",
    description: "Sheraton",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3504": {
    mccCode: "3504",
    description: "Hilton",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3508": {
    mccCode: "3508",
    description: "Quality Inn",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3509": {
    mccCode: "3509",
    description: "Marriott",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3510": {
    mccCode: "3510",
    description: "Days Inn",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3512": {
    mccCode: "3512",
    description: "InterContinental",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3513": {
    mccCode: "3513",
    description: "Westin",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3516": {
    mccCode: "3516",
    description: "La Quinta",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3519": {
    mccCode: "3519",
    description: "Pullman Hotels",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3520": {
    mccCode: "3520",
    description: "Meridien",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3523": {
    mccCode: "3523",
    description: "Peninsula Hotels",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3527": {
    mccCode: "3527",
    description: "DoubleTree",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3528": {
    mccCode: "3528",
    description: "Red Lion Hotels",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3530": {
    mccCode: "3530",
    description: "Renaissance Hotels",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3531": {
    mccCode: "3531",
    description: "Kempinski Hotels",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3535": {
    mccCode: "3535",
    description: "Hilton International",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3536": {
    mccCode: "3536",
    description: "Mövenpick Hotels",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3537": {
    mccCode: "3537",
    description: "Scandic Hotels",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3540": {
    mccCode: "3540",
    description: "Leading Hotels of the World",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3541": {
    mccCode: "3541",
    description: "Ibis Hotels",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3542": {
    mccCode: "3542",
    description: "Hyatt",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3544": {
    mccCode: "3544",
    description: "Shangri-La Hotels",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3546": {
    mccCode: "3546",
    description: "Sofitel",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3551": {
    mccCode: "3551",
    description: "Langham Hotels",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3552": {
    mccCode: "3552",
    description: "Swissôtel",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3554": {
    mccCode: "3554",
    description: "Ascott Serviced Residences",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3556": {
    mccCode: "3556",
    description: "Marco Polo Hotels",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3558": {
    mccCode: "3558",
    description: "Radisson",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3559": {
    mccCode: "3559",
    description: "Nikko Hotels",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3560": {
    mccCode: "3560",
    description: "Okura Hotels",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3561": {
    mccCode: "3561",
    description: "Mandarin Oriental",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3562": {
    mccCode: "3562",
    description: "Comfort Inn",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3563": {
    mccCode: "3563",
    description: "Clarion Hotels",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3564": {
    mccCode: "3564",
    description: "Sleep Inn",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3566": {
    mccCode: "3566",
    description: "Hampton Inn",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3567": {
    mccCode: "3567",
    description: "Ritz-Carlton",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3568": {
    mccCode: "3568",
    description: "Taj Hotels",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3569": {
    mccCode: "3569",
    description: "Oberoi Hotels",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3571": {
    mccCode: "3571",
    description: "Park Hyatt",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3572": {
    mccCode: "3572",
    description: "Grand Hyatt",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3573": {
    mccCode: "3573",
    description: "Andaz",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3574": {
    mccCode: "3574",
    description: "Fairmont",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3575": {
    mccCode: "3575",
    description: "Raffles",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3577": {
    mccCode: "3577",
    description: "Dusit Hotels",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3578": {
    mccCode: "3578",
    description: "Aman Resorts",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3579": {
    mccCode: "3579",
    description: "Six Senses",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3580": {
    mccCode: "3580",
    description: "Anantara",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3581": {
    mccCode: "3581",
    description: "Capella Hotels",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3582": {
    mccCode: "3582",
    description: "Como Hotels",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3583": {
    mccCode: "3583",
    description: "Rosewood Hotels",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3584": {
    mccCode: "3584",
    description: "Edition Hotels",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3585": {
    mccCode: "3585",
    description: "Melia Hotels",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3586": {
    mccCode: "3586",
    description: "Novotel",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3587": {
    mccCode: "3587",
    description: "Mercure Hotels",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3588": {
    mccCode: "3588",
    description: "Banyan Tree",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3589": {
    mccCode: "3589",
    description: "One&Only Resorts",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3590": {
    mccCode: "3590",
    description: "Four Seasons",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3592": {
    mccCode: "3592",
    description: "Pan Pacific Hotels",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3593": {
    mccCode: "3593",
    description: "Parkroyal Hotels",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3594": {
    mccCode: "3594",
    description: "Regent Hotels",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3596": {
    mccCode: "3596",
    description: "JW Marriott",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3597": {
    mccCode: "3597",
    description: "W Hotels",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3598": {
    mccCode: "3598",
    description: "Le Méridien",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3600": {
    mccCode: "3600",
    description: "St. Regis",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3601": {
    mccCode: "3601",
    description: "Luxury Collection",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3604": {
    mccCode: "3604",
    description: "Autograph Collection",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3605": {
    mccCode: "3605",
    description: "Delta Hotels",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3606": {
    mccCode: "3606",
    description: "AC Hotels",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3607": {
    mccCode: "3607",
    description: "Aloft Hotels",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3608": {
    mccCode: "3608",
    description: "Element Hotels",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3609": {
    mccCode: "3609",
    description: "Four Points",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3611": {
    mccCode: "3611",
    description: "Moxy Hotels",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3613": {
    mccCode: "3613",
    description: "Courtyard by Marriott",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3614": {
    mccCode: "3614",
    description: "Fairfield by Marriott",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3616": {
    mccCode: "3616",
    description: "Kerry Hotels",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3617": {
    mccCode: "3617",
    description: "Jen by Shangri-La",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3618": {
    mccCode: "3618",
    description: "Conrad Hotels",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3619": {
    mccCode: "3619",
    description: "Curio Collection",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3620": {
    mccCode: "3620",
    description: "Canopy by Hilton",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3621": {
    mccCode: "3621",
    description: "Tapestry Collection",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3622": {
    mccCode: "3622",
    description: "Embassy Suites",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3623": {
    mccCode: "3623",
    description: "Fairfield Inn",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3624": {
    mccCode: "3624",
    description: "Home2 Suites",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3625": {
    mccCode: "3625",
    description: "Homewood Suites",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3626": {
    mccCode: "3626",
    description: "Tru by Hilton",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3627": {
    mccCode: "3627",
    description: "Waldorf Astoria",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3628": {
    mccCode: "3628",
    description: "LXR Hotels",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3632": {
    mccCode: "3632",
    description: "SpringHill Suites",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3633": {
    mccCode: "3633",
    description: "TownePlace Suites",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3634": {
    mccCode: "3634",
    description: "Residence Inn",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3635": {
    mccCode: "3635",
    description: "Gaylord Hotels",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3636": {
    mccCode: "3636",
    description: "Bulgari Hotels",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3641": {
    mccCode: "3641",
    description: "Hyatt Regency",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3642": {
    mccCode: "3642",
    description: "Hyatt Place",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3643": {
    mccCode: "3643",
    description: "Hyatt House",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3644": {
    mccCode: "3644",
    description: "Hyatt Centric",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3647": {
    mccCode: "3647",
    description: "Thompson Hotels",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3654": {
    mccCode: "3654",
    description: "Accor Hotels",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3656": {
    mccCode: "3656",
    description: "MGallery",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3657": {
    mccCode: "3657",
    description: "Mama Shelter",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3658": {
    mccCode: "3658",
    description: "25hours Hotels",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3659": {
    mccCode: "3659",
    description: "SLS Hotels",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3660": {
    mccCode: "3660",
    description: "Mondrian",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3661": {
    mccCode: "3661",
    description: "Delano",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3672": {
    mccCode: "3672",
    description: "Millennium Hotels",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3673": {
    mccCode: "3673",
    description: "Copthorne Hotels",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3674": {
    mccCode: "3674",
    description: "M Social",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3676": {
    mccCode: "3676",
    description: "Lotte Hotels",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3677": {
    mccCode: "3677",
    description: "Signiel Hotels",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3680": {
    mccCode: "3680",
    description: "Far East Hotels",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3681": {
    mccCode: "3681",
    description: "Oasia Hotels",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3682": {
    mccCode: "3682",
    description: "Quincy Hotels",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3685": {
    mccCode: "3685",
    description: "Yotel",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3686": {
    mccCode: "3686",
    description: "citizenM",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3688": {
    mccCode: "3688",
    description: "Selina Hotels",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3690": {
    mccCode: "3690",
    description: "Graduate Hotels",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3691": {
    mccCode: "3691",
    description: "Kimpton",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3692": {
    mccCode: "3692",
    description: "Hotel Indigo",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3693": {
    mccCode: "3693",
    description: "Crowne Plaza",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3694": {
    mccCode: "3694",
    description: "Holiday Inn Express",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3695": {
    mccCode: "3695",
    description: "Staybridge Suites",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3696": {
    mccCode: "3696",
    description: "Candlewood Suites",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3697": {
    mccCode: "3697",
    description: "Even Hotels",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "3699": {
    mccCode: "3699",
    description: "Voco Hotels",
    defaultCategory: "Travel & Vacation",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },

  // ==========================================================================
  // LIFESTYLE - Travel: Specific Car Rental Companies (MCC 3351-3441)
  // ==========================================================================
  "3351": {
    mccCode: "3351",
    description: "Affiliated Auto Rental",
    defaultCategory: "Travel & Vacation",
    confidence: 0.95,
    requiresReview: false,
    multiCategory: false,
  },
  "3352": {
    mccCode: "3352",
    description: "American International Rent-A-Car",
    defaultCategory: "Travel & Vacation",
    confidence: 0.95,
    requiresReview: false,
    multiCategory: false,
  },
  "3353": {
    mccCode: "3353",
    description: "Brooks Rent-A-Car",
    defaultCategory: "Travel & Vacation",
    confidence: 0.95,
    requiresReview: false,
    multiCategory: false,
  },
  "3354": {
    mccCode: "3354",
    description: "Action Auto Rental",
    defaultCategory: "Travel & Vacation",
    confidence: 0.95,
    requiresReview: false,
    multiCategory: false,
  },
  "3355": {
    mccCode: "3355",
    description: "Sixt Car Rental",
    defaultCategory: "Travel & Vacation",
    confidence: 0.95,
    requiresReview: false,
    multiCategory: false,
  },
  "3357": {
    mccCode: "3357",
    description: "Hertz",
    defaultCategory: "Travel & Vacation",
    confidence: 0.95,
    requiresReview: false,
    multiCategory: false,
  },
  "3359": {
    mccCode: "3359",
    description: "Payless Car Rental",
    defaultCategory: "Travel & Vacation",
    confidence: 0.95,
    requiresReview: false,
    multiCategory: false,
  },
  "3360": {
    mccCode: "3360",
    description: "Snappy Car Rental",
    defaultCategory: "Travel & Vacation",
    confidence: 0.95,
    requiresReview: false,
    multiCategory: false,
  },
  "3361": {
    mccCode: "3361",
    description: "Airways Rent-A-Car",
    defaultCategory: "Travel & Vacation",
    confidence: 0.95,
    requiresReview: false,
    multiCategory: false,
  },
  "3362": {
    mccCode: "3362",
    description: "Altra Auto Rental",
    defaultCategory: "Travel & Vacation",
    confidence: 0.95,
    requiresReview: false,
    multiCategory: false,
  },
  "3364": {
    mccCode: "3364",
    description: "Agency Rent-A-Car",
    defaultCategory: "Travel & Vacation",
    confidence: 0.95,
    requiresReview: false,
    multiCategory: false,
  },
  "3366": {
    mccCode: "3366",
    description: "Budget Rent-A-Car",
    defaultCategory: "Travel & Vacation",
    confidence: 0.95,
    requiresReview: false,
    multiCategory: false,
  },
  "3368": {
    mccCode: "3368",
    description: "Holiday Rent-A-Car",
    defaultCategory: "Travel & Vacation",
    confidence: 0.95,
    requiresReview: false,
    multiCategory: false,
  },
  "3370": {
    mccCode: "3370",
    description: "Rent-A-Wreck",
    defaultCategory: "Travel & Vacation",
    confidence: 0.95,
    requiresReview: false,
    multiCategory: false,
  },
  "3374": {
    mccCode: "3374",
    description: "Accent Rent-A-Car",
    defaultCategory: "Travel & Vacation",
    confidence: 0.95,
    requiresReview: false,
    multiCategory: false,
  },
  "3376": {
    mccCode: "3376",
    description: "Ajax Rent-A-Car",
    defaultCategory: "Travel & Vacation",
    confidence: 0.95,
    requiresReview: false,
    multiCategory: false,
  },
  "3380": {
    mccCode: "3380",
    description: "Triangle Rent-A-Car",
    defaultCategory: "Travel & Vacation",
    confidence: 0.95,
    requiresReview: false,
    multiCategory: false,
  },
  "3381": {
    mccCode: "3381",
    description: "Europcar",
    defaultCategory: "Travel & Vacation",
    confidence: 0.95,
    requiresReview: false,
    multiCategory: false,
  },
  "3385": {
    mccCode: "3385",
    description: "Tropical Rent-A-Car",
    defaultCategory: "Travel & Vacation",
    confidence: 0.95,
    requiresReview: false,
    multiCategory: false,
  },
  "3386": {
    mccCode: "3386",
    description: "Showcase Rental Cars",
    defaultCategory: "Travel & Vacation",
    confidence: 0.95,
    requiresReview: false,
    multiCategory: false,
  },
  "3387": {
    mccCode: "3387",
    description: "Alamo Rent-A-Car",
    defaultCategory: "Travel & Vacation",
    confidence: 0.95,
    requiresReview: false,
    multiCategory: false,
  },
  "3388": {
    mccCode: "3388",
    description: "Merchants Rent-A-Car",
    defaultCategory: "Travel & Vacation",
    confidence: 0.95,
    requiresReview: false,
    multiCategory: false,
  },
  "3389": {
    mccCode: "3389",
    description: "Avis Rent-A-Car",
    defaultCategory: "Travel & Vacation",
    confidence: 0.95,
    requiresReview: false,
    multiCategory: false,
  },
  "3390": {
    mccCode: "3390",
    description: "Dollar Rent-A-Car",
    defaultCategory: "Travel & Vacation",
    confidence: 0.95,
    requiresReview: false,
    multiCategory: false,
  },
  "3391": {
    mccCode: "3391",
    description: "Europe By Car",
    defaultCategory: "Travel & Vacation",
    confidence: 0.95,
    requiresReview: false,
    multiCategory: false,
  },
  "3393": {
    mccCode: "3393",
    description: "National Car Rental",
    defaultCategory: "Travel & Vacation",
    confidence: 0.95,
    requiresReview: false,
    multiCategory: false,
  },
  "3394": {
    mccCode: "3394",
    description: "Kemwell Group Rent-A-Car",
    defaultCategory: "Travel & Vacation",
    confidence: 0.95,
    requiresReview: false,
    multiCategory: false,
  },
  "3395": {
    mccCode: "3395",
    description: "Thrifty Car Rental",
    defaultCategory: "Travel & Vacation",
    confidence: 0.95,
    requiresReview: false,
    multiCategory: false,
  },
  "3396": {
    mccCode: "3396",
    description: "Tilden Rent-A-Car",
    defaultCategory: "Travel & Vacation",
    confidence: 0.95,
    requiresReview: false,
    multiCategory: false,
  },
  "3398": {
    mccCode: "3398",
    description: "Econo-Car Rent-A-Car",
    defaultCategory: "Travel & Vacation",
    confidence: 0.95,
    requiresReview: false,
    multiCategory: false,
  },
  "3400": {
    mccCode: "3400",
    description: "Auto Host Car Rental",
    defaultCategory: "Travel & Vacation",
    confidence: 0.95,
    requiresReview: false,
    multiCategory: false,
  },
  "3405": {
    mccCode: "3405",
    description: "Enterprise Rent-A-Car",
    defaultCategory: "Travel & Vacation",
    confidence: 0.95,
    requiresReview: false,
    multiCategory: false,
  },
  "3409": {
    mccCode: "3409",
    description: "General Rent-A-Car",
    defaultCategory: "Travel & Vacation",
    confidence: 0.95,
    requiresReview: false,
    multiCategory: false,
  },
  "3412": {
    mccCode: "3412",
    description: "A-1 Rent-A-Car",
    defaultCategory: "Travel & Vacation",
    confidence: 0.95,
    requiresReview: false,
    multiCategory: false,
  },
  "3414": {
    mccCode: "3414",
    description: "Godfrey National Rent-A-Car",
    defaultCategory: "Travel & Vacation",
    confidence: 0.95,
    requiresReview: false,
    multiCategory: false,
  },
  "3420": {
    mccCode: "3420",
    description: "Ansa International Rent-A-Car",
    defaultCategory: "Travel & Vacation",
    confidence: 0.95,
    requiresReview: false,
    multiCategory: false,
  },
  "3421": {
    mccCode: "3421",
    description: "Allstate Rent-A-Car",
    defaultCategory: "Travel & Vacation",
    confidence: 0.95,
    requiresReview: false,
    multiCategory: false,
  },
  "3423": {
    mccCode: "3423",
    description: "Avcar Rent-A-Car",
    defaultCategory: "Travel & Vacation",
    confidence: 0.95,
    requiresReview: false,
    multiCategory: false,
  },
  "3425": {
    mccCode: "3425",
    description: "Automate Rent-A-Car",
    defaultCategory: "Travel & Vacation",
    confidence: 0.95,
    requiresReview: false,
    multiCategory: false,
  },
  "3427": {
    mccCode: "3427",
    description: "Avon Rent-A-Car",
    defaultCategory: "Travel & Vacation",
    confidence: 0.95,
    requiresReview: false,
    multiCategory: false,
  },
  "3428": {
    mccCode: "3428",
    description: "Carey Rent-A-Car",
    defaultCategory: "Travel & Vacation",
    confidence: 0.95,
    requiresReview: false,
    multiCategory: false,
  },
  "3429": {
    mccCode: "3429",
    description: "Insurance Rent-A-Car",
    defaultCategory: "Travel & Vacation",
    confidence: 0.95,
    requiresReview: false,
    multiCategory: false,
  },
  "3430": {
    mccCode: "3430",
    description: "Major Rent-A-Car",
    defaultCategory: "Travel & Vacation",
    confidence: 0.95,
    requiresReview: false,
    multiCategory: false,
  },
  "3431": {
    mccCode: "3431",
    description: "Replacement Rent-A-Car",
    defaultCategory: "Travel & Vacation",
    confidence: 0.95,
    requiresReview: false,
    multiCategory: false,
  },
  "3432": {
    mccCode: "3432",
    description: "Reserve Rent-A-Car",
    defaultCategory: "Travel & Vacation",
    confidence: 0.95,
    requiresReview: false,
    multiCategory: false,
  },
  "3433": {
    mccCode: "3433",
    description: "Ugly Duckling Rent-A-Car",
    defaultCategory: "Travel & Vacation",
    confidence: 0.95,
    requiresReview: false,
    multiCategory: false,
  },
  "3434": {
    mccCode: "3434",
    description: "USA Rent-A-Car",
    defaultCategory: "Travel & Vacation",
    confidence: 0.95,
    requiresReview: false,
    multiCategory: false,
  },
  "3435": {
    mccCode: "3435",
    description: "Value Rent-A-Car",
    defaultCategory: "Travel & Vacation",
    confidence: 0.95,
    requiresReview: false,
    multiCategory: false,
  },
  "3436": {
    mccCode: "3436",
    description: "Autohansa Rent-A-Car",
    defaultCategory: "Travel & Vacation",
    confidence: 0.95,
    requiresReview: false,
    multiCategory: false,
  },
  "3437": {
    mccCode: "3437",
    description: "Cite Rent-A-Car",
    defaultCategory: "Travel & Vacation",
    confidence: 0.95,
    requiresReview: false,
    multiCategory: false,
  },
  "3438": {
    mccCode: "3438",
    description: "Interent Rent-A-Car",
    defaultCategory: "Travel & Vacation",
    confidence: 0.95,
    requiresReview: false,
    multiCategory: false,
  },
  "3439": {
    mccCode: "3439",
    description: "Milleville Rent-A-Car",
    defaultCategory: "Travel & Vacation",
    confidence: 0.95,
    requiresReview: false,
    multiCategory: false,
  },
  "3441": {
    mccCode: "3441",
    description: "Advantage Rent-A-Car",
    defaultCategory: "Travel & Vacation",
    confidence: 0.95,
    requiresReview: false,
    multiCategory: false,
  },

  // ==========================================================================
  // LIFESTYLE - Entertainment
  // ==========================================================================
  "7832": {
    mccCode: "7832",
    description: "Motion Picture Theaters",
    defaultCategory: "Entertainment",
    confidence: 0.95,
    requiresReview: false,
    multiCategory: false,
  },
  "7841": {
    mccCode: "7841",
    description: "Video Tape Rental Stores",
    defaultCategory: "Entertainment",
    confidence: 0.9,
    requiresReview: false,
    multiCategory: false,
  },
  "7911": {
    mccCode: "7911",
    description: "Dance Halls, Studios, and Schools",
    defaultCategory: "Entertainment",
    confidence: 0.85,
    requiresReview: false,
    multiCategory: false,
  },
  "7922": {
    mccCode: "7922",
    description: "Theatrical Producers and Ticket Agencies",
    defaultCategory: "Entertainment",
    confidence: 0.9,
    requiresReview: false,
    multiCategory: false,
  },
  "7929": {
    mccCode: "7929",
    description: "Bands, Orchestras, and Entertainers",
    defaultCategory: "Entertainment",
    confidence: 0.85,
    requiresReview: false,
    multiCategory: false,
  },
  "7932": {
    mccCode: "7932",
    description: "Billiard and Pool Establishments",
    defaultCategory: "Entertainment",
    confidence: 0.9,
    requiresReview: false,
    multiCategory: false,
  },
  "7933": {
    mccCode: "7933",
    description: "Bowling Alleys",
    defaultCategory: "Entertainment",
    confidence: 0.9,
    requiresReview: false,
    multiCategory: false,
  },
  "7941": {
    mccCode: "7941",
    description:
      "Commercial Sports, Professional Sports Clubs, Athletic Fields, and Sports Promoters",
    defaultCategory: "Entertainment",
    confidence: 0.85,
    requiresReview: false,
    multiCategory: false,
  },
  "7991": {
    mccCode: "7991",
    description: "Tourist Attractions and Exhibits",
    defaultCategory: "Entertainment",
    confidence: 0.9,
    requiresReview: false,
    multiCategory: false,
  },
  "7994": {
    mccCode: "7994",
    description: "Video Game Arcades and Establishments",
    defaultCategory: "Entertainment",
    confidence: 0.9,
    requiresReview: false,
    multiCategory: false,
  },
  "7996": {
    mccCode: "7996",
    description: "Amusement Parks, Carnivals, Circuses",
    defaultCategory: "Entertainment",
    confidence: 0.95,
    requiresReview: false,
    multiCategory: false,
  },
  "7998": {
    mccCode: "7998",
    description: "Aquariums, Seaquariums, Dolphinariums, and Zoos",
    defaultCategory: "Entertainment",
    confidence: 0.95,
    requiresReview: false,
    multiCategory: false,
  },
  "7999": {
    mccCode: "7999",
    description: "Recreation Services - Not Elsewhere Classified",
    defaultCategory: "Entertainment",
    confidence: 0.7,
    requiresReview: true,
    multiCategory: false,
  },

  // ==========================================================================
  // LIFESTYLE - Hobbies & Recreation
  // ==========================================================================
  "5940": {
    mccCode: "5940",
    description: "Bicycle Shops - Sales and Service",
    defaultCategory: "Hobbies & Recreation",
    confidence: 0.85,
    requiresReview: false,
    multiCategory: false,
  },
  "5941": {
    mccCode: "5941",
    description: "Sporting Goods Stores",
    defaultCategory: "Hobbies & Recreation",
    confidence: 0.85,
    requiresReview: false,
    multiCategory: false,
  },
  "5942": {
    mccCode: "5942",
    description: "Book Stores",
    defaultCategory: "Hobbies & Recreation",
    confidence: 0.9,
    requiresReview: false,
    multiCategory: false,
  },
  "5945": {
    mccCode: "5945",
    description: "Hobby, Toy, and Game Shops",
    defaultCategory: "Hobbies & Recreation",
    confidence: 0.9,
    requiresReview: false,
    multiCategory: false,
  },
  "5946": {
    mccCode: "5946",
    description: "Camera and Photographic Supply Stores",
    defaultCategory: "Hobbies & Recreation",
    confidence: 0.85,
    requiresReview: false,
    multiCategory: false,
  },
  "5970": {
    mccCode: "5970",
    description: "Artist's Supply and Craft Shops",
    defaultCategory: "Hobbies & Recreation",
    confidence: 0.9,
    requiresReview: false,
    multiCategory: false,
  },
  "5994": {
    mccCode: "5994",
    description: "News Dealers and Newsstands",
    defaultCategory: "Hobbies & Recreation",
    confidence: 0.8,
    requiresReview: false,
    multiCategory: false,
  },
  "5733": {
    mccCode: "5733",
    description: "Music Stores - Musical Instruments",
    defaultCategory: "Hobbies & Recreation",
    confidence: 0.85,
    requiresReview: false,
    multiCategory: false,
  },
  "5735": {
    mccCode: "5735",
    description: "Record Shops",
    defaultCategory: "Hobbies & Recreation",
    confidence: 0.85,
    requiresReview: false,
    multiCategory: false,
  },
  "7992": {
    mccCode: "7992",
    description: "Public Golf Courses",
    defaultCategory: "Hobbies & Recreation",
    confidence: 0.9,
    requiresReview: false,
    multiCategory: false,
  },
  "7993": {
    mccCode: "7993",
    description: "Video Amusement Game Supplies",
    defaultCategory: "Hobbies & Recreation",
    confidence: 0.8,
    requiresReview: false,
    multiCategory: false,
  },

  // ==========================================================================
  // HOME & LIVING - Home Improvement
  // ==========================================================================
  "5200": {
    mccCode: "5200",
    description: "Home Supply Warehouse Stores",
    defaultCategory: "Home Improvement",
    confidence: 0.75,
    requiresReview: true,
    multiCategory: true,
  },
  "5211": {
    mccCode: "5211",
    description: "Lumber and Building Materials Stores",
    defaultCategory: "Home Improvement",
    confidence: 0.9,
    requiresReview: false,
    multiCategory: false,
  },
  "5231": {
    mccCode: "5231",
    description: "Glass, Paint, and Wallpaper Stores",
    defaultCategory: "Home Improvement",
    confidence: 0.85,
    requiresReview: false,
    multiCategory: false,
  },
  "5251": {
    mccCode: "5251",
    description: "Hardware Stores",
    defaultCategory: "Home Improvement",
    confidence: 0.85,
    requiresReview: false,
    multiCategory: false,
  },
  "5261": {
    mccCode: "5261",
    description: "Nurseries - Lawn and Garden Supply Store",
    defaultCategory: "Home Improvement",
    confidence: 0.85,
    requiresReview: false,
    multiCategory: false,
  },
  "5039": {
    mccCode: "5039",
    description: "Construction Materials - Not Elsewhere Classified",
    defaultCategory: "Home Improvement",
    confidence: 0.85,
    requiresReview: false,
    multiCategory: false,
  },
  "5072": {
    mccCode: "5072",
    description: "Hardware Equipment and Supplies",
    defaultCategory: "Home Improvement",
    confidence: 0.85,
    requiresReview: false,
    multiCategory: false,
  },
  "5074": {
    mccCode: "5074",
    description: "Plumbing and Heating Equipment and Supplies",
    defaultCategory: "Home Improvement",
    confidence: 0.85,
    requiresReview: false,
    multiCategory: false,
  },

  // ==========================================================================
  // HOME & LIVING - Furniture & Decor
  // ==========================================================================
  "5712": {
    mccCode: "5712",
    description: "Furniture, Home Furnishings, and Equipment Stores",
    defaultCategory: "Furniture & Decor",
    confidence: 0.8,
    requiresReview: false,
    multiCategory: false,
  },
  "5713": {
    mccCode: "5713",
    description: "Floor Covering Stores",
    defaultCategory: "Home Improvement",
    confidence: 0.85,
    requiresReview: false,
    multiCategory: false,
  },
  "5714": {
    mccCode: "5714",
    description: "Drapery, Window Covering, and Upholstery Stores",
    defaultCategory: "Furniture & Decor",
    confidence: 0.85,
    requiresReview: false,
    multiCategory: false,
  },
  "5718": {
    mccCode: "5718",
    description: "Fireplaces, Fireplace Screens, and Accessories",
    defaultCategory: "Home Improvement",
    confidence: 0.8,
    requiresReview: false,
    multiCategory: false,
  },
  "5719": {
    mccCode: "5719",
    description: "Miscellaneous Home Furnishing Specialty Stores",
    defaultCategory: "Home Essentials",
    confidence: 0.7,
    requiresReview: true,
    multiCategory: true,
  },
  "5722": {
    mccCode: "5722",
    description: "Household Appliance Stores",
    defaultCategory: "Home Essentials",
    confidence: 0.8,
    requiresReview: false,
    multiCategory: false,
  },

  // ==========================================================================
  // HOME & LIVING - Pet Care
  // ==========================================================================
  "0742": {
    mccCode: "0742",
    description: "Veterinary Services",
    defaultCategory: "Pet Care",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "5995": {
    mccCode: "5995",
    description: "Pet Shops, Pet Food, and Supplies",
    defaultCategory: "Pet Care",
    confidence: 0.95,
    requiresReview: false,
    multiCategory: false,
  },

  // ==========================================================================
  // PERSONAL CARE - Clothing
  // ==========================================================================
  "5611": {
    mccCode: "5611",
    description: "Men's and Boys' Clothing and Accessories Stores",
    defaultCategory: "Clothing & Shoes",
    confidence: 0.9,
    requiresReview: false,
    multiCategory: false,
  },
  "5621": {
    mccCode: "5621",
    description: "Women's Ready-to-Wear Stores",
    defaultCategory: "Clothing & Shoes",
    confidence: 0.9,
    requiresReview: false,
    multiCategory: false,
  },
  "5631": {
    mccCode: "5631",
    description: "Women's Accessory and Specialty Shops",
    defaultCategory: "Clothing & Shoes",
    confidence: 0.85,
    requiresReview: false,
    multiCategory: false,
  },
  "5641": {
    mccCode: "5641",
    description: "Children's and Infants' Wear Stores",
    defaultCategory: "Clothing & Shoes",
    confidence: 0.9,
    requiresReview: false,
    multiCategory: false,
  },
  "5651": {
    mccCode: "5651",
    description: "Family Clothing Stores",
    defaultCategory: "Clothing & Shoes",
    confidence: 0.9,
    requiresReview: false,
    multiCategory: false,
  },
  "5655": {
    mccCode: "5655",
    description: "Sports and Riding Apparel Stores",
    defaultCategory: "Clothing & Shoes",
    confidence: 0.85,
    requiresReview: false,
    multiCategory: false,
  },
  "5661": {
    mccCode: "5661",
    description: "Shoe Stores",
    defaultCategory: "Clothing & Shoes",
    confidence: 0.95,
    requiresReview: false,
    multiCategory: false,
  },
  "5691": {
    mccCode: "5691",
    description: "Men's and Women's Clothing Stores",
    defaultCategory: "Clothing & Shoes",
    confidence: 0.9,
    requiresReview: false,
    multiCategory: false,
  },
  "5697": {
    mccCode: "5697",
    description: "Tailors, Seamstress, Mending, and Alterations",
    defaultCategory: "Clothing & Shoes",
    confidence: 0.85,
    requiresReview: false,
    multiCategory: false,
  },
  "5699": {
    mccCode: "5699",
    description: "Miscellaneous Apparel and Accessory Shops",
    defaultCategory: "Clothing & Shoes",
    confidence: 0.8,
    requiresReview: false,
    multiCategory: false,
  },

  // ==========================================================================
  // PERSONAL CARE - Beauty
  // ==========================================================================
  "5977": {
    mccCode: "5977",
    description: "Cosmetic Stores",
    defaultCategory: "Beauty & Personal Care",
    confidence: 0.9,
    requiresReview: false,
    multiCategory: false,
  },
  "7230": {
    mccCode: "7230",
    description: "Beauty and Barber Shops",
    defaultCategory: "Beauty & Personal Care",
    confidence: 0.95,
    requiresReview: false,
    multiCategory: false,
  },
  "7297": {
    mccCode: "7297",
    description: "Massage Parlors",
    defaultCategory: "Beauty & Personal Care",
    confidence: 0.85,
    requiresReview: false,
    multiCategory: false,
  },
  "7298": {
    mccCode: "7298",
    description: "Health and Beauty Spas",
    defaultCategory: "Beauty & Personal Care",
    confidence: 0.9,
    requiresReview: false,
    multiCategory: false,
  },

  // ==========================================================================
  // PERSONAL CARE - Fitness
  // ==========================================================================
  "7997": {
    mccCode: "7997",
    description: "Membership Clubs - Sports, Recreation, Athletic",
    defaultCategory: "Gym & Fitness",
    confidence: 0.8,
    requiresReview: false,
    multiCategory: false,
  },

  // ==========================================================================
  // WORK & EDUCATION
  // ==========================================================================
  "5943": {
    mccCode: "5943",
    description: "Stationery Stores, Office and School Supply Stores",
    defaultCategory: "Work Expenses",
    confidence: 0.7,
    requiresReview: true,
    multiCategory: true,
  },
  "8211": {
    mccCode: "8211",
    description: "Elementary and Secondary Schools",
    defaultCategory: "Education",
    confidence: 0.95,
    requiresReview: false,
    multiCategory: false,
  },
  "8220": {
    mccCode: "8220",
    description: "Colleges, Universities, Professional Schools",
    defaultCategory: "Education",
    confidence: 0.95,
    requiresReview: false,
    multiCategory: false,
  },
  "8241": {
    mccCode: "8241",
    description: "Correspondence Schools",
    defaultCategory: "Education",
    confidence: 0.9,
    requiresReview: false,
    multiCategory: false,
  },
  "8244": {
    mccCode: "8244",
    description: "Business and Secretarial Schools",
    defaultCategory: "Professional Development",
    confidence: 0.9,
    requiresReview: false,
    multiCategory: false,
  },
  "8249": {
    mccCode: "8249",
    description: "Trade and Vocational Schools",
    defaultCategory: "Education",
    confidence: 0.9,
    requiresReview: false,
    multiCategory: false,
  },
  "8299": {
    mccCode: "8299",
    description: "Schools and Educational Services - Not Elsewhere Classified",
    defaultCategory: "Education",
    confidence: 0.85,
    requiresReview: false,
    multiCategory: false,
  },

  // ==========================================================================
  // FINANCIAL & OTHER - Subscriptions
  // ==========================================================================
  "5815": {
    mccCode: "5815",
    description: "Digital Goods: Media, Books, Movies, Music",
    defaultCategory: "Subscriptions & Memberships",
    confidence: 0.85,
    requiresReview: false,
    multiCategory: false,
  },
  "5816": {
    mccCode: "5816",
    description: "Digital Goods: Games",
    defaultCategory: "Entertainment",
    confidence: 0.9,
    requiresReview: false,
    multiCategory: false,
  },
  "5817": {
    mccCode: "5817",
    description: "Digital Goods: Applications (Excludes Games)",
    defaultCategory: "Subscriptions & Memberships",
    confidence: 0.8,
    requiresReview: false,
    multiCategory: false,
  },
  "5818": {
    mccCode: "5818",
    description: "Digital Goods: Large Digital Goods Merchant",
    defaultCategory: "Subscriptions & Memberships",
    confidence: 0.75,
    requiresReview: true,
    multiCategory: true,
  },

  // ==========================================================================
  // FINANCIAL & OTHER - Financial Services
  // ==========================================================================
  "6010": {
    mccCode: "6010",
    description: "Financial Institutions - Manual Cash Disbursements",
    defaultCategory: "Cash & ATM",
    confidence: 0.95,
    requiresReview: false,
    multiCategory: false,
  },
  "6011": {
    mccCode: "6011",
    description: "Financial Institutions - Automated Cash Disbursements",
    defaultCategory: "Cash & ATM",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "6012": {
    mccCode: "6012",
    description: "Financial Institutions - Merchandise and Services",
    defaultCategory: "Financial Services",
    confidence: 0.85,
    requiresReview: false,
    multiCategory: false,
  },
  "6051": {
    mccCode: "6051",
    description: "Non-Financial Institutions - Foreign Currency, Money Orders",
    defaultCategory: "Financial Services",
    confidence: 0.9,
    requiresReview: false,
    multiCategory: false,
  },
  "6211": {
    mccCode: "6211",
    description: "Security Brokers/Dealers",
    defaultCategory: "Financial Services",
    confidence: 0.9,
    requiresReview: false,
    multiCategory: false,
  },
  "6300": {
    mccCode: "6300",
    description: "Insurance Sales, Underwriting, and Premiums",
    defaultCategory: "Insurance",
    confidence: 0.95,
    requiresReview: false,
    multiCategory: false,
  },
  "6381": {
    mccCode: "6381",
    description: "Insurance Premiums",
    defaultCategory: "Insurance",
    confidence: 0.95,
    requiresReview: false,
    multiCategory: false,
  },
  "6513": {
    mccCode: "6513",
    description: "Real Estate Agents and Managers - Rentals",
    defaultCategory: "Housing",
    confidence: 0.95,
    requiresReview: false,
    multiCategory: false,
  },
  "7276": {
    mccCode: "7276",
    description: "Tax Preparation Services",
    defaultCategory: "Financial Services",
    confidence: 0.95,
    requiresReview: false,
    multiCategory: false,
  },

  // ==========================================================================
  // FINANCIAL & OTHER - Gifts & Donations
  // ==========================================================================
  "5947": {
    mccCode: "5947",
    description: "Gift, Card, Novelty, and Souvenir Shops",
    defaultCategory: "Gifts & Donations",
    confidence: 0.8,
    requiresReview: false,
    multiCategory: false,
  },
  "5992": {
    mccCode: "5992",
    description: "Florists",
    defaultCategory: "Gifts & Donations",
    confidence: 0.85,
    requiresReview: false,
    multiCategory: false,
  },
  "8398": {
    mccCode: "8398",
    description: "Charitable and Social Service Organizations",
    defaultCategory: "Gifts & Donations",
    confidence: 0.95,
    requiresReview: false,
    multiCategory: false,
  },
  "8641": {
    mccCode: "8641",
    description: "Civic, Fraternal, and Social Associations",
    defaultCategory: "Gifts & Donations",
    confidence: 0.8,
    requiresReview: false,
    multiCategory: false,
  },
  "8651": {
    mccCode: "8651",
    description: "Political Organizations",
    defaultCategory: "Gifts & Donations",
    confidence: 0.9,
    requiresReview: false,
    multiCategory: false,
  },
  "8661": {
    mccCode: "8661",
    description: "Religious Organizations",
    defaultCategory: "Gifts & Donations",
    confidence: 0.95,
    requiresReview: false,
    multiCategory: false,
  },

  // ==========================================================================
  // FINANCIAL & OTHER - Government & Fees
  // ==========================================================================
  "9211": {
    mccCode: "9211",
    description: "Court Costs, Including Alimony and Child Support",
    defaultCategory: "Financial Services",
    confidence: 0.95,
    requiresReview: false,
    multiCategory: false,
  },
  "9222": {
    mccCode: "9222",
    description: "Fines",
    defaultCategory: "Fees & Charges",
    confidence: 0.95,
    requiresReview: false,
    multiCategory: false,
  },
  "9311": {
    mccCode: "9311",
    description: "Tax Payments",
    defaultCategory: "Financial Services",
    confidence: 0.98,
    requiresReview: false,
    multiCategory: false,
  },
  "9399": {
    mccCode: "9399",
    description: "Government Services - Not Elsewhere Classified",
    defaultCategory: "Financial Services",
    confidence: 0.8,
    requiresReview: true,
    multiCategory: false,
  },
  "9402": {
    mccCode: "9402",
    description: "Postal Services - Government Only",
    defaultCategory: "Financial Services",
    confidence: 0.85,
    requiresReview: false,
    multiCategory: false,
  },

  // ==========================================================================
  // GENERAL SHOPPING (Fallback)
  // ==========================================================================
  "5300": {
    mccCode: "5300",
    description: "Wholesale Clubs",
    defaultCategory: "Groceries",
    confidence: 0.6,
    requiresReview: true,
    multiCategory: true, // Costco, Sam's Club, etc.
  },
  "5311": {
    mccCode: "5311",
    description: "Department Stores",
    defaultCategory: "Clothing & Shoes",
    confidence: 0.6,
    requiresReview: true,
    multiCategory: true,
  },
  "5331": {
    mccCode: "5331",
    description: "Variety Stores",
    defaultCategory: "Home Essentials",
    confidence: 0.6,
    requiresReview: true,
    multiCategory: true,
  },
  "5399": {
    mccCode: "5399",
    description: "Miscellaneous General Merchandise",
    defaultCategory: "Home Essentials",
    confidence: 0.5,
    requiresReview: true,
    multiCategory: true,
  },
  "5732": {
    mccCode: "5732",
    description: "Electronic Sales",
    defaultCategory: "Home Essentials",
    confidence: 0.7,
    requiresReview: false,
    multiCategory: false,
  },
  "5999": {
    mccCode: "5999",
    description: "Miscellaneous and Specialty Retail Stores",
    defaultCategory: "Uncategorized",
    confidence: 0.5,
    requiresReview: true,
    multiCategory: true,
  },
};

// =============================================================================
// Multi-Category Merchants
// =============================================================================

export interface MultiCategoryMerchant {
  pattern: RegExp;
  name: string;
  suggestedCategories: string[];
  defaultCategory: string;
}

export const MULTI_CATEGORY_MERCHANTS: MultiCategoryMerchant[] = [
  {
    pattern: /costco|costco\s*wholesale/i,
    name: "Costco",
    suggestedCategories: [
      "Groceries",
      "Transportation",
      "Home Essentials",
      "Healthcare",
    ],
    defaultCategory: "Groceries",
  },
  {
    pattern: /amazon|amzn|amazon\.com/i,
    name: "Amazon",
    suggestedCategories: [
      "Home Essentials",
      "Clothing & Shoes",
      "Hobbies & Recreation",
      "Groceries",
    ],
    defaultCategory: "Home Essentials",
  },
  {
    pattern: /walmart|wal-?mart/i,
    name: "Walmart",
    suggestedCategories: [
      "Groceries",
      "Clothing & Shoes",
      "Home Essentials",
      "Healthcare",
    ],
    defaultCategory: "Groceries",
  },
  {
    pattern: /target/i,
    name: "Target",
    suggestedCategories: [
      "Groceries",
      "Clothing & Shoes",
      "Home Essentials",
      "Beauty & Personal Care",
    ],
    defaultCategory: "Groceries",
  },
  {
    pattern: /shoppers\s*drug\s*mart|cvs|walgreens/i,
    name: "Pharmacy",
    suggestedCategories: [
      "Healthcare",
      "Beauty & Personal Care",
      "Groceries",
      "Home Essentials",
    ],
    defaultCategory: "Healthcare",
  },
  {
    pattern: /canadian\s*tire/i,
    name: "Canadian Tire",
    suggestedCategories: [
      "Home Improvement",
      "Transportation",
      "Hobbies & Recreation",
    ],
    defaultCategory: "Home Improvement",
  },
  {
    pattern: /uber\s*eats/i,
    name: "Uber Eats",
    suggestedCategories: ["Food Delivery", "Groceries"],
    defaultCategory: "Food Delivery",
  },
  {
    pattern: /doordash|door\s*dash/i,
    name: "DoorDash",
    suggestedCategories: ["Food Delivery", "Groceries"],
    defaultCategory: "Food Delivery",
  },
  {
    pattern: /skip\s*the\s*dishes|skipthedishes/i,
    name: "SkipTheDishes",
    suggestedCategories: ["Food Delivery"],
    defaultCategory: "Food Delivery",
  },
  {
    pattern: /instacart/i,
    name: "Instacart",
    suggestedCategories: ["Groceries"],
    defaultCategory: "Groceries",
  },
];

// =============================================================================
// Categorization Functions
// =============================================================================

export interface CategoryResult {
  category: string;
  confidence: number;
  reason: string;
  requiresReview: boolean;
  isMultiCategory: boolean;
  suggestedCategories?: string[];
}

/**
 * Get category from MCC code with confidence score.
 */
export function getCategoryFromMCC(mccCode?: string): string {
  if (!mccCode) return "Uncategorized";

  const mapping = MCC_MAPPINGS[mccCode];
  if (mapping) {
    return mapping.defaultCategory;
  }

  // Fallback logic for unmapped MCCs
  if (mccCode.startsWith("5")) return "Home Essentials"; // Retail
  if (mccCode.startsWith("4")) return "Transportation"; // Transportation
  if (mccCode.startsWith("7")) return "Entertainment"; // Services
  if (mccCode.startsWith("8")) return "Healthcare"; // Professional services
  if (mccCode.startsWith("6")) return "Financial Services"; // Financial
  if (mccCode.startsWith("9")) return "Financial Services"; // Government

  return "Uncategorized";
}

/**
 * Get full category result with confidence and metadata.
 */
export function getCategoryResultFromMCC(mccCode?: string): CategoryResult {
  if (!mccCode) {
    return {
      category: "Uncategorized",
      confidence: 0,
      reason: "No MCC code provided",
      requiresReview: true,
      isMultiCategory: false,
    };
  }

  const mapping = MCC_MAPPINGS[mccCode];
  if (mapping) {
    return {
      category: mapping.defaultCategory,
      confidence: mapping.confidence,
      reason: mapping.description,
      requiresReview: mapping.requiresReview,
      isMultiCategory: mapping.multiCategory,
    };
  }

  // Fallback
  return {
    category: getCategoryFromMCC(mccCode),
    confidence: 0.5,
    reason: `Unknown MCC: ${mccCode}`,
    requiresReview: true,
    isMultiCategory: false,
  };
}

/**
 * Check if merchant is a multi-category merchant and get suggestions.
 */
export function getMultiCategoryMerchant(
  merchantName: string
): MultiCategoryMerchant | null {
  for (const merchant of MULTI_CATEGORY_MERCHANTS) {
    if (merchant.pattern.test(merchantName)) {
      return merchant;
    }
  }
  return null;
}

/**
 * Categorize based on merchant name (for when MCC is unavailable or unreliable).
 */
export function getCategoryFromMerchantName(
  merchantName: string
): string | null {
  if (!merchantName) return null;

  const name = merchantName.toLowerCase();

  // Check multi-category merchants first
  const multiCat = getMultiCategoryMerchant(name);
  if (multiCat) {
    return multiCat.defaultCategory;
  }

  // Food delivery platforms
  if (
    name.includes("uber eats") ||
    name.includes("doordash") ||
    name.includes("skip")
  ) {
    return "Food Delivery";
  }

  // Ride sharing
  if (
    (name.includes("uber") && !name.includes("eats")) ||
    name.includes("lyft") ||
    name.includes("grab")
  ) {
    return "Transportation";
  }

  // Food courts, hawker centers (Singapore specific)
  if (
    name.includes("kopitiam") ||
    name.includes("hawker") ||
    name.includes("food court") ||
    name.includes("canteen")
  ) {
    return "Fast Food & Takeout";
  }

  // Restaurants and cafes
  if (
    name.includes("restaurant") ||
    name.includes("cafe") ||
    name.includes("coffee") ||
    name.includes("starbucks") ||
    name.includes("tim horton")
  ) {
    return "Dining Out";
  }

  // Fast food chains
  if (
    name.includes("mcdonald") ||
    name.includes("kfc") ||
    name.includes("subway") ||
    name.includes("burger king") ||
    name.includes("wendy")
  ) {
    return "Fast Food & Takeout";
  }

  // Grocery stores and supermarkets
  if (
    name.includes("ntuc") ||
    name.includes("fairprice") ||
    name.includes("cold storage") ||
    name.includes("giant") ||
    name.includes("sheng siong") ||
    name.includes("supermarket") ||
    name.includes("grocery") ||
    name.includes("loblaws") ||
    name.includes("sobeys") ||
    name.includes("metro") ||
    name.includes("pricesmart") ||
    name.includes("price smart")
  ) {
    return "Groceries";
  }

  // Sushi and Japanese restaurants
  if (
    name.includes("sushi") ||
    name.includes("ramen") ||
    name.includes("izakaya") ||
    name.includes("japanese")
  ) {
    return "Dining Out";
  }

  // Cookware and kitchen stores
  if (
    name.includes("cookware") ||
    name.includes("kitchen") ||
    name.includes("williams sonoma") ||
    name.includes("le creuset") ||
    name.includes("made in")
  ) {
    return "Home Essentials";
  }

  // Protein and supplements
  if (
    name.includes("myprotein") ||
    name.includes("protein") ||
    name.includes("gnc") ||
    name.includes("supplement")
  ) {
    return "Gym & Fitness";
  }

  // Streaming services
  if (
    name.includes("netflix") ||
    name.includes("spotify") ||
    name.includes("disney") ||
    name.includes("hulu") ||
    name.includes("apple.com/bill") ||
    name.includes("google storage")
  ) {
    return "Subscriptions & Memberships";
  }

  return null;
}

/**
 * Apply amount-based heuristics to adjust categorization.
 */
export function applyAmountHeuristics(
  amount: number,
  currentCategory: string,
  merchantName: string
): { category: string; confidenceMultiplier: number; reason?: string } {
  const name = merchantName.toLowerCase();

  // Skip amount heuristics for ride-sharing services
  if (name.match(/uber|lyft|grab|gojek|didi/i) && !name.includes("eats")) {
    return { category: currentCategory, confidenceMultiplier: 1.0 };
  }

  // Gas stations: small amounts likely convenience store
  if (name.match(/gas|shell|chevron|esso|petro|exxon|bp\s/i)) {
    if (amount < 20) {
      return {
        category: "Fast Food & Takeout",
        confidenceMultiplier: 0.7,
        reason: "Small gas station purchase - likely convenience store",
      };
    }
    if (amount > 30) {
      return {
        category: "Transportation",
        confidenceMultiplier: 1.1,
        reason: "Amount typical of fuel purchase",
      };
    }
  }

  // Uber Eats: large amounts might be grocery delivery
  if (name.includes("uber eats")) {
    if (amount > 100) {
      return {
        category: "Groceries",
        confidenceMultiplier: 0.6,
        reason: "Large Uber Eats order - might be groceries",
      };
    }
  }

  // Costco: small amounts likely gas
  if (name.includes("costco")) {
    if (amount < 40) {
      return {
        category: "Transportation",
        confidenceMultiplier: 0.8,
        reason: "Small Costco purchase - likely gas",
      };
    }
  }

  return { category: currentCategory, confidenceMultiplier: 1.0 };
}

/**
 * Get the effective category for a transaction.
 * Used for spending analysis and budget tracking.
 * Prefers userCategory, falls back to MCC-derived category.
 */
export function getEffectiveCategory(transaction: Transaction): string {
  // For display/budgets: prefer userCategory
  if (transaction.userCategory) {
    return transaction.userCategory;
  }

  // Fallback to legacy category field
  if (transaction.category && transaction.category !== "Uncategorized") {
    return transaction.category;
  }

  // Try merchant name-based categorization first (more accurate for known merchants)
  const nameCategory = getCategoryFromMerchantName(
    transaction.merchant?.name || ""
  );
  if (nameCategory) {
    return nameCategory;
  }

  // Derive from MCC code
  const mccCode = transaction.mccCode || transaction.merchant?.mcc?.code;
  if (mccCode) {
    return getCategoryFromMCC(mccCode);
  }

  return "Uncategorized";
}

/**
 * Get the MCC-based category for a transaction.
 * Used for rewards calculation - always uses the MCC code, never user overrides.
 */
export function getMccCategory(transaction: Transaction): string {
  const mccCode = transaction.mccCode || transaction.merchant?.mcc?.code;
  if (mccCode) {
    return getCategoryFromMCC(mccCode);
  }
  return "Uncategorized";
}

/**
 * Get full categorization result for a transaction.
 * Combines MCC, merchant name, and amount heuristics.
 */
export function categorizeTransaction(
  transaction: Transaction
): CategoryResult {
  const merchantName = transaction.merchant?.name || "";
  const mccCode = transaction.mccCode || transaction.merchant?.mcc?.code;
  const amount = transaction.amount;

  // Start with MCC-based categorization
  let result = getCategoryResultFromMCC(mccCode);

  // Check for multi-category merchant
  const multiCatMerchant = getMultiCategoryMerchant(merchantName);
  if (multiCatMerchant) {
    result = {
      ...result,
      category: multiCatMerchant.defaultCategory,
      confidence: Math.min(result.confidence, 0.6),
      requiresReview: true,
      isMultiCategory: true,
      suggestedCategories: multiCatMerchant.suggestedCategories,
      reason: `Multi-category merchant: ${multiCatMerchant.name}`,
    };
  }

  // Apply merchant name override if more specific
  const merchantCategory = getCategoryFromMerchantName(merchantName);
  if (merchantCategory && merchantCategory !== result.category) {
    result = {
      ...result,
      category: merchantCategory,
      confidence: Math.max(result.confidence, 0.8),
      reason: `Merchant name match: ${merchantName}`,
    };
  }

  // Apply amount heuristics
  const amountResult = applyAmountHeuristics(
    amount,
    result.category,
    merchantName
  );
  if (amountResult.category !== result.category) {
    result = {
      ...result,
      category: amountResult.category,
      confidence: result.confidence * amountResult.confidenceMultiplier,
      reason: amountResult.reason || result.reason,
    };
  }

  return result;
}
