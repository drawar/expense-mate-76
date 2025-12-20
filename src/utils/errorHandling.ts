// src/utils/errorHandling.ts

/**
 * Standard error types for the application
 */
export enum ErrorType {
  DATA_FETCH = "data_fetch",
  DATA_PROCESSING = "data_processing",
  USER_INPUT = "user_input",
  NETWORK = "network",
  UNKNOWN = "unknown",
}

/**
 * Custom error class with additional context for better debugging and user feedback
 */
export class AppError extends Error {
  readonly type: ErrorType;
  readonly context?: Record<string, unknown>;
  readonly originalError?: Error;

  constructor(
    message: string,
    type: ErrorType = ErrorType.UNKNOWN,
    context?: Record<string, unknown>,
    originalError?: Error
  ) {
    super(message);
    this.name = "AppError";
    this.type = type;
    this.context = context;
    this.originalError = originalError;

    // Preserve the stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
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
    console.error(`Error in tryCatchWrapper:`, error);

    // Create a standardized error with context
    const appError = new AppError(
      error instanceof Error ? error.message : "Unknown error occurred",
      errorType,
      errorContext,
      error instanceof Error ? error : undefined
    );

    // Log the structured error for debugging
    console.error("Structured error:", {
      type: appError.type,
      message: appError.message,
      context: appError.context,
      originalError: appError.originalError,
    });

    // If a fallback value is provided, return it
    if (fallbackValue !== undefined) {
      return fallbackValue;
    }

    // Otherwise re-throw the error
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
  if (value === null || value === undefined) {
    return defaultValue;
  }

  const parsedValue = Number(value);
  return isNaN(parsedValue) ? defaultValue : parsedValue;
}
