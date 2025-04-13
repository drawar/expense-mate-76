// services/storage/index.ts
import { v4 as uuidv4 } from 'uuid';
import { Transaction, Merchant, PaymentMethod, MerchantCategoryCode, Currency } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { rewardService, calculateRewardPoints } from '@/services/rewards';

/**
 * Centralized storage service that handles all persistence operations
 */
class StorageService {
  private static instance: StorageService;
  private isLocalStorageMode = false;
  
  // Constants
  private readonly TRANSACTIONS_STORAGE_KEY = 'lovable_expense_tracker_transactions';
  private readonly PAYMENT_METHODS_STORAGE_KEY = 'expenseTracker_paymentMethods';
  private readonly MERCHANTS_STORAGE_KEY = 'expenseTracker_merchants';
  private readonly MERCHANT_MAPPING_STORAGE_KEY = 'expenseTracker_merchantMapping';
  
  private constructor() {}
  
  /**
   * Get singleton instance
   */
  public static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }
  
  /**
   * Set storage mode (local vs Supabase)
   */
  public setLocalStorageMode(useLocalStorage: boolean): void {
    this.isLocalStorageMode = useLocalStorage;
    console.log(`Storage mode set to ${useLocalStorage ? 'local storage' : 'Supabase'}`);
  }
  
  /**
   * Check if using local storage mode
   */
  public isUsingLocalStorage(): boolean {
    return this.isLocalStorageMode;
  }
  
  /**
   * Initialize storage with defaults if needed
   */
  public async initialize(defaultPaymentMethods: PaymentMethod[]): Promise<void> {
    // Check if payment methods exist, if not initialize with defaults
    const methods = await this.getPaymentMethods();
    if (methods.length === 0) {
      await this.savePaymentMethods(defaultPaymentMethods);
    }
  }
  
  // ==================
  // TRANSACTION METHODS
  // ==================
  
  /**
   * Add a new transaction
   */
  public async addTransaction(transactionData: Omit<Transaction, 'id'>): Promise<Transaction | null> {
    try {
      // Add an ID to the transaction
      const transaction: Transaction = {
        ...transactionData,
        id: uuidv4()
      };
      
      console.log(`Adding transaction with ID ${transaction.id}`);
      
      // Calculate reward points using our centralized service
      let pointsResult;
      try {
        pointsResult = await calculateRewardPoints(transaction as Transaction);
      } catch (error) {
        console.error('Error calculating reward points:', error);
        pointsResult = {
          totalPoints: Math.round(transaction.amount),
          basePoints: Math.round(transaction.amount),
          bonusPoints: 0
        };
      }
      
      // Set points on the transaction
      transaction.rewardPoints = pointsResult.totalPoints;
      transaction.basePoints = pointsResult.basePoints;
      transaction.bonusPoints = pointsResult.bonusPoints;
      
      // Save to local storage if in local storage mode
      if (this.isLocalStorageMode) {
        return this.addTransactionToLocalStorage(transaction);
      }
      
      // Otherwise save to Supabase
      const { data, error } = await supabase
        .from('transactions')
        .insert({
          id: transaction.id,
          amount: transaction.amount,
          currency: transaction.currency,
          merchant_id: transaction.merchant.id,
          payment_method_id: transaction.paymentMethod.id,
          payment_amount: transaction.paymentAmount,
          payment_currency: transaction.paymentCurrency,
          date: transaction.date,
          category: transaction.category,
          notes: transaction.notes,
          is_contactless: transaction.isContactless,
          reward_points: transaction.rewardPoints,
          base_points: transaction.basePoints || 0,
          bonus_points: transaction.bonusPoints || 0,
          reimbursement_amount: transaction.reimbursementAmount || 0
        })
        .select('*')
        .single();
        
      if (error) {
        console.error('Error inserting transaction:', error);
        // Fall back to local storage if Supabase insertion fails
        return this.addTransactionToLocalStorage(transaction);
      }
      
      console.log('Transaction inserted successfully:', data);
      
      // Track merchant name for future auto-completion
      await this.incrementMerchantOccurrence(transaction.merchant.name, transaction.merchant.mcc);
      
      // Track bonus points if applicable
      if (pointsResult.bonusPoints > 0) {
        await this.recordBonusPointsMovement(
          transaction.id,
          transaction.paymentMethod.id,
          pointsResult.bonusPoints
        );
      }
      
      return transaction;
    } catch (error) {
      console.error('Exception in addTransaction:', error);
      return null;
    }
  }
  
  /**
   * Helper method to add transaction to local storage
   */
  private async addTransactionToLocalStorage(transaction: Transaction): Promise<Transaction> {
    try {
      const transactions = this.getTransactionsFromLocalStorage();
      transactions.push(transaction);
      localStorage.setItem(this.TRANSACTIONS_STORAGE_KEY, JSON.stringify(transactions));
      
      // Still track merchant information even in local storage mode
      await this.incrementMerchantOccurrence(transaction.merchant.name, transaction.merchant.mcc);
      
      return transaction;
    } catch (error) {
      console.error('Error adding transaction to local storage:', error);
      throw error;
    }
  }
  
  /**
   * Get all transactions
   */
  public async getTransactions(): Promise<Transaction[]> {
    if (this.isLocalStorageMode) {
      return this.getTransactionsFromLocalStorage();
    }
    
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          merchant:merchant_id(*),
          payment_method:payment_method_id(*)
        `)
        .eq('is_deleted', false);
        
      if (error) {
        console.error('Error fetching transactions from Supabase:', error);
        console.log('Falling back to local storage for transactions');
        return this.getTransactionsFromLocalStorage();
      }
      
      const paymentMethods = await this.getPaymentMethods();
      
      // Transform the database format to our application format
      return data.map(tx => {
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
        
        // Parse MCC if available
        let mcc = undefined;
        if (merchant.mcc) {
          try {
            if (typeof merchant.mcc === 'object') {
              mcc = merchant.mcc;
            } else if (typeof merchant.mcc === 'string') {
              mcc = JSON.parse(merchant.mcc);
            }
          } catch (e) {
            console.error('Error parsing MCC:', e);
          }
        }
        
        // Parse coordinates if available
        let coordinates = undefined;
        if (merchant.coordinates) {
          try {
            if (typeof merchant.coordinates === 'object') {
              coordinates = merchant.coordinates;
            } else if (typeof merchant.coordinates === 'string') {
              coordinates = JSON.parse(merchant.coordinates);
            }
          } catch (e) {
            console.error('Error parsing coordinates:', e);
          }
        }
        
        // Create the normalized transaction object
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
          basePoints: tx.base_points,
          bonusPoints: tx.bonus_points,
          notes: tx.notes,
          category: tx.category,
          isContactless: tx.is_contactless,
          reimbursementAmount: tx.reimbursement_amount ? Number(tx.reimbursement_amount) : 0,
        };
      });
    } catch (error) {
      console.error('Exception in getTransactions:', error);
      return this.getTransactionsFromLocalStorage();
    }
  }
  
  /**
   * Get transactions from local storage
   */
  private getTransactionsFromLocalStorage(): Transaction[] {
    try {
      const storedTransactions = localStorage.getItem(this.TRANSACTIONS_STORAGE_KEY);
      if (!storedTransactions) {
        return [];
      }
      
      const parsedTransactions = JSON.parse(storedTransactions) as Transaction[];
      
      // Filter out deleted transactions
      return parsedTransactions.filter(tx => tx.is_deleted !== true);
    } catch (error) {
      console.error('Error retrieving transactions from localStorage:', error);
      return [];
    }
  }
  
  /**
   * Edit an existing transaction
   */
  public async editTransaction(id: string, updatedTransaction: Omit<Transaction, 'id'>): Promise<Transaction | null> {
    if (this.isLocalStorageMode) {
      return this.editTransactionInLocalStorage(id, updatedTransaction);
    }
    
    try {
      // First add or update the merchant
      const savedMerchant = await this.addOrUpdateMerchant(updatedTransaction.merchant);
      
      // Handle reimbursement amount with safe access, default to 0
      const reimbursementAmount = updatedTransaction.reimbursementAmount ?? 0;
      
      // Update in Supabase
      const { data, error } = await supabase
        .from('transactions')
        .update({
          date: updatedTransaction.date,
          merchant_id: savedMerchant.id,
          amount: updatedTransaction.amount,
          currency: updatedTransaction.currency,
          payment_method_id: updatedTransaction.paymentMethod.id,
          payment_amount: updatedTransaction.paymentAmount,
          payment_currency: updatedTransaction.paymentCurrency,
          reward_points: updatedTransaction.rewardPoints,
          notes: updatedTransaction.notes,
          category: updatedTransaction.category,
          is_contactless: updatedTransaction.isContactless,
          reimbursement_amount: reimbursementAmount,
        })
        .eq('id', id)
        .select()
        .single();
        
      if (error) {
        console.error('Error updating transaction:', error);
        return this.editTransactionInLocalStorage(id, updatedTransaction);
      }
      
      // Construct and return the updated transaction
      return {
        id,
        ...updatedTransaction,
        merchant: savedMerchant
      };
    } catch (error) {
      console.error('Error in editTransaction:', error);
      return null;
    }
  }
  
  /**
   * Edit transaction in local storage
   */
  private editTransactionInLocalStorage(id: string, updatedTransaction: Omit<Transaction, 'id'>): Transaction | null {
    try {
      const transactions = this.getTransactionsFromLocalStorage();
      const index = transactions.findIndex(t => t.id === id);
      
      if (index === -1) {
        console.error('Transaction not found in local storage:', id);
        return null;
      }
      
      // Create the updated transaction
      const updated: Transaction = {
        id,
        ...updatedTransaction
      };
      
      // Update the transaction in the array
      transactions[index] = updated;
      
      // Save back to local storage
      localStorage.setItem(this.TRANSACTIONS_STORAGE_KEY, JSON.stringify(transactions));
      
      return updated;
    } catch (error) {
      console.error('Error updating transaction in local storage:', error);
      return null;
    }
  }
  
  /**
   * Delete a transaction
   */
  public async deleteTransaction(id: string): Promise<boolean> {
    // First check if we need to handle local storage
    const localStorageTransactions = this.getTransactionsFromLocalStorage();
    const isInLocalStorage = localStorageTransactions.some(t => t.id === id);
    
    if (this.isLocalStorageMode) {
      return this.deleteTransactionFromLocalStorage(id);
    }
    
    try {
      // Check if transaction exists in Supabase
      const { data: transaction, error: fetchError } = await supabase
        .from('transactions')
        .select(`
          *,
          merchant:merchant_id(*)
        `)
        .eq('id', id)
        .single();
        
      if (fetchError) {
        console.log('Transaction not found in Supabase, checking local storage');
        
        // If it's in local storage, handle locally
        if (isInLocalStorage) {
          return this.deleteTransactionFromLocalStorage(id);
        }
        
        console.error('Transaction not found in Supabase or local storage');
        return false;
      }
      
      // Soft delete the transaction
      const { error: updateError } = await supabase
        .from('transactions')
        .update({
          is_deleted: true,
          deleted_at: new Date().toISOString()
        })
        .eq('id', id);
        
      if (updateError) {
        console.error('Error soft deleting transaction:', updateError);
        
        // If it's in local storage as fallback, handle locally
        if (isInLocalStorage) {
          return this.deleteTransactionFromLocalStorage(id);
        }
        
        return false;
      }
      
      // Update merchant occurrence count
      if (transaction.merchant) {
        try {
          await this.decrementMerchantOccurrence(transaction.merchant.name);
        } catch (error) {
          console.error('Error updating merchant mapping after delete:', error);
        }
      }
      
      // Also remove from local storage if it exists there
      if (isInLocalStorage) {
        this.deleteTransactionFromLocalStorage(id);
      }
      
      return true;
    } catch (error) {
      console.error('Error in deleteTransaction:', error);
      return false;
    }
  }
  
  /**
   * Delete transaction from local storage
   */
  private deleteTransactionFromLocalStorage(id: string): boolean {
    try {
      const transactions = this.getTransactionsFromLocalStorage();
      const filteredTransactions = transactions.filter(t => t.id !== id);
      
      if (filteredTransactions.length === transactions.length) {
        return false; // Transaction not found
      }
      
      localStorage.setItem(this.TRANSACTIONS_STORAGE_KEY, JSON.stringify(filteredTransactions));
      return true;
    } catch (error) {
      console.error('Error deleting transaction from local storage:', error);
      return false;
    }
  }
  
  /**
   * Export transactions to CSV format
   */
  public exportTransactionsToCSV(transactions: Transaction[]): string {
    if (transactions.length === 0) {
      return '';
    }
    
    const headers = [
      'ID',
      'Date',
      'Merchant',
      'Category',
      'Amount',
      'Currency',
      'Payment Method',
      'Payment Amount',
      'Payment Currency',
      'Reward Points',
      'Notes',
      'Contactless',
      'Reimbursement Amount'
    ].join(',');
    
    const rows = transactions.map(tx => [
      tx.id,
      tx.date,
      tx.merchant.name,
      tx.category || tx.merchant.mcc?.description || 'Uncategorized',
      tx.amount,
      tx.currency,
      tx.paymentMethod.name,
      tx.paymentAmount,
      tx.paymentCurrency,
      tx.rewardPoints,
      tx.notes ? `"${tx.notes.replace(/"/g, '""')}"` : '',
      tx.isContactless ? 'Yes' : 'No',
      tx.reimbursementAmount || 0
    ].join(','));
    
    return [headers, ...rows].join('\n');
  }
  
  // ==================
  // BONUS POINTS METHODS
  // ==================
  
  /**
   * Record bonus points movement
   */
  public async recordBonusPointsMovement(
    transactionId: string,
    paymentMethodId: string,
    bonusPoints: number
  ): Promise<boolean> {
    // Skip recording if bonus points is zero
    if (bonusPoints === 0) return true;
    
    if (this.isLocalStorageMode) {
      return this.recordBonusPointsInLocalStorage(paymentMethodId, bonusPoints);
    }
    
    try {
      const { error } = await supabase
        .from('bonus_points_movements')
        .insert({
          id: uuidv4(),
          transaction_id: transactionId,
          payment_method_id: paymentMethodId,
          bonus_points: bonusPoints
        });
        
      if (error) {
        console.log('Database insert failed, falling back to localStorage:', error);
        return this.recordBonusPointsInLocalStorage(paymentMethodId, bonusPoints);
      }
      
      return true;
    } catch (error) {
      console.error('Exception in recordBonusPointsMovement:', error);
      return this.recordBonusPointsInLocalStorage(paymentMethodId, bonusPoints);
    }
  }
  
  /**
   * Record bonus points in local storage
   */
  private recordBonusPointsInLocalStorage(
    paymentMethodId: string,
    bonusPoints: number
  ): boolean {
    try {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth();
      
      const localStorageKey = `bonusPoints-${paymentMethodId}-${year}-${month}`;
      const currentValue = localStorage.getItem(localStorageKey) || '0';
      const updatedValue = parseInt(currentValue, 10) + bonusPoints;
      
      localStorage.setItem(localStorageKey, updatedValue.toString());
      
      return true;
    } catch (error) {
      console.error('Error recording bonus points in local storage:', error);
      return false;
    }
  }
  
  /**
   * Get used bonus points for a payment method in the current month
   */
  public async getUsedBonusPoints(
    paymentMethodId: string,
    year: number = new Date().getFullYear(),
    month: number = new Date().getMonth()
  ): Promise<number> {
    if (this.isLocalStorageMode) {
      return this.getUsedBonusPointsFromLocalStorage(paymentMethodId, year, month);
    }
    
    try {
      const { data, error } = await supabase
        .from('bonus_points_movements')
        .select('bonus_points')
        .eq('payment_method_id', paymentMethodId)
        .gte('created_at', new Date(year, month, 1).toISOString())
        .lt('created_at', new Date(year, month + 1, 1).toISOString());
        
      if (error) {
        console.log('Database query failed, falling back to localStorage:', error);
        return this.getUsedBonusPointsFromLocalStorage(paymentMethodId, year, month);
      }
      
      // Sum up the bonus points
      return data.reduce((sum, record) => sum + record.bonus_points, 0);
    } catch (error) {
      console.error('Exception in getUsedBonusPoints:', error);
      return this.getUsedBonusPointsFromLocalStorage(paymentMethodId, year, month);
    }
  }
  
  /**
   * Get used bonus points from local storage
   */
  private getUsedBonusPointsFromLocalStorage(
    paymentMethodId: string,
    year: number,
    month: number
  ): number {
    try {
      const localStorageKey = `bonusPoints-${paymentMethodId}-${year}-${month}`;
      const storedValue = localStorage.getItem(localStorageKey);
      
      if (storedValue) {
        return parseInt(storedValue, 10);
      }
      
      return 0;
    } catch (error) {
      console.error('Error getting used bonus points from local storage:', error);
      return 0;
    }
  }
  
  // ==================
  // MERCHANT METHODS
  // ==================
  
  /**
   * Get merchant by name (case insensitive) or return undefined
   */
  public async getMerchantByName(name: string): Promise<Merchant | undefined> {
    if (this.isLocalStorageMode) {
      return this.getMerchantByNameFromLocalStorage(name);
    }
    
    try {
      const { data, error } = await supabase
        .from('merchants')
        .select('*')
        .ilike('name', name)
        .maybeSingle();
        
      if (error || !data) {
        console.log('No merchant found with name:', name);
        return undefined;
      }
      
      // Process MCC and coordinates if available
      let mcc: MerchantCategoryCode | undefined;
      let coordinates: { latitude: number; longitude: number } | undefined;
      
      if (data.mcc) {
        try {
          mcc = typeof data.mcc === 'string' ? JSON.parse(data.mcc) : data.mcc;
        } catch (e) {
          console.error('Error parsing MCC:', e);
        }
      }
      
      if (data.coordinates) {
        try {
          coordinates = typeof data.coordinates === 'string' ? 
            JSON.parse(data.coordinates) : data.coordinates;
        } catch (e) {
          console.error('Error parsing coordinates:', e);
        }
      }
      
      return {
        id: data.id,
        name: data.name,
        address: data.address || undefined,
        coordinates,
        mcc,
        isOnline: data.is_online,
      };
    } catch (error) {
      console.error('Error in getMerchantByName:', error);
      return undefined;
    }
  }
  
  /**
   * Get merchant by name from local storage
   */
  private getMerchantByNameFromLocalStorage(name: string): Merchant | undefined {
    try {
      const merchants = this.getMerchantsFromLocalStorage();
      return merchants.find(m => m.name.toLowerCase() === name.toLowerCase());
    } catch (error) {
      console.error('Error getting merchant from local storage:', error);
      return undefined;
    }
  }
  
  /**
   * Get merchants from local storage
   */
  private getMerchantsFromLocalStorage(): Merchant[] {
    try {
      const stored = localStorage.getItem(this.MERCHANTS_STORAGE_KEY);
      if (!stored) return [];
      return JSON.parse(stored);
    } catch (error) {
      console.error('Error getting merchants from local storage:', error);
      return [];
    }
  }
  
  /**
   * Add a new merchant or update if already exists
   */
  public async addOrUpdateMerchant(merchant: Merchant): Promise<Merchant> {
    if (this.isLocalStorageMode) {
      return this.addOrUpdateMerchantInLocalStorage(merchant);
    }
    
    try {
      // Check if merchant already exists
      const existingMerchant = await this.getMerchantByName(merchant.name);
      
      if (existingMerchant) {
        // Update existing merchant
        console.log(`Updating existing merchant: ${merchant.name}`);
        
        // Prepare data for update
        const data = {
          address: merchant.address,
          coordinates: merchant.coordinates ? JSON.stringify(merchant.coordinates) : null,
          mcc: merchant.mcc ? JSON.stringify(merchant.mcc) : null,
          is_online: merchant.isOnline
        };
        
        const { data: updatedData, error } = await supabase
          .from('merchants')
          .update(data)
          .eq('id', existingMerchant.id)
          .select()
          .single();
        
        if (error) {
          console.error('Error updating merchant:', error);
          return this.addOrUpdateMerchantInLocalStorage(merchant);
        }
        
        // Parse JSON data from response
        let coordinatesObj;
        let mccObj;
        
        try {
          coordinatesObj = updatedData.coordinates ? 
            (typeof updatedData.coordinates === 'string' ? 
              JSON.parse(updatedData.coordinates) : updatedData.coordinates) 
            : undefined;
        } catch (e) {
          console.error('Error parsing coordinates after update:', e);
        }
        
        try {
          mccObj = updatedData.mcc ? 
            (typeof updatedData.mcc === 'string' ? 
              JSON.parse(updatedData.mcc) : updatedData.mcc) 
            : undefined;
        } catch (e) {
          console.error('Error parsing MCC after update:', e);
        }
        
        return {
          id: updatedData.id,
          name: existingMerchant.name,
          address: updatedData.address,
          coordinates: coordinatesObj,
          mcc: mccObj as MerchantCategoryCode | undefined,
          isOnline: updatedData.is_online
        };
      } else {
        // Create new merchant
        console.log(`Creating new merchant: ${merchant.name}`);
        
        // Prepare data for insert
        const { data, error } = await supabase
          .from('merchants')
          .insert({
            name: merchant.name,
            address: merchant.address,
            coordinates: merchant.coordinates ? JSON.stringify(merchant.coordinates) : null,
            mcc: merchant.mcc ? JSON.stringify(merchant.mcc) : null,
            is_online: merchant.isOnline,
            is_deleted: false
          })
          .select()
          .single();
        
        if (error) {
          console.error('Error creating merchant:', error);
          return this.addOrUpdateMerchantInLocalStorage(merchant);
        }
        
        // Parse JSON data from response
        let coordinatesObj;
        let mccObj;
        
        try {
          coordinatesObj = data.coordinates ? 
            (typeof data.coordinates === 'string' ? 
              JSON.parse(data.coordinates) : data.coordinates) 
            : undefined;
        } catch (e) {
          console.error('Error parsing coordinates after insert:', e);
        }
        
        try {
          mccObj = data.mcc ? 
            (typeof data.mcc === 'string' ? 
              JSON.parse(data.mcc) : data.mcc) 
            : undefined;
        } catch (e) {
          console.error('Error parsing MCC after insert:', e);
        }
        
        return {
          id: data.id,
          name: data.name,
          address: data.address,
          coordinates: coordinatesObj,
          mcc: mccObj as MerchantCategoryCode | undefined,
          isOnline: data.is_online
        };
      }
    } catch (error) {
      console.error('Error in addOrUpdateMerchant:', error);
      return this.addOrUpdateMerchantInLocalStorage(merchant);
    }
  }
  
  /**
   * Add or update merchant in local storage
   */
  private addOrUpdateMerchantInLocalStorage(merchant: Merchant): Merchant {
    try {
      const merchants = this.getMerchantsFromLocalStorage();
      const index = merchants.findIndex(m => 
        m.name.toLowerCase() === merchant.name.toLowerCase());
      
      // Create a new merchant with ID if not provided
      const updatedMerchant = {
        ...merchant,
        id: merchant.id || uuidv4()
      };
      
      if (index >= 0) {
        // Update existing merchant
        merchants[index] = updatedMerchant;
      } else {
        // Add new merchant
        merchants.push(updatedMerchant);
      }
      
      localStorage.setItem(this.MERCHANTS_STORAGE_KEY, JSON.stringify(merchants));
      return updatedMerchant;
    } catch (error) {
      console.error('Error adding/updating merchant in local storage:', error);
      // Return a fallback merchant with provided data
      return {
        id: merchant.id || uuidv4(),
        name: merchant.name,
        address: merchant.address,
        coordinates: merchant.coordinates,
        mcc: merchant.mcc,
        isOnline: merchant.isOnline
      };
    }
  }
  
  /**
   * Increment merchant occurrence count for auto-suggestions
   */
  public async incrementMerchantOccurrence(
    merchantName: string, 
    mcc?: MerchantCategoryCode
  ): Promise<boolean> {
    if (this.isLocalStorageMode) {
      return this.incrementMerchantOccurrenceInLocalStorage(merchantName, mcc);
    }
    
    try {
      if (!merchantName) return false;
      
      // Normalize merchant name
      const normalizedName = merchantName.trim().toLowerCase();
      if (!normalizedName) return false;
      
      // Check if we already have a mapping for this merchant
      const { data: existingMapping, error: fetchError } = await supabase
        .from('merchant_category_mappings')
        .select('*')
        .eq('merchant_name', normalizedName)
        .single();
      
      if (fetchError) {
        // No existing mapping, create a new one
        console.log('Creating new merchant mapping for:', normalizedName);
        const { error: insertError } = await supabase
          .from('merchant_category_mappings')
          .insert({
            merchant_name: normalizedName,
            occurrence_count: 1,
            most_common_mcc: mcc ? JSON.stringify(mcc) : null
          });
        
        if (insertError) {
          console.error('Error creating merchant mapping:', insertError);
          return this.incrementMerchantOccurrenceInLocalStorage(merchantName, mcc);
        }
        
        return true;
      } else {
        // Update existing mapping
        console.log('Updating existing mapping for:', normalizedName);
        const newCount = (existingMapping.occurrence_count || 0) + 1;
        
// Update MCC if provided
let mccToUpdate = existingMapping.most_common_mcc;
if (mcc) {
  mccToUpdate = JSON.stringify(mcc);
}

const { error: updateError } = await supabase
  .from('merchant_category_mappings')
  .update({
    occurrence_count: newCount,
    most_common_mcc: mccToUpdate,
    modified_at: new Date().toISOString()
  })
  .eq('merchant_name', normalizedName);

if (updateError) {
  console.error('Error updating merchant mapping:', updateError);
  return this.incrementMerchantOccurrenceInLocalStorage(merchantName, mcc);
}

return true;
}
} catch (error) {
console.error('Error in incrementMerchantOccurrence:', error);
return this.incrementMerchantOccurrenceInLocalStorage(merchantName, mcc);
}
}

