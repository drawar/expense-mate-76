// src/services/RewardCalculationService.ts
import { Transaction, PaymentMethod, Currency } from '@/types';
import { BaseRewardCard, BaseRewardCardProps } from '@/components/expense/cards/BaseRewardCard';
import { UOBPlatinumCardWrapper } from '@/components/expense/cards/UOBPlatinumCardRefactored';
import { UOBSignatureCardWrapper } from '@/components/expense/cards/UOBSignatureCardRefactored';
import { CitibankRewardsCardWrapper } from '@/components/expense/cards/CitibankRewardsCardRefactored';
import { UOBLadysSolitaireCardWrapper } from '@/components/expense/cards/UOBLadysSolitaireCard';
import { TDAeroplanVisaInfiniteCardWrapper } from '@/components/expense/cards/TDAeroplanVisaInfinite';
import { AmexPlatinumCreditWrapper } from '@/components/expense/cards/AmexPlatinumCredit';
import { AmexPlatinumSGWrapper } from '@/components/expense/cards/AmexPlatinumSingapore';
import { AmexPlatinumCanadaCardWrapper } from '@/components/expense/cards/AmexPlatinumCanada';
import { AmexCobaltCardWrapper } from '@/components/expense/cards/AmexCobaltCard';
import { CardRegistry } from '@/components/expense/cards/CardRegistry';
import { OCBCRewardsWorldCardWrapper } from '@/components/expense/cards/OCBCRewardsWorldCard';

// Define a transaction type that has more relaxed requirements for simulation
interface SimulatedTransaction {
  id: string;
  date: string;
  merchant: {
    id: string;
    name: string;
    mcc?: { code: string; description: string };
    isOnline?: boolean;
  };
  amount: number;
  currency: any; // Using any to avoid Currency type issues
  paymentMethod: PaymentMethod;
  paymentAmount: number;
  paymentCurrency: any; // Using any to avoid Currency type issues
  isContactless?: boolean;
  rewardPoints?: number;
}

// Define fixed return type for calculations
interface PointsCalculation {
  totalPoints: number;
  basePoints: number;
  bonusPoints: number;
  pointsCurrency?: string;
  remainingMonthlyBonusPoints?: number;
}

/**
 * Centralized service that handles all reward point calculations using the OOP implementation
 * as the single source of truth.
 */
export class RewardCalculationService {
  private static instance: RewardCalculationService;
  
  private constructor() {}
  
  /**
   * Get the singleton instance of the RewardCalculationService
   */
  public static getInstance(): RewardCalculationService {
    if (!RewardCalculationService.instance) {
      RewardCalculationService.instance = new RewardCalculationService();
    }
    return RewardCalculationService.instance;
  }

  /**
   * Get the appropriate card wrapper component based on the payment method
   */
  private getCardComponent(paymentMethod: PaymentMethod): React.ComponentType<any> | null {
    if (!paymentMethod || !paymentMethod.issuer) return null;
    
    const { issuer, name } = paymentMethod;
    
    // Try to get the component from the registry first
    const cardComponent = CardRegistry.getComponentForPaymentMethod(paymentMethod);
    if (cardComponent) return cardComponent;
    
    // Fall back to direct mapping if not in registry
    if (issuer === 'UOB') {
      if (name === 'Preferred Visa Platinum') return UOBPlatinumCardWrapper;
      if (name === 'Visa Signature') return UOBSignatureCardWrapper;
      if (name === 'Lady\'s Solitaire') return UOBLadysSolitaireCardWrapper;
    } else if (issuer === 'Citibank') {
      if (name === 'Rewards Visa Signature') return CitibankRewardsCardWrapper;
    } else if (issuer === 'TD') {
      if (name === 'Aeroplan Visa Infinite') return TDAeroplanVisaInfiniteCardWrapper;
    } else if (issuer === 'American Express') {
      if (name === 'Platinum Credit') return AmexPlatinumCreditWrapper;
      if (name === 'Platinum Singapore') return AmexPlatinumSGWrapper;
      if (name === 'Platinum Canada') return AmexPlatinumCanadaCardWrapper;
      if (name === 'Cobalt') return AmexCobaltCardWrapper;
    } else if (issuer === 'OCBC') {
      if (name === 'Rewards World Mastercard') return OCBCRewardsWorldCardWrapper;
    }
    
    return null;
  }
  
