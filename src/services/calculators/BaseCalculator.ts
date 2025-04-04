
import { PaymentMethod } from '@/types';

// Base input interface for all calculators
export interface CalculationInput {
  amount: number;
  currency: string;
  mcc?: string;
  merchantName?: string;
  isOnline?: boolean;
  isContactless?: boolean;
  usedBonusPoints?: number;
  paymentMethod: PaymentMethod;
  [key: string]: any; // Allow for additional properties for specialized calculators
}

// Base result interface
export interface CalculationResult {
  totalPoints: number;
  basePoints: number;
  bonusPoints: number;
  pointsCurrency?: string;
  remainingMonthlyBonusPoints?: number;
  [key: string]: any; // Allow for additional properties in the result
}

// Rounding strategy interface
export interface RoundingStrategy {
  round(amount: number): number;
}

// Rounding implementations
export class FloorRounding implements RoundingStrategy {
  round(amount: number): number {
    return Math.floor(amount);
  }
}

export class CeilingRounding implements RoundingStrategy {
  round(amount: number): number {
    return Math.ceil(amount);
  }
}

export class NearestRounding implements RoundingStrategy {
  round(amount: number): number {
    return Math.round(amount);
  }
}

export class Nearest5Rounding implements RoundingStrategy {
  round(amount: number): number {
    return Math.floor(amount / 5) * 5;
  }
}

// Factory for creating rounding strategies
export class RoundingFactory {
  static createStrategy(type: 'floor' | 'ceiling' | 'nearest' | 'nearest5'): RoundingStrategy {
    switch (type) {
      case 'floor':
        return new FloorRounding();
      case 'ceiling':
        return new CeilingRounding();
      case 'nearest5':
        return new Nearest5Rounding();
      case 'nearest':
      default:
        return new NearestRounding();
    }
  }
}

// Monthly spending cap for bonus points
export interface MonthlyCap {
  amount: number;
  usedAmount: number;
  remainingAmount: number;
}

// Bonus points cap configuration
export interface BonusPointsCap {
  monthly?: MonthlyCap;
  yearly?: {
    amount: number;
    usedAmount: number;
    remainingAmount: number;
  };
  perTransaction?: number;
}

/**
 * Base calculator abstract class
 * All specific card calculators inherit from this
 */
export abstract class BaseCalculator {
  protected roundingStrategy: RoundingStrategy;
  
  constructor(roundingType: 'floor' | 'ceiling' | 'nearest' | 'nearest5' = 'nearest') {
    this.roundingStrategy = RoundingFactory.createStrategy(roundingType);
  }
  
  /**
   * Calculate reward points for a given transaction input
   */
  public calculateRewards(input: CalculationInput): CalculationResult {
    // Round the amount first according to the strategy
    const roundedAmount = this.roundAmount(input.amount);
    
    // Calculate base points
    const basePoints = this.calculateBasePoints(roundedAmount, input);
    
    // Calculate bonus points
    const bonusInfo = this.calculateBonusPoints(roundedAmount, input);
    
    // Get the points currency
    const pointsCurrency = this.getPointsCurrency(input);
    
    // Return the calculation result
    return {
      totalPoints: basePoints + bonusInfo.bonusPoints,
      basePoints,
      bonusPoints: bonusInfo.bonusPoints,
      remainingMonthlyBonusPoints: bonusInfo.remainingMonthlyBonusPoints,
      pointsCurrency
    };
  }
  
  /**
   * Public method to get points currency without calculating rewards
   */
  public getPointsCurrencyPublic(input: CalculationInput): string {
    return this.getPointsCurrency(input);
  }
  
  /**
   * Round the amount according to the rounding strategy
   */
  protected roundAmount(amount: number): number {
    return this.roundingStrategy.round(amount);
  }
  
  /**
   * Calculate base points - can be overridden by specific calculators
   */
  protected calculateBasePoints(roundedAmount: number, input: CalculationInput): number {
    // Default implementation: 1 point per dollar
    return roundedAmount;
  }
  
  /**
   * Calculate bonus points - should be implemented by specific calculators
   */
  protected calculateBonusPoints(roundedAmount: number, input: CalculationInput): { 
    bonusPoints: number; 
    remainingMonthlyBonusPoints?: number;
  } {
    // Default implementation: no bonus points
    return { 
      bonusPoints: 0
    };
  }
  
  /**
   * Get points currency - can be overridden by specific calculators
   */
  protected getPointsCurrency(input: CalculationInput): string {
    // Default implementation: generic "Points"
    return 'Points';
  }
  
  /**
   * Check if the transaction meets specific eligibility criteria
   * This is a utility method that specific calculators can use
   */
  protected isEligibleForBonus(input: CalculationInput): boolean {
    return true;
  }
  
  /**
   * Set the rounding strategy dynamically
   */
  public setRoundingStrategy(roundingType: 'floor' | 'ceiling' | 'nearest' | 'nearest5'): void {
    this.roundingStrategy = RoundingFactory.createStrategy(roundingType);
  }
}

/**
 * Rule conditions interface
 */
export interface RuleCondition {
  mccCodes?: string[];
  excludedMccCodes?: string[];
  merchantNames?: string[];
  isOnlineOnly?: boolean;
  isContactlessOnly?: boolean;
  foreignCurrencyOnly?: boolean;
  excludedCurrencies?: string[];
  minAmount?: number;
  maxAmount?: number;
  customCondition?: (input: CalculationInput) => boolean;
}

/**
 * Rule rewards interface
 */
export interface RuleReward {
  basePointRate: number;
  bonusPointRate: number;
  monthlyCap?: number;
}

/**
 * Rule configuration for tiered rates
 */
export interface TieredRateConfig {
  threshold: number;
  rate: number;
  description: string;
}

/**
 * External configurability support for rule-based calculators
 */
export interface ConfigurableCalculator {
  configure(config: any): void;
  addRule(condition: RuleCondition, reward: RuleReward): void;
  removeRule(ruleId: string): void;
  updateRule(ruleId: string, condition: RuleCondition, reward: RuleReward): void;
}
