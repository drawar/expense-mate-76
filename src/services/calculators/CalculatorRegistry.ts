
import { BaseCalculator } from './BaseCalculator';
import { GenericCardCalculator } from './GenericCardCalculator';
import { PaymentMethod } from '@/types';

/**
 * Registry for card reward calculators
 * This is a registry pattern implementation that maps card types to their respective calculators
 */
class CalculatorRegistry {
  private calculators: Map<string, BaseCalculator> = new Map();
  private defaultCalculator: BaseCalculator;
  
  constructor() {
    // Initialize with a default generic calculator
    this.defaultCalculator = new GenericCardCalculator();
    
    // Configure the default calculator with standard settings
    if (this.defaultCalculator instanceof GenericCardCalculator) {
      this.defaultCalculator.configure({
        defaultBaseRate: 1,
        pointsCurrency: 'Points',
        roundingType: 'floor'
      });
    }
    
    console.log('Calculator registry initialized');
  }
  
  /**
   * Register a calculator for a specific card type
   */
  public register(cardType: string, calculator: BaseCalculator): void {
    console.log(`Registering calculator for card type: ${cardType}`);
    this.calculators.set(cardType.toLowerCase(), calculator);
  }
  
  /**
   * Get calculator for a specific card type
   */
  public getCalculatorForCard(cardType: string): BaseCalculator {
    console.log(`Looking for calculator for card type: ${cardType}`);
    const calculator = this.calculators.get(cardType.toLowerCase());
    
    if (calculator) {
      console.log(`Found specialized calculator for ${cardType}`);
      return calculator;
    }
    
    console.log(`No specialized calculator found for ${cardType}, using default`);
    return this.defaultCalculator;
  }
  
  /**
   * Get calculator for a payment method
   */
  public getCalculatorForPaymentMethod(paymentMethod: PaymentMethod): BaseCalculator {
    if (!paymentMethod) {
      console.log('No payment method provided, using default calculator');
      return this.defaultCalculator;
    }
    
    // Convert payment method name to a standardized format for lookup
    // e.g. "DBS Woman's World Mastercard" -> "dbs-woman's-world-mastercard"
    const cardKey = this.createCardTypeKey(paymentMethod);
    console.log(`Looking for calculator using key: ${cardKey}`);
    
    return this.getCalculatorForCard(cardKey);
  }
  
  /**
   * Create a standardized key for the payment method
   */
  private createCardTypeKey(paymentMethod: PaymentMethod): string {
    if (!paymentMethod || !paymentMethod.name) {
      return 'unknown';
    }
    
    // For specific issuers, create a more specific key
    if (paymentMethod.issuer) {
      return `${paymentMethod.issuer.toLowerCase()}-${paymentMethod.name.toLowerCase()}`.replace(/\s+/g, '-');
    }
    
    // General fallback - just use the name
    return paymentMethod.name.toLowerCase().replace(/\s+/g, '-');
  }
  
  /**
   * Check if a specialized calculator exists for a card type
   */
  public hasCalculatorForCard(cardType: string): boolean {
    return this.calculators.has(cardType.toLowerCase());
  }
  
  /**
   * Get all registered calculator types
   */
  public getRegisteredCardTypes(): string[] {
    return Array.from(this.calculators.keys());
  }
}

// Export a singleton instance
export const calculatorRegistry = new CalculatorRegistry();