  /**
   * Helper method to get selected categories for a card
   */
  private getSelectedCategoriesForCard(paymentMethod: PaymentMethod): string[] {
    // This is a placeholder implementation
    // In a real app, you would retrieve this from a user's preferences or card settings
    
    // For UOB Lady's Solitaire Card, default to some common categories
    if (paymentMethod.issuer === 'UOB' && paymentMethod.name === 'Lady\'s Solitaire') {
      return ['Dining', 'Beauty & Wellness']; // Default categories
    }
    
    return [];
  }
  
  /**
   * Calculate reward points for a transaction using the OOP implementation
   */
  public calculatePoints(transactionInput: Transaction | SimulatedTransaction, usedBonusPoints: number = 0): PointsCalculation {
    const { paymentMethod, amount, merchant, isContactless } = transactionInput;
    
    // Skip calculation for cash payments
    if (!paymentMethod || paymentMethod.type === 'cash') {
      return {
        totalPoints: 0,
        basePoints: 0,
        bonusPoints: 0
      };
    }
    
    // Get the appropriate card component
    const CardComponent = this.getCardComponent(paymentMethod);
    if (!CardComponent) {
      // Default basic calculation if no specific card component is available
      const basePoints = Math.floor(amount);
      return {
        totalPoints: basePoints,
        basePoints,
        bonusPoints: 0
      };
    }
    
    try {
      // Instead of trying to instantiate the component class directly,
      // use a more direct approach to calculate the rewards
      
      // Basic calculation for all cards
      let basePoints = Math.floor(amount);
      let bonusPoints = 0;
      let pointsCurrency = this.getPointsCurrency(paymentMethod);
      
      // Card-specific calculations based on the card type
      if (paymentMethod.issuer === 'UOB') {
        if (paymentMethod.name === 'Preferred Visa Platinum') {
          // UOB Platinum Card calculation
          const roundedAmount = Math.floor(amount / 5) * 5;
          basePoints = Math.round(roundedAmount * 0.4);
          
          // Check bonus eligibility
          const isEligibleMCC = merchant?.mcc?.code && [
            '4816', '5262', '5306', '5309', '5310', '5311', '5331', '5399', 
            '5611', '5621', '5631', '5641', '5651', '5661', '5691', '5699',
            /* ...more MCCs... */
          ].includes(merchant.mcc.code);
          
          if (isContactless || (merchant?.isOnline && isEligibleMCC)) {
            bonusPoints = Math.round(roundedAmount * 3.6);
            
            // Apply monthly cap
            const maxBonusPoints = 4000;
            bonusPoints = Math.min(bonusPoints, maxBonusPoints - usedBonusPoints);
          }
        } 
        else if (paymentMethod.name === 'Visa Signature') {
          // UOB Signature Card calculation
          const roundedAmount = Math.floor(amount / 5) * 5;
          basePoints = Math.round(roundedAmount * 0.4);
          
          // Simplified implementation - would need more context for full implementation
          if (transactionInput.currency !== 'SGD') {
            bonusPoints = Math.round(roundedAmount * 3.6);
            
            // Apply monthly cap
            const maxBonusPoints = 8000;
            bonusPoints = Math.min(bonusPoints, maxBonusPoints - usedBonusPoints);
          }
        }
        else if (paymentMethod.name === 'Lady\'s Solitaire') {
          // UOB Lady's Solitaire Card calculation
          const roundedAmount = Math.floor(amount / 5) * 5;
          basePoints = Math.round(roundedAmount * 0.4);
          
          // Get the selected categories
          const selectedCategories = this.getSelectedCategoriesForCard(paymentMethod);
          
          // Define category MCCs
          const categoryMCCs: Record<string, string[]> = {
            'Beauty & Wellness': ['5912', '5977', '7230', '7231', '7298', '7297'],
            'Dining': ['5811', '5812', '5814', '5499'],
            // ... other categories
          };
          
          // Check if transaction MCC falls into any selected category
          const isEligible = merchant?.mcc?.code && selectedCategories.some(category => {
            const mccs = categoryMCCs[category] || [];
            return mccs.includes(merchant.mcc.code);
          });
          
          if (isEligible) {
            bonusPoints = Math.round(roundedAmount * 3.6);
            
            // Apply monthly cap
            const maxBonusPoints = 7200;
            bonusPoints = Math.min(bonusPoints, maxBonusPoints - usedBonusPoints);
          }
        }
      }
      else if (paymentMethod.issuer === 'Citibank' && paymentMethod.name === 'Rewards Visa Signature') {
        // Citibank Rewards Card calculation
        const roundedAmount = Math.floor(amount);
        basePoints = Math.round(roundedAmount * 0.4);
        
        // Exclusion MCCs (airlines, travel, etc.)
        const exclusionMCCs = [...Array(1000).map((_, i) => `${3000 + i}`), 
                               '4511', '7512', '7011', '4111', '4112', '4789', '4411', '4722', '4723', '5962', '7012'];
        
        // Inclusion MCCs (department stores, etc.)
        const inclusionMCCs = ['5311', '5611', '5621', '5631', '5641', '5651', '5655', '5661', '5691', '5699', '5948'];
        
        const isExcludedMCC = merchant?.mcc?.code && exclusionMCCs.includes(merchant.mcc.code);
        const isIncludedMCC = merchant?.mcc?.code && inclusionMCCs.includes(merchant.mcc.code);
        const isEligible = (merchant?.isOnline && !isExcludedMCC) || isIncludedMCC;
        
        if (isEligible) {
          bonusPoints = Math.round(roundedAmount * 3.6);
          
          // Apply monthly cap
          const maxBonusPoints = 4000;
          bonusPoints = Math.min(bonusPoints, maxBonusPoints - usedBonusPoints);
        }
      }
      else if (paymentMethod.issuer === 'TD' && paymentMethod.name === 'Aeroplan Visa Infinite') {
        // TD Aeroplan Card calculation - no rounding
        basePoints = Math.round(amount * 1); // 1 point per dollar
        
        // Check if eligible for bonus (gas, grocery, or Air Canada)
        const eligibleMCCs = ['5541', '5542', '5411', '5422', '5441', '5451', '5462'];
        const isEligibleMCC = merchant?.mcc?.code && eligibleMCCs.includes(merchant.mcc.code);
        const isAirCanada = merchant?.name === 'Air Canada';
        
        if (isEligibleMCC || isAirCanada) {
          // Bonus is 0.5x (to make total 1.5x)
          bonusPoints = Math.round(amount * 0.5);
          // No monthly cap for TD Aeroplan
        }
        
        pointsCurrency = 'Aeroplan';
      }
      else if (paymentMethod.issuer === 'American Express') {
        // American Express Cards - simplified implementation
        if (paymentMethod.name === 'Platinum Credit' || paymentMethod.name === 'Platinum Singapore') {
          basePoints = Math.round(amount * 1.25); // 1.25 points per dollar
          pointsCurrency = paymentMethod.name === 'Platinum Credit' ? 'MR (Credit Card)' : 'MR (Charge Card)';
        }
        else if (paymentMethod.name === 'Platinum Canada' || paymentMethod.name === 'Cobalt') {
          basePoints = Math.round(amount * 1); // 1 point per dollar (base rate)
          pointsCurrency = 'MR';
          
          // Additional logic for Cobalt's tiered rewards would go here
        }
      }
      else if (paymentMethod.issuer === 'OCBC' && paymentMethod.name === 'Rewards World Mastercard') {
        // OCBC Rewards World Mastercard calculation
        const roundedAmount = Math.floor(amount / 5) * 5;
        basePoints = Math.round(roundedAmount * 2); // 2x base points per $5
        
        // Tier-1 and Tier-2 eligible MCCs
        const tier1MCCs = ['5309', '5611', '5621', '5641', '5651', '5655', '5661', '5691', '5699', '5941', '5948'];
        const tier2MCCs = ['5311'];
        
        // Tier-1 and Tier-2 eligible merchant names
        const tier1Merchants = [
          'Alibaba', 'AliExpress', 'Amazon', 'Daigou', 'Ezbuy', 'Guardian', 
          'Lazada', 'Mustafa Centre', 'NTUC Unity', 'Qoo10', 'Shopee', 'Taobao', 'TikTok Shop'
        ];
        const tier2Merchants = ['Watsons'];
        
        // Check eligibility
        const isTier1Eligible = 
          (merchant?.mcc?.code && tier1MCCs.includes(merchant.mcc.code)) || 
          (merchant?.name && tier1Merchants.some(m => merchant.name.includes(m)));
        
        const isTier2Eligible = 
          (merchant?.mcc?.code && tier2MCCs.includes(merchant.mcc.code)) || 
          (merchant?.name && tier2Merchants.some(m => merchant.name.includes(m)));
        
        // Calculate bonus points
        if (isTier2Eligible) {
          // Tier 2: 28x bonus points per $5
          bonusPoints = Math.round(roundedAmount * 28);
        } else if (isTier1Eligible) {
          // Tier 1: 18x bonus points per $5
          bonusPoints = Math.round(roundedAmount * 18);
        }
        
        // Apply monthly cap of 10,000 bonus points
        if (bonusPoints > 0) {
          const maxBonusPoints = 10000;
          bonusPoints = Math.min(bonusPoints, maxBonusPoints - usedBonusPoints);
        }
        
        pointsCurrency = 'OCBC$';
      }
      
      return {
        totalPoints: basePoints + bonusPoints,
        basePoints,
        bonusPoints,
        pointsCurrency
      };
    } catch (error) {
      console.error('Error calculating rewards:', error);
      // Fallback to basic calculation
      const basePoints = Math.floor(amount);
      return {
        totalPoints: basePoints,
        basePoints,
        bonusPoints: 0
      };
    }
  }
  
