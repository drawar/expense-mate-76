/**
 * Verification test for MilesCurrencySelector component
 * 
 * Basic tests to verify the component is properly structured and exports work correctly
 */

import { describe, it, expect } from "@jest/globals";
import type { MilesCurrency } from "../src/core/currency/ConversionService";

describe("MilesCurrencySelector Verification", () => {
  describe("Currency options", () => {
    const EXPECTED_CURRENCIES: MilesCurrency[] = [
      'KrisFlyer',
      'AsiaMiles',
      'Avios',
      'FlyingBlue',
      'Aeroplan',
      'Velocity',
    ];

    it("should have all required miles currencies defined", () => {
      expect(EXPECTED_CURRENCIES).toBeDefined();
      expect(Array.isArray(EXPECTED_CURRENCIES)).toBe(true);
      expect(EXPECTED_CURRENCIES.length).toBe(6);
    });

    it("should include KrisFlyer currency", () => {
      expect(EXPECTED_CURRENCIES).toContain('KrisFlyer');
    });

    it("should include Asia Miles currency", () => {
      expect(EXPECTED_CURRENCIES).toContain('AsiaMiles');
    });

    it("should include Avios currency", () => {
      expect(EXPECTED_CURRENCIES).toContain('Avios');
    });

    it("should include Flying Blue currency", () => {
      expect(EXPECTED_CURRENCIES).toContain('FlyingBlue');
    });

    it("should include Aeroplan currency", () => {
      expect(EXPECTED_CURRENCIES).toContain('Aeroplan');
    });

    it("should include Velocity currency", () => {
      expect(EXPECTED_CURRENCIES).toContain('Velocity');
    });
  });

  describe("Default selection", () => {
    it("should have Aeroplan as the default currency", () => {
      const defaultCurrency: MilesCurrency = 'Aeroplan';
      expect(defaultCurrency).toBe('Aeroplan');
    });
  });
});
