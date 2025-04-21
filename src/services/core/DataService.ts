// src/services/core/DataService.ts

import { BaseService } from './BaseService';
import { Transaction, PaymentMethod, Merchant } from '@/types';
import { v4 as uuidv4 } from 'uuid';

/**
 * Service for centralized data operations
 */
export class DataService extends BaseService {
  private static _instance: DataService;
  
  // Transaction cache with 5-minute expiration
  private transactionCache = this.createCache<Transaction[]>(5 * 60 * 1000);
  
  // Payment method cache with 15-minute expiration
  private paymentMethodCache = this.createCache<PaymentMethod[]>(15 * 60 * 1000);
  
  // Merchant cache with 15-minute expiration
  private merchantCache = this.createCache<Merchant[]>(15 * 60 * 1000);
  
  private constructor() {
    super();
  }
  
  /**
   * Get singleton instance
   */
  public static getInstance(): DataService {
    if (!this._instance) {
      this._instance = new DataService();
    }
    return this._instance;
  }
  
  /**
   * Get all transactions
   */
  public async getTransactions(useCache: boolean = true): Promise<Transaction[]> {
    // Check cache first if useCache is true
    if (useCache) {
      const cached = this.transactionCache.get('all');
      if (cached) {
        return cached;
      }
    }
    
    try {
      const { data, error, usedFallback } = await this.safeDbOperation(
        async () => {
          return await this.supabase
            .from('transactions')
            .select('*, payment_method:payment_methods(*), merchant:merchants(*)')
            .eq('is_deleted', false)
            .order('date', { ascending: false });
        },
        'transactions',
        (localData) => {
          try {
            return JSON.parse(localData);
          } catch (e) {
            console.error('Error parsing transactions from localStorage:', e);
            return [];
          }
        }
      );
        
      if (error || !data) {
        console.error('Error fetching transactions:', error);
        return [];
      }
      
      // Cache the result
      if (useCache) {
        this.transactionCache.set('all', data);
      }
      
      return data;
    } catch (error) {
      console.error('Error fetching transactions:', error);
      return [];
    }
  }
  