  /**
   * Simulate reward points for a hypothetical transaction
   */
  public simulatePoints(
    amount: number,
    currency: string,
    paymentMethod: PaymentMethod,
    mcc?: string,
    merchantName?: string,
    isOnline?: boolean,
    isContactless?: boolean,
    usedBonusPoints: number = 0
  ): PointsCalculation {
    try {
      // Create a simulated transaction
      const simulatedTransaction: SimulatedTransaction = {
        id: 'simulated',
        date: new Date().toISOString(),
        merchant: {
          id: 'simulated',
          name: merchantName || 'Simulated Merchant',
          mcc: mcc ? { code: mcc, description: '' } : undefined,
          isOnline: !!isOnline
        },
        amount,
        currency, // Type issues are handled by using SimulatedTransaction
        paymentMethod,
        paymentAmount: amount,
        paymentCurrency: currency, // Type issues are handled by using SimulatedTransaction
        isContactless: !!isContactless
      };
      
      // Calculate points using the main calculation method
      const result = this.calculatePoints(simulatedTransaction, usedBonusPoints);
      
      // Calculate remaining monthly bonus points based on card type
      let remainingMonthlyBonusPoints: number | undefined;
      
      // Determine the card's monthly cap
      let monthlyCap = 0;
      if (paymentMethod.issuer === 'UOB') {
        if (paymentMethod.name === 'Preferred Visa Platinum') {
          monthlyCap = 4000;
        } 
        else if (paymentMethod.name === 'Visa Signature') {
          monthlyCap = 8000;
        }
        else if (paymentMethod.name === 'Lady\'s Solitaire') {
          monthlyCap = 7200;
        }
      }
      else if (paymentMethod.issuer === 'Citibank' && paymentMethod.name === 'Rewards Visa Signature') {
        monthlyCap = 4000;
      }
      else if (paymentMethod.issuer === 'TD' && paymentMethod.name === 'Aeroplan Visa Infinite') {
        // No cap for TD Aeroplan
        monthlyCap = Number.MAX_SAFE_INTEGER;
      }
      else if (paymentMethod.issuer === 'OCBC' && paymentMethod.name === 'Rewards World Mastercard') {
        monthlyCap = 10000;
      }
      
      // Calculate remaining bonus points if there's a cap
      if (monthlyCap > 0 && monthlyCap !== Number.MAX_SAFE_INTEGER) {
        remainingMonthlyBonusPoints = Math.max(0, monthlyCap - usedBonusPoints - result.bonusPoints);
      }
      
      return {
        ...result,
        remainingMonthlyBonusPoints
      };
    } catch (error) {
      console.error('Error in simulatePoints:', error);
      // Fallback to basic calculation
      return {
        totalPoints: Math.floor(amount),
        basePoints: Math.floor(amount),
        bonusPoints: 0
      };
    }
  }
  
  /**
   * Get the points currency for a payment method
   */
  public getPointsCurrency(paymentMethod: PaymentMethod): string {
    if (!paymentMethod) return 'Points';
    
    const cardInfo = CardRegistry.findCard(
      paymentMethod.issuer || '',
      paymentMethod.name || ''
    );
    
    return cardInfo?.pointsCurrency || 
      (paymentMethod.issuer ? `${paymentMethod.issuer} Points` : 'Points');
  }
}

// Export a singleton instance for easy access
export const rewardCalculationService = RewardCalculationService.getInstance();
