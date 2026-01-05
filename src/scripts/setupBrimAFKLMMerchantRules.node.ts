/**
 * Node.js script to add merchant-specific bonus rules for Brim Financial Air France KLM World Elite Mastercard
 *
 * Run with: source .env && PGPASSWORD="$SUPABASE_DB_PASSWORD" npx tsx src/scripts/setupBrimAFKLMMerchantRules.node.ts
 */

import { createClient } from "@supabase/supabase-js";

// Create Supabase client for Node.js
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error(
    "❌ Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY"
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

interface MerchantRule {
  merchants: string[];
  totalMultiplier: number;
  category: string;
  isFlat?: boolean;
}

// Organize merchants by earn rate for easier maintenance
const merchantRules: MerchantRule[] = [
  // 12x merchants (11 bonus + 1 base)
  {
    merchants: ["Martinic Audio", "MARTINIC"],
    totalMultiplier: 12,
    category: "Entertainment",
  },

  // 3.5x merchants (2.5 bonus + 1 base)
  {
    merchants: ["lululemon", "LULULEMON"],
    totalMultiplier: 3.5,
    category: "Shopping & Retail",
  },
  {
    merchants: ["Sephora", "SEPHORA"],
    totalMultiplier: 3.5,
    category: "Shopping & Retail",
  },
  {
    merchants: ["Wayfair", "WAYFAIR"],
    totalMultiplier: 3.5,
    category: "Home & Garden",
  },
  {
    merchants: ["Fanatics", "FANATICS"],
    totalMultiplier: 3.5,
    category: "Shopping & Retail",
  },

  // 3x merchants (2 bonus + 1 base)
  {
    merchants: ["Uber", "UBER", "Uber*", "UBER*"],
    totalMultiplier: 3,
    category: "Travel & Transportation",
  },
  {
    merchants: ["Uber Eats", "UBER EATS", "UberEats", "UBEREATS"],
    totalMultiplier: 3,
    category: "Food & Dining",
  },
  {
    merchants: ["DoorDash", "DOORDASH"],
    totalMultiplier: 3,
    category: "Food & Dining",
  },
  {
    merchants: [
      "Skip The Dishes",
      "SKIP THE DISHES",
      "SkipTheDishes",
      "SKIPTHEDISHES",
    ],
    totalMultiplier: 3,
    category: "Food & Dining",
  },
  {
    merchants: ["Ritual", "RITUAL"],
    totalMultiplier: 3,
    category: "Food & Dining",
  },
  {
    merchants: ["GoodFood", "GOODFOOD", "Good Food"],
    totalMultiplier: 3,
    category: "Food & Dining",
  },
  {
    merchants: ["HelloFresh", "HELLOFRESH", "Hello Fresh"],
    totalMultiplier: 3,
    category: "Food & Dining",
  },
  {
    merchants: ["Chef's Plate", "CHEFS PLATE", "ChefsPlate"],
    totalMultiplier: 3,
    category: "Food & Dining",
  },
  {
    merchants: ["Tim Hortons", "TIM HORTONS", "Tim Horton's"],
    totalMultiplier: 3,
    category: "Food & Dining",
  },
  {
    merchants: ["Starbucks", "STARBUCKS"],
    totalMultiplier: 3,
    category: "Food & Dining",
  },
  {
    merchants: ["Recipe Unlimited", "RECIPE UNLIMITED"],
    totalMultiplier: 3,
    category: "Food & Dining",
  },
  {
    merchants: ["Cineplex", "CINEPLEX"],
    totalMultiplier: 3,
    category: "Entertainment",
  },
  {
    merchants: ["Netflix", "NETFLIX"],
    totalMultiplier: 3,
    category: "Entertainment",
  },
  {
    merchants: [
      "Amazon Prime Video",
      "AMAZON PRIME VIDEO",
      "Prime Video",
      "PRIME VIDEO",
    ],
    totalMultiplier: 3,
    category: "Entertainment",
  },
  {
    merchants: ["Crave", "CRAVE"],
    totalMultiplier: 3,
    category: "Entertainment",
  },
  {
    merchants: ["Paramount+", "PARAMOUNT+", "Paramount Plus", "PARAMOUNT PLUS"],
    totalMultiplier: 3,
    category: "Entertainment",
  },
  {
    merchants: ["hayu", "HAYU"],
    totalMultiplier: 3,
    category: "Entertainment",
  },
  {
    merchants: ["AMC+", "AMC PLUS", "AMCPLUS"],
    totalMultiplier: 3,
    category: "Entertainment",
  },
  {
    merchants: ["Mubi", "MUBI"],
    totalMultiplier: 3,
    category: "Entertainment",
  },
  {
    merchants: ["Shudder", "SHUDDER"],
    totalMultiplier: 3,
    category: "Entertainment",
  },
  {
    merchants: ["Sundance Now", "SUNDANCE NOW"],
    totalMultiplier: 3,
    category: "Entertainment",
  },
  {
    merchants: ["Dazn", "DAZN"],
    totalMultiplier: 3,
    category: "Entertainment",
  },
  {
    merchants: ["Sportsnet", "SPORTSNET"],
    totalMultiplier: 3,
    category: "Entertainment",
  },
  {
    merchants: ["Spotify", "SPOTIFY"],
    totalMultiplier: 3,
    category: "Entertainment",
  },
  {
    merchants: ["YouTube", "YOUTUBE", "YouTube Premium", "YOUTUBE PREMIUM"],
    totalMultiplier: 3,
    category: "Entertainment",
  },
  {
    merchants: ["SiriusXM", "SIRIUSXM", "Sirius XM"],
    totalMultiplier: 3,
    category: "Entertainment",
  },
  {
    merchants: ["Apple Music", "APPLE MUSIC"],
    totalMultiplier: 3,
    category: "Entertainment",
  },
  {
    merchants: ["Amazon Music", "AMAZON MUSIC"],
    totalMultiplier: 3,
    category: "Entertainment",
  },
  {
    merchants: ["iHeartRadio", "IHEARTRADIO", "iHeart Radio"],
    totalMultiplier: 3,
    category: "Entertainment",
  },
  {
    merchants: ["Tidal", "TIDAL"],
    totalMultiplier: 3,
    category: "Entertainment",
  },
  {
    merchants: ["Deezer", "DEEZER"],
    totalMultiplier: 3,
    category: "Entertainment",
  },
  {
    merchants: [
      "Xbox",
      "XBOX",
      "Xbox Game Pass",
      "XBOX GAME PASS",
      "Microsoft Xbox",
    ],
    totalMultiplier: 3,
    category: "Entertainment",
  },
  {
    merchants: [
      "PlayStation",
      "PLAYSTATION",
      "PlayStation Plus",
      "PLAYSTATION PLUS",
      "PSN",
      "Sony PlayStation",
    ],
    totalMultiplier: 3,
    category: "Entertainment",
  },
  {
    merchants: ["Nintendo", "NINTENDO", "Nintendo eShop"],
    totalMultiplier: 3,
    category: "Entertainment",
  },
  {
    merchants: ["Steam", "STEAM", "Valve Steam"],
    totalMultiplier: 3,
    category: "Entertainment",
  },
  {
    merchants: ["Epic Games", "EPIC GAMES"],
    totalMultiplier: 3,
    category: "Entertainment",
  },
  {
    merchants: ["EA Play", "EA PLAY"],
    totalMultiplier: 3,
    category: "Entertainment",
  },
  {
    merchants: ["Ubisoft", "UBISOFT", "Ubisoft+"],
    totalMultiplier: 3,
    category: "Entertainment",
  },
  {
    merchants: ["Adobe", "ADOBE", "Adobe Creative Cloud"],
    totalMultiplier: 3,
    category: "Software & Services",
  },
  {
    merchants: ["Microsoft 365", "MICROSOFT 365", "Office 365", "OFFICE 365"],
    totalMultiplier: 3,
    category: "Software & Services",
  },
  {
    merchants: ["Google One", "GOOGLE ONE"],
    totalMultiplier: 3,
    category: "Software & Services",
  },
  {
    merchants: ["iCloud", "ICLOUD", "Apple iCloud", "iCloud+"],
    totalMultiplier: 3,
    category: "Software & Services",
  },
  {
    merchants: ["Dropbox", "DROPBOX"],
    totalMultiplier: 3,
    category: "Software & Services",
  },
  {
    merchants: ["Canva", "CANVA"],
    totalMultiplier: 3,
    category: "Software & Services",
  },
  {
    merchants: ["Grammarly", "GRAMMARLY"],
    totalMultiplier: 3,
    category: "Software & Services",
  },
  {
    merchants: ["ChatGPT", "CHATGPT", "OpenAI"],
    totalMultiplier: 3,
    category: "Software & Services",
  },
  {
    merchants: ["Slack", "SLACK"],
    totalMultiplier: 3,
    category: "Software & Services",
  },
  {
    merchants: ["Zoom", "ZOOM"],
    totalMultiplier: 3,
    category: "Software & Services",
  },
  {
    merchants: ["Rogers", "ROGERS"],
    totalMultiplier: 3,
    category: "Telecom & Internet",
  },
  {
    merchants: ["Bell", "BELL"],
    totalMultiplier: 3,
    category: "Telecom & Internet",
  },
  {
    merchants: ["Telus", "TELUS"],
    totalMultiplier: 3,
    category: "Telecom & Internet",
  },
  {
    merchants: ["Shaw", "SHAW"],
    totalMultiplier: 3,
    category: "Telecom & Internet",
  },
  {
    merchants: ["Videotron", "VIDEOTRON"],
    totalMultiplier: 3,
    category: "Telecom & Internet",
  },
  {
    merchants: ["Fido", "FIDO"],
    totalMultiplier: 3,
    category: "Telecom & Internet",
  },
  {
    merchants: ["Koodo", "KOODO"],
    totalMultiplier: 3,
    category: "Telecom & Internet",
  },
  {
    merchants: ["Virgin Plus", "VIRGIN PLUS", "Virgin Mobile"],
    totalMultiplier: 3,
    category: "Telecom & Internet",
  },
  {
    merchants: ["Freedom Mobile", "FREEDOM MOBILE"],
    totalMultiplier: 3,
    category: "Telecom & Internet",
  },
  {
    merchants: ["Lucky Mobile", "LUCKY MOBILE"],
    totalMultiplier: 3,
    category: "Telecom & Internet",
  },
  {
    merchants: ["Public Mobile", "PUBLIC MOBILE"],
    totalMultiplier: 3,
    category: "Telecom & Internet",
  },
  {
    merchants: ["Fizz", "FIZZ"],
    totalMultiplier: 3,
    category: "Telecom & Internet",
  },
  {
    merchants: ["Peloton", "PELOTON"],
    totalMultiplier: 3,
    category: "Health & Fitness",
  },
  {
    merchants: ["ClassPass", "CLASSPASS"],
    totalMultiplier: 3,
    category: "Health & Fitness",
  },
  {
    merchants: ["Headspace", "HEADSPACE"],
    totalMultiplier: 3,
    category: "Health & Fitness",
  },
  {
    merchants: ["Calm", "CALM"],
    totalMultiplier: 3,
    category: "Health & Fitness",
  },
  {
    merchants: ["MyFitnessPal", "MYFITNESSPAL"],
    totalMultiplier: 3,
    category: "Health & Fitness",
  },
  {
    merchants: ["Strava", "STRAVA"],
    totalMultiplier: 3,
    category: "Health & Fitness",
  },
  {
    merchants: ["Apple Fitness+", "APPLE FITNESS+", "Apple Fitness Plus"],
    totalMultiplier: 3,
    category: "Health & Fitness",
  },
  {
    merchants: ["Coursera", "COURSERA"],
    totalMultiplier: 3,
    category: "Education",
  },
  {
    merchants: ["Udemy", "UDEMY"],
    totalMultiplier: 3,
    category: "Education",
  },
  {
    merchants: ["Skillshare", "SKILLSHARE"],
    totalMultiplier: 3,
    category: "Education",
  },
  {
    merchants: ["MasterClass", "MASTERCLASS"],
    totalMultiplier: 3,
    category: "Education",
  },
  {
    merchants: ["LinkedIn Learning", "LINKEDIN LEARNING"],
    totalMultiplier: 3,
    category: "Education",
  },
  {
    merchants: ["Duolingo", "DUOLINGO"],
    totalMultiplier: 3,
    category: "Education",
  },
  {
    merchants: ["Brilliant", "BRILLIANT"],
    totalMultiplier: 3,
    category: "Education",
  },
  {
    merchants: ["Scribd", "SCRIBD"],
    totalMultiplier: 3,
    category: "Education",
  },
  {
    merchants: ["Audible", "AUDIBLE"],
    totalMultiplier: 3,
    category: "Education",
  },
  {
    merchants: ["Kindle Unlimited", "KINDLE UNLIMITED"],
    totalMultiplier: 3,
    category: "Education",
  },
  {
    merchants: ["Medium", "MEDIUM"],
    totalMultiplier: 3,
    category: "Education",
  },
  {
    merchants: ["The New York Times", "NEW YORK TIMES", "NYT", "NYTIMES"],
    totalMultiplier: 3,
    category: "News & Media",
  },
  {
    merchants: ["The Washington Post", "WASHINGTON POST", "WAPO"],
    totalMultiplier: 3,
    category: "News & Media",
  },
  {
    merchants: ["The Globe and Mail", "GLOBE AND MAIL"],
    totalMultiplier: 3,
    category: "News & Media",
  },
  {
    merchants: ["The Athletic", "THE ATHLETIC", "THEATRICAL"],
    totalMultiplier: 3,
    category: "News & Media",
  },
  {
    merchants: ["Substack", "SUBSTACK"],
    totalMultiplier: 3,
    category: "News & Media",
  },
  {
    merchants: ["Patreon", "PATREON"],
    totalMultiplier: 3,
    category: "Entertainment",
  },
  {
    merchants: ["Twitch", "TWITCH"],
    totalMultiplier: 3,
    category: "Entertainment",
  },
  {
    merchants: ["Onlyfans", "ONLYFANS"],
    totalMultiplier: 3,
    category: "Entertainment",
  },
  {
    merchants: ["Tinder", "TINDER"],
    totalMultiplier: 3,
    category: "Social & Dating",
  },
  {
    merchants: ["Bumble", "BUMBLE"],
    totalMultiplier: 3,
    category: "Social & Dating",
  },
  {
    merchants: ["Hinge", "HINGE"],
    totalMultiplier: 3,
    category: "Social & Dating",
  },
  {
    merchants: ["Match", "MATCH", "Match.com"],
    totalMultiplier: 3,
    category: "Social & Dating",
  },
  {
    merchants: ["eHarmony", "EHARMONY"],
    totalMultiplier: 3,
    category: "Social & Dating",
  },
  {
    merchants: ["NordVPN", "NORDVPN"],
    totalMultiplier: 3,
    category: "Software & Services",
  },
  {
    merchants: ["ExpressVPN", "EXPRESSVPN"],
    totalMultiplier: 3,
    category: "Software & Services",
  },
  {
    merchants: ["Surfshark", "SURFSHARK"],
    totalMultiplier: 3,
    category: "Software & Services",
  },
  {
    merchants: ["1Password", "1PASSWORD"],
    totalMultiplier: 3,
    category: "Software & Services",
  },
  {
    merchants: ["LastPass", "LASTPASS"],
    totalMultiplier: 3,
    category: "Software & Services",
  },
  {
    merchants: ["Dashlane", "DASHLANE"],
    totalMultiplier: 3,
    category: "Software & Services",
  },

  // 2x merchants (1 bonus + 1 base)
  {
    merchants: ["Amazon.ca", "AMAZON.CA", "Amazon Canada", "AMAZON CANADA"],
    totalMultiplier: 2,
    category: "Shopping & Retail",
  },
  {
    merchants: ["eBay", "EBAY"],
    totalMultiplier: 2,
    category: "Shopping & Retail",
  },
  {
    merchants: ["Etsy", "ETSY"],
    totalMultiplier: 2,
    category: "Shopping & Retail",
  },
  {
    merchants: ["SSENSE", "SSENSE.COM"],
    totalMultiplier: 2,
    category: "Shopping & Retail",
  },
  {
    merchants: ["Farfetch", "FARFETCH"],
    totalMultiplier: 2,
    category: "Shopping & Retail",
  },
  {
    merchants: ["ASOS", "ASOS.COM"],
    totalMultiplier: 2,
    category: "Shopping & Retail",
  },
  {
    merchants: ["Nordstrom", "NORDSTROM"],
    totalMultiplier: 2,
    category: "Shopping & Retail",
  },
  {
    merchants: ["Hudson's Bay", "HUDSONS BAY", "THE BAY", "HBC"],
    totalMultiplier: 2,
    category: "Shopping & Retail",
  },
  {
    merchants: ["Sport Chek", "SPORT CHEK", "SPORTCHEK"],
    totalMultiplier: 2,
    category: "Shopping & Retail",
  },
  {
    merchants: ["Atmosphere", "ATMOSPHERE"],
    totalMultiplier: 2,
    category: "Shopping & Retail",
  },
  {
    merchants: ["Best Buy", "BEST BUY", "BESTBUY"],
    totalMultiplier: 2,
    category: "Shopping & Retail",
  },
  {
    merchants: ["The Source", "THE SOURCE"],
    totalMultiplier: 2,
    category: "Shopping & Retail",
  },
  {
    merchants: ["IKEA", "IKEA.CA"],
    totalMultiplier: 2,
    category: "Home & Garden",
  },
  {
    merchants: ["Canadian Tire", "CANADIAN TIRE"],
    totalMultiplier: 2,
    category: "Home & Garden",
  },
  {
    merchants: ["Home Depot", "HOME DEPOT"],
    totalMultiplier: 2,
    category: "Home & Garden",
  },
  {
    merchants: ["Lowe's", "LOWES", "LOWE'S"],
    totalMultiplier: 2,
    category: "Home & Garden",
  },
  {
    merchants: ["Rona", "RONA"],
    totalMultiplier: 2,
    category: "Home & Garden",
  },
  {
    merchants: ["Structube", "STRUCTUBE"],
    totalMultiplier: 2,
    category: "Home & Garden",
  },
  {
    merchants: ["EQ3", "EQ 3"],
    totalMultiplier: 2,
    category: "Home & Garden",
  },
  {
    merchants: ["Article", "ARTICLE"],
    totalMultiplier: 2,
    category: "Home & Garden",
  },
  {
    merchants: ["Casper", "CASPER"],
    totalMultiplier: 2,
    category: "Home & Garden",
  },
  {
    merchants: ["Endy", "ENDY"],
    totalMultiplier: 2,
    category: "Home & Garden",
  },
  {
    merchants: ["WestJet", "WESTJET"],
    totalMultiplier: 2,
    category: "Travel & Transportation",
  },
  {
    merchants: ["Air Canada", "AIR CANADA"],
    totalMultiplier: 2,
    category: "Travel & Transportation",
  },
  {
    merchants: ["Porter Airlines", "PORTER AIRLINES", "PORTER"],
    totalMultiplier: 2,
    category: "Travel & Transportation",
  },
  {
    merchants: ["Flair Airlines", "FLAIR AIRLINES", "FLAIR"],
    totalMultiplier: 2,
    category: "Travel & Transportation",
  },
  {
    merchants: ["Expedia", "EXPEDIA"],
    totalMultiplier: 2,
    category: "Travel & Transportation",
  },
  {
    merchants: ["Booking.com", "BOOKING.COM", "BOOKING"],
    totalMultiplier: 2,
    category: "Travel & Transportation",
  },
  {
    merchants: ["Airbnb", "AIRBNB"],
    totalMultiplier: 2,
    category: "Travel & Transportation",
  },
  {
    merchants: ["Hotels.com", "HOTELS.COM"],
    totalMultiplier: 2,
    category: "Travel & Transportation",
  },
  {
    merchants: ["Marriott", "MARRIOTT"],
    totalMultiplier: 2,
    category: "Travel & Transportation",
  },
  {
    merchants: ["Hilton", "HILTON"],
    totalMultiplier: 2,
    category: "Travel & Transportation",
  },
  {
    merchants: ["IHG", "IHG Hotels"],
    totalMultiplier: 2,
    category: "Travel & Transportation",
  },
  {
    merchants: ["Lyft", "LYFT"],
    totalMultiplier: 2,
    category: "Travel & Transportation",
  },
  {
    merchants: ["Via Rail", "VIA RAIL", "VIA"],
    totalMultiplier: 2,
    category: "Travel & Transportation",
  },
  {
    merchants: ["Enterprise", "ENTERPRISE", "Enterprise Rent-A-Car"],
    totalMultiplier: 2,
    category: "Travel & Transportation",
  },
  {
    merchants: ["Hertz", "HERTZ"],
    totalMultiplier: 2,
    category: "Travel & Transportation",
  },
  {
    merchants: ["Avis", "AVIS"],
    totalMultiplier: 2,
    category: "Travel & Transportation",
  },
  {
    merchants: ["Budget", "BUDGET"],
    totalMultiplier: 2,
    category: "Travel & Transportation",
  },
  {
    merchants: ["Turo", "TURO"],
    totalMultiplier: 2,
    category: "Travel & Transportation",
  },

  // 1.5x merchants (0.5 bonus + 1 base)
  {
    merchants: ["Apple.com", "APPLE.COM", "Apple Store", "APPLE STORE"],
    totalMultiplier: 1.5,
    category: "Shopping & Retail",
  },
  {
    merchants: ["Google Store", "GOOGLE STORE"],
    totalMultiplier: 1.5,
    category: "Shopping & Retail",
  },
  {
    merchants: ["Samsung", "SAMSUNG", "Samsung.com"],
    totalMultiplier: 1.5,
    category: "Shopping & Retail",
  },
  {
    merchants: ["Costco", "COSTCO"],
    totalMultiplier: 1.5,
    category: "Shopping & Retail",
  },
  {
    merchants: ["Walmart", "WALMART"],
    totalMultiplier: 1.5,
    category: "Shopping & Retail",
  },
  {
    merchants: ["Superstore", "SUPERSTORE", "Real Canadian Superstore"],
    totalMultiplier: 1.5,
    category: "Grocery",
  },
  {
    merchants: ["Loblaws", "LOBLAWS"],
    totalMultiplier: 1.5,
    category: "Grocery",
  },
  {
    merchants: ["Metro", "METRO"],
    totalMultiplier: 1.5,
    category: "Grocery",
  },
  {
    merchants: ["Sobeys", "SOBEYS"],
    totalMultiplier: 1.5,
    category: "Grocery",
  },
  {
    merchants: ["Safeway", "SAFEWAY"],
    totalMultiplier: 1.5,
    category: "Grocery",
  },
  {
    merchants: ["FreshCo", "FRESHCO"],
    totalMultiplier: 1.5,
    category: "Grocery",
  },
  {
    merchants: ["No Frills", "NO FRILLS", "NOFRILLS"],
    totalMultiplier: 1.5,
    category: "Grocery",
  },
  {
    merchants: ["Food Basics", "FOOD BASICS"],
    totalMultiplier: 1.5,
    category: "Grocery",
  },
  {
    merchants: ["Instacart", "INSTACART"],
    totalMultiplier: 1.5,
    category: "Grocery",
  },
  {
    merchants: ["Shoppers Drug Mart", "SHOPPERS DRUG MART", "SDM"],
    totalMultiplier: 1.5,
    category: "Health & Pharmacy",
  },
  {
    merchants: ["Rexall", "REXALL"],
    totalMultiplier: 1.5,
    category: "Health & Pharmacy",
  },
  {
    merchants: ["London Drugs", "LONDON DRUGS"],
    totalMultiplier: 1.5,
    category: "Health & Pharmacy",
  },
  {
    merchants: ["Indigo", "INDIGO", "Chapters", "CHAPTERS"],
    totalMultiplier: 1.5,
    category: "Shopping & Retail",
  },
  {
    merchants: ["Winners", "WINNERS"],
    totalMultiplier: 1.5,
    category: "Shopping & Retail",
  },
  {
    merchants: ["HomeSense", "HOMESENSE"],
    totalMultiplier: 1.5,
    category: "Home & Garden",
  },
  {
    merchants: ["Marshalls", "MARSHALLS"],
    totalMultiplier: 1.5,
    category: "Shopping & Retail",
  },
  {
    merchants: ["Old Navy", "OLD NAVY"],
    totalMultiplier: 1.5,
    category: "Shopping & Retail",
  },
  {
    merchants: ["Gap", "GAP"],
    totalMultiplier: 1.5,
    category: "Shopping & Retail",
  },
  {
    merchants: ["Banana Republic", "BANANA REPUBLIC"],
    totalMultiplier: 1.5,
    category: "Shopping & Retail",
  },
  {
    merchants: ["H&M", "H AND M", "HM"],
    totalMultiplier: 1.5,
    category: "Shopping & Retail",
  },
  {
    merchants: ["Zara", "ZARA"],
    totalMultiplier: 1.5,
    category: "Shopping & Retail",
  },
  {
    merchants: ["Uniqlo", "UNIQLO"],
    totalMultiplier: 1.5,
    category: "Shopping & Retail",
  },
  {
    merchants: ["Nike", "NIKE", "Nike.com"],
    totalMultiplier: 1.5,
    category: "Shopping & Retail",
  },
  {
    merchants: ["Adidas", "ADIDAS", "Adidas.ca"],
    totalMultiplier: 1.5,
    category: "Shopping & Retail",
  },
  {
    merchants: ["Under Armour", "UNDER ARMOUR", "UNDERARMOUR"],
    totalMultiplier: 1.5,
    category: "Shopping & Retail",
  },
  {
    merchants: [
      "MEC",
      "MOUNTAIN EQUIPMENT COMPANY",
      "Mountain Equipment Co-op",
    ],
    totalMultiplier: 1.5,
    category: "Shopping & Retail",
  },
  {
    merchants: ["LCBO", "L.C.B.O."],
    totalMultiplier: 1.5,
    category: "Shopping & Retail",
  },
  {
    merchants: ["SAQ", "S.A.Q."],
    totalMultiplier: 1.5,
    category: "Shopping & Retail",
  },
  {
    merchants: ["BC Liquor", "BC LIQUOR", "BC Liquor Store"],
    totalMultiplier: 1.5,
    category: "Shopping & Retail",
  },
  {
    merchants: ["Petro-Canada", "PETRO-CANADA", "PETRO CANADA"],
    totalMultiplier: 1.5,
    category: "Gas & Fuel",
  },
  {
    merchants: ["Shell", "SHELL"],
    totalMultiplier: 1.5,
    category: "Gas & Fuel",
  },
  {
    merchants: ["Esso", "ESSO"],
    totalMultiplier: 1.5,
    category: "Gas & Fuel",
  },
  {
    merchants: ["Pioneer", "PIONEER"],
    totalMultiplier: 1.5,
    category: "Gas & Fuel",
  },
  {
    merchants: ["Husky", "HUSKY"],
    totalMultiplier: 1.5,
    category: "Gas & Fuel",
  },
  {
    merchants: ["7-Eleven", "7-ELEVEN", "7 ELEVEN", "SEVEN ELEVEN"],
    totalMultiplier: 1.5,
    category: "Convenience",
  },
  {
    merchants: ["Circle K", "CIRCLE K", "CIRCLEK"],
    totalMultiplier: 1.5,
    category: "Convenience",
  },
];

// Generate card type ID (same logic as CardTypeIdService)
function generateCardTypeId(issuer: string, cardName: string): string {
  const combined = `${issuer}-${cardName}`;
  return combined
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

async function setupBrimAFKLMMerchantRules() {
  console.log(
    "=== Setting Up Brim Financial Air France KLM Merchant-Specific Rules ===\n"
  );

  const cardTypeId = generateCardTypeId(
    "Brim Financial",
    "Air France KLM World Elite"
  );
  console.log("Card Type ID:", cardTypeId, "\n");

  // Get existing rules to determine starting priority
  const { data: existingRules, error: fetchError } = await supabase
    .from("reward_rules")
    .select("id, priority, name")
    .eq("card_type_id", cardTypeId)
    .order("priority", { ascending: false });

  if (fetchError) {
    console.error("❌ Failed to fetch existing rules:", fetchError);
    return;
  }

  const maxExistingPriority = existingRules?.[0]?.priority || 6;
  console.log(`Existing rules count: ${existingRules?.length || 0}`);
  console.log(`Max existing priority: ${maxExistingPriority}`);
  console.log(`Starting new rules at priority: ${maxExistingPriority + 1}\n`);

  let currentPriority = maxExistingPriority + 1;
  let rulesCreated = 0;
  let rulesFailed = 0;

  // Group by multiplier for logging
  const groupedByMultiplier = new Map<number, MerchantRule[]>();
  for (const rule of merchantRules) {
    const mult = rule.totalMultiplier;
    if (!groupedByMultiplier.has(mult)) {
      groupedByMultiplier.set(mult, []);
    }
    groupedByMultiplier.get(mult)!.push(rule);
  }

  // Sort by multiplier descending (higher earn rates = higher priority)
  const sortedMultipliers = Array.from(groupedByMultiplier.keys()).sort(
    (a, b) => b - a
  );

  for (const multiplier of sortedMultipliers) {
    const rules = groupedByMultiplier.get(multiplier)!;
    console.log(
      `\n--- Creating ${rules.length} rules for ${multiplier}x earn rate ---\n`
    );

    for (const merchantRule of rules) {
      const merchantName = merchantRule.merchants[0];
      const bonusMultiplier = merchantRule.totalMultiplier - 1;

      const ruleData = {
        card_type_id: cardTypeId,
        name: merchantRule.isFlat
          ? `${merchantName} - ${merchantRule.totalMultiplier} Flying Blue Miles (flat, Online)`
          : `${merchantRule.totalMultiplier}x Flying Blue Miles at ${merchantName} (Online)`,
        description: merchantRule.isFlat
          ? `Earn ${merchantRule.totalMultiplier} Flying Blue Miles per transaction at ${merchantName} - online purchases only`
          : `Earn ${merchantRule.totalMultiplier} Flying Blue Miles per $1 at ${merchantName} - online purchases only (${merchantRule.category})`,
        enabled: true,
        priority: currentPriority++,
        conditions: JSON.stringify([
          {
            type: "merchant",
            operation: "include",
            values: merchantRule.merchants,
          },
          {
            type: "transaction_type",
            operation: "include",
            values: ["online"],
          },
        ]),
        calculation_method: merchantRule.isFlat ? "flat_rate" : "standard",
        base_multiplier: merchantRule.isFlat ? merchantRule.totalMultiplier : 1,
        bonus_multiplier: merchantRule.isFlat ? 0 : bonusMultiplier,
        points_rounding_strategy: "floor",
        amount_rounding_strategy: "none",
        block_size: 1,
        monthly_cap: null,
        bonus_tiers: JSON.stringify([]),
      };

      const { error } = await supabase.from("reward_rules").insert(ruleData);

      if (error) {
        console.error(
          `  ❌ Failed to create rule for ${merchantName}:`,
          error.message
        );
        rulesFailed++;
      } else {
        console.log(
          `  ✅ ${merchantName}: ${merchantRule.totalMultiplier}x${merchantRule.isFlat ? " (flat)" : ""}`
        );
        rulesCreated++;
      }
    }
  }

  console.log("\n=== Setup Complete ===\n");
  console.log(`✅ Created ${rulesCreated} merchant-specific rules`);
  if (rulesFailed > 0) {
    console.log(`❌ Failed to create ${rulesFailed} rules`);
  }

  console.log("\nSummary by earn rate:");
  for (const [mult, rules] of groupedByMultiplier) {
    console.log(`  ${mult}x: ${rules.length} merchants`);
  }

  console.log("\nNotes:");
  console.log("1. These rules apply to purchases at listed merchants");
  console.log("2. Disney+ earns 150 flat points per transaction");
  console.log(
    "3. Rules have higher priority than base/restaurant/AF-KLM rules"
  );
}

// Run the setup
setupBrimAFKLMMerchantRules().catch(console.error);