/**
* Increment merchant occurrence in local storage
*/
private incrementMerchantOccurrenceInLocalStorage(
merchantName: string,
mcc?: MerchantCategoryCode
): boolean {
try {
const normalizedName = merchantName.trim().toLowerCase();
if (!normalizedName) return false;

// Get existing mappings
const storedMappings = localStorage.getItem(this.MERCHANT_MAPPING_STORAGE_KEY);
const mappings = storedMappings ? JSON.parse(storedMappings) : [];

// Find existing mapping
const existingIndex = mappings.findIndex((m: any) => 
m.merchantName === normalizedName);

if (existingIndex >= 0) {
// Update existing mapping
mappings[existingIndex].occurrenceCount += 1;
if (mcc) {
  mappings[existingIndex].mostCommonMCC = mcc;
}
} else {
// Add new mapping
mappings.push({
  merchantName: normalizedName,
  occurrenceCount: 1,
  mostCommonMCC: mcc || null,
  isDeleted: false
});
}

// Save back to local storage
localStorage.setItem(this.MERCHANT_MAPPING_STORAGE_KEY, JSON.stringify(mappings));

return true;
} catch (error) {
console.error('Error incrementing merchant occurrence in local storage:', error);
return false;
}
}

/**
* Decrement merchant occurrence count
*/
public async decrementMerchantOccurrence(merchantName: string): Promise<boolean> {
if (this.isLocalStorageMode) {
return this.decrementMerchantOccurrenceInLocalStorage(merchantName);
}

try {
if (!merchantName) return false;

// Normalize merchant name
const normalizedName = merchantName.trim().toLowerCase();
if (!normalizedName) return false;

// Check if we have a mapping for this merchant
const { data: existingMapping, error: fetchError } = await supabase
.from('merchant_category_mappings')
.select('*')
.eq('merchant_name', normalizedName)
.single();

if (fetchError) {
console.log('No merchant mapping found for:', normalizedName);
return false;
}

// Decrement occurrence count, but never below 0
const newCount = Math.max(0, (existingMapping.occurrence_count || 1) - 1);

const { error: updateError } = await supabase
.from('merchant_category_mappings')
.update({
  occurrence_count: newCount,
  modified_at: new Date().toISOString()
})
.eq('merchant_name', normalizedName);

if (updateError) {
console.error('Error updating merchant mapping:', updateError);
return this.decrementMerchantOccurrenceInLocalStorage(merchantName);
}

return true;
} catch (error) {
console.error('Error in decrementMerchantOccurrence:', error);
return this.decrementMerchantOccurrenceInLocalStorage(merchantName);
}
}

