import { Transaction, PaymentMethod } from "@/types";
import { 
  CalculationInput, 
  CalculationResult, 
  RewardRule,
  RuleCondition,
  BonusTier,
  RoundingStrategy
} from "@/types";
import { TransactionType } from "./types";
import { RuleRepository } from "./RuleRepository";
import { CardRegistry } from "./CardRegistry";
import { MonthlySpendingTracker } from "./MonthlySpendingTracker";

export class RewardService {
  private static instance: RewardService;
  private ruleRepository: RuleRepository;
  private cardRegistry: CardRegistry;
  private monthlySpendingTracker: MonthlySpendingTracker;
  private initialized = false;
  
  private constructor() {
    this.ruleRepository = RuleRepository.getInstance();
    this.cardRegistry = CardRegistry.getInstance();
    this.monthlySpendingTracker = MonthlySpendingTracker.getInstance();
  }
  
  public static getInstance(): RewardService {
    if (!RewardService.instance) {
      RewardService.instance = new RewardService();
    }
    return RewardService.instance;
  }
  
  public async initialize(): Promise<void> {
    if (!this.initialized) {
      console.log('RewardService: Initializing...');
      await this.ruleRepository.loadRules();
      this.initialized = true;
      console.log('RewardService: Initialized successfully');
    }
  }

  public isInitialized(): boolean {
    return this.initialized;
  }
  
  public async calculatePoints(
    transaction: Transaction,
    usedBonusPoints: number = 0
  ): Promise<CalculationResult> {
    if (!this.initialized) {
      await this.initialize();
    }
    
    const input = await this.createCalculationInput(
      transaction,
      usedBonusPoints
    );
    
    const rules = await this.getRulesForPaymentMethod(transaction.paymentMethod);
    
    return this.calculateRewards(input, rules);
  }
  
  public async simulatePoints(
    amount: number,
    currency: string,
    paymentMethod: PaymentMethod,
    mcc?: string,
    merchantName?: string,
    isOnline?: boolean,
    isContactless?: boolean,
    usedBonusPoints: number = 0
  ): Promise<CalculationResult> {
    if (!this.initialized) {
      await this.initialize();
    }
    
    let transactionType: TransactionType;
    if (isOnline) {
      transactionType = TransactionType.ONLINE;
    } else if (isContactless) {
      transactionType = TransactionType.CONTACTLESS;
    } else {
      transactionType = TransactionType.IN_STORE;
    }
    
    const monthlySpend = await this.monthlySpendingTracker.getMonthlySpending(
      paymentMethod.id,
      'calendar_month',
      new Date(),
      paymentMethod.statementStartDay
    );
    
    const input: CalculationInput = {
      amount,
      currency,
      mcc,
      merchantName,
      transactionType,
      usedBonusPoints,
      monthlySpend,
      paymentMethod,
      date: new Date(),
      statementDay: paymentMethod.statementStartDay
    };
    
    const rules = await this.getRulesForPaymentMethod(paymentMethod);
    
    return this.calculateRewards(input, rules);
  }
  
  public getPointsCurrency(paymentMethod: PaymentMethod): string {
    const cardType = this.cardRegistry.getCardTypeByIssuerAndName(
      paymentMethod.issuer || '',
      paymentMethod.name || ''
    );
    
    if (cardType) {
      return cardType.pointsCurrency;
    }
    
    if (paymentMethod.issuer) {
      return `${paymentMethod.issuer} Points`;
    }
    
    return 'Points';
  }
  
  private async createCalculationInput(
    transaction: Transaction,
    usedBonusPoints: number
  ): Promise<CalculationInput> {
    let transactionType: TransactionType;
    if (transaction.merchant?.isOnline) {
      transactionType = TransactionType.ONLINE;
    } else if (transaction.isContactless) {
      transactionType = TransactionType.CONTACTLESS;
    } else {
      transactionType = TransactionType.IN_STORE;
    }
    
    const monthlySpend = await this.monthlySpendingTracker.getMonthlySpending(
      transaction.paymentMethod.id,
      'calendar_month',
      new Date(transaction.date),
      transaction.paymentMethod.statementStartDay
    );
    
    return {
      amount: transaction.amount,
      currency: transaction.currency,
      mcc: transaction.merchant?.mcc?.code,
      merchantName: transaction.merchant?.name,
      transactionType,
      usedBonusPoints,
      monthlySpend,
      paymentMethod: transaction.paymentMethod,
      date: new Date(transaction.date),
      statementDay: transaction.paymentMethod.statementStartDay
    };
  }
  
