
import { calculatorRegistry } from './CalculatorRegistry';
import { DBSWomansWorldCalculator } from './DBSWomansWorldCalculator';

/**
 * Register custom calculators
 */
export function registerCustomCalculators() {
  // Register DBS Woman's World Card calculator
  calculatorRegistry.registerCalculator(
    'DBS', 
    'Woman\'s World MasterCard', 
    new DBSWomansWorldCalculator()
  );
  
  // More calculators can be registered here
}

// Export for use in application initialization
export default registerCustomCalculators;
