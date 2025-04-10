import { useState, useEffect } from 'react';
import { PaymentMethod, PaymentMethodType, Currency, RewardRule } from '@/types';
import { getPaymentMethods as fetchPaymentMethods } from '@/utils/storageUtils';
import { supabase } from '@/integrations/supabase/client';
// Change import from component to service
import { CardRegistry } from '@/services/rewards/CardRegistry';

// Valid currencies from the Currency type
const validCurrencies: Currency[] = [
  'USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 
  'CNY', 'INR', 'TWD', 'SGD', 'VND', 'IDR', 
  'THB', 'MYR'
];

// Helper function to validate and cast currency
function validateCurrency(value: string): Currency {
  return validCurrencies.includes(value as Currency) ? 
    (value as Currency) : 'SGD'; // Default to SGD if invalid
}

// Helper function to ensure a value is an array
function ensureArray(value: any): any[] {
  if (Array.isArray(value)) {
    return value;
  }
  if (value && typeof value === 'object') {
    return [value];
  }
  return [];
}

// Helper function to transform reward rules
function transformRewardRules(rules: any): RewardRule[] {
  // Ensure rules is an array
  const rulesArray = ensureArray(rules);
  
  if (rulesArray.length === 0) return [];
  
  return rulesArray.map(rule => ({
    id: rule.id || String(Math.random()),
    name: rule.name || 'Unnamed Rule',
    description: rule.description || '',
    type: rule.type || 'generic' as 'generic', // Type assertion to make sure it matches RewardRule.type
    condition: rule.condition || [],
    pointsMultiplier: Number(rule.points_multiplier || rule.pointsMultiplier || 1),
    minSpend: rule.min_spend !== undefined ? Number(rule.min_spend) : 
              rule.minSpend !== undefined ? Number(rule.minSpend) : undefined,
    maxSpend: rule.max_spend !== undefined ? Number(rule.max_spend) : 
              rule.maxSpend !== undefined ? Number(rule.maxSpend) : undefined,
    pointsCurrency: rule.points_currency || rule.pointsCurrency
  }));
}

export function usePaymentMethods() {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadPaymentMethods() {
      try {
        setIsLoading(true);
        
        // Ensure card registry is initialized
        const cardRegistry = CardRegistry.getInstance();
        
        // First try to load from database
        try {
          const { data, error } = await supabase
            .from('payment_methods')
            .select('*')
            .order('name', { ascending: true });
            
          if (!error && data && data.length > 0) {
            // Process data from database with proper type casting
            const methods: PaymentMethod[] = data.map(item => ({
              id: item.id,
              name: item.name,
              // Cast string type to PaymentMethodType
              type: (item.type === 'credit_card' || item.type === 'cash') 
                ? item.type as PaymentMethodType 
                : 'credit_card' as PaymentMethodType, // Default to credit_card if invalid
              // Cast string currency to Currency type
              currency: validateCurrency(item.currency),
              color: item.color || '#4f46e5',
              issuer: item.issuer,
              lastFourDigits: item.last_four_digits,
              imageUrl: item.image_url,
              statementStartDay: item.statement_start_day,
              isMonthlyStatement: item.is_monthly_statement,
              selectedCategories: Array.isArray(item.selected_categories) 
                ? item.selected_categories as string[]
                : [],
              active: item.active !== false, // Default to true if undefined
              rewardRules: transformRewardRules(item.reward_rules)
            }));
            
            setPaymentMethods(methods);
            setIsLoading(false);
            return;
          }
        } catch (dbError) {
          console.log('Database fetch failed, falling back to local storage:', dbError);
        }
        
        // If database fetch fails, try local storage
        const methods = await fetchPaymentMethods();
        setPaymentMethods(methods);
      } catch (err) {
        console.error('Failed to load payment methods:', err);
        setError('Failed to load payment methods');
      } finally {
        setIsLoading(false);
      }
    }

    loadPaymentMethods();
  }, []);

  return { paymentMethods, isLoading, error };
}
