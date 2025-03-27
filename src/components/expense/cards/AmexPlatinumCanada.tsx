import React from 'react';
import { BaseRewardCard, BaseRewardCardProps, MonthlyCap, TieredRateConfig } from './BaseRewardCard';

/**
 * Extended props interface for AmexPlatinumCanadaCard
 */
export interface AmexPlatinumCanadaCardProps extends BaseRewardCardProps {
  usedBonusPoints: number;
  merchantName?: string;
}

/**
 * American Express Platinum Card (Canada) Implementation
 * 
 * Card features:
 * - Issuer: American Express
 * - Currency: CAD
 * - Card Network: American Express
 * - Card Type: Charge Card
 * - Card Name: Platinum Canada
 * - Points are rounded to the nearest whole point
 * - Multiple tiered earn rates:
 *   - 2X POINTS on dining & food delivery purchases in Canada (MCC + CAD)
 *   - 2X POINTS on travel (MCC only, currency doesn't matter)
 *   - 3X POINTS on hotel and car rental bookings through Amex Travel
 *   - 1X POINTS on everything else
 */
export class AmexPlatinumCanadaCard extends BaseRewardCard<AmexPlatinumCanadaCardProps> {
  // Define tiered reward rates
  private readonly tiers: TieredRateConfig[] = [
    // 3X points for Amex Travel hotel and car rental bookings
    {
      category: 'amex_travel',
      rate: 3,
      merchantNames: ['Amex Travel']
    },
    // 2X points for dining & food delivery in Canada (requires CAD)
    {
      category: 'dining_food_delivery',
      rate: 2,
      mccList: [
        '5811', '5812', '5813', '5814', // Restaurants and dining
        '5499' // Food delivery
      ]
    },
    // 2X points for travel (any currency)
    {
      category: 'travel',
      rate: 2,
      mccList: [
        // Airlines
        '3000', '3001', '3002', '3003', '3004', '3005', '3006', '3007', '3008', '3009',
        '3010', '3011', '3012', '3013', '3014', '3015', '3016', '3017', '3018', '3019',
        '3020', '3021', '3022', '3023', '3024', '3025', '3026', '3027', '3028', '3029',
        '3030', '3031', '3032', '3033', '3034', '3035', '3036', '3037', '3038', '3039',
        '3040', '3041', '3042', '3043', '3044', '3045', '3046', '3047', '3048', '3049',
        '3050', '3051', '3052', '3053', '3054', '3055', '3056', '3057', '3058', '3059',
        '3060', '3061', '3062', '3063', '3064', '3065', '3066', '3067', '3068', '3069',
        '3070', '3071', '3072', '3073', '3074', '3075', '3076', '3077', '3078', '3079',
        '3080', '3081', '3082', '3083', '3084', '3085', '3086', '3087', '3088', '3089',
        '3090', '3091', '3092', '3093', '3094', '3095', '3096', '3097', '3098', '3099',
        '3100', '3101', '3102', '3103', '3104', '3105', '3106', '3107', '3108', '3109',
        '3110', '3111', '3112', '3113', '3114', '3115', '3116', '3117', '3118', '3119',
        '3120', '3121', '3122', '3123', '3124', '3125', '3126', '3127', '3128', '3129',
        '3130', '3131', '3132', '3133', '3134', '3135', '3136', '3137', '3138', '3139',
        '3140', '3141', '3142', '3143', '3144', '3145', '3146', '3147', '3148', '3149',
        '3150', '3151', '3152', '3153', '3154', '3155', '3156', '3157', '3158', '3159',
        '3160', '3161', '3162', '3163', '3164', '3165', '3166', '3167', '3168', '3169',
        '3170', '3171', '3172', '3173', '3174', '3175', '3176', '3177', '3178', '3179',
        '3180', '3181', '3182', '3183', '3184', '3185', '3186', '3187', '3188', '3189',
        '3190', '3191', '3192', '3193', '3194', '3195', '3196', '3197', '3198', '3199',
        // Hotels
        '7011',
        // Car rentals
        '7512',
        // Travel agencies
        '4722',
        // Transportation services
        '4111', '4112', '4121', '4131', '4411', '4457', '4468', '4789' 
      ]
    }
    // All other categories default to 1x (base rate)
  ];

  /**
   * No rounding applied to transaction amount
   */
  calculateRoundedAmount(amount: number): number {
    return amount; // No rounding on amount
  }

  /**
   * Base point calculation: 1 point per dollar for all transactions
   */
  calculateBasePoints(amount: number): number {
    return Math.round(amount * 1);
  }