  /**
   * Get a transaction by ID
   */
  public async getTransaction(id: string): Promise<Transaction | null> {
    try {
      const { data, error } = await this.safeDbOperation(
        async () => {
          return await this.supabase
            .from('transactions')
            .select('*, payment_method:payment_methods(*), merchant:merchants(*)')
            .eq('id', id)
            .single();
        }
      );
        
      if (error || !data) {
        console.error('Error fetching transaction:', error);
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('Error fetching transaction:', error);
      return null;
    }
  }
  
  /**
   * Save a transaction
   */
  public async saveTransaction(transaction: Transaction): Promise<{ success: boolean; error?: Error }> {
    try {
      // Generate ID if not present
      if (!transaction.id) {
        transaction.id = uuidv4();
      }
      
      // Format date as YYYY-MM-DD without time component
      if (typeof transaction.date === 'string') {
        // If it's already in YYYY-MM-DD format, keep it that way
        if (!transaction.date.includes('T')) {
          // It's already in YYYY-MM-DD format, no conversion needed
        } else {
          // It's in ISO format, extract just the date part
          transaction.date = transaction.date.split('T')[0];
        }
      } else if (transaction.date instanceof Date) {
        // Convert Date object to YYYY-MM-DD string
        transaction.date = transaction.date.toISOString().split('T')[0];
      }
      
      // Handle merchant
      let merchantId = transaction.merchant?.id;
      if (!merchantId && transaction.merchant) {
        // Create the merchant first
        const { success: merchantSuccess, data: merchantData, error: merchantError } = 
          await this.saveMerchant(transaction.merchant);
        
        if (!merchantSuccess) {
          return { success: false, error: merchantError };
        }
        
        merchantId = merchantData?.id;
      }
      
      // Prepare transaction data for insert/update
      const transactionData = {
        id: transaction.id,
        date: transaction.date,
        amount: transaction.amount,
        payment_amount: transaction.paymentAmount,
        currency: transaction.currency,
        payment_currency: transaction.paymentCurrency,
        exchange_rate: transaction.exchangeRate,
        description: transaction.description,
        is_contactless: transaction.isContactless,
        card_present: transaction.cardPresent,
        merchant_id: merchantId,
        payment_method_id: transaction.paymentMethod?.id,
        total_points: transaction.totalPoints,
        bonus_points: transaction.bonusPoints,
        is_deleted: transaction.isDeleted || false,
        created_at: transaction.createdAt || new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // Insert or update transaction
      const { error } = await this.supabase
        .from('transactions')
        .upsert(transactionData);
      
      if (error) {
        // Try to save to localStorage as fallback
        try {
          const allTransactions = await this.getTransactions(false);
          const existingIndex = allTransactions.findIndex(t => t.id === transaction.id);
          
          if (existingIndex >= 0) {
            allTransactions[existingIndex] = transaction;
          } else {
            allTransactions.push(transaction);
          }
          
          localStorage.setItem('transactions', JSON.stringify(allTransactions));
        } catch (e) {
          console.error('Error saving to localStorage:', e);
          return { success: false, error: new Error('Failed to save transaction') };
        }
      }
      
      // Invalidate cache
      this.transactionCache.delete('all');
      
      return { success: true };
    } catch (error) {
      console.error('Error saving transaction:', error);
      return { success: false, error: error instanceof Error ? error : new Error(String(error)) };
    }
  }
  
  /**
   * Delete a transaction
   */
  public async deleteTransaction(id: string): Promise<boolean> {
    try {
      // Soft delete by updating is_deleted flag
      const { error } = await this.safeDbOperation(
        async () => {
          return await this.supabase
            .from('transactions')
            .update({ is_deleted: true })
            .eq('id', id);
        }
      );
        
      if (error) {
        console.error('Error deleting transaction:', error);
        return false;
      }
      
      // Invalidate cache
      this.transactionCache.delete('all');
      
      return true;
    } catch (error) {
      console.error('Error deleting transaction:', error);
      return false;
    }
  }
  
  /**
   * Get all payment methods
   */
  public async getPaymentMethods(useCache: boolean = true): Promise<PaymentMethod[]> {
    // Check cache first if useCache is true
    if (useCache) {
      const cached = this.paymentMethodCache.get('all');
      if (cached) {
        return cached;
      }
    }
    
    try {
      const { data, error, usedFallback } = await this.safeDbOperation(
        async () => {
          return await this.supabase
            .from('payment_methods')
            .select('*')
            .eq('is_deleted', false)
            .order('name');
        },
        'payment_methods',
        (localData) => {
          try {
            return JSON.parse(localData);
          } catch (e) {
            console.error('Error parsing payment methods from localStorage:', e);
            return [];
          }
        }
      );
        
      if (error || !data) {
        console.error('Error fetching payment methods:', error);
        return [];
      }
      
      // Parse JSON fields
      const paymentMethods = data.map((pm: any) => ({
        ...pm,
        selectedCategories: pm.selected_categories ? JSON.parse(pm.selected_categories) : []
      }));
      
      // Cache the result
      if (useCache) {
        this.paymentMethodCache.set('all', paymentMethods);
      }
      
      return paymentMethods;
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      return [];
    }
  }
  
  /**
   * Save a merchant
   */
  public async saveMerchant(merchant: Merchant): Promise<{ 
    success: boolean; 
    data?: Merchant; 
    error?: Error 
  }> {
    try {
      // Generate ID if not present
      if (!merchant.id) {
        merchant.id = uuidv4();
      }
      
      // Prepare merchant data for insert/update
      const merchantData = {
        id: merchant.id,
        name: merchant.name,
        category: merchant.category,
        is_online: merchant.isOnline,
        mcc_code: merchant.mcc?.code,
        mcc_description: merchant.mcc?.description,
        created_at: merchant.createdAt || new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // Insert or update merchant
      const { data, error } = await this.supabase
        .from('merchants')
        .upsert(merchantData)
        .select()
        .single();
      
      if (error) {
        // Try to save to localStorage as fallback
        try {
          const existingMerchants = JSON.parse(localStorage.getItem('merchants') || '[]');
          const existingIndex = existingMerchants.findIndex((m: Merchant) => m.id === merchant.id);
          
          if (existingIndex >= 0) {
            existingMerchants[existingIndex] = merchant;
          } else {
            existingMerchants.push(merchant);
          }
          
          localStorage.setItem('merchants', JSON.stringify(existingMerchants));
          return { success: true, data: merchant };
        } catch (e) {
          console.error('Error saving merchant to localStorage:', e);
          return { success: false, error: new Error('Failed to save merchant') };
        }
      }
      
      // Invalidate cache
      this.merchantCache.delete('all');
      
      return { success: true, data };
    } catch (error) {
      console.error('Error saving merchant:', error);
      return { success: false, error: error instanceof Error ? error : new Error(String(error)) };
    }
  }
  
  /**
   * Clear all caches
   */
  public clearCache(): void {
    this.transactionCache.clear();
    this.paymentMethodCache.clear();
    this.merchantCache.clear();
  }
}

// Export a singleton instance
export const dataService = DataService.getInstance();