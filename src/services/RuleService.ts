
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/integrations/supabase/client';
import { RuleCondition, RuleReward } from './calculators/BaseCalculator';
import { calculatorRegistry } from './calculators/CalculatorRegistry';
import { GenericCardCalculator } from './calculators/GenericCardCalculator';

// Rule definition that combines condition and reward
export interface Rule {
  id: string;
  name: string;
  description?: string;
  cardType: string;
  enabled: boolean;
  condition: RuleCondition;
  reward: RuleReward;
  createdAt: string;
  updatedAt: string;
}

/**
 * Service for managing reward rules
 * This is the central place for creating, updating, and retrieving rules
 */
export class RuleService {
  private rules: Map<string, Rule> = new Map();
  
  /**
   * Load all rules from the database
   */
  public async loadRules(): Promise<Rule[]> {
    try {
      const { data, error } = await supabase
        .from('reward_rules')
        .select('*');
        
      if (error) {
        console.error('Error loading rules:', error);
        return [];
      }
      
      const rules: Rule[] = data.map(item => ({
        id: item.id,
        name: item.name,
        description: item.description,
        cardType: item.card_type,
        enabled: item.enabled,
        condition: item.condition,
        reward: item.reward,
        createdAt: item.created_at,
        updatedAt: item.updated_at
      }));
      
      // Store rules in memory
      rules.forEach(rule => {
        this.rules.set(rule.id, rule);
      });
      
      // Update calculators with the rules
      this.updateCalculatorsWithRules(rules);
      
      return rules;
    } catch (error) {
      console.error('Error loading rules:', error);
      return [];
    }
  }
  
  /**
   * Create a new rule
   */
  public async createRule(rule: Omit<Rule, 'id' | 'createdAt' | 'updatedAt'>): Promise<Rule | null> {
    try {
      const newRule: Rule = {
        ...rule,
        id: uuidv4(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      const { error } = await supabase
        .from('reward_rules')
        .insert({
          id: newRule.id,
          name: newRule.name,
          description: newRule.description,
          card_type: newRule.cardType,
          enabled: newRule.enabled,
          condition: newRule.condition,
          reward: newRule.reward,
          created_at: newRule.createdAt,
          updated_at: newRule.updatedAt
        });
        
      if (error) {
        console.error('Error creating rule:', error);
        return null;
      }
      
      // Store in memory
      this.rules.set(newRule.id, newRule);
      
      // Update calculator
      this.addRuleToCalculator(newRule);
      
      return newRule;
    } catch (error) {
      console.error('Error creating rule:', error);
      return null;
    }
  }
  
  /**
   * Update an existing rule
   */
  public async updateRule(id: string, rule: Partial<Omit<Rule, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Rule | null> {
    try {
      const existingRule = this.rules.get(id);
      if (!existingRule) {
        console.error('Rule not found:', id);
        return null;
      }
      
      const updatedRule: Rule = {
        ...existingRule,
        ...rule,
        updatedAt: new Date().toISOString()
      };
      
      const { error } = await supabase
        .from('reward_rules')
        .update({
          name: updatedRule.name,
          description: updatedRule.description,
          card_type: updatedRule.cardType,
          enabled: updatedRule.enabled,
          condition: updatedRule.condition,
          reward: updatedRule.reward,
          updated_at: updatedRule.updatedAt
        })
        .eq('id', id);
        
      if (error) {
        console.error('Error updating rule:', error);
        return null;
      }
      
      // Update in memory
      this.rules.set(id, updatedRule);
      
      // Update calculator
      this.updateRuleInCalculator(updatedRule);
      
      return updatedRule;
    } catch (error) {
      console.error('Error updating rule:', error);
      return null;
    }
  }
  
  /**
   * Delete a rule
   */
  public async deleteRule(id: string): Promise<boolean> {
    try {
      const rule = this.rules.get(id);
      if (!rule) {
        console.error('Rule not found:', id);
        return false;
      }
      
      const { error } = await supabase
        .from('reward_rules')
        .delete()
        .eq('id', id);
        
      if (error) {
        console.error('Error deleting rule:', error);
        return false;
      }
      
      // Remove from memory
      this.rules.delete(id);
      
      // Remove from calculator
      this.removeRuleFromCalculator(rule);
      
      return true;
    } catch (error) {
      console.error('Error deleting rule:', error);
      return false;
    }
  }
  
  /**
   * Get all rules for a specific card type
   */
  public getRulesForCardType(cardType: string): Rule[] {
    return Array.from(this.rules.values())
      .filter(rule => rule.cardType === cardType && rule.enabled);
  }
  
  /**
   * Get a rule by ID
   */
  public getRule(id: string): Rule | undefined {
    return this.rules.get(id);
  }
  
  /**
   * Get all rules
   */
  public getAllRules(): Rule[] {
    return Array.from(this.rules.values());
  }
  
  /**
   * Update calculators with rules
   */
  private updateCalculatorsWithRules(rules: Rule[]): void {
    // Group rules by card type
    const rulesByCardType: { [key: string]: Rule[] } = {};
    
    rules.forEach(rule => {
      if (!rulesByCardType[rule.cardType]) {
        rulesByCardType[rule.cardType] = [];
      }
      
      if (rule.enabled) {
        rulesByCardType[rule.cardType].push(rule);
      }
    });
    
    // Update each calculator
    Object.entries(rulesByCardType).forEach(([cardType, cardRules]) => {
      // Get or create calculator
      let calculator = calculatorRegistry.getCalculatorForCard(cardType) as GenericCardCalculator;
      
      if (!calculator) {
        calculator = new GenericCardCalculator();
        calculatorRegistry.register(cardType, calculator);
      }
      
      // Clear existing rules and add new ones
      cardRules.forEach(rule => {
        calculator.addRule(
          rule.id,
          rule.condition,
          rule.reward.basePointRate,
          rule.reward.bonusPointRate,
          rule.reward.monthlyCap
        );
      });
    });
  }
  
  /**
   * Add a rule to the appropriate calculator
   */
  private addRuleToCalculator(rule: Rule): void {
    if (!rule.enabled) return;
    
    let calculator = calculatorRegistry.getCalculatorForCard(rule.cardType) as GenericCardCalculator;
    
    if (!calculator) {
      calculator = new GenericCardCalculator();
      calculatorRegistry.register(rule.cardType, calculator);
    }
    
    calculator.addRule(
      rule.id,
      rule.condition,
      rule.reward.basePointRate,
      rule.reward.bonusPointRate,
      rule.reward.monthlyCap
    );
  }
  
  /**
   * Update a rule in the calculator
   */
  private updateRuleInCalculator(rule: Rule): void {
    // Remove the rule first
    this.removeRuleFromCalculator(rule);
    
    // Add it back if enabled
    if (rule.enabled) {
      this.addRuleToCalculator(rule);
    }
  }
  
  /**
   * Remove a rule from the calculator
   */
  private removeRuleFromCalculator(rule: Rule): void {
    const calculator = calculatorRegistry.getCalculatorForCard(rule.cardType) as GenericCardCalculator;
    
    if (calculator) {
      calculator.removeRule(rule.id);
    }
  }
}

// Export a singleton instance
export const ruleService = new RuleService();
