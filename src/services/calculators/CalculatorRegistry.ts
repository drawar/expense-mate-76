
import { PaymentMethod } from '@/types';
import { BaseCalculator } from './BaseCalculator';
import { GenericCardCalculator } from './GenericCardCalculator';

/**
 * Registry for all card calculators
 * This serves as a factory for getting the appropriate calculator for a payment method
 */
class CalculatorRegistry {
  private calculators: Map<string, BaseCalculator> = new Map();
  private genericCalculator: GenericCardCalculator;
  
  constructor() {
    // Initialize with a generic calculator as fallback
    this.genericCalculator = new GenericCardCalculator();
    
    // Register additional calculators here when they're created
    // e.g., this.register('citibank-rewards', new CitibankRewardsCalculator());
  }
  
  /**
   * Register a calculator for a specific card type
   */
  public register(cardType: string, calculator: BaseCalculator): void {
    this.calculators.set(cardType.toLowerCase(), calculator);
  }
  
  /**
   * Get the appropriate calculator for a payment method
   */
  public getCalculatorForPaymentMethod(paymentMethod: PaymentMethod): BaseCalculator {
    if (!paymentMethod || paymentMethod.type === 'cash') {
      return this.genericCalculator; // Cash gets generic calculator with 0 points
    }
    
    // Try to find a specific calculator for this card
    const cardTypeKey = this.getCardTypeKey(paymentMethod);
    const calculator = this.calculators.get(cardTypeKey);
    
    if (calculator) {
      return calculator;
    }
    
    console.log(`No specific calculator found for ${cardTypeKey}, using generic calculator`);
    return this.genericCalculator;
  }
  
  /**
   * Get the calculator for a specific card type
   */
  public getCalculatorForCard(cardType: string): BaseCalculator {
    const calculator = this.calculators.get(cardType.toLowerCase());
    return calculator || this.genericCalculator;
  }
  
  /**
   * Generate a standardized key for looking up calculators
   */
  private getCardTypeKey(paymentMethod: PaymentMethod): string {
    if (paymentMethod.type !== 'credit_card' || !paymentMethod.issuer || !paymentMethod.name) {
      return 'generic';
    }
    
    return `${paymentMethod.issuer.toLowerCase()}-${paymentMethod.name.toLowerCase().replace(/\s+/g, '-')}`;
  }
  
  /**
   * Get all registered calculators
   */
  public getAllCalculators(): Map<string, BaseCalculator> {
    return this.calculators;
  }
}

// Export a singleton instance
export const calculatorRegistry = new CalculatorRegistry();
