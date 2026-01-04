// src/core/forecast/constants.ts
import { HolidayConfig } from "./types";

/**
 * Holiday configurations with spending multipliers
 * These are periods where spending typically increases
 */
export const HOLIDAYS: HolidayConfig[] = [
  {
    name: "Christmas Season",
    month: 12,
    startDay: 20,
    endDay: 31,
    multiplier: 1.8,
  },
  {
    name: "Black Friday / Cyber Monday",
    month: 11,
    startDay: 25,
    endDay: 30,
    multiplier: 2.0,
  },
  {
    name: "New Year",
    month: 1,
    startDay: 1,
    endDay: 7,
    multiplier: 1.3,
  },
  {
    name: "Singles Day",
    month: 11,
    startDay: 11,
    endDay: 11,
    multiplier: 1.5,
  },
  {
    name: "Valentine's Day",
    month: 2,
    startDay: 12,
    endDay: 14,
    multiplier: 1.3,
  },
  {
    name: "Back to School",
    month: 8,
    startDay: 15,
    endDay: 31,
    multiplier: 1.4,
  },
  {
    name: "Back to School (Sept)",
    month: 9,
    startDay: 1,
    endDay: 10,
    multiplier: 1.3,
  },
];

/**
 * Known fixed expense merchant patterns (case-insensitive)
 */
export const FIXED_EXPENSE_PATTERNS: string[] = [
  // Rent
  "chexy",
  "rent",
  "landlord",
  "property management",
  // Streaming & Entertainment
  "netflix",
  "spotify",
  "disney",
  "hulu",
  "apple music",
  "youtube premium",
  "amazon prime",
  "hbo",
  "crave",
  // Tech Subscriptions
  "apple.com",
  "google storage",
  "icloud",
  "microsoft 365",
  "dropbox",
  "adobe",
  // Utilities
  "hydro",
  "electricity",
  "gas company",
  "water utility",
  "enbridge",
  "toronto hydro",
  "bc hydro",
  // Insurance
  "insurance",
  "manulife",
  "sun life",
  "great west",
  // Internet & Phone
  "rogers",
  "bell",
  "telus",
  "shaw",
  "freedom mobile",
  "fido",
  "koodo",
  "virgin mobile",
  // Gym & Fitness
  "goodlife",
  "fitness",
  "gym",
  "planet fitness",
  "equinox",
  // Other subscriptions
  "patreon",
  "substack",
  "medium",
  "linkedin premium",
];

/**
 * MCC codes that typically indicate fixed/recurring expenses
 */
export const FIXED_EXPENSE_MCC_CODES: string[] = [
  "4900", // Electric, Gas, Water, Sanitary Utilities
  "4814", // Telecommunication Services
  "4899", // Cable, Satellite, Pay TV/Radio
  "6300", // Insurance Sales, Underwriting
  "7941", // Athletic Fields, Sports Clubs, Promoters
  "4816", // Computer Network/Information Services
  "5968", // Direct Marketing - Continuity/Subscription Merchants
];

/**
 * Thresholds for fixed expense detection
 */
export const FIXED_EXPENSE_THRESHOLDS = {
  /** Maximum coefficient of variation (stddev/mean) for amount consistency */
  AMOUNT_VARIANCE_THRESHOLD: 0.1, // 10%
  /** Maximum day variance for timing consistency */
  DAY_TOLERANCE: 3, // +/- 3 days
  /** Minimum occurrences to classify as fixed */
  MIN_OCCURRENCES: 2,
  /** Minimum confidence score to include in fixed expenses */
  MIN_CONFIDENCE: 0.6,
};

/**
 * Thresholds for spender profile detection
 */
