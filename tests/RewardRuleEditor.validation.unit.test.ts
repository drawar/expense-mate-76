/**
 * Unit Tests for RewardRuleEditor Validation
 *
 * These tests verify specific validation scenarios and edge cases
 * for the reward rule form validation logic.
 */

/**
 * Validation function extracted from RewardRuleEditor
 * This mirrors the validation logic in the component
 */
interface ValidationErrors {
  name?: string;
  cardTypeId?: string;
  priority?: string;
  baseMultiplier?: string;
  bonusMultiplier?: string;
  blockSize?: string;
  monthlyCap?: string;
  monthlyMinSpend?: string;
}

interface RewardRuleInput {
  name: string;
  cardTypeId: string;
  priority: number;
  baseMultiplier: number;
  bonusMultiplier: number;
  blockSize: number;
  monthlyCap?: number;
  monthlyMinSpend?: number;
}

function validateRewardRule(input: RewardRuleInput): ValidationErrors {
  const errors: ValidationErrors = {};

  // Validate required fields
  if (!input.name || input.name.trim() === "") {
    errors.name = "Name is required";
  }

  if (!input.cardTypeId || input.cardTypeId.trim() === "") {
    errors.cardTypeId = "Card type ID is required";
  }

  // Validate numeric fields
  if (input.priority < 0) {
    errors.priority = "Priority must be a non-negative number";
  }

  if (input.baseMultiplier < 0) {
    errors.baseMultiplier = "Base multiplier must be a non-negative number";
  }

  if (input.bonusMultiplier < 0) {
    errors.bonusMultiplier = "Bonus multiplier must be a non-negative number";
  }

  if (input.blockSize <= 0) {
    errors.blockSize = "Block size must be greater than 0";
  }

  if (input.monthlyCap !== undefined && input.monthlyCap < 0) {
    errors.monthlyCap = "Monthly cap must be a non-negative number";
  }

  if (input.monthlyMinSpend !== undefined && input.monthlyMinSpend < 0) {
    errors.monthlyMinSpend =
      "Monthly minimum spend must be a non-negative number";
  }

  return errors;
}

