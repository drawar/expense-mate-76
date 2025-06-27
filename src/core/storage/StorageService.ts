import { supabase } from '@/integrations/supabase/client';
import { Transaction, PaymentMethod, Merchant, DbPaymentMethod, DbMerchant, Currency, MerchantCategoryCode } from '@/types';
import { initializeRewardSystem, calculateRewardPoints } from '@/core/rewards';

export class StorageService {
  private useLocalStorage: boolean = true; // Changed to true by default

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
    // Always use localStorage mode now
    return this.getPaymentMethodsFromLocalStorage();
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
    // Always use localStorage mode now
    try {
      localStorage.setItem('paymentMethods', JSON.stringify(paymentMethods));
    } catch (error) {
      console.error('Error saving payment methods to localStorage:', error);
    }
  }

  async saveTransactions(transactions: Transaction[]): Promise<void> {
    // Always use localStorage mode now
    this.saveTransactionsToLocalStorage(transactions);
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
    // Always use localStorage mode now
    return this.getTransactionsFromLocalStorage();
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
    
    // Always use localStorage mode now
    console.log('Using localStorage mode for transaction');
    return this.addTransactionToLocalStorage(transactionData);
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
    // Always use localStorage mode now
    return this.updateTransactionInLocalStorage(id, updates);
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
    // Always use localStorage mode now
    return this.deleteTransactionFromLocalStorage(id);
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

  private async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  }
}

// Export singleton instance
export const storageService = new StorageService();
