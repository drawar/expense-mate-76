
import { Transaction, Currency, PaymentMethod } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { getTransactionsFromLocalStorage } from './local-storage';
import { getPaymentMethods } from '../paymentMethods';

export const getTransactions = async (forceLocalStorage = false): Promise<Transaction[]> => {
  if (forceLocalStorage) {
    console.log('Forcing local storage for transactions');
    return getTransactionsFromLocalStorage();
  }
  
  try {
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
    
    const paymentMethods = await getPaymentMethods();
    
    const transformedData = data.map(tx => {
      const merchant = tx.merchant as any;
      const paymentMethod = tx.payment_method as any;
      
      const matchedPaymentMethod = paymentMethods.find(pm => pm.id === paymentMethod.id) || {
        id: paymentMethod.id,
        name: paymentMethod.name,
        type: paymentMethod.type,
        currency: paymentMethod.currency as Currency,
        rewardRules: paymentMethod.reward_rules || [],
        active: paymentMethod.active,
        lastFourDigits: paymentMethod.last_four_digits,
        issuer: paymentMethod.issuer,
        statementStartDay: paymentMethod.statement_start_day,
        isMonthlyStatement: paymentMethod.is_monthly_statement,
        icon: paymentMethod.icon,
        color: paymentMethod.color,
      };
      
      let mcc = undefined;
      if (merchant.mcc) {
        try {
          if (typeof merchant.mcc === 'object') {
            mcc = merchant.mcc;
          }
        } catch (e) {
          console.error('Error parsing MCC:', e);
        }
      }
      
      let coordinates = undefined;
      if (merchant.coordinates) {
        try {
          if (typeof merchant.coordinates === 'object') {
            coordinates = merchant.coordinates as { latitude: number; longitude: number };
          }
        } catch (e) {
          console.error('Error parsing coordinates:', e);
        }
      }
      
      return {
        id: tx.id,
        date: tx.date,
        merchant: {
          id: merchant.id,
          name: merchant.name,
          address: merchant.address,
          mcc,
          coordinates,
          isOnline: merchant.is_online,
        },
        amount: Number(tx.amount),
        currency: tx.currency as Currency,
        paymentMethod: matchedPaymentMethod,
        paymentAmount: Number(tx.payment_amount),
        paymentCurrency: tx.payment_currency as Currency,
        rewardPoints: tx.reward_points,
        notes: tx.notes,
        category: tx.category,
        isContactless: tx.is_contactless,
      };
    });
    
    return transformedData;
  } catch (error) {
    console.error('Exception in getTransactions:', error);
    console.log('Falling back to local storage due to exception');
    return getTransactionsFromLocalStorage();
  }
};
