import { supabase } from '@/integrations/supabase/client';
import { Transaction, PaymentMethod, Merchant, DbPaymentMethod, DbMerchant, Currency, MerchantCategoryCode } from '@/types';
import { initializeRewardSystem, calculateRewardPoints } from '@/core/rewards';

export class StorageService {
  private useLocalStorage: boolean = false;

  constructor() {
    // Initialize reward system when storage service is created
    this.initializeRewards();
  }

  private async initializeRewards() {
    try {
      await initializeRewardSystem(this.useLocalStorage);
    } catch (error) {
      console.warn('Failed to initialize reward system:', error);
    }
  }

  setLocalStorageMode(useLocal: boolean) {
    this.useLocalStorage = useLocal;
    // Re-initialize reward system with new mode
    this.initializeRewards();
  }

  async getPaymentMethods(): Promise<PaymentMethod[]> {
    if (this.useLocalStorage) {
      return this.getPaymentMethodsFromLocalStorage();
    }

    try {
      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('active', true)
        .order('name');

      if (error) {
        console.error('Supabase error:', error);
        return this.getPaymentMethodsFromLocalStorage();
      }

      if (!data) return [];

      return data.map((row: any) => ({
        id: row.id,
        name: row.name,
        type: row.type as any,
        issuer: row.issuer || '',
        lastFourDigits: row.last_four_digits || undefined,
        currency: row.currency as Currency,
        icon: row.icon || undefined,
        color: row.color || undefined,
        imageUrl: row.image_url || undefined,
        pointsCurrency: row.points_currency || undefined,
        active: row.active,
        rewardRules: row.reward_rules || [],
        selectedCategories: row.selected_categories || [],
        statementStartDay: row.statement_start_day || undefined,
        isMonthlyStatement: row.is_monthly_statement || undefined,
        conversionRate: row.conversion_rate || undefined
      }));
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      return this.getPaymentMethodsFromLocalStorage();
    }
  }

  private getPaymentMethodsFromLocalStorage(): PaymentMethod[] {
    try {
      const stored = localStorage.getItem('paymentMethods');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error parsing payment methods from localStorage:', error);
      return [];
    }
  }