/**
* Decrement merchant occurrence in local storage
*/
private decrementMerchantOccurrenceInLocalStorage(merchantName: string): boolean {
try {
const normalizedName = merchantName.trim().toLowerCase();
if (!normalizedName) return false;

// Get existing mappings
const storedMappings = localStorage.getItem(this.MERCHANT_MAPPING_STORAGE_KEY);
if (!storedMappings) return false;

const mappings = JSON.parse(storedMappings);

// Find existing mapping
const existingIndex = mappings.findIndex((m: any) => 
m.merchantName === normalizedName);

if (existingIndex >= 0) {
// Decrement count, but never below 0
mappings[existingIndex].occurrenceCount = 
  Math.max(0, mappings[existingIndex].occurrenceCount - 1);

// Save back to local storage
localStorage.setItem(this.MERCHANT_MAPPING_STORAGE_KEY, JSON.stringify(mappings));
return true;
}

return false;
} catch (error) {
console.error('Error decrementing merchant occurrence in local storage:', error);
return false;
}
}

/**
* Check if there are merchant category suggestions for a merchant
*/
public async hasMerchantCategorySuggestions(merchantName: string): Promise<boolean> {
if (this.isLocalStorageMode) {
return this.hasMerchantCategorySuggestionsInLocalStorage(merchantName);
}

try {
if (!merchantName) return false;

const normalizedName = merchantName.trim().toLowerCase();
if (!normalizedName) return false;

const { data, error } = await supabase
.from('merchant_category_mappings')
.select('most_common_mcc')
.eq('merchant_name', normalizedName)
.single();

if (error || !data || !data.most_common_mcc) return false;

return true;
} catch (error) {
console.error('Error checking for merchant category suggestions:', error);
return false;
}
}

