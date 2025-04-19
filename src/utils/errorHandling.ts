// src/utils/errorHandling.ts

/**
 * Standard error types for the application
 */
export enum ErrorType {
  DATA_FETCH = "data_fetch",
  DATA_PROCESSING = "data_processing",
  USER_INPUT = "user_input",
  NETWORK = "network",
  STORAGE = "storage",
  VALIDATION = "validation",
  UNKNOWN = "unknown",
}

/**
 * Custom error class with additional context for better debugging and user feedback
 */
export class AppError extends Error {
  public readonly errorType: ErrorType;
  public readonly context?: Record<string, unknown>;
  public readonly timestamp: Date;
  public readonly originalError?: Error;

  constructor(
    message: string,
    errorType: ErrorType = ErrorType.UNKNOWN,
    context?: Record<string, unknown>,
    originalError?: Error
  ) {
    super(message);
    this.name = "AppError";
    this.errorType = errorType;
    this.context = context;
    this.timestamp = new Date();
    this.originalError = originalError;

    // This is needed for instanceof to work correctly with custom errors
    Object.setPrototypeOf(this, AppError.prototype);
  }

  /**
   * Convert error to a user-friendly message
   */
  public toUserMessage(): string {
    switch (this.errorType) {
      case ErrorType.DATA_FETCH:
        return "Unable to load data. Please try again later.";
      case ErrorType.NETWORK:
        return "Network error. Please check your connection.";
      case ErrorType.USER_INPUT:
        return this.message; // Use the specific error message for user input errors
      case ErrorType.STORAGE:
        return "Unable to save data. Please try again later.";
      case ErrorType.VALIDATION:
        return this.message; // Use the specific validation message
      default:
        return "An unexpected error occurred. Please try again.";
    }
  }

  /**
   * Create a structured representation of the error for logging
   */
  public toLogFormat(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      errorType: this.errorType,
      context: this.context,
      timestamp: this.timestamp.toISOString(),
      stack: this.stack,
      originalError: this.originalError
        ? {
            name: this.originalError.name,
            message: this.originalError.message,
            stack: this.originalError.stack,
          }
        : undefined,
    };
  }
}

/**
 * Helper function to safely execute a function and handle errors
 * Provides consistent error handling throughout the application
 */
export async function tryCatchWrapper<T>(
  fn: () => Promise<T>,
  errorType: ErrorType,
  errorContext?: Record<string, unknown>,
  fallbackValue?: T
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    // Convert to AppError for consistent handling
    const appError =
      error instanceof AppError
        ? error
        : new AppError(
            error instanceof Error ? error.message : "Unknown error",
            errorType,
            errorContext,
            error instanceof Error ? error : undefined
          );

    // Log the error
    console.error("Error caught in tryCatchWrapper:", appError.toLogFormat());

    // If a fallback is provided, return it
    if (fallbackValue !== undefined) {
      return fallbackValue;
    }

    // Otherwise, rethrow the enhanced error
    throw appError;
  }
}

/**
 * A synchronous version of tryCatchWrapper for non-async operations
 */
export function tryCatchWrapperSync<T>(
  fn: () => T,
  errorType: ErrorType,
  errorContext?: Record<string, unknown>,
  fallbackValue?: T
): T {
  try {
    return fn();
  } catch (error) {
    // Convert to AppError for consistent handling
    const appError =
      error instanceof AppError
        ? error
        : new AppError(
            error instanceof Error ? error.message : "Unknown error",
            errorType,
            errorContext,
            error instanceof Error ? error : undefined
          );

    // Log the error
    console.error(
      "Error caught in tryCatchWrapperSync:",
      appError.toLogFormat()
    );

    // If a fallback is provided, return it
    if (fallbackValue !== undefined) {
      return fallbackValue;
    }

    // Otherwise, rethrow the enhanced error
    throw appError;
  }
}

/**
 * Safely access nested properties without throwing
 * Useful for handling potentially undefined data
 */
export function safelyAccessProperty<T, K extends keyof T>(
  obj: T | null | undefined,
  key: K,
  defaultValue: T[K]
): T[K] {
  if (obj == null) {
    return defaultValue;
  }
  return obj[key] !== undefined ? obj[key] : defaultValue;
}

/**
 * Safely parse JSON without throwing exceptions
 */
export function safelyParseJSON<T>(jsonString: string, defaultValue: T): T {
  try {
    return JSON.parse(jsonString) as T;
  } catch (error) {
    console.error("Error parsing JSON:", error);
    return defaultValue;
  }
}

/**
 * Safely convert values to numbers
 */
export function safelyParseNumber(
  value: unknown,
  defaultValue: number = 0
): number {
  // Handle null or undefined
  if (value === null || value === undefined) {
    return defaultValue;
  }

  // Handle existing numbers
  if (typeof value === "number" && !isNaN(value)) {
    return value;
  }

  // Convert strings/other types to numbers
  const parsedValue = Number(value);
  return isNaN(parsedValue) ? defaultValue : parsedValue;
}

/**
 * Assert that a value is not null or undefined
 * Useful for runtime type checking
 */
export function assertIsDefined<T>(
  value: T,
  message?: string
): asserts value is NonNullable<T> {
  if (value === null || value === undefined) {
    throw new AppError(
      message || "Value is null or undefined",
      ErrorType.VALIDATION
    );
  }
}

/**
 * Check if a value is a valid date
 */
export function isValidDate(date: unknown): boolean {
  if (date === null || date === undefined) {
    return false;
  }

  // Convert to Date object if it's a string or timestamp
  const dateObj =
    typeof date === "string" || typeof date === "number"
      ? new Date(date)
      : date;

  // Check if it's a valid Date object
  return dateObj instanceof Date && !isNaN(dateObj.getTime());
}

/**
 * Validate a list of conditions and return the first error message, if any
 */
export function validateConditions(
  conditions: Array<[boolean, string]>
): string | null {
  for (const [condition, errorMessage] of conditions) {
    if (!condition) {
      return errorMessage;
    }
  }
  return null;
}

/**
 * Format an error for display to the user
 */
export function formatErrorForUser(error: unknown): string {
  if (error instanceof AppError) {
    return error.toUserMessage();
  } else if (error instanceof Error) {
    return error.message;
  } else if (typeof error === "string") {
    return error;
  } else {
    return "An unexpected error occurred";
  }
}
