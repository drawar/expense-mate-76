
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';
import { Transaction, PaymentMethod, Merchant, DbPaymentMethod, DbMerchant } from '@/types';
import { RewardRule } from '../rewards/types';
import { RuleMapper } from '../rewards/RuleMapper';

export class StorageService {
  private supabase: SupabaseClient<Database>;
  private localStorageMode: boolean = false;
  private ruleMapper: RuleMapper = new RuleMapper();
  
  constructor(supabaseClient: SupabaseClient<Database>) {
    this.supabase = supabaseClient;
  }

  setLocalStorageMode(enabled: boolean): void {
    this.localStorageMode = enabled;
  }

  async getPaymentMethods(): Promise<PaymentMethod[]> {
    try {
      const { data: paymentMethods, error } = await this.supabase
        .from('payment_methods')
        .select('*')
        .eq('is_deleted', false);

      if (error) throw error;

      return paymentMethods.map(pm => ({
        id: pm.id,
        name: pm.name,
        type: pm.type as any,
        issuer: pm.issuer || '',
        lastFourDigits: pm.last_four_digits,
        currency: pm.currency as any,
        icon: pm.icon,
        color: pm.color,
        imageUrl: pm.image_url,
        pointsCurrency: pm.points_currency,
        active: pm.active,
        rewardRules: pm.reward_rules,
        selectedCategories: pm.selected_categories,
        statementStartDay: pm.statement_start_day,
        isMonthlyStatement: pm.is_monthly_statement,
        conversionRate: pm.conversion_rate
      }));
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      throw error;
    }
  }

  async savePaymentMethods(paymentMethods: PaymentMethod[]): Promise<void> {
    try {
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
        points_currency: pm.pointsCurrency,
        active: pm.active,
        reward_rules: pm.rewardRules,
        selected_categories: pm.selectedCategories,
        statement_start_day: pm.statementStartDay,
        is_monthly_statement: pm.isMonthlyStatement,
        conversion_rate: pm.conversionRate,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));

      const { error } = await this.supabase
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
      const { data: merchants, error } = await this.supabase
        .from('merchants')
        .select('*')
        .eq('is_deleted', false);

      if (error) throw error;