/**
* Check if there are merchant category suggestions in local storage
*/
private hasMerchantCategorySuggestionsInLocalStorage(merchantName: string): boolean {
try {
const normalizedName = merchantName.trim().toLowerCase();
if (!normalizedName) return false;

// Get existing mappings
const storedMappings = localStorage.getItem(this.MERCHANT_MAPPING_STORAGE_KEY);
if (!storedMappings) return false;

const mappings = JSON.parse(storedMappings);

// Find existing mapping
const mapping = mappings.find((m: any) => 
m.merchantName === normalizedName && !m.isDeleted);

return !!(mapping && mapping.mostCommonMCC);
} catch (error) {
console.error('Error checking merchant category suggestions in local storage:', error);
return false;
}
}

/**
* Get suggested merchant category for a merchant
*/
public async getSuggestedMerchantCategory(merchantName: string): Promise<MerchantCategoryCode | null> {
if (this.isLocalStorageMode) {
return this.getSuggestedMerchantCategoryFromLocalStorage(merchantName);
}

try {
if (!merchantName) return null;

const normalizedName = merchantName.trim().toLowerCase();
if (!normalizedName) return null;

const { data, error } = await supabase
.from('merchant_category_mappings')
.select('most_common_mcc')
.eq('merchant_name', normalizedName)
.single();

if (error || !data || !data.most_common_mcc) return null;

return JSON.parse(data.most_common_mcc as string) as MerchantCategoryCode;
} catch (error) {
console.error('Error getting suggested merchant category:', error);
return null;
}
}