  private async getRulesForPaymentMethod(paymentMethod: PaymentMethod): Promise<RewardRule[]> {
    let cardTypeId: string | undefined;
    
    if (paymentMethod.issuer && paymentMethod.name) {
      const cardType = this.cardRegistry.getCardTypeByIssuerAndName(
        paymentMethod.issuer,
        paymentMethod.name
      );
      
      if (cardType) {
        cardTypeId = cardType.id;
      } else {
        cardTypeId = `${paymentMethod.issuer.toLowerCase()}-${paymentMethod.name.toLowerCase().replace(/\s+/g, '-')}`;
      }
    } else {
      cardTypeId = paymentMethod.id;
    }
    
    const rules = await this.ruleRepository.getRulesForCardType(cardTypeId);
    
    if (rules.length === 0 && paymentMethod.rewardRules && paymentMethod.rewardRules.length > 0) {
      return paymentMethod.rewardRules.map(legacyRule => 
        this.convertLegacyRule(legacyRule, cardTypeId || 'unknown')
      );
    }
    
    if (rules.length === 0) {
      const cardType = this.cardRegistry.getCardTypeByIssuerAndName(
        paymentMethod.issuer || '',
        paymentMethod.name || ''
      );
      
      if (cardType && cardType.defaultRules && cardType.defaultRules.length > 0) {
        return cardType.defaultRules;
      }
    }
    
    if (paymentMethod.selectedCategories && paymentMethod.selectedCategories.length > 0) {
      return this.applySelectedCategories(rules, paymentMethod.selectedCategories);
    }
    
    return rules;
  }
  
  private convertLegacyRule(legacyRule: any, cardTypeId: string): RewardRule {
    const now = new Date();
    return {
      id: legacyRule.id || crypto.randomUUID(),
      cardTypeId,
      name: legacyRule.name || 'Legacy Rule',
      description: legacyRule.description || '',
      enabled: true,
      priority: legacyRule.priority || 10,
      conditions: this.convertLegacyConditions(legacyRule),
      reward: {
        calculationMethod: 'standard',
        baseMultiplier: legacyRule.baseMultiplier || 1,
        bonusMultiplier: legacyRule.bonusMultiplier || 0,
        pointsRoundingStrategy: 'floor',
        amountRoundingStrategy: 'floor',
        blockSize: legacyRule.blockSize || 1,
        monthlyCap: legacyRule.monthlyCap,
        pointsCurrency: legacyRule.pointsCurrency || 'Points'
      },
      createdAt: now,
      updatedAt: now
    };
  }
  
  private convertLegacyConditions(legacyRule: any): any[] {
    const conditions: any[] = [];
    
    if (legacyRule.conditionType === 'online') {
      conditions.push({
        type: 'transaction_type',
        operation: 'equals',
        values: [TransactionType.ONLINE]
      });
    } else if (legacyRule.conditionType === 'mcc') {
      conditions.push({
        type: 'mcc',
        operation: 'include',
        values: Array.isArray(legacyRule.mccCodes) ? legacyRule.mccCodes : []
      });
    }
    
    return conditions;
  }
  
  private applySelectedCategories(rules: RewardRule[], selectedCategories: string[]): RewardRule[] {
    return rules.map(rule => {
      const updatedRule = JSON.parse(JSON.stringify(rule));
      
      updatedRule.conditions = rule.conditions.map((condition: RuleCondition) => {
        if (condition.type === 'category') {
          return {
            ...condition,
            values: selectedCategories
          };
        }
        return condition;
      });
      
      return updatedRule;
    });
  }
  