  async savePaymentMethods(paymentMethods: PaymentMethod[]): Promise<void> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        throw new Error('User not authenticated');
      }

      const dbPaymentMethods: DbPaymentMethod[] = paymentMethods.map(pm => ({
        id: pm.id,
        name: pm.name,
        type: pm.type,
        issuer: pm.issuer,
        last_four_digits: pm.lastFourDigits,
        currency: pm.currency,
        icon: pm.icon,
        color: pm.color,
        image_url: pm.imageUrl,
        points_currency: pm.pointsCurrency || null,
        active: pm.active,
        reward_rules: pm.rewardRules,
        selected_categories: pm.selectedCategories,
        statement_start_day: pm.statementStartDay,
        is_monthly_statement: pm.isMonthlyStatement,
        conversion_rate: pm.conversionRate,
        user_id: session.user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));

      const { error } = await supabase
        .from('payment_methods')
        .upsert(dbPaymentMethods);

      if (error) throw error;
    } catch (error) {
      console.error('Error saving payment methods:', error);
      throw error;
    }
  }

  async getMerchants(): Promise<Merchant[]> {
    try {
      const { data: merchants, error } = await supabase
        .from('merchants')
        .select('*')
        .eq('is_deleted', false);

      if (error) throw error;

      return merchants.map(m => ({
        id: m.id,
        name: m.name,
        address: m.address || '',
        mcc: m.mcc ? this.parseMCC(m.mcc) : undefined,
        isOnline: m.is_online || false,
        coordinates: m.coordinates ? this.parseCoordinates(m.coordinates) : undefined
      }));
    } catch (error) {
      console.error('Error fetching merchants:', error);
      throw error;
    }
  }

  private parseMCC(mccData: any): MerchantCategoryCode | undefined {
    if (!mccData) return undefined;
    
    // Handle different possible formats of MCC data
    if (typeof mccData === 'object' && mccData.code && mccData.description) {
      return {
        code: String(mccData.code),
        description: String(mccData.description)
      };
    }
    
    return undefined;
  }

  private parseCoordinates(coordinatesData: any): { lat: number; lng: number; } | undefined {
    if (!coordinatesData) return undefined;
    
    // Handle different possible formats of coordinates data
    if (typeof coordinatesData === 'object' && coordinatesData.lat && coordinatesData.lng) {
      return {
        lat: Number(coordinatesData.lat),
        lng: Number(coordinatesData.lng)
      };
    }
    
    return undefined;
  }

  async saveMerchants(merchants: Merchant[]): Promise<void> {
    try {
      const dbMerchants = merchants.map(m => ({
        id: m.id,
        name: m.name,
        address: m.address,
        mcc: m.mcc as any, // Cast to any for JSON compatibility
        is_online: m.isOnline,
        coordinates: m.coordinates as any, // Cast to any for JSON compatibility
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));

      const { error } = await supabase
        .from('merchants')
        .upsert(dbMerchants);

      if (error) throw error;
    } catch (error) {
      console.error('Error saving merchants:', error);
      throw error;
    }
  }

  async getTransactions(): Promise<Transaction[]> {
    if (this.useLocalStorage) {
      return this.getTransactionsFromLocalStorage();
    }

    try {
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          payment_methods:payment_method_id(
            id, name, type, issuer, last_four_digits, currency, 
            icon, color, image_url, active, 
            reward_rules, selected_categories, statement_start_day, 
            is_monthly_statement, conversion_rate
          ),
          merchants:merchant_id(
            id, name, address, mcc, is_online, coordinates, is_deleted
          )
        `)
        .eq('is_deleted', false)
        .order('date', { ascending: false });

      if (error) {
        console.error('Supabase error:', error);
        return this.getTransactionsFromLocalStorage();
      }

      if (!data) return [];

      return data.map(row => ({
        id: row.id,
        date: row.date,
        merchant: {
          id: row.merchants?.id || '',
          name: row.merchants?.name || 'Unknown Merchant',
          address: row.merchants?.address || undefined,
          mcc: row.merchants?.mcc ? this.parseMCC(row.merchants.mcc) : undefined,
          isOnline: row.merchants?.is_online || false,
          coordinates: row.merchants?.coordinates ? this.parseCoordinates(row.merchants.coordinates) : undefined,
          is_deleted: row.merchants?.is_deleted || false
        } as Merchant,
        amount: parseFloat(row.amount?.toString() || '0'),
        currency: row.currency as Currency,
        paymentMethod: {
          id: row.payment_methods?.id || '',
          name: row.payment_methods?.name || 'Unknown Payment Method',
          type: row.payment_methods?.type as any,
          issuer: row.payment_methods?.issuer || '',
          lastFourDigits: row.payment_methods?.last_four_digits || undefined,
          currency: (row.payment_methods?.currency || 'USD') as Currency,
          icon: row.payment_methods?.icon || undefined,
          color: row.payment_methods?.color || undefined,
          imageUrl: row.payment_methods?.image_url || undefined,
          pointsCurrency: undefined, // Will be handled separately
          active: row.payment_methods?.active || true,
          rewardRules: row.payment_methods?.reward_rules || [],
          selectedCategories: row.payment_methods?.selected_categories || [],
          statementStartDay: row.payment_methods?.statement_start_day || undefined,
          isMonthlyStatement: row.payment_methods?.is_monthly_statement || undefined,
          conversionRate: row.payment_methods?.conversion_rate || undefined
        } as PaymentMethod,
        paymentAmount: parseFloat(row.payment_amount?.toString() || row.amount?.toString() || '0'),
        paymentCurrency: (row.payment_currency || row.currency) as Currency,
        rewardPoints: row.total_points || 0,
        basePoints: row.base_points || 0,
        bonusPoints: row.bonus_points || 0,
        isContactless: row.is_contactless || false,
        notes: row.notes || undefined,
        reimbursementAmount: row.reimbursement_amount ? parseFloat(row.reimbursement_amount.toString()) : undefined,
        category: row.category || undefined
      }));
    } catch (error) {
      console.error('Error fetching transactions:', error);
      return this.getTransactionsFromLocalStorage();
    }
  }

  private getTransactionsFromLocalStorage(): Transaction[] {
    try {
      const stored = localStorage.getItem('transactions');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error parsing transactions from localStorage:', error);
      return [];
    }
  }

  private saveTransactionsToLocalStorage(transactions: Transaction[]) {
    try {
      localStorage.setItem('transactions', JSON.stringify(transactions));
    } catch (error) {
      console.error('Error saving transactions to localStorage:', error);
    }
  }

  async addTransaction(transactionData: Omit<Transaction, 'id'>): Promise<Transaction> {
    console.log('StorageService.addTransaction called with:', transactionData);
    
    if (this.useLocalStorage) {
      console.log('Using localStorage mode for transaction');
      return this.addTransactionToLocalStorage(transactionData);
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        throw new Error('User not authenticated');
      }

      // Generate a proper merchant ID if it's empty
      const merchantId = transactionData.merchant.id || crypto.randomUUID();
      console.log('Generated merchant ID:', merchantId);

      // Calculate reward points before saving
      const tempTransaction: Transaction = {
        ...transactionData,
        id: 'temp',
        merchant: {
          ...transactionData.merchant,
          id: merchantId
        }
      };
      
      const rewardCalculation = await calculateRewardPoints(tempTransaction);
      console.log('Calculated reward points:', rewardCalculation);

      // First, ensure merchant exists
      const merchantData = {
        id: merchantId,
        name: transactionData.merchant.name,
        address: transactionData.merchant.address,
        mcc: transactionData.merchant.mcc as any,
        is_online: transactionData.merchant.isOnline,
        coordinates: transactionData.merchant.coordinates as any
      };
      
      console.log('Upserting merchant:', merchantData);
      const merchantResult = await supabase
        .from('merchants')
        .upsert([merchantData], { onConflict: 'id' })
        .select()
        .single();

      if (merchantResult.error) {
        console.error('Error upserting merchant:', merchantResult.error);
        console.log('Falling back to localStorage due to merchant error');
        return this.addTransactionToLocalStorage(transactionData);
      }

      console.log('Merchant upserted successfully:', merchantResult.data);

      // Insert transaction
      const transactionInsertData = {
        date: transactionData.date,
        merchant_id: merchantId,
        amount: transactionData.amount,
        currency: transactionData.currency,
        payment_method_id: transactionData.paymentMethod.id,
        payment_amount: transactionData.paymentAmount,
        payment_currency: transactionData.paymentCurrency,
        total_points: rewardCalculation.totalPoints,
        base_points: rewardCalculation.basePoints,
        bonus_points: rewardCalculation.bonusPoints,
        is_contactless: transactionData.isContactless,
        notes: transactionData.notes,
        reimbursement_amount: transactionData.reimbursementAmount,
        category: transactionData.category,
        user_id: session.user.id
      };

      console.log('Inserting transaction:', transactionInsertData);
      const { data, error } = await supabase
        .from('transactions')
        .insert([transactionInsertData])
        .select()
        .single();

      if (error) {
        console.error('Supabase error adding transaction:', error);
        console.log('Falling back to localStorage due to transaction error');
        return this.addTransactionToLocalStorage(transactionData);
      }

      console.log('Transaction inserted successfully:', data);

      // Return the complete transaction object
      const newTransaction: Transaction = {
        id: data.id,
        date: data.date,
        merchant: {
          ...transactionData.merchant,
          id: merchantId
        },
        amount: parseFloat(data.amount.toString()),
        currency: data.currency as Currency,
        paymentMethod: transactionData.paymentMethod,
        paymentAmount: parseFloat(data.payment_amount.toString()),
        paymentCurrency: data.payment_currency as Currency,
        rewardPoints: data.total_points || 0,
        basePoints: data.base_points || 0,
        bonusPoints: data.bonus_points || 0,
        isContactless: data.is_contactless || false,
        notes: data.notes || undefined,
        reimbursementAmount: data.reimbursement_amount ? parseFloat(data.reimbursement_amount.toString()) : undefined,
        category: data.category || undefined
      };

      console.log('Returning completed transaction:', newTransaction);
      return newTransaction;
    } catch (error) {
      console.error('Error adding transaction to Supabase:', error);
      console.log('Falling back to localStorage due to caught error');
      return this.addTransactionToLocalStorage(transactionData);
    }
  }

  private addTransactionToLocalStorage(transactionData: Omit<Transaction, 'id'>): Transaction {
    console.log('Adding transaction to localStorage:', transactionData);
    const transactions = this.getTransactionsFromLocalStorage();
    const newTransaction: Transaction = {
      ...transactionData,
      id: crypto.randomUUID(),
      merchant: {
        ...transactionData.merchant,
        id: transactionData.merchant.id || crypto.randomUUID()
      }
    };
    
    transactions.unshift(newTransaction);
    this.saveTransactionsToLocalStorage(transactions);
    console.log('Transaction added to localStorage:', newTransaction);
    return newTransaction;
  }

  async updateTransaction(id: string, updates: Partial<Transaction>): Promise<Transaction | null> {
    if (this.useLocalStorage) {
      return this.updateTransactionInLocalStorage(id, updates);
    }

    try {
      const { data, error } = await supabase
        .from('transactions')
        .update({
          date: updates.date,
          amount: updates.amount,
          currency: updates.currency,
          payment_amount: updates.paymentAmount,
          payment_currency: updates.paymentCurrency,
          total_points: updates.rewardPoints,
          base_points: updates.basePoints,
          bonus_points: updates.bonusPoints,
          is_contactless: updates.isContactless,
          notes: updates.notes,
          reimbursement_amount: updates.reimbursementAmount,
          category: updates.category,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Supabase error updating transaction:', error);
        return this.updateTransactionInLocalStorage(id, updates);
      }

      // Get full transaction data
      const transactions = await this.getTransactions();
      return transactions.find(t => t.id === id) || null;
    } catch (error) {
      console.error('Error updating transaction:', error);
      return this.updateTransactionInLocalStorage(id, updates);
    }
  }

  private updateTransactionInLocalStorage(id: string, updates: Partial<Transaction>): Transaction | null {
    const transactions = this.getTransactionsFromLocalStorage();
    const index = transactions.findIndex(t => t.id === id);
    
    if (index === -1) return null;
    
    transactions[index] = { ...transactions[index], ...updates };
    this.saveTransactionsToLocalStorage(transactions);
    return transactions[index];
  }

  async deleteTransaction(id: string): Promise<boolean> {
    if (this.useLocalStorage) {
      return this.deleteTransactionFromLocalStorage(id);
    }

    try {
      const { error } = await supabase
        .from('transactions')
        .update({ 
          is_deleted: true,
          deleted_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) {
        console.error('Supabase error deleting transaction:', error);
        return this.deleteTransactionFromLocalStorage(id);
      }

      return true;
    } catch (error) {
      console.error('Error deleting transaction:', error);
      return this.deleteTransactionFromLocalStorage(id);
    }
  }

  private deleteTransactionFromLocalStorage(id: string): boolean {
    const transactions = this.getTransactionsFromLocalStorage();
    const filteredTransactions = transactions.filter(t => t.id !== id);
    this.saveTransactionsToLocalStorage(filteredTransactions);
    return true;
  }

  async exportTransactionsToCSV(transactions: Transaction[]): Promise<string> {
    const headers = [
      'Date',
      'Merchant',
      'Amount',
      'Currency',
      'Payment Method',
      'Payment Amount',
      'Payment Currency',
      'Reward Points',
      'Base Points',
      'Bonus Points',
      'Is Contactless',
      'Notes',
      'Category',
      'Reimbursement Amount'
    ];

    const csvRows = [
      headers.join(','),
      ...transactions.map(transaction => [
        transaction.date,
        `"${transaction.merchant.name}"`,
        transaction.amount,
        transaction.currency,
        `"${transaction.paymentMethod.name}"`,
        transaction.paymentAmount,
        transaction.paymentCurrency,
        transaction.rewardPoints,
        transaction.basePoints,
        transaction.bonusPoints,
        transaction.isContactless,
        `"${transaction.notes || ''}"`,
        `"${transaction.category || ''}"`,
        transaction.reimbursementAmount || ''
      ].join(','))
    ];

    return csvRows.join('\n');
  }

  async hasMerchantCategorySuggestions(merchantName: string): Promise<boolean> {
    // Simple implementation for now
    return false;
  }

  async getSuggestedMerchantCategory(merchantName: string): Promise<MerchantCategoryCode | null> {
    // Simple implementation for now
    return null;
  }

  async uploadCardImage(file: File): Promise<string> {
    // Placeholder implementation for card image upload
    // In a real implementation, this would upload to a storage service
    return URL.createObjectURL(file);
  }
}

// Export singleton instance
export const storageService = new StorageService();