/**
* Get suggested merchant category from local storage
*/
private getSuggestedMerchantCategoryFromLocalStorage(merchantName: string): MerchantCategoryCode | null {
try {
const normalizedName = merchantName.trim().toLowerCase();
if (!normalizedName) return null;

// Get existing mappings
const storedMappings = localStorage.getItem(this.MERCHANT_MAPPING_STORAGE_KEY);
if (!storedMappings) return null;

const mappings = JSON.parse(storedMappings);

// Find existing mapping
const mapping = mappings.find((m: any) => 
m.merchantName === normalizedName && !m.isDeleted);

return mapping?.mostCommonMCC || null;
} catch (error) {
console.error('Error getting suggested merchant category from local storage:', error);
return null;
}
}

// ==================
// PAYMENT METHOD METHODS
// ==================

/**
* Get all payment methods
*/
public async getPaymentMethods(): Promise<PaymentMethod[]> {
if (this.isLocalStorageMode) {
return this.getPaymentMethodsFromLocalStorage();
}

try {
const { data, error } = await supabase
.from('payment_methods')
.select('*');

if (error) {
console.error('Error fetching payment methods:', error);
return this.getPaymentMethodsFromLocalStorage();
}

// Transform data to match our PaymentMethod type
return data.map(method => ({
id: method.id,
name: method.name,
type: method.type as 'cash' | 'credit_card',
currency: method.currency as Currency,
rewardRules: this.parseJsonField(method.reward_rules, []),
statementStartDay: method.statement_start_day,
isMonthlyStatement: method.is_monthly_statement,
active: method.active,
lastFourDigits: method.last_four_digits,
issuer: method.issuer,
icon: method.icon,
color: method.color,
imageUrl: method.image_url,
conversionRate: this.parseJsonField(method.conversion_rate, {}),
selectedCategories: Array.isArray(method.selected_categories) ? 
  method.selected_categories : 
  (typeof method.selected_categories === 'string' ? 
    JSON.parse(method.selected_categories) : []),
}));
} catch (error) {
console.error('Error in getPaymentMethods:', error);
return this.getPaymentMethodsFromLocalStorage();
}
}