  private calculateRewards(input: CalculationInput, rules: RewardRule[]): CalculationResult {
    const enabledRules = rules.filter(rule => rule.enabled);
    
    enabledRules.sort((a, b) => b.priority - a.priority);
    
    const applicableRules = enabledRules.filter(rule => 
      this.evaluateConditions(rule.conditions, input)
    );
    
    if (applicableRules.length === 0) {
      return {
        totalPoints: Math.round(input.amount),
        basePoints: Math.round(input.amount),
        bonusPoints: 0,
        pointsCurrency: input.paymentMethod.issuer ? `${input.paymentMethod.issuer} Points` : 'Points',
        minSpendMet: false,
        messages: ['No specific reward rules applied']
      };
    }
    
    const rule = applicableRules[0];
    
    const minSpendMet = this.isMinimumSpendMet(rule, input);
    
    let appliedTier: BonusTier | undefined;
    let effectiveMultiplier = rule.reward.bonusMultiplier;

    if (rule.reward.bonusTiers && rule.reward.bonusTiers.length > 0 && minSpendMet) {
      const matchingTiers = rule.reward.bonusTiers
        .filter(tier => this.evaluateCondition(tier.condition, input))
        .sort((a, b) => b.priority - a.priority);
      
      if (matchingTiers.length > 0) {
        appliedTier = matchingTiers[0];
        effectiveMultiplier = appliedTier.multiplier;
      }
    }
    
    let basePoints: number, bonusPoints: number;
    
    if (rule.reward.calculationMethod === 'standard') {
      const roundedAmount = this.applyRounding(
        input.amount, 
        rule.reward.amountRoundingStrategy
      );
      
      const pointsPerBlock = roundedAmount / rule.reward.blockSize;
      
      basePoints = this.applyRounding(
        pointsPerBlock * rule.reward.baseMultiplier, 
        rule.reward.pointsRoundingStrategy
      );
      
      if (minSpendMet) {
        bonusPoints = this.applyRounding(
          pointsPerBlock * effectiveMultiplier,
          rule.reward.pointsRoundingStrategy
        );
      } else {
        bonusPoints = 0;
      }
    } else {
      basePoints = this.applyRounding(
        input.amount * rule.reward.baseMultiplier,
        rule.reward.pointsRoundingStrategy
      );
      
      if (minSpendMet) {
        const totalPoints = this.applyRounding(
          input.amount * (rule.reward.baseMultiplier + effectiveMultiplier),
          rule.reward.pointsRoundingStrategy
        );
        
        bonusPoints = totalPoints - basePoints;
      } else {
        bonusPoints = 0;
      }
    }
    
    let actualBonusPoints = bonusPoints;
    let remainingMonthlyBonusPoints;
    
    if (rule.reward.monthlyCap && rule.reward.monthlyCap > 0 && minSpendMet) {
      const usedBonusPoints = input.usedBonusPoints || 0;
      
      if (usedBonusPoints >= rule.reward.monthlyCap) {
        actualBonusPoints = 0;
        remainingMonthlyBonusPoints = 0;
      } else {
        const remainingCap = rule.reward.monthlyCap - usedBonusPoints;
        if (bonusPoints > remainingCap) {
          actualBonusPoints = remainingCap;
          remainingMonthlyBonusPoints = 0;
        } else {
          remainingMonthlyBonusPoints = remainingCap - bonusPoints;
        }
      }
    }
    
    const messages: string[] = [];
    
    if (!minSpendMet && rule.reward.monthlyMinSpend) {
      messages.push(`Minimum monthly spend of ${rule.reward.monthlyMinSpend} not met for bonus points`);
    } else if (bonusPoints > 0 && actualBonusPoints === 0) {
      messages.push('Monthly bonus points cap reached');
    } else if (appliedTier) {
      messages.push(`Applied tier: ${appliedTier.name} (${effectiveMultiplier}x)`);
    } else if (rule.description) {
      messages.push(`Applied rule: ${rule.description}`);
    }
    
    return {
      totalPoints: basePoints + actualBonusPoints,
      basePoints,
      bonusPoints: actualBonusPoints,
      pointsCurrency: rule.reward.pointsCurrency,
      remainingMonthlyBonusPoints,
      minSpendMet,
      appliedRule: rule,
      appliedTier,
      messages
    };
  }
  
  private isMinimumSpendMet(rule: RewardRule, input: CalculationInput): boolean {
    if (!rule.reward.monthlyMinSpend || rule.reward.monthlyMinSpend <= 0) {
      return true;
    }
    
    if (!input.monthlySpend) {
      return false;
    }
    
    return input.monthlySpend >= rule.reward.monthlyMinSpend;
  }
  
  private evaluateConditions(conditions: RuleCondition[], input: CalculationInput): boolean {
    if (!conditions || conditions.length === 0) {
      return true;
    }
    
    for (const condition of conditions) {
      if (!this.evaluateCondition(condition, input)) {
        return false;
      }
    }
    
    return true;
  }
  
  private evaluateCondition(condition: RuleCondition, input: CalculationInput): boolean {
    if (condition.type === 'compound') {
      if (!condition.subConditions || condition.subConditions.length === 0) {
        return true;
      }
      
      if (condition.operation === 'all') {
        return condition.subConditions.every(subCondition => 
          this.evaluateCondition(subCondition, input)
        );
      } else if (condition.operation === 'any') {
        return condition.subConditions.some(subCondition => 
          this.evaluateCondition(subCondition, input)
        );
      }
      
      return false;
    }
    
    switch (condition.type) {
      case 'mcc':
        return this.evaluateMccCondition(condition, input);
      
      case 'merchant':
        return this.evaluateMerchantCondition(condition, input);
      
      case 'transaction_type':
        return this.evaluateTransactionTypeCondition(condition, input);
      
      case 'currency':
        return this.evaluateCurrencyCondition(condition, input);
      
      case 'amount':
        return this.evaluateAmountCondition(condition, input);
      
      case 'date':
        return this.evaluateDateCondition(condition, input);
      
      case 'category':
        return this.evaluateCategoryCondition(condition, input);
      
      case 'spend_threshold':
        return this.evaluateSpendThresholdCondition(condition, input);
      
      default:
        return false;
    }
  }
  
