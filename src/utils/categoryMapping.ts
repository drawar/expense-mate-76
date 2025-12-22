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
    defaultCategory: "Transportation",
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
    description: "Commercial Sports, Athletic Fields, Sports Promoters",
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