/**
* Helper method to safely parse JSON fields
*/
private parseJsonField(field: any, defaultValue: any): any {
if (!field) return defaultValue;

try {
return typeof field === 'string' ? JSON.parse(field) : field;
} catch (error) {
console.error('Error parsing JSON field:', error);
return defaultValue;
}
}

/**
* Get payment methods from local storage
*/
private getPaymentMethodsFromLocalStorage(): PaymentMethod[] {
try {
const stored = localStorage.getItem(this.PAYMENT_METHODS_STORAGE_KEY);
if (!stored) return [];
return JSON.parse(stored);
} catch (error) {
console.error('Error getting payment methods from local storage:', error);
return [];
}
}

/**
* Save payment methods
*/
public async savePaymentMethods(paymentMethods: PaymentMethod[]): Promise<void> {
if (this.isLocalStorageMode) {
this.savePaymentMethodsToLocalStorage(paymentMethods);
return;
}

try {
// First, get current payment methods to identify what needs to be updated or deleted
const { data: currentMethods, error: fetchError } = await supabase
.from('payment_methods')
.select('id');

if (fetchError) {
console.error('Error fetching current payment methods:', fetchError);
this.savePaymentMethodsToLocalStorage(paymentMethods);
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
    reward_rules: JSON.stringify(method.rewardRules),
    statement_start_day: method.statementStartDay,
    is_monthly_statement: method.isMonthlyStatement,
    active: method.active,
    last_four_digits: method.lastFourDigits,
    issuer: method.issuer,
    icon: method.icon,
    color: method.color,
    image_url: method.imageUrl,
    conversion_rate: method.conversionRate ? JSON.stringify(method.conversionRate) : null,
    selected_categories: method.selectedCategories || [],
  }, { onConflict: 'id' });
  
if (upsertError) {
  console.error('Error upserting payment method:', upsertError);
}
}
} catch (error) {
console.error('Error in savePaymentMethods:', error);
this.savePaymentMethodsToLocalStorage(paymentMethods);
}
}

