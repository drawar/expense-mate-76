
import { useState, useEffect } from 'react';
import { PaymentMethod, RewardRule } from '@/types';
import { getPaymentMethods, savePaymentMethods } from '@/utils/storageUtils';
import { useToast } from '@/hooks/use-toast';
import { CardRegistry } from '@/components/expense/cards/CardRegistry';
import { cardRuleService } from '@/components/expense/cards/CardRuleService';
import { v4 as uuidv4 } from 'uuid';
import { defaultPaymentMethods } from '@/utils/defaults/paymentMethods';

export const usePaymentMethods = () => {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Helper function to check if a payment method needs to be added from defaults
  const findMissingDefaultMethods = (existingMethods: PaymentMethod[]): PaymentMethod[] => {
    const missingMethods: PaymentMethod[] = [];
    
    // Check each default payment method
    defaultPaymentMethods.forEach(defaultMethod => {
      // For credit cards, check by issuer and name
      if (defaultMethod.type === 'credit_card' && defaultMethod.issuer && defaultMethod.name) {
        const exists = existingMethods.some(method => 
          method.issuer?.toLowerCase() === defaultMethod.issuer?.toLowerCase() && 
          method.name.toLowerCase() === defaultMethod.name.toLowerCase()
        );
        
        if (!exists) {
          console.log(`Adding missing card: ${defaultMethod.issuer} ${defaultMethod.name}`);
          missingMethods.push({
            ...defaultMethod,
            id: uuidv4() // Generate a new UUID for the card
          });
        }
      }
      // For cash methods, check by currency
      else if (defaultMethod.type === 'cash') {
        const exists = existingMethods.some(method => 
          method.type === 'cash' && 
          method.currency === defaultMethod.currency
        );
        
        if (!exists) {
          console.log(`Adding missing cash method: ${defaultMethod.name} (${defaultMethod.currency})`);
          missingMethods.push({
            ...defaultMethod,
            id: uuidv4() // Generate a new UUID for the method
          });
        }
      }
    });
    
    return missingMethods;
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('Loading payment methods...');
        let methods = await getPaymentMethods();
        console.log('Payment methods loaded:', methods);
        
        // Check for missing payment methods from defaults
        const missingMethods = findMissingDefaultMethods(methods);
        
        // If any missing methods were found, add them to the database
        if (missingMethods.length > 0) {
          console.log(`Found ${missingMethods.length} missing payment methods, adding them now`);
          methods = [...methods, ...missingMethods];
          await savePaymentMethods(methods);
          toast({
            title: 'Payment Methods Updated',
            description: `Added ${missingMethods.length} new payment method(s)`,
          });
        }
        
        if (!methods || methods.length === 0) {
          console.error('No payment methods found');
          toast({
            title: 'Warning',
            description: 'No payment methods found. Please add some payment methods first.',
            variant: 'destructive',
          });
        } else {
          console.log(`${methods.length} payment methods loaded`, methods);
          
          // Verify CardRegistry structure
          console.log('Card Registry:', {
            firstCard: CardRegistry.getAllCards()[0],
            availableCards: CardRegistry.getAllCards().map(c => c.id),
            methods: Object.getOwnPropertyNames(CardRegistry)
          });
          
          // Load card rules from CardRuleService
          await cardRuleService.loadRules();
          console.log('Card rules loaded');
          
          // Connect card rules to payment methods
          const enhancedMethods = methods.map(method => {
            console.log(`Processing payment method: ${method.issuer} ${method.name} (${method.type})`);
            
            if (method.type === 'credit_card' && method.issuer && method.name) {
              // Find corresponding card in registry
              const cardInfo = CardRegistry.findCard(method.issuer, method.name);
              console.log(`Card match result:`, cardInfo ? {
                id: cardInfo.id,
                issuer: cardInfo.issuer,
                name: cardInfo.name
              } : 'No match found');
              
              if (cardInfo) {
                // Get rules for this card type
                const cardRules = cardRuleService.getRulesForCardType(cardInfo.id);
                console.log(`Rules for ${cardInfo.id}:`, cardRules.length > 0 ? 
                  cardRules.map(r => ({ id: r.id, name: r.name, cardType: r.cardType })) : 
                  'No rules found');
                
                if (cardRules.length > 0) {
                  // Convert card rule configurations to RewardRule objects for UI display
                  const rewardRules: RewardRule[] = cardRules.map(rule => {
                    // Determine the appropriate rule type
                    let ruleType: 'mcc' | 'merchant' | 'currency' | 'spend_threshold' | 'online' | 'contactless' = 'mcc';
                    let condition: string | string[] = '';
                    
                    if (rule.isOnlineOnly) {
                      ruleType = 'online';
                      condition = 'All online transactions';
                    } else if (rule.isContactlessOnly) {
                      ruleType = 'contactless';
                      condition = 'All contactless transactions';
                    } else if (rule.includedMCCs && rule.includedMCCs.length > 0) {
                      ruleType = 'mcc';
                      condition = rule.includedMCCs;
                    } else if (rule.currencyRestrictions && rule.currencyRestrictions.length > 0) {
                      ruleType = 'currency';
                      condition = rule.currencyRestrictions;
                    }
                    
                    const pointsMultiplier = rule.bonusPointRate > 0 
                      ? (rule.bonusPointRate / rule.basePointRate) + 1 // Add 1 to include base rate
                      : 1;
                      
                    return {
                      id: rule.id || uuidv4(),
                      name: rule.name,
                      description: rule.description || rule.name,
                      type: ruleType,
                      condition,
                      pointsMultiplier,
                      maxSpend: rule.monthlyCap > 0 ? rule.monthlyCap : undefined
                    };
                  });
                  
                  console.log(`Created ${rewardRules.length} reward rules for ${method.issuer} ${method.name}`);
                  return { ...method, rewardRules };
                } else {
                  console.log(`No rules found for ${method.issuer} ${method.name}`);
                }
              } else {
                console.log(`No matching card found in registry for ${method.issuer} ${method.name}`);
                
                // Debug: Check if there's a close match with different capitalization
                const allCards = CardRegistry.getAllCards();
                const potentialMatches = allCards.filter(card => 
                  card.issuer.toLowerCase().includes(method.issuer.toLowerCase()) || 
                  method.issuer.toLowerCase().includes(card.issuer.toLowerCase()) ||
                  card.name.toLowerCase().includes(method.name.toLowerCase()) ||
                  method.name.toLowerCase().includes(card.name.toLowerCase())
                );
                
                if (potentialMatches.length > 0) {
                  console.log('Potential matches found:', potentialMatches.map(m => ({
                    id: m.id,
                    issuer: m.issuer,
                    name: m.name,
                    issuerMatch: m.issuer.toLowerCase() === method.issuer.toLowerCase(),
                    nameMatch: m.name.toLowerCase() === method.name.toLowerCase()
                  })));
                }
              }
            }
            return method;
          });
          
          // Update state with enhanced methods
          setPaymentMethods(enhancedMethods);
          
          // Check if any rules were added
          const methodsWithRules = enhancedMethods.filter(m => m.rewardRules && m.rewardRules.length > 0);
          console.log(`${methodsWithRules.length} out of ${enhancedMethods.length} methods have rules`);
          
          // If rules were added, save the updated payment methods
          const hasRulesAdded = enhancedMethods.some((method, index) => 
            method.rewardRules && method.rewardRules.length > 0 && 
            (!methods[index].rewardRules || methods[index].rewardRules.length === 0)
          );
          
          if (hasRulesAdded) {
            console.log('Saving payment methods with updated reward rules');
            await savePaymentMethods(enhancedMethods);
          }
        }
      } catch (error) {
        console.error('Error loading payment methods:', error);
        toast({
          title: 'Error',
          description: 'Failed to load payment methods',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [toast]);

  return { paymentMethods, isLoading };
};