  /**
   * Determines if a transaction is eligible for bonus points
   * based on MCC code or merchant name matching tiered rules,
   * with special handling for the dining category (requires CAD)
   */
  getBonusPointsEligibility(props: AmexPlatinumCanadaCardProps): boolean {
    const { mcc, merchantName, currency } = props;
    
    // Check against all tiers
    for (const tier of this.tiers) {
      // Special case for dining & food delivery - must be in CAD
      if (tier.category === 'dining_food_delivery' && 
          tier.mccList && mcc && tier.mccList.includes(mcc)) {
        return currency === 'CAD';
      }
      
      // Check MCC-based categories (for travel)
      if (tier.category === 'travel' && 
          tier.mccList && mcc && tier.mccList.includes(mcc)) {
        return true;
      }
      
      // Check merchant name-based categories (for Amex Travel)
      if (tier.merchantNames && merchantName && tier.merchantNames.includes(merchantName)) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Calculates bonus points based on applicable tier
   * If multiple tiers apply, the highest rate wins
   */
  calculateBonusPoints(amount: number): number {
    const props = this.props;
    const { mcc, merchantName, currency } = props;
    
    let maxBonusRate = 0;
    let applicableTier: TieredRateConfig | undefined;
    
    // Find the applicable tier with the highest rate
    for (const tier of this.tiers) {
      let isEligible = false;
      
      // Special case for dining & food delivery
      if (tier.category === 'dining_food_delivery' && 
          tier.mccList && mcc && tier.mccList.includes(mcc) && 
          currency === 'CAD') {
        isEligible = true;
      }
      
      // Travel category - MCC only
      else if (tier.category === 'travel' && 
               tier.mccList && mcc && tier.mccList.includes(mcc)) {
        isEligible = true;
      }
      
      // Merchant name-based (Amex Travel)
      else if (tier.merchantNames && merchantName && tier.merchantNames.includes(merchantName)) {
        isEligible = true;
      }
      
      if (isEligible && tier.rate > maxBonusRate) {
        maxBonusRate = tier.rate;
        applicableTier = tier;
      }
    }
    
    if (!applicableTier) {
      return 0; // No applicable tier, no bonus points
    }
    
    // The bonus is (tier rate - base rate) * amount
    // Base rate is always 1x, so bonus is (tier rate - 1) * amount
    return Math.round(amount * (applicableTier.rate - 1));
  }

  /**
   * No monthly cap on points
   */
  getBonusPointsCap(): MonthlyCap {
    return new MonthlyCap(Number.MAX_SAFE_INTEGER);
  }
  
  /**
   * Override the standard calculation to implement tiered rates
   * and explain the applied rate
   */
  calculateRewards(): any {
    const props = this.props;
    const { amount, currency, mcc, merchantName } = props;
    
    // Calculate base points (always 1x)
    const basePoints = this.calculateBasePoints(amount);
    
    // Find applicable tier and calculate potential bonus
    const isEligible = this.getBonusPointsEligibility(props);
    const bonusPoints = isEligible ? this.calculateBonusPoints(amount) : 0;
    
    // Generate message about the applied rate
    let bonusPointMessage = "";
    if (!isEligible) {
      bonusPointMessage = " (1x rate applied)";
    } else {
      // Find which tier was applied
      const appliedTier = this.findAppliedTier(props);
      if (appliedTier) {
        bonusPointMessage = ` (${appliedTier.rate}x rate applied for ${appliedTier.category})`;
      }
    }
    
    // For Amex, points are rounded to the nearest whole point
    const totalPoints = Math.round(basePoints + bonusPoints);
    
    return {
      basePoints,
      bonusPoints,
      totalPoints,
      bonusPointMessage,
      pointsCurrency: 'MR'
    };
  }
  
  /**
   * Helper to find which tier is being applied to the transaction
   */
  private findAppliedTier(props: AmexPlatinumCanadaCardProps): TieredRateConfig | undefined {
    const { mcc, merchantName, currency } = props;
    
    let maxRateTier: TieredRateConfig | undefined;
    let maxRate = 0;
    
    for (const tier of this.tiers) {
      let isEligible = false;
      
      // Special case for dining & food delivery
      if (tier.category === 'dining_food_delivery' && 
          tier.mccList && mcc && tier.mccList.includes(mcc) && 
          currency === 'CAD') {
        isEligible = true;
      }
      
      // Travel category - MCC only
      else if (tier.category === 'travel' && 
               tier.mccList && mcc && tier.mccList.includes(mcc)) {
        isEligible = true;
      }
      
      // Merchant name-based (Amex Travel)
      else if (tier.merchantNames && merchantName && tier.merchantNames.includes(merchantName)) {
        isEligible = true;
      }
      
      if (isEligible && tier.rate > maxRate) {
        maxRate = tier.rate;
        maxRateTier = tier;
      }
    }
    
    return maxRateTier;
  }
}

/**
 * Functional wrapper component for usage
 */
export const AmexPlatinumCanadaCardWrapper: React.FC<AmexPlatinumCanadaCardProps> = (props) => {
  return <AmexPlatinumCanadaCard {...props} />;
};