/**
* Save payment methods to local storage
*/
private savePaymentMethodsToLocalStorage(paymentMethods: PaymentMethod[]): void {
try {
localStorage.setItem(this.PAYMENT_METHODS_STORAGE_KEY, JSON.stringify(paymentMethods));
} catch (error) {
console.error('Error saving payment methods to local storage:', error);
}
}
}

// Export a singleton instance
export const storageService = StorageService.getInstance();

// Export wrapper functions for easier usage and testing
// Export wrapper functions for easier usage and testing
export async function getTransactions(): Promise<Transaction[]> {
  return storageService.getTransactions();
}

export async function addTransaction(transactionData: Omit<Transaction, 'id'>): Promise<Transaction | null> {
  return storageService.addTransaction(transactionData);
}

export async function editTransaction(id: string, updatedTransaction: Omit<Transaction, 'id'>): Promise<Transaction | null> {
  return storageService.editTransaction(id, updatedTransaction);
}

export async function deleteTransaction(id: string): Promise<boolean> {
  return storageService.deleteTransaction(id);
}

export function exportTransactionsToCSV(transactions: Transaction[]): string {
  return storageService.exportTransactionsToCSV(transactions);
}

export async function getMerchantByName(name: string): Promise<Merchant | undefined> {
  return storageService.getMerchantByName(name);
}

