
import React from 'react';
import { BaseRewardCard, BaseRewardCardProps, MonthlyCap } from './BaseRewardCard';

// Props interface for the OCBC Rewards World Mastercard
interface OCBCRewardsWorldCardProps extends BaseRewardCardProps {
  // Any additional props specific to this card
}

// OCBC Rewards World Mastercard reward calculation
export class OCBCRewardsWorldCard extends BaseRewardCard<OCBCRewardsWorldCardProps> {
  // Round down transaction amount to nearest $5
  calculateRoundedAmount(amount: number): number {
    return Math.floor(amount / 5) * 5;
  }

  // Calculate base points - 2x per $5 spent, applies to all transactions
  calculateBasePoints(roundedAmount: number): number {
    return Math.round(roundedAmount * 2);
  }

  // Check if transaction is eligible for Tier-1 or Tier-2 bonus points
  getBonusPointsEligibility(props: OCBCRewardsWorldCardProps): boolean {
    const { mcc, merchantName } = props;
    
    // Tier-1 eligible MCCs
    const tier1MCCs = ['5309', '5611', '5621', '5641', '5651', '5655', '5661', '5691', '5699', '5941', '5948'];
    
    // Tier-1 eligible merchants
    const tier1Merchants = [
      'Alibaba', 'AliExpress', 'Amazon', 'Daigou', 'Ezbuy', 'Guardian', 
      'Lazada', 'Mustafa Centre', 'NTUC Unity', 'Qoo10', 'Shopee', 'Taobao', 'TikTok Shop'
    ];
    
    // Tier-2 eligible MCCs
    const tier2MCCs = ['5311'];
    
    // Tier-2 eligible merchants
    const tier2Merchants = ['Watsons'];
    
    // Check if transaction MCC or merchant name matches eligibility criteria
    const isTier1Eligible = 
      (mcc && tier1MCCs.includes(mcc)) || 
      (merchantName && tier1Merchants.some(merchant => 
        merchantName.toLowerCase().includes(merchant.toLowerCase())
      ));
    
    const isTier2Eligible = 
      (mcc && tier2MCCs.includes(mcc)) || 
      (merchantName && tier2Merchants.some(merchant => 
        merchantName.toLowerCase().includes(merchant.toLowerCase())
      ));
    
    return isTier1Eligible || isTier2Eligible;
  }

  // Calculate bonus points based on tier eligibility
  calculateBonusPoints(roundedAmount: number): number {
    const { mcc, merchantName } = this.props;
    
    // Tier-1 eligible MCCs
    const tier1MCCs = ['5309', '5611', '5621', '5641', '5651', '5655', '5661', '5691', '5699', '5941', '5948'];
    
    // Tier-1 eligible merchants
    const tier1Merchants = [
      'Alibaba', 'AliExpress', 'Amazon', 'Daigou', 'Ezbuy', 'Guardian', 
      'Lazada', 'Mustafa Centre', 'NTUC Unity', 'Qoo10', 'Shopee', 'Taobao', 'TikTok Shop'
    ];
    
    // Tier-2 eligible MCCs
    const tier2MCCs = ['5311'];
    
    // Tier-2 eligible merchants
    const tier2Merchants = ['Watsons'];
    
    // Check if transaction MCC or merchant name matches tier-1 criteria
    const isTier1Eligible = 
      (mcc && tier1MCCs.includes(mcc)) || 
      (merchantName && tier1Merchants.some(merchant => 
        merchantName.toLowerCase().includes(merchant.toLowerCase())
      ));
    
    // Check if transaction MCC or merchant name matches tier-2 criteria
    const isTier2Eligible = 
      (mcc && tier2MCCs.includes(mcc)) || 
      (merchantName && tier2Merchants.some(merchant => 
        merchantName.toLowerCase().includes(merchant.toLowerCase())
      ));
    
    // Calculate bonus points based on tier
    if (isTier2Eligible) {
      // Tier-2: 28x per $5 spent
      return Math.round(roundedAmount * 28);
    } else if (isTier1Eligible) {
      // Tier-1: 18x per $5 spent
      return Math.round(roundedAmount * 18);
    }
    
    return 0; // No bonus points for non-eligible transactions
  }

  // Define the cap on bonus points (10,000 per calendar month)
  getBonusPointsCap() {
    return new MonthlyCap(10000);
  }

  // Custom render method with additional information
  render() {
    const rewards = this.calculateRewards();
    const { mcc, merchantName } = this.props;
    
    // Determine which tier (if any) the transaction falls into
    let tierLabel = "Not eligible for bonus";
    
    // Tier-1 eligible MCCs
    const tier1MCCs = ['5309', '5611', '5621', '5641', '5651', '5655', '5661', '5691', '5699', '5941', '5948'];
    
    // Tier-1 eligible merchants
    const tier1Merchants = [
      'Alibaba', 'AliExpress', 'Amazon', 'Daigou', 'Ezbuy', 'Guardian', 
      'Lazada', 'Mustafa Centre', 'NTUC Unity', 'Qoo10', 'Shopee', 'Taobao', 'TikTok Shop'
    ];
    
    // Tier-2 eligible MCCs
    const tier2MCCs = ['5311'];
    
    // Tier-2 eligible merchants
    const tier2Merchants = ['Watsons'];
    
    const isTier1Eligible = 
      (mcc && tier1MCCs.includes(mcc)) || 
      (merchantName && tier1Merchants.some(merchant => 
        merchantName.toLowerCase().includes(merchant.toLowerCase())
      ));
    
    const isTier2Eligible = 
      (mcc && tier2MCCs.includes(mcc)) || 
      (merchantName && tier2Merchants.some(merchant => 
        merchantName.toLowerCase().includes(merchant.toLowerCase())
      ));
    
    if (isTier2Eligible) {
      tierLabel = "Tier 2 (28x)";
    } else if (isTier1Eligible) {
      tierLabel = "Tier 1 (18x)";
    }
    
    return (
      <div className="rounded-md bg-orange-50 dark:bg-orange-900/20 p-3 space-y-2">
        <p className="text-sm font-medium text-orange-600 dark:text-orange-400">
          OCBC Rewards World Mastercard
        </p>
        <p className="text-sm font-medium text-orange-600 dark:text-orange-400">
          Base Points: {rewards.basePoints} (2x)
        </p>
        <p className="text-sm font-medium text-orange-600 dark:text-orange-400">
          Bonus Points: {rewards.bonusPoints} <span className="text-xs">({tierLabel})</span>
          {rewards.bonusPointMessage}
        </p>
        <p className="text-sm text-orange-500 dark:text-orange-300">
          Total Points: {rewards.totalPoints}
        </p>
        {rewards.remainingBonusPoints !== undefined && (
          <p className="text-xs text-green-500">
            Remaining bonus points available this month: {rewards.remainingBonusPoints}
          </p>
        )}
      </div>
    );
  }
}

// Wrapper component for ease of use
export const OCBCRewardsWorldCardWrapper: React.FC<OCBCRewardsWorldCardProps> = (props) => {
  return <OCBCRewardsWorldCard {...props} />;
};
