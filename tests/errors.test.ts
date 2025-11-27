/**
 * Tests for custom error classes
 * Verifies that error classes are properly constructed and contain expected properties
 */

import {
  RepositoryError,
  AuthenticationError,
  ValidationError,
  PersistenceError,
} from "../src/core/rewards/errors";

describe("Custom Error Classes", () => {
  describe("RepositoryError", () => {
    it("should create a RepositoryError with message and operation", () => {
      const error = new RepositoryError("Test error", "testOperation");

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(RepositoryError);
      expect(error.message).toBe("Test error");
      expect(error.operation).toBe("testOperation");
      expect(error.name).toBe("RepositoryError");
      expect(error.cause).toBeUndefined();
    });

    it("should create a RepositoryError with a cause", () => {
      const originalError = new Error("Original error");
      const error = new RepositoryError(
        "Test error",
        "testOperation",
        originalError
      );

      expect(error.cause).toBe(originalError);
    });
  });

  describe("AuthenticationError", () => {
    it("should create an AuthenticationError with default message", () => {
      const error = new AuthenticationError("loginOperation");

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(RepositoryError);
      expect(error).toBeInstanceOf(AuthenticationError);
      expect(error.message).toBe("User is not authenticated");
      expect(error.operation).toBe("loginOperation");
      expect(error.name).toBe("AuthenticationError");
    });

    it("should create an AuthenticationError with a cause", () => {
      const originalError = new Error("Session expired");
      const error = new AuthenticationError("loginOperation", originalError);

      expect(error.cause).toBe(originalError);
    });
  });

  describe("ValidationError", () => {
    it("should create a ValidationError with field information", () => {
      const error = new ValidationError(
        "Field is required",
        "email",
        "createUser"
      );

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(RepositoryError);
      expect(error).toBeInstanceOf(ValidationError);
      expect(error.message).toBe("Field is required");
      expect(error.field).toBe("email");
      expect(error.operation).toBe("createUser");
      expect(error.name).toBe("ValidationError");
    });
  });

  describe("PersistenceError", () => {
    it("should create a PersistenceError without data", () => {
      const error = new PersistenceError("Failed to save", "saveRecord");

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(RepositoryError);
      expect(error).toBeInstanceOf(PersistenceError);
      expect(error.message).toBe("Failed to save");
      expect(error.operation).toBe("saveRecord");
      expect(error.name).toBe("PersistenceError");
      expect(error.data).toBeUndefined();
    });

    it("should create a PersistenceError with data", () => {
      const testData = { id: "123", name: "Test" };
      const error = new PersistenceError(
        "Failed to save",
        "saveRecord",
        testData
      );

      expect(error.data).toBe(testData);
    });

    it("should create a PersistenceError with data and cause", () => {
      const testData = { id: "123", name: "Test" };
      const originalError = new Error("Database connection failed");
      const error = new PersistenceError(
        "Failed to save",
        "saveRecord",
        testData,
        originalError
      );

      expect(error.data).toBe(testData);
      expect(error.cause).toBe(originalError);
    });
  });

  describe("Error inheritance", () => {
    it("should allow catching specific error types", () => {
      const error = new ValidationError("Invalid input", "name", "createUser");

      try {
        throw error;
      } catch (e) {
        expect(e).toBeInstanceOf(ValidationError);
        expect(e).toBeInstanceOf(RepositoryError);
        expect(e).toBeInstanceOf(Error);
      }
    });

    it("should allow catching base RepositoryError", () => {
      const errors = [
        new AuthenticationError("login"),
        new ValidationError("Invalid", "field", "op"),
        new PersistenceError("Failed", "save"),
      ];

      errors.forEach((error) => {
        expect(error).toBeInstanceOf(RepositoryError);
      });
    });
  });

  describe("Error stack traces", () => {
    it("should preserve stack traces for debugging", () => {
      const error = new RepositoryError("Test error", "testOp");
      expect(error.stack).toBeDefined();
      expect(error.stack).toContain("RepositoryError");
    });

    it("should preserve stack traces for derived errors", () => {
      const authError = new AuthenticationError("login");
      expect(authError.stack).toBeDefined();

      const validationError = new ValidationError("Invalid", "field", "op");
      expect(validationError.stack).toBeDefined();

      const persistenceError = new PersistenceError("Failed", "save");
      expect(persistenceError.stack).toBeDefined();
    });
  });
});
