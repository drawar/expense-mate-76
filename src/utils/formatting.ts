// src/utils/formatting.ts

/**
 * Formats a number with thousands separators
 * @param value Number to format
 * @returns Formatted string with thousands separators
 */
export const formatNumber = (value: number): string => {
  return value.toLocaleString();
};

/**
 * Formats a percentage value with appropriate sign and decimal places
 * @param value Percentage value to format
 * @param showSign Whether to show + sign for positive values
 * @param decimalPlaces Number of decimal places to show
 * @returns Formatted percentage string
 */
export const formatPercentage = (
  value: number,
  showSign: boolean = false,
  decimalPlaces: number = 1
): string => {
  const formattedValue = value.toFixed(decimalPlaces);
  const prefix = showSign && value > 0 ? "+" : "";
  return `${prefix}${formattedValue}%`;
};

/**
 * Determines if an expense percentage change is positive (bad) or negative (good)
 * For expenses, an increase is bad (positive = true), a decrease is good (positive = false)
 * @param percentageChange Percentage change value
 * @returns Boolean indicating if change is positive (bad for expenses)
 */
export const isExpenseChangePositive = (percentageChange: number): boolean => {
  return percentageChange >= 0;
};

/**
 * Gets the appropriate color class for an expense trend
 * @param percentageChange Percentage change value
 * @returns CSS class for coloring the trend
 */
export const getExpenseTrendColor = (percentageChange: number): string => {
  const isPositive = isExpenseChangePositive(percentageChange);
  return isPositive
    ? "text-red-500 dark:text-red-400"
    : "text-green-500 dark:text-green-400";
};

/**
 * Formats a date string in a consistent way
 * @param dateString ISO date string
 * @returns Formatted date (e.g., "Jan 15, 2023")
 */
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

/**
 * Formats a date string in a short format
 * @param dateString ISO date string
 * @returns Formatted date (e.g., "01/15/23")
 */
export const formatDateShort = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, {
    month: "2-digit",
    day: "2-digit",
    year: "2-digit",
  });
};

/**
 * Formats a date with time
 * @param dateString ISO date string
 * @returns Formatted date with time (e.g., "Jan 15, 2023 2:30 PM")
 */
export const formatDateTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

/**
 * Gets the current date as an ISO string (YYYY-MM-DD)
 * @returns Current date in YYYY-MM-DD format
 */
export const getCurrentDateString = (): string => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};
