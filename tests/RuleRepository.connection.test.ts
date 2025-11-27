import { describe, it, expect, beforeAll } from "@jest/globals";
import {
  RuleRepository,
  initializeRuleRepository,
} from "../src/core/rewards/RuleRepository";
import { supabase } from "../src/integrations/supabase/client";

describe("RuleRepository Connection and Authentication", () => {
  let repository: RuleRepository;

  beforeAll(() => {
    repository = initializeRuleRepository(supabase);
  });

  describe("Supabase Client Initialization", () => {
    it("should have Supabase client properly initialized", () => {
      const isInitialized = repository.isSupabaseClientInitialized();
      expect(isInitialized).toBe(true);
    });
  });

  describe("Authentication Verification", () => {
    it("should verify authentication status", async () => {
      const authStatus = await repository.verifyAuthentication();

      expect(authStatus).toHaveProperty("isAuthenticated");
      expect(typeof authStatus.isAuthenticated).toBe("boolean");

      // If authenticated, should have userId
      if (authStatus.isAuthenticated) {
        expect(authStatus.userId).toBeDefined();
        expect(typeof authStatus.userId).toBe("string");
      }

      // Should not have error if authenticated
      if (authStatus.isAuthenticated) {
        expect(authStatus.error).toBeUndefined();
      }
    });
  });

  describe("Database Connection", () => {
    it("should verify database connection with simple query", async () => {
      const connectionStatus = await repository.verifyConnection();

      expect(connectionStatus).toHaveProperty("isConnected");
      expect(typeof connectionStatus.isConnected).toBe("boolean");
      expect(connectionStatus).toHaveProperty("latencyMs");
      expect(typeof connectionStatus.latencyMs).toBe("number");

      // If connected, should not have error
      if (connectionStatus.isConnected) {
        expect(connectionStatus.error).toBeUndefined();
        expect(connectionStatus.latencyMs).toBeGreaterThan(0);
      }
    });

    it("should measure connection latency", async () => {
      const connectionStatus = await repository.verifyConnection();

      if (connectionStatus.isConnected) {
        expect(connectionStatus.latencyMs).toBeDefined();
        expect(connectionStatus.latencyMs).toBeGreaterThan(0);
        // Reasonable latency check (should be less than 10 seconds)
        expect(connectionStatus.latencyMs).toBeLessThan(10000);
      }
    });
  });

  describe("Combined Verification", () => {
    it("should verify all connection aspects", async () => {
      // Check client initialization
      const isInitialized = repository.isSupabaseClientInitialized();
      expect(isInitialized).toBe(true);

      // Check authentication
      const authStatus = await repository.verifyAuthentication();
      expect(authStatus).toBeDefined();

      // Check database connection
      const connectionStatus = await repository.verifyConnection();
      expect(connectionStatus).toBeDefined();

      // Log results for debugging
      console.log("Connection Verification Results:", {
        clientInitialized: isInitialized,
        authentication: authStatus,
        connection: connectionStatus,
      });
    });
  });
});
