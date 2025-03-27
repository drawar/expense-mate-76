import React from 'react';
import { BaseRewardCard, BaseRewardCardProps, RewardRule, BonusPointsCap, MonthlyCap } from './BaseRewardCard';
import { RuleConfiguration, CardRuleService } from './CardRuleService';

/**
 * Extended props interface for DynamicRewardCard
 */
export interface DynamicRewardCardProps extends BaseRewardCardProps {
  usedBonusPoints: number;
  ruleConfigurations: RuleConfiguration[];
}

/**
 * A card implementation that can be dynamically configured at runtime
 * using rule configurations from database or user preferences
 */
export class DynamicRewardCard extends BaseRewardCard<DynamicRewardCardProps> {
  private readonly ruleService = new CardRuleService();
  private readonly rules: RewardRule[] = [];
  private readonly config: RuleConfiguration;
  
  constructor(props: DynamicRewardCardProps) {
    super(props);
    
    // Find the first enabled rule configuration
    this.config = props.ruleConfigurations.find(rule => rule.enabled) || {
      id: 'default',
      name: 'Default Rule',
      description: 'Default fallback rule',
      cardType: 'generic',
      enabled: true,
      rounding: 'floor',
      basePointRate: 0.4,
      bonusPointRate: 0,
      monthlyCap: 0,
      isOnlineOnly: false,
      isContactlessOnly: false,
      includedMCCs: [],
      excludedMCCs: []
    };
    
    // Convert all enabled rule configurations to actual rule objects
    props.ruleConfigurations
      .filter(rule => rule.enabled)
      .forEach(ruleConfig => {
        const ruleObjects = this.ruleService.convertToRewardRule(ruleConfig);
        this.rules.push(...ruleObjects);
      });
  }
  
  /**
   * Apply the configured rounding logic
   */
  calculateRoundedAmount(amount: number): number {
    switch (this.config.rounding) {
      case 'floor':
        return Math.floor(amount);
      case 'ceiling':
        return Math.ceil(amount);
      case 'nearest5':
        return Math.floor(amount / 5) * 5;
      case 'nearest':
      default:
        return Math.round(amount);
    }
  }
  
  /**
   * Apply the configured base points rate
   */
  calculateBasePoints(roundedAmount: number): number {
    return Math.round(roundedAmount * this.config.basePointRate);
  }
  
  /**
   * Check eligibility based on all configured rules
   */
  getBonusPointsEligibility(props: DynamicRewardCardProps): boolean {
    if (this.rules.length === 0) {
      return false;
    }
    
    // If any rule indicates eligibility, the transaction is eligible
    return this.rules.some(rule => rule.isEligible(props));
  }
  
  /**
   * Apply the configured bonus points rate
   */
  calculateBonusPoints(roundedAmount: number): number {
    return Math.round(roundedAmount * this.config.bonusPointRate);
  }
  
  /**
   * Use the configured monthly cap
   */
  getBonusPointsCap(): BonusPointsCap {
    return new MonthlyCap(this.config.monthlyCap);
  }
}

/**
 * Registry of card types and their configurations
 * This demonstrates how cards can be dynamically created from configurations
 */
export class CardRegistry {
  private static _instance: CardRegistry;
  private cardTypes = new Map<string, React.ComponentType<BaseRewardCardProps>>();
  private ruleService = new CardRuleService();
  
  private constructor() {
    // Initialize registry with known card types
  }
  
  public static get instance(): CardRegistry {
    if (!CardRegistry._instance) {
      CardRegistry._instance = new CardRegistry();
    }
    return CardRegistry._instance;
  }
  
  /**
   * Registers a card type to be available for creation
   */
  registerCardType(
    cardType: string, 
    component: React.ComponentType<BaseRewardCardProps>
  ): void {
    this.cardTypes.set(cardType, component);
  }
  
  /**
   * Creates a component for the specified card type and props
   */
  createCardComponent(
    cardType: string, 
    props: BaseRewardCardProps
  ): React.ReactElement | null {
    const CardComponent = this.cardTypes.get(cardType);
    
    if (!CardComponent) {
      console.error(`Card type '${cardType}' is not registered`);
      return null;
    }
    
    return <CardComponent {...props} />;
  }
  
  /**
   * Creates a dynamic card from rule configurations
   */
  async createDynamicCard(
    cardId: string, 
    props: BaseRewardCardProps
  ): Promise<React.ReactElement | null> {
    // In a real implementation, this would load the card's
    // configurations from a database or API
    await this.ruleService.loadRules();
    
    // Get all rules for this card
    const cardRules = await this.ruleService.getRulesForCardType(cardId);
    
    if (cardRules.length === 0) {
      console.error(`No rules found for card '${cardId}'`);
      return null;
    }
    
    // Create props for the dynamic card including its rules
    const dynamicProps: DynamicRewardCardProps = {
      ...props,
      usedBonusPoints: props.usedBonusPoints || 0,
      ruleConfigurations: cardRules
    };
    
    return <DynamicRewardCard {...dynamicProps} />;
  }
}

/**
 * Example usage showing how to create a card dynamically
 */
export const CardExample: React.FC = () => {
  const registry = CardRegistry.instance;
  
  // Register known card types
  // In a real app, this would be done at app initialization
  
  // Example of creating a card component
  const createExampleCard = async () => {
    const cardProps = {
      amount: 100,
      mcc: '5411', // Grocery store
      isOnline: true,
      usedBonusPoints: 0
    };
    
    // Create a dynamic card from user configurations
    const dynamicCard = await registry.createDynamicCard('CitibankRewards', cardProps);
    
    return dynamicCard;
  };
  
  // This would be used in a real component
  return null;
};