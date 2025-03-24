
import { PaymentMethod, Currency, RewardRule } from '@/types';
import { defaultPaymentMethods } from '../defaults/paymentMethods';
import { supabase } from '@/integrations/supabase/client';
import { Json } from '@/integrations/supabase/types';

// LocalStorage key for fallback
const PAYMENT_METHODS_KEY = 'expenseTracker_paymentMethods';

// Helper function to convert RewardRule[] to Json for Supabase
const convertRewardRulesToJson = (rules: RewardRule[]): Json => {
  return rules as unknown as Json;
};

// Helper function to convert Json back to RewardRule[]
const convertJsonToRewardRules = (json: Json | null): RewardRule[] => {
  if (!json) return [];
  return json as unknown as RewardRule[];
};

// Helper function to convert conversionRate Record to Json
const convertConversionRateToJson = (rate: Record<Currency, number> | undefined): Json | null => {
  if (!rate) return null;
  return rate as unknown as Json;
};

// Save payment methods to Supabase
export const savePaymentMethods = async (paymentMethods: PaymentMethod[]): Promise<void> => {
  try {
    // First, get current payment methods to identify what needs to be updated or deleted
    const { data: currentMethods, error: fetchError } = await supabase
      .from('payment_methods')
      .select('id');
      
    if (fetchError) {
      console.error('Error fetching current payment methods:', fetchError);
      // Fallback to localStorage
      localStorage.setItem(PAYMENT_METHODS_KEY, JSON.stringify(paymentMethods));
      return;
    }
    
    // Get array of existing IDs
    const existingIds = currentMethods.map(method => method.id);
    
    // Get array of new IDs
    const newIds = paymentMethods.map(method => method.id);
    
    // Find IDs to delete (exist in DB but not in new array)
    const idsToDelete = existingIds.filter(id => !newIds.includes(id));
    
    // Delete methods that are no longer needed
    if (idsToDelete.length > 0) {
      const { error: deleteError } = await supabase
        .from('payment_methods')
        .delete()
        .in('id', idsToDelete);
        
      if (deleteError) {
        console.error('Error deleting payment methods:', deleteError);
      }
    }
    
    // Upsert all methods
    for (const method of paymentMethods) {
      const { error: upsertError } = await supabase
        .from('payment_methods')
        .upsert({
          id: method.id,
          name: method.name,
          type: method.type,
          currency: method.currency,
          reward_rules: convertRewardRulesToJson(method.rewardRules),
          statement_start_day: method.statementStartDay,
          is_monthly_statement: method.isMonthlyStatement,
          active: method.active,
          last_four_digits: method.lastFourDigits,
          issuer: method.issuer,
          icon: method.icon,
          color: method.color,
          image_url: method.imageUrl,
          conversion_rate: convertConversionRateToJson(method.conversionRate),
        }, { onConflict: 'id' });
        
      if (upsertError) {
        console.error('Error upserting payment method:', upsertError);
        // Fallback to localStorage
        localStorage.setItem(PAYMENT_METHODS_KEY, JSON.stringify(paymentMethods));
        return;
      }
    }
  } catch (error) {
    console.error('Error in savePaymentMethods:', error);
    // Fallback to localStorage
    localStorage.setItem(PAYMENT_METHODS_KEY, JSON.stringify(paymentMethods));
  }
};

// Get payment methods from Supabase or return defaults
export const getPaymentMethods = async (): Promise<PaymentMethod[]> => {
  const { data, error } = await supabase
    .from('payment_methods')
    .select('*');
    
  if (error) {
    console.error('Error fetching payment methods:', error);
    // Fallback to localStorage
    const stored = localStorage.getItem(PAYMENT_METHODS_KEY);
    return stored ? JSON.parse(stored) : defaultPaymentMethods;
  }
  
  if (data.length === 0) {
    // No payment methods in database, initialize with defaults
    await initializePaymentMethods();
    return defaultPaymentMethods;
  }
  
  // Transform data to match our PaymentMethod type
  return data.map(method => ({
    id: method.id,
    name: method.name,
    type: method.type as 'cash' | 'credit_card',
    currency: method.currency as Currency,
    rewardRules: convertJsonToRewardRules(method.reward_rules),
    statementStartDay: method.statement_start_day,
    isMonthlyStatement: method.is_monthly_statement,
    active: method.active,
    lastFourDigits: method.last_four_digits,
    issuer: method.issuer,
    icon: method.icon,
    color: method.color,
    imageUrl: method.image_url,
    conversionRate: method.conversion_rate as unknown as Record<Currency, number>,
  }));
};

// Initialize payment methods with defaults
export const initializePaymentMethods = async (): Promise<void> => {
  await savePaymentMethods(defaultPaymentMethods);
};

// Upload card image to storage and get a public URL
export const uploadCardImage = async (file: File, paymentMethodId: string): Promise<string | null> => {
  try {
    // Generate a unique file path
    const filePath = `card-images/${paymentMethodId}/${Date.now()}-${file.name}`;
    
    // Upload the file to supabase storage
    const { data, error } = await supabase.storage
      .from('payment-methods')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
      });
      
    if (error) {
      console.error('Error uploading card image:', error);
      return null;
    }
    
    // Get the public URL
    const { data: urlData } = supabase.storage
      .from('payment-methods')
      .getPublicUrl(filePath);
      
    return urlData.publicUrl;
  } catch (error) {
    console.error('Error in uploadCardImage:', error);
    return null;
  }
};
