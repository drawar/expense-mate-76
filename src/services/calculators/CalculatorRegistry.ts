
// src/services/calculators/CalculatorRegistry.ts
import { BaseCalculator } from './BaseCalculator';
import { RuleBasedCalculator } from './RuleBasedCalculator';
import { PaymentMethod } from '@/types';

/**
 * Registry of available calculators for different payment methods
 */
export class calculatorRegistry {
  private static calculators: Map<string, BaseCalculator> = new Map();
  
  /**
   * Initialize predefined calculators
   */
  private static initializeCalculators() {
    if (this.calculators.size > 0) return;
    
    // Add specific calculators for different card types
    this.addCalculator('uob-platinum', new RuleBasedCalculator('uob-platinum'));
    this.addCalculator('uob-signature', new RuleBasedCalculator('uob-signature'));
    this.addCalculator('uob-ladys-solitaire', new RuleBasedCalculator('uob-ladys-solitaire'));
    this.addCalculator('citibank-rewards', new RuleBasedCalculator('citibank-rewards'));
    this.addCalculator('ocbc-rewards', new RuleBasedCalculator('ocbc-rewards'));
    this.addCalculator('amex-platinum-sg', new RuleBasedCalculator('amex-platinum-sg'));
    this.addCalculator('amex-platinum-credit', new RuleBasedCalculator('amex-platinum-credit'));
    this.addCalculator('amex-cobalt', new RuleBasedCalculator('amex-cobalt'));
    this.addCalculator('amex-platinum-canada', new RuleBasedCalculator('amex-platinum-canada'));
    this.addCalculator('td-aeroplan', new RuleBasedCalculator('td-aeroplan'));
  }
  
  /**
   * Add a calculator for a specific card type
   */
  static addCalculator(cardType: string, calculator: BaseCalculator) {
    this.calculators.set(cardType, calculator);
  }
  
  /**
   * Get a calculator by card type
   */
  static getCalculator(cardType: string): BaseCalculator | null {
    this.initializeCalculators();
    return this.calculators.get(cardType) || null;
  }
  
  /**
   * Get calculator for a payment method based on issuer and name
   */
  static getCalculatorForPaymentMethod(paymentMethod: PaymentMethod): BaseCalculator {
    this.initializeCalculators();
    
    const { issuer, name } = paymentMethod;
    let calculatorKey = '';
    
    // Map the payment method to the appropriate calculator key
    if (issuer === 'UOB') {
      if (name === 'Preferred Visa Platinum') calculatorKey = 'uob-platinum';
      else if (name === 'Visa Signature') calculatorKey = 'uob-signature';
      else if (name === 'Lady\'s Solitaire') calculatorKey = 'uob-ladys-solitaire';
    } 
    else if (issuer === 'Citibank' && name === 'Rewards Visa Signature') {
      calculatorKey = 'citibank-rewards';
    }
    else if (issuer === 'OCBC' && name === 'Rewards World Mastercard') {
      calculatorKey = 'ocbc-rewards';
    }
    else if (issuer === 'American Express') {
      if (name === 'Platinum Singapore') calculatorKey = 'amex-platinum-sg';
      else if (name === 'Platinum Credit') calculatorKey = 'amex-platinum-credit';
      else if (name === 'Cobalt') calculatorKey = 'amex-cobalt';
      else if (name === 'Platinum Canada') calculatorKey = 'amex-platinum-canada';
    }
    else if (issuer === 'TD' && name === 'Aeroplan Visa Infinite') {
      calculatorKey = 'td-aeroplan';
    }
    
    // Try to get the calculator for this payment method
    let calculator = this.getCalculator(calculatorKey);
    
    // Fallback to a generic calculator if no specific one is found
    if (!calculator) {
      calculator = new RuleBasedCalculator('generic');
      console.log(`No specific calculator found for ${issuer} ${name}, using generic calculator`);
    }
    
    return calculator;
  }
}
