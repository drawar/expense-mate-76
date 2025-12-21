import { MerchantCategoryCode, Transaction } from "@/types";

// Map MCC codes to categories
export const getCategoryFromMCC = (mccCode?: string): string => {
  if (!mccCode) return "Uncategorized";

  // Grocery and Food stores
  if (["5411", "5422", "5451", "5462", "5499", "9751"].includes(mccCode)) {
    return "Groceries";
  }

  // Dining & Food
  if (["5811", "5812", "5813", "5814", "5441", "5921"].includes(mccCode)) {
    return "Food & Drinks";
  }

  // Hawker centers and food courts (Singapore specific)
  if (mccCode === "5814") {
    return "Food & Drinks";
  }

  // Travel and Transport
  if (
    ["4121", "4112", "3000", "7011", "4225", "4119"].includes(mccCode) ||
    (mccCode.startsWith("4") && !["4814", "4899"].includes(mccCode))
  ) {
    return "Travel";
  }

  // Utilities & Telecom
  if (["4814", "4899"].includes(mccCode)) {
    return "Utilities";
  }

  // Shopping - General
  // Combining: General Shopping, Electronics, Clothing, Jewelry, Books, Specialty Retail, etc.
  if (
    [
      "5300",
      "5310",
      "5311",
      "5331",
      "5399",
      "5262",
      "5309", // General Shopping
      "5045",
      "5732",
      "5734",
      "5815",
      "5816",
      "5817",
      "5818",
      "7622", // Electronics
      "5137",
      "5139",
      "5611",
      "5621",
      "5631",
      "5641",
      "5651",
      "5655",
      "5661",
      "5681",
      "5691",
      "5697",
      "5698",
      "5699", // Clothing
      "5094",
      "5944",
      "5950",
      "7631", // Jewelry & Luxury
      "5111",
      "5192",
      "5942",
      "5943",
      "5947",
      "5970",
      "5972", // Books & Gifts
      "5193",
      "5945",
      "5946",
      "5948",
      "5949",
      "5963",
      "5964",
      "5971",
      "5973",
      "5992",
      "5995",
      "5997",
      "5999",
      "5931",
      "5932",
      "5933",
      "5937", // Specialty Retail
      "5044",
      "5046",
      "5065",
      "5072",
      "5074",
      "5978", // Business Supplies
    ].includes(mccCode) ||
    mccCode.startsWith("5")
  ) {
    return "Shopping";
  }

  // Entertainment
  if (
    ["7832", "7941", "5733", "5735", "5941", "5993", "5994", "7993"].includes(
      mccCode
    )
  ) {
    return "Entertainment";
  }

  // Health & Personal Care
  if (
    [
      "5912",
      "5977",
      "7230",
      "7298",
      "8011",
      "8021",
      "8031",
      "8041",
      "8042",
      "8043",
      "8049",
      "8050",
      "8062",
      "8071",
      "8099",
      "5122",
      "5975",
      "5976",
    ].includes(mccCode)
  ) {
    return "Health & Personal Care";
  }

  // Services & Repairs
  if (
    [
      "7273",
      "7277",
      "7278",
      "7296",
      "7297",
      "7321",
      "7339",
      "7361",
      "7379",
      "7392", // Services
      "7623",
      "7629", // Repairs & Maintenance
      "8351",
      "8398",
      "8641",
      "8651",
      "8661", // Organizations
    ].includes(mccCode) ||
    (mccCode.startsWith("7") &&
      ![
        "7011",
        "7230",
        "7298",
        "7832",
        "7622",
        "7623",
        "7629",
        "7631",
        "7641",
        "7993",
      ].includes(mccCode))
  ) {
    return "Services";
  }

  // Automotive
  if (["5541", "5940"].includes(mccCode)) {
    return "Automotive";
  }

  // Education
  if (["8211", "8220", "8241", "8244", "8249", "8299"].includes(mccCode)) {
    return "Education";
  }

  // Government Services
  if (["9211", "9222", "9223", "9311", "9399", "9402"].includes(mccCode)) {
    return "Government";
  }

  // Financial Services
  if (["6010", "6011", "6012", "6051", "6211", "6300"].includes(mccCode)) {
    return "Financial Services";
  }

  // For any other MCC code that starts with 5 and is not explicitly categorized
  if (mccCode.startsWith("5")) {
    return "Shopping";
  }

  // For any other MCC code that starts with 5 and is not explicitly categorized
  if (
    [
      "6513",
      "1520",
      "5021",
      "5039",
      "5200",
      "5211",
      "5231",
      "5251",
      "5261",
      "5271",
      "5531",
      "5712",
      "5713",
      "5714",
      "5718",
      "5719",
      "5722",
      "5996",
      "5998",
      "7641",
    ].includes(mccCode)
  ) {
    return "Home & Rent";
  }

  // For any other MCC code that starts with 7 or 8
  if (mccCode.startsWith("7") || mccCode.startsWith("8")) {
    return "Services";
  }

  return "Uncategorized";
};

// Helper function to identify food-related merchants by name for when MCC is unavailable
export const getCategoryFromMerchantName = (
  merchantName: string
): string | null => {
  if (!merchantName) return null;

  const name = merchantName.toLowerCase();

  // Food courts, hawker centers, and common food establishments in Singapore
  if (
    name.includes("kopitiam") ||
    name.includes("hawker") ||
    name.includes("food court") ||
    name.includes("restaurant") ||
    name.includes("cafe") ||
    name.includes("coffee") ||
    name.includes("mcdonald") ||
    name.includes("kfc") ||
    name.includes("starbucks") ||
    name.includes("subway") ||
    name.includes("eatery") ||
    name.includes("kitchen") ||
    name.includes("canteen")
  ) {
    return "Food & Drinks";
  }

  // Grocery stores and supermarkets
  if (
    name.includes("ntuc") ||
    name.includes("fairprice") ||
    name.includes("cold storage") ||
    name.includes("giant") ||
    name.includes("sheng siong") ||
    name.includes("prime") ||
    name.includes("supermarket") ||
    name.includes("grocery")
  ) {
    return "Groceries";
  }

  return null;
};

/**
 * Get the effective category for a transaction.
 * Used for spending analysis and budget tracking.
 * Prefers userCategory, falls back to legacy category, then derives from MCC.
 */
export function getEffectiveCategory(transaction: Transaction): string {
  // For display/budgets: prefer userCategory
  if (transaction.userCategory) {
    return transaction.userCategory;
  }

  // Fallback to legacy behavior
  if (transaction.category && transaction.category !== "Uncategorized") {
    return transaction.category;
  }

  // Derive from MCC code
  const mccCode = transaction.mccCode || transaction.merchant?.mcc?.code;
  if (mccCode) {
    return getCategoryFromMCC(mccCode);
  }

  // Try merchant name-based categorization
  const nameCategory = getCategoryFromMerchantName(
    transaction.merchant?.name || ""
  );
  if (nameCategory) {
    return nameCategory;
  }

  return "Uncategorized";
}

/**
 * Get the MCC-based category for a transaction.
 * Used for rewards calculation - always uses the MCC code, never user overrides.
 */
export function getMccCategory(transaction: Transaction): string {
  // For rewards: always use MCC code
  const mccCode = transaction.mccCode || transaction.merchant?.mcc?.code;
  if (mccCode) {
    return getCategoryFromMCC(mccCode);
  }
  return "Uncategorized";
}