describe("RewardRuleEditor Validation - Unit Tests", () => {
  describe("Required field validation", () => {
    it("should reject empty name", () => {
      const input: RewardRuleInput = {
        name: "",
        cardTypeId: "test-card",
        priority: 1,
        baseMultiplier: 1,
        bonusMultiplier: 0,
        blockSize: 1,
      };

      const errors = validateRewardRule(input);
      expect(errors.name).toBe("Name is required");
    });

    it("should reject whitespace-only name", () => {
      const input: RewardRuleInput = {
        name: "   ",
        cardTypeId: "test-card",
        priority: 1,
        baseMultiplier: 1,
        bonusMultiplier: 0,
        blockSize: 1,
      };

      const errors = validateRewardRule(input);
      expect(errors.name).toBe("Name is required");
    });

    it("should accept valid name", () => {
      const input: RewardRuleInput = {
        name: "Test Rule",
        cardTypeId: "test-card",
        priority: 1,
        baseMultiplier: 1,
        bonusMultiplier: 0,
        blockSize: 1,
      };

      const errors = validateRewardRule(input);
      expect(errors.name).toBeUndefined();
    });

    it("should reject empty cardTypeId", () => {
      const input: RewardRuleInput = {
        name: "Test Rule",
        cardTypeId: "",
        priority: 1,
        baseMultiplier: 1,
        bonusMultiplier: 0,
        blockSize: 1,
      };

      const errors = validateRewardRule(input);
      expect(errors.cardTypeId).toBe("Card type ID is required");
    });

    it("should reject whitespace-only cardTypeId", () => {
      const input: RewardRuleInput = {
        name: "Test Rule",
        cardTypeId: "   ",
        priority: 1,
        baseMultiplier: 1,
        bonusMultiplier: 0,
        blockSize: 1,
      };

      const errors = validateRewardRule(input);
      expect(errors.cardTypeId).toBe("Card type ID is required");
    });
  });

  describe("Priority validation", () => {
    it("should reject negative priority", () => {
      const input: RewardRuleInput = {
        name: "Test Rule",
        cardTypeId: "test-card",
        priority: -1,
        baseMultiplier: 1,
        bonusMultiplier: 0,
        blockSize: 1,
      };

      const errors = validateRewardRule(input);
      expect(errors.priority).toBe("Priority must be a non-negative number");
    });

    it("should accept zero priority", () => {
      const input: RewardRuleInput = {
        name: "Test Rule",
        cardTypeId: "test-card",
        priority: 0,
        baseMultiplier: 1,
        bonusMultiplier: 0,
        blockSize: 1,
      };

      const errors = validateRewardRule(input);
      expect(errors.priority).toBeUndefined();
    });

    it("should accept positive priority", () => {
      const input: RewardRuleInput = {
        name: "Test Rule",
        cardTypeId: "test-card",
        priority: 10,
        baseMultiplier: 1,
        bonusMultiplier: 0,
        blockSize: 1,
      };

      const errors = validateRewardRule(input);
      expect(errors.priority).toBeUndefined();
    });
  });

  describe("Base multiplier validation", () => {
    it("should reject negative base multiplier", () => {
      const input: RewardRuleInput = {
        name: "Test Rule",
        cardTypeId: "test-card",
        priority: 1,
        baseMultiplier: -1,
        bonusMultiplier: 0,
        blockSize: 1,
      };

      const errors = validateRewardRule(input);
      expect(errors.baseMultiplier).toBe(
        "Base multiplier must be a non-negative number"
      );
    });

    it("should accept zero base multiplier", () => {
      const input: RewardRuleInput = {
        name: "Test Rule",
        cardTypeId: "test-card",
        priority: 1,
        baseMultiplier: 0,
        bonusMultiplier: 0,
        blockSize: 1,
      };

      const errors = validateRewardRule(input);
      expect(errors.baseMultiplier).toBeUndefined();
    });

    it("should accept positive base multiplier", () => {
      const input: RewardRuleInput = {
        name: "Test Rule",
        cardTypeId: "test-card",
        priority: 1,
        baseMultiplier: 2.5,
        bonusMultiplier: 0,
        blockSize: 1,
      };

      const errors = validateRewardRule(input);
      expect(errors.baseMultiplier).toBeUndefined();
    });
  });

  describe("Bonus multiplier validation", () => {
    it("should reject negative bonus multiplier", () => {
      const input: RewardRuleInput = {
        name: "Test Rule",
        cardTypeId: "test-card",
        priority: 1,
        baseMultiplier: 1,
        bonusMultiplier: -0.5,
        blockSize: 1,
      };

      const errors = validateRewardRule(input);
      expect(errors.bonusMultiplier).toBe(
        "Bonus multiplier must be a non-negative number"
      );
    });

    it("should accept zero bonus multiplier", () => {
      const input: RewardRuleInput = {
        name: "Test Rule",
        cardTypeId: "test-card",
        priority: 1,
        baseMultiplier: 1,
        bonusMultiplier: 0,
        blockSize: 1,
      };

      const errors = validateRewardRule(input);
      expect(errors.bonusMultiplier).toBeUndefined();
    });
  });

  describe("Block size validation", () => {
    it("should reject zero block size", () => {
      const input: RewardRuleInput = {
        name: "Test Rule",
        cardTypeId: "test-card",
        priority: 1,
        baseMultiplier: 1,
        bonusMultiplier: 0,
        blockSize: 0,
      };

      const errors = validateRewardRule(input);
      expect(errors.blockSize).toBe("Block size must be greater than 0");
    });

    it("should reject negative block size", () => {
      const input: RewardRuleInput = {
        name: "Test Rule",
        cardTypeId: "test-card",
        priority: 1,
        baseMultiplier: 1,
        bonusMultiplier: 0,
        blockSize: -1,
      };

      const errors = validateRewardRule(input);
      expect(errors.blockSize).toBe("Block size must be greater than 0");
    });

    it("should accept positive block size", () => {
      const input: RewardRuleInput = {
        name: "Test Rule",
        cardTypeId: "test-card",
        priority: 1,
        baseMultiplier: 1,
        bonusMultiplier: 0,
        blockSize: 0.5,
      };

      const errors = validateRewardRule(input);
      expect(errors.blockSize).toBeUndefined();
    });
  });

  describe("Optional field validation", () => {
    it("should accept undefined monthly cap", () => {
      const input: RewardRuleInput = {
        name: "Test Rule",
        cardTypeId: "test-card",
        priority: 1,
        baseMultiplier: 1,
        bonusMultiplier: 0,
        blockSize: 1,
        monthlyCap: undefined,
      };

      const errors = validateRewardRule(input);
      expect(errors.monthlyCap).toBeUndefined();
    });

    it("should reject negative monthly cap", () => {
      const input: RewardRuleInput = {
        name: "Test Rule",
        cardTypeId: "test-card",
        priority: 1,
        baseMultiplier: 1,
        bonusMultiplier: 0,
        blockSize: 1,
        monthlyCap: -100,
      };

      const errors = validateRewardRule(input);
      expect(errors.monthlyCap).toBe(
        "Monthly cap must be a non-negative number"
      );
    });

    it("should accept zero monthly cap", () => {
      const input: RewardRuleInput = {
        name: "Test Rule",
        cardTypeId: "test-card",
        priority: 1,
        baseMultiplier: 1,
        bonusMultiplier: 0,
        blockSize: 1,
        monthlyCap: 0,
      };

      const errors = validateRewardRule(input);
      expect(errors.monthlyCap).toBeUndefined();
    });

    it("should accept positive monthly cap", () => {
      const input: RewardRuleInput = {
        name: "Test Rule",
        cardTypeId: "test-card",
        priority: 1,
        baseMultiplier: 1,
        bonusMultiplier: 0,
        blockSize: 1,
        monthlyCap: 5000,
      };

      const errors = validateRewardRule(input);
      expect(errors.monthlyCap).toBeUndefined();
    });

    it("should reject negative monthly min spend", () => {
      const input: RewardRuleInput = {
        name: "Test Rule",
        cardTypeId: "test-card",
        priority: 1,
        baseMultiplier: 1,
        bonusMultiplier: 0,
        blockSize: 1,
        monthlyMinSpend: -500,
      };

      const errors = validateRewardRule(input);
      expect(errors.monthlyMinSpend).toBe(
        "Monthly minimum spend must be a non-negative number"
      );
    });

    it("should accept positive monthly min spend", () => {
      const input: RewardRuleInput = {
        name: "Test Rule",
        cardTypeId: "test-card",
        priority: 1,
        baseMultiplier: 1,
        bonusMultiplier: 0,
        blockSize: 1,
        monthlyMinSpend: 1000,
      };

      const errors = validateRewardRule(input);
      expect(errors.monthlyMinSpend).toBeUndefined();
    });
  });

  describe("Multiple validation errors", () => {
    it("should return multiple errors when multiple fields are invalid", () => {
      const input: RewardRuleInput = {
        name: "",
        cardTypeId: "",
        priority: -1,
        baseMultiplier: -1,
        bonusMultiplier: -1,
        blockSize: 0,
        monthlyCap: -100,
        monthlyMinSpend: -500,
      };

      const errors = validateRewardRule(input);
      expect(Object.keys(errors).length).toBe(8);
      expect(errors.name).toBeDefined();
      expect(errors.cardTypeId).toBeDefined();
      expect(errors.priority).toBeDefined();
      expect(errors.baseMultiplier).toBeDefined();
      expect(errors.bonusMultiplier).toBeDefined();
      expect(errors.blockSize).toBeDefined();
      expect(errors.monthlyCap).toBeDefined();
      expect(errors.monthlyMinSpend).toBeDefined();
    });
  });

  describe("Valid input", () => {
    it("should return no errors for completely valid input", () => {
      const input: RewardRuleInput = {
        name: "Grocery Bonus",
        cardTypeId: "amex-gold",
        priority: 1,
        baseMultiplier: 1.5,
        bonusMultiplier: 2.5,
        blockSize: 1,
        monthlyCap: 5000,
        monthlyMinSpend: 1000,
      };

      const errors = validateRewardRule(input);
      expect(Object.keys(errors).length).toBe(0);
    });

    it("should return no errors for valid input with optional fields omitted", () => {
      const input: RewardRuleInput = {
        name: "Base Rule",
        cardTypeId: "visa-signature",
        priority: 5,
        baseMultiplier: 1,
        bonusMultiplier: 0,
        blockSize: 1,
      };

      const errors = validateRewardRule(input);
      expect(Object.keys(errors).length).toBe(0);
    });
  });
});
