/**
 * Custom error classes for repository operations
 * These provide specific error types for different failure scenarios
 * to enable better error handling and user feedback.
 */

/**
 * Base error class for repository operations
 * All repository-specific errors extend from this class
 */
export class RepositoryError extends Error {
  /**
   * The operation that was being performed when the error occurred
   */
  public readonly operation: string;

  /**
   * The underlying error that caused this error, if any
   */
  public readonly cause?: Error;

  constructor(message: string, operation: string, cause?: Error) {
    super(message);
    this.name = "RepositoryError";
    this.operation = operation;
    this.cause = cause;

    // Preserve the stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, RepositoryError);
    }
  }
}

/**
 * Error thrown when a user is not authenticated
 * This indicates that the operation requires authentication
 * but the user is not logged in or their session has expired
 */
export class AuthenticationError extends RepositoryError {
  constructor(operation: string, cause?: Error) {
    super("User is not authenticated", operation, cause);
    this.name = "AuthenticationError";
  }
}

/**
 * Error thrown when validation fails
 * This indicates that the data provided does not meet
 * the required validation criteria
 */
export class ValidationError extends RepositoryError {
  /**
   * The field that failed validation
   */
  public readonly field: string;

  constructor(message: string, field: string, operation: string) {
    super(message, operation);
    this.name = "ValidationError";
    this.field = field;
  }
}

/**
 * Error thrown when a persistence operation fails
 * This indicates that the data could not be saved to
 * or retrieved from the database
 */
export class PersistenceError extends RepositoryError {
  /**
   * The data that was being persisted when the error occurred
   */
  public readonly data?: unknown;

  constructor(
    message: string,
    operation: string,
    data?: unknown,
    cause?: Error
  ) {
    super(message, operation, cause);
    this.name = "PersistenceError";
    this.data = data;
  }
}
