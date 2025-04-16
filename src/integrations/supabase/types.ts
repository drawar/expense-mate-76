// core/storage/StorageService.ts
import { Transaction, PaymentMethod, Merchant, MerchantCategoryCode } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';

export class StorageService {
  private static instance: StorageService;
  private useLocalStorage: boolean = false;
  
  private constructor() {}
  
  public static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }
  
  public setLocalStorageMode(useLocalStorage: boolean): void {
    this.useLocalStorage = useLocalStorage;
    console.log(`Storage mode set to ${useLocalStorage ? 'local storage' : 'Supabase'}`);
  }
  
  public isLocalStorageMode(): boolean {
    return this.useLocalStorage;
  }
  
  // =========== Transaction Methods ===========
  
  public async getTransactions(): Promise<Transaction[]> {
    console.log(`Getting transactions with localStorage mode: ${this.useLocalStorage}`);
    
    if (this.useLocalStorage) {
      // Get transactions from local storage
      const storedTransactions = localStorage.getItem('transactions');
      if (storedTransactions) {
        return JSON.parse(storedTransactions) as Transaction[];
      }
      return [];
    } else {
      try {
        // Get transactions from Supabase
        const { data, error } = await supabase
          .from('transactions')
          .select(`
            id,
            date,
            amount,
            currency,
            payment_amount,
            payment_currency,
            reward_points,
            base_points,
            bonus_points,
            is_contactless,
            is_deleted,
            notes,
            reimbursement_amount,
            category,
            merchant_id,
            payment_method_id
          `)
          .eq('is_deleted', false);

        if (error) {
          console.error('Error fetching transactions:', error);
          return [];
        }

        // Now fetch payment methods and merchants to enrich transaction data
        const { data: paymentMethods } = await supabase.from('payment_methods').select('*');
        const { data: merchants } = await supabase.from('merchants').select('*');

        // Map data to Transaction type
        const transactions = data.map(item => {
          // Find the associated payment method
          const paymentMethod = paymentMethods?.find(pm => pm.id === item.payment_method_id);
          
          // Create a default payment method if none is found
          const processedPaymentMethod = {
            id: paymentMethod?.id || item.payment_method_id,
            name: paymentMethod?.name || 'Unknown',
            type: (paymentMethod?.type as 'credit_card' | 'cash') || 'credit_card',
            currency: paymentMethod?.currency || item.payment_currency || 'SGD',
            active: paymentMethod?.active !== false,
            issuer: paymentMethod?.issuer,
            lastFourDigits: paymentMethod?.last_four_digits,
            rewardRules: (paymentMethod?.reward_rules || []) as any[]
          };

          // Find the associated merchant
          const merchant = merchants?.find(m => m.id === item.merchant_id);
          
          // Process merchant data safely
          const processedMerchant = {
            id: merchant?.id || item.merchant_id,
            name: merchant?.name || 'Unknown Merchant',
            address: merchant?.address || undefined,
            isOnline: merchant?.is_online || false,
            coordinates: merchant?.coordinates ? 
              (typeof merchant.coordinates === 'object' ? 
                merchant.coordinates as any : 
                undefined) : 
              undefined,
            mcc: merchant?.mcc ? 
              (typeof merchant.mcc === 'object' ? 
                merchant.mcc as any : 
                undefined) : 
              undefined
          };

          return {
            id: item.id,
            date: item.date,
            merchant: processedMerchant,
            amount: Number(item.amount),
            currency: item.currency,
            paymentMethod: processedPaymentMethod,
            paymentAmount: Number(item.payment_amount || item.amount),
            paymentCurrency: item.payment_currency || item.currency,
            rewardPoints: item.reward_points || 0,
            basePoints: item.base_points || 0,
            bonusPoints: item.bonus_points || 0,
            isContactless: item.is_contactless || false,
            notes: item.notes || '',
            reimbursementAmount: item.reimbursement_amount ? Number(item.reimbursement_amount) : 0,
            category: item.category
          } as Transaction;
        });

        console.log(`Retrieved ${transactions.length} transactions from Supabase`);
        return transactions;
      } catch (error) {
        console.error('Error getting transactions:', error);
        return [];
      }
    }
  }
  
  public async addTransaction(transactionData: Omit<Transaction, 'id'>): Promise<Transaction> {
    try {
      // Generate a client-side ID for both implementations
      const clientId = uuidv4();
      
      if (this.useLocalStorage) {
        // For local storage, use the client-generated ID
        const newTransaction: Transaction = {
          id: clientId,
          ...transactionData
        };
        
        // Save to local storage
        const transactions = await this.getTransactions();
        const updatedTransactions = [...transactions, newTransaction];
        localStorage.setItem('transactions', JSON.stringify(updatedTransactions));
        
        return newTransaction;
      } else {
        // For Supabase, explicitly specify the ID in the insert
        // First, save the merchant if needed
        const merchant = transactionData.merchant;
        let merchantId = merchant.id;
        
        if (!merchantId || merchantId === '') {
          // Create new merchant
          const { data: newMerchant, error: merchantError } = await supabase
            .from('merchants')
            .insert({
              name: merchant.name,
              address: merchant.address,
              is_online: merchant.isOnline,
              coordinates: merchant.coordinates,
              mcc: merchant.mcc
            })
            .select()
            .single();
            
          if (merchantError) {
            console.error('Error creating merchant:', merchantError);
            throw new Error(`Failed to create merchant: ${merchantError.message}`);
          }
          
          merchantId = newMerchant.id;
        }
        
        // Check if transaction with this ID already exists
        const { data: existingTransaction } = await supabase
          .from('transactions')
          .select('id')
          .eq('id', clientId)
          .maybeSingle();
        
        if (existingTransaction) {
          // In the rare case of a collision, generate a new ID
          const alternateId = uuidv4();
          
          // Then save the transaction with the alternate ID
          const { data, error: txError } = await supabase
            .from('transactions')
            .insert({
              id: alternateId,
              date: transactionData.date,
              amount: transactionData.amount,
              currency: transactionData.currency,
              payment_amount: transactionData.paymentAmount,
              payment_currency: transactionData.paymentCurrency,
              reward_points: transactionData.rewardPoints,
              base_points: transactionData.basePoints,
              bonus_points: transactionData.bonusPoints,
              is_contactless: transactionData.isContactless,
              notes: transactionData.notes,
              reimbursement_amount: transactionData.reimbursementAmount,
              merchant_id: merchantId,
              payment_method_id: transactionData.paymentMethod.id
            })
            .select()
            .single();
            
          if (txError) {
            console.error('Error creating transaction:', txError);
            throw new Error(`Failed to save transaction: ${txError.message}`);
          }
          
          const newTransaction: Transaction = {
            id: alternateId,
            ...transactionData
          };
          
          // Update merchant occurrence tracking
          if (transactionData.merchant.mcc) {
            await this.incrementMerchantOccurrence(
              transactionData.merchant.name,
              transactionData.merchant.mcc
            );
          }
          
          // Record bonus points if any
          if (newTransaction.bonusPoints && newTransaction.bonusPoints > 0) {
            await this.recordBonusPointsMovement(
              newTransaction.id,
              newTransaction.paymentMethod.id,
              newTransaction.bonusPoints
            );
          }
          
          return newTransaction;
        } else {
          // No collision, use the original client ID
          const { data, error: txError } = await supabase
            .from('transactions')
            .insert({
              id: clientId,
              date: transactionData.date,
              amount: transactionData.amount,
              currency: transactionData.currency,
              payment_amount: transactionData.paymentAmount,
              payment_currency: transactionData.paymentCurrency,
              reward_points: transactionData.rewardPoints,
              base_points: transactionData.basePoints,
              bonus_points: transactionData.bonusPoints,
              is_contactless: transactionData.isContactless,
              notes: transactionData.notes,
              reimbursement_amount: transactionData.reimbursementAmount,
              merchant_id: merchantId,
              payment_method_id: transactionData.paymentMethod.id
            })
            .select()
            .single();
            
          if (txError) {
            console.error('Error creating transaction:', txError);
            throw new Error(`Failed to save transaction: ${txError.message}`);
          }
          
          const newTransaction: Transaction = {
            id: clientId,
            ...transactionData
          };
          
          // Update merchant occurrence tracking
          if (transactionData.merchant.mcc) {
            await this.incrementMerchantOccurrence(
              transactionData.merchant.name,
              transactionData.merchant.mcc
            );
          }
          
          // Record bonus points if any
          if (newTransaction.bonusPoints && newTransaction.bonusPoints > 0) {
            await this.recordBonusPointsMovement(
              newTransaction.id,
              newTransaction.paymentMethod.id,
              newTransaction.bonusPoints
            );
          }
          
          return newTransaction;
        }
      }
    } catch (error) {
      console.error('Error saving transaction to Supabase:', error);
      throw error;
    }
  }
  
  public async editTransaction(id: string, data: Partial<Transaction>): Promise<Transaction> {
    if (this.useLocalStorage) {
      // Update in local storage
      const transactions = await this.getTransactions();
      const transactionIndex = transactions.findIndex(t => t.id === id);
      
      if (transactionIndex === -1) {
        throw new Error(`Transaction with ID ${id} not found`);
      }
      
      const updatedTransaction = {
        ...transactions[transactionIndex],
        ...data
      };
      
      transactions[transactionIndex] = updatedTransaction;
      localStorage.setItem('transactions', JSON.stringify(transactions));
      
      return updatedTransaction;
    } else {
      // Update in Supabase
      try {
        // Prepare data for update
        const updateData: any = {};
        
        if (data.amount !== undefined) updateData.amount = data.amount;
        if (data.currency !== undefined) updateData.currency = data.currency;
        if (data.paymentAmount !== undefined) updateData.payment_amount = data.paymentAmount;
        if (data.paymentCurrency !== undefined) updateData.payment_currency = data.paymentCurrency;
        if (data.date !== undefined) updateData.date = data.date;
        if (data.notes !== undefined) updateData.notes = data.notes;
        if (data.isContactless !== undefined) updateData.is_contactless = data.isContactless;
        if (data.rewardPoints !== undefined) updateData.reward_points = data.rewardPoints;
        if (data.basePoints !== undefined) updateData.base_points = data.basePoints;
        if (data.bonusPoints !== undefined) updateData.bonus_points = data.bonusPoints;
        if (data.reimbursementAmount !== undefined) updateData.reimbursement_amount = data.reimbursementAmount;
        if (data.category !== undefined) updateData.category = data.category;
        
        // Handle payment method update
        if (data.paymentMethod) {
          updateData.payment_method_id = data.paymentMethod.id;
        }
        
        // Handle merchant update
        if (data.merchant) {
          const merchant = data.merchant;
          let merchantId = merchant.id;
          
          if (!merchantId || merchantId === '') {
            // Create new merchant
            const merchantData = {
              name: merchant.name,
              address: merchant.address || null,
              is_online: merchant.isOnline || false,
              coordinates: merchant.coordinates || null,
              mcc: merchant.mcc || null
            };
            
            const { data: newMerchant, error: merchantError } = await supabase
              .from('merchants')
              .insert(merchantData) // Fixed: passing a single object instead of an array
              .select()
              .single();
              
            if (merchantError) {
              console.error('Error creating merchant:', merchantError);
              throw new Error(`Failed to create merchant: ${merchantError.message}`);
            }
            
            merchantId = newMerchant.id;
          } else {
            // Update existing merchant
            const merchantUpdateData = {
              name: merchant.name,
              address: merchant.address || null,
              is_online: merchant.isOnline || false,
              coordinates: merchant.coordinates || null,
              mcc: merchant.mcc || null
            };
            
            const { error: merchantError } = await supabase
              .from('merchants')
              .update(merchantUpdateData)
              .eq('id', merchantId);
              
            if (merchantError) {
              console.error('Error updating merchant:', merchantError);
              throw new Error(`Failed to update merchant: ${merchantError.message}`);
            }
          }
          
          updateData.merchant_id = merchantId;
        }
        
        // Update the transaction
        const { error: txError } = await supabase
          .from('transactions')
          .update(updateData)
          .eq('id', id);
          
        if (txError) {
          console.error('Error updating transaction:', txError);
          throw new Error(`Failed to update transaction: ${txError.message}`);
        }
        
        // Get the updated transaction
        const { data: updatedTx, error: fetchError } = await supabase
          .from('transactions')
          .select(`
            id,
            date,
            amount,
            currency,
            payment_amount,
            payment_currency,
            reward_points,
            base_points,
            bonus_points,
            is_contactless,
            notes,
            reimbursement_amount,
            category,
            merchant_id,
            payment_method_id
          `)
          .eq('id', id)
          .single();
          
        if (fetchError || !updatedTx) {
          console.error('Error fetching updated transaction:', fetchError);
          throw new Error(`Failed to fetch updated transaction: ${fetchError?.message || 'Not found'}`);
        }
        
        // Get full transaction details (with merchant and payment method)
        const transactions = await this.getTransactions();
        const fullTransaction = transactions.find(t => t.id === id);
        
        if (!fullTransaction) {
          throw new Error(`Transaction with ID ${id} not found after update`);
        }
        
        return fullTransaction;
      } catch (error) {
        console.error('Error updating transaction in Supabase:', error);
        throw error;
      }
    }
  }
  
  public async deleteTransaction(id: string): Promise<boolean> {
    if (this.useLocalStorage) {
      // Delete from local storage
      const transactions = await this.getTransactions();
      const filteredTransactions = transactions.filter(t => t.id !== id);
      
      if (filteredTransactions.length === transactions.length) {
        // Transaction not found
        return false;
      }
      
      localStorage.setItem('transactions', JSON.stringify(filteredTransactions));
      return true;
    } else {
      // Delete from Supabase (soft delete)
      try {
        const { error } = await supabase
          .from('transactions')
          .update({ is_deleted: true })
          .eq('id', id);
          
        if (error) {
          console.error('Error deleting transaction:', error);
          return false;
        }
        
        // Delete bonus points movements
        await this.deleteBonusPointsMovements(id);
        
        return true;
      } catch (error) {
        console.error('Error deleting transaction from Supabase:', error);
        return false;
      }
    }
  }
  
  public async exportTransactionsToCSV(transactions: Transaction[]): Promise<string> {
    // Create headers
    const headers = [
      'Date',
      'Merchant',
      'Amount',
      'Currency',
      'Payment Method',
      'Category',
      'Points'
    ].join(',');
    
    // Create rows
    const rows = transactions.map(transaction => {
      return [
        transaction.date,
        `"${transaction.merchant.name.replace(/"/g, '""')}"`, // Escape quotes in merchant name
        transaction.amount,
        transaction.currency,
        `"${transaction.paymentMethod.name.replace(/"/g, '""')}"`,
        transaction.category || 'Uncategorized',
        transaction.rewardPoints || 0
      ].join(',');
    });
    
    // Combine headers and rows
    return [headers, ...rows].join('\n');
  }
  
  // =========== Payment Method Methods ===========
  
  public async getPaymentMethods(): Promise<PaymentMethod[]> {
    try {
      console.log(`Getting payment methods with localStorage mode: ${this.useLocalStorage}`);
      
      if (this.useLocalStorage) {
        // Try to get from local storage
        const storedPaymentMethods = localStorage.getItem('paymentMethods');
        if (storedPaymentMethods) {
          return JSON.parse(storedPaymentMethods) as PaymentMethod[];
        }
        
        // Return default methods if none found
        return this.getDefaultPaymentMethods();
      } else {
        // Get from Supabase
        const { data, error } = await supabase
          .from('payment_methods')
          .select('*')
          .order('name');
        
        if (error) {
          console.error('Error fetching payment methods:', error);
          // Fallback to local storage
          return this.getDefaultPaymentMethods();
        }
        
        if (!data || data.length === 0) {
          console.log('No payment methods found, returning defaults');
          return this.getDefaultPaymentMethods();
        }
        
        // Transform to our PaymentMethod type
        const paymentMethods = data.map(item => ({
          id: item.id,
          name: item.name,
          type: item.type as 'credit_card' | 'cash',
          currency: item.currency,
          active: item.active !== false,
          issuer: item.issuer,
          lastFourDigits: item.last_four_digits,
          imageUrl: item.image_url,
          color: item.color,
          isMonthlyStatement: item.is_monthly_statement,
          statementStartDay: item.statement_start_day,
          rewardRules: (item.reward_rules || []) as any[]
        })) as PaymentMethod[];
        
        console.log(`Retrieved ${paymentMethods.length} payment methods from Supabase`);
        return paymentMethods;
      }
    } catch (error) {
      console.error('Error getting payment methods:', error);
      return this.getDefaultPaymentMethods();
    }
  }
  
  private getDefaultPaymentMethods(): PaymentMethod[] {
    return [
      {
        id: uuidv4(),
        name: 'Cash (SGD)',
        type: 'cash',
        currency: 'SGD',
        active: true,
        rewardRules: []
      },
      {
        id: uuidv4(),
        name: 'Cash (USD)',
        type: 'cash',
        currency: 'USD',
        active: true,
        rewardRules: []
      },
      {
        id: uuidv4(),
        name: 'Visa Card',
        type: 'credit_card',
        currency: 'SGD',
        issuer: 'Visa',
        lastFourDigits: '1234',
        active: true,
        rewardRules: []
      }
    ];
  }
  
  // =========== Merchant Methods ===========
  
  public async getMerchantByName(name: string): Promise<any | null> {
    if (!name || name.trim().length < 3) return null;
    
    const normalizedName = name.trim().toLowerCase();
    
    try {
      if (this.useLocalStorage) {
        // For local storage implementation
        const storedMerchants = localStorage.getItem('merchants');
        if (storedMerchants) {
          const merchants = JSON.parse(storedMerchants);
          return merchants.find((m: any) => 
            m.name.toLowerCase().includes(normalizedName) ||
            normalizedName.includes(m.name.toLowerCase())
          );
        }
        return null;
      } else {
        // For Supabase implementation
        const { data, error } = await supabase
          .from('merchants')
          .select('*')
          .ilike('name', `%${normalizedName}%`)
          .order('created_at', { ascending: false })
          .limit(1);
        
        if (error || !data || data.length === 0) {
          return null;
        }
        
        return data[0];
      }
    } catch (error) {
      console.error('Error getting merchant by name:', error);
      return null;
    }
  }
  
  public async hasMerchantCategorySuggestions(name: string): Promise<boolean> {
    if (!name || name.trim().length < 3) return false;
    
    const normalizedName = name.trim().toLowerCase();
    
    try {
      if (this.useLocalStorage) {
        // For local storage implementation
        const storedMappings = localStorage.getItem('merchantCategoryMappings');
        if (storedMappings) {
          const mappings = JSON.parse(storedMappings);
          return mappings.some((m: any) => 
            m.merchant_name.toLowerCase().includes(normalizedName) ||
            normalizedName.includes(m.merchant_name.toLowerCase())
          );
        }
        return false;
      } else {
        // For Supabase implementation
        const { data, error } = await supabase
          .from('merchant_category_mappings')
          .select('id')
          .ilike('merchant_name', `%${normalizedName}%`)
          .not('most_common_mcc', 'is', null)
          .limit(1);
        
        if (error) {
          console.error('Error checking merchant category suggestions:', error);
          return false;
        }
        
        return data && data.length > 0;
      }
    } catch (error) {
      console.error('Error checking merchant category suggestions:', error);
      return false;
    }
  }
  
  public async getSuggestedMerchantCategory(name: string): Promise<MerchantCategoryCode | null> {
    if (!name || name.trim().length < 3) return null;
    
    const normalizedName = name.trim().toLowerCase();
    
    try {
      if (this.useLocalStorage) {
        // For local storage implementation
        const storedMappings = localStorage.getItem('merchantCategoryMappings');
        if (storedMappings) {
          const mappings = JSON.parse(storedMappings);
          const match = mappings.find((m: any) => 
            m.merchant_name.toLowerCase().includes(normalizedName) ||
            normalizedName.includes(m.merchant_name.toLowerCase())
          );
          
          return match?.most_common_mcc || null;
        }
        return null;
      } else {
        // For Supabase implementation
        const { data, error } = await supabase
          .from('merchant_category_mappings')
          .select('most_common_mcc')
          .ilike('merchant_name', `%${normalizedName}%`)
          .order('occurrence_count', { ascending: false })
          .limit(1);
        
        if (error || !data || data.length === 0) {
          return null;
        }
        
        // Validate JSON shape before casting
        const jsonMcc = data[0].most_common_mcc;
        
        if (jsonMcc && 
            typeof jsonMcc === 'object' && 
            'code' in jsonMcc && 
            'description' in jsonMcc &&
            typeof jsonMcc.code === 'string' && 
            typeof jsonMcc.description === 'string') {
          
          return {
            code: jsonMcc.code as string,
            description: jsonMcc.description as string
          };
        }
        
        return null;
      }
    } catch (error) {
      console.error('Error getting suggested merchant category:', error);
      return null;
    }
  }
  
  // =========== Helper Methods ===========
  
  private async incrementMerchantOccurrence(merchantName: string, mcc?: any): Promise<boolean> {
    if (!merchantName || merchantName.trim().length === 0) {
      return false;
    }
    
    const normalizedName = merchantName.trim();
    
    try {
      if (this.useLocalStorage) {
        // For local storage
        const storedMappings = localStorage.getItem('merchantCategoryMappings') || '[]';
        const mappings = JSON.parse(storedMappings);
        
        // Find if we already have this merchant
        const existingIndex = mappings.findIndex((m: any) => 
          m.merchant_name.toLowerCase() === normalizedName.toLowerCase()
        );
        
        if (existingIndex >= 0) {
          // Update existing mapping
          mappings[existingIndex].occurrence_count += 1;
          
          // Update most common MCC if provided
          if (mcc) {
            mappings[existingIndex].most_common_mcc = mcc;
          }
        } else {
          // Create new mapping
          mappings.push({
            id: uuidv4(),
            merchant_name: normalizedName,
            occurrence_count: 1,
            most_common_mcc: mcc || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        }
        
        localStorage.setItem('merchantCategoryMappings', JSON.stringify(mappings));
        return true;
      } else {
        // For Supabase
        // First check if mapping exists
        const { data, error } = await supabase
          .from('merchant_category_mappings')
          .select('id, occurrence_count, most_common_mcc')
          .eq('merchant_name', normalizedName)
          .limit(1);
        
        if (error) {
          console.error('Error checking merchant mapping:', error);
          return false;
        }
        
        if (data && data.length > 0) {
          // Update existing mapping
          const mapping = data[0];
          const updateData: any = {
            occurrence_count: (mapping.occurrence_count || 0) + 1,
            updated_at: new Date().toISOString()
          };
          
          // Update MCC if provided
          if (mcc) {
            updateData.most_common_mcc = mcc;
          }
          
          const { error: updateError } = await supabase
            .from('merchant_category_mappings')
            .update(updateData)
            .eq('id', mapping.id);
          
          if (updateError) {
            console.error('Error updating merchant mapping:', updateError);
          }
          
          return !updateError;
        } else {
          // Create new mapping
          const { error: insertError } = await supabase
            .from('merchant_category_mappings')
            .insert({
              merchant_name: normalizedName,
              occurrence_count: 1,
              most_common_mcc: mcc || null
            });
          
          if (insertError) {
            console.error('Error creating merchant mapping:', insertError);
          }
          
          return !insertError;
        }
      }
    } catch (error) {
      console.error('Error tracking merchant occurrence:', error);
      return false;
    }
  }
  
  private async recordBonusPointsMovement(transactionId: string, paymentMethodId: string, points: number): Promise<boolean> {
    if (!points || points <= 0) {
      return false;
    }
    
    try {
      if (this.useLocalStorage) {
        // For local storage
        const storedMovements = localStorage.getItem('bonusPointsMovements') || '[]';
        const movements = JSON.parse(storedMovements);
        
        movements.push({
          id: uuidv4(),
          transaction_id: transactionId,
          payment_method_id: paymentMethodId,
          bonus_points: points,
          created_at: new Date().toISOString()
        });
        
        localStorage.setItem('bonusPointsMovements', JSON.stringify(movements));
        return true;
      } else {
        // For Supabase
        const { error } = await supabase
          .from('bonus_points_movements')
          .insert({
            transaction_id: transactionId,
            payment_method_id: paymentMethodId,
            bonus_points: points
          });
        
        if (error) {
          console.error('Error recording bonus points movement:', error);
          return false;
        }
        
        return true;
      }
    } catch (error) {
      console.error('Error recording bonus points movement:', error);
      return false;
    }
  }
  
  private async deleteBonusPointsMovements(transactionId: string): Promise<boolean> {
    try {
      if (this.useLocalStorage) {
        // For local storage
        const storedMovements = localStorage.getItem('bonusPointsMovements') || '[]';
        const movements = JSON.parse(storedMovements);
        
        const filteredMovements = movements.filter((m: any) => m.transaction_id !== transactionId);
        
        localStorage.setItem('bonusPointsMovements', JSON.stringify(filteredMovements));
        return true;
      } else {
        // For Supabase
        const { error } = await supabase
          .from('bonus_points_movements')
          .delete()
          .eq('transaction_id', transactionId);
          
        if (error) {
          console.error('Error deleting bonus points movements:', error);
          return false;
        }
        
        return true;
      }
    } catch (error) {
      console.error('Error deleting bonus points movements:', error);
      return false;
    }
  }
}

// Export a singleton instance
export const storageService = StorageService.getInstance();
