
// Temporary placeholder for CardRuleService until the actual implementation is created
// This will be used by migrateRewardRules.ts

export class CardRuleService {
  static async migrateRules(): Promise<boolean> {
    console.log('CardRuleService.migrateRules called - implementation needed');
    return true;
  }
  
  static async getDefaultRules(): Promise<any[]> {
    console.log('CardRuleService.getDefaultRules called - implementation needed');
    return [];
  }
}

export default CardRuleService;