export const PROFILE_THRESHOLDS = {
  /** Minimum transactions needed for profile detection */
  MIN_TRANSACTIONS: 20,
  /** Threshold for front-loader (% in first 10 days) */
  FRONT_LOADER_THRESHOLD: 0.5, // 50%
  /** Threshold for back-loader (% in last 10 days) */
  BACK_LOADER_THRESHOLD: 0.5, // 50%
  /** Maximum variance for "steady" classification */
  STEADY_MAX_VARIANCE: 0.15, // 15% difference between thirds
  /** Spike threshold for payday detection (x times daily average) */
  PAYDAY_SPIKE_MULTIPLIER: 2.5,
};

/**
 * Profile distribution curves (31 days)
 * These represent the relative weight for each day of the month
 */
export const PROFILE_CURVES: Record<string, number[]> = {
  "front-loader": generateExponentialDecay(31, 0.08),
  "back-loader": generateExponentialGrowth(31, 0.08),
  "payday-spiker": generateBimodalCurve(31, [1, 15], 3.0, 1.5),
  steady: Array(31).fill(1),
  variable: Array(31).fill(1),
};

/**
 * Generate exponential decay curve (more weight at start)
 */
function generateExponentialDecay(days: number, rate: number): number[] {
  return Array.from({ length: days }, (_, i) => Math.exp(-i * rate));
}

/**
 * Generate exponential growth curve (more weight at end)
 */
function generateExponentialGrowth(days: number, rate: number): number[] {
  return Array.from({ length: days }, (_, i) =>
    Math.exp((i - days + 1) * rate)
  );
}

/**
 * Generate bimodal curve with peaks on specified days
 */
function generateBimodalCurve(
  days: number,
  peakDays: number[],
  peakMultiplier: number,
  nearPeakMultiplier: number
): number[] {
  return Array.from({ length: days }, (_, i) => {
    const dayOfMonth = i + 1;
    // Check if this is a peak day
    if (peakDays.includes(dayOfMonth)) {
      return peakMultiplier;
    }
    // Check if this is near a peak day (+/- 2 days)
    for (const peak of peakDays) {
      if (Math.abs(dayOfMonth - peak) <= 2) {
        return nearPeakMultiplier;
      }
    }
    return 0.8; // Below average for non-peak days
  });
}

/**
 * Days of week labels
 */
export const DAYS_OF_WEEK = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

/**
 * Default day-of-week spending factors (if no history)
 * Based on typical spending patterns
 */
export const DEFAULT_DAY_OF_WEEK_FACTORS = [
  1.3, // Sunday - higher (shopping, dining out)
  0.85, // Monday - lower
  0.9, // Tuesday - lower
  0.95, // Wednesday - average
  1.0, // Thursday - average
  1.1, // Friday - higher (dining, entertainment)
  1.4, // Saturday - highest (weekend activities)
];

/**
 * Forecast caching configuration
 */
export const CACHE_CONFIG = {
  /** Cache time-to-live in milliseconds */
  TTL_MS: 5 * 60 * 1000, // 5 minutes
  /** Maximum cache entries */
  MAX_ENTRIES: 10,
};

/**
 * Confidence calculation weights
 */
export const CONFIDENCE_WEIGHTS = {
  /** Weight for historical data quantity */
  DATA_QUANTITY: 0.3,
  /** Weight for pattern consistency */
  PATTERN_CONSISTENCY: 0.3,
  /** Weight for fixed expense detection */
  FIXED_EXPENSE_DETECTION: 0.2,
  /** Weight for profile clarity */
  PROFILE_CLARITY: 0.2,
};

/**
 * Confidence thresholds based on data availability
 */
export const DATA_CONFIDENCE_LEVELS = {
  /** No history - lowest confidence */
  NO_HISTORY: 0.2,
  /** Less than 1 month */
  LESS_THAN_ONE_MONTH: 0.4,
  /** 1-2 months */
  ONE_TO_TWO_MONTHS: 0.6,
  /** 2-3 months */
  TWO_TO_THREE_MONTHS: 0.8,
  /** 3+ months - highest confidence */
  THREE_PLUS_MONTHS: 0.95,
};
