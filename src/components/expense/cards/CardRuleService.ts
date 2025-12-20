// Implementation of CardRuleService for use by migrateRewardRules.ts

interface CardRule {
  id: string;
  name?: string;
  [key: string]: unknown;
}

export class CardRuleService {
  private static rules: CardRule[] = [];

  static async migrateRules(): Promise<boolean> {
    console.log("CardRuleService.migrateRules called");
    // Implementation would normally load rules from storage
    // For now, we'll just return true to indicate success
    return true;
  }

  static async getDefaultRules(): Promise<CardRule[]> {
    console.log("CardRuleService.getDefaultRules called");
    // Implementation would normally return a list of default rules
    // For now, we'll return an empty array
    return [];
  }

  static getAllRules(): CardRule[] {
    // Return all rules
    return this.rules;
  }
}

export default CardRuleService;