export async function addOrUpdateMerchant(merchant: Merchant): Promise<Merchant> {
  return storageService.addOrUpdateMerchant(merchant);
}

export async function getPaymentMethods(): Promise<PaymentMethod[]> {
  return storageService.getPaymentMethods();
}

export async function savePaymentMethods(paymentMethods: PaymentMethod[]): Promise<void> {
  return storageService.savePaymentMethods(paymentMethods);
}

export async function hasMerchantCategorySuggestions(merchantName: string): Promise<boolean> {
  return storageService.hasMerchantCategorySuggestions(merchantName);
}

export async function getSuggestedMerchantCategory(merchantName: string): Promise<MerchantCategoryCode | null> {
  return storageService.getSuggestedMerchantCategory(merchantName);
}

export async function getUsedBonusPoints(
  paymentMethodId: string,
  year?: number,
  month?: number
): Promise<number> {
  return storageService.getUsedBonusPoints(paymentMethodId, year, month);
}

export async function incrementMerchantOccurrence(
  merchantName: string,
  mcc?: MerchantCategoryCode
): Promise<boolean> {
  return storageService.incrementMerchantOccurrence(merchantName, mcc);
}

export async function recordBonusPointsMovement(
  transactionId: string,
  paymentMethodId: string,
  bonusPoints: number
): Promise<boolean> {
  return storageService.recordBonusPointsMovement(transactionId, paymentMethodId, bonusPoints);
}

// Export the service instance
// export { storageService };

// For backwards compatibility, export with legacy names
export {
  addTransaction as createTransaction,
  editTransaction as updateTransaction,
  deleteTransaction as deleteTransactionStorage,
  editTransaction as updateTransactionStorage,
  recordBonusPointsMovement as addBonusPointsMovement, // Add this line for backward compatibility
};