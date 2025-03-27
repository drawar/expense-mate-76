import React from 'react';
import { BaseRewardCard, BaseRewardCardProps, MonthlyCap, TieredRateConfig } from './BaseRewardCard';

/**
 * Extended props interface for AmexCobaltCard
 */
export interface AmexCobaltCardProps extends BaseRewardCardProps {
  usedBonusPoints: number;
  merchantName?: string;
  monthlySpendByCategory: Record<string, number>; // Track spending by category
}

/**
 * American Express Cobalt Card Implementation
 * 
 * Card features:
 * - Issuer: American Express
 * - Currency: CAD
 * - Card Network: American Express
 * - Card Type: Credit Card
 * - Card Name: Cobalt
 * - Points are rounded to nearest whole point
 * - Multiple tiered earn rates based on category and merchant:
 *   - 5x points for dining, grocery, and food delivery (max $2500 CAD/month)
 *   - 3x points for eligible streaming subscriptions
 *   - 2x points for travel and transit
 *   - 1x points for everything else
 */
export class AmexCobaltCard extends BaseRewardCard<AmexCobaltCardProps> {
  // Define tiered reward rates
  private readonly tiers: TieredRateConfig[] = [
    // 5x points for dining/grocery/food delivery up to $2500/month
    {
      category: 'dining',
      rate: 5,
      mccList: ['5811', '5812', '5814'], // Restaurants
      monthlyCap: 2500,
      rateAfterCap: 1
    },
    {
      category: 'grocery',
      rate: 5,
      mccList: ['5411'], // Grocery stores
      monthlyCap: 2500,
      rateAfterCap: 1
    },
    {
      category: 'food_delivery',
      rate: 5,
      mccList: ['5499'], // Food delivery
      monthlyCap: 2500,
      rateAfterCap: 1
    },
    // 3x points for streaming
    {
      category: 'streaming',
      rate: 3,
      merchantNames: [
        'Apple TV+', 'Apple Music', 'Crave', 'Disney+', 'fuboTV',
        'hayu', 'Netflix', 'RDS', 'SiriusXM Canada', 'Spotify', 'TSN'
      ]
    },
    // 2x points for travel and transit
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
        '3200', '3201', '3202', '3203', '3204', '3205', '3206', '3207', '3208', '3209',
        '3210', '3211', '3212', '3213', '3214', '3215', '3216', '3217', '3218', '3219',
        '3220', '3221', '3222', '3223', '3224', '3225', '3226', '3227', '3228', '3229',
        '3230', '3231', '3232', '3233', '3234', '3235', '3236', '3237', '3238', '3239',
        '3240', '3241', '3242', '3243', '3244', '3245', '3246', '3247', '3248', '3249',
        '3250', '3251', '3252', '3253', '3254', '3255', '3256', '3257', '3258', '3259',
        '3260', '3261', '3262', '3263', '3264', '3265', '3266', '3267', '3268', '3269',
        '3270', '3271', '3272', '3273', '3274', '3275', '3276', '3277', '3278', '3279',
        '3280', '3281', '3282', '3283', '3284', '3285', '3286', '3287', '3288', '3289',
        '3290', '3291', '3292', '3293', '3294', '3295', '3296', '3297', '3298', '3299',
        // Hotels
        '7011',
        // Car rentals
        '7512',
        // Travel agencies
        '4722'
      ]
    },
    {
      category: 'transit',
      rate: 2,
      mccList: [
        '4111', '4121', '4789', // Local transit, taxis, transportation services
        '7299', '5734', '4214'  // Other services, computer software, local delivery (ride-sharing apps)
      ]
    },
    {
      category: 'gas',
      rate: 2,
      mccList: [
        '5541', '5542' // Gas stations
      ]
    }
    // All other categories default to 1x (base rate)
  ];

  /**
   * For Amex Cobalt, no rounding is applied to the transaction amount
   * Rounding is applied to the final points (to nearest whole point)
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
   * based on MCC code or merchant name matching tiered rules
   */
  getBonusPointsEligibility(props: AmexCobaltCardProps): boolean {
    const { mcc, merchantName } = props;
    
    // Check against all tiers
    for (const tier of this.tiers) {
      // Check MCC-based categories
      if (tier.mccList && mcc && tier.mccList.includes(mcc)) {
        return true;
      }
      
      // Check merchant name-based categories (e.g., streaming services)
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
    const { mcc, merchantName, monthlySpendByCategory } = props;
    
    let maxBonusRate = 0;
    let applicableTier: TieredRateConfig | undefined;
    
    // Find the applicable tier with the highest rate
    for (const tier of this.tiers) {
      let isEligible = false;
      
      // Check MCC eligibility
      if (tier.mccList && mcc && tier.mccList.includes(mcc)) {
        isEligible = true;
      }
      
      // Check merchant name eligibility
      if (tier.merchantNames && merchantName && tier.merchantNames.includes(merchantName)) {
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
    
    // If this tier has a monthly cap, check if we're approaching or exceeding it
    if (applicableTier.monthlyCap && monthlySpendByCategory) {
      const categorySpend = monthlySpendByCategory[applicableTier.category] || 0;
      
      if (categorySpend >= applicableTier.monthlyCap) {
        // Already reached the cap, use after-cap rate (1x) which means no bonus
        return 0;
      }
      
      // Calculate how much of this transaction fits under the cap
      const remainingBeforeCap = Math.max(0, applicableTier.monthlyCap - categorySpend);
      const amountUnderCap = Math.min(amount, remainingBeforeCap);
      
      // The bonus is (tier rate - base rate) * eligible amount
      // Base rate is always 1x, so bonus is (tier rate - 1) * amount
      return Math.round(amountUnderCap * (applicableTier.rate - 1));
    }
    
    // No monthly cap for this tier
    // The bonus is (tier rate - base rate) * amount
    return Math.round(amount * (applicableTier.rate - 1));
  }

  /**
   * Amex Cobalt doesn't have a global points cap,
   * only per-category monthly spending caps
   */
  getBonusPointsCap(): MonthlyCap {
    return new MonthlyCap(Number.MAX_SAFE_INTEGER);
  }
  
  /**
   * Override the standard calculation to implement Amex's rounding rule
   * and properly handle the tiered rates with category caps
   */
  calculateRewards(): any {
    const props = this.props;
    const { amount, monthlySpendByCategory, mcc, merchantName } = props;
    
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
        
        // Check if approaching category cap
        if (appliedTier.monthlyCap && monthlySpendByCategory) {
          const categorySpend = monthlySpendByCategory[appliedTier.category] || 0;
          const remainingBeforeCap = Math.max(0, appliedTier.monthlyCap - categorySpend - amount);
          
          if (remainingBeforeCap <= 0) {
            bonusPointMessage += " - Monthly cap reached";
          } else if (remainingBeforeCap < 500) {
            bonusPointMessage += ` - Only $${remainingBeforeCap.toFixed(2)} remaining before cap`;
          }
        }
      }
    }
    
    // For Amex, points are rounded to the nearest whole point
    const totalPoints = Math.round(basePoints + bonusPoints);
    
    return {
      basePoints,
      bonusPoints,
      totalPoints,
      bonusPointMessage
    };
  }
  
  /**
   * Helper to find which tier is being applied to the transaction
   */
  private findAppliedTier(props: AmexCobaltCardProps): TieredRateConfig | undefined {
    const { mcc, merchantName } = props;
    
    let maxRateTier: TieredRateConfig | undefined;
    let maxRate = 0;
    
    for (const tier of this.tiers) {
      let isEligible = false;
      
      // Check MCC eligibility
      if (tier.mccList && mcc && tier.mccList.includes(mcc)) {
        isEligible = true;
      }
      
      // Check merchant name eligibility
      if (tier.merchantNames && merchantName && tier.merchantNames.includes(merchantName)) {
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
export const AmexCobaltCardWrapper: React.FC<AmexCobaltCardProps> = (props) => {
  return <AmexCobaltCard {...props} />;
};