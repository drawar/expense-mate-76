import React from 'react';
import { BaseRewardCard, BaseRewardCardProps, MonthlyCap, RewardRule, RewardRuleFactory } from './BaseRewardCard';

/**
 * Extended props interface for UOBLadysSolitaireCard
 */
export interface UOBLadysSolitaireCardProps extends BaseRewardCardProps {
  usedBonusPoints: number;
  monthTotalEligibleSpend?: number; // Track monthly spend for eligible categories
  selectedCategories: string[]; // The two selected categories
}

/**
 * UOB Lady's Solitaire World MasterCard Implementation
 * 
 * Card features:
 * - Issuer: UOB
 * - Currency: SGD
 * - Card Network: MasterCard
 * - Card Type: World MasterCard
 * - Card Name: Lady's Solitaire
 * - Base points: floor round to nearest $5, then multiply by 0.4
 * - Bonus points: sum all eligible transactions in a calendar month, 
 *   floor round the total to nearest $5, then multiply by 3.6
 * - Eligible transactions determined by MCCs in selected categories (2 categories at any time)
 * - Both selected categories share the same 7200 points monthly cap on bonus points
 */
export class UOBLadysSolitaireCard extends BaseRewardCard<UOBLadysSolitaireCardProps> {
  // Define MCC categories
  private readonly categoryMCCs: Record<string, string[]> = {
    'Beauty & Wellness': ['5912', '5977', '7230', '7231', '7298', '7297', '5912', '5977', '7230', '7231', '7298', '7297'],
    'Dining': ['5811', '5812', '5814', '5499'],
    'Entertainment': ['5813', '7832', '7922'],
    'Family': ['5411', '5641'],
    'Fashion': ['5311', '5611', '5621', '5631', '5651', '5655', '5661', '5691', '5699', '5948'],
    'Transport': ['4111', '4121', '4789', '5541', '5542'],
    'Travel': ['3000', '3001', '3002', '3003', '3004', '3005', '3006', '3007', '3008', '3009', 
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
               '7011', '7512']
  };

  /**
   * Floor round to nearest $5
   */
  calculateRoundedAmount(amount: number): number {
    return Math.floor(amount / 5) * 5;
  }

  /**
   * Base point calculation: 0.4 points per dollar
   */
  calculateBasePoints(roundedAmount: number): number {
    return Math.round(roundedAmount * 0.2);
  }

  /**
   * Determines if a transaction is eligible for bonus points
   * based on its MCC code falling within the selected categories
   */
  getBonusPointsEligibility(props: UOBLadysSolitaireCardProps): boolean {
    if (!props.mcc || !props.selectedCategories || props.selectedCategories.length === 0) {
      return false;
    }
    
    // Check if transaction MCC falls into any selected category
    for (const category of props.selectedCategories) {
      const categoryMCCs = this.categoryMCCs[category] || [];
      if (categoryMCCs.includes(props.mcc)) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Bonus point calculation: 3.6 additional points per dollar
   * Note: In a real implementation, this would be based on monthly aggregated spend
   */
  calculateBonusPoints(roundedAmount: number): number {
    return Math.round(roundedAmount * 1.8);
  }

  /**
   * UOB Lady's Solitaire has a 3600 points monthly cap on bonus points
   * that is shared across both selected categories (not per category)
   */
  getBonusPointsCap(): MonthlyCap {
    return new MonthlyCap(3600);
  }
  
  /**
   * Override the standard calculation to implement monthly aggregation
   */
  calculateRewards(): any {
    const props = this.props;
    const { amount, mcc, monthTotalEligibleSpend = 0, usedBonusPoints = 0 } = props;
    
    // Calculate base points as normal
    const roundedAmount = this.calculateRoundedAmount(amount);
    const basePoints = this.calculateBasePoints(roundedAmount);
    
    // Determine bonus eligibility
    const isEligible = this.getBonusPointsEligibility(props);
    let bonusPointMessage = "";
    
    // For demonstration, we're showing a simplified calculation
    // In a real app, we'd track all eligible transactions across the month
    const updatedMonthlySpend = isEligible ? monthTotalEligibleSpend + amount : monthTotalEligibleSpend;
    const monthlyRoundedSpend = Math.floor(updatedMonthlySpend / 5) * 5;
    
    // Calculate potential bonus (for this transaction only, for demonstration)
    // In a real app, this would be based on the monthly total
    const potentialBonusPoints = isEligible ? Math.round(roundedAmount * 1.8) : 0;
    
    // Apply monthly cap
    const bonusPointsCap = this.getBonusPointsCap();
    const actualBonusPoints = bonusPointsCap.applyCap(potentialBonusPoints, usedBonusPoints);
    
    const remainingBonusPoints = bonusPointsCap.getRemainingBonusPoints(
      usedBonusPoints,
      actualBonusPoints
    );

    // Generate appropriate message
    if (!isEligible) {
      bonusPointMessage = " (Transaction not in selected categories)";
    } else if (potentialBonusPoints > 0 && actualBonusPoints === 0) {
      bonusPointMessage = " (Monthly cap reached)";
    } else if (isEligible) {
      bonusPointMessage = ` (Transaction eligible in ${props.selectedCategories.join(', ')} categories)`;
    }

    return {
      basePoints,
      bonusPoints: actualBonusPoints,
      totalPoints: basePoints + actualBonusPoints,
      remainingBonusPoints,
      bonusPointMessage
    };
  }
}

/**
 * Functional wrapper component for usage
 */
export const UOBLadysSolitaireCardWrapper: React.FC<UOBLadysSolitaireCardProps> = (props) => {
  return <UOBLadysSolitaireCard {...props} />;
};