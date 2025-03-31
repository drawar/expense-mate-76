import { BaseCalculator } from './BaseCalculator';
import { RuleBasedCalculator } from './RuleBasedCalculator';
import { PaymentMethod } from '@/types';
import { CardRegistry } from '@/components/expense/cards/CardRegistry';

/**
 * Registry for calculator instances
 * 
 * This registry serves as a cache and factory for calculator instances,
 * similar to how CardRegistry works for card components.
 */
export class CalculatorRegistry {
  private static instance: CalculatorRegistry;
  private calculators: Map<string, BaseCalculator> = new Map();
  
  private constructor() {}
  
  /**
   * Get singleton instance
   */
  public static getInstance(): CalculatorRegistry {
    if (!CalculatorRegistry.instance) {
      CalculatorRegistry.instance = new CalculatorRegistry();
    }
    return CalculatorRegistry.instance;
  }
  
  /**
   * Get the appropriate calculator for a payment method
   */
  public getCalculatorForPaymentMethod(paymentMethod: PaymentMethod): BaseCalculator {
    if (!paymentMethod || !paymentMethod.issuer || !paymentMethod.name) {
      // Return a default calculator for cash or unknown payment methods
      return new RuleBasedCalculator('default');
    }
    
    const cardId = this.getCardTypeId(paymentMethod);
    
    // Check if we already have a calculator for this card type
    if (this.calculators.has(cardId)) {
      return this.calculators.get(cardId)!;
    }
    
    // Create a new calculator
    const calculator = this.createCalculatorForCardType(cardId);
    
    // Cache it for future use
    this.calculators.set(cardId, calculator);
    
    return calculator;
  }
  
  /**
   * Create a calculator for a specific card type
   */
  private createCalculatorForCardType(cardTypeId: string): BaseCalculator {
    // For now, we just create a RuleBasedCalculator for all card types
    // In the future, we could add special calculators for specific card types
    return new RuleBasedCalculator(cardTypeId);
  }
  
  /**
   * Get the card type ID from a payment method
   */
  private getCardTypeId(paymentMethod: PaymentMethod): string {
    const { issuer, name } = paymentMethod;
    
    // Try to get card info from registry
    const cardInfo = CardRegistry.findCard(issuer, name);
    
    if (cardInfo) {
      return cardInfo.id;
    }
    
    // Fall back to a standardized ID format
    return `${issuer.toLowerCase().replace(/\s+/g, '-')}-${name.toLowerCase().replace(/\s+/g, '-')}`;
  }
  
  /**
   * Clear all cached calculators
   */
  public clearCache(): void {
    this.calculators.clear();
  }
}

// Export a singleton instance
export const calculatorRegistry = CalculatorRegistry.getInstance();