  private evaluateMccCondition(condition: RuleCondition, input: CalculationInput): boolean {
    if (!input.mcc || !condition.values) {
      return false;
    }
    
    if (condition.operation === 'include') {
      return (condition.values as string[]).includes(input.mcc);
    } else if (condition.operation === 'exclude') {
      return !(condition.values as string[]).includes(input.mcc);
    }
    
    return false;
  }
  
  private evaluateMerchantCondition(condition: RuleCondition, input: CalculationInput): boolean {
    if (!input.merchantName || !condition.values) {
      return false;
    }
    
    const merchantNameLower = input.merchantName.toLowerCase();
    
    if (condition.operation === 'include') {
      return (condition.values as string[]).some(name => 
        merchantNameLower.includes(name.toLowerCase())
      );
    } else if (condition.operation === 'exclude') {
      return !(condition.values as string[]).some(name => 
        merchantNameLower.includes(name.toLowerCase())
      );
    } else if (condition.operation === 'equals') {
      return (condition.values as string[]).some(name => 
        merchantNameLower === name.toLowerCase()
      );
    }
    
    return false;
  }
  
  private evaluateTransactionTypeCondition(condition: RuleCondition, input: CalculationInput): boolean {
    if (!condition.values) {
      return false;
    }
    
    if (condition.operation === 'equals') {
      return (condition.values as TransactionType[]).includes(input.transactionType);
    } else if (condition.operation === 'not_equals') {
      return !(condition.values as TransactionType[]).includes(input.transactionType);
    }
    
    return false;
  }
  
  private evaluateCurrencyCondition(condition: RuleCondition, input: CalculationInput): boolean {
    if (!condition.values) {
      return false;
    }
    
    if (condition.operation === 'include') {
      return (condition.values as string[]).includes(input.currency);
    } else if (condition.operation === 'exclude') {
      return !(condition.values as string[]).includes(input.currency);
    } else if (condition.operation === 'equals') {
      return input.currency === condition.values[0];
    } else if (condition.operation === 'not_equals') {
      return input.currency !== condition.values[0];
    }
    
    return false;
  }
  
  private evaluateAmountCondition(condition: RuleCondition, input: CalculationInput): boolean {
    if (!condition.values) {
      return false;
    }
    
    const amount = input.amount;
    
    if (condition.operation === 'greater_than') {
      return amount > (condition.values[0] as number);
    } else if (condition.operation === 'less_than') {
      return amount < (condition.values[0] as number);
    } else if (condition.operation === 'between') {
      return amount >= (condition.values[0] as number) && 
             amount <= (condition.values[1] as number);
    } else if (condition.operation === 'equals') {
      return amount === (condition.values[0] as number);
    }
    
    return false;
  }
  
  private evaluateDateCondition(condition: RuleCondition, input: CalculationInput): boolean {
    if (!condition.values || !input.date) {
      return false;
    }
    
    // Simplified implementation
    return true;
  }
  
  private evaluateCategoryCondition(condition: RuleCondition, input: CalculationInput): boolean {
    if (!input.category || !condition.values) {
      return false;
    }
    
    if (condition.operation === 'include') {
      return (condition.values as string[]).includes(input.category);
    } else if (condition.operation === 'exclude') {
      return !(condition.values as string[]).includes(input.category);
    } else if (condition.operation === 'equals') {
      return input.category === condition.values[0];
    }
    
    return false;
  }
  
  private evaluateSpendThresholdCondition(condition: RuleCondition, input: CalculationInput): boolean {
    if (!condition.values || !input.monthlySpend) {
      return false;
    }
    
    const monthlySpend = input.monthlySpend;
    
    if (condition.operation === 'greater_than') {
      return monthlySpend > (condition.values[0] as number);
    } else if (condition.operation === 'less_than') {
      return monthlySpend < (condition.values[0] as number);
    } else if (condition.operation === 'between') {
      return monthlySpend >= (condition.values[0] as number) && 
             monthlySpend <= (condition.values[1] as number);
    } else if (condition.operation === 'equals') {
      return monthlySpend === (condition.values[0] as number);
    }
    
    return false;
  }
  
  private applyRounding(value: number, strategy: RoundingStrategy): number {
    switch (strategy) {
      case 'floor':
        return Math.floor(value);
      
      case 'ceiling':
        return Math.ceil(value);
      
      case 'nearest':
        return Math.round(value);
      
      case 'floor5':
        return Math.floor(value / 5) * 5;
      
      case 'none':
      default:
        return value;
    }
  }
}

// Export a singleton instance
export const rewardService = RewardService.getInstance();
