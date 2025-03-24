
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
  // First delete all existing payment methods
  const { error: deleteError } = await supabase
    .from('payment_methods')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000'); // Dummy condition to delete all
    
  if (deleteError) {
    console.error('Error deleting payment methods:', deleteError);
    // Fallback to localStorage
    localStorage.setItem(PAYMENT_METHODS_KEY, JSON.stringify(paymentMethods));
    return;
  }
  
  // Then insert all the payment methods one by one
  for (const method of paymentMethods) {
    const { error: insertError } = await supabase
      .from('payment_methods')
      .insert({
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
        image_url: method.imageUrl, // Fixed property name to match the database column
        conversion_rate: convertConversionRateToJson(method.conversionRate),
      });
      
    if (insertError) {
      console.error('Error inserting payment method:', insertError);
      // Fallback to localStorage
      localStorage.setItem(PAYMENT_METHODS_KEY, JSON.stringify(paymentMethods));
      return;
    }
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
    imageUrl: method.image_url, // Fixed property name to match the database column
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
