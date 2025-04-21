import { Transaction, Currency, PaymentMethod } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { getTransactionsFromLocalStorage } from './local-storage';
import { getPaymentMethods } from '../paymentMethods';

// Define interfaces to match database structure
interface DbMerchant {
  id: string;
  name: string;
  address?: string;
  mcc?: any;
  coordinates?: { latitude: number; longitude: number };
  is_online: boolean;
}

interface DbPaymentMethod {
  id: string;
  name: string;
  type: string;
  currency: string;
  reward_rules?: any[];
  active: boolean;
  last_four_digits?: string;
  issuer?: string;
  statement_start_day?: number;
  is_monthly_statement?: boolean;
  icon?: string;
  color?: string;
}

// Match the exact structure from Supabase to avoid type errors
interface DbTransaction {
  id: string;
  date: string;
  amount: number;
  base_points: number;
  bonus_points: number;
  category: string;
  created_at: string;
  currency: string;
  date_string?: string;
  description?: string;
  exchange_rate?: number;
  is_contactless: boolean;
  is_deleted: boolean;
  merchant_id: string;
  merchant: DbMerchant;
  notes?: string;
  payment_amount: number;
  payment_currency: string;
  payment_method_id: string;
  payment_method: DbPaymentMethod;
  reimbursement_amount?: number;
  reward_points?: number;
  total_points?: number;
  updated_at: string;
}

export const getTransactions = async (forceLocalStorage = false, forceRefresh = false): Promise<Transaction[]> => {
  if (forceLocalStorage) {
    console.log('Forcing local storage for transactions');
    return getTransactionsFromLocalStorage();
  }
  
  try {
    // Add cache busting parameter when force refresh is requested
    const cacheParam = forceRefresh ? { 
      head: true,
      count: "exact" 
    } : undefined;
    
    console.log('Fetching transactions', forceRefresh ? 'with force refresh' : '');
    
    const { data, error } = await supabase
      .from('transactions')
      .select(`
        *,
        merchant:merchant_id(*),
        payment_method:payment_method_id(*)
      `)
      .eq('is_deleted', false); // Filter out deleted transactions
      
    if (error) {
      console.error('Error fetching transactions from Supabase:', error);
      console.log('Falling back to local storage for transactions');
      return getTransactionsFromLocalStorage();
    }
    
    // Check if data is null or undefined before proceeding
    if (!data || !Array.isArray(data)) {
      console.warn('No data returned from Supabase or data is not an array, falling back to local storage');
      return getTransactionsFromLocalStorage();
    }
    
    const paymentMethods = await getPaymentMethods();
    
    const transformedData = data.map((tx: any) => {
      if (!tx) return null; 
      
      const merchant = tx.merchant || {};
      const paymentMethod = tx.payment_method || {};
      
      const matchedPaymentMethod = paymentMethods.find(pm => pm.id === paymentMethod.id) || {
        id: paymentMethod.id || '',
        name: paymentMethod.name || '',
        type: paymentMethod.type || '',
        currency: (paymentMethod.currency || 'SGD') as Currency,
        rewardRules: paymentMethod.reward_rules || [],
        active: paymentMethod.active || false,
        lastFourDigits: paymentMethod.last_four_digits || '',
        issuer: paymentMethod.issuer || '',
        statementStartDay: paymentMethod.statement_start_day || 1,
        isMonthlyStatement: paymentMethod.is_monthly_statement || true,
        icon: paymentMethod.icon || '',
        color: paymentMethod.color || '#000000',
      };
      
      let mcc = undefined;
      if (merchant && merchant.mcc) {
        try {
          if (typeof merchant.mcc === 'object') {
            mcc = merchant.mcc;
          }
        } catch (e) {
          console.error('Error parsing MCC:', e);
        }
      }
      
      let coordinates = undefined;
      if (merchant && merchant.coordinates) {
        try {
          if (typeof merchant.coordinates === 'object') {
            coordinates = merchant.coordinates as { latitude: number; longitude: number };
          }
        } catch (e) {
          console.error('Error parsing coordinates:', e);
        }
      }
      
      // Ensure currency is converted to Currency type correctly
      const txCurrency = (tx.currency || 'SGD') as Currency;
      const paymentCurrency = (tx.payment_currency || 'SGD') as Currency;
      
      return {
        id: tx.id || '',
        date: tx.date || new Date().toISOString(),
        merchant: {
          id: merchant.id || '',
          name: merchant.name || '',
          address: merchant.address || '',
          mcc,
          coordinates,
          isOnline: merchant.is_online || false,
        },
        amount: Number(tx.amount || 0),
        currency: txCurrency,
        paymentMethod: matchedPaymentMethod,
        paymentAmount: Number(tx.payment_amount || 0),
        paymentCurrency: paymentCurrency,
        rewardPoints: tx.reward_points || 0,
        notes: tx.notes || '',
        category: tx.category || '',
        isContactless: tx.is_contactless || false,
        reimbursementAmount: tx.reimbursement_amount ? Number(tx.reimbursement_amount) : 0,
      } as Transaction;
    }).filter(Boolean) as Transaction[];
    
    console.log('Transactions loaded:', transformedData.length);
    console.log('Currencies present:', [...new Set(transformedData.map(tx => tx.currency))]);
    
    return transformedData;
  } catch (error) {
    console.error('Exception in getTransactions:', error);
    console.log('Falling back to local storage due to exception');
    return getTransactionsFromLocalStorage();
  }
};