      return merchants.map(m => ({
        id: m.id,
        name: m.name,
        address: m.address || '',
        mcc: m.mcc ? {
          code: m.mcc.code,
          description: m.mcc.description
        } : undefined,
        isOnline: m.is_online || false,
        coordinates: m.coordinates
      }));
    } catch (error) {
      console.error('Error fetching merchants:', error);
      throw error;
    }
  }

  async saveMerchants(merchants: Merchant[]): Promise<void> {
    try {
      const dbMerchants: DbMerchant[] = merchants.map(m => ({
        id: m.id,
        name: m.name,
        address: m.address,
        mcc: m.mcc,
        is_online: m.isOnline,
        coordinates: m.coordinates,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));

      const { error } = await this.supabase
        .from('merchants')
        .upsert(dbMerchants);

      if (error) throw error;
    } catch (error) {
      console.error('Error saving merchants:', error);
      throw error;
    }
  }

  async getTransactions(): Promise<Transaction[]> {
    try {
      const { data: transactions, error } = await this.supabase
        .from('transactions')
        .select(`
          *,
          payment_methods!inner(
            id,
            name,
            type,
            issuer,
            currency,
            icon,
            color,
            image_url,
            last_four_digits,
            active,
            reward_rules,
            selected_categories,
            statement_start_day,
            is_monthly_statement,
            conversion_rate
          ),
          merchants!inner(
            id,
            name,
            address,
            mcc,
            is_online,
            coordinates,
            is_deleted,
            created_at,
            deleted_at
          )
        `)
        .eq('is_deleted', false)
        .order('date', { ascending: false });

      if (error) throw error;

      return transactions.map(tx => ({
        id: tx.id,
        date: tx.date,
        merchant: {
          id: tx.merchants.id,
          name: tx.merchants.name,
          address: tx.merchants.address || '',
          mcc: tx.merchants.mcc ? {
            code: tx.merchants.mcc.code,
            description: tx.merchants.mcc.description
          } : undefined,
          isOnline: tx.merchants.is_online || false,
          coordinates: tx.merchants.coordinates
        },
        amount: parseFloat(tx.amount),
        currency: tx.currency as any,
        paymentMethod: {
          id: tx.payment_methods.id,
          name: tx.payment_methods.name,
          type: tx.payment_methods.type as any,
          issuer: tx.payment_methods.issuer || '',
          lastFourDigits: tx.payment_methods.last_four_digits,
          currency: tx.payment_methods.currency as any,
          icon: tx.payment_methods.icon,
          color: tx.payment_methods.color,
          imageUrl: tx.payment_methods.image_url,
          pointsCurrency: tx.payment_methods.points_currency,
          active: tx.payment_methods.active,
          rewardRules: tx.payment_methods.reward_rules,
          selectedCategories: tx.payment_methods.selected_categories,
          statementStartDay: tx.payment_methods.statement_start_day,
          isMonthlyStatement: tx.payment_methods.is_monthly_statement,
          conversionRate: tx.payment_methods.conversion_rate
        },
        paymentAmount: parseFloat(tx.payment_amount || tx.amount),
        paymentCurrency: (tx.payment_currency || tx.currency) as any,
        rewardPoints: tx.total_points || 0,
        basePoints: tx.base_points || 0,
        bonusPoints: tx.bonus_points || 0,
        isContactless: tx.is_contactless || false,
        notes: tx.notes,
        reimbursementAmount: tx.reimbursement_amount ? parseFloat(tx.reimbursement_amount) : undefined,
        category: tx.category
      }));
    } catch (error) {
      console.error('Error fetching transactions:', error);
      throw error;
    }
  }

  async addTransaction(transaction: Omit<Transaction, 'id'>): Promise<Transaction> {
    try {
      const newTransaction: Transaction = {
        id: crypto.randomUUID(),
        ...transaction,
      };

      const dbTransaction = {
        id: newTransaction.id,
        date: newTransaction.date,
        merchant_id: newTransaction.merchant.id,
        amount: newTransaction.amount.toString(),
        currency: newTransaction.currency,
        payment_method_id: newTransaction.paymentMethod.id,
        payment_amount: newTransaction.paymentAmount.toString(),
        payment_currency: newTransaction.paymentCurrency,
        total_points: newTransaction.rewardPoints,
        base_points: newTransaction.basePoints,
        bonus_points: newTransaction.bonusPoints,
        is_contactless: newTransaction.isContactless,
        notes: newTransaction.notes,
        reimbursement_amount: newTransaction.reimbursementAmount?.toString(),
        category: newTransaction.category,
        is_deleted: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { error } = await this.supabase
        .from('transactions')
        .insert([dbTransaction]);

      if (error) throw error;

      return newTransaction;
    } catch (error) {
      console.error('Error adding transaction:', error);
      throw error;
    }
  }

  async updateTransaction(id: string, transactionData: Partial<Omit<Transaction, 'id'>>): Promise<Transaction> {
    try {
      const dbTransaction: any = {};
      
      if (transactionData.merchant?.id) dbTransaction.merchant_id = transactionData.merchant.id;
      if (transactionData.amount !== undefined) dbTransaction.amount = transactionData.amount.toString();
      if (transactionData.currency) dbTransaction.currency = transactionData.currency;
      if (transactionData.paymentMethod?.id) dbTransaction.payment_method_id = transactionData.paymentMethod.id;
      if (transactionData.paymentAmount !== undefined) dbTransaction.payment_amount = transactionData.paymentAmount.toString();
      if (transactionData.paymentCurrency) dbTransaction.payment_currency = transactionData.paymentCurrency;
      if (transactionData.rewardPoints !== undefined) dbTransaction.total_points = transactionData.rewardPoints;
      if (transactionData.basePoints !== undefined) dbTransaction.base_points = transactionData.basePoints;
      if (transactionData.bonusPoints !== undefined) dbTransaction.bonus_points = transactionData.bonusPoints;
      if (transactionData.isContactless !== undefined) dbTransaction.is_contactless = transactionData.isContactless;
      if (transactionData.notes !== undefined) dbTransaction.notes = transactionData.notes;
      if (transactionData.reimbursementAmount !== undefined) dbTransaction.reimbursement_amount = transactionData.reimbursementAmount?.toString();
      if (transactionData.category !== undefined) dbTransaction.category = transactionData.category;
      
      dbTransaction.updated_at = new Date().toISOString();

      const { error } = await this.supabase
        .from('transactions')
        .update(dbTransaction)
        .eq('id', id);

      if (error) throw error;

      // Return the updated transaction by fetching it
      const { data: updatedTx, error: fetchError } = await this.supabase
        .from('transactions')
        .select(`
          *,
          payment_methods!inner(*),
          merchants!inner(*)
        `)
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      return {
        id: updatedTx.id,
        date: updatedTx.date,
        merchant: {
          id: updatedTx.merchants.id,
          name: updatedTx.merchants.name,
          address: updatedTx.merchants.address || '',
          mcc: updatedTx.merchants.mcc,
          isOnline: updatedTx.merchants.is_online || false,
          coordinates: updatedTx.merchants.coordinates
        },
        amount: parseFloat(updatedTx.amount),
        currency: updatedTx.currency as any,
        paymentMethod: {
          id: updatedTx.payment_methods.id,
          name: updatedTx.payment_methods.name,
          type: updatedTx.payment_methods.type as any,
          issuer: updatedTx.payment_methods.issuer || '',
          lastFourDigits: updatedTx.payment_methods.last_four_digits,
          currency: updatedTx.payment_methods.currency as any,
          icon: updatedTx.payment_methods.icon,
          color: updatedTx.payment_methods.color,
          imageUrl: updatedTx.payment_methods.image_url,
          pointsCurrency: updatedTx.payment_methods.points_currency,
          active: updatedTx.payment_methods.active,
          rewardRules: updatedTx.payment_methods.reward_rules,
          selectedCategories: updatedTx.payment_methods.selected_categories,
          statementStartDay: updatedTx.payment_methods.statement_start_day,
          isMonthlyStatement: updatedTx.payment_methods.is_monthly_statement,
          conversionRate: updatedTx.payment_methods.conversion_rate
        },
        paymentAmount: parseFloat(updatedTx.payment_amount),
        paymentCurrency: updatedTx.payment_currency as any,
        rewardPoints: updatedTx.total_points || 0,
        basePoints: updatedTx.base_points || 0,
        bonusPoints: updatedTx.bonus_points || 0,
        isContactless: updatedTx.is_contactless || false,
        notes: updatedTx.notes,
        reimbursementAmount: updatedTx.reimbursement_amount ? parseFloat(updatedTx.reimbursement_amount) : undefined,
        category: updatedTx.category
      };
    } catch (error) {
      console.error('Error updating transaction:', error);
      throw error;
    }
  }

  async deleteTransaction(id: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('transactions')
        .update({ is_deleted: true, deleted_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting transaction:', error);
      return false;
    }
  }

  async exportTransactionsToCSV(transactions: Transaction[]): Promise<string> {
    const headers = [
      'Date',
      'Merchant',
      'Amount',
      'Currency',
      'Payment Method',
      'Category',
      'Points',
      'Notes'
    ];

    const csvRows = [
      headers.join(','),
      ...transactions.map(tx => [
        tx.date,
        `"${tx.merchant.name}"`,
        tx.amount,
        tx.currency,
        `"${tx.paymentMethod.name}"`,
        `"${tx.category || 'Uncategorized'}"`,
        tx.rewardPoints,
        `"${tx.notes || ''}"`
      ].join(','))
    ];

    return csvRows.join('\n');
  }
}

// Create and export the singleton instance
import { supabase } from '@/integrations/supabase/client';
export const storageService = new StorageService(supabase